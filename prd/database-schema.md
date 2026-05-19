# PRD Section 5: Database Schema Design (SQLite / D1)

OpenSchedule uses **Cloudflare D1**, which runs on a serverless SQLite engine. The schema utilizes SQLite-compliant data types (`TEXT` for strings/UUIDs/dates, `INTEGER` for timestamps/booleans, and `REAL` for floating points). 

To ensure high data integrity, ease of queries, and protection against anomalies, the database schema is strictly designed to satisfy **Third Normal Form (3NF)**.

---

## 1. Normalization Strategy & Relational Integrity

* **First Normal Form (1NF)**: Every table has a primary key (`id` as a UUID TEXT), all attributes contain atomic values, and there are no repeating groups or comma-separated lists (e.g., split shifts or multi-value entries are normalized into individual rows).
* **Second Normal Form (2NF)**: Meets 1NF, and all non-key columns depend entirely on the primary key. Since all tables use a single-column primary key (`id`), there are zero partial key dependencies.
* **Third Normal Form (3NF)**: Meets 2NF, and no non-key column is transitively dependent on the primary key. For example:
  * The `bookings` table does *not* contain Host (`users`) details or Client details directly. It references `event_type_id` and `client_id` via foreign keys.
  * Host details are traversed dynamically via `bookings` -> `event_types` -> `users`.
  * Client details are traversed via `bookings` -> `clients`.
  * This eliminates data redundancy and prevents update anomalies.
* **Referential Integrity (Foreign Keys)**: All relationships explicitly configure `ON DELETE CASCADE` or `ON DELETE RESTRICT` actions to ensure orphan records are never left in the D1 database.

---

## 2. Table Definitions

### Table: `users` (Hosts & Admins)
Represents the system users: the Admin and all provisioned Hosts.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  email: "TEXT" (Unique, Not Null),
  name: "TEXT" (Not Null),
  role: "TEXT" (Not Null - 'admin' | 'host'),
  timezone: "TEXT" (Not Null - e.g., 'America/New_York'),
  avatar_url: "TEXT",
  is_active: "INTEGER" (Not Null, Boolean: 0 | 1, Default: 1),
  created_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

### Table: `clients`
Represents client accounts auto-provisioned during booking.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  email: "TEXT" (Unique, Not Null),
  name: "TEXT" (Not Null),
  created_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

### Table: `verification_codes` (OTP Verification)
One-time codes generated for passwordless logins. Wiped immediately on verification.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  email: "TEXT" (Not Null),
  code: "TEXT" (Not Null - 6-digit string),
  attempts: "INTEGER" (Not Null, Default: 0),
  expires_at: "INTEGER" (Not Null, Unix Timestamp),
  created_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

