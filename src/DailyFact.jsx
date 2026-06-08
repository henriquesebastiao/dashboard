/* DailyFact.jsx — "Neste dia" daily curiosity.
   Wikipedia (pt) On this day feed — free, no key, CORS-enabled.
   Cached per day in localStorage. Click the refresh icon to cycle facts. */

import { useState, useEffect } from "react";
import { StarIcon, RefreshIcon, ArrowRightIcon } from "./icons.jsx";

const pad = (n) => String(n).padStart(2, "0");
const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);

async function loadEvents(date) {
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const key = `dash.onthisday.${mm}-${dd}`;
  try {
    const cached = localStorage.getItem(key);
    if (cached) return JSON.parse(cached);
  } catch {
    /* ignore */
  }

  const r = await fetch(`https://pt.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
  if (!r.ok) throw new Error("onthisday " + r.status);
  const j = await r.json();
  const list = (j.events || [])
    .filter((e) => e.text && e.year)
    .map((e) => {
      const page = e.pages?.[0];
      return {
        year: e.year,
        text: e.text,
        title: page?.normalizedtitle || null,
        url: page?.content_urls?.desktop?.page || null,
      };
    })
    .sort((a, b) => a.year - b.year);

  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export default function DailyFact() {
  const [state, setState] = useState({ loading: true });
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let on = true;
    const today = new Date();
    loadEvents(today)
      .then((list) => {
        if (!on) return;
        setState({ loading: false, list });
        if (list.length) setIdx(dayOfYear(today) % list.length); // stable pick for the day
      })
      .catch(() => on && setState({ loading: false, error: true }));
    return () => {
      on = false;
    };
  }, []);

  const list = state.list || [];
  const fact = list[idx];
  const cycle = () => setIdx((i) => (i + 1) % list.length);

  return (
    <section className="fact-card">
      <div className="fact-top">
        <span className="fact-eyebrow">
          <StarIcon width={13} height={13} />
          Curiosidade · Neste dia
        </span>
        {list.length > 1 && (
          <button className="fact-refresh" onClick={cycle} title="Outra curiosidade" aria-label="Outra curiosidade">
            <RefreshIcon width={15} height={15} />
          </button>
        )}
      </div>

      {state.loading ? (
        <div className="fact-body fact-body--muted">Carregando…</div>
      ) : state.error || !fact ? (
        <div className="fact-body fact-body--muted">Não foi possível carregar a curiosidade de hoje.</div>
      ) : (
        <div className="fact-body">
          <span className="fact-year mono">{fact.year}</span>
          <p className="fact-text">{fact.text}</p>
          {fact.url && (
            <a className="fact-link" href={fact.url} target="_blank" rel="noopener noreferrer">
              {fact.title || "Wikipedia"}
              <ArrowRightIcon width={13} height={13} />
            </a>
          )}
        </div>
      )}
    </section>
  );
}
