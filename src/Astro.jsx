/* Astro.jsx — detailed astronomy page (#/astro).
   Moon, Sun (rise/set, twilights, solar noon) and the naked-eye planets,
   all computed locally with astronomy-engine for Aripuanã-MT. */

import { useState, useEffect, useMemo } from "react";
import { ArrowLeftIcon, SunIcon, MoonIcon, StarIcon, ClockIcon } from "./icons.jsx";
import { useTheme } from "./theme.js";
import { astroReport, astroEvents, observingIndex } from "./astro.js";
import { getApod, getNeo } from "./nasa.js";
import { getISSPasses } from "./iss.js";
import SkyMap from "./SkyMap.jsx";
import { LOCATION } from "./config.js";
import "./astro-page.css";

/* lightweight current-conditions fetch (cloud cover + humidity) for the
   observing index — separate from the dashboard weather feed. */
function getSkyWeather() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
    `&current=relative_humidity_2m,cloud_cover&timezone=auto`;
  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("net");
      return r.json();
    })
    .then((d) => ({
      clouds: Math.round(d.current.cloud_cover),
      humidity: Math.round(d.current.relative_humidity_2m),
    }));
}

const { latitude: LAT, longitude: LON, city: CITY } = LOCATION;
const TZ = "America/Cuiaba";

