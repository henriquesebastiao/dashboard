import { useState, useEffect, useRef, useMemo } from "react";
import { ArrowLeftIcon, SunIcon, MoonIcon, ClockIcon, CheckIcon } from "./icons.jsx";
import { useTheme } from "./theme.js";
import {
  CATEGORIES,
  WEEK,
  HABITS,
  WEEKDAY_NAMES,
  blocksFor,
  timeToMin,
  blockSpan,
  scheduleStatus,
} from "./schedule.js";
import "./agenda.css";

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const HOUR_H = 48; /* px por hora na grade */
const PXM = HOUR_H / 60;
const DAYS = Object.keys(WEEK).map(Number); /* [0..6] */
const WEEKDAY_FULL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/* media query → boolean, reativo */
function useMediaQuery(q) {
  const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(q).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setMatch(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [q]);
  return match;
}

function fmtFullDate(d) {
  const s = d.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cat(key) {
  return CATEGORIES[key] || { label: key, color: "#a3a3a3" };
}

/* expande os blocos de um dia em segmentos posicionáveis [sMin,eMin];
   um bloco que cruza a meia-noite vira dois segmentos (noite + manhã). */
function daySegments(blocks) {
  const segs = [];
  blocks.forEach((b, i) => {
    const s = timeToMin(b.start);
    const e = timeToMin(b.end);
    if (e <= s) {
      segs.push({ block: b, sMin: s, eMin: 1440, key: i + "a", tail: true });
      if (e > 0) segs.push({ block: b, sMin: 0, eMin: e, key: i + "b", head: true });
    } else {
      segs.push({ block: b, sMin: s, eMin: e, key: i + "" });
    }
  });
  return segs;
}

/* ── faixa "Agora" (sempre no topo, largura total) ──────────────── */
function NowStrip({ status }) {
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
      <div className="ag-now-main">
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
      </div>
      {next && (
        <div className="ag-now-side">
          <span className="ag-now-eyebrow">A seguir</span>
          <div className="ag-now-next-title">{next.title}</div>
          <div className="ag-now-next-time mono">{next.start}</div>
        </div>
      )}
    </div>
  );
}

