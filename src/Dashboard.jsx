/* Dashboard.jsx — the Editorial dashboard.
   Live clock (24h, no seconds), live Open-Meteo weather for Aripuanã-MT,
   an "agora na agenda" card linking to the schedule page, and 8 links
   grouped by category. */

import { useState, useEffect, useMemo } from "react";
import { SunIcon, MoonIcon, DropIcon, WindIcon, ClockIcon, ArrowRightIcon, StarIcon, WEATHER_ICON } from "./icons.jsx";
import { useTheme } from "./theme.js";
import { scheduleStatus, CATEGORIES } from "./schedule.js";
import { moonInfo, visiblePlanets, observingIndex, nextSkyAlert } from "./astro.js";
import Search from "./Search.jsx";
import DailyFact from "./DailyFact.jsx";
import Containers from "./Containers.jsx";
import { LOCATION, WIDGETS, LINKS, LINK_CATEGORIES } from "./config.js";

/* ── data (from config/settings.yml) ─────────────────── */
const { latitude: LAT, longitude: LON, city: CITY } = LOCATION;
const CATS = LINK_CATEGORIES;

/* ── weather ────────────────────────────────────────── */
function mapWeather(code) {
  const m = {
    0: ["sun", "Céu limpo"],
    1: ["sun", "Predom. limpo"],
    2: ["partly", "Parcial. nublado"],
    3: ["cloud", "Nublado"],
    45: ["fog", "Névoa"],
    48: ["fog", "Névoa gelada"],
    51: ["drizzle", "Garoa fraca"],
    53: ["drizzle", "Garoa"],
    55: ["drizzle", "Garoa forte"],
    56: ["drizzle", "Garoa gelada"],
    57: ["drizzle", "Garoa gelada"],
    61: ["rain", "Chuva fraca"],
    63: ["rain", "Chuva"],
    65: ["rain", "Chuva forte"],
    66: ["rain", "Chuva gelada"],
    67: ["rain", "Chuva gelada"],
    71: ["snow", "Neve fraca"],
    73: ["snow", "Neve"],
    75: ["snow", "Neve forte"],
    77: ["snow", "Grãos de neve"],
    80: ["rain", "Pancadas"],
    81: ["rain", "Pancadas"],
    82: ["rain", "Pancadas fortes"],
    85: ["snow", "Neve"],
    86: ["snow", "Neve forte"],
    95: ["thunder", "Trovoada"],
    96: ["thunder", "Trovoada c/ granizo"],
    99: ["thunder", "Trovoada c/ granizo"],
  };
  return m[code] || ["cloud", "—"];
}

let _weatherPromise = null;
function getWeather() {
  if (_weatherPromise) return _weatherPromise;
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,cloud_cover` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,` +
    `sunrise,sunset,daylight_duration&forecast_days=7&timezone=auto`;
  _weatherPromise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("net");
      return r.json();
    })
    .then((d) => {
      const c = d.current;
      const day = d.daily || {};
      const [iconKey, label] = mapWeather(c.weather_code);
      const days = (day.time || []).map((t, i) => ({
        date: t,
        code: day.weather_code?.[i],
        tmax: Math.round(day.temperature_2m_max?.[i]),
        tmin: Math.round(day.temperature_2m_min?.[i]),
        precip: day.precipitation_probability_max?.[i] ?? null,
        uv: day.uv_index_max?.[i] ?? null,
      }));
      const w = {
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        humidity: Math.round(c.relative_humidity_2m),
        wind: Math.round(c.wind_speed_10m),
        clouds: c.cloud_cover != null ? Math.round(c.cloud_cover) : null,
        sunrise: day.sunrise?.[0] || null,
        sunset: day.sunset?.[0] || null,
        daylight: day.daylight_duration?.[0] || null,
        uvMax: day.uv_index_max?.[0] ?? null,
        days,
        iconKey,
        label,
        ok: true,
      };
      try {
        localStorage.setItem("dash.weather", JSON.stringify(w));
      } catch (e) {} // eslint-disable-line no-empty, no-unused-vars
      return w;
    });
  return _weatherPromise;
}

