/* Search.jsx — dashboard search bar.
   Left selector picks the engine: "Links" filters the page's own links
   (good once there are many), the others open a web search in a new tab. */

import { useState, useRef, useEffect, useMemo } from "react";
import {
  SearchIcon,
  ChevronDownIcon,
  GoogleIcon,
  DuckDuckGoIcon,
  LinkIcon,
  GitHubIcon,
  YouTubeIcon,
} from "./icons.jsx";

/* accent- and case-insensitive normalize for matching */
const norm = (s) =>
  (s || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const ENGINES = [
  { id: "links", label: "Links", Icon: LinkIcon, placeholder: "Filtrar links da página…" },
  {
    id: "google",
    label: "Google",
    Icon: GoogleIcon,
    placeholder: "Buscar no Google…",
    url: (q) => `https://www.google.com/search?q=${q}`,
  },
  {
    id: "ddg",
    label: "DuckDuckGo",
    Icon: DuckDuckGoIcon,
    placeholder: "Buscar no DuckDuckGo…",
    url: (q) => `https://duckduckgo.com/?q=${q}`,
  },
  {
    id: "youtube",
    label: "YouTube",
    Icon: YouTubeIcon,
    placeholder: "Buscar no YouTube…",
    url: (q) => `https://www.youtube.com/results?search_query=${q}`,
  },
  {
    id: "github",
    label: "GitHub",
    Icon: GitHubIcon,
    placeholder: "Buscar no GitHub…",
    url: (q) => `https://github.com/search?q=${q}&type=repositories`,
  },
];

export default function Search({ links }) {
  const [engineId, setEngineId] = useState(() => {
    try {
      const s = localStorage.getItem("dash.searchEngine");
      if (s && ENGINES.some((e) => e.id === s)) return s;
    } catch {
      /* ignore */
    }
    return "links";
  });
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const engine = ENGINES.find((e) => e.id === engineId) || ENGINES[0];
  const isLinks = engine.id === "links";

  /* persist engine choice */
  useEffect(() => {
    try {
      localStorage.setItem("dash.searchEngine", engineId);
    } catch {
      /* ignore */
    }
  }, [engineId]);

  /* link matches (links mode only) */
  const matches = useMemo(() => {
    if (!isLinks) return [];
    const q = norm(query.trim());
    if (!q) return links;
    return links.filter((l) => norm(l.label).includes(q) || norm(l.cat).includes(q));
  }, [isLinks, query, links]);

  /* clamp highlight when results change */
  useEffect(() => {
    setActive(0);
  }, [query, engineId]);

  /* close menus on outside click */
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
        setResultsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* keyboard shortcut: "/" or ⌘/Ctrl+K focuses the field; Esc blurs it */
  useEffect(() => {
    const isEditable = (el) => el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
    const onKey = (e) => {
      const focused = document.activeElement === inputRef.current;
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isEditable(document.activeElement)) {
        e.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (e.key === "Escape" && focused) inputRef.current?.blur();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const pickEngine = (id) => {
    setEngineId(id);
    setMenuOpen(false);
    inputRef.current?.focus();
  };

  const openLink = (l) => {
    if (l) window.open(l.url, "_blank", "noopener,noreferrer");
  };

  const submit = (e) => {
    e.preventDefault();
    if (isLinks) {
      openLink(matches[active] || matches[0]);
      return;
    }
    const q = query.trim();
    if (!q) return;
    window.open(engine.url(encodeURIComponent(q)), "_blank", "noopener,noreferrer");
    setQuery("");
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      setResultsOpen(false);
      setMenuOpen(false);
      return;
    }
    if (!isLinks || !resultsOpen || matches.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + matches.length) % matches.length);
    }
  };

  const showResults = isLinks && resultsOpen && query.trim().length > 0;

  return (
    <div className="ed-search" ref={wrapRef}>
      <form className="search" onSubmit={submit}>
        {/* engine selector */}
        <button
          type="button"
          className={"search-engine" + (menuOpen ? " is-open" : "")}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={menuOpen}
        >
          <engine.Icon width={16} height={16} />
          <span className="search-engine-label">{engine.label}</span>
          <ChevronDownIcon className="chev" width={14} height={14} />
        </button>

        {/* input */}
        <label className="search-input-wrap">
          <SearchIcon width={17} height={17} />
          <input
            ref={inputRef}
            className="search-field"
            type="text"
            value={query}
            placeholder={engine.placeholder}
            onChange={(e) => {
              setQuery(e.target.value);
              setResultsOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setResultsOpen(true);
            }}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            spellCheck="false"
            aria-label="Campo de pesquisa"
          />
          {!focused && !query && <kbd className="search-kbd">/</kbd>}
        </label>
      </form>

      {/* engine dropdown */}
      {menuOpen && (
        <div className="search-menu" role="listbox">
          {ENGINES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={"search-opt" + (e.id === engineId ? " is-active" : "")}
              role="option"
              aria-selected={e.id === engineId}
              onClick={() => pickEngine(e.id)}
            >
              <e.Icon width={16} height={16} />
              {e.label}
            </button>
          ))}
        </div>
      )}

      {/* link results */}
      {showResults &&
        (matches.length > 0 ? (
          <div className="search-results">
            {matches.map((l, i) => (
              <a
                key={l.label + l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className={"search-result" + (i === active ? " is-active" : "")}
                onMouseEnter={() => setActive(i)}
              >
                <span className="r-ico">
                  <l.Icon width={17} height={17} />
                </span>
                <span className="r-label">{l.label}</span>
                <span className="r-cat">{l.cat}</span>
              </a>
            ))}
          </div>
        ) : (
          <div className="search-results">
            <div className="search-empty">Nenhum link para “{query.trim()}”.</div>
          </div>
        ))}
    </div>
  );
}
