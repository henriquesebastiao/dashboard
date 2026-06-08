/* icons.jsx — monochrome glyph set.
   Brand marks come from Simple Icons (`simple-icons`); generic UI + weather
   glyphs stay hand-drawn in the design-system language (stroke 1.8, round
   caps, currentColor). A few brands Simple Icons omits (LinkedIn, ChatGPT)
   and generic tools (Cheatsheets) are hand-drawn fallbacks below. */

import {
  siGmail,
  siGooglecalendar,
  siGoogledrive,
  siWhatsapp,
  siGithub,
  siYoutube,
  siClaude,
  siPypi,
  siCloudflare,
  siDocker,
  siPython,
  siFastapi,
  siDjango,
  siNextdotjs,
  siMicropython,
  siGoogle,
  siDuckduckgo,
  siUdemy,
  siGlassdoor,
  siRoadmapdotsh,
} from "simple-icons";

const _o = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* ── brand glyphs (Simple Icons) ──
   Each renders the brand's single currentColor path so the theme drives it. */
function brand(icon) {
  function BrandIcon(p) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
        <path d={icon.path} />
      </svg>
    );
  }
  return BrandIcon;
}

export const MailIcon = brand(siGmail);
export const CalendarIcon = brand(siGooglecalendar);
export const DriveIcon = brand(siGoogledrive);
export const ChatIcon = brand(siWhatsapp);
export const GitHubIcon = brand(siGithub);
export const YouTubeIcon = brand(siYoutube);
export const ClaudeIcon = brand(siClaude);
export const PyPIIcon = brand(siPypi);
export const CloudflareIcon = brand(siCloudflare);
export const DockerHubIcon = brand(siDocker);
export const DockerDocsIcon = DockerHubIcon;
export const PythonDocsIcon = brand(siPython);
export const FastAPIDocsIcon = brand(siFastapi);
export const DjangoDocsIcon = brand(siDjango);
export const NextJSDocsIcon = brand(siNextdotjs);
export const MicropythonDocsIcon = brand(siMicropython);
export const GoogleIcon = brand(siGoogle);
export const DuckDuckGoIcon = brand(siDuckduckgo);
export const UdemyIcon = brand(siUdemy);
export const GlassdoorIcon = brand(siGlassdoor);
export const RoadmapIcon = brand(siRoadmapdotsh);

/* ── lettermark fallbacks ──
   Brands/institutions Simple Icons lacks (Gupy, Sólides, IFMT, CS50x,
   Energisa, DAE, Banco Central) render as a rounded badge with initials. */
function lettermark(text, fontSize = 9.5) {
  function Mark(p) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
        <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <text
          x="12"
          y="12.6"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-sans)"
          fontSize={fontSize}
          fontWeight="700"
          letterSpacing="-0.04em"
          fill="currentColor"
          stroke="none"
        >
          {text}
        </text>
      </svg>
    );
  }
  return Mark;
}

export const GupyIcon = lettermark("G", 12);
export const SolidesIcon = lettermark("S", 12);
export const IFMTIcon = lettermark("IF", 10);
export const CS50xIcon = lettermark("CS", 10);
export const EnergisaIcon = lettermark("E", 12);
export const DAEIcon = lettermark("DAE", 7);
export const BancoCentralIcon = lettermark("BC", 10);

/* ── hand-drawn fallbacks (not in Simple Icons) ── */
export function LinkedInIcon(p) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21H9z" />
    </svg>
  );
}
export function SparkIcon(p) {
  /* ChatGPT — Simple Icons dropped OpenAI's mark, so this stays hand-drawn */
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M12 3.5c.3 3.4 1.6 4.8 5 5.5-3.4.7-4.7 2.1-5 5.5-.3-3.4-1.6-4.8-5-5.5 3.4-.7 4.7-2.1 5-5.5Z" />
      <path d="M18.5 14.5c.16 1.7.84 2.4 2.5 2.75-1.66.35-2.34 1.05-2.5 2.75-.16-1.7-.84-2.4-2.5-2.75 1.66-.35 2.34-1.05 2.5-2.75Z" />
    </svg>
  );
}
export function CheatsheetsIcon(p) {
  /* stacked sheets w/ lines */
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <rect x="4" y="3.5" width="11" height="13" rx="1.5" />
      <path d="M17 6.5h1.5A1.5 1.5 0 0 1 20 8v11a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 19" />
      <path d="M7 7h5M7 10h5M7 13h3" />
    </svg>
  );
}

