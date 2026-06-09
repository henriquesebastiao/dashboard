/* schedule.js — agenda loaded from /config/schedule.yml.
   The YAML is parsed at build time by @rollup/plugin-yaml. Edit
   config/schedule.yml (not this file) to change the routine.
   The logic (current/next block, progress) lives at the bottom. */

import cfg from "../config/schedule.yml";

/* ── categories: key → { label, color } ── */
export const CATEGORIES = cfg.categories || {};

/* ── week: weekday index (0=Sun..6=Sat) → array of blocks ──
   Each template block uses `category`; we normalize it to `cat`
   so the rest of the app keeps a single field name. */
const templates = cfg.templates || {};

function normalizeBlock(b) {
  return {
    start: b.start,
    end: b.end,
    title: b.title,
    cat: b.category || b.cat,
    ...(b.note ? { note: b.note } : {}),
  };
}

export const WEEK = Object.fromEntries(
  Object.entries(cfg.week || {}).map(([day, tplName]) => {
    const tpl = templates[tplName] || [];
    return [Number(day), tpl.map(normalizeBlock)];
  })
);

/* ── daily habits ── */
export const HABITS = cfg.habits || [];

export const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/* ═══════════════════════════════════════════════════════════════
   LÓGICA — bloco atual, próximo e progresso. Geralmente não mexer.
   ═══════════════════════════════════════════════════════════════ */
export function timeToMin(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function blocksFor(day) {
  return WEEK[day] || [];
}

/* duração do bloco em minutos (trata blocos que cruzam a meia-noite) */
export function blockSpan(b) {
  let span = timeToMin(b.end) - timeToMin(b.start);
  if (span <= 0) span += 1440;
  return span;
}

/* { current, next, progress } para um dado Date */
export function scheduleStatus(date = new Date()) {
  const day = date.getDay();
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const blocks = blocksFor(day);

  let current = null;
  for (const b of blocks) {
    const s = timeToMin(b.start);
    const e = timeToMin(b.end);
    const wraps = e <= s;
    const inside = wraps ? nowMin >= s || nowMin < e : nowMin >= s && nowMin < e;
    if (inside) {
      current = b;
      break;
    }
  }

  let next = null;
  const upcoming = blocks
    .filter((b) => timeToMin(b.start) > nowMin)
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  if (upcoming.length) {
    next = upcoming[0];
  } else {
    for (let i = 1; i <= 7; i++) {
      const nb = blocksFor((day + i) % 7);
      if (nb.length) {
        next = nb[0];
        break;
      }
    }
  }

  let progress = 0;
  if (current) {
    let done = nowMin - timeToMin(current.start);
    if (done < 0) done += 1440;
    progress = Math.min(1, Math.max(0, done / blockSpan(current)));
  }

  return { current, next, progress };
}
