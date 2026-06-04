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

// Lazy · only fetched in browser after first paint, never in SSR bundle.
const EngagementModal = lazy(() => import("@/components/EngagementModal"));
const CookieNotice = lazy(() => import("@/components/CookieNotice"));
const FloatingContact = lazy(() => import("@/components/FloatingContact"));
const BottomTabBar = lazy(() => import("@/components/BottomTabBar"));
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
          "Candid wedding and event photography by Ganesh Partheeban · based in Chennai, available across India. Documentary coverage of weddings, receptions, engagements, concerts, shows and behind-the-scenes.",
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
      // Cloudflare Web Analytics · privacy-friendly, no cookies.
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
      // Non-blocking font CSS load · fetched at low priority and applied after
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

  // Scroll to top on every route change (hash links still work · they
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
        <main
          key={pathname}
          style={{
            paddingBottom:
              "calc(env(safe-area-inset-bottom, 0px) + var(--tab-bar-pad, 0px))",
          }}
          className="page-transition flex-1 [--tab-bar-pad:64px] md:[--tab-bar-pad:0px]"
        >
          <Outlet />
        </main>
        <SiteFooter />
      </div>
      <Suspense fallback={null}>
        <FloatingContact />
        <BottomTabBar />
        <EngagementModal />
        <CookieNotice />
      </Suspense>
    </>
  );
}

function SiteHeader() {
  const { t } = useI18n();

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: NavItem,
  ) => {
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
          <span className="truncate font-display text-base tracking-tight text-foreground sm:text-xl md:text-lg lg:text-2xl">
            <em className="not-italic text-accent">{t("header.brand.prefix")}</em>{" "}
            {t("header.brand.suffix")}
          </span>
        </Link>

        {/* Desktop nav · only at md+ so it never has to wrap. Below md, the
            bottom tab bar handles primary navigation. */}
        <nav className="hidden min-w-0 md:flex md:flex-shrink-0 md:items-center md:justify-end md:gap-0.5 md:text-xs lg:gap-2 lg:text-sm">
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
                className="whitespace-nowrap px-2 py-2 font-mono-label transition-colors lg:px-3"
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
            className="ml-2 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-3 py-1.5 font-mono-label text-xs text-background transition-opacity hover:opacity-90 lg:px-4 lg:py-2 lg:text-sm"
          >
            {t("nav.enquire")} <span aria-hidden>→</span>
          </Link>
        </nav>

        {/* Mobile + tablet Enquire CTA on the right (anything below md, where
            the bottom tab bar handles the rest of nav). */}
        <Link
          to="/contact"
          hash="booking-enquiry"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 font-mono-label text-[11px] text-background transition-opacity hover:opacity-90 active:scale-95 md:hidden"
        >
          {t("nav.enquire")} <span aria-hidden>→</span>
        </Link>
      </div>
    </header>
  );
}

const FOOTER_INDEX_BY_PATH: Record<string, { num: string; label: string }> = {
  "/": { num: "01", label: "The Work" },
  "/about": { num: "02", label: "The Photographer" },
  "/services": { num: "03", label: "Coverage & Offerings" },
  "/contact": { num: "04", label: "Reach Out" },
  "/press": { num: "05", label: "In Words" },
};

function footerIndexFor(pathname: string): { num: string; label: string } {
  if (FOOTER_INDEX_BY_PATH[pathname]) return FOOTER_INDEX_BY_PATH[pathname];
  const storyMatch = pathname.match(/^\/work\/([^/]+)\/?$/);
  if (storyMatch) {
    const idx = CASE_STUDIES.findIndex((s) => s.slug === storyMatch[1]);
    if (idx >= 0) {
      return {
        num: String(idx + 1).padStart(2, "0"),
        label: `Story · ${CASE_STUDIES[idx].title}`,
      };
    }
  }
  return { num: "00", label: "Notes from the field" };
}

function SiteFooter() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const footerIndex = footerIndexFor(pathname);
  return (
    <footer className="mt-10 border-t border-border bg-background sm:mt-16">
      <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-20">
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="sm:col-span-2 lg:col-span-6">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Film className="h-3.5 w-3.5 text-accent" />
              Index No. {footerIndex.num} · {footerIndex.label}
            </p>
            <h2 className="mt-4 font-display text-2xl leading-[1.1] tracking-tight text-foreground text-balance sm:mt-6 sm:text-4xl md:text-5xl lg:text-6xl">
              Photographs that feel like the moment itself.
            </h2>
          </div>
          <div className="lg:col-span-3">
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
          <div className="lg:col-span-3">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              {t("footer.coverage")}
            </p>
            <p className="mt-6 text-foreground">{t("footer.coverage.area")}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("footer.coverage.note")}
            </p>
            <p className="mt-5 inline-flex w-fit max-w-full items-center gap-2 whitespace-nowrap rounded-full border border-accent/40 bg-accent/[0.06] px-3 py-1 font-mono-label text-xs text-accent">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent" />
              {t("footer.booking.badge")}
            </p>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:mt-16 sm:pt-8 md:flex-row md:items-center md:justify-between">
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

