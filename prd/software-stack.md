# PRD Section 1: Software Stack & Hosting Architecture

To achieve a 100% free-tier, self-hosted, enterprise-grade scheduling platform, OpenSchedule relies entirely on **Cloudflare's serverless edge infrastructure** and **Astro**.

---

## 1. Core Technologies & Framework

### Astro (with `@astrojs/cloudflare` SSR Adapter)
* **Role**: The main application codebase, containing all page routes (UI) and backend API endpoints.
* **Why Astro?**:
  * **Islands Architecture**: Public booking pages (e.g. `/[host]/[event]`) demand sub-second rendering. Astro compiles static content to lightweight HTML at the edge, hydrates ONLY the interactive elements (like the date-time picker) in client React, and ships 0kb JS for the rest.
  * **Native Edge Performance**: Compiles seamlessly to V8 isolates (Cloudflare Pages Functions) with 0ms cold starts, unlike heavy Node.js apps.
  * **Unified Workspace**: Routes, APIs, edge locals, and frontend layouts reside in a single repository.

### React (Hydrated inside Astro Layouts)
* **Role**: Used for interactive, complex components.
* **Scope**: 
  * The dynamic, responsive weekly availability grid editor.
  * The public calendar date/time picker (client-side timezone translation).
  * The Admin portal's interactive Host management tables.

---

## 2. Infrastructure & Hosting (Cloudflare Ecosystem)

```
                                  +-----------------------+
                                  |     Client Browser    |
                                  +-----------+-----------+
                                              |
                                              | HTTPS
                                              v
                        +---------------------+---------------------+
                        |          Cloudflare Edge Network          |
                        |      (Pages SSR & Pages Functions)        |
                        +----+------------------+----------------+--+
                             |                  |                |
      Read/Write SQL Queries  |                  | Auth Email     
                  v                  v
      +-----------+-----------+  +---+---+
      |     Cloudflare D1     |  |Brevo |
      |    (SQLite Engine)    |  +-------+
```

### Cloudflare Pages
* **Role**: Static assets distribution and Edge SSR execution.
* **Free Tier Allocation**: Unlimited bandwidth, unlimited static builds, 100,000 Edge function requests/day.

### Cloudflare D1
* **Role**: The primary relational database.
* **Why D1 over PostgreSQL?**: 
  * Designed natively for the Cloudflare environment.
  * Ultra-low read latency because the database runs in proximity to the edge workers execution node.
* **Free Tier Allocation**: 5,000,000 read rows/day, 100,000 write rows/day, 10GB total storage capacity. This is easily sufficient to host thousands of active users and schedules under normal personal/team operations.

### Drizzle ORM
* **Role**: The TypeScript Object-Relational Mapper.
* **Why Drizzle?**: Extremely lightweight compile footprint, native edge support, zero runtime overhead, and direct compile-time SQL compatibility with Cloudflare D1.

---

## 3. Communication & Auxiliary APIs

### Brevo (Transactional Email)
* **Role**: Secure transactional email sending via REST API (magic login codes, booking confirmations, reminders).
* **Free Tier Allocation**: **300 emails/day**, 9,000 emails/month — **3× Resend's free tier**.

### Cloudflare Workers Cron Triggers
* **Role**: Scheduled task scheduler to kick off the daily alert notifier worker.
* **Free Tier Allocation**: Up to 3 Cron Triggers per account, utilizing standard execution limits.

---

## 4. Wrangler Edge Configuration Layout

To bind these Edge services natively under Cloudflare without Node-related runtime bottlenecks, OpenSchedule maintains a standard `wrangler.toml` (or `wrangler.json`) file in the workspace root.

* **D1 Binding**: Maps the serverless database to the edge application runtime:
  ```toml
  [[d1_databases]]
  binding = "DB"
  database_name = "openschedule-db"
  database_id = "your-d1-database-uuid"
  migrations_dir = "drizzle/migrations"
  ```
* **Compatibility Flag**: Configures compatibility variables to allow lightweight edge execution:
  ```toml
  compatibility_date = "2026-05-19"
  compatibility_flags = [ "nodejs_compat" ]
  ```
* **Variables & Secrets**: Non-sensitive settings (like `PUBLIC_APP_NAME`) are defined in standard parameters, while sensitive credentials (Brevo API Key, JWT Signing Seed) are written securely via command wrappers directly into the Cloudflare dashboard as encrypted secrets.

