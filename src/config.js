/* config.js — app configuration loaded from /config/settings.yml.
   The YAML is parsed at build time by @rollup/plugin-yaml. Edit
   config/settings.yml (not this file) to change widgets, location
   and shortcut links. */

import settings from "../config/settings.yml";
import {
  MailIcon,
  CalendarIcon,
  ChatIcon,
  DriveIcon,
  GitHubIcon,
  YouTubeIcon,
  SparkIcon,
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
  ArrowRightIcon,
} from "./icons.jsx";

/* registry: icon key (used in YAML) -> component */
export const ICONS = {
  calendar: CalendarIcon,
  drive: DriveIcon,
  mail: MailIcon,
  chat: ChatIcon,
  linkedin: LinkedInIcon,
  github: GitHubIcon,
  pypi: PyPIIcon,
  cloudflare: CloudflareIcon,
  dockerhub: DockerHubIcon,
  python: PythonDocsIcon,
  fastapi: FastAPIDocsIcon,
  django: DjangoDocsIcon,
  nextjs: NextJSDocsIcon,
  micropython: MicropythonDocsIcon,
  docker: DockerDocsIcon,
  cheatsheets: CheatsheetsIcon,
  youtube: YouTubeIcon,
  claude: ClaudeIcon,
  chatgpt: SparkIcon,
  udemy: UdemyIcon,
  cs50x: CS50xIcon,
  roadmap: RoadmapIcon,
  ifmt: IFMTIcon,
  gupy: GupyIcon,
  glassdoor: GlassdoorIcon,
  solides: SolidesIcon,
  energisa: EnergisaIcon,
  dae: DAEIcon,
  bancocentral: BancoCentralIcon,
};

/* ── location ── */
export const LOCATION = {
  city: "Aripuanã",
  latitude: -10.1667,
  longitude: -59.4583,
  ...(settings.location || {}),
};

/* ── widget toggles (default: everything on) ── */
export const WIDGETS = {
  clock: true,
  weather: true,
  forecast: true,
  agenda: true,
  skyNow: true,
  facts: true,
  ...(settings.widgets || {}),
};

/* ── shortcut links ── */
const linkCfg = settings.links || {};
const items = linkCfg.items || [];

/* category order: explicit list, else first-seen order from items */
export const LINK_CATEGORIES =
  linkCfg.categories && linkCfg.categories.length
    ? linkCfg.categories
    : [...new Set(items.map((l) => l.category).filter(Boolean))];

export const LINKS = items.map((l, i) => ({
  key: `${l.category || "x"}-${i}`,
  label: l.name,
  url: l.url,
  cat: l.category,
  Icon: ICONS[l.icon] || ArrowRightIcon,
}));
