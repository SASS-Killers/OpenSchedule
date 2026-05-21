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

- `src/Root.tsx` — Defines the composition (1080×720, 30fps, 30s duration)
- `src/OpenScheduleDemo.tsx` — All 10 scenes with animations
- `src/index.css` — Base styles

## Scenes

| # | Scene | Duration | Description |
|---|-------|----------|-------------|
| 1 | Intro | 5s | Logo + title + tech stack tags |
| 2 | Features | 5s | 8 feature cards with icons |
| 3 | Login | 5s | Email OTP flow mockup |
| 4 | Host Dashboard | 5s | Two-column settings + bookings |
| 5 | Schedule Editor | 5s | Weekly availability grid |
| 6 | Exceptions | 5s | Date-specific + recurring exceptions |
| 7 | Booking Widget | 5s | Calendar picker + time slots |
| 8 | Admin Dashboard | 5s | Hosts list + email telemetry widget |
| 9 | Confirmation | 5s | Booking confirmed + .ics download |
| 10 | Outro | 5s | Stack tags + GitHub link |
