import { useCallback, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Film } from "@/components/icons";
import Lightbox, { type LightboxItem } from "@/components/Lightbox";
import { absoluteUrl, buildBreadcrumbLD, ldScriptBody, SITE_NAME } from "@/lib/seo";
import { useI18n, translate, type Locale } from "@/lib/i18n";
import { track } from "@/lib/analytics";
import { getStories } from "@/lib/stories.functions";
import { storyThumbUrl, storyVideoUrl, type PublicStory } from "@/lib/stories-core";

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

  const fmt = useMemo(
    () => new Intl.DateTimeFormat(locale === "ta" ? "ta-IN" : "en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }),
    [locale],
  );
  const alt = useCallback(
    (s: PublicStory) => s.caption || t("stories.alt", { date: fmt.format(new Date(s.ts)) }),
    [t, fmt],
  );

  const items = useMemo<LightboxItem[]>(
    () =>
      stories.map((s) => ({
        src: s.kind === "video" ? storyVideoUrl(s) : storyThumbUrl(s),
        poster: s.kind === "video" ? storyThumbUrl(s) : undefined,
        alt: alt(s),
        width: s.w,
        height: s.h,
      })),
    [stories, alt],
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
          <ul className="grid grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1 lg:grid-cols-5 xl:grid-cols-6">
            {stories.map((s, i) => (
              <li
                key={s.id}
                style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px 356px" }}
              >
                <button
                  type="button"
                  onClick={() => openAt(i)}
                  aria-label={t("stories.open")}
                  className="group relative block aspect-[9/16] w-full overflow-hidden bg-secondary"
                >
                  <img
                    src={storyThumbUrl(s)}
                    alt={alt(s)}
                    width={s.w}
                    height={s.h}
                    loading={i < 6 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                  />
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
            ))}
          </ul>
        )}
      </section>

      <Lightbox index={open} onClose={close} onChange={setOpen} items={items} />
    </div>
  );
}
