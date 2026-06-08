/* nasa.js — NASA Open APIs (CORS-enabled, browser fetch).
   APOD (picture of the day) + NeoWs (near-earth asteroids today).
   Responses are cached per day in localStorage to stay within the
   DEMO_KEY rate limit. Set VITE_NASA_KEY for a personal key. */

const KEY = import.meta.env.VITE_NASA_KEY || "DEMO_KEY";
const ymd = (d = new Date()) => d.toISOString().slice(0, 10);

function cached(key) {
  try {
    const c = localStorage.getItem(key);
    return c ? JSON.parse(c) : null;
  } catch {
    return null;
  }
}
function store(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* ignore quota */
  }
}

export async function getApod() {
  const k = "nasa.apod." + ymd();
  const hit = cached(k);
  if (hit) return hit;

  const r = await fetch(`https://api.nasa.gov/planetary/apod?thumbs=true&api_key=${KEY}`);
  if (!r.ok) throw new Error("apod " + r.status);
  const d = await r.json();
  const out = {
    date: d.date,
    title: d.title,
    explanation: d.explanation,
    mediaType: d.media_type,
    url: d.url,
    hdurl: d.hdurl || d.url,
    thumb: d.thumbnail_url || d.url,
    copyright: d.copyright ? d.copyright.trim() : null,
  };
  store(k, out);
  return out;
}

export async function getNeo() {
  const k = "nasa.neo." + ymd();
  const hit = cached(k);
  if (hit) return hit;

  const day = ymd();
  const r = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${day}&end_date=${day}&api_key=${KEY}`);
  if (!r.ok) throw new Error("neo " + r.status);
  const d = await r.json();
  const raw = d.near_earth_objects?.[day] || [];
  const objects = raw
    .map((o) => {
      const ca = o.close_approach_data?.[0] || {};
      const m = o.estimated_diameter?.meters || {};
      return {
        name: o.name.replace(/[()]/g, "").trim(),
        hazardous: o.is_potentially_hazardous_asteroid,
        dMin: m.estimated_diameter_min ?? null,
        dMax: m.estimated_diameter_max ?? null,
        missKm: ca.miss_distance?.kilometers ? Number(ca.miss_distance.kilometers) : null,
        velKmh: ca.relative_velocity?.kilometers_per_hour ? Number(ca.relative_velocity.kilometers_per_hour) : null,
        lunar: ca.miss_distance?.lunar ? Number(ca.miss_distance.lunar) : null,
        url: o.nasa_jpl_url,
      };
    })
    .sort((a, b) => (a.missKm ?? Infinity) - (b.missKm ?? Infinity));

  const out = { count: objects.length, hazardous: objects.filter((o) => o.hazardous).length, objects };
  store(k, out);
  return out;
}
