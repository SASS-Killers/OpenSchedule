# OpenSchedule Explainer — Voiceover Script

**Total runtime**: 50s | **Music**: INPLUSMUSIC — Soft Background Music  
**Delivery**: Conversational, warm but professional. ~2.5 words/second pace.

---

## Scene 1 — Booking Widget (0s → 5s)

| Time | Script |
|------|--------|
| 0.5s | **(pause — let music breathe)** |
| 1.5s | Stop paying subscription fees every month to have simple scheduling. |
| 3.5s | Ditch the SaaS treadmill. |
| 5.0s | OpenSchedule lets anyone book time with you — no account needed. Just pick a date, choose a slot, and you're done. |

**On screen**: Calendar grid → clicking a date → time slots appearing → one highlighted as "Selected"

---

## Scene 2 — Booking Confirmation (5s → 9s)

| Time | Script |
|------|--------|
| 5.0s | Booking confirmed instantly. |
| 6.5s | You get a confirmation email with an .ics file for your calendar, a cancellation link, and the host gets notified too. |

**On screen**: ✅ animation → "Booking Confirmed" → "Add to Calendar (.ics)" button → checkmark list of emails sent

---

## Scene 3 — Login (9s → 13s)

| Time | Script |
|------|--------|
| 9.0s | For hosts and admins, there are no passwords to remember. |
| 11.0s | Just enter your email, get a six-digit code, and you're in. |

**On screen**: Email input → "Send Login Code" → "✓ Code sent" notification → security features listed below

---

## Scene 4 — Host Dashboard (13s → 18s)

| Time | Script |
|------|--------|
| 13.0s | The host dashboard is your command center. |
| 14.5s | Manage your event types, set your weekly schedule, handle exceptions, and see your upcoming bookings all in one place. |

**On screen**: Two-column dashboard — left column with avatar, settings links; right column with 3 upcoming bookings

---

## Scene 5 — Schedule Editor (18s → 22s)

| Time | Script |
|------|--------|
| 18.0s | Set your weekly availability with a simple click to toggle days on and off. |
| 20.5s | Time parsing is smart — type "9a" and it normalizes to 9:00 AM automatically. |

**On screen**: 7-day schedule grid → Mon-Fri highlighted with time inputs → Saturday/Sunday showing "Not available"

---

## Scene 6 — Exceptions (22s → 26s)

| Time | Script |
|------|--------|
| 22.0s | Need a vacation? A dentist appointment? Working from home? |
| 23.5s | Date-specific exceptions override your normal schedule. Recurring blocks handle weekly patterns like team standups. |
| 25.5s | The carve-out algorithm splits shifts automatically — no manual fiddling. |

**On screen**: Left column — date-specific exceptions (vacation, dentist, WFH); Right column — recurring (team standup, summer hours)

---

## Scene 7 — Event Types (26s → 30s)

| Time | Script |
|------|--------|
| 26.0s | Create different meeting types with custom durations, buffer times between meetings, and minimum notice periods. |
| 28.5s | Slugs auto-generate from the title, so your booking links are always clean. |

**On screen**: Event type list (30 Min, Consultation, Strategy Session) → right panel showing configuration options (Duration, Buffer, Min. Notice, Auto-slug)

---

## Scene 8 — Admin Dashboard (30s → 35s)

| Time | Script |
|------|--------|
| 30.0s | The admin console lets you provision host accounts — there's no public signup. |
| 32.0s | The built-in email telemetry widget shows your daily Brevo usage at a glance. At 80%, non-critical reminders are skipped. At 95%, only login codes get through. |
| 34.5s | Bookings always succeed — even if email is throttled. |

**On screen**: Sidebar with "Hosts" selected → host list (Jane, John, Alice) → Email Quota widget showing 247/300 with yellow progress bar and warning text

---

## Scene 9 — Easy Install App (35s → 40s)

| Time | Script |
|------|--------|
| 35.0s | Getting started is dead simple. Run one command: npm run install-wizard. |
| 37.0s | The guided wizard walks you through creating a free Cloudflare account, provisions the database, connects Brevo for email, sets up your admin profile, and deploys to Cloudflare Pages. |
| 39.5s | The installer runs locally and is never deployed — your production environment stays locked down. |

**On screen**: 5-step horizontal wizard cards → terminal output showing each step completing with green checkmarks

---

## Scene 10 — Free Hosting Stack (40s → 44s)

| Time | Script |
|------|--------|
| 40.0s | The entire platform runs on free tiers. Neon PostgreSQL gives you 500 megabytes. Cloudflare Pages handles 100,000 requests a day. Brevo covers 300 transactional emails daily. |
| 42.5s | That's enough for about 25 hosts and 125 bookings per day — completely free. |
| 43.5s | Need more? Upgrade Brevo to Starter for 20,000 emails a month. |

**On screen**: 3 cards — Neon (500MB), Cloudflare (100K req/day), Brevo (300/day) with "Free" tags → bottom info box about scaling

---

## Scene 11 — Features Grid (44s → 47s)

| Time | Script |
|------|--------|
| 44.0s | Passwordless auth, dynamic scheduling, real-time conflict detection, email notifications, .ics calendar files... |
| 46.0s | OpenSchedule is a complete Calendly replacement that you own. |

**On screen**: 8 feature cards in a 4×2 grid, each with icon and label

---

## Scene 12 — Outro (47s → 50s)

| Time | Script |
|------|--------|
| 47.0s | Built with Neon, PostgREST, Astro, and Cloudflare. |
| 48.5s | Free, self-hosted, open source. Link in the description. |

**On screen**: Logo → "OpenSchedule" title → tech stack tags → GitHub URL → test stats

---

## Timing Reference

| Scene | Frames | Time | Words | Pace |
|-------|--------|------|-------|------|
| 1. Booking Widget | 0–150 | 0–5s | 11 | 2.2 wps |
| 2. Booking Confirmation | 150–270 | 5–9s | 19 | 4.8 wps |
| 3. Login | 270–390 | 9–13s | 16 | 4.0 wps |
| 4. Host Dashboard | 390–540 | 13–18s | 21 | 4.2 wps |
| 5. Schedule Editor | 540–660 | 18–22s | 17 | 4.3 wps |
| 6. Exceptions | 660–780 | 22–26s | 22 | 5.5 wps |
| 7. Event Types | 780–900 | 26–30s | 17 | 4.3 wps |
| 8. Admin Dashboard | 900–1050 | 30–35s | 33 | 6.6 wps * |
| 9. Easy Install App | 1050–1200 | 35–40s | 34 | 6.8 wps * |
| 10. Free Hosting Stack | 1200–1320 | 40–44s | 30 | 7.5 wps * |
| 11. Features Grid | 1320–1410 | 44–47s | 15 | 5.0 wps |
| 12. Outro | 1410–1500 | 47–50s | 13 | 4.3 wps |

*\* Scenes 8–10 are denser — speak at a natural pace, the visuals carry the detail.*

## After Recording

Update the `VOICEOVER_SEGMENTS` array in `OpenScheduleDemo.tsx` with the actual frame ranges where you speak. A rough heuristic: multiply your recording start/end times by 30 to get frames.

Example — if you start speaking at 1.5s and stop at 4.5s:
```
[45, 135],  // 1.5s × 30 = 45, 4.5s × 30 = 135
```
