# PRD Section 5: Database Schema Design (PostgreSQL)

OpenSchedule uses **Neon (serverless PostgreSQL)** as its single database. The schema is managed as a **raw SQL file** (`src/db/schema.sql`) applied via `psql` or Neon's branching workflow. No ORM.

PostgreSQL types used: `TEXT` for strings/UUIDs, `INTEGER` for Unix timestamps/numbers, `BOOLEAN` for flags, with `CHECK` constraints for enum validation.

---

## 1. Schema Management (No ORM)

* **No Drizzle / Prisma / any ORM**: PostgREST reads the schema directly and auto-generates the REST API. An ORM would be a redundant abstraction layer.
* **Raw SQL migrations**: The entire schema lives in `src/db/schema.sql`. Changes are applied via `psql $DATABASE_URL -f src/db/migrations/001_add_column.sql`.
* **Neon branching**: Before applying a migration to production, create an instant Neon branch, run the migration, verify PostgREST generates the correct endpoints, then merge.
* **Referential Integrity**: Foreign keys with `ON DELETE CASCADE` ensure orphan records are never left in the database.
* **Row-Level Security (RLS)**: Tables that contain user-specific data will have RLS policies that reference `request.jwt.claims.user_id` (set by PostgREST from the JWT token). This moves authorization into the database layer — no application code needed.

---

## 2. Table Definitions

### Table: `users` (Hosts & Admins)
Represents the system users: the Admin and all provisioned Hosts.

Each user is assigned a **cryptographic UUID slug** at creation time (e.g., `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`). This slug is used in public booking URLs (`/{slug}`) to avoid collisions from similar names and prevent host enumeration via predictable URLs.

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'host' CHECK (role IN ('admin', 'host')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL
);
```

### Table: `clients`
Represents client accounts auto-provisioned during booking.
```sql
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Table: `verification_codes` (OTP Verification)
One-time codes generated for passwordless logins. Wiped immediately on verification.
```sql
CREATE TABLE verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
```

### Table: `schedules` (Default Weekly Hours)
Defines default weekly availability blocks for Hosts. Multiple shifts per day are supported as separate rows (e.g. a morning shift and an afternoon shift for the same day).
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their schedules.
```sql
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
```

### Table: `date_overrides` (Availability Exceptions)
Defines dates where default weekly schedules are overridden (e.g. holidays, vacations, dentist appointments, or custom working hours). Supports three exception types via the `exception_type` column.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their overrides.

```sql
CREATE TABLE date_overrides (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  exception_type TEXT NOT NULL CHECK (exception_type IN ('full_day_block', 'custom_hours', 'window_block')),
  start_time TEXT,
  end_time TEXT,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
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
Defines exceptions that repeat on a weekly schedule (e.g., "every Tuesday 10–11am team standup").
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their recurring exceptions.

```sql
CREATE TABLE recurring_exceptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  exception_type TEXT NOT NULL CHECK (exception_type IN ('window_block', 'custom_hours')),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  effective_start TEXT,
  effective_end TEXT,
  title TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### Table: `event_types` (Meeting Configurations)
Defined meeting formats hosted by a specific Host.
* **FK Rule**: `ON DELETE CASCADE` ensures deleting a Host purges their event types.
```sql
CREATE TABLE event_types (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL,
  buffer_before INTEGER NOT NULL DEFAULT 0,
  buffer_after INTEGER NOT NULL DEFAULT 0,
  minimum_notice INTEGER NOT NULL DEFAULT 4,
  is_active BOOLEAN NOT NULL DEFAULT true
);
```

### Table: `bookings` (Reservations)
Individual scheduled appointments reserved by Clients.
* **FK Rules**:
  * `ON DELETE RESTRICT` on `event_type_id` and `client_id` prevents deleting an active meeting configuration or client record if booking histories are attached.
```sql
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  event_type_id TEXT NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
  client_id TEXT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  client_notes TEXT,
  cancellation_token TEXT NOT NULL UNIQUE,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at INTEGER NOT NULL
);
```

### Table: `sent_emails_log` (Local Email Telemetry)
Tracks transactional and batch email dispatch for local telemetry, quota checking, and Admin dashboard rendering. Fully decoupled log with zero relational ties to prevent database locking during telemetry queries.
```sql
CREATE TABLE sent_emails_log (
  id TEXT PRIMARY KEY,
  email_type TEXT NOT NULL CHECK (email_type IN ('otp', 'confirmation', 'reminder', 'cancellation')),
  recipient TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);
```

---

## 3. Relational Constraints & Database Safeguards

To prevent corrupted records or invalid schema states:
1. **Compound Unique Key on `event_types`**:
   An index constraint enforces uniqueness on `(user_id, slug)`. This permits multiple Hosts to have an event type named `coffee-chat` (e.g. `/john/coffee-chat` and `/sarah/coffee-chat`), but prevents a single Host from creating duplicate slugs.
2. **Weekly Hours Overlap Constraints**:
   A database-level or application-level validator guarantees that multiple shifts for the same day (e.g., Monday 09:00-12:00 and Monday 11:00-14:00) do not overlap, preserving structural sanity.

---

## 4. Row-Level Security (RLS)

PostgREST sends the JWT claims to PostgreSQL as `request.jwt.claims`. RLS policies use these to enforce access:

```sql
-- Hosts can only see their own schedules
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_schedules ON schedules
  USING (user_id = current_setting('request.jwt.claims.user_id')::TEXT);

-- Admins can see everything
CREATE POLICY admin_all ON schedules
  USING (current_setting('request.jwt.claims.role')::TEXT = 'admin');
```

---

## 5. Indices & Optimizations

To ensure dynamic slot computation stays under **100ms**:
1. **User Email Index**: Index `users(email)` for authentication check speeds.
2. **User Slug Index**: Index `users(slug)` for public booking page URL lookups. UUID-based slugs ensure O(1) lookups without host enumeration risk.
3. **Booking Search Index**: Index `bookings(event_type_id, start_time)` to quickly query busy intervals on specific dates.
4. **Date Overrides Index**: Index `date_overrides(user_id, start_date, end_date, exception_type)` for efficient lookup of all active exceptions covering a date range.
5. **Recurring Exceptions Index**: Index `recurring_exceptions(user_id, day_of_week, is_active)` to find all recurring blocks active on a given day of the week.
6. **Client Search Index**: Index `clients(email)` to speed up auto-registration operations.
7. **Sent Emails Log Index**: Index `sent_emails_log(sent_at)` for real-time telemetry lookups.
8. **Booking Cancellation Index**: Index `bookings(cancellation_token)` to make client cancellation lookups instantaneous.
