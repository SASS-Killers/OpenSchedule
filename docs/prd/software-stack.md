# PRD Section 1: Software Stack & Hosting Architecture

OpenSchedule runs on a **radically simplified stack** — one database (PostgreSQL via Neon), one auto-generated REST API (PostgREST), one edge runtime (Cloudflare Pages), one email API (Brevo). No Redis, no Elasticsearch, no message queues, no secondary databases, no hand-written API routes. PostgreSQL + PostgREST eliminates the entire middleware layer.

---

## 1. Core Technologies & Framework

### Astro (with `@astrojs/cloudflare` SSR Adapter)
* **Role**: The main application codebase, containing all page routes (UI) and backend API endpoints.
* **Why Astro?**:
  * **Islands Architecture**: Public booking pages (e.g. `/[host]/[event]`) demand sub-second rendering. Astro compiles static content to lightweight HTML at the edge, hydrates ONLY the interactive elements (like the date-time picker) in client React, and ships 0kb JS for the rest.
  * **Edge SSR**: Compiles seamlessly to V8 isolates (Cloudflare Pages Functions) with 0ms cold starts.
  * **Unified Workspace**: Routes, APIs, and frontend layouts reside in a single repository.

### React (Hydrated inside Astro Layouts)
* **Role**: Used for interactive, complex components.
* **Scope**: 
  * The dynamic, responsive weekly availability grid editor.
  * The public calendar date/time picker (client-side timezone translation).
  * The Admin portal's interactive Host management tables.

---

## 2. Infrastructure & Hosting

```
                                    +-----------------------+
                                    |     Client Browser    |
                                    +-----------+-----------+
                                                |
                                                | HTTPS
                                                v
                          +---------------------+---------------------+
                          |          Cloudflare Edge Network          |
                          |      (Pages SSR for public pages)         |
                          +----+------------------+----------------+--+
                               |                  |                |
                     REST API calls |              | Auth Email     
                               v                  v
                 +--------------+--------------+  +---+---+
                 |         PostgREST           |  |Brevo |
                 |  (auto-generated REST API   |  +-------+
                 |   from PostgreSQL schema)    |
                 +--------------+--------------+
                               |
                     SQL queries
                               v
                 +------------------------------+
                 |    Neon PostgreSQL            |
                 |  (Serverless, scale to 0)     |
                 |  + RLS policies for auth      |
                 +------------------------------+

```

### Cloudflare Pages
* **Role**: Static assets distribution and Edge SSR for public-facing pages (booking page shell, login page). All data fetching goes through PostgREST, not custom API routes.

### Neon (Serverless PostgreSQL)
* **Role**: The **single database** cannibalizing the entire stack. One PostgreSQL instance replaces Redis, Elasticsearch, RabbitMQ, MongoDB, Pinecone, and the entire custom API layer.
* **How PostgreSQL replaces everything**:

| Specialized Service | PostgreSQL Replacement | How It Works |
| :--- | :--- | :--- |
| **MongoDB / NoSQL** | `JSONB` + GIN index | Store unstructured JSON payloads in a `JSONB` column. The GIN (generalized inverted index) creates an index of every key/value pair inside the JSON — you can query deeply nested properties instantly and join JSON documents with relational tables in a single ACID transaction. |
| **Redis / RabbitMQ** (job queues) | `SELECT ... FOR UPDATE SKIP LOCKED` | A standard table acts as a job queue. Multiple workers query for pending jobs. `FOR UPDATE` locks the row so no other worker grabs it. `SKIP LOCKED` tells the database: if a row is already locked by another worker, skip it and grab the next one. Zero deadlocks, zero message broker infrastructure. |
| **Elasticsearch** (search) | `tsvector` + `tsquery` + `pg_trgm` | `tsvector` strips text down to linguistic roots (running → run), removes stop words, and enables ranked search. `pg_trgm` (trigram extension) breaks words into 3-letter chunks for fuzzy matching — a typo like "Postgress" still finds "PostgreSQL" via overlapping trigram patterns. No data synced to a secondary cluster. |
| **Pinecone** (vectors) | `pgvector` + HNSW index | Store high-dimensional embeddings (for AI features) directly next to your relational data. HNSW (hierarchical navigable small world) indexes organize vectors into a multi-layered graph for fast approximate nearest-neighbor search — in milliseconds. Query vectors AND apply relational filters in a single query. No hybrid search problem. |
| **Snowflake** (analytics) | Materialized views | Run heavy aggregations once, save the result to disk, and serve dashboards from it. `REFRESH MATERIALIZED VIEW CONCURRENTLY` recalculates in the background and hot-swaps rows without locking readers. |
| **TimescaleDB** (time-series) | BRIN index + partitioning | BRIN (block range index) stores only min/max timestamps per disk block instead of indexing every row. For sequential log inserts, it skips millions of irrelevant pages instantly. Partitioning splits data into daily/monthly chunks transparently. |
| **Mapbox / GIS** | PostGIS + GiST index | GiST (generalized search tree) draws bounding boxes around geographic shapes. Filter millions of coordinates by checking boxes first, then do precise math only on the few remaining points. Routinely outperforms standalone GIS systems. |
| **Custom API middleware** | PostgREST | Reads the schema → auto-generates REST endpoints for every table. No controllers, no routes, no boilerplate. Row-level security (RLS) replaces middleware auth checks. |