### Table: `schedules` (Default Weekly Hours)
Defines default weekly availability blocks for Hosts. Multiple shifts per day are supported as separate rows (e.g. a morning shift and an afternoon shift for the same day), satisfying 1NF.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their schedules.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  user_id: "TEXT" (Not Null, Foreign Key -> users.id, ON DELETE CASCADE),
  day_of_week: "INTEGER" (Not Null, 0 to 6, 0 = Sunday),
  start_time: "TEXT" (Not Null - 24hr format "HH:MM", e.g., "09:00"),
  end_time: "TEXT" (Not Null - 24hr format "HH:MM", e.g., "17:00")
}
```

### Table: `date_overrides` (Availability Exceptions)
Defines dates where default weekly schedules are overridden (e.g. holidays, vacations, dentist appointments, or custom working hours). Supports three exception types via the `exception_type` column.

* **Multi-day ranges**: The `start_date` / `end_date` pair supports single-day and multi-day exceptions (e.g., a two-week vacation) in one row, avoiding 14 individual records.
* **Partial-day blocks**: `exception_type = 'window_block'` punches a hole in the Host's normal schedule without replacing it (e.g., "dentist 2–3pm, available rest of day").
* **Custom hours**: `exception_type = 'custom_hours'` replaces the default schedule entirely for that date range (e.g., "working from home 10am–4pm").
* **Full-day blocks**: `exception_type = 'full_day_block'` removes all availability for the entire date range. `start_time` and `end_time` must be null.
* **Conflict detection**: Creating an exception that overlaps existing confirmed bookings triggers a conflict warning to the Host.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their overrides.

```typescript
{
  id: "TEXT" (Primary Key - UUID),
  user_id: "TEXT" (Not Null, Foreign Key -> users.id, ON DELETE CASCADE),
  
  // Date range (single day: start_date == end_date)
  start_date: "TEXT" (Not Null, ISO string format "YYYY-MM-DD"),
  end_date: "TEXT" (Not Null, ISO string format "YYYY-MM-DD"),
  
  // Exception type determines semantics of start_time/end_time
  exception_type: "TEXT" (Not Null, 'full_day_block' | 'custom_hours' | 'window_block'),
  
  // Time window: required for custom_hours and window_block, must be null for full_day_block
  start_time: "TEXT" (Allows Null - "HH:MM" 24hr format),
  end_time: "TEXT" (Allows Null - "HH:MM" 24hr format),
  
  // Human-readable label for Host dashboard calendar display
  title: "TEXT" (Allows Null - e.g., "Italy vacation", "Dentist appointment"),
  
  // Soft-delete / toggle support
  is_active: "INTEGER" (Not Null, Boolean: 0 | 1, Default: 1),
  
  created_at: "INTEGER" (Not Null, Unix Timestamp),
  updated_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

**Valid semantic combinations:**

| `exception_type` | `start_date` | `end_date` | `start_time` | `end_time` | Meaning |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `full_day_block` | 2026-06-01 | 2026-06-15 | `null` | `null` | Vacation: fully unavailable |
| `full_day_block` | 2026-06-01 | 2026-06-01 | `null` | `null` | Single sick day |
| `window_block` | 2026-06-10 | 2026-06-10 | `14:00` | `15:00` | Dentist: block 2–3pm within normal hours |
| `window_block` | 2026-07-01 | 2026-08-31 | `12:00` | `13:00` | Block lunch hour all summer |
| `custom_hours` | 2026-04-20 | 2026-04-20 | `10:00` | `16:00` | WFH day: only available 10–4 |
| `custom_hours` | 2026-07-01 | 2026-09-01 | `08:00` | `16:00` | Summer hours Jul–Sep |

### Table: `recurring_exceptions` (Repeating Availability Blocks)
Defines exceptions that repeat on a weekly schedule (e.g., "every Tuesday 10–11am team standup"). Unlike `date_overrides`, these do not require a specific date — they apply to all matching days of the week within optional date bounds.

* **Priority**: Recurring exceptions have lower priority than date-specific overrides. If a `date_overrides` entry exists for a given date, the recurring exception does not apply to that date.
* **Window block**: `exception_type = 'window_block'` punches a recurring hole in the Host's schedule (e.g., recurring weekly meeting).
* **Custom hours**: `exception_type = 'custom_hours'` replaces the normal schedule on matching days (e.g., "summer hours Monday–Thursday").
* **Date bounds**: `effective_start` / `effective_end` allow temporary recurring exceptions (e.g., "every Tuesday in June"). Null = active indefinitely until explicitly deleted or deactivated.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their recurring exceptions.

```typescript
{
  id: "TEXT" (Primary Key - UUID),
  user_id: "TEXT" (Not Null, Foreign Key -> users.id, ON DELETE CASCADE),
  
  // Weekly pattern
  day_of_week: "INTEGER" (Not Null, 0 to 6, 0 = Sunday),
  
  // Type and time window
  exception_type: "TEXT" (Not Null, 'window_block' | 'custom_hours'),
  start_time: "TEXT" (Not Null - "HH:MM" 24hr format),
  end_time: "TEXT" (Not Null - "HH:MM" 24hr format),
  
  // Optional date bounds (null = active indefinitely)
  effective_start: "TEXT" (Allows Null - "YYYY-MM-DD"),
  effective_end: "TEXT" (Allows Null - "YYYY-MM-DD"),
  
  // Display & management
  title: "TEXT" (Allows Null - e.g., "Weekly team standup"),
  is_active: "INTEGER" (Not Null, Boolean: 0 | 1, Default: 1),
  created_at: "INTEGER" (Not Null, Unix Timestamp),
  updated_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

### Table: `event_types` (Meeting Configurations)
Defined meeting formats hosted by a specific Host.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their event types.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  user_id: "TEXT" (Not Null, Foreign Key -> users.id, ON DELETE CASCADE),
  title: "TEXT" (Not Null),
  slug: "TEXT" (Not Null), // Unique combination (user_id, slug) is enforced
  description: "TEXT",
  duration: "INTEGER" (Not Null, duration in minutes),
  buffer_before: "INTEGER" (Not Null, minutes, Default: 0),
  buffer_after: "INTEGER" (Not Null, minutes, Default: 0),
  minimum_notice: "INTEGER" (Not Null, hours notice required, Default: 4),
  is_active: "INTEGER" (Not Null, Boolean: 0 | 1, Default: 1)
}
```

### Table: `bookings` (Reservations)
Individual scheduled appointments reserved by Clients.
* **FK Rules**:
  * `ON DELETE RESTRICT` on `event_type_id` and `client_id` prevents deleting an active meeting configuration or client record if booking histories are attached.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  event_type_id: "TEXT" (Not Null, Foreign Key -> event_types.id, ON DELETE RESTRICT),
  client_id: "TEXT" (Not Null, Foreign Key -> clients.id, ON DELETE RESTRICT),
  start_time: "INTEGER" (Not Null, UTC Unix Timestamp),
  end_time: "INTEGER" (Not Null, UTC Unix Timestamp),
  status: "TEXT" (Not Null - 'confirmed' | 'cancelled', Default: 'confirmed'),
  client_notes: "TEXT",
  cancellation_token: "TEXT" (Not Null, Unique - cryptographically secure UUID),
  reminder_sent: "INTEGER" (Not Null, Boolean: 0 | 1, Default: 0),
  created_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

### Table: `sent_emails_log` (Local Email Telemetry)
Tracks transactional and batch email dispatch for local telemetry, quota checking, and Admin dashboard rendering. Fully decoupled log with zero relational ties to prevent database locking during telemetry queries.
```typescript
{
  id: "TEXT" (Primary Key - UUID),
  email_type: "TEXT" (Not Null - 'otp' | 'confirmation' | 'reminder' | 'cancellation'),
  recipient: "TEXT" (Not Null),
  sent_at: "INTEGER" (Not Null, Unix Timestamp)
}
```

---

## 3. Relational Constraints & Database Safeguards

To prevent corrupted records or invalid schema states:
1. **Compound Unique Key on `event_types`**:
   An index constraint enforces uniqueness on `(user_id, slug)`. This permits multiple Hosts to have an event type named `coffee-chat` (e.g. `/john/coffee-chat` and `/sarah/coffee-chat`), but prevents a single Host from creating duplicate slugs.
2. **Weekly Hours Overlap Constraints**:
   A database-level or application-level validator guarantees that multiple shifts for the same day (e.g., Monday 09:00-12:00 and Monday 11:00-14:00) do not overlap, preserving structural sanity.

---

## 4. Indices & Optimizations

To ensure dynamic slot computation stays under **100ms** at the Edge:
1. **User Index**: Index `users.email` for authentication check speeds.
2. **Booking Search Index**: Index `bookings(event_type_id, start_time)` to quickly query busy intervals on specific dates.
3. **Date Overrides Index**: Index `date_overrides(user_id, start_date, end_date, exception_type)` for efficient lookup of all active exceptions covering a date range. This composite index avoids table scans when computing per-day slot availability.
4. **Recurring Exceptions Index**: Index `recurring_exceptions(user_id, day_of_week, is_active)` to find all recurring blocks active on a given day of the week.
5. **Client Search Index**: Index `clients.email` to speed up auto-registration operations.
6. **Sent Emails Log Index**: Index `sent_emails_log(sent_at)` for real-time telemetry lookups.
7. **Booking Cancellation Index**: Index `bookings.cancellation_token` to make client cancellation lookups instantaneous.
