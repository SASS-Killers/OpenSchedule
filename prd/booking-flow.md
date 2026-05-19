# PRD Section 4: Booking Flow, Conflict Resolution, & Client Auto-Signup

The scheduling core must compute slot availabilities dynamically at the Edge, ensuring clients only see true, conflict-free meeting options.

---

## 1. Public Booking Routing

Clients access the scheduling interface via clean, simple URLs:
* `/[host-slug]` - The Host Directory page, showing all active event types configured by that Host.
* `/[host-slug]/[event-slug]` - The interactive dynamic calendar picker for a specific meeting duration and configuration.

---

## 2. Dynamic Time Slot Generation (Conflict Prevention)

When a Client loads the calendar page and selects a Date `D` (in their local timezone `TZ_client`), the backend performs the following real-time resolution:

### Step 1: Base Availability Resolution

The system supports **five types of availability signals**, resolved in priority order:

| Priority | Signal Type | Source Table | Example |
| :--- | :--- | :--- | :--- |
| 1 (Highest) | **Full-day block** | `date_overrides` | "Vacation June 1–15" → removes ALL slots |
| 2 | **Date-specific custom hours** | `date_overrides` | "WFH Apr 20, available 10am–4pm" → replaces normal schedule |
| 3 | **Date-specific window block** | `date_overrides` | "Dentist June 10, 2–3pm" → carves hole in normal schedule |
| 4 | **Recurring custom hours** | `recurring_exceptions` | "Summer hours Mon–Thu 8–4" → replaces schedule on matching days |
| 5 (Lowest) | **Recurring window block** | `recurring_exceptions` | "Team standup every Tue 10–11am" → carves weekly hole |

Execution order:

1. Fetch the selected Date `D` context relative to the Host's timezone (`TZ_host`).
2. Query `date_overrides` in D1 for the Host covering Date `D` (using `start_date <= D AND end_date >= D`):
   * **If any `full_day_block` exists**: Mark the whole day as completely unavailable. Return early.
   * **If `custom_hours` override exists**: Use the custom `[start_time, end_time]` as the day's base blocks.
   * **Otherwise**: Retrieve default operating slots from `schedules` matching `day_of_week` (0-6) for Date `D`.
3. Query `recurring_exceptions` in D1 for the Host matching `day_of_week` of Date `D` (within any date bounds):
   * **Recurring custom hours**: Applied to the base schedule if no date-specific `custom_hours` already covers that time.
4. **Carve out window blocks**: Collect all `window_block` entries (both date-specific and recurring), then punch them out of the current available blocks. This creates split shifts automatically (e.g., block 2–3pm splits a 9–5 block into 9–2 and 3–5).

### Step 2: Slicing Potential Intervals
Slice the remaining available start/end times into discrete intervals spaced by the event's `duration` (e.g. 30 minutes). If split shifts exist (e.g., lunch break block or a window block created a gap), slice around them.

### Step 3: Fetching Conflicts (Busy Windows)
1. **Internal Conflicts (D1)**: Query `bookings` in D1 matching the Host ID, where the booking state is `confirmed` and overlaps with Date `D`.
2. **External Conflicts (Google Calendar)**:
   * Retrieve the Host’s encrypted Google OAuth refresh token.
   * Exchange it for a fresh access token.
   * Call the **Google Calendar `freeBusy` API** for the start and end of Date `D`. This returns an array of absolute UTC `[start, end]` ranges when the Host is busy on their personal calendar.

### Step 4: Merging and Filtering
1. **Apply Buffers**: For each active block (internal or external), inflate the blocked window: `[start_time - buffer_before, end_time + buffer_after]`.
2. **Notice Boundary**: Remove any potential slots where the start time is earlier than `current_time + minimum_notice` (e.g., preventing same-day bookings within 4 hours).
3. **Difference Operation**: Remove any sliced intervals that overlap with any padded blocked windows.
4. **Timezone Shift**: Convert the remaining valid slots to the client's local timezone (`TZ_client`) and render them.

---

## 3. Client Auto-Signup Logic

To avoid forcing clients to create passwords or perform dedicated registration loops:
1. When submitting a booking, the Client inputs: **Full Name**, **Email**, and **Notes**.
2. The server-side booking handler immediately searches D1 for the Client's email:
   ```sql
   SELECT id FROM clients WHERE email = ?;
   ```
3. **If Client is found**: Associate the new booking with the existing `client_id`.
4. **If Client is NOT found**:
   * Insert a new record into `clients`: `id` (UUID), `name`, `email`, and `created_at`.
   * Associate the new booking with the newly generated `client_id`.
5. This allows Hosts to click a client's profile in their dashboard and review their full meeting history instantly.

---

## 4. Double-Booking Race Condition Protection

To prevent two clients from booking the exact same slot simultaneously:
1. Immediately upon clicking "Confirm Booking" and before writing to D1, the API runs a rapid re-verification.
2. It re-checks internal D1 bookings and does an atomic Google `freeBusy` call specifically for the selected slot `[selected_start, selected_end]`.
3. If a conflict is discovered, it terminates the write operation and alerts the client: "This slot is no longer available. Please select another time."