* **Why Neon?** (the hosting layer):
  * **True serverless**: Compute scales to zero when idle, wakes in ~500ms on first request. No overprovisioning.
  * **Database branching**: Instant read-write branches for staging/CI — like Git for your data. Test a risky migration against a full copy of production before touching the real thing.
  * **Free Tier**: 500 MB storage, unlimited branching, scale-to-zero compute. Sufficient for thousands of active users.
  * **Connection**: HTTP via `@neondatabase/serverless` driver — works natively from Cloudflare Workers with no TCP port restrictions.

### PostgREST (Auto-Generated REST API)
* **Role**: Replaces **all hand-written API endpoints and the ORM**. Reads the PostgreSQL schema and exposes every table as a RESTful endpoint with filtering, pagination, sorting, and cross-table embedding. Row-level security (RLS) policies in PostgreSQL control access — no middleware code, no ORM, no custom routes required.
* **How it works**:
  * Start PostgREST pointing at the Neon database. It introspects the schema and generates endpoints like `GET /users`, `POST /verification_codes`, `PATCH /schedules` automatically.
  * **Authentication**: The login page calls a PostgreSQL function (`create_session`) that verifies the OTP code and returns a JWT. That JWT is sent as `Authorization: Bearer <token>` to PostgREST. PostgreSQL RLS policies translate the JWT claims into row-level access rules (e.g., `user_id = request.jwt.claims.user_id`).
  * **No custom endpoints to write**: Adding a new table to the schema immediately exposes it via PostgREST with no boilerplate.
* **Hosting**: Runs as a lightweight Rust binary alongside the database. Can be deployed on a $5 VPS, Fly.io, or as a sidecar. No additional database required.
* **Schema management**: Raw SQL migration files in `src/db/schema.sql` applied via `psql`. Neon's branching workflow lets you test migrations risk-free before applying to production.

### Raw SQL Migrations (instead of an ORM)
* **Role**: Schema management. A single `src/db/schema.sql` file defines all tables, indexes, RLS policies, and auth functions. Applied via `psql` or Neon's web console.
* **Why raw SQL over an ORM?**:
  * **PostgREST reads the schema directly** — it doesn't need an ORM. The database schema IS the API contract.
  * **No runtime dependency**: Zero JavaScript ORM code to ship.
  * **Full PostgreSQL feature access**: RLS policies, stored procedures, triggers, extensions — everything is available without waiting for an ORM to support it.
  * **Neon branching**: Test schema changes on an instant branch before applying to production.

---

## 3. Communication & Auxiliary APIs

### Brevo (Transactional Email)
* **Role**: Secure transactional email sending via REST API (magic login codes, booking confirmations, reminders).
* **Free Tier Allocation**: 300 emails/day, 9,000 emails/month — 3× Resend's free tier.

### Cloudflare Workers Cron Triggers
* **Role**: Scheduled task scheduler to kick off the daily alert notifier worker.
* **Free Tier Allocation**: Up to 3 Cron Triggers per account, utilizing standard execution limits.

---

## 4. Environment Configuration

OpenSchedule uses a single `.env` file for database credentials and secrets. No `wrangler.toml` needed. No ORM config needed.

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/openschedule
JWT_SECRET=a-cryptographically-random-string

# PostgREST (auto-generated API):
PGRST_DB_URI=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/openschedule
PGRST_JWT_SECRET=same-as-JWT_SECRET-above

# Optional (when email is configured):
BREVO_API_KEY=your-brevo-api-key
```

* **DATABASE_URL**: The Neon PostgreSQL connection string. Provided by the Neon dashboard after creating your database.
* **JWT_SECRET**: Shared between the application and PostgREST. Used to sign session tokens and verify JWT claims in RLS policies. Generate with `openssl rand -hex 32`.
* **All secrets** are managed via `.env` in development and injected as Cloudflare Pages environment variables in production.

---

## 5. Stack Decisions Summary

| Decision | Chosen | Rationale |
| :--- | :--- | :--- |
| **Database** | Neon (PostgreSQL) | Serverless, scale-to-zero, extensions (JSONB, pgvector, pg_trgm), full ACID, RLS for auth |
| **API Layer** | PostgREST | Auto-generated REST API from DB schema. Zero custom endpoint code. RLS handles auth. |
| **ORM** | None | PostgREST reads schema directly. No ORM needed. Raw SQL for migrations. |
| **SSR / Frontend** | Astro + Cloudflare Pages | Islands architecture for sub-second mobile loads. Edge SSR with 0ms cold starts. |
| **Auth** | OTP + JWT + RLS | OTP codes via email → JWT → PostgREST uses JWT claims for row-level security |
| **Email** | Brevo | 300 emails/day free, REST API, works from Cloudflare Workers |
