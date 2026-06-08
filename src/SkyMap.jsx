/* SkyMap.jsx — live all-sky map (azimuthal projection, zenith at centre).
   Renders the visible dome over Aripuanã: bright stars + constellation lines,
   the naked-eye planets, the Moon (with phase) and the Sun when above horizon.
   N at top, Leste (E) to the right, Sul (S) at bottom, Oeste (W) to the left. */

import { useEffect, useMemo, useRef, useState } from "react";
import { computeSky, LINES } from "./skymap.js";

const RAD = Math.PI / 180;

/* alt/az → x,y inside a unit dome of radius R centred at (cx,cy).
   r grows from 0 at the zenith to R at the horizon (alt 0). */
function project(alt, az, cx, cy, R) {
  const r = (R * (90 - alt)) / 90;
  const a = az * RAD;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

export default function SkyMap({ now, lat, lon, theme }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState(0);

  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  const sky = useMemo(
    () => computeSky(now, lat, lon),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minuteKey, lat, lon]
  );

  /* track container width → square canvas */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setSize(Math.min(w, 520));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, size, sky, theme);
  }, [size, sky, theme]);

  const dark = theme !== "light";
  const visibleStars = sky.stars.filter((s) => s.alt >= 0).length;
  const visiblePlanets = sky.planets.filter((p) => p.alt >= 0);

  return (
    <div className="sky-map" ref={wrapRef}>
      <canvas
        ref={canvasRef}
        className="sky-map-canvas"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Mapa do céu atual sobre Aripuanã"
      />
      <div className="sky-map-legend">
        <span className="sky-map-leg">
          <span className="sky-map-dot" style={{ background: dark ? "#fff" : "#222" }} /> {visibleStars} estrelas
        </span>
        {visiblePlanets.map((p) => (
          <span className="sky-map-leg" key={p.name}>
            <span className="sky-map-dot" style={{ background: p.color }} /> {p.name}
          </span>
        ))}
        {sky.moon && sky.moon.alt >= 0 && (
          <span className="sky-map-leg">
            <span className="sky-map-dot" style={{ background: "#e6e2c8" }} /> Lua
          </span>
        )}
      </div>
    </div>
  );
}

function draw(ctx, S, sky, theme) {
  const dark = theme !== "light";
  const cx = S / 2;
  const cy = S / 2;
  const R = S / 2 - 14;

  ctx.clearRect(0, 0, S, S);

  /* dome background */
  const grad = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  if (dark) {
    grad.addColorStop(0, "#0d1426");
    grad.addColorStop(1, "#05070f");
  } else {
    grad.addColorStop(0, "#dbe6f5");
    grad.addColorStop(1, "#b9cbe6");
  }
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  /* altitude rings (30°, 60°) + horizon */
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  for (const alt of [0, 30, 60]) {
    const rr = (R * (90 - alt)) / 90;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* cardinal directions — N top, Leste right, Sul bottom, Oeste left */
  const dirs = [
    ["N", 0],
    ["L", 90],
    ["S", 180],
    ["O", 270],
  ];
  ctx.fillStyle = dark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.55)";
  ctx.font = "600 12px JetBrains Mono, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [label, az] of dirs) {
    const p = project(-2, az, cx, cy, R);
    ctx.fillText(label, p.x, p.y);
  }

  /* constellation lines */
  const byId = {};
  for (const s of sky.stars) byId[s.id] = s;
  ctx.strokeStyle = dark ? "rgba(120,170,255,0.28)" : "rgba(40,90,170,0.35)";
  ctx.lineWidth = 1;
  for (const [a, b] of LINES) {
    const sa = byId[a];
    const sb = byId[b];
    if (!sa || !sb || sa.alt < 0 || sb.alt < 0) continue;
    const pa = project(sa.alt, sa.az, cx, cy, R);
    const pb = project(sb.alt, sb.az, cx, cy, R);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }

  /* clip subsequent points to the dome */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();

  /* stars */
  for (const s of sky.stars) {
    if (s.alt < 0) continue;
    const p = project(s.alt, s.az, cx, cy, R);
    const rad = Math.max(0.7, 2.6 - s.mag * 0.7);
    ctx.beginPath();
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
    ctx.fillStyle = dark ? "#ffffff" : "#1c2742";
    ctx.fill();
    if (s.mag < 0.5) {
      ctx.fillStyle = dark ? "rgba(220,230,255,0.7)" : "rgba(30,45,80,0.7)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(s.name, p.x + rad + 3, p.y);
    }
  }

  /* planets */
  for (const pl of sky.planets) {
    if (pl.alt < 0) continue;
    const p = project(pl.alt, pl.az, cx, cy, R);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
    ctx.fillStyle = pl.color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 0.6;
    ctx.stroke();
    ctx.fillStyle = dark ? "rgba(255,240,210,0.85)" : "rgba(60,45,20,0.85)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(pl.name, p.x + 7, p.y);
  }

  /* Moon — disk: dark base + lit crescent/gibbous via a clipped offset circle */
  if (sky.moon && sky.moon.alt >= 0) {
    const p = project(sky.moon.alt, sky.moon.az, cx, cy, R);
    const mr = 7;
    const f = sky.moon.illumination; // 0 new .. 1 full
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, mr, 0, Math.PI * 2);
    ctx.clip();
    // dark side
    ctx.fillStyle = dark ? "#33363f" : "#8b94a4";
    ctx.fillRect(p.x - mr, p.y - mr, mr * 2, mr * 2);
    // lit side: a circle of radius mr offset so the overlap matches the phase
    ctx.fillStyle = "#e6e2c8";
    const off = (1 - 2 * f) * mr; // f=1 → -mr.. wait keep simple
    ctx.beginPath();
    ctx.arc(p.x + off, p.y, mr, 0, Math.PI * 2);
    if (f >= 0.5) {
      // gibbous: fill whole disk then dark already under; draw lit as full minus offset dark
      ctx.fillRect(p.x - mr, p.y - mr, mr * 2, mr * 2);
      ctx.fillStyle = dark ? "#33363f" : "#8b94a4";
      ctx.beginPath();
      ctx.arc(p.x + off, p.y, mr, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(p.x, p.y, mr, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* Sun (only if up — daytime map) */
  if (sky.sun && sky.sun.alt >= 0) {
    const p = project(sky.sun.alt, sky.sun.az, cx, cy, R);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#ffb347";
    ctx.shadowColor = "rgba(255,179,71,0.8)";
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  /* dome outline */
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.stroke();
}
