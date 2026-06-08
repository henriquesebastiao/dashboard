/* astro.js — local astronomy calc (no API needed).
   Moon phase from the synodic month relative to a known new moon.
   Visible planets via astronomy-engine ephemeris. */

import * as Astronomy from "astronomy-engine";

const SYNODIC = 29.530588853; // days
const REF_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14) / 86400000; // 2000-01-06 18:14 UTC

const NAMES = [
  "Lua nova",
  "Lua crescente",
  "Quarto crescente",
  "Gibosa crescente",
  "Lua cheia",
  "Gibosa minguante",
  "Quarto minguante",
  "Lua minguante",
];
const EMOJIS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"];

/* naked-eye planets, brightest first */
const PLANETS = [
  { body: "Mercury", name: "Mercúrio", sym: "☿" },
  { body: "Venus", name: "Vênus", sym: "♀" },
  { body: "Mars", name: "Marte", sym: "♂" },
  { body: "Jupiter", name: "Júpiter", sym: "♃" },
  { body: "Saturn", name: "Saturno", sym: "♄" },
];
const COMPASS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
const compass = (az) => COMPASS[Math.round(az / 45) % 8];

function altOf(time, observer, body) {
  const eq = Astronomy.Equator(body, time, observer, true, true);
  const hor = Astronomy.Horizon(time, observer, eq.ra, eq.dec, "normal");
  return hor;
}

/* planets currently above the horizon and actually visible:
   either the sky is dark (sun below civil twilight) or the planet is
   bright enough (Venus/Jupiter) to show in twilight. */
export function visiblePlanets(date = new Date(), lat, lon) {
  try {
    const observer = new Astronomy.Observer(lat, lon, 200);
    const time = Astronomy.MakeTime(date);
    const sunAlt = altOf(time, observer, Astronomy.Body.Sun).altitude;
    const isNight = sunAlt < -6;

    const out = [];
    for (const p of PLANETS) {
      const body = Astronomy.Body[p.body];
      const hor = altOf(time, observer, body);
      if (hor.altitude <= 2) continue; // below / hugging horizon
      const mag = Astronomy.Illumination(body, time).mag;
      if (!isNight && mag > -3.5) continue; // daytime: only the very bright ones
      out.push({
        name: p.name,
        sym: p.sym,
        altitude: Math.round(hor.altitude),
        dir: compass(hor.azimuth),
        mag,
      });
    }
    out.sort((a, b) => a.mag - b.mag);
    return { planets: out, isNight };
  } catch {
    return { planets: [], isNight: false };
  }
}

/* ── detailed report for the astronomy page ── */
const AU_KM = 149597870.7;
const CONSTEL_PT = {
  Aries: "Áries",
  Taurus: "Touro",
  Gemini: "Gêmeos",
  Cancer: "Câncer",
  Leo: "Leão",
  Virgo: "Virgem",
  Libra: "Libra",
  Scorpius: "Escorpião",
  Sagittarius: "Sagitário",
  Capricornus: "Capricórnio",
  Aquarius: "Aquário",
  Pisces: "Peixes",
  Ophiuchus: "Ofiúco",
  Orion: "Órion",
  Cetus: "Baleia",
};
const constelPt = (en) => CONSTEL_PT[en] || en;

const dateOf = (r) => (r ? r.date : null);
const riseOf = (body, obs, t) => {
  try {
    return dateOf(Astronomy.SearchRiseSet(body, obs, +1, t, 1));
  } catch {
    return null;
  }
};
const setOf = (body, obs, t) => {
  try {
    return dateOf(Astronomy.SearchRiseSet(body, obs, -1, t, 1));
  } catch {
    return null;
  }
};
const twilight = (obs, t, alt, dir) => {
  try {
    return dateOf(Astronomy.SearchAltitude(Astronomy.Body.Sun, obs, dir, t, 1, alt));
  } catch {
    return null;
  }
};
const constellationOf = (body, time, obs) => {
  try {
    const e = Astronomy.Equator(body, time, obs, false, true);
    return constelPt(Astronomy.Constellation(e.ra, e.dec).name);
  } catch {
    return null;
  }
};

