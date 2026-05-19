# OpenSchedule: Product Requirements Document (PRD)

Welcome to the structured PRD for **OpenSchedule**, a 100% free, self-hosted, multi-user scheduling platform designed to fully replace Calendly.

---

## Document Map & Sections

This PRD is modularized into dedicated domain files for clarity, ease of maintenance, and structured reference. Please refer to the specific sections below:

1. **[System Design & Architecture Overview](./system-design.md)**: FAANG-format system design (use cases, capacity estimation, high-level architecture, deep dives, scaling analysis) following the same methodology as "Design Twitter" / "Design Instagram".
2. **[Software Stack & Hosting](./software-stack.md)**: Details the exclusive free-tier Cloudflare and Astro edge-based architecture.
3. **[One-Time Installation & Locking](./installation.md)**: Explains the initialization flow (`/install`) and the permanent security locking middleware.
4. **[Passwordless Authentication](./authentication.md)**: Specifies the zero-password OTP (One-Time Passcode) verification flow and session administration.
5. **[Booking Flow & Conflict Checking](./booking-flow.md)**: Outlines the real-time double-booking checking algorithm, client auto-registration, and `.ics` calendar generation.
6. **[Database Schema Design](./database-schema.md)**: Provides the relational database table layouts optimized for SQLite and Cloudflare D1.
7. **[Notifications & Cron Alerting](./notifications.md)**: Details email triggers, limits protection, and the daily automated reminders cron worker.
8. **[Automated Testing & CI/CD Strategy](./testing-and-cicd.md)**: Specifies the multi-layer test configuration (Vitest + Playwright) and automated zero-downtime GitHub Actions to Cloudflare deployment pipelines.
9. **[Coding Standards & Best Practices](./coding-standards.md)**: Codifies our TypeScript strictness, solid functional programming rules, React state context/provider/hook patterns, and Drizzle/Edge optimization parameters.

---

## 🛠️ Functional Requirements Map

Click any functional requirement to jump directly to its complete architectural specification, schema, and implementation logic.

* **[FR-1] Local Setup & Service Installer**:
  * *Description*: A user-friendly local web wizard (`http://localhost:3000`) guides non-technical staff step-by-step through creating free Cloudflare and Brevo accounts, then automatically provisions the D1 database, applies Drizzle schema migrations, sets environment secrets, deploys edge cron triggers, and publishes the live site.
  * *Deep Link*: **[Local Setup & Service Installer](./installation.md)**
* **[FR-2] Passwordless OTP Authentication**:
  * *Description*: Users (Admin/Hosts) authenticate using secure 6-digit magic codes delivered via transactional emails.
  * *Deep Link*: **[OTP Auth & Session Architecture](./authentication.md)**
* **[FR-3] Role-Based Team Provisioning**:
  * *Description*: Standard public registration is disabled. The Admin exclusively provisions Host accounts via the central console.
  * *Deep Link*: **[RBAC Rules & Provisioning](./authentication.md)**
* **[FR-4] Host Availability & Override Grid**:
  * *Description*: Hosts manage default weekly shifts and date-specific blockouts (vacation, split shifts) via their profile settings.
  * *Deep Link*: **[Shift Management & Booking Engine](./booking-flow.md)**
* **[FR-5] Dynamic Double-Booking Prevention**:
  * *Description*: Real-time overlap calculations combining internal D1 reservations with Host-defined availability rules.
  * *Deep Link*: **[Conflict Resolution Algorithm](./booking-flow.md)**
* **[FR-6] Client Auto-Signup**:
  * *Description*: Booking a meeting automatically registers Clients in D1, linking their chronological meeting history without requiring login credentials.
  * *Deep Link*: **[Client Auto-Registration Logic](./booking-flow.md)**
* **[FR-7] Frictionless Add-to-Calendar (.ics) Generation**:
  * *Description*: Generates standard RFC 5545 iCalendar stream files attached to booking confirmations for one-click Apple/Outlook sync.
  * *Deep Link*: **[ICS Builder Specifications](./booking-flow.md)**
* **[FR-8] Daily Automated Reminders (Cron Job)**:
  * *Description*: Triggers at `08:00 UTC` daily to find upcoming meetings within 12-36 hours and email Clients automatic reminders.
  * *Deep Link*: **[Cron Notifier Worker Logic](./notifications.md)**
* **[FR-9] In-App Email Telemetry Dashboard**:
  * *Description*: Active email usage counter displaying `Sent / 300` emails today to ensure the system remains inside Brevo's free-tier boundaries.
  * *Deep Link*: **[Email Telemetry & Quota Widget](./notifications.md)**

---

## ⚡ Non-Functional Requirements Map

Click any non-functional constraint to inspect the corresponding engineering strategy and platform parameters.

* **[NFR-1] Sub-Second Load & Render Speeds**:
  * *Constraint*: Public booking calendars must load in under **1 second** on mobile edge environments.
  * *Engineering Solution*: Utilizing **Astro Islands architecture** to compile zero-JS static wrappers and hydration ONLY for the interactive date picker.
  * *Deep Link*: **[Software Stack Details](./software-stack.md)**