/* ── grade semanal (estilo calendário) ─────────────────────────── */
function WeekGrid({ now, today, status, onPickDay }) {
  const scrollRef = useRef(null);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const total = 24 * HOUR_H;
  const hours = Array.from({ length: 24 }, (_, i) => i);

  /* rola até perto do horário atual ao montar */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, nowMin * PXM - 160);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="ag-cal">
      <div className="ag-cal-head">
        <div className="ag-cal-corner" />
        {DAYS.map((d) => (
          <button
            key={d}
            className={"ag-cal-dayhead" + (d === today ? " is-today" : "")}
            onClick={() => onPickDay(d)}
            title={`Ver ${WEEKDAY_FULL[d]}`}
          >
            <span className="ag-cal-dayname">{WEEKDAY_NAMES[d]}</span>
            {d === today && <span className="ag-cal-todaydot" />}
          </button>
        ))}
      </div>

      <div className="ag-cal-scroll" ref={scrollRef}>
        <div className="ag-cal-grid" style={{ height: total }}>
          <div className="ag-cal-gutter">
            {hours.map((h) => (
              <span key={h} className="ag-cal-hour" style={{ top: h * HOUR_H }}>
                {h === 0 ? "" : `${pad(h)}:00`}
              </span>
            ))}
          </div>

          <div className="ag-cal-cols" style={{ "--hh": `${HOUR_H}px` }}>
            {DAYS.map((d) => {
              const segs = daySegments(blocksFor(d));
              const isToday = d === today;
              return (
                <div key={d} className={"ag-cal-col" + (isToday ? " is-today" : "")}>
                  {segs.map((sg) => {
                    const c = cat(sg.block.cat);
                    const h = (sg.eMin - sg.sMin) * PXM;
                    const past = isToday && sg.eMin <= nowMin;
                    const live = isToday && status.current === sg.block;
                    return (
                      <div
                        key={sg.key}
                        className={
                          "ag-ev" + (past ? " is-past" : "") + (live ? " is-now" : "") + (h < 34 ? " is-tiny" : "")
                        }
                        style={{ top: sg.sMin * PXM, height: Math.max(h - 2, 16), "--cat": c.color }}
                        title={`${sg.block.start}–${sg.block.end} · ${sg.block.title}`}
                      >
                        <span className="ag-ev-title">{sg.block.title}</span>
                        <span className="ag-ev-time mono">{sg.block.start}</span>
                      </div>
                    );
                  })}
                  {isToday && (
                    <div className="ag-cal-nowline" style={{ top: nowMin * PXM }}>
                      <span className="ag-cal-nowdot" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── uma linha da timeline (modo Dia) ──────────────────────────── */
function TimelineRow({ block, state }) {
  const c = cat(block.cat);
  const span = blockSpan(block);
  const dur = span >= 60 ? `${Math.floor(span / 60)}h${span % 60 ? pad(span % 60) : ""}` : `${span}min`;
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
          <span className="ag-row-dur mono">{dur}</span>
          {block.note && <span className="ag-row-note">{block.note}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── checklist de hábitos ──────────────────────────────────────── */
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

/* resumo de tempo por categoria no dia escolhido */
function DaySummary({ blocks }) {
  const totals = useMemo(() => {
    const m = {};
    for (const b of blocks) m[b.cat] = (m[b.cat] || 0) + blockSpan(b);
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .map(([k, mins]) => ({ ...cat(k), mins }));
  }, [blocks]);
  return (
    <section className="ag-summary">
      <div className="ag-section-head">
        <h2>Tempo por categoria</h2>
      </div>
      <div className="ag-summary-list">
        {totals.map((t) => (
          <div key={t.label} className="ag-summary-row" style={{ "--cat": t.color }}>
            <span className="ag-summary-dot" />
            <span className="ag-summary-label">{t.label}</span>
            <span className="ag-summary-val mono">
              {Math.floor(t.mins / 60)}h{t.mins % 60 ? pad(t.mins % 60) : ""}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── modo Dia ──────────────────────────────────────────────────── */
function DayView({ now, today, day, setDay, status }) {
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
    <>
      <nav className="ag-days">
        {DAYS.map((d) => (
          <button
            key={d}
            className={"ag-day" + (d === day ? " is-active" : "") + (d === today ? " is-today" : "")}
            onClick={() => setDay(d)}
          >
            {WEEKDAY_NAMES[d]}
          </button>
        ))}
      </nav>

      <div className="ag-day-grid">
        <section className="ag-timeline">
          {blocks.map((b, i) => (
            <TimelineRow key={i} block={b} state={rowState(b)} />
          ))}
        </section>
        <aside className="ag-day-side">
          {isToday && <Habits now={now} />}
          <DaySummary blocks={blocks} />
        </aside>
      </div>
    </>
  );
}

/* ── página ────────────────────────────────────────────────────── */
export default function Agenda() {
  const now = useNow();
  const { theme, toggle } = useTheme();
  const today = now.getDay();
  const isMobile = useMediaQuery("(max-width: 760px)");
  const [day, setDay] = useState(today);
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem("agenda.view") || "auto";
    } catch {
      return "auto";
    }
  });

  /* view efetiva: respeita escolha do usuário; "auto" decide por tela */
  const effView = view === "auto" ? (isMobile ? "dia" : "semana") : view;

  const setViewPersist = (v) => {
    setView(v);
    try {
      localStorage.setItem("agenda.view", v);
    } catch {
      /* ignore */
    }
  };

  const status = scheduleStatus(now);

  const pickDay = (d) => {
    setDay(d);
    setViewPersist("dia");
  };

  return (
    <div className={"dash agenda-root" + (theme === "light" ? " light" : "")}>
      <div className="ag-wrap">
        <header className="ag-top">
          <a className="ag-back" href="#/" aria-label="Voltar ao dashboard">
            <ArrowLeftIcon width={18} height={18} />
            <span>Dashboard</span>
          </a>
          <div className="ag-top-right">
            <div className="ag-viewtabs" role="tablist">
              <button
                className={"ag-viewtab" + (effView === "semana" ? " is-active" : "")}
                onClick={() => setViewPersist("semana")}
                role="tab"
                aria-selected={effView === "semana"}
              >
                Semana
              </button>
              <button
                className={"ag-viewtab" + (effView === "dia" ? " is-active" : "")}
                onClick={() => setViewPersist("dia")}
                role="tab"
                aria-selected={effView === "dia"}
              >
                Dia
              </button>
            </div>
            <button className="icon-btn" onClick={toggle} title="Alternar tema" aria-label="Alternar tema">
              {theme === "light" ? <MoonIcon width={18} height={18} /> : <SunIcon width={18} height={18} />}
            </button>
          </div>
        </header>

        <div className="ag-title-row">
          <h1>Agenda</h1>
          <div className="ag-date">{fmtFullDate(now)}</div>
        </div>

        <NowStrip status={status} />

        {effView === "semana" ? (
          <WeekGrid now={now} today={today} status={status} onPickDay={pickDay} />
        ) : (
          <DayView now={now} today={today} day={day} setDay={setDay} status={status} />
        )}
      </div>
    </div>
  );
}