export function astroReport(date = new Date(), lat, lon) {
  const moon = moonInfo(date);
  try {
    const obs = new Astronomy.Observer(lat, lon, 200);
    const t = Astronomy.MakeTime(date);
    const startOfDay = Astronomy.MakeTime(new Date(date.getTime() - 12 * 3600000));

    /* sun */
    const sunHor = horizonOf(t, obs, Astronomy.Body.Sun);
    const sunrise = riseOf(Astronomy.Body.Sun, obs, startOfDay);
    const sunset = setOf(Astronomy.Body.Sun, obs, sunrise ? Astronomy.MakeTime(sunrise) : startOfDay);
    let solarNoon = null;
    try {
      solarNoon = Astronomy.SearchHourAngle(Astronomy.Body.Sun, obs, 0, startOfDay).time.date;
    } catch {
      solarNoon = null;
    }
    const dayLength = sunrise && sunset ? (sunset - sunrise) / 1000 : null;
    const sun = {
      altitude: sunHor.alt,
      azimuth: sunHor.az,
      dir: compass(sunHor.az),
      rise: sunrise,
      set: sunset,
      solarNoon,
      dayLength,
      dawnCivil: twilight(obs, startOfDay, -6, +1),
      duskCivil: twilight(obs, t, -6, -1),
      dawnNautical: twilight(obs, startOfDay, -12, +1),
      duskNautical: twilight(obs, t, -12, -1),
      dawnAstro: twilight(obs, startOfDay, -18, +1),
      duskAstro: twilight(obs, t, -18, -1),
      isNight: sunHor.alt < -6,
    };

    /* moon extras */
    const moonHor = horizonOf(t, obs, Astronomy.Body.Moon);
    const moonEqu = Astronomy.Equator(Astronomy.Body.Moon, t, obs, true, true);
    let nextFull = null,
      nextNew = null;
    try {
      nextFull = dateOf(Astronomy.SearchMoonPhase(180, t, 40));
      nextNew = dateOf(Astronomy.SearchMoonPhase(0, t, 40));
    } catch {
      /* ignore */
    }
    const moonDetail = {
      ...moon,
      altitude: moonHor.alt,
      azimuth: moonHor.az,
      dir: compass(moonHor.az),
      distanceKm: Math.round(moonEqu.dist * AU_KM),
      rise: riseOf(Astronomy.Body.Moon, obs, startOfDay),
      set: setOf(Astronomy.Body.Moon, obs, startOfDay),
      constellation: constellationOf(Astronomy.Body.Moon, t, obs),
      nextFull,
      nextNew,
    };

    /* planets */
    const planets = PLANETS.map((p) => {
      const body = Astronomy.Body[p.body];
      const hor = horizonOf(t, obs, body);
      const mag = Astronomy.Illumination(body, t).mag;
      const equ = Astronomy.Equator(body, t, obs, true, true);
      const up = hor.alt > 2;
      return {
        name: p.name,
        sym: p.sym,
        altitude: Math.round(hor.alt),
        azimuth: Math.round(hor.az),
        dir: compass(hor.az),
        mag,
        distanceAu: equ.dist,
        constellation: constellationOf(body, t, obs),
        rise: riseOf(body, obs, startOfDay),
        set: setOf(body, obs, startOfDay),
        up,
        visible: up && (sun.isNight || mag <= -3.5),
      };
    });

    return { ok: true, moon: moonDetail, sun, planets };
  } catch {
    return { ok: false, moon, sun: null, planets: [] };
  }
}

/* ── astronomical events calendar (computed locally) ── */
const QUARTER = [
  { emoji: "🌑", title: "Lua nova" },
  { emoji: "🌓", title: "Quarto crescente" },
  { emoji: "🌕", title: "Lua cheia" },
  { emoji: "🌗", title: "Quarto minguante" },
];
const ECLIPSE_KIND = { penumbral: "penumbral", partial: "parcial", total: "total", annular: "anular" };
const OUTER = [
  { body: "Mars", name: "Marte" },
  { body: "Jupiter", name: "Júpiter" },
  { body: "Saturn", name: "Saturno" },
];
const INNER = [
  { body: "Mercury", name: "Mercúrio" },
  { body: "Venus", name: "Vênus" },
];

