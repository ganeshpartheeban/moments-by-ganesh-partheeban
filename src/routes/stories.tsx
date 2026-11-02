import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Film } from "@/components/icons";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import { absoluteUrl, buildBreadcrumbLD, ldScriptBody, SITE_NAME } from "@/lib/seo";
import { useI18n, translate, type Locale } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { getStories } from "@/lib/stories.functions";
import {
  displaySize,
  istDay,
  rotatedFillStyle,
  storyThumbUrl,
  storyVideoUrl,
  weekKey,
  weekRange,
  type PublicStory,
} from "@/lib/stories-core";

export const Route = createFileRoute("/stories")({
  loader: () => getStories(),
  staleTime: 60_000,
  head: ({ match, loaderData }) => {
    const locale = (match.context as { locale: Locale }).locale;
    const tr = (k: string) => translate(locale, k);
    const stories = (loaderData ?? []) as PublicStory[];
    const gallery = {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      name: tr("meta.stories.title"),
      description: tr("meta.stories.desc"),
      url: absoluteUrl("/stories"),
      author: { "@type": "Person", name: "Ganesh Partheeban" },
      image: stories.slice(0, 60).map((s) => ({
        "@type": "ImageObject",
        contentUrl: absoluteUrl(storyThumbUrl(s)),
        uploadDate: s.ts,
        width: s.w,
        height: s.h,
        ...(s.caption ? { caption: s.caption } : {}),
        ...(s.meta?.place ? { contentLocation: { "@type": "Place", name: s.meta.place } } : {}),
      })),
    };
    const ogImage = stories[0] ? absoluteUrl(storyThumbUrl(stories[0])) : absoluteUrl("/og-hero.jpg");
    return {
      meta: [
        { title: tr("meta.stories.title") },
        { name: "description", content: tr("meta.stories.desc") },
        { property: "og:title", content: tr("meta.stories.title") },
        { property: "og:description", content: tr("meta.stories.desc") },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { name: "twitter:image", content: ogImage },
      ],
      scripts: [
        { type: "application/ld+json", children: ldScriptBody(gallery) } as Record<string, string>,
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildBreadcrumbLD([
              { name: "Work", url: "/" },
              { name: "Stories", url: "/stories" },
            ]),
          ),
        } as Record<string, string>,
      ],
    };
  },
  component: StoriesPage,
});

