-- OpenSchedule Database Schema
-- Applied via: bun run src/scripts/apply-schema.ts

-- Users (Hosts & Admins)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'host' CHECK (role IN ('admin', 'host')),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at INTEGER NOT NULL
);

-- One-time verification codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- Clients (auto-registered during booking)
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

-- Weekly availability schedules
CREATE TABLE IF NOT EXISTS schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

-- Event types (meeting configurations)
CREATE TABLE IF NOT EXISTS event_types (
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

-- Bookings (reservations)
CREATE TABLE IF NOT EXISTS bookings (
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

-- Date-specific availability overrides (vacations, custom hours, window blocks)
CREATE TABLE IF NOT EXISTS date_overrides (
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

-- Recurring availability exceptions (weekly patterns)
CREATE TABLE IF NOT EXISTS recurring_exceptions (
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

-- Email telemetry log
CREATE TABLE IF NOT EXISTS sent_emails_log (
  id TEXT PRIMARY KEY,
  email_type TEXT NOT NULL CHECK (email_type IN ('otp', 'confirmation', 'reminder', 'cancellation')),
  recipient TEXT NOT NULL,
  sent_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_slug ON users(slug);
CREATE INDEX IF NOT EXISTS idx_schedules_user ON schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_event_types_user ON event_types(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_bookings_event_time ON bookings(event_type_id, start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_cancel ON bookings(cancellation_token);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_date_overrides_lookup ON date_overrides(user_id, start_date, end_date, exception_type);
CREATE INDEX IF NOT EXISTS idx_recurring_exceptions_lookup ON recurring_exceptions(user_id, day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_sent_emails_log_sent ON sent_emails_log(sent_at);