const push = (list, date, emoji, title, kind) => {
  if (date) list.push({ date, emoji, title, kind });
};

/* major annual meteor showers (approx. peak date + radiant) */
const SHOWERS = [
  { name: "Quadrântidas", m: 1, d: 3, radiant: "Boieiro", zhr: 110 },
  { name: "Líridas", m: 4, d: 22, radiant: "Lira", zhr: 18 },
  { name: "Eta Aquáridas", m: 5, d: 6, radiant: "Aquário", zhr: 50 },
  { name: "Delta Aquáridas", m: 7, d: 30, radiant: "Aquário", zhr: 25 },
  { name: "Perseidas", m: 8, d: 12, radiant: "Perseu", zhr: 100 },
  { name: "Oriônidas", m: 10, d: 21, radiant: "Órion", zhr: 20 },
  { name: "Leônidas", m: 11, d: 17, radiant: "Leão", zhr: 15 },
  { name: "Gemínidas", m: 12, d: 14, radiant: "Gêmeos", zhr: 150 },
  { name: "Úrsidas", m: 12, d: 22, radiant: "Ursa Menor", zhr: 10 },
];

export function astroEvents(date = new Date(), horizonDays = 270) {
  const out = [];
  try {
    const t = Astronomy.MakeTime(date);
    const limit = date.getTime() + horizonDays * 86400000;

    /* moon quarters (next several) */
    let mq = Astronomy.SearchMoonQuarter(t);
    for (let i = 0; i < 12; i++) {
      const q = QUARTER[mq.quarter];
      push(out, mq.time.date, q.emoji, q.title, "lua");
      mq = Astronomy.NextMoonQuarter(mq);
      if (mq.time.date.getTime() > limit) break;
    }

    /* seasons (equinoxes/solstices) within horizon */
    for (const yr of [date.getFullYear(), date.getFullYear() + 1]) {
      const s = Astronomy.Seasons(yr);
      push(out, s.mar_equinox.date, "🍂", "Equinócio de março", "estacao");
      push(out, s.jun_solstice.date, "❄️", "Solstício de junho", "estacao");
      push(out, s.sep_equinox.date, "🌱", "Equinócio de setembro", "estacao");
      push(out, s.dec_solstice.date, "☀️", "Solstício de dezembro", "estacao");
    }

    /* eclipses */
    try {
      const le = Astronomy.SearchLunarEclipse(t);
      push(out, le.peak.date, "🌕", `Eclipse lunar ${ECLIPSE_KIND[le.kind] || le.kind}`, "eclipse");
    } catch {
      /* ignore */
    }
    try {
      const se = Astronomy.SearchGlobalSolarEclipse(t);
      push(out, se.peak.date, "🌑", `Eclipse solar ${ECLIPSE_KIND[se.kind] || se.kind}`, "eclipse");
    } catch {
      /* ignore */
    }

    /* outer-planet oppositions */
    for (const p of OUTER) {
      try {
        const opp = Astronomy.SearchRelativeLongitude(Astronomy.Body[p.body], 180, t);
        push(out, opp.date, "✦", `Oposição de ${p.name}`, "planeta");
      } catch {
        /* ignore */
      }
    }

    /* inner-planet greatest elongations */
    for (const p of INNER) {
      try {
        const el = Astronomy.SearchMaxElongation(Astronomy.Body[p.body], t);
        const when = el.visibility === "morning" ? "matutina" : "vespertina";
        push(out, el.time.date, "↔", `Máx. elongação de ${p.name} (${when})`, "planeta");
      } catch {
        /* ignore */
      }
    }

    /* next lunar perigee & apogee */
    try {
      let ap = Astronomy.SearchLunarApsis(t);
      for (let i = 0; i < 2; i++) {
        const peri = ap.kind === Astronomy.ApsisKind.Pericenter;
        push(
          out,
          ap.time.date,
          "🌙",
          `Lua no ${peri ? "perigeu" : "apogeu"} (${Math.round(ap.dist_km).toLocaleString("pt-BR")} km)`,
          "lua"
        );
        ap = Astronomy.NextLunarApsis(ap);
      }
    } catch {
      /* ignore */
    }

    /* meteor showers — next peak (this year or next) */
    for (const sh of SHOWERS) {
      for (const yr of [date.getFullYear(), date.getFullYear() + 1]) {
        const dt = new Date(yr, sh.m - 1, sh.d, 3, 0, 0); // pré-amanhecer
        push(out, dt, "☄️", `${sh.name} — radiante ${sh.radiant} (~${sh.zhr}/h)`, "meteoro");
      }
    }

    return out.filter((e) => e.date >= date && e.date.getTime() <= limit).sort((a, b) => a.date - b.date);
  } catch {
    return out.sort((a, b) => a.date - b.date);
  }
}

