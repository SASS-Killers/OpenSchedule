import type { APIRoute } from "astro";
import { query } from "@/db/neon";

export const GET: APIRoute = async ({ url }) => {
  const hostId = url.searchParams.get("hostId");
  const eventTypeId = url.searchParams.get("eventTypeId");
  const date = url.searchParams.get("date");

  if (!hostId || !eventTypeId || !date) {
    return new Response(JSON.stringify({ error: "hostId, eventTypeId, date required" }), { status: 400 });
  }

  const [evt] = await query`
    SELECT id, duration, buffer_before, buffer_after, minimum_notice, user_id
    FROM event_types WHERE id = ${eventTypeId} AND is_active = true LIMIT 1
  ` as any[];
  if (!evt) return new Response(JSON.stringify({ slots: [], date }));

  // Get host timezone
  const [host] = await query`
    SELECT timezone FROM users WHERE id = ${hostId} AND is_active = true LIMIT 1
  ` as any[];
  if (!host) return new Response(JSON.stringify({ slots: [], date }));

  // Compute UTC offset for the host's timezone on this date
  let offsetMin = 0;
  try {
    const opts: Intl.DateTimeFormatOptions = { timeZone: host.timezone, timeZoneName: "shortOffset" };
    const parts = new Intl.DateTimeFormat("en", opts).formatToParts(new Date(date + "T12:00:00Z"));
    const tz = parts.find(p => p.type === "timeZoneName")?.value || "";
    const m = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
    if (m) {
      const h = parseInt(m[1]);
      const min = m[2] ? parseInt(m[2]) : 0;
      offsetMin = h * 60 + (h < 0 ? -min : min);
    }
  } catch { /* fallback to 0 */ }

  const nowUnix = Math.floor(Date.now() / 1000);
  // dateStart = midnight in the host's timezone (as UTC timestamp)
  const dateStart = Math.floor(new Date(date + "T00:00:00Z").getTime() / 1000) - offsetMin * 60;
  const dateEnd = dateStart + 86400;

  const jsDay = new Date(date + "T12:00:00Z").getDay();
  const dbDay = jsDay === 0 ? 6 : jsDay - 1;

  // ── PHASE 1: Gather availability signals ──

  // Date-specific overrides
  const overrides = await query`
    SELECT exception_type, start_time, end_time FROM date_overrides
    WHERE user_id = ${hostId} AND is_active = true
    AND start_date <= ${date} AND end_date >= ${date}
  ` as any[];

  // Full-day block check
  const fullDayBlock = overrides.find((o: any) => o.exception_type === "full_day_block");
  if (fullDayBlock) return new Response(JSON.stringify({ slots: [], date }));

  // Recurring exceptions for this day of week
  const recurring = await query`
    SELECT exception_type, start_time, end_time FROM recurring_exceptions
    WHERE user_id = ${hostId} AND day_of_week = ${dbDay} AND is_active = true
    AND (effective_start IS NULL OR effective_start <= ${date})
    AND (effective_end IS NULL OR effective_end >= ${date})
  ` as any[];

  // Default schedule
  const defaultBlocks = await query`
    SELECT start_time, end_time FROM schedules
    WHERE user_id = ${hostId} AND day_of_week = ${dbDay}
    ORDER BY start_time
  ` as any[];

  // ── PHASE 2: Build base available blocks ──
  let blocks: { start_time: string; end_time: string }[] = [];

  // Custom hours override
  const customOverride = overrides.find((o: any) => o.exception_type === "custom_hours");
  if (customOverride) {
    blocks.push({ start_time: customOverride.start_time, end_time: customOverride.end_time });
  } else {
    // Start from default schedule
    blocks = defaultBlocks.map((b: any) => ({ start_time: b.start_time, end_time: b.end_time }));
    // Apply recurring custom_hours
    const recurringCustom = recurring.filter((r: any) => r.exception_type === "custom_hours");
    for (const rc of recurringCustom) {
      if (!blocks.some(b => b.start_time === rc.start_time && b.end_time === rc.end_time)) {
        blocks.push({ start_time: rc.start_time, end_time: rc.end_time });
      }
    }
  }

  if (blocks.length === 0) return new Response(JSON.stringify({ slots: [], date }));

  // ── PHASE 3: Carve out window blocks ──
  const windowBlocks = [
    ...overrides.filter((o: any) => o.exception_type === "window_block"),
    ...recurring.filter((r: any) => r.exception_type === "window_block"),
  ];

  for (const wb of windowBlocks) {
    const newBlocks: typeof blocks = [];
    for (const block of blocks) {
      if (block.start_time >= wb.end_time || block.end_time <= wb.start_time) {
        // No overlap
        newBlocks.push(block);
      } else {
        // Overlap — split
        if (block.start_time < wb.start_time) {
          newBlocks.push({ start_time: block.start_time, end_time: wb.start_time });
        }
        if (block.end_time > wb.end_time) {
          newBlocks.push({ start_time: wb.end_time, end_time: block.end_time });
        }
      }
    }
    blocks = newBlocks;
  }

  // ── PHASE 4: Booked slots ──
  const booked = await query`
    SELECT b.start_time, b.end_time FROM bookings b
    JOIN event_types e ON b.event_type_id = e.id
    WHERE e.user_id = ${hostId} AND b.status = 'confirmed'
    AND b.start_time < ${dateEnd} AND b.end_time > ${dateStart}
  ` as any[];

  const durationSec = evt.duration * 60;
  const candidates: number[] = [];

  // ── PHASE 5: Slice blocks into candidate intervals and filter ──
  for (const block of blocks) {
    const [bh, bm] = block.start_time.split(":").map(Number);
    const [eh, em] = block.end_time.split(":").map(Number);
    const blockStart = dateStart + bh * 3600 + bm * 60;
    const blockEnd = dateStart + eh * 3600 + em * 60;

    let cursor = Math.ceil(blockStart / durationSec) * durationSec;

    while (cursor + durationSec <= blockEnd) {
      if (cursor < nowUnix + evt.minimum_notice * 3600) {
        cursor += durationSec;
        continue;
      }

      const slotEnd = cursor + durationSec;
      let conflict = false;
      for (const b of booked) {
        const busyStart = b.start_time - evt.buffer_before * 60;
        const busyEnd = b.end_time + evt.buffer_after * 60;
        if (cursor < busyEnd && slotEnd > busyStart) { conflict = true; break; }
      }

      if (!conflict) candidates.push(cursor);
      cursor += durationSec;
    }
  }

  return new Response(JSON.stringify({ slots: candidates, date }), {
    headers: { "content-type": "application/json" },
  });
};
