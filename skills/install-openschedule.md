# Install OpenSchedule

This guide helps an AI assistant walk a non-technical user through installing OpenSchedule. The user needs no coding experience — just a web browser and an email address.

## What we're building

OpenSchedule is a free replacement for Calendly. It runs on free cloud services and costs $0/month to operate for up to 25 team members.

## Before you start

Make sure the user has:
- A web browser (Chrome, Safari, or Edge)
- An email address they can use to sign up for free accounts
- About 20 minutes of time

## Step 1: Create a Cloudflare account

Cloudflare hosts the website for free. Tell the user:

1. Go to https://dash.cloudflare.com/signup
2. Enter their email address and create a password
3. Click "Create Account"
4. Check their email for a verification link and click it
5. Once logged in, they'll see the Cloudflare dashboard
6. On the right side of the dashboard, there's an **Account ID** — a long string of letters and numbers. They need to copy this and save it somewhere (we'll use it later).
7. Now click "API Tokens" in the left sidebar (or go to https://dash.cloudflare.com/profile/api-tokens)
8. Click "Create Token"
9. Click "Use template" next to "Edit Cloudflare Workers" — this gives the right permissions
10. Under "Account Resources", select "Include" and choose their account
11. Under "Zone Resources", select "Include" and choose "All zones"
12. Click "Continue to summary" then "Create Token"
13. **IMPORTANT**: Copy the API token now — it will only be shown once. Save it with the Account ID.

> **Troubleshooting**: If they get stuck on the API token page, tell them to just create a token with "All Zones" and "All Account" permissions — it's fine for a personal project.

## Step 2: Create a Neon database

Neon provides the free PostgreSQL database. Tell the user:

1. Go to https://console.neon.tech/signup
2. Sign up with email (or Google/GitHub — email is simplest)
3. Verify their email if needed
4. Once logged in, click "Create Project"
5. Name it "openschedule" (or anything they like)
6. Select the region closest to them
7. Click "Create Project"
8. They'll see a connection string that looks like:
   `postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/openschedule?sslmode=require`
9. Click "Copy" to copy this string. Save it.

> **Note**: The free tier gives 500 MB of storage — more than enough for years of bookings.

## Step 3: Create a Brevo account

Brevo sends the email notifications (login codes, booking confirmations, reminders). Tell the user:

1. Go to https://www.brevo.com and click "Sign up free"
2. Enter their email and create a password
3. Fill in their name and company name (can be anything)
4. Confirm their email
5. Once logged in, go to https://app.brevo.com/settings/keys/smtp
6. Under "API Keys", click "Generate a new API key"
7. Give it a name like "OpenSchedule"
8. Copy the generated API key and save it
9. Also need a sender email — go to https://app.brevo.com/settings/sender
10. Click "Add a sender" and enter their email
11. They'll get a verification email — click the link to confirm

> **Troubleshooting**: Brevo's free tier allows 300 emails per day. That's enough for about 125 bookings. If they need more, they can upgrade later.

## Step 4: Clone and configure

The user needs to get the code onto their computer. Tell them:

1. Open a terminal (search for "Terminal" on Mac, "Command Prompt" on Windows)
2. Run this command to download the project:
   ```bash
   git clone https://github.com/SASS-Killers/OpenSchedule.git
   cd OpenSchedule
   ```
3. If `git` isn't installed, tell them to go to https://github.com/SASS-Killers/OpenSchedule, click the green "Code" button, and choose "Download ZIP". Then unzip it.
4. In the project folder, find the file called `.env.example` and rename it to `.env`
5. Open `.env` in a text editor (Notepad, TextEdit, VS Code)
6. Fill in the three values they saved:
   - `CLOUDFLARE_ACCOUNT_ID` = the Account ID from Step 1
   - `CLOUDFLARE_API_TOKEN` = the API token from Step 1
   - `DATABASE_URL` = the Neon connection string from Step 2
   - `BREVO_API_KEY` = the Brevo API key from Step 3
   - `FROM_EMAIL` = the sender email they set up in Step 3

## Step 5: Run the setup wizard

Tell the user:

1. Make sure they're in the OpenSchedule folder in their terminal
2. Run this command:
   ```bash
   npm run install-wizard
   ```
3. Open their browser and go to http://localhost:3000
4. Follow the on-screen wizard steps:
   - It will verify their Cloudflare credentials
   - Provision the database
   - Set up the admin account
   - Build and deploy the site
5. When it finishes, the wizard will show their live URL — something like `https://openschedule.pages.dev`

## Step 6: Log in and set up

Tell the user:

1. Go to their live URL (the one from Step 5)
2. Click "Login" and enter the admin email they set up
3. Check their email for a 6-digit code
4. Enter the code
5. They're now the admin! They can:
   - Add team members (hosts) from the admin dashboard
   - Set their own availability
   - Create meeting types
   - Share their booking link with clients

## What to do if something goes wrong

| Problem | What to check |
|---------|--------------|
| Wizard won't start | Make sure Node.js is installed (run `node --version` in terminal) |
| Cloudflare token fails | Regenerate the token with "All Zones" permissions |
| Database connection fails | Double-check the Neon connection string is complete |
| Brevo emails not sending | Make sure the sender email is verified |
| Site won't deploy | Check the API token has Workers permissions |
| Need help | Open a GitHub issue: https://github.com/SASS-Killers/OpenSchedule/issues |
