/* Containers.jsx — homelab Docker apps.
   Renders a card per container from CONTAINERS (built from settings.yml).
   Live status (running, uptime, health, ip) is polled from the embedded
   backend at /api/containers/status every 4 seconds.

   Icons come from selfh.st/icons via the jsDelivr CDN; the SVG is rendered
   as a silhouette via a CSS filter so it matches the active theme. */

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, XIcon } from "./icons.jsx";
import { CONTAINERS } from "./config.js";

const ICON_CDN = "https://cdn.jsdelivr.net/gh/selfhst/icons/svg";
const POLL_MS = 4000;

function useContainerStatus(names) {
  const [data, setData] = useState({});
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!names.length) return undefined;
    let alive = true;
    let timer = null;

    async function tick() {
      try {
        const r = await fetch("/api/containers/status", { cache: "no-store" });
        if (!r.ok) throw new Error("bad");
        const j = await r.json();
        if (!alive) return;
        setData(j);
        setError(false);
      } catch {
        if (!alive) return;
        setError(true);
      } finally {
        if (alive) timer = setTimeout(tick, POLL_MS);
      }
    }
    tick();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [names.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, error };
}

function formatUptime(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h}h ${rm}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}

function healthLabel(state) {
  if (!state) return null;
  if (!state.running) return state.status === "exited" ? "parado" : state.status || "parado";
  if (state.health === "healthy") return "saudável";
  if (state.health === "unhealthy") return "instável";
  if (state.health === "starting") return "iniciando";
  return "ativo";
}

function ContainerCard({ item, state }) {
  const running = !!state?.running;
  const unhealthy = state?.health === "unhealthy";
  const ok = running && !unhealthy;
  const mod = ok ? "is-ok" : "is-down";
  const iconUrl = `${ICON_CDN}/${item.icon}.svg`;

  return (
    <a className={`ct-card ${mod}`} href={item.url} target="_blank" rel="noopener noreferrer" title={item.name}>
      <div className="ct-icon-wrap">
        <img
          className="ct-icon"
          src={iconUrl}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement?.classList.add("ct-icon-wrap--fallback");
          }}
        />
        <span className="ct-icon-fallback" aria-hidden="true">
          {item.name.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="ct-meta">
        <span className="ct-name">{item.name}</span>
        <span className="ct-status mono">
          {ok ? <CheckIcon width={11} height={11} /> : <XIcon width={11} height={11} />}
          {healthLabel(state) || (state ? "—" : "…")}
        </span>
      </div>

      <div className="ct-popover" role="tooltip">
        <div className="ct-pop-row">
          <span className="ct-pop-label">Estado</span>
          <span className="ct-pop-val">
            <span className={`ct-dot ${ok ? "is-ok" : "is-down"}`} />
            {state ? state.status || (running ? "running" : "stopped") : "—"}
          </span>
        </div>
        <div className="ct-pop-row">
          <span className="ct-pop-label">Saúde</span>
          <span className="ct-pop-val">{state?.health || (running ? "n/d" : "—")}</span>
        </div>
        <div className="ct-pop-row">
          <span className="ct-pop-label">Tempo</span>
          <span className="ct-pop-val mono">{formatUptime(state?.uptimeSeconds)}</span>
        </div>
        <div className="ct-pop-row">
          <span className="ct-pop-label">IP</span>
          <span className="ct-pop-val mono">{state?.ip || "—"}</span>
        </div>
      </div>
    </a>
  );
}

export default function Containers() {
  const items = CONTAINERS;
  const names = useMemo(() => items.map((c) => c.container), [items]);
  const { data, error } = useContainerStatus(names);

  if (!items.length) return null;

  const okCount = items.filter((it) => {
    const s = data[it.container];
    return s && s.running && s.health !== "unhealthy";
  }).length;

  return (
    <section className="ct-section">
      <div className="ct-header">
        <span className="eyebrow">Containers · {items.length}</span>
        <span className="ct-summary mono">
          {error ? (
            <span className="ct-summary-err">backend offline</span>
          ) : (
            <>
              <span className="ct-summary-ok">{okCount}</span>
              <span className="ct-summary-sep">/</span>
              <span>{items.length} ativos</span>
            </>
          )}
        </span>
      </div>
      <div className="ct-grid">
        {items.map((it) => (
          <ContainerCard key={it.key} item={it} state={data[it.container]} />
        ))}
      </div>
    </section>
  );
}
