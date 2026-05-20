# OpenSchedule

<p align="center">
  <img src="public/images/sass-killers.png" alt="SASS Killers Logo" width="200" />
</p>

**A 100% free, self-hosted, multi-user scheduling platform — a complete Calendly replacement.**

No subscriptions, no monthly fees, no data leaving your control. Just PostgreSQL and a few serverless functions running on the free tier.

[Get Started](https://github.com/SASS-Killers/OpenSchedule#quick-start) · [Report a Bug](https://github.com/SASS-Killers/OpenSchedule/issues) · [Contribute](https://github.com/SASS-Killers/OpenSchedule/pulls)

---

## Features

- **Free Forever** — No paid tiers, no hidden costs. Runs entirely on free-tier Neon (PostgreSQL), Cloudflare Pages, and Brevo.
- **Self-Hosted** — Your data on your infrastructure. No third-party scheduling services processing your clients' information.
- **Multi-User** — Admin provisions hosts. Hosts configure their availability. Clients book meetings. All in one system.
- **Passwordless Auth** — Secure OTP codes via email. No passwords to manage or leak.
- **Smart Scheduling** — Configurable weekly hours, date-specific overrides, buffer times, and minimum notice.
- **Double-Booking Protection** — Real-time conflict detection. No external calendar API required.
- **Client Auto-Registration** — Clients are registered automatically on first booking. No signup forms.
- **Role-Based Access** — Admin and Host roles with appropriate permissions.
- **Responsive** — Desktop and mobile friendly.

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

### Deploy on a Free VPS

One-command deploy on any Ubuntu/Debian VPS:

```bash
curl -fsSL https://raw.githubusercontent.com/SASS-Killers/OpenSchedule/main/scripts/deploy.sh | bash
```

Works on free tiers from **Oracle Cloud**, **Google Cloud**, **AWS**, **Azure**, and **VPSWala** — see the [self-hosting guide](./prd/self-hosting.md) for details and step-by-step instructions.

### Create an Admin Account

After setup, hit `/api/setup` to create the initial admin account. Then navigate to `/login` and enter the admin email to receive a one-time code.

## Project Structure

```
open-calendar/
├── prd/                 # Product requirements documentation
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
