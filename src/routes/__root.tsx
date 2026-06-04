import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

import appCss from "../styles.css?url";

// Lazy — only fetched in browser after first paint, never in SSR bundle.
const EngagementModal = lazy(() => import("@/components/EngagementModal"));
const CookieNotice = lazy(() => import("@/components/CookieNotice"));
const FloatingContact = lazy(() => import("@/components/FloatingContact"));
import { Aperture, Instagram, Mail, MapPin, Film } from "@/components/icons";
import {
  SITE_URL,
  SITE_NAME,
  KEYWORDS,
  absoluteUrl,
  buildOrganizationLD,
  buildPersonLD,
  ldScriptBody,
} from "@/lib/seo";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { CASE_STUDIES } from "@/lib/case-studies";

type NavItem = { to: string; label: string; tKey: TKey; hash?: string };
type TKey =
  | "nav.work"
  | "nav.about"
  | "nav.services"
  | "nav.press"
  | "nav.enquire";

const NAV_ITEMS: readonly NavItem[] = [
  { to: "/", label: "Work", tKey: "nav.work", hash: "work" },
  { to: "/about", label: "About", tKey: "nav.about" },
  { to: "/services", label: "Services", tKey: "nav.services" },
  { to: "/press", label: "Press", tKey: "nav.press" },
];

function NotFoundComponent() {
  return <NotFoundInner />;
}

function NotFoundInner() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="max-w-xl">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Aperture className="h-3.5 w-3.5 text-accent" />
          {t("404.label")}
        </p>
        <h1 className="mt-6 font-display text-5xl leading-[1] tracking-tight text-balance md:text-7xl">
          {t("404.headline.l1")}
          <br />
          {t("404.headline.l2.before")}{" "}
          <em className="not-italic text-accent">{t("404.headline.l2.accent")}</em>
          .
        </h1>
        <p className="mt-8 max-w-md text-muted-foreground md:text-lg">
          {t("404.body")}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-6">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 border-b border-foreground pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
          >
            {t("404.cta.primary")}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
          <Link
            to="/contact"
            className="font-mono-label text-muted-foreground hover:text-foreground"
          >
            {t("404.cta.secondary")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content:
          "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { name: "theme-color", content: "#ffffff" },
      { name: "format-detection", content: "telephone=no" },
      { title: `${SITE_NAME} · Candid Photographer in Chennai & across India` },
      {
        name: "description",
        content:
          "Candid wedding and event photography by Ganesh Partheeban — based in Chennai, available across India. Documentary coverage of weddings, receptions, engagements, concerts, shows and behind-the-scenes.",
      },
      { name: "keywords", content: KEYWORDS.join(", ") },
      { name: "author", content: "Ganesh Partheeban" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_IN" },
      { property: "og:url", content: SITE_URL },
      { property: "og:title", content: `${SITE_NAME} · Candid Photographer` },
      {
        property: "og:description",
        content:
          "Candid photography across India. Weddings, events, concerts, shows and behind-the-scenes. Natural moments, real emotions, fast delivery.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: absoluteUrl("/og-hero.jpg") },
      { property: "og:image:secure_url", content: absoluteUrl("/og-hero.jpg") },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Candid photograph by Ganesh Partheeban" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: `${SITE_NAME} · Candid Photographer` },
      {
        name: "twitter:description",
        content:
          "Candid wedding and event photography across India by Ganesh Partheeban.",
      },
      { name: "twitter:image", content: absoluteUrl("/og-hero.jpg") },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: ldScriptBody(buildOrganizationLD()),
      } as Record<string, string>,
      {
        type: "application/ld+json",
        children: ldScriptBody(buildPersonLD()),
      } as Record<string, string>,
      // Cloudflare Web Analytics — privacy-friendly, no cookies.
      // Token comes from CF Dashboard → Web Analytics → site beacon.
      ...(import.meta.env.VITE_CF_BEACON_TOKEN
        ? [
            {
              src: "https://static.cloudflareinsights.com/beacon.min.js",
              defer: "",
              "data-cf-beacon": JSON.stringify({
                token: import.meta.env.VITE_CF_BEACON_TOKEN,
              }),
            } as Record<string, string>,
          ]
        : []),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      {
        rel: "preload",
        as: "image",
        href: "/hero-1200.avif",
        imagesrcset:
          "/hero-480.avif 480w, /hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w",
        imagesizes: "(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw",
        type: "image/avif",
        fetchPriority: "high",
      } as Record<string, string>,
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      // Non-blocking font CSS load — fetched at low priority and applied after
      // first paint. Body text falls back to system fonts for ~200ms while the
      // serif CSS streams in. font-display: swap on the @font-face rules keeps
      // the swap smooth.
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@300;400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@300;400;500;600&display=swap",
        media: "print",
        onLoad: "this.media='all';this.onload=null;",
      } as Record<string, string>,
      // Fallback when JS is disabled
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300;9..144,400;9..144,500;9..144,600&family=Inter+Tight:wght@300;400;500;600&display=swap",
        media: "(scripting: none)",
      } as Record<string, string>,
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <RootShellContents />
      </I18nProvider>
    </QueryClientProvider>
  );
}

