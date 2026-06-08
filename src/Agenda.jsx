import { useState, useEffect } from "react";
import { ArrowLeftIcon, SunIcon, MoonIcon, ClockIcon, CheckIcon } from "./icons.jsx";
import { useTheme } from "./theme.js";
import { CATEGORIES, WEEK, HABITS, WEEKDAY_NAMES, blocksFor, timeToMin, scheduleStatus } from "./schedule.js";
import "./agenda.css";

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function fmtFullDate(d) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cat(key) {
  return CATEGORIES[key] || { label: key, color: "#a3a3a3" };
}

/* ── featured "Agora" card ─────────────────────────────────────── */
function NowCard({ status }) {
  const { current, next, progress } = status;
  if (!current) {
    return (
      <div className="ag-now ag-now--free">
        <div className="ag-now-eyebrow">Agora</div>
        <div className="ag-now-title">Tempo livre</div>
        {next && (
          <div className="ag-now-next">
            A seguir · <strong>{next.start}</strong> {next.title}
          </div>
        )}
      </div>
    );
  }
  const c = cat(current.cat);
  return (
    <div className="ag-now" style={{ "--cat": c.color }}>
      <div className="ag-now-head">
        <span className="ag-now-eyebrow">Agora</span>
        <span className="ag-cat-tag" style={{ "--cat": c.color }}>
          {c.label}
        </span>
      </div>
      <div className="ag-now-title">{current.title}</div>
      <div className="ag-now-range">
        <ClockIcon width={15} height={15} />
        {current.start} – {current.end}
        {current.note && <span className="ag-now-note">· {current.note}</span>}
      </div>
      <div className="ag-progress">
        <div className="ag-progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      {next && (
        <div className="ag-now-next">
          A seguir · <strong>{next.start}</strong> {next.title}
        </div>
      )}
    </div>
  );
}

/* ── one timeline row ──────────────────────────────────────────── */
function TimelineRow({ block, state }) {
  const c = cat(block.cat);
  return (
    <div className={"ag-row ag-row--" + state} style={{ "--cat": c.color }}>
      <div className="ag-row-time">
        <span className="ag-row-start">{block.start}</span>
        <span className="ag-row-end">{block.end}</span>
      </div>
      <div className="ag-row-rail">
        <span className="ag-row-dot" />
      </div>
      <div className="ag-row-body">
        <div className="ag-row-title">{block.title}</div>
        <div className="ag-row-meta">
          <span className="ag-cat-tag ag-cat-tag--sm" style={{ "--cat": c.color }}>
            {c.label}
          </span>
          {block.note && <span className="ag-row-note">{block.note}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── habits checklist ──────────────────────────────────────────── */
function Habits({ now }) {
  const key = "agenda.habits." + ymd(now);
  const [done, setDone] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || "[]"));
    } catch {
      return new Set();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...done]));
    } catch {
      /* ignore */
    }
  }, [key, done]);

  const toggle = (id) =>
    setDone((prev) => {
      const nextSet = new Set(prev);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });

  const count = HABITS.filter((h) => done.has(h.id)).length;
  return (
    <section className="ag-habits">
      <div className="ag-section-head">
        <h2>Hábitos de hoje</h2>
        <span className="ag-habits-count">
          {count}/{HABITS.length}
        </span>
      </div>
      <div className="ag-habits-grid">
        {HABITS.map((h) => {
          const on = done.has(h.id);
          return (
            <button
              key={h.id}
              className={"ag-habit" + (on ? " is-on" : "")}
              onClick={() => toggle(h.id)}
              aria-pressed={on}
            >
              <span className="ag-habit-box">{on && <CheckIcon width={13} height={13} />}</span>
              {h.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ── page ──────────────────────────────────────────────────────── */
export default function Agenda() {
  const now = useNow();
  const { theme, toggle } = useTheme();
  const today = now.getDay();
  const [day, setDay] = useState(today);

  const status = scheduleStatus(now);
  const blocks = blocksFor(day);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const isToday = day === today;

  const rowState = (b) => {
    if (!isToday) return "idle";
    if (status.current && b === status.current) return "now";
    const e = timeToMin(b.end);
    const s = timeToMin(b.start);
    const wraps = e <= s;
    if (!wraps && e <= nowMin) return "past";
    return "idle";
  };

  return (
    <div className={"dash agenda-root" + (theme === "light" ? " light" : "")}>
      <div className="ag-wrap">
        <header className="ag-top">
          <a className="ag-back" href="#/" aria-label="Voltar ao dashboard">
            <ArrowLeftIcon width={18} height={18} />
            <span>Dashboard</span>
          </a>
          <button className="icon-btn" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
            {theme === "light" ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
          </button>
        </header>

        <div className="ag-title-row">
          <h1>Agenda</h1>
          <div className="ag-date">{fmtFullDate(now)}</div>
        </div>

        <NowCard status={status} />

        <nav className="ag-days">
          {Object.keys(WEEK).map((d) => {
            const n = Number(d);
            return (
              <button
                key={d}
                className={"ag-day" + (n === day ? " is-active" : "") + (n === today ? " is-today" : "")}
                onClick={() => setDay(n)}
              >
                {WEEKDAY_NAMES[n]}
              </button>
            );
          })}
        </nav>

        <section className="ag-timeline">
          {blocks.map((b, i) => (
            <TimelineRow key={i} block={b} state={rowState(b)} />
          ))}
        </section>

        {isToday && <Habits now={now} />}

        <p className="ag-foot">
          Total de {blocks.length} blocos ·{" "}
          {Object.values(CATEGORIES)
            .map((c) => c.label)
            .join(" · ")}
        </p>
      </div>
    </div>
  );
}
