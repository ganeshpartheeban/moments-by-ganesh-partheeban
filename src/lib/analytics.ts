/**
 * Tiny client-only analytics layer.
 *
 * - GA4 (gtag.js) loads lazily, only when VITE_GA4_ID is set, only after the
 *   first user interaction or ~3 s idle, and never when Do Not Track is on.
 * - Events are buffered until GA4 is ready; nothing runs during SSR.
 * - UTM params and `ref` from the landing URL are kept in sessionStorage and
 *   attached to every event and form submission.
 * - Dev, or `?debug_analytics=1`, logs every event to the console.
 */

type Params = Record<string, string | number | boolean | undefined | null>;
type Gtag = (...args: unknown[]) => void;
type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
  __rmsAnalyticsInit?: boolean;
};

const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim() || "";
const ATTR_KEY = "rms-attribution";
const DEBUG_KEY = "rms-debug-analytics";
const ATTR_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ref",
] as const;

type Attribution = Partial<Record<(typeof ATTR_PARAMS)[number], string>> & {
  landing_page?: string;
};

let debug = false;
let gaReady = false;
let gaStarted = false;
const queue: Array<{ event: string; params: Params }> = [];
let attribution: Attribution = {};

function safeSession(op: "get" | "set", key: string, value?: string): string | null {
  try {
    if (op === "set") {
      sessionStorage.setItem(key, value ?? "");
      return null;
    }
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function currentLocale(): string {
  return /^\/ta(?=[/?#]|$)/.test(window.location.pathname) ? "ta" : "en";
}

function captureAttribution() {
  const stored = safeSession("get", ATTR_KEY);
  if (stored) {
    try {
      attribution = JSON.parse(stored) as Attribution;
    } catch {
      attribution = {};
    }
  }
  const url = new URL(window.location.href);
  let changed = false;
  if (!attribution.landing_page) {
    attribution.landing_page = url.pathname + url.search;
    changed = true;
  }
  for (const k of ATTR_PARAMS) {
    const v = url.searchParams.get(k);
    if (v) {
      attribution[k] = v.slice(0, 120);
      changed = true;
    }
  }
  if (changed) safeSession("set", ATTR_KEY, JSON.stringify(attribution));
}

/** Attribution + context for form submissions (FormData-friendly strings). */
export function getAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return {
    utm_source: attribution.utm_source ?? "",
    utm_medium: attribution.utm_medium ?? "",
    utm_campaign: attribution.utm_campaign ?? "",
    utm_content: attribution.utm_content ?? "",
    utm_term: attribution.utm_term ?? "",
    ref: attribution.ref ?? "",
    landingPage: attribution.landing_page ?? "",
    page: window.location.pathname,
    locale: currentLocale(),
  };
}

function send(event: string, params: Params) {
  const w = window as AnalyticsWindow;
  if (w.gtag) w.gtag("event", event, params);
}

export function track(event: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const full: Params = {
    ...Object.fromEntries(
      Object.entries(attribution).filter(([, v]) => v),
    ),
    locale: currentLocale(),
    ...params,
  };
  if (debug) {
    // eslint-disable-next-line no-console
    console.log("[analytics]", event, full);
  }
  if (!GA4_ID) return;
  if (gaReady) send(event, full);
  else if (queue.length < 100) queue.push({ event, params: full });
}

function loadGA() {
  if (gaStarted || !GA4_ID) return;
  gaStarted = true;
  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // gtag.js requires the real `arguments` object.
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("js", new Date());
  w.gtag("config", GA4_ID, { send_page_view: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_ID)}`;
  document.head.appendChild(s);
  gaReady = true;
  for (const q of queue.splice(0)) send(q.event, q.params);
}

function scheduleGA() {
  if (!GA4_ID || navigator.doNotTrack === "1") return;
  const go = () => {
    cleanup();
    loadGA();
  };
  const evts = ["pointerdown", "keydown", "scroll"] as const;
  const cleanup = () => {
    evts.forEach((e) => window.removeEventListener(e, go));
    clearTimeout(timer);
  };
  evts.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
  const ric = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
  const timer = window.setTimeout(
    () => (ric ? ric(go, { timeout: 1000 }) : go()),
    3000,
  );
}

let lastPageKey = "";
export function trackPageView() {
  if (typeof window === "undefined") return;
  // Pathname only: search-param syncs (e.g. ?photo=N) are not page views.
  const key = window.location.pathname;
  if (key === lastPageKey) return;
  lastPageKey = key;
  resetScroll();
  // Let the route's <title> settle before reading it.
  window.setTimeout(() => {
    track("page_view", {
      page_path: window.location.pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, 0);
}

// ---- scroll depth ---------------------------------------------------------
let scrollSent = new Set<number>();
function resetScroll() {
  scrollSent = new Set();
}
let scrollTick = false;
function onScroll() {
  if (scrollTick) return;
  scrollTick = true;
  requestAnimationFrame(() => {
    scrollTick = false;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable < 200) return;
    const pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100;
    for (const mark of [50, 90]) {
      if (pct >= mark && !scrollSent.has(mark)) {
        scrollSent.add(mark);
        track("scroll_depth", { percent: mark, page_path: window.location.pathname });
      }
    }
  });
}

// ---- delegated clicks -----------------------------------------------------
function onClick(e: MouseEvent) {
  const el = e.target as Element | null;
  const a = el?.closest?.("a[href]") as HTMLAnchorElement | null;
  if (!a) return;
  const raw = a.getAttribute("href") || "";
  const where = window.location.pathname;
  if (/^tel:/i.test(raw)) return track("call_click", { page_path: where });
  if (/^mailto:/i.test(raw)) return track("email_click", { page_path: where });
  if (/^whatsapp:/i.test(raw)) return track("whatsapp_click", { page_path: where });
  let url: URL;
  try {
    url = new URL(a.href, window.location.href);
  } catch {
    return;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "wa.me" || host.endsWith("whatsapp.com")) {
    return track("whatsapp_click", { page_path: where });
  }
  if (url.origin === window.location.origin) {
    if (url.pathname === "/brochure.pdf") {
      return track("brochure_download", { page_path: where });
    }
    const m = url.pathname.match(/^\/work\/([^/]+)\/?$/);
    if (m) {
      return track("story_open", { slug: decodeURIComponent(m[1]), page_path: where });
    }
    return;
  }
  if (!/^https?:$/.test(url.protocol)) return;
  if (host.endsWith("instagram.com")) {
    return track("instagram_click", { destination: host, page_path: where });
  }
  if (host.endsWith("unsplash.com")) {
    return track("unsplash_click", { destination: host, page_path: where });
  }
  track("outbound_click", { destination: host, page_path: where });
}

// ---- form_start -----------------------------------------------------------
const startedForms = new Set<string>();
function onFocusIn(e: FocusEvent) {
  const form = (e.target as Element | null)?.closest?.("form[data-track-form]");
  const name = form?.getAttribute("data-track-form");
  if (!name || startedForms.has(name)) return;
  startedForms.add(name);
  track("form_start", { form: name });
}

/** Call once on the client. */
export function init() {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;
  if (w.__rmsAnalyticsInit) return;
  w.__rmsAnalyticsInit = true;

  if (new URLSearchParams(window.location.search).get("debug_analytics") === "1") {
    safeSession("set", DEBUG_KEY, "1");
  }
  debug = import.meta.env.DEV || safeSession("get", DEBUG_KEY) === "1";

  captureAttribution();
  scheduleGA();

  document.addEventListener("click", onClick, true);
  document.addEventListener("focusin", onFocusIn);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("moments:language", (e) => {
    track("language_switch", {
      language: (e as CustomEvent<{ locale?: string }>).detail?.locale,
    });
  });
}
