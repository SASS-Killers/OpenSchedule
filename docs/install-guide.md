# Installing OpenSchedule

This guide walks you through setting up OpenSchedule step by step. No coding experience needed — just a web browser and an email address.

**What you'll need:**
- A web browser (Chrome, Safari, Edge — any will do)
- An email address you can use to sign up for free accounts
- About 20 minutes

**What we're building:** A free, self-hosted replacement for Calendly that runs on free cloud services. $0/month.

---

## Step 1: Create a Cloudflare account

Cloudflare hosts your OpenSchedule site for free. This is where the website will live.

### 1.1 Sign up

Go to [dash.cloudflare.com/signup](https://dash.cloudflare.com/signup) and enter your email and create a password.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-1.png" alt="Cloudflare signup form" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

They'll send a verification email — click the link to confirm.

### 1.2 Skip the setup questions

Cloudflare will ask how you plan to use their service. Choose **Skip** — you don't need to answer these.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-2.png" alt="Cloudflare setup questionnaire — click Skip" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

### 1.3 Find your Account ID

Once you're in the dashboard, look on the right side of the page. You'll see your **Account ID** — it's a long string of letters and numbers.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-3.png" alt="Cloudflare dashboard with Account ID highlighted" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

**Copy this Account ID** and save it somewhere — you'll need it later.

### 1.4 Create an API token

OpenSchedule needs a token to deploy your site to Cloudflare. Here's how to create one:

**Step 1**: Go to **API Tokens** in the Cloudflare dashboard and click **"Create Token"**.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-4.png" alt="Cloudflare API Tokens page — click Create Token" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

**Step 2**: Find the template called **"Edit Cloudflare Workers"** and click **"Use template"**.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-5.png" alt="Select the Edit Cloudflare Workers template" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

**Step 3**: On the permissions page, set:
- **Account Resources** → **Include** → your account
- **Zone Resources** → **Include** → **"All zones"**

Leave everything else as-is.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-6.png" alt="Token permissions — top half" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

**Step 4**: Scroll down and click **"Continue to summary"**, then **"Create Token"**.

<img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/install/cloudflare-7.png" alt="Token permissions — scroll to Continue button" width="600" style="border-radius: 8px; border: 1px solid #e2e8f0;" />

**Step 5**: Copy the token it shows you. **This is your only chance** — if you close the page, you'll have to create a new one. Save it with your Account ID.

> ✅ **Cloudflare step complete.** You should have these saved:
> - **Account ID** (from the dashboard)
> - **API Token** (just created)

---

## Step 2: Create a Neon database

Neon provides the database where OpenSchedule stores all your data — users, bookings, schedules, everything.

Go to [console.neon.tech/signup](https://console.neon.tech/signup) and sign up with your email.

_→ Screenshots coming once you take them._

---

## Step 3: Set up Brevo for emails

Brevo sends the emails — login codes, booking confirmations, daily reminders. Their free tier handles 300 emails per day, which is plenty for a small team.

Go to [brevo.com](https://www.brevo.com) and click **"Sign up free"**.

_→ Screenshots coming once you take them._

---

## Step 4: Configure and deploy

Once you have all three accounts, you'll run a setup wizard that connects everything and deploys your site.

_→ Instructions coming after the setup screenshots are in place._
