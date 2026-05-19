# PRD Section 7: Automated Testing & CI/CD Strategy

To guarantee platform stability, prevent regression bugs in our dynamic booking engine, and support seamless, hands-off deployments, OpenSchedule implements a complete **Automated Testing & CI/CD Strategy** leveraging 100% free developer tools.

---

## 1. Automated Testing Strategy

The testing matrix is divided into three distinct layers to balance execution speed, isolation, and comprehensive coverage.

```
       +-------------------------------------------------------+
       |                  E2E Tests (Playwright)               |
       |  - Verifies full /install setup, lockouts, booking    |
       |    flows, and calendar interactive widgets.           |
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |             Integration Tests (Vitest + SQLite)       |
       |  - Validates D1 queries, transactional log telemetry, |
       |    and cascade behaviors using local :memory: DB.     |
       +---------------------------+---------------------------+
                                   |
       +---------------------------v---------------------------+
       |              Unit Tests (Vitest / Edge Mock)          |
       |  - Tests timezone shifts, dynamic slot slicing,       |
       |    buffer calculations, and notice constraints.        |
       +-------------------------------------------------------+
```

### 1.1 Unit Testing (Vitest)
* **Scope**: Business logic and mathematics of the scheduling engine.
* **Key Targets**:
  * Date/Time slicing helpers (e.g. converting a host's `09:00-17:00` availability into clean 15/30/60 minute intervals).
  * Timezone conversions (ensuring a client in `Europe/London` booking a host in `America/New_York` maps to the identical absolute UTC timestamp).
  * Notice constraint checks (ensuring bookings closer than the `minimum_notice` are rejected).
  * OTP generation and cryptographic verification expiration checks.
* **Tooling**: **Vitest** (extremely lightweight, native ESM support, matches Astro’s Vite configurations).

### 1.2 Integration Testing (Vitest + Local SQLite)
* **Scope**: Database read/write operations and schema relations in Cloudflare D1.
* **Key Targets**:
  * `/install` locking state transitions (verifying that inserting an admin immediately makes the setup route return redirects/403).
  * `sent_emails_log` telemetry triggers (ensuring booking triggers write logs, and soft/hard limits are accurately evaluated).
  * Referencial integrity checking (verifying that deleting a user cascades to schedules, but blocking deletion of active event types with active bookings).
* **Tooling**: Vitest executing against an in-memory SQLite database (`:memory:`) booted dynamically via Drizzle. This exactly mocks D1 behaviors locally without requiring a network connection.

### 1.3 End-to-End (E2E) Testing (Playwright)
* **Scope**: Complete user journeys and UI interactive flows.
* **Key Targets**:
  * **Admin/Host Dashboard Journey (Local Astro Server)**: Verifies host credentials verification via OTP logic and dynamic weekly grid updates on a locally-hosted production server.
  * **Booking Journey (Local Astro Server)**: Client navigates to `/[host]/[event]`, selects a slot, fills out the booking form, and verifies completion (and `.ics` downloads) without internet connectivity.
* **Tooling**: **Playwright** (runs headlessly in CI, supports cross-browser testing across Chromium, Firefox, and WebKit). External APIs (like Brevo API) are mocked at the network layer in Playwright to keep tests deterministic.

---

### 1.4 Installer-Specific Testing (Isolated Suite)

To ensure the local setup wizard remains completely bulletproof, **the installer maintains a 100% isolated testing workspace and runtime configuration**, entirely independent of the main Astro application.

* **Workspace Separation**: The installer resides in a dedicated workspace (e.g. `/installer`) with its own separate `package.json`, TypeScript configuration (`tsconfig.json`), and dependency tree.
* **Installer Integration Tests (Vitest)**:
  * **File I/O Verification**: Tests that config-writers correctly output `.env` variables and locally write the `.lock` file upon completion, while verifying that existing `.lock` file detections actively block execution.
  * **Wrangler CLI Wrapper Mocks**: The installer programmatically executes wrangler CLI commands. Tests mock Node.js child processes (`child_process.exec`/`spawn`) to verify that the wrapper compiles the correct arguments (e.g., matching account IDs, database names) without triggering actual remote deployments during test runs.
  * **Validation Helpers**: Tests local regex-checks for Brevo API keys, Google Client Secrets, and Cloudflare tokens.
* **Installer E2E Tests (Playwright)**:
  * Playwright boots the local installer web server (`localhost:3000`) in isolation.
  * Automates key inputs, validates that step-by-step navigational links function, and ensures error dialogs render dynamically if mock credentials fail validation endpoints.
* **Isolated Node Modules**: Prevents production bundle dependencies from bleeding into the setup runtime, ensuring that testing the installer has zero impact on the scheduler’s codebase size or production package imports.

---

## 2. CI/CD Pipeline Strategy (GitHub Actions + Cloudflare Pages)

The CI/CD pipeline runs entirely on **GitHub Actions** (generous free tier of 2,000 runner minutes per month) and deploys directly to **Cloudflare Pages**.

### 2.1 The CI/CD Pipeline Flow

```
   [Push / PR to main]
            |
            v
   +-------------------------------------------------------+
   |                  GitHub Actions Runner                |
   |                                                       |
   |  1. Install & Cache Node Dependencies (npm ci)        |
   |  2. Lint & Format Verification (ESLint / Prettier)    |
   |  3. TypeScript Compile Check (tsc --noEmit)           |
   |  4. Run Unit & Integration Tests (vitest)             |
   |  5. Run E2E Integration Tests (playwright)            |
   +------------------------+------------------------------+
                            |
                     [Tests Passed?]
                            |
                +-----------+-----------+
                | YES                   | NO
                v                       v
   +-----------------------+   +-------------------+
   |  Deploy Migrations &  |   |   Halt Build &    |
   |   Astro Build App     |   |   Notify Creator  |
   |  (Cloudflare Pages)   |   +-------------------+
   +-----------------------+
```

### 2.2 Continuous Integration (CI) Specifications
Every Pull Request or Push to the `main` branch executes two concurrent, isolated CI jobs in GitHub Actions:

#### Job A: Main Scheduler App Pipeline
1. Installs main dependencies (`npm ci`).
2. Runs style/lint compliance (`npm run lint` and `npm run format:check`).
3. Verifies compiler type-safety (`npx tsc --noEmit`).
4. Runs Unit & Integration tests (`npx vitest run`).
5. Runs Scheduler E2E tests (`npx playwright test`).

#### Job B: Isolated Installer Pipeline
1. Enters `/installer` directory and installs setup-specific dependencies (`cd installer && npm ci`).
2. Runs style and lint compliance for installer code.
3. Verifies compiler type-safety of wrangler wrappers.
4. Runs isolated installer tests (`npx vitest run` targeting `/installer/tests`).
5. Runs Installer E2E tests (`npx playwright test` targeting `/installer/e2e`).

**Deployment Rule**: The CD deployment only triggers if **both Job A and Job B successfully pass**, guaranteeing that a stable booking application is never shipped with a broken installation wizard.

### 2.3 Continuous Deployment (CD) & Database Migrations
Upon successful verification in CI, the deployment to Cloudflare Pages is automated:

1. **D1 Database Schema Migrations**:
   * Prior to launching new serverless code, database migrations must be safely applied to the remote D1 instance to prevent runtime query mismatch errors.
   * GitHub Actions runs the wrangler CLI using a secure **Cloudflare API Token**:
     ```bash
     npx wrangler d1 migrations apply DB_NAME --remote
     ```
2. **Cloudflare Pages Build**:
   * Cloudflare Pages is linked to the GitHub Repository. When CI reports a successful pass, Cloudflare Pages builds the Astro site:
     ```bash
     npm run build
     ```
     This triggers the `@astrojs/cloudflare` adapter to compile Pages routes and SSR functions.
3. **Zero-Downtime Deployment**:
   * Cloudflare Pages deploys the new build output immediately across its global network. Traffic dynamically shifts to the new Edge V8 isolates with **zero downtime**.