---

## 5. Exception Conflict Detection (Creating Overrides)

When a Host creates or modifies an availability override (vacation, window block, etc.), the system must detect whether that exception invalidates **existing confirmed bookings**:

```
FUNCTION detect_booking_conflicts(host_id, exception_start, exception_end):
    affected_bookings = SELECT * FROM bookings b
        JOIN event_types e ON b.event_type_id = e.id
        WHERE e.user_id = host_id
          AND b.status = 'confirmed'
          AND b.start_time >= exception_start
          AND b.end_time <= exception_end

    conflicts = []
    FOR booking IN affected_bookings:
        available_slots = compute_available_slots(
            host_id, booking.event_type_id, DATE(booking.start_time))
        
        IF booking.start_time NOT IN available_slots:
            conflicts.APPEND({
                booking_id: booking.id,
                client_name: GET client.name WHERE id = booking.client_id,
                start_time: booking.start_time,
                event_title: GET event_type.title WHERE id = booking.event_type_id
            })
    
    RETURN conflicts
```

**Resolution Options (Host Chooses)**:

| Option | Action | Client Experience |
| :--- | :--- | :--- |
| **Proceed & Notify** | Saves exception, sends conflict alerts | Client receives reschedule prompt |
| **Auto-Cancel** | Saves exception, cancels conflicting bookings | Client receives cancellation email |
| **Abort** | Does not create exception | No change |

The API returns HTTP 409 with conflict details when conflicts are detected, and the Host dashboard shows a visual warning before confirming the exception.

---

Confirmations must include standard-compliant calendar additions so clients can sync with native apps (Apple Calendar, Outlook, Thunderbird):
* **Format**: The server-side endpoints dynamically construct a standard **iCalendar (RFC 5545)** text stream.
* **Fields**:
  * `BEGIN:VCALENDAR` / `VERSION:2.0`
  * `UID`: The database `booking_id` @ your domain.
  * `SUMMARY`: `[Event Title] with [Host Name]`
  * `DTSTART` / `DTEND`: Configured absolute UTC timestamps.
  * `DESCRIPTION`: Meeting instructions and Client notes.
  * `ORGANIZER`: Host Email.
  * `ATTENDEE`: Client Email.
* **Delivery**: Served via a dedicated endpoint `/[host]/bookings/[booking-id]/download-ics` as a downloadable attachment file (Content-Type: `text/calendar; charset=utf-8`). The file link is also embedded directly in the confirmation email.

---

## 6. OAuth Token Auto-Refresh Sequence

External APIs (Google Calendar) provide short-lived `access_token` attributes that expire every 60 minutes. To prevent silent integration sync failures:
1. Every time the booking engine performs a `freeBusy` API scan or schedules an appointment, the system compares the current time against the connection's `expires_at` Unix timestamp in D1.
2. **If Expired (or within 5 minutes of expiration)**:
   * The server executes a background HTTP `POST` to Google's OAuth endpoint: `https://oauth2.googleapis.com/token`.
   * Passes the securely stored, decrypted `refresh_token` and client ID credentials.
   * Retrieves a new `access_token` and lifetime.
   * Updates the `oauth_connections` row in D1 immediately before carrying out the calendar operation.
3. This sequence operates transparently at the edge in a fraction of a second, keeping integration channels alive indefinitely.

---

## 7. Frictionless Secure Client Cancellation

To permit Clients to reschedule or cancel a booking without requiring them to log in or remember credentials, the system incorporates a **Secure Cancellation Token** mechanism:
1. Every booking generated in D1 includes a uniquely generated cryptographically secure, random UUID stored in the `cancellation_token` column on the `bookings` table.
2. The booking confirmation email contains a secure, direct link:
   `https://openschedule.pages.dev/cancel/[cancellation_token]`
3. When clicked, the server queries D1 for the matching `cancellation_token`:
   * **If token is found and booking status is active**: Marks the booking as `cancelled`, updates the host's connected calendar (via Google API event deletion), writes the cancellation email trigger to the telemetry log, and sends confirmations to both parties.
   * **If not found**: Renders a 404 or invalid token warning.
4. This ensures total security against booking hijacks while maintaining zero friction for Clients.

---

## 8. Client-Side Timezone Resolution & UTC Synchronization

To eliminate timezone errors:
1. The public calendar picker (hydrated React island) automatically detects the Client's timezone using browser native capabilities:
   `Intl.DateTimeFormat().resolvedOptions().timeZone`
2. Displays all free slot intervals translated dynamically into the Client's local timezone.
3. When the Client confirms a slot, the React picker transmits the chosen slot's start and end times to the backend as **absolute UTC timestamps (Unix Epoch Milliseconds or seconds)**.
4. D1 writes and compares these timestamps strictly as absolute UTC values, preventing server-level system time drift.