function RootShellContents() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Scroll to top on every route change (hash links still work — they
  // scroll themselves before this effect runs).
  useEffect(() => {
    const unsub = router.subscribe("onResolved", ({ toLocation, fromLocation }) => {
      if (fromLocation?.pathname === toLocation.pathname) return;
      if (toLocation.hash) return;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    });
    return unsub;
  }, [router]);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main key={pathname} className="page-transition flex-1">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Suspense fallback={null}>
        <FloatingContact />
        <EngagementModal />
        <CookieNotice />
      </Suspense>
    </>
  );
}

function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Mobile back gesture / hardware back button — consume one history entry
    // so it closes the menu first instead of navigating away.
    const stateMarker = { __mobileMenu: true };
    window.history.pushState(stateMarker, "");
    const onPop = () => setOpen(false);
    window.addEventListener("popstate", onPop);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prev;
      // If the menu is closing via UI (not back gesture), drop our pushed entry
      // so the user's history doesn't grow with stale markers.
      if (window.history.state && window.history.state.__mobileMenu) {
        window.history.back();
      }
    };
  }, [open]);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) => {
    setOpen(false);
    // If we're already on the destination page, hijack and smooth-scroll.
    if (typeof window === "undefined") return;
    const samePath = window.location.pathname === item.to;
    if (!samePath) return;
    e.preventDefault();
    if (item.hash) {
      const target = document.getElementById(item.hash);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 md:px-10">
        <Link
          to="/"
          onClick={(e) =>
            handleNavClick(e, { to: "/", label: "Home", tKey: "nav.work" })
          }
          className="group flex shrink-0 items-baseline gap-2"
        >
          <span className="font-display text-base tracking-tight text-foreground sm:text-xl md:text-2xl">
            <em className="not-italic text-accent">{t("header.brand.prefix")}</em>{" "}
            {t("header.brand.suffix")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-1 sm:text-sm md:gap-2">
          {NAV_ITEMS.map((item) => {
            const isWork = item.to === "/";
            const link = (
              <Link
                key={item.label}
                to={item.to}
                hash={item.hash}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  className: "text-accent border-b border-accent",
                }}
                inactiveProps={{
                  className: "text-muted-foreground hover:text-foreground",
                }}
                onClick={(e) => handleNavClick(e, item)}
                className="px-2 py-2 font-mono-label transition-colors sm:px-3"
              >
                {t(item.tKey)}
              </Link>
            );
            if (isWork && CASE_STUDIES.length > 0) {
              return (
                <div key={item.label} className="group relative">
                  {link}
                  <div className="invisible absolute left-1/2 top-full z-40 mt-1 min-w-[220px] -translate-x-1/2 translate-y-1 opacity-0 transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="overflow-hidden rounded-sm border border-border bg-background shadow-lg">
                      <p className="border-b border-border bg-secondary/40 px-4 py-2 font-mono-label text-[10px] text-muted-foreground">
                        Stories
                      </p>
                      <ul>
                        {CASE_STUDIES.map((s) => (
                          <li key={s.slug}>
                            <Link
                              to="/work/$slug" params={{ slug: s.slug }}
                              onClick={(e) => {
                                setOpen(false);
                                // Blur so the focus-within state releases
                                // and the dropdown collapses immediately.
                                (e.currentTarget as HTMLAnchorElement).blur();
                              }}
                              className="block px-4 py-3 transition-colors hover:bg-accent/[0.06]"
                            >
                              <p className="font-display text-base text-foreground">
                                {s.title}
                              </p>
                              <p className="mt-0.5 font-mono-label text-[10px] text-muted-foreground">
                                {s.location} · {s.date}
                              </p>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            }
            return link;
          })}
          <Link
            to="/contact"
            hash="booking-enquiry"
            onClick={() =>
              handleNavClick(
                { preventDefault: () => {} } as React.MouseEvent<HTMLAnchorElement>,
                {
                  to: "/contact",
                  label: "Enquire",
                  tKey: "nav.enquire",
                  hash: "booking-enquiry",
                },
              )
            }
            className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 font-mono-label text-xs text-background transition-opacity hover:opacity-90 sm:text-sm"
          >
            {t("nav.enquire")} <span aria-hidden>↗</span>
          </Link>
        </nav>

        {/* Mobile: compact Enquire + hamburger */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            to="/contact"
            hash="booking-enquiry"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 font-mono-label text-[11px] text-background transition-opacity hover:opacity-90"
          >
            {t("nav.enquire")} <span aria-hidden>↗</span>
          </Link>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((o) => !o)}
          className="relative z-50 -mr-1 flex h-10 w-10 items-center justify-center"
        >
          <span className="relative block h-4 w-6">
            <span
              className={
                "absolute left-0 top-0 h-px w-6 bg-foreground transition-all duration-300 " +
                (open ? "translate-y-2 rotate-45" : "")
              }
            />
            <span
              className={
                "absolute left-0 top-2 h-px w-6 bg-foreground transition-all duration-200 " +
                (open ? "opacity-0" : "")
              }
            />
            <span
              className={
                "absolute bottom-0 left-0 h-px w-6 bg-foreground transition-all duration-300 " +
                (open ? "-translate-y-2 -rotate-45" : "")
              }
            />
          </span>
        </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div
        id="mobile-nav"
        inert={!open}
        style={{
          height: "calc(100dvh - 57px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.5rem)",
        }}
        className={
          "fixed inset-x-0 top-[57px] z-40 overflow-y-auto overscroll-contain bg-background transition-opacity duration-200 sm:hidden " +
          (open
            ? "border-b border-border/60 opacity-100"
            : "pointer-events-none opacity-0")
        }
      >
        <nav className="flex flex-col px-4 py-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <Link
                to={item.to}
                hash={item.hash}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "text-accent" }}
                inactiveProps={{
                  className: "text-muted-foreground hover:text-foreground",
                }}
                onClick={(e) => handleNavClick(e, item)}
                className="flex items-center justify-between border-b border-border/40 px-2 py-4 font-display text-2xl transition-colors"
              >
                <span>{t(item.tKey)}</span>
                <span className="font-mono-label text-xs text-accent">↗</span>
              </Link>
              {item.to === "/" && CASE_STUDIES.length > 0 && (
                <ul className="border-b border-border/40 bg-secondary/30 py-1">
                  {CASE_STUDIES.map((s) => (
                    <li key={s.slug}>
                      <Link
                        to="/work/$slug" params={{ slug: s.slug }}
                        onClick={() => setOpen(false)}
                        className="block px-6 py-3 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <p className="font-display text-base text-foreground">
                          {s.title}
                        </p>
                        <p className="mt-0.5 font-mono-label text-[10px]">
                          {s.location} · {s.date}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          <Link
            to="/contact"
            hash="booking-enquiry"
            onClick={(e) =>
              handleNavClick(e, {
                to: "/contact",
                label: "Enquire",
                tKey: "nav.enquire",
                hash: "booking-enquiry",
              })
            }
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 font-display text-lg text-background"
          >
            {t("nav.enquire")} <span aria-hidden>↗</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-32 border-t border-border bg-background">
      <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 md:px-10 md:py-24">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-12 md:gap-16">
          <div className="sm:col-span-2 md:col-span-6">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Film className="h-3.5 w-3.5 text-accent" />
              Index No. 01
            </p>
            <h2 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight text-foreground text-balance sm:text-4xl md:text-5xl lg:text-6xl">
              Photographs that feel like the moment itself.
            </h2>
          </div>
          <div className="md:col-span-3">
            <p className="font-mono-label text-muted-foreground">Contact</p>
            <ul className="mt-6 space-y-3 text-foreground">
              <li>
                <a
                  href="https://www.instagram.com/ganeshpartheeban/"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2.5 transition-colors hover:text-accent"
                >
                  <Instagram className="h-4 w-4 text-accent" />
                  <span className="border-b border-transparent group-hover:border-accent">
                    Instagram
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:ganeshpartheeban@gmail.com"
                  className="group inline-flex items-center gap-2.5 transition-colors hover:text-accent"
                >
                  <Mail className="h-4 w-4 text-accent" />
                  <span className="border-b border-transparent group-hover:border-accent">
                    Email
                  </span>
                </a>
              </li>
              <li>
                <a
                  href="https://unsplash.com/@ganeshpartheeban"
                  target="_blank"
                  rel="noreferrer"
                  className="group inline-flex items-center gap-2.5 transition-colors hover:text-accent"
                >
                  <Aperture className="h-4 w-4 text-accent" />
                  <span className="border-b border-transparent group-hover:border-accent">
                    Unsplash
                  </span>
                </a>
              </li>
            </ul>
          </div>
          <div className="md:col-span-3">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {t("footer.coverage")}
            </p>
            <p className="mt-6 text-foreground">{t("footer.coverage.area")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("footer.coverage.note")}
            </p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/[0.06] px-3 py-1 font-mono-label text-xs text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              {t("footer.booking.badge")}
            </p>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-3 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Ganesh Partheeban. Candid Photographer.</p>
          <p className="inline-flex flex-wrap items-center gap-x-2 font-mono-label">
            Natural moments
            <span className="text-accent">·</span>
            Real emotions
            <span className="text-accent">·</span>
            Fast delivery
          </p>
        </div>
        <p className="mt-6 text-center font-mono-label text-[10px] text-muted-foreground/70">
          {t("footer.made")}
        </p>
      </div>
    </footer>
  );
}