function StoriesPage() {
  const { t, locale } = useI18n();
  const stories = Route.useLoaderData() as PublicStory[];
  const [open, setOpen] = useState<number | null>(null);

  const intl = locale === "ta" ? "ta-IN" : "en-IN";
  const fmt = useMemo(() => new Intl.DateTimeFormat(intl, { dateStyle: "medium", timeZone: "Asia/Kolkata" }), [intl]);
  const alt = useCallback(
    (s: PublicStory) => s.caption || t("stories.alt", { date: fmt.format(new Date(s.ts)) }),
    [t, fmt],
  );

  // Newest week first (stories arrive sorted newest first). Values are indices into `stories`
  // so the lightbox keeps a single flat list.
  const weeks = useMemo(() => {
    const m = new Map<string, number[]>();
    stories.forEach((s, i) => {
      const k = weekKey(s.ts);
      const list = m.get(k);
      if (list) list.push(i);
      else m.set(k, [i]);
    });
    const thisWeek = weekKey(new Date().toISOString());
    // Built by hand (not formatRange) so server and browser ICU agree on the exact string.
    const tz = { timeZone: "Asia/Kolkata" } as const;
    const day = new Intl.DateTimeFormat(intl, { day: "numeric", ...tz });
    const mon = new Intl.DateTimeFormat(intl, { month: "short", ...tz });
    const year = new Intl.DateTimeFormat(intl, { year: "numeric", ...tz });
    const range = (key: string) => {
      const { start, end } = weekRange(key);
      if (year.format(start) !== year.format(end)) return `${day.format(start)} ${mon.format(start)} ${year.format(start)} – ${day.format(end)} ${mon.format(end)} ${year.format(end)}`;
      if (mon.format(start) === mon.format(end)) return `${day.format(start)}–${day.format(end)} ${mon.format(end)} ${year.format(end)}`;
      return `${day.format(start)} ${mon.format(start)} – ${day.format(end)} ${mon.format(end)} ${year.format(end)}`;
    };
    return [...m.entries()].map(([key, idx]) => ({
      key,
      idx,
      label: key === thisWeek ? t("stories.thisWeek") : range(key),
      sub: key === thisWeek ? range(key) : undefined,
    }));
  }, [stories, intl, t]);

  const details = useCallback(
    (s: PublicStory) => {
      const m = s.meta;
      if (!m) return undefined;
      const parts: string[] = [];
      if (m.shot && istDay(m.shot) !== istDay(s.ts)) parts.push(t("stories.shot", { date: fmt.format(new Date(m.shot)) }));
      if (m.cam) parts.push(m.cam);
      if (m.app) parts.push(m.app);
      if (m.place) parts.push(m.place);
      return parts.length ? parts.join(" · ") : undefined;
    },
    [t, fmt],
  );

  const items = useMemo<LightboxItem[]>(
    () =>
      stories.map((s) => ({
        src: s.kind === "video" ? storyVideoUrl(s) : storyThumbUrl(s),
        poster: s.kind === "video" ? storyThumbUrl(s) : undefined,
        alt: alt(s),
        caption: [fmt.format(new Date(s.ts)), s.caption].filter(Boolean).join(" · "),
        details: details(s),
        link:
          s.meta?.lat !== undefined && s.meta?.lng !== undefined
            ? { href: `https://www.google.com/maps?q=${s.meta.lat},${s.meta.lng}`, label: t("stories.map") }
            : undefined,
        width: s.w,
        height: s.h,
        rot: s.rot,
      })),
    [stories, alt, fmt, details, t],
  );

  const openAt = (i: number) => {
    track("stories_open", { id: stories[i].id });
    setOpen(i);
  };
  const close = useCallback(() => setOpen(null), []);

  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-10 sm:px-6 sm:pt-16 md:px-10 md:pt-20 md:pb-12">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Film className="h-3.5 w-3.5 text-accent" />
          {t("stories.label")}
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-16">
          <h1 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:col-span-7 md:text-7xl">
            {t("stories.headline.before")}{" "}
            <em className="not-italic text-accent">{t("stories.headline.accent")}</em>
            {t("stories.headline.after")}
          </h1>
          <p className="text-muted-foreground md:col-span-5 md:text-lg">{t("stories.body")}</p>
        </div>
        {stories.length > 0 && (
          <div className="mt-8 flex items-baseline gap-4 border-t border-border pt-5">
            <p className="font-display text-2xl text-foreground sm:text-3xl">
              <span className="text-accent">{stories.length}</span> {t("stories.count")}
            </p>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-[1800px] px-1 pb-4 sm:px-2 md:px-4">
        {stories.length === 0 ? (
          <p className="px-3 py-16 text-center text-muted-foreground">{t("stories.empty")}</p>
        ) : (
          weeks.map((w) => (
            <section key={w.key} aria-labelledby={`week-${w.key}`} className="mb-8 sm:mb-10">
              <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-2 pb-2 pt-2 sm:px-3">
                <h2 id={`week-${w.key}`} className="font-display text-lg text-foreground sm:text-xl">
                  {w.label}
                  {w.sub && <span className="ml-2 font-mono-label text-muted-foreground">{w.sub}</span>}
                </h2>
                <span className="font-mono-label text-muted-foreground">
                  {w.idx.length} {t("stories.count")}
                </span>
              </header>
              <ul className="grid grid-flow-dense grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1 lg:grid-cols-5 xl:grid-cols-6">
                {w.idx.map((i) => {
                  const s = stories[i];
                  const d = displaySize(s);
                  const wide = d.w > d.h;
                  const rotStyle = rotatedFillStyle(s.rot, wide ? 9 / 8 : 9 / 16);
                  return (
                    <li
                      key={s.id}
                      className={wide ? "col-span-2" : undefined}
                      style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px 356px" }}
                    >
                      <button
                        type="button"
                        onClick={() => openAt(i)}
                        aria-label={t("stories.open")}
                        className={
                          "group relative block w-full overflow-hidden bg-secondary " + (wide ? "aspect-[9/8]" : "aspect-[9/16]")
                        }
                      >
                        <img
                          src={storyThumbUrl(s)}
                          alt={alt(s)}
                          width={s.w}
                          height={s.h}
                          loading={i < 6 ? "eager" : "lazy"}
                          decoding="async"
                          style={rotStyle}
                          className={
                            (rotStyle ? "" : "h-full w-full object-cover ") +
                            "transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                          }
                        />
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline gap-1.5 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-2 pb-1.5 pt-7 text-left"
                        >
                          <time
                            dateTime={s.ts}
                            className="shrink-0 font-mono-label text-[9px] leading-none tracking-wider text-white/85 sm:text-[10px]"
                          >
                            {fmt.format(new Date(s.ts))}
                          </time>
                          {s.meta?.place && (
                            <span className="truncate font-mono-label text-[9px] leading-none tracking-wider text-white/60 sm:text-[10px]">
                              · {s.meta.place}
                            </span>
                          )}
                        </span>
                        {s.kind === "video" && (
                          <span
                            aria-hidden
                            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[10px] text-white"
                          >
                            ▶
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </section>

      <Lightbox index={open} onClose={close} onChange={setOpen} items={items} />
    </div>
  );
}
