# PRD Section 2: Passwordless Authentication & Session Architecture

OpenSchedule completely eliminates password-based logins, minimizing credential leaks, password fatigue, and complex recovery flows. All credentials are replaced by a **secure passwordless One-Time Passcode (OTP)** mechanism.

---

## 1. Authentication Concept (Email OTP)

No public signups are permitted. Admins and Hosts are provisioned by the database. When logging in, they trigger the passwordless code loop:

```
[Host / Admin]
   | Enter email on /login
   v
[Server-Side Endpoint]
   | Check if email exists in D1
   |-- NO  --> Return generic success message (mitigate user harvesting)
   |-- YES --> Generate secure 6-digit cryptographic OTP (e.g. 849201)
               Write code, email, and 10min expiration timestamp to `verification_codes`
               Send code to email via Brevo
   v
[Verification Screen]
   | User enters 6-digit code
   v
[Server Validation API]
   | Query D1. Check matches, expiration, and rate-limit attempt count
   |-- MATCH & VALID -> Delete OTP record, generate JWT, set cookie, redirect
   |-- INVALID       -> Increment attempts. If > 5, invalidate code and show error
```

---

## 2. Session Administration & Cookie Policy

Once verification succeeds, the user's session is handled without external third-party servers:

1. **JWT Construction**: The server constructs a JSON Web Token containing:
   * `userId`: UUID text.
   * `email`: String.
   * `name`: String.
   * `role`: `'admin'` or `'host'`.
   * `iat` / `exp`: Standard issued-at and expiration (e.g., 7 days validity).
2. **Signature**: Signed using a highly secure private variable `JWT_SECRET` injected via Cloudflare Pages environment variables.
3. **Cookie Settings**: Placed into the client's browser headers with strict, security-hardened flags:
   * `HttpOnly`: Blocked from reading via JavaScript (`document.cookie`), preventing XSS token theft.
   * `Secure`: Transmitted strictly over HTTPS.
   * `SameSite=Lax`: Standard CSRF protection while permitting natural user navigation clicks.
   * `Path=/`: Active across all subpaths.

---

## 3. RBAC (Role-Based Access Control) Rules

The routing structure in Astro will enforce the following access policies:

| Route Path | Allowed Roles | Description / Functionality |
| :--- | :--- | :--- |
| `/*` (Public Booking) | Anonymous / Public | View calendar availability, select slots, input booking forms. |
| `/login` | Anonymous / Public | Input email and verify OTP to retrieve session. |
| `/admin/*` | `admin` | Access Host provision lists, manage all Hosts, configure global settings. |
| `/host/*` | `admin`, `host` | Configure weekly hours, date overrides, edit personal bio, view booking ledger. |

*(Note: The `/install` setup wizard is compiled strictly as a local-only Node.js app inside `/installer` and is never deployed or mapped to the production Cloudflare Pages edge routing structure.)*

---

## 4. Security Mitigations

* **Brute-Force Lockout**: The D1 table tracking active codes records an `attempts` counter. If the client makes 5 incorrect code entries, the passcode is immediately wiped from D1.
* **Rapid Re-send Throttle**: A user cannot request another OTP within 60 seconds of the previous generation to prevent email spam/abuse and Brevo API exhaustion.
* **Token Invalidation**: When a user clicks "Logout", the HttpOnly cookie's expiration is immediately set to the past (`exp: 0`), deleting the token.