function useWeather() {
  const [w, setW] = useState(() => {
    try {
      const c = localStorage.getItem("dash.weather");
      if (c) return { ...JSON.parse(c), loading: true };
    } catch (e) {} // eslint-disable-line no-empty, no-unused-vars
    return { loading: true };
  });
  useEffect(() => {
    let on = true;
    getWeather()
      .then((d) => on && setW({ ...d, loading: false }))
      .catch(() => on && setW((p) => ({ ...p, loading: false, error: !p.ok })));
    return () => {
      on = false;
    };
  }, []);
  return w;
}

/* ── air quality + UV (Open-Meteo air-quality API) ───── */
let _airPromise = null;
function getAir() {
  if (_airPromise) return _airPromise;
  const url =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}` +
    `&current=us_aqi,pm2_5,pm10,uv_index,ozone&timezone=auto`;
  _airPromise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("air");
      return r.json();
    })
    .then((d) => {
      const c = d.current || {};
      const a = {
        aqi: c.us_aqi != null ? Math.round(c.us_aqi) : null,
        pm25: c.pm2_5 ?? null,
        pm10: c.pm10 ?? null,
        ozone: c.ozone ?? null,
        uv: c.uv_index ?? null,
        ok: true,
      };
      try {
        localStorage.setItem("dash.air", JSON.stringify(a));
      } catch (e) {} // eslint-disable-line no-empty, no-unused-vars
      return a;
    });
  return _airPromise;
}
function useAir() {
  const [a, setA] = useState(() => {
    try {
      const c = localStorage.getItem("dash.air");
      if (c) return { ...JSON.parse(c), loading: true };
    } catch (e) {} // eslint-disable-line no-empty, no-unused-vars
    return { loading: true };
  });
  useEffect(() => {
    let on = true;
    getAir()
      .then((d) => on && setA({ ...d, loading: false }))
      .catch(() => on && setA((p) => ({ ...p, loading: false, error: !p.ok })));
    return () => {
      on = false;
    };
  }, []);
  return a;
}

/* AQI (US) + UV index → label + color */
function aqiInfo(aqi) {
  if (aqi == null) return { label: "—", color: "#a3a3a3" };
  if (aqi <= 50) return { label: "Boa", color: "#34d399" };
  if (aqi <= 100) return { label: "Moderada", color: "#fbbf24" };
  if (aqi <= 150) return { label: "Insalubre (sensíveis)", color: "#fb923c" };
  if (aqi <= 200) return { label: "Insalubre", color: "#f87171" };
  if (aqi <= 300) return { label: "Muito insalubre", color: "#c084fc" };
  return { label: "Perigosa", color: "#ef4444" };
}
function uvInfo(uv) {
  if (uv == null) return { label: "—", color: "#a3a3a3" };
  if (uv < 3) return { label: "Baixo", color: "#34d399" };
  if (uv < 6) return { label: "Moderado", color: "#fbbf24" };
  if (uv < 8) return { label: "Alto", color: "#fb923c" };
  if (uv < 11) return { label: "Muito alto", color: "#f87171" };
  return { label: "Extremo", color: "#c084fc" };
}

/* ── clock ──────────────────────────────────────────── */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}
const pad = (n) => String(n).padStart(2, "0");
function fmtDate(d) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* Agenda card — bloco atual + intervalo, próximo em segundo plano.
   Clique abre a página de agenda (#/agenda). */
function AgendaCard({ now }) {
  const { current, next, progress } = scheduleStatus(now);
  const c = current ? CATEGORIES[current.cat] || { color: "#a3a3a3" } : null;
  return (
    <a className="agenda-card" href="#/agenda" style={current ? { "--cat": c.color } : undefined}>
      <div className="agenda-card-top">
        <span className="agenda-card-eyebrow">
          <ClockIcon width={13} height={13} />
          Agora
        </span>
        <ArrowRightIcon width={15} height={15} className="agenda-card-go" />
      </div>

      {current ? (
        <>
          <div className="agenda-card-title">{current.title}</div>
          <div className="agenda-card-range mono">
            {current.start} – {current.end}
          </div>
          <div className="agenda-card-progress">
            <div className="agenda-card-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
        </>
      ) : (
        <div className="agenda-card-title agenda-card-title--free">Tempo livre</div>
      )}

      {next && (
        <div className="agenda-card-next">
          A seguir · <span className="mono">{next.start}</span> {next.title}
        </div>
      )}
    </a>
  );
}

/* Astronomia — fase da lua (cálculo local) + nascer/pôr do sol e duração
   do dia (Open-Meteo). Atualiza com o relógio. */
const hhmm = (iso) => (iso ? iso.slice(11, 16) : "—");
function fmtDuration(sec) {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${h}h${pad(m)}`;
}
function AstroCard({ now, weather }) {
  const moon = moonInfo(now);
  const illum = Math.round(moon.illumination * 100);
  const nextLabel = moon.toFull <= moon.toNew ? "Lua cheia" : "Lua nova";
  const nextDays = Math.max(1, Math.round(Math.min(moon.toFull, moon.toNew)));

  /* planets change slowly — recompute once per minute, not every clock tick */
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  const { planets, isNight } = useMemo(
    () => visiblePlanets(now, LAT, LON),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minuteKey]
  );

  /* event alert (<48h) — recompute hourly */
  const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
  const alert = useMemo(
    () => nextSkyAlert(now, 48),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hourKey]
  );

  /* observing index — needs cloud cover + humidity from the weather feed */
  const obs =
    weather.ok && weather.clouds != null
      ? observingIndex({
          clouds: weather.clouds,
          humidity: weather.humidity,
          moonIllumination: moon.illumination,
          isNight,
        })
      : null;

  return (
    <a className="astro-card" href="#/astro">
      <div className="astro-eyebrow">
        <span>
          <StarIcon width={13} height={13} />
          Céu agora · {CITY}
        </span>
        {alert ? (
          <span className="astro-alert" title={alert.title}>
            {alert.emoji} {alert.hours <= 1 ? "agora" : `${alert.hours}h`}
          </span>
        ) : (
          <ArrowRightIcon width={15} height={15} className="astro-go" />
        )}
      </div>

      <div className="astro-body">
        <div className="astro-moon">
          <span className="astro-moon-emoji" role="img" aria-label={moon.name}>
            {moon.emoji}
          </span>
          <div>
            <div className="astro-moon-name">{moon.name}</div>
            <div className="astro-moon-illum mono">{illum}% iluminada</div>
          </div>
        </div>

        <div className="astro-stats">
          <div className="astro-stat">
            <span className="astro-stat-label">
              <SunIcon width={14} height={14} /> Nascer
            </span>
            <span className="astro-stat-val mono">{hhmm(weather.sunrise)}</span>
          </div>
          <div className="astro-stat">
            <span className="astro-stat-label">
              <MoonIcon width={14} height={14} /> Pôr
            </span>
            <span className="astro-stat-val mono">{hhmm(weather.sunset)}</span>
          </div>
          <div className="astro-stat">
            <span className="astro-stat-label">
              <ClockIcon width={14} height={14} /> Dia
            </span>
            <span className="astro-stat-val mono">{fmtDuration(weather.daylight)}</span>
          </div>
          <div className="astro-stat">
            <span className="astro-stat-label">
              <StarIcon width={14} height={14} /> {nextLabel}
            </span>
            <span className="astro-stat-val mono">{nextDays}d</span>
          </div>
        </div>
      </div>

      <div className="astro-planets">
        <span className="astro-planets-label">Planetas visíveis</span>
        {planets.length > 0 ? (
          <div className="astro-planets-list">
            {planets.map((p) => (
              <span className="astro-planet" key={p.name} title={`${p.name} · mag ${p.mag.toFixed(1)}`}>
                <span className="astro-planet-sym">{p.sym}</span>
                {p.name}
                <span className="astro-planet-meta mono">
                  {p.dir} {p.altitude}°
                </span>
              </span>
            ))}
          </div>
        ) : (
          <span className="astro-planets-empty">
            {isNight ? "Nenhum planeta acima do horizonte agora." : "Céu diurno — aguarde anoitecer."}
          </span>
        )}
      </div>

      {obs && (
        <div className="astro-obs" style={{ "--oc": obs.color }}>
          <span className="astro-obs-label">Observação esta noite</span>
          <span className="astro-obs-val">
            <span className="astro-obs-badge">{obs.label}</span>
            <span className="astro-obs-meta mono">
              ☁ {obs.clouds}% · 💧 {obs.humidity}%
            </span>
          </span>
        </div>
      )}
    </a>
  );
}