/* ── observing index ("boa noite p/ observar?") ──
   Combines cloud cover, humidity and (at night) moon glare into a 0–100 score.
   Inputs: clouds 0–100, humidity 0–100, moonIllumination 0–1, isNight bool. */
export function observingIndex({ clouds = 0, humidity = 0, moonIllumination = 0, isNight = true }) {
  const cloudScore = 100 - clamp(clouds, 0, 100);
  // humidity below ~45% is fine; penalise the excess
  const humScore = clamp(100 - Math.max(0, humidity - 45) * 1.6, 0, 100);
  // bright moon only hurts at night
  const moonScore = isNight ? 100 - moonIllumination * 100 : 100;

  const score = Math.round(cloudScore * 0.55 + humScore * 0.25 + moonScore * 0.2);
  let label, color;
  if (score >= 75) [label, color] = ["Excelente", "#34d399"];
  else if (score >= 55) [label, color] = ["Boa", "#60a5fa"];
  else if (score >= 35) [label, color] = ["Razoável", "#fbbf24"];
  else [label, color] = ["Ruim", "#f87171"];

  return { score, label, color, clouds: Math.round(clouds), humidity: Math.round(humidity), isNight };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

/* ── next "alert" event (eclipse / meteor shower peak) within `withinHours` ──
   Used to flash a badge on the dashboard when something is imminent. */
export function nextSkyAlert(now = new Date(), withinHours = 48) {
  try {
    const limit = now.getTime() + withinHours * 3600000;
    const events = astroEvents(now, 30).filter(
      (e) => (e.kind === "eclipse" || e.kind === "meteoro") && e.date.getTime() <= limit
    );
    if (events.length === 0) return null;
    const e = events[0];
    const hours = Math.max(0, (e.date - now) / 3600000);
    return { ...e, hours: Math.round(hours) };
  } catch {
    return null;
  }
}

function horizonOf(time, observer, body) {
  const e = Astronomy.Equator(body, time, observer, true, true);
  const h = Astronomy.Horizon(time, observer, e.ra, e.dec, "normal");
  return { alt: h.altitude, az: h.azimuth };
}

/* sun altitude (degrees) for a moment/place — used for ISS pass visibility */
export function sunAltitude(date, lat, lon) {
  try {
    const obs = new Astronomy.Observer(lat, lon, 200);
    const t = Astronomy.MakeTime(date);
    return horizonOf(t, obs, Astronomy.Body.Sun).alt;
  } catch {
    return null;
  }
}

export function moonInfo(date = new Date()) {
  let age = (date.getTime() / 86400000 - REF_NEW_MOON) % SYNODIC;
  if (age < 0) age += SYNODIC;

  const frac = age / SYNODIC; // 0 new .. 0.5 full .. 1 new
  const illumination = (1 - Math.cos(2 * Math.PI * frac)) / 2; // 0..1
  const idx = Math.round(frac * 8) % 8;

  const toFull = ((0.5 - frac + 1) % 1) * SYNODIC; // days until next full moon
  const toNew = ((1 - frac) % 1) * SYNODIC; // days until next new moon

  return {
    age,
    frac,
    illumination,
    waxing: frac < 0.5,
    name: NAMES[idx],
    emoji: EMOJIS[idx],
    toFull,
    toNew,
  };
}
