-- PostgREST auth functions and RLS policies
-- Applied after schema.sql

-- Extension for JWT signing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Anonymous role for public access
DO $$ BEGIN
  CREATE ROLE anon;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- AUTH FUNCTIONS (called via POST /rpc/function_name)
-- ============================================================

-- Send a verification code to an email
CREATE OR REPLACE FUNCTION send_code(p_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_code TEXT;
  v_now INTEGER;
BEGIN
  v_now := EXTRACT(EPOCH FROM NOW())::INTEGER;

  -- Check if user exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email AND is_active = true;
  IF v_user_id IS NULL THEN
    RETURN json_build_object('ok', true);
  END IF;

  -- Rate limit: 60s cooldown
  IF EXISTS (SELECT 1 FROM verification_codes WHERE email = p_email AND created_at > v_now - 60) THEN
    RETURN json_build_object('ok', true);
  END IF;

  -- Generate 6-digit code
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  -- Store it
  INSERT INTO verification_codes (id, email, code, attempts, expires_at, created_at)
  VALUES (GEN_RANDOM_UUID()::TEXT, p_email, v_code, 0, v_now + 600, v_now);

  -- Dev: return code. Prod: would send via Brevo here
  RETURN json_build_object('ok', true, 'devCode', v_code, 'email', p_email);
END;
$$;

-- Verify a code and return a JWT session
CREATE OR REPLACE FUNCTION verify_code(p_email TEXT, p_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record verification_codes;
  v_user users;
  v_token TEXT;
  v_now INTEGER;
  v_header TEXT;
  v_payload TEXT;
  v_signature TEXT;
  v_secret TEXT;
BEGIN
  v_now := EXTRACT(EPOCH FROM NOW())::INTEGER;
  v_secret := 'dev-secret-do-not-use-in-prod-change-me';

  -- Find valid code
  SELECT * INTO v_record FROM verification_codes
  WHERE email = p_email AND code = p_code AND expires_at > v_now
  LIMIT 1;

  IF v_record.id IS NULL THEN
    RETURN json_build_object('error', 'Invalid or expired code');
  END IF;

  IF v_record.attempts >= 5 THEN
    DELETE FROM verification_codes WHERE id = v_record.id;
    RETURN json_build_object('error', 'Too many attempts');
  END IF;

  -- Get user
  SELECT * INTO v_user FROM users WHERE email = p_email AND is_active = true LIMIT 1;
  IF v_user.id IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  -- Delete the code
  DELETE FROM verification_codes WHERE id = v_record.id;

  -- Build JWT manually (HS256)
  v_header := ENCODE(convert_to('{"alg":"HS256","typ":"JWT"}', 'UTF8'), 'base64');
  v_header := REPLACE(REPLACE(v_header, '+', '-'), '/', '_');
  v_header := RTRIM(v_header, '=');

  v_payload := json_build_object(
    'userId', v_user.id,
    'email', v_user.email,
    'name', v_user.name,
    'role', v_user.role,
    'iat', v_now,
    'exp', v_now + 604800
  )::TEXT;

  v_payload := ENCODE(convert_to(v_payload, 'UTF8'), 'base64');
  v_payload := REPLACE(REPLACE(v_payload, '+', '-'), '/', '_');
  v_payload := RTRIM(v_payload, '=');

  v_signature := ENCODE(
    HMAC(convert_to(v_header || '.' || v_payload, 'UTF8'), convert_to(v_secret, 'UTF8'), 'SHA256'),
    'base64'
  );
  v_signature := REPLACE(REPLACE(v_signature, '+', '-'), '/', '_');
  v_signature := RTRIM(v_signature, '=');

  v_token := v_header || '.' || v_payload || '.' || v_signature;

  RETURN json_build_object('ok', true, 'token', v_token);
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- PostgREST lowercases JWT claim names: userId → request.jwt.claims.userid
-- ============================================================

-- Users: users can read their own data. Admins can read all.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users FOR SELECT
  USING (
    id = current_setting('request.jwt.claims.userid', true)::TEXT
    OR current_setting('request.jwt.claims.role', true) = 'admin'
  );

-- Schedules: users can CRUD their own. Anon can read (booking page).
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS schedules_select ON schedules;
CREATE POLICY schedules_select ON schedules FOR SELECT USING (true);
DROP POLICY IF EXISTS schedules_insert ON schedules;
CREATE POLICY schedules_insert ON schedules FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);
DROP POLICY IF EXISTS schedules_update ON schedules;
CREATE POLICY schedules_update ON schedules FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);
DROP POLICY IF EXISTS schedules_delete ON schedules;
CREATE POLICY schedules_delete ON schedules FOR DELETE
  USING (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);

-- Event types: same pattern
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS event_types_select ON event_types;
CREATE POLICY event_types_select ON event_types FOR SELECT USING (true);
DROP POLICY IF EXISTS event_types_insert ON event_types;
CREATE POLICY event_types_insert ON event_types FOR INSERT
  WITH CHECK (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);
DROP POLICY IF EXISTS event_types_update ON event_types;
CREATE POLICY event_types_update ON event_types FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);
DROP POLICY IF EXISTS event_types_delete ON event_types;
CREATE POLICY event_types_delete ON event_types FOR DELETE
  USING (user_id = current_setting('request.jwt.claims.userid', true)::TEXT);

-- Bookings: public can create (booking flow). Hosts can read their own.
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bookings_select ON bookings;
CREATE POLICY bookings_select ON bookings FOR SELECT
  USING (
    client_id = current_setting('request.jwt.claims.userid', true)::TEXT
    OR event_type_id IN (SELECT id FROM event_types WHERE user_id = current_setting('request.jwt.claims.userid', true)::TEXT)
    OR current_setting('request.jwt.claims.role', true) = 'admin'
  );
DROP POLICY IF EXISTS bookings_insert ON bookings;
CREATE POLICY bookings_insert ON bookings FOR INSERT
  WITH CHECK (true);  -- anyone can create a booking

-- Clients: auto-created during booking, mostly public
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clients_select ON clients;
CREATE POLICY clients_select ON clients FOR SELECT
  USING (
    id = current_setting('request.jwt.claims.userid', true)::TEXT
    OR current_setting('request.jwt.claims.role', true) IN ('host', 'admin')
  );
DROP POLICY IF EXISTS clients_insert ON clients;
CREATE POLICY clients_insert ON clients FOR INSERT
  WITH CHECK (true);

-- Grant access to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON FUNCTION send_code TO anon;
GRANT EXECUTE ON FUNCTION verify_code TO anon;