/* Clima estendido — previsão de 7 dias + qualidade do ar e índice UV. */
const weekdayShort = (iso) => {
  const d = new Date(iso + "T12:00:00");
  const s = d.toLocaleDateString("pt-BR", { weekday: "short" });
  return s.replace(".", "");
};
function WeatherDetail({ weather, air }) {
  const days = weather.days || [];
  const uv = uvInfo(weather.uvMax);
  const aq = aqiInfo(air.aqi);

  return (
    <section className="wx-card">
      <div className="wx-eyebrow">
        <SunIcon width={13} height={13} /> Clima · próximos 7 dias
      </div>

      <div className="wx-week">
        {days.length === 0 ? (
          <div className="wx-skel">carregando previsão…</div>
        ) : (
          days.map((d, i) => {
            const WI = WEATHER_ICON[mapWeather(d.code)[0]] || WEATHER_ICON.cloud;
            return (
              <div className={"wx-day" + (i === 0 ? " is-today" : "")} key={d.date}>
                <span className="wx-day-name">{i === 0 ? "hoje" : weekdayShort(d.date)}</span>
                <WI width={22} height={22} className="wx-day-ico" />
                <span className="wx-day-temp mono">
                  <strong>{d.tmax}°</strong>
                  <span className="wx-day-min">{d.tmin}°</span>
                </span>
                <span className="wx-day-rain mono">
                  <DropIcon width={11} height={11} />
                  {d.precip != null ? `${d.precip}%` : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="wx-air">
        <div className="wx-air-item">
          <span className="wx-air-label">Qualidade do ar</span>
          <span className="wx-air-val">
            <span className="wx-badge" style={{ "--c": aq.color }}>
              {air.aqi != null ? `AQI ${air.aqi}` : "—"}
            </span>
            <span className="wx-air-desc">{aq.label}</span>
          </span>
        </div>
        <div className="wx-air-item">
          <span className="wx-air-label">Índice UV (máx. hoje)</span>
          <span className="wx-air-val">
            <span className="wx-badge" style={{ "--c": uv.color }}>
              {weather.uvMax != null ? weather.uvMax.toFixed(1) : "—"}
            </span>
            <span className="wx-air-desc">{uv.label}</span>
          </span>
        </div>
        <div className="wx-air-item">
          <span className="wx-air-label">Partículas</span>
          <span className="wx-air-val mono wx-air-pm">
            PM2.5 {air.pm25 != null ? Math.round(air.pm25) : "—"} · PM10 {air.pm10 != null ? Math.round(air.pm10) : "—"}{" "}
            µg/m³
          </span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════
   EDITORIAL BOARD  (structured cards / numbered)
   ════════════════════════════════════════════════════ */
function EditorialBoard({ now, weather, air, links }) {
  const WI = WEATHER_ICON[weather.iconKey || "cloud"] || WEATHER_ICON.cloud;
  return (
    <div className="ed-board">
      {/* header: clock left, weather card right */}
      <div className="ed-header">
        {WIDGETS.clock ? (
          <div>
            <div className="status" style={{ marginBottom: 18 }}>
              Horário local · {CITY}
            </div>
            <div className="mono ed-clock">
              {pad(now.getHours())}
              <span style={{ color: "rgb(var(--ink-600))" }}>:</span>
              {pad(now.getMinutes())}
            </div>
            <div style={{ marginTop: 16, fontSize: 16, color: "rgb(var(--ink-400))" }}>{fmtDate(now)}</div>
          </div>
        ) : (
          <div />
        )}

        <div className="ed-side">
          {WIDGETS.weather && (
            <div className="ed-weather">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div
                    className="mono"
                    style={{ fontSize: 40, fontWeight: 500, color: "rgb(var(--ink-100))", lineHeight: 1 }}
                  >
                    {weather.ok ? `${weather.temp}°` : "—"}
                  </div>
                  <div style={{ fontSize: 13, color: "rgb(var(--ink-400))", marginTop: 8 }}>
                    {weather.loading ? "carregando…" : weather.label}
                  </div>
                </div>
                <WI width={40} height={40} style={{ color: "rgb(var(--ink-300))" }} />
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 18,
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid rgba(var(--fg-rgb),0.05)",
                }}
              >
                <span className="weather-chip" style={{ gap: 7, fontSize: 12.5 }}>
                  <DropIcon width={15} height={15} style={{ color: "rgb(var(--ink-500))" }} />
                  {weather.ok ? `${weather.humidity}%` : "—"}
                </span>
                <span className="weather-chip" style={{ gap: 7, fontSize: 12.5 }}>
                  <WindIcon width={15} height={15} style={{ color: "rgb(var(--ink-500))" }} />
                  {weather.ok ? `${weather.wind} km/h` : "—"}
                </span>
                <span className="weather-chip" style={{ gap: 7, fontSize: 12.5 }} title="sensação">
                  ≈{weather.ok ? `${weather.feels}°` : "—"}
                </span>
              </div>
            </div>
          )}
          {WIDGETS.agenda && <AgendaCard now={now} />}
        </div>
      </div>

      {/* clima estendido: 7 dias + ar/UV */}
      {WIDGETS.forecast && <WeatherDetail weather={weather} air={air} />}

      {/* astronomia */}
      {WIDGETS.skyNow && <AstroCard now={now} weather={weather} />}

      {/* curiosidade do dia */}
      {WIDGETS.facts && <DailyFact />}

      {/* search bar */}
      <Search links={links} />

      {/* docker containers — between search and shortcut links */}
      <Containers />

      {/* link columns */}
      <div className="ed-grid">
        {CATS.map((cat, ci) => (
          <div key={cat} className="ed-cat">
            <div className="eyebrow" style={{ marginBottom: 16 }}>
              {pad(ci + 1)} · {cat}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {links
                .filter((l) => l.cat === cat)
                .map((l) => (
                  <a
                    key={l.key}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link"
                    style={{ padding: "12px 14px" }}
                  >
                    <span className="link-ico">
                      <l.Icon width={18} height={18} />
                    </span>
                    <span className="link-label" style={{ flex: 1 }}>
                      {l.label}
                    </span>
                  </a>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════
   DASHBOARD WRAPPER — theme toggle
   ════════════════════════════════════════════════════ */
export default function Dashboard() {
  const now = useClock();
  const weather = useWeather();
  const air = useAir();
  const { theme, toggle } = useTheme();

  return (
    <div className={"dash" + (theme === "light" ? " light" : "")}>
      <EditorialBoard now={now} weather={weather} air={air} links={LINKS} />
      {/* theme toggle — fixed top-right corner of the board */}
      <button
        className="icon-btn"
        onClick={toggle}
        title="Alternar tema"
        aria-label="Alternar tema"
        style={{ position: "absolute", top: 16, right: 16, zIndex: 5 }}
      >
        {theme === "light" ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
      </button>
    </div>
  );
}