const tF = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const dF = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: TZ });
const fmtT = (d) => (d ? tF.format(d) : "—");
const fmtDM = (d) => (d ? dF.format(d) : "—");
const fmtDur = (s) => {
  if (!s && s !== 0) return "—";
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}h${String(m).padStart(2, "0")}`;
};
const daysUntil = (d, now) => (d ? Math.max(0, Math.round((d - now) / 86400000)) : null);
const fmtMin = (s) => `${Math.floor(s / 60)}m${String(Math.round(s % 60)).padStart(2, "0")}s`;

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* generic async loader hook */
function useAsync(fn) {
  const [state, setState] = useState({ loading: true });
  useEffect(() => {
    let on = true;
    fn()
      .then((data) => on && setState({ loading: false, data }))
      .catch(() => on && setState({ loading: false, error: true }));
    return () => {
      on = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return state;
}

const intFmt = new Intl.NumberFormat("pt-BR");
const km = (n) => (n == null ? "—" : intFmt.format(Math.round(n)) + " km");
const meters = (a, b) => (a == null ? "—" : `${Math.round(a)}–${Math.round(b)} m`);

function fmtFullDate(d) {
  const s = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: TZ,
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* a labelled stat cell */
function Stat({ label, value, icon }) {
  return (
    <div className="sky-stat">
      <span className="sky-stat-label">
        {icon}
        {label}
      </span>
      <span className="sky-stat-val mono">{value}</span>
    </div>
  );
}

export default function Astro() {
  const now = useNow();
  const { theme, toggle } = useTheme();

  /* heavy ephemeris — recompute once per minute */
  const minuteKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
  const report = useMemo(
    () => astroReport(now, LAT, LON),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [minuteKey]
  );
  const { moon, sun, planets } = report;
  const illumPct = Math.round(moon.illumination * 100);
  const visibleCount = planets.filter((p) => p.visible).length;

  const events = useMemo(
    () => astroEvents(now, 270),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [`${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`]
  );
  const apod = useAsync(getApod);
  const neo = useAsync(getNeo);
  const iss = useAsync(() => getISSPasses({ lat: LAT, lon: LON, days: 3 }));
  const skyW = useAsync(getSkyWeather);

  const obs = skyW.data
    ? observingIndex({
        clouds: skyW.data.clouds,
        humidity: skyW.data.humidity,
        moonIllumination: moon.illumination,
        isNight: sun ? sun.isNight : true,
      })
    : null;

  return (
    <div className={"dash sky-root" + (theme === "light" ? " light" : "")}>
      <div className="sky-wrap">
        <header className="sky-top">
          <a className="sky-back" href="#/" aria-label="Voltar ao dashboard">
            <ArrowLeftIcon width={18} height={18} />
            <span>Dashboard</span>
          </a>
          <button className="icon-btn" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
            {theme === "light" ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
          </button>
        </header>

        <div className="sky-title-row">
          <h1>Astronomia</h1>
          <div className="sky-date">
            {fmtFullDate(now)} · {CITY}
          </div>
        </div>

        {/* ── Mapa do céu agora ── */}
        <section className="sky-card">
          <div className="sky-card-head">
            <div className="sky-card-eyebrow">
              <StarIcon width={13} height={13} /> Mapa do céu agora
            </div>
            <span className="sky-count">zênite ao centro · horizonte na borda</span>
          </div>
          <SkyMap now={now} lat={LAT} lon={LON} theme={theme} />
        </section>

        {/* ── Clima astronômico (observação) ── */}
        <section className="sky-card">
          <div className="sky-card-head">
            <div className="sky-card-eyebrow">
              <ClockIcon width={13} height={13} /> Clima astronômico
            </div>
            {obs && <span className="sky-count">boa noite p/ observar?</span>}
          </div>
          {skyW.loading ? (
            <div className="sky-apod-skel">Consultando condições…</div>
          ) : skyW.error || !obs ? (
            <div className="sky-apod-skel">Condições indisponíveis agora.</div>
          ) : (
            <div className="sky-obs" style={{ "--oc": obs.color }}>
              <div className="sky-obs-score">
                <span className="sky-obs-num mono">{obs.score}</span>
                <span className="sky-obs-label">{obs.label}</span>
              </div>
              <div className="sky-obs-bar">
                <div className="sky-obs-fill" style={{ width: `${obs.score}%` }} />
              </div>
              <div className="sky-obs-factors">
                <span>☁ Nuvens {obs.clouds}%</span>
                <span>💧 Umidade {obs.humidity}%</span>
                <span>🌙 Lua {Math.round(moon.illumination * 100)}%</span>
                <span>{obs.isNight ? "🌑 noite" : "☀ dia"}</span>
              </div>
            </div>
          )}
        </section>

        {/* ── NASA APOD ── */}
        <section className="sky-card sky-apod">
          <div className="sky-card-eyebrow">
            <StarIcon width={13} height={13} /> NASA · Imagem do dia
          </div>
          {apod.loading ? (
            <div className="sky-apod-skel">Carregando imagem da NASA…</div>
          ) : apod.error ? (
            <div className="sky-apod-skel">Não foi possível carregar a APOD agora.</div>
          ) : (
            <div className="sky-apod-body">
              <a
                className="sky-apod-media"
                href={apod.data.mediaType === "video" ? apod.data.url : apod.data.hdurl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={apod.data.mediaType === "video" ? apod.data.thumb : apod.data.url}
                  alt={apod.data.title}
                  loading="lazy"
                />
                {apod.data.mediaType === "video" && <span className="sky-apod-play">▶ vídeo</span>}
              </a>
              <div className="sky-apod-info">
                <h2>{apod.data.title}</h2>
                <p>{apod.data.explanation}</p>
                <div className="sky-apod-credit">
                  {apod.data.date}
                  {apod.data.copyright ? ` · © ${apod.data.copyright}` : ""}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Moon ── */}
        <section className="sky-card sky-moon">
          <div className="sky-moon-hero">
            <span className="sky-moon-emoji" role="img" aria-label={moon.name}>
              {moon.emoji}
            </span>
            <div className="sky-moon-headline">
              <div className="sky-card-eyebrow">
                <MoonIcon width={13} height={13} /> Lua
              </div>
              <div className="sky-moon-name">{moon.name}</div>
              <div className="sky-illum">
                <div className="sky-illum-bar">
                  <div className="sky-illum-fill" style={{ width: `${illumPct}%` }} />
                </div>
                <span className="mono">{illumPct}% iluminada</span>
              </div>
            </div>
          </div>

          <div className="sky-grid">
            <Stat label="Idade" value={`${moon.age.toFixed(1)} d`} />
            <Stat label="Distância" value={`${moon.distanceKm.toLocaleString("pt-BR")} km`} />
            <Stat label="Constelação" value={moon.constellation || "—"} />
            <Stat label="Posição" value={moon.altitude > 0 ? `${moon.dir} ${Math.round(moon.altitude)}°` : "abaixo"} />
            <Stat label="Nascer" value={fmtT(moon.rise)} />
            <Stat label="Pôr" value={fmtT(moon.set)} />
          </div>

          <div className="sky-pills">
            <span className="sky-pill">
              🌕 Cheia · {fmtDM(moon.nextFull)} <em>({daysUntil(moon.nextFull, now)}d)</em>
            </span>
            <span className="sky-pill">
              🌑 Nova · {fmtDM(moon.nextNew)} <em>({daysUntil(moon.nextNew, now)}d)</em>
            </span>
          </div>
        </section>

        {/* ── Sun ── */}
        {sun && (
          <section className="sky-card">
            <div className="sky-card-eyebrow">
              <SunIcon width={13} height={13} /> Sol {sun.isNight ? "· abaixo do horizonte" : ""}
            </div>
            <div className="sky-grid">
              <Stat label="Nascer" value={fmtT(sun.rise)} icon={<SunIcon width={14} height={14} />} />
              <Stat label="Pôr" value={fmtT(sun.set)} icon={<MoonIcon width={14} height={14} />} />
              <Stat label="Meio-dia solar" value={fmtT(sun.solarNoon)} icon={<StarIcon width={14} height={14} />} />
              <Stat label="Duração do dia" value={fmtDur(sun.dayLength)} icon={<ClockIcon width={14} height={14} />} />
              <Stat label="Posição" value={sun.altitude > 0 ? `${sun.dir} ${Math.round(sun.altitude)}°` : "abaixo"} />
            </div>

            <div className="sky-sub">Crepúsculos</div>
            <div className="sky-tw">
              <div className="sky-tw-row">
                <span className="sky-tw-name">Civil</span>
                <span className="mono">
                  {fmtT(sun.dawnCivil)} – {fmtT(sun.duskCivil)}
                </span>
              </div>
              <div className="sky-tw-row">
                <span className="sky-tw-name">Náutico</span>
                <span className="mono">
                  {fmtT(sun.dawnNautical)} – {fmtT(sun.duskNautical)}
                </span>
              </div>
              <div className="sky-tw-row">
                <span className="sky-tw-name">Astronômico</span>
                <span className="mono">
                  {fmtT(sun.dawnAstro)} – {fmtT(sun.duskAstro)}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ── Planets ── */}
        <section className="sky-card">
          <div className="sky-card-head">
            <div className="sky-card-eyebrow">
              <StarIcon width={13} height={13} /> Planetas
            </div>
            <span className="sky-count">{visibleCount} visível(is) agora</span>
          </div>

          <div className="sky-table" role="table">
            <div className="sky-tr sky-tr--head" role="row">
              <span>Planeta</span>
              <span>Constelação</span>
              <span>Posição</span>
              <span>Mag.</span>
              <span>Dist.</span>
              <span>Nascer</span>
              <span>Pôr</span>
              <span>Status</span>
            </div>
            {planets.map((p) => (
              <div className={"sky-tr" + (p.visible ? " is-visible" : "")} role="row" key={p.name}>
                <span className="sky-pl-name">
                  <span className="sky-pl-sym">{p.sym}</span>
                  {p.name}
                </span>
                <span>{p.constellation || "—"}</span>
                <span className="mono">{p.up ? `${p.dir} ${p.altitude}°` : "—"}</span>
                <span className="mono">{p.mag.toFixed(1)}</span>
                <span className="mono">{p.distanceAu.toFixed(2)} ua</span>
                <span className="mono">{fmtT(p.rise)}</span>
                <span className="mono">{fmtT(p.set)}</span>
                <span>
                  <span className={"sky-badge " + (p.visible ? "is-on" : p.up ? "is-up" : "is-off")}>
                    {p.visible ? "visível" : p.up ? "acima" : "abaixo"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── ISS passes ── */}
        <section className="sky-card">
          <div className="sky-card-head">
            <div className="sky-card-eyebrow">
              <StarIcon width={13} height={13} /> ISS · próximas passagens
            </div>
            {iss.data && (
              <span className="sky-count">{iss.data.passes.filter((p) => p.visible).length} visível(is)</span>
            )}
          </div>
          {iss.loading ? (
            <div className="sky-apod-skel">Calculando passagens…</div>
          ) : iss.error || !iss.data ? (
            <div className="sky-apod-skel">Não foi possível obter os dados orbitais agora.</div>
          ) : iss.data.passes.length === 0 ? (
            <div className="sky-apod-skel">Nenhuma passagem acima de 10° nos próximos 3 dias.</div>
          ) : (
            <div className="sky-iss">
              {iss.data.passes.slice(0, 6).map((p, i) => (
                <div className={"sky-iss-row" + (p.visible ? " is-visible" : "")} key={i}>
                  <span className="sky-iss-when">
                    <span className="sky-iss-day">{fmtDM(p.peak)}</span>
                    <span className="mono">{fmtT(p.start)}</span>
                  </span>
                  <span className="sky-iss-path mono">
                    {p.dirStart} → {p.dirPeak} → {p.dirEnd}
                  </span>
                  <span className="sky-iss-el mono">{p.maxEl}°</span>
                  <span className="sky-iss-dur mono">{fmtMin(p.durationSec)}</span>
                  <span className={"sky-badge " + (p.visible ? "is-on" : "is-up")}>
                    {p.visible ? "visível" : "diurna"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Events calendar ── */}
        <section className="sky-card">
          <div className="sky-card-eyebrow">
            <ClockIcon width={13} height={13} /> Calendário astronômico
          </div>
          <div className="sky-events">
            {events.map((e, i) => {
              const d = daysUntil(e.date, now);
              return (
                <div className={"sky-ev sky-ev--" + e.kind} key={i}>
                  <span className="sky-ev-emoji">{e.emoji}</span>
                  <span className="sky-ev-title">{e.title}</span>
                  <span className="sky-ev-date mono">{fmtDM(e.date)}</span>
                  <span className="sky-ev-rel">{d === 0 ? "hoje" : `em ${d}d`}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Near-Earth asteroids (NASA NeoWs) ── */}
        <section className="sky-card">
          <div className="sky-card-head">
            <div className="sky-card-eyebrow">
              <StarIcon width={13} height={13} /> NASA · Asteroides próximos hoje
            </div>
            {neo.data && (
              <span className="sky-count">
                {neo.data.count} objeto(s)
                {neo.data.hazardous > 0 ? ` · ${neo.data.hazardous} de risco` : ""}
              </span>
            )}
          </div>
          {neo.loading ? (
            <div className="sky-apod-skel">Consultando NeoWs…</div>
          ) : neo.error ? (
            <div className="sky-apod-skel">Não foi possível carregar os asteroides agora.</div>
          ) : neo.data.count === 0 ? (
            <div className="sky-apod-skel">Nenhuma aproximação registrada para hoje.</div>
          ) : (
            <div className="sky-neo">
              {neo.data.objects.slice(0, 8).map((o) => (
                <a className="sky-neo-row" key={o.name} href={o.url} target="_blank" rel="noopener noreferrer">
                  <span className="sky-neo-name">
                    {o.hazardous && (
                      <span className="sky-neo-flag" title="Potencialmente perigoso">
                        ⚠
                      </span>
                    )}
                    {o.name}
                  </span>
                  <span className="sky-neo-meta">
                    <span>⌀ {meters(o.dMin, o.dMax)}</span>
                    <span className="mono">{km(o.missKm)}</span>
                    {o.lunar != null && <span className="sky-neo-lunar">{o.lunar.toFixed(1)}× Lua</span>}
                    <span className="mono">{o.velKmh ? intFmt.format(Math.round(o.velKmh)) + " km/h" : "—"}</span>
                  </span>
                </a>
              ))}
            </div>
          )}
        </section>

        <p className="sky-foot">
          Efemérides via astronomy-engine · imagem e asteroides via NASA Open APIs · horários locais ({CITY}, UTC−4).
        </p>
      </div>
    </div>
  );
}
