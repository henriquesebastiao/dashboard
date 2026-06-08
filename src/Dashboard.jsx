/* Dashboard.jsx — the Editorial dashboard.
   Live clock (24h, no seconds), live Open-Meteo weather for Aripuanã-MT,
   an "agora na agenda" card linking to the schedule page, and 8 links
   grouped by category. */

import { useState, useEffect, useMemo } from "react";
import {
  MailIcon,
  CalendarIcon,
  ChatIcon,
  DriveIcon,
  GitHubIcon,
  YouTubeIcon,
  SparkIcon,
  SunIcon,
  MoonIcon,
  DropIcon,
  WindIcon,
  ClockIcon,
  ArrowRightIcon,
  StarIcon,
  LinkedInIcon,
  ClaudeIcon,
  PyPIIcon,
  CloudflareIcon,
  DockerHubIcon,
  CheatsheetsIcon,
  PythonDocsIcon,
  FastAPIDocsIcon,
  DjangoDocsIcon,
  NextJSDocsIcon,
  MicropythonDocsIcon,
  DockerDocsIcon,
  UdemyIcon,
  CS50xIcon,
  RoadmapIcon,
  IFMTIcon,
  GupyIcon,
  GlassdoorIcon,
  SolidesIcon,
  EnergisaIcon,
  DAEIcon,
  BancoCentralIcon,
  WEATHER_ICON,
} from "./icons.jsx";
import { useTheme } from "./theme.js";
import { scheduleStatus, CATEGORIES } from "./schedule.js";
import { moonInfo, visiblePlanets } from "./astro.js";
import Search from "./Search.jsx";

/* ── data ───────────────────────────────────────────── */
const LAT = -10.1667,
  LON = -59.4583;
const CITY = "Aripuanã";

