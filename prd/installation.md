# PRD Section 3: Local Setup & Service Installer

To ensure absolute security and eliminate the risk of public administration hijack, the OpenSchedule installation process is designed as a **locally-run, user-friendly web wizard**. 

Rather than exposing setup endpoints on the live internet, the install app runs locally (e.g., on the user's laptop or workstation) and acts as an automated setup coordinator that provisions the Cloudflare infrastructure, D1 database, and cron workers programmatically.

---

## 1. Local Installer Architecture

* **Bootstrapping Command**: A user boots the local setup manager in the project root:
  ```bash
  npm run install-wizard
  ```
* **Local Server**: Boots a lightweight local web server hosting the installer UI at `http://localhost:3000`.
* **Execution Boundary**: The live production code deployed to Cloudflare Pages has **no `/install` endpoint**. Once deployed, the production environment secrets are immutable, completely eliminating the risk of external overrides.

---

## 2. Non-Persistence to Production (Zero Setup Bundle Leak)

To optimize bundle sizes, keep the edge worker footprint under 1MB, and maintain a strict security boundary, **the installer code is never persisted to the production deployment**:

* **Code Isolation**: All installation files (the setup server, setup UI pages, visual screenshot assets, CLI wrapper automation scripts, and local `.lock` file) reside in a designated `scripts/` or `installer/` directory.
* **Production Exclusion**: The Astro production configuration explicitly ignores the installer workspace during build operations. The compilation output directory (`dist/`) shipped to Cloudflare Pages contains *only* the operational scheduler code, the public calendars, and the authenticated host/admin dashboard routes.
* **Zero Overhead**: Production serverless functions are completely unburdened by setup-related files or large wrapper dependencies, keeping edge startup latency at absolute zero.

---

## 3. Non-Technical Step-by-Step Provisioning Wizard

The wizard UI is designed specifically for **non-technical staff**, complete with collapsible visual guides, bulletproof copy-paste error catching, and instant link shortcuts.

```
       +-------------------------------------------------------+
       |               Local Setup Wizard (localhost)          |
       +---------------------------+---------------------------+
                                   |
            [Step 1]  ---> Sign up for Free Cloudflare Account
                           Get Account ID & API Token (Guided UI)
                                   |
            [Step 2]  ---> Automate D1 DB & Pages Provisioning
                           (Runs background CLI migrations)
                                   |
            [Step 3]  ---> Integrate Brevo API Key for Email
                                   |
            [Step 4]  ---> Set up Google Calendar OAuth App
                           (Exhaustive instructions on Google Console)
                                   |
            [Step 5]  ---> Define Admin Profile (Name & Email)
                                   |
            [Step 6]  ---> Automate Pages Build & Edge Deployment
```

### Step 1: Cloudflare Infrastructure Configuration
* **User Experience**: The UI displays exhaustive instructions on how to create a free Cloudflare account, find their **Cloudflare Account ID**, and generate a **Cloudflare API Token** with Pages and D1 read/write permissions.
* **Instruction details**: *"Step 1: Go to dash.cloudflare.com. Step 2: Click on your profile icon in the top right. Step 3: Click 'API Tokens'..."*
* **Validation**: The local installer makes a mock fetch request to Cloudflare's API using the provided token to instantly verify that credentials are valid before letting the user proceed.

### Step 2: Automated Database & Environment Provisioning
* **Behind-the-Scenes Action**: The local server utilizes the validated Cloudflare token to run background provisioning scripts using Wrangler APIs:
  1. Creates the serverless SQLite **Cloudflare D1 Database**:
     ```bash
     npx wrangler d1 create openschedule-db
     ```
  2. Applies the migrations schema automatically to set up all normalized 3NF tables:
     ```bash
     npx wrangler d1 migrations apply openschedule-db --remote
     ```
  3. Pre-binds the Pages application to the newly created D1 database.

### Step 3: Transactional Email Integration (Brevo)

* **User Experience**: Simple tutorial on signing up for Brevo (300 free emails/day — 3× Resend's limit).
* **Fields**: Brevo API Key, Verified Sending Domain (e.g. `booking@mycompany.com`).
* **Validation**: Sends a test validation email to the Admin's address to verify delivery in real-time.

### Step 4: Google Developer OAuth Credentials Setup
* **User Experience**: An exhaustive, visual, non-technical walkthrough for establishing Google API keys.
* **Instruction details**:
  * Guarantees non-technical personnel can create a Google Cloud Project for free.
  * Shows how to click "Enable APIs" and search for **Google Calendar API**.
  * Explains how to set up the OAuth Consent Screen (Internal vs. External) and add the Redirect URI (e.g., `https://your-app.pages.dev/api/auth/callback/google`).
* **Fields Collected**: Google Client ID and Google Client Secret.

### Step 5: Primary Administrator Setup
* **User Experience**: The installer collects the Admin's Name, Email address, and local timezone.
* **Database Seed**: The local installer writes this record directly to the remote D1 database:
  ```sql
  INSERT INTO users (id, email, name, role, timezone, is_active, created_at)
  VALUES (UUID(), admin_email, admin_name, 'admin', admin_timezone, 1, current_timestamp);
  ```

### Step 6: Automated Edge Build & Deployment
* **Behind-the-Scenes Action**:
  1. The installer saves the keys dynamically to local environment config (`.env`) and injects them securely into Cloudflare Pages environment variables (`wrangler pages secret put ...`).
  2. Runs the compiler command:
     ```bash
     npm run build
     ```
  3. Deploys the built Astro application directly to the live Cloudflare Pages edge:
     ```bash
     npx wrangler pages deploy dist --project-name=openschedule
     ```
  4. Deploys the daily email alert **Cloudflare Workers Cron Trigger** worker:
     ```bash
     npx wrangler deploy src/workers/cron.ts --compatibility-date=2026-05-19
     ```

---

## 3. The Completion & Lockout

Once Step 6 finishes successfully:
1. The local console outputs the live production URL: **`https://openschedule.pages.dev`**.
2. The local installer creates a local `.lock` file in the project folder to indicate setup completion.
3. If `npm run install-wizard` is executed again, the script checks for `.lock`, detects the active remote Admin in D1, and blocks execution:
   ```bash
   "Error: OpenSchedule has already been successfully installed and deployed to Cloudflare Pages. This setup script is locked."
   ```
4. The local server gracefully shuts down, leaving the production application secure and completely locked from internet-based configuration modifications.
