/**
 * URL <-> locale helpers. English lives at the root, Tamil under /ta.
 * The router strips /ta on the way in (see router.tsx `rewrite`) so route
 * files only ever see locale-free paths.
 */
export type SiteLocale = "en" | "ta";

export const TA_PREFIX = "/ta";
const TA_RE = /^\/ta(?=[/?#]|$)/;

export function localeFromHref(href: string): SiteLocale {
  return TA_RE.test(href) ? "ta" : "en";
}

/** Locale-free pathname with no trailing slash (root stays "/"). */
export function normalizePath(pathname: string): string {
  const p = pathname.replace(TA_RE, "").replace(/\/+$/, "");
  return p === "" ? "/" : p;
}

/** Public (browser-visible) path for a locale-free path. */
export function localizedPath(locale: SiteLocale, path: string): string {
  const p = normalizePath(path);
  if (locale === "en") return p;
  return p === "/" ? `${TA_PREFIX}/` : `${TA_PREFIX}${p}`;
}

export function rewriteForLocale(getLocale: () => SiteLocale, setLocale: (l: SiteLocale) => void) {
  return {
    input: ({ url }: { url: URL }) => {
      if (TA_RE.test(url.pathname)) {
        setLocale("ta");
        url.pathname = url.pathname.replace(TA_RE, "") || "/";
      } else {
        setLocale("en");
      }
      return url;
    },
    output: ({ url }: { url: URL }) => {
      if (getLocale() === "ta" && !TA_RE.test(url.pathname)) {
        url.pathname = url.pathname === "/" ? `${TA_PREFIX}/` : `${TA_PREFIX}${url.pathname}`;
      }
      return url;
    },
  };
}
