# OpenSchedule

Stop paying monthly for simple scheduling. OpenSchedule is a 100% free, self-hosted replacement for Calendly that you actually own.

No subscriptions. No per-seat licenses. No surprise bills. Just you and your data.

https://github.com/user-attachments/assets/7cd623ff-f042-41c2-96f6-e12db0cf8097


<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-booking.png" alt="" width="45%" style="border-radius: 8px;" />
</p>

<p align="center">
  <img src="https://github.com/SASS-Killers/OpenSchedule/raw/main/public/images/scene-admin.png" alt="" width="70%" style="border-radius: 8px;" />
</p>

[Get started](#quick-start) · [Report a bug](https://github.com/SASS-Killers/OpenSchedule/issues)


---

## What is OpenSchedule?

It's a booking platform for your business or team. Clients pick a time from your calendar, book instantly, and get a confirmation email with a calendar file attached. You get notified. Everyone shows up on time.

**The difference?** It runs on free cloud services. No monthly fees. No contracts. If you can click "deploy" on a website, you can run OpenSchedule.

## Who is this for?

- **Freelancers & consultants** — Stop paying $15/mo for Calendly
- **Small businesses** — Offer online booking without adding another subscription
- **Teams** — Multiple staff, each with their own availability and meeting types
- **Anyone tired of SaaS bills** — Own your scheduling infrastructure

## What you get

- **Public booking page** — Clients pick a date and time, no account needed
- **Multiple meeting types** — 30 min calls, consultations, strategy sessions — customize each one
- **Weekly schedule** — Set your hours, toggle days on/off
- **Exceptions** — Block out vacations, dentist appointments, or set custom hours for a day
- **Automatic conflict prevention** — No double-bookings. Buffer times between meetings. Minimum notice periods.
- **Email notifications** — Booking confirmations, cancellation links, daily reminders. 300 emails/day free.
- **Admin controls** — Add/remove hosts, see email usage at a glance
- **Team ready** — Admin creates host accounts. Hosts manage their own calendars. Clients book.
- **Login with email** — No passwords. A code arrives in your inbox.

## Quick start

```bash
git clone https://github.com/SASS-Killers/OpenSchedule.git
cd open-calendar
bun install
# Set up a free Neon database and Brevo account
bun run dev
```

Full instructions in the [self-hosting guide](./docs/prd/self-hosting.md).

## How it's built

It runs on free tiers of:

| Service | What it does | Free limit |
|---------|-------------|------------|
| **Neon** | Database (PostgreSQL) | 500 MB |
| **Cloudflare Pages** | Hosting + edge compute | 100K req/day |
| **Brevo** | Transactional emails | 300/day |

That's about **25 team members and 125 bookings per day** — completely free. If you grow beyond that, Brevo's paid plan is $25/month for 20K emails.

## Project status

185+ tests · 81% code coverage · MIT license

---

<p align="center">
  <a href="https://github.com/SASS-Killers/OpenSchedule">GitHub</a> ·
  <a href="https://github.com/SASS-Killers/OpenSchedule/issues">Issues</a> ·
  <a href="https://github.com/SASS-Killers/OpenSchedule/pulls">Pull Requests</a>
</p>