* **[NFR-2] Zero-Cost Run Architecture**:
  * *Constraint*: Platform must operate with $0 monthly operational fees up to 1,000 monthly active users.
  * *Engineering Solution*: Built completely upon free quotas of Cloudflare Pages/D1 (5M reads/day), Brevo (300 emails/day), and GitHub Actions.
  * *Deep Link*: **[Free Tier Strategy matrix](./software-stack.md)**
* **[NFR-3] Secure Session Isolation**:
  * *Constraint*: Protect Admin and Host sessions against cross-site scripting (XSS) and token compromises.
  * *Engineering Solution*: Custom signed JWT sessions served strictly as **Secure, HttpOnly, SameSite=Lax** cookies.
  * *Deep Link*: **[Cookie Policy & Sessions](./authentication.md)**
* **[NFR-4] Third Normal Form (3NF) Relational Integrity**:
  * *Constraint*: Prevent data anomalies, redundancies, and orphans across SQLite tables.
  * *Engineering Solution*: Implemented 3NF schemas with automated `ON DELETE CASCADE` foreign-key linkages and split-shift records.
  * *Deep Link*: **[D1 SQLite Normalization Strategy](./database-schema.md)**
* **[NFR-5] Defensive Email Throttling**:
  * *Constraint*: Prevent system crashes or silent API delivery failures when hitting Brevo's 300 emails/day cap.
  * *Engineering Solution*: Automated system chunking at 80% usage and hard suspension of non-critical reminders at 95% usage.
  * *Deep Link*: **[Hard/Soft Throttling Specifications](./notifications.md)**
* **[NFR-6] Zero-Downtime Deployment Sequence**:
  * *Constraint*: Code updates must never introduce runtime schema mismatch errors.
  * *Engineering Solution*: Automated migration runners applied to remote D1 databases prior to dynamic Edge Functions live deployments.
  * *Deep Link*: **[CI/CD Execution Order](./testing-and-cicd.md)**
* **[NFR-7] Immutable & Fragment-Free State Standards**:
  * *Constraint*: Prevent state synchronization bugs, verbose action boilerplate, and messy prop drilling in complex interactive calendar UIs.
  * *Engineering Solution*: Strict TypeScript compile constraints, immutable functional data structures, absolute ban on `useReducer`/prop-drilling, and mandatory enforcement of **React Context + Provider + Custom Hook pattern** for shared state.
  * *Deep Link*: **[Coding Standards & Best Practices](./coding-standards.md)**
* **[NFR-8] Feature-Driven Kebab-Case Workspace Structure**:
  * *Constraint*: Prevent workspace code rot, casing inconsistencies, and generic "junk drawers" that complicate asset tracking.
  * *Engineering Solution*: Strictly enforce kebab-case (lowercase, hyphen-separated) naming across all files and folders. Banish generic directories like `/components`, `/utils`, or `/helpers`. Organise codebase into highly cohesive, feature-driven folders (e.g., `/installer-wizard`, `/host-dashboard`, `/shared-ui`).
  * *Deep Link*: **[Directory & Modular Architecture Standards](./coding-standards.md)**

---

## Terminology & Roles

To ensure alignment across all components, the following roles and terms are strictly defined:

* **Host**: A registered user (e.g., team member, consultant) who owns schedules, date overrides, and event types. Hosts log in to configure their weekly grids and inspect their bookings ledger.
* **Client**: An external visitor booking appointments with a Host. Clients do not log in; they register automatically upon their first booking.
* **Administrator (Admin)**: The single super-user who boots up the platform, configures universal options, and provisions Host accounts. Standard user signups are disabled.
* **Local Setup Wizard**: A specialized, first-run local web tool designed to guide non-technical users to create Cloudflare and Brevo accounts and automatically build, provision, and deploy the entire Cloudflare Pages & D1 architecture securely.
* **OTP (One-Time Passcode)**: A highly secure, short-lived 6-digit numeric login code delivered via email. Used instead of passwords.
* **Conflict Merging**: The process of cross-referencing D1 reservations against schedules and overrides before presenting free slot intervals.

---

## Project Phases & Implementation Path

1. **Phase 1: Environment & Core Setup** (Initialize Astro workspace + Drizzle ORM + D1 migrations).
2. **Phase 2: One-Time Install & Guard Middleware** (Deploy `/install` and block logic in database).
3. **Phase 3: Passwordless Auth & Session Management** (Implement OTP trigger + HTTP-only JWT sessions).
4. **Phase 4: Admin Console & Host Provisioning** (Create admin portal and Host control table).
5. **Phase 5: Host Settings & Availability Grids** (Build availability layouts and custom overrides UI).
6. **Phase 6: Engine & Real-Time Sync** (Code dynamic calendar algorithms, client auto-signup, and `.ics` constructor).
7. **Phase 7: Workers Cron & Transactional Alerting** (Verify daily alert dispatching and telemetry).
8. **Phase 8: Automated Tests & CI/CD Setup** (Establish Vitest, Playwright, and GitHub Action workflows).