/* ── ui glyphs ── */
export function SunIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" />
    </svg>
  );
}
export function MoonIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}
export function DropIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M12 3.5c3 3.6 5.5 6.4 5.5 9.5a5.5 5.5 0 0 1-11 0c0-3.1 2.5-5.9 5.5-9.5Z" />
    </svg>
  );
}
export function WindIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M3 9h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 14h15a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 19h7" />
    </svg>
  );
}
export function ClockIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}
export function ArrowLeftIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}
export function ArrowRightIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function CheckIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}
export function StarIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M12 3.2l2.2 5.2 5.6.5-4.3 3.7 1.3 5.5L12 20.4 7.2 21.8l1.3-5.5-4.3-3.7 5.6-.5z" />
    </svg>
  );
}
export function SearchIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}
export function ChevronDownIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
export function GlobeIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
export function LinkIcon(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M11 7l1.4-1.4a3.6 3.6 0 0 1 5 5L16 12" />
      <path d="M13 17l-1.4 1.4a3.6 3.6 0 0 1-5-5L8 12" />
      <path d="M9.5 14.5 14.5 9.5" />
    </svg>
  );
}

/* ── weather glyphs (WMO) ── */
function WSun(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M3 12h2.2M18.8 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6" />
    </svg>
  );
}
function WPartly(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <circle cx="8.5" cy="8.5" r="3" />
      <path d="M8.5 2.8v1.6M3.8 8.5H2.2M4.7 4.7l1.1 1.1M12.3 4.7l-1.1 1.1" />
      <path d="M7 19h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.4-.6A3.7 3.7 0 0 0 7 19Z" />
    </svg>
  );
}
function WCloud(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M7 18h10a3.8 3.8 0 0 0 .3-7.6 5.4 5.4 0 0 0-10.2-.7A4 4 0 0 0 7 18Z" />
    </svg>
  );
}
function WFog(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M6 12h10a3.5 3.5 0 0 0 .2-7 5 5 0 0 0-9.5-.6A3.7 3.7 0 0 0 6 12Z" />
      <path d="M4 16h13M6 19.5h10" />
    </svg>
  );
}
function WRain(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M7 14h10a3.7 3.7 0 0 0 .2-7.4 5.2 5.2 0 0 0-9.8-.6A3.8 3.8 0 0 0 7 14Z" />
      <path d="M9 17l-1 2.5M13 17l-1 2.5M16 17l-1 2.5" />
    </svg>
  );
}
function WDrizzle(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M7 14h10a3.7 3.7 0 0 0 .2-7.4 5.2 5.2 0 0 0-9.8-.6A3.8 3.8 0 0 0 7 14Z" />
      <path d="M9.5 17.5h.01M12.5 18.5h.01M15 17.5h.01" />
    </svg>
  );
}
function WThunder(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M7 13h10a3.7 3.7 0 0 0 .2-7.4 5.2 5.2 0 0 0-9.8-.6A3.8 3.8 0 0 0 7 13Z" />
      <path d="m12.5 14-2.5 3.5h2.5L10.5 21" />
    </svg>
  );
}
function WSnow(p) {
  return (
    <svg viewBox="0 0 24 24" {..._o} {...p}>
      <path d="M7 13h10a3.7 3.7 0 0 0 .2-7.4 5.2 5.2 0 0 0-9.8-.6A3.8 3.8 0 0 0 7 13Z" />
      <path d="M9 17.5h.01M12 19h.01M15 17.5h.01M12 16.5h.01" />
    </svg>
  );
}

export const WEATHER_ICON = {
  sun: WSun,
  partly: WPartly,
  cloud: WCloud,
  fog: WFog,
  rain: WRain,
  drizzle: WDrizzle,
  thunder: WThunder,
  snow: WSnow,
};
