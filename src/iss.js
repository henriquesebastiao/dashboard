/* iss.js — next ISS passes over a location.
   TLE from tle.ivanstanojevic.me (CORS, no key), propagated locally with
   satellite.js. A pass is "visible" when it peaks during twilight
   (observer sun altitude between -6° and -18°), when the ISS is sunlit
   but the sky is dark. */

import * as satellite from "satellite.js";
import { sunAltitude } from "./astro.js";

const ISS_ID = 25544;
const TLE_TTL = 6 * 3600 * 1000;
const TLE_KEY = "dash.iss.tle";

const COMPASS = ["N", "NE", "L", "SE", "S", "SO", "O", "NO"];
const compass = (deg) => COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];

async function getTLE() {
  try {
    const c = JSON.parse(localStorage.getItem(TLE_KEY) || "null");
    if (c && Date.now() - c.ts < TLE_TTL) return c;
  } catch {
    /* ignore */
  }
  const r = await fetch(`https://tle.ivanstanojevic.me/api/tle/${ISS_ID}`);
  if (!r.ok) throw new Error("tle " + r.status);
  const j = await r.json();
  const t = { ts: Date.now(), name: j.name, line1: j.line1, line2: j.line2 };
  try {
    localStorage.setItem(TLE_KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
  return t;
}

export async function getISSPasses({ lat, lon, days = 3, minEl = 10 } = {}) {
  const tle = await getTLE();
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
  const obs = {
    longitude: satellite.degreesToRadians(lon),
    latitude: satellite.degreesToRadians(lat),
    height: 0.2,
  };

  const passes = [];
  let cur = null;
  const start = Date.now();
  for (let s = 0; s < days * 86400; s += 30) {
    const d = new Date(start + s * 1000);
    const pv = satellite.propagate(satrec, d);
    if (!pv.position) continue;
    const gmst = satellite.gstime(d);
    const la = satellite.ecfToLookAngles(obs, satellite.eciToEcf(pv.position, gmst));
    const el = satellite.radiansToDegrees(la.elevation);
    if (el > minEl) {
      const az = satellite.radiansToDegrees(la.azimuth);
      if (!cur) cur = { start: d, startAz: az, peakEl: el, peakAz: az, peakT: d, end: d, endAz: az };
      else {
        cur.end = d;
        cur.endAz = az;
        if (el > cur.peakEl) {
          cur.peakEl = el;
          cur.peakAz = az;
          cur.peakT = d;
        }
      }
    } else if (cur) {
      passes.push(cur);
      cur = null;
    }
  }
  if (cur) passes.push(cur);

  return {
    name: tle.name,
    passes: passes.map((p) => {
      const sunAlt = sunAltitude(p.peakT, lat, lon);
      return {
        start: p.start,
        peak: p.peakT,
        end: p.end,
        maxEl: Math.round(p.peakEl),
        dirStart: compass(p.startAz),
        dirPeak: compass(p.peakAz),
        dirEnd: compass(p.endAz),
        durationSec: (p.end - p.start) / 1000,
        sunAlt,
        visible: sunAlt != null && sunAlt <= -6 && sunAlt >= -18,
      };
    }),
  };
}
