# OpenSchedule

<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-booking.png" alt="OpenSchedule" width="600" style="border-radius: 12px;" />
</p>

# OpenSchedule

**A 100% free, self-hosted, multi-user scheduling platform — a complete Calendly replacement.**

No subscriptions, no monthly fees, no data leaving your control. Just PostgreSQL and a few serverless functions running on the free tier.

<p align="center">
  <a href="https://github.com/SASS-Killers/OpenSchedule/raw/main/demo.mp4">
    <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-admin.png" alt="Click to watch the OpenSchedule demo video" width="700" style="border-radius: 12px; max-width: 100%;" />
  </a>
  <br/>
  <sub><a href="https://github.com/SASS-Killers/OpenSchedule/raw/main/demo.mp4">▶ Play demo video (3.2 MB MP4)</a></sub>
</p>

[Get Started](https://github.com/SASS-Killers/OpenSchedule#quick-start) · [Report a Bug](https://github.com/SASS-Killers/OpenSchedule/issues) · [Contribute](https://github.com/SASS-Killers/OpenSchedule/pulls)

---

## Features

### 🆓 Free Forever
No paid tiers, no hidden costs. Runs entirely on free-tier Neon (PostgreSQL), Cloudflare Pages, and Brevo.

### 🔐 Self-Hosted & Passwordless Auth
Your data on your infrastructure. No third-party scheduling services processing your clients' information. Secure OTP codes via email — no passwords to manage or leak.

<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-booking.png" alt="Public booking calendar" width="80%" style="border-radius: 8px;" />
</p>

### 👥 Multi-User & Role-Based Access
Admin provisions hosts. Hosts configure their availability. Clients book meetings. All in one system with Admin and Host roles.

<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-dashboard.png" alt="Host dashboard with settings and bookings" width="80%" style="border-radius: 8px;" />
</p>

### 📅 Smart Scheduling & Double-Booking Protection
Configurable weekly hours, date-specific overrides, buffer times, and minimum notice. Real-time conflict detection — no external calendar API required.

### 👤 Client Auto-Registration & Notifications
Clients register automatically on first booking. Confirmation emails with .ics calendar files, cancellation links, and daily reminders — all via Brevo's free tier.

### 🛠️ Admin Console & Email Telemetry
Provision host accounts, monitor email usage against Brevo's 300/day quota, and manage your deployment from a single dashboard.

<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-admin.png" alt="Admin dashboard with email telemetry" width="80%" style="border-radius: 8px;" />
</p>

### 📱 Responsive
Desktop and mobile friendly.

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Database** | [Neon](https://neon.tech) (Serverless PostgreSQL) |
| **API Layer** | [PostgREST](https://postgrest.org) (Auto-generated REST API) |
| **Framework** | [Astro](https://astro.build) + [React](https://react.dev) |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com) |
| **Email** | [Brevo](https://brevo.com) (Transactional) |
| **Auth** | OTP + JWT + PostgreSQL Row-Level Security |

## Architecture

```
Browser → Cloudflare Pages (SSR) → PostgREST → Neon PostgreSQL
                                        ↓
                                   RLS Policies
                                        ↓
                                   JWT Auth
```

One database replaces Redis, Elasticsearch, RabbitMQ, and your entire custom API layer. PostgreSQL extensions handle JSONB (NoSQL), `pg_trgm` (fuzzy search), `pgvector` (embeddings), and `SELECT ... FOR UPDATE SKIP LOCKED` (job queues).

## Quick Start

### Local Dev

```bash
git clone https://github.com/SASS-Killers/OpenSchedule.git
cd open-calendar
bun install
cp .env.example .env
# Edit .env with your Neon database connection string
psql $DATABASE_URL -f src/db/schema.sql
psql $DATABASE_URL -f src/db/rls.sql
bun run dev
```

App runs at `http://127.0.0.1:6969`. PostgREST starts automatically on port 6970.

### Deploy on Cloudflare Pages (Recommended)

```bash
bun run build
npx wrangler pages deploy dist/
```

Set `DATABASE_URL` and `JWT_SECRET` as Cloudflare Pages secrets. See the [self-hosting guide](./docs/prd/self-hosting.md) for full instructions.

### Create an Admin Account

After setup, hit `/api/setup` to create the initial admin account. Then navigate to `/login` and enter the admin email to receive a one-time code.

## Project Structure

```
open-calendar/
├── docs/                 # Developer documentation & PRD
│   └── prd/              # Product requirements
├── src/
│   ├── components/      # React components (islands)
│   ├── db/              # Schema, migrations, Neon client
│   ├── layouts/         # Astro layouts
│   ├── lib/             # Auth, PostgREST client helpers
│   ├── pages/           # Routes and API endpoints
│   │   ├── [slug]/      # Public booking pages
│   │   ├── api/         # Thin API layer (session only)
│   │   ├── hosts/       # Host settings and public profiles
│   │   └── login.astro  # Passwordless login
│   └── scripts/         # Schema application script
├── postgrest.conf       # PostgREST configuration
└── astro.config.mjs     # Astro configuration
```

## Why PostgreSQL?

> *"One battle-tested tool can cannibalize your entire architecture."*

PostgreSQL with its extension ecosystem eliminates the need for:
- **MongoDB** → `JSONB` + GIN indexes
- **Redis/RabbitMQ** → `SELECT ... FOR UPDATE SKIP LOCKED`
- **Elasticsearch** → `tsvector` + `pg_trgm`
- **Pinecone** → `pgvector` + HNSW indexes
- **Snowflake** → Materialized views
- **TimescaleDB** → BRIN indexes + partitioning
- **PostGIS** → GiST indexes

One database. One source of truth. Zero sync problems.

## License

MIT

---

<p align="center">
  <a href="https://github.com/SASS-Killers/OpenSchedule">GitHub</a> ·
  <a href="https://github.com/SASS-Killers/OpenSchedule/issues">Issues</a> ·
  <a href="https://github.com/SASS-Killers/OpenSchedule/pulls">Pull Requests</a>
</p>
