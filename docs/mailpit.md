# Developer Setup — Mailpit for Local Email

[Mailpit](https://mailpit.axllent.org) is a fake SMTP server for local development. It catches emails sent from your dev environment and provides a browser UI to inspect them — magic links, OTP codes, password resets, and transactional templates. No real sending, zero rate limits.

---

## Quick Start (Docker)

```bash
docker run -d \
  --name mailpit \
  -p 1025:1025 \
  -p 8025:8025 \
  axllent/mailpit
```

## Quick Start (macOS)

```bash
brew install mailpit
mailpit
```

## Quick Start (Linux Binary)

Download from [Mailpit Releases](https://github.com/axllent/mailpit/releases).

---

## SMTP Settings

Add to your `.env` for local dev:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
```

## Web UI

Open **http://localhost:8025** in your browser. You'll see:

- Email contents with HTML rendering
- Magic links and OTP codes
- Email headers and source
- Attachments

## Dev/Prod Switching Pattern

```ts
const isDev = process.env.NODE_ENV === "development";

const smtp = isDev
  ? {
      host: "localhost",
      port: 1025,
    }
  : {
      host: "smtp.resend.com",
      port: 587,
    };
```

## Useful For

- Testing passwordless OTP login flow
- Verifying booking confirmation emails
- Checking cancellation emails
- Previewing `.ics` calendar attachments
- Testing email templates without hitting rate limits