const LINKS = [
  // Cotidiano
  { label: "Agenda", url: "https://calendar.google.com", Icon: CalendarIcon, cat: "Cotidiano" },
  { label: "Drive", url: "https://drive.google.com", Icon: DriveIcon, cat: "Cotidiano" },
  { label: "Gmail", url: "https://mail.google.com", Icon: MailIcon, cat: "Cotidiano" },

  // Social
  { label: "WhatsApp", url: "https://web.whatsapp.com", Icon: ChatIcon, cat: "Social" },
  { label: "LinkedIn", url: "https://www.linkedin.com", Icon: LinkedInIcon, cat: "Social" },

  // Desenvolvimento
  { label: "GitHub", url: "https://github.com", Icon: GitHubIcon, cat: "Desenvolvimento" },
  { label: "PyPI", url: "https://pypi.org", Icon: PyPIIcon, cat: "Desenvolvimento" },
  { label: "Cloudflare", url: "https://dash.cloudflare.com", Icon: CloudflareIcon, cat: "Desenvolvimento" },
  { label: "Docker Hub", url: "https://hub.docker.com", Icon: DockerHubIcon, cat: "Desenvolvimento" },

  // Documentação
  { label: "Python", url: "https://docs.python.org/pt-br/3.14/", Icon: PythonDocsIcon, cat: "Documentação" },
  { label: "FastAPI", url: "https://fastapi.tiangolo.com/", Icon: FastAPIDocsIcon, cat: "Documentação" },
  { label: "Django", url: "https://docs.djangoproject.com/pt-br/", Icon: DjangoDocsIcon, cat: "Documentação" },
  { label: "NextJS", url: "https://nextjs.org/docs", Icon: NextJSDocsIcon, cat: "Documentação" },
  {
    label: "Micropython",
    url: "https://docs.micropython.org/en/latest/",
    Icon: MicropythonDocsIcon,
    cat: "Documentação",
  },
  { label: "Docker", url: "https://docs.docker.com/", Icon: DockerDocsIcon, cat: "Documentação" },

  // Ferramentas
  { label: "Cheatsheets", url: "https://cheatsheets.zip", Icon: CheatsheetsIcon, cat: "Ferramentas" },

  // Mídia
  { label: "YouTube", url: "https://www.youtube.com", Icon: YouTubeIcon, cat: "Mídia" },

  // IA
  { label: "Claude", url: "https://claude.ai", Icon: ClaudeIcon, cat: "IA" },
  { label: "ChatGPT", url: "https://chatgpt.com", Icon: SparkIcon, cat: "IA" },

  // Estudos
  { label: "Udemy", url: "https://www.udemy.com", Icon: UdemyIcon, cat: "Estudos" },
  { label: "CS50x", url: "https://cs50.harvard.edu/x/", Icon: CS50xIcon, cat: "Estudos" },
  { label: "Roadmap", url: "https://roadmap.sh/dashboard", Icon: RoadmapIcon, cat: "Estudos" },
  { label: "Seletivos IFMT", url: "https://seletivo.ifmt.edu.br/", Icon: IFMTIcon, cat: "Estudos" },

  // Vagas
  { label: "Gupy", url: "https://portal.gupy.io/my/applications", Icon: GupyIcon, cat: "Vagas" },
  { label: "Glassdoor", url: "https://www.glassdoor.com.br/", Icon: GlassdoorIcon, cat: "Vagas" },
  { label: "Sólides", url: "https://perfil.vagas.solides.com.br/", Icon: SolidesIcon, cat: "Vagas" },

  // Serviços
  { label: "Energisa", url: "https://servicos.energisa.com.br/home", Icon: EnergisaIcon, cat: "Serviços" },
  { label: "DAE", url: "https://aripuana.cogesan.com.br/portal", Icon: DAEIcon, cat: "Serviços" },
  { label: "Banco Central", url: "https://meubc.bcb.gov.br/meubc/", Icon: BancoCentralIcon, cat: "Serviços" },
];
const CATS = [
  "Cotidiano",
  "Desenvolvimento",
  "Documentação",
  "Ferramentas",
  "Mídia",
  "Social",
  "IA",
  "Estudos",
  "Vagas",
  "Serviços",
];

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
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m` +
    `&daily=sunrise,sunset,daylight_duration&forecast_days=1&timezone=auto`;
  _weatherPromise = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error("net");
      return r.json();
    })
    .then((d) => {
      const c = d.current;
      const day = d.daily || {};
      const [iconKey, label] = mapWeather(c.weather_code);
      const w = {
        temp: Math.round(c.temperature_2m),
        feels: Math.round(c.apparent_temperature),
        humidity: Math.round(c.relative_humidity_2m),
        wind: Math.round(c.wind_speed_10m),
        sunrise: day.sunrise?.[0] || null,
        sunset: day.sunset?.[0] || null,
        daylight: day.daylight_duration?.[0] || null,
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
  return (
    <a className="astro-card" href="#/astro">
      <div className="astro-eyebrow">
        <span>
          <StarIcon width={13} height={13} />
          Céu agora · {CITY}
        </span>
        <ArrowRightIcon width={15} height={15} className="astro-go" />
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
    </a>
  );
}

/* ════════════════════════════════════════════════════
   EDITORIAL BOARD  (structured cards / numbered)
   ════════════════════════════════════════════════════ */
function EditorialBoard({ now, weather, links }) {
  const WI = WEATHER_ICON[weather.iconKey || "cloud"] || WEATHER_ICON.cloud;
  return (
    <div className="ed-board">
      {/* header: clock left, weather card right */}
      <div className="ed-header">
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

        <div className="ed-side">
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
          <AgendaCard now={now} />
        </div>
      </div>

      {/* astronomia */}
      <AstroCard now={now} weather={weather} />

      {/* search bar */}
      <Search links={links} />

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
  const { theme, toggle } = useTheme();

  return (
    <div className={"dash" + (theme === "light" ? " light" : "")}>
      <EditorialBoard now={now} weather={weather} links={LINKS} />
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
