# OpenSchedule Demo Video

This folder contains a [Remotion](https://remotion.dev) project that generates an explainer video for the OpenSchedule platform.

## Quick Start

```bash
cd video/openschedule-demo
npm install
npx remotion studio
```

This opens the Remotion Studio at http://localhost:3000 where you can preview and tweak the video.

## Render

```bash
cd video/openschedule-demo
npx remotion render OpenScheduleDemo out/openschedule-demo.mp4
```

## Structure

- `src/Root.tsx` — Defines the composition (1280×720, 30fps, 50s duration)
- `src/OpenScheduleDemo.tsx` — All 12 scenes with fade/slide/scale animations
- `src/index.css` — Base styles

## Scene Order (App-first)

| # | Scene | Duration | What It Shows |
|---|-------|----------|---------------|
| 1 | **Booking Widget** | 5s | Public calendar picker + time slots + 15s polling |
| 2 | **Booking Confirmation** | 4s | Confirmed state + .ics download + emails sent |
| 3 | **Login** | 4s | Email OTP flow with security features |
| 4 | **Host Dashboard** | 5s | Avatar, links, upcoming bookings agenda |
| 5 | **Schedule Editor** | 4s | Weekly availability grid with toggle |
| 6 | **Exceptions** | 4s | Date-specific + recurring override management |
| 7 | **Event Types** | 4s | Meeting configurations with buffers/notice |
| 8 | **Admin Dashboard** | 5s | Host list + email telemetry widget |
| 9 | **Easy Install App** | 5s | 5-step local setup wizard for Cloudflare + Brevo |
| 10 | **Free Hosting Stack** | 4s | Neon + Cloudflare + Brevo — all free tiers |
| 11 | **Features Grid** | 3s | 8 feature cards |
| 12 | **Outro** | 3s | Logo, stack tags, GitHub link |
