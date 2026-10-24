import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Aperture, ArrowUpRight, Camera, MapPin } from "@/components/icons";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildImageGalleryLD,
  ldScriptBody,
} from "@/lib/seo";
import { GALLERY, formatExif } from "@/lib/gallery";
import { CASE_STUDIES, findCaseStudy } from "@/lib/case-studies";
import { useI18n, translate, type Locale } from "@/lib/i18n";
import { localize, localizeAll } from "@/lib/localize";
import { findService } from "@/lib/services";
import { findCity } from "@/lib/cities";
import StoryCard from "@/components/StoryCard";
import { PHOTO_META } from "@/lib/photo-meta";
import { useColumnCount, distribute } from "@/lib/masonry";

const Lightbox = lazy(() => import("@/components/Lightbox"));

const thumbBase = (i: number) => `/gallery-thumbs/g${i + 1}`;
const SIZES = "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw";

type WorkSlugSearch = { photo?: number };

function validateWorkSlugSearch(
  search: Record<string, unknown>,
): WorkSlugSearch {
  const raw = search.photo;
  const n =
    typeof raw === "number"
      ? raw
      : typeof raw === "string"
        ? parseInt(raw, 10)
        : NaN;
  return Number.isFinite(n) ? { photo: n } : {};
}

export const Route = createFileRoute("/work/$slug")({
  validateSearch: validateWorkSlugSearch,
  loader: ({ params }) => {
    const study = findCaseStudy(params.slug);
    if (!study) throw notFound();
    return study;
  },
  head: ({ loaderData, match }) => {
    const locale = (match.context as { locale: Locale }).locale;
    const raw = loaderData;
    if (!raw) return { meta: [{ title: "Story not found" }] };
    const study = localize(raw, locale);
    const titleSuffix = translate(locale, `kind.${study.kind}`).replace(", in frames", " in frames");
    const galleryImages = study.sequence
      .map((n) => {
        const p = GALLERY[n - 1];
        if (!p) return null;
        const meta = PHOTO_META[n];
        const caption = meta
          ? [
              meta.title + (meta.detail ? ` · ${meta.detail}` : ""),
              meta.featuring && `featuring ${meta.featuring}`,
              [meta.venue, meta.location].filter(Boolean).join(", "),
              meta.date,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined;
        const contentLocation = meta
          ? [meta.venue, meta.location].filter(Boolean).join(", ") || study.location
          : study.location;
        return {
          url: `/gallery-full/g${n}.jpg`,
          width: p.width,
          height: p.height,
          alt: p.alt,
          caption,
          contentLocation,
          dateCreated: meta?.date ?? study.date,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    return {
      meta: [
        {
          title: translate(locale, "meta.work.title", { title: study.title, kind: titleSuffix }),
        },
        {
          name: "description",
          content: translate(locale, "meta.work.desc", {
            title: study.title,
            location: study.location,
            date: study.date,
          }),
        },
        { property: "og:title", content: `${study.title} · ${study.location}` },
        {
          property: "og:description",
          content: translate(locale, "meta.work.desc", {
            title: study.title,
            location: study.location,
            date: study.date,
          }),
        },
        { property: "og:image", content: absoluteUrl(`/og/${study.slug}.jpg`) },
        {
          property: "og:image:secure_url",
          content: absoluteUrl(`/og/${study.slug}.jpg`),
        },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        {
          property: "og:image:alt",
          content: `${study.title} · ${study.location}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: absoluteUrl(`/og/${study.slug}.jpg`),
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildBreadcrumbLD([
              { name: translate(locale, "nav.work"), url: "/" },
              { name: study.title, url: `/work/${study.slug}` },
            ]),
          ),
        } as Record<string, string>,
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildImageGalleryLD(galleryImages, {
              name: `${study.title} · ${titleSuffix}`,
              description: `Candid photographs from ${study.title} · ${study.location}, ${study.date}.`,
              url: `/work/${study.slug}`,
            }),
          ),
        } as Record<string, string>,
      ],
    };
  },
  component: CaseStudyPage,
});

function CaseStudyPage() {
  const { t, locale } = useI18n();
  const study = localize(Route.useLoaderData(), locale);
  const { photo } = Route.useSearch();
  const navigate = useNavigate();

  // Resolve the sequence's gallery indices once.
  const frames = useMemo(
    () =>
      study.sequence
        .map((n) => ({ galleryIndex: n - 1, photo: GALLERY[n - 1] }))
        .filter((f) => Boolean(f.photo)),
    [study.sequence],
  );

  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null);
  const didSyncSearch = useRef(false);

  // Deep-link: `?photo=N` (1-based gallery number) opens the lightbox on
  // that photo, provided it's part of this story's sequence.
  useEffect(() => {
    if (photo === undefined) return;
    const galleryIndex = photo - 1;
    if (frames.some((f) => f.galleryIndex === galleryIndex)) {
      setOpenPhotoIndex(galleryIndex);
    }
  }, [photo, frames]);

  // Keep `?photo=N` in sync with the currently-open photo. This goes
  // through the router (never a raw history.replaceState call) so it can't
  // stomp on TanStack Router's own history bookkeeping, and the very first
  // run is skipped so it never fires before there's anything to sync.
  useEffect(() => {
    if (!didSyncSearch.current) {
      didSyncSearch.current = true;
      return;
    }
    const desired = openPhotoIndex === null ? undefined : openPhotoIndex + 1;
    if (desired === photo) return;
    navigate({
      to: ".",
      search: (prev) => {
        const next = { ...prev };
        if (desired === undefined) delete next.photo;
        else next.photo = desired;
        return next;
      },
      replace: true,
      resetScroll: false,
    });
  }, [openPhotoIndex, photo, navigate]);
  // Cap masonry at 3 columns · stories feel more focused than the home gallery.
  const cols = useColumnCount(3);
  const columns = useMemo(
    () => distribute(frames.map((f) => f.photo), cols),
    [cols, frames],
  );

  // Wedding-style "X weds Y" gets the accent on the connector.
  const titleParts = study.kind === "wedding" && study.title.includes(" weds ")
    ? {
        before: study.title.split(" weds ")[0],
        accent: "weds",
        after: study.title.split(" weds ")[1],
      }
    : null;

  return (
    <div>
      {/* Hero · compact on mobile, expansive on desktop. */}
      <section className="mx-auto max-w-[1800px] px-4 pt-6 pb-6 sm:px-6 sm:pt-16 sm:pb-12 md:px-10 md:pt-20 md:pb-16">
        <p className="inline-flex items-center gap-2 font-mono-label text-[11px] text-muted-foreground sm:text-xs">
          <Aperture className="h-3.5 w-3.5 text-accent" />
          {t(`kind.${study.kind}`)}
        </p>
        <div className="mt-3 grid gap-4 sm:mt-6 sm:gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-8">
            <h1 className="font-display text-3xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
              {titleParts ? (
                <>
                  {titleParts.before}{" "}
                  <em className="not-italic text-accent">{titleParts.accent}</em>{" "}
                  {titleParts.after}
                </>
              ) : (
                study.title
              )}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono-label text-xs text-muted-foreground sm:hidden">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-accent" />
                {study.location}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1.5">
                <Camera className="h-3 w-3 text-accent" />
                {study.date}
              </span>
            </p>
          </div>
          <div className="hidden md:col-span-4 md:block md:pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  {t("work.location")}
                </dt>
                <dd className="mt-1 font-display text-xl">{study.location}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                  <Camera className="h-3.5 w-3.5 text-accent" />
                  {t("work.documented")}
                </dt>
                <dd className="mt-1 font-display text-xl">{study.date}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:mt-10 sm:text-base md:text-lg">
          {study.intro}
        </p>
        <StoryTags study={study} />
        <p className="mt-3 hidden font-mono-label text-xs text-muted-foreground/70 sm:block">
          {t("work.clickHint")}
        </p>
      </section>

      {/* Photo masonry */}
      <section className="border-t border-border bg-secondary/20">
        <div className="w-full px-3 py-12 sm:px-6 sm:py-16 md:px-8 md:py-20">
          <div className="flex w-full gap-3 overflow-hidden lg:gap-4">
            {columns.map((col, ci) => (
              <div
                key={ci}
                className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4"
              >
                {col.map(({ photo: p, index: i }) => {
                  const galleryIndex = frames[i].galleryIndex;
                  const exif = formatExif(p);
                  const meta = PHOTO_META[galleryIndex + 1];
                  return (
                    <figure key={galleryIndex} className="group">
                      <button
                        type="button"
                        onClick={() => setOpenPhotoIndex(galleryIndex)}
                        aria-label={`Open ${p.alt} in viewer`}
                        className="block w-full cursor-zoom-in bg-background transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.985] motion-reduce:transition-none"
                      >
                        <picture>
                          <source
                            type="image/avif"
                            srcSet={`${thumbBase(galleryIndex)}-600.avif 600w, ${thumbBase(galleryIndex)}-800.avif 800w, ${thumbBase(galleryIndex)}-1000.avif 1000w, ${thumbBase(galleryIndex)}-1400.avif 1400w`}
                            sizes={SIZES}
                          />
                          <source
                            type="image/webp"
                            srcSet={`${thumbBase(galleryIndex)}-600.webp 600w, ${thumbBase(galleryIndex)}-800.webp 800w, ${thumbBase(galleryIndex)}-1000.webp 1000w, ${thumbBase(galleryIndex)}-1400.webp 1400w`}
                            sizes={SIZES}
                          />
                          <img
                            src={`${thumbBase(galleryIndex)}-1000.jpg`}
                            srcSet={`${thumbBase(galleryIndex)}-600.jpg 600w, ${thumbBase(galleryIndex)}-800.jpg 800w, ${thumbBase(galleryIndex)}-1000.jpg 1000w, ${thumbBase(galleryIndex)}-1400.jpg 1400w`}
                            sizes={SIZES}
                            width={p.width}
                            height={p.height}
                            alt={p.alt}
                            loading={i < 2 ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={i < 1 ? "high" : "auto"}
                            className="block h-auto w-full transition-opacity duration-300 group-hover:opacity-95"
                          />
                        </picture>
                      </button>
                      {(meta || exif || p.camera) && (
                        <figcaption className="mt-2 space-y-1">
                          {meta && (
                            <>
                              <p className="font-display text-sm text-foreground sm:text-base">
                                {meta.title}
                                {meta.detail && (
                                  <span className="text-muted-foreground">
                                    {" "}· {meta.detail}
                                  </span>
                                )}
                              </p>
                              <p className="font-mono-label text-[10px] leading-relaxed text-muted-foreground">
                                {[
                                  meta.featuring && `featuring ${meta.featuring}`,
                                  [meta.venue, meta.location]
                                    .filter(Boolean)
                                    .join(", "),
                                  meta.date,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </p>
                            </>
                          )}
                          {(exif || p.camera) && (
                            <p className="font-mono-label text-[10px] text-muted-foreground/70">
                              {exif}
                              {exif && p.camera ? " · " : ""}
                              {p.camera}
                            </p>
                          )}
                        </figcaption>
                      )}
                    </figure>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <MoreRow study={study} />

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-16 md:px-10 md:py-20">
          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="font-mono-label text-background/60">
                {t("footer.tagline")}
              </p>
              <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl">
                {t(study.kind === "wedding" ? "work.cta.wedding" : "work.cta.other")}{" "}
                <em className="not-italic text-accent">{t("work.cta.accent")}</em>
                {t("work.cta.after")}
              </h2>
            </div>
            <div className="md:col-span-4">
              <p className="text-background/70">
                {t("work.cta.body")}
              </p>
              <Link
                to="/contact"
                hash="booking-enquiry"
                className="group mt-8 inline-flex items-center gap-2 border-b border-background pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
              >
                {t("nav.enquire")}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/"
                hash="work"
                className="mt-6 block font-mono-label text-xs text-background/60 hover:text-background"
              >
                {t("work.back")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {openPhotoIndex !== null && (
        <Suspense fallback={null}>
          <Lightbox
            index={openPhotoIndex}
            photoIndices={frames.map((f) => f.galleryIndex)}
            onClose={() => setOpenPhotoIndex(null)}
            onChange={setOpenPhotoIndex}
          />
        </Suspense>
      )}
    </div>
  );
}



const tagClass =
  "inline-flex items-center rounded-full border border-border px-3 py-1 font-mono-label text-[10px] text-muted-foreground transition-colors hover:border-accent hover:text-accent";

function StoryTags({ study }: { study: NonNullable<ReturnType<typeof findCaseStudy>> }) {
  const { t, locale } = useI18n();
  const rawCity = findCity(study.citySlug);
  const city = rawCity ? localize(rawCity, locale) : undefined;
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {study.services.map((slug) => {
        const rawSv = findService(slug);
        const sv = rawSv ? localize(rawSv, locale) : undefined;
        return sv ? (
          <Link key={slug} to="/services/$slug" params={{ slug }} className={tagClass}>
            {sv.title}
          </Link>
        ) : null;
      })}
      {city && (
        <Link to="/photographer-in/$city" params={{ city: city.slug }} className={tagClass}>
          {t("work.tag.photographerIn", { name: city.name })}
        </Link>
      )}
      {study.ceremonies?.map((c) => (
        <span
          key={c}
          className="inline-flex items-center rounded-full bg-accent/[0.06] px-3 py-1 font-mono-label text-[10px] text-accent"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function MoreRow({ study }: { study: NonNullable<ReturnType<typeof findCaseStudy>> }) {
  const { t, locale } = useI18n();
  const allStories = localizeAll(CASE_STUDIES, locale);
  const sameCity = allStories.filter(
    (s) => s.slug !== study.slug && s.citySlug === study.citySlug,
  );
  const sameService = allStories.filter(
    (s) =>
      s.slug !== study.slug &&
      !sameCity.includes(s) &&
      s.services.some((x) => study.services.includes(x)),
  );
  const rawSv = findService(study.services[0]);
  const firstSv = rawSv ? localize(rawSv, locale) : undefined;
  const groups = [
    { label: t("work.moreIn", { name: study.location }), items: sameCity },
    {
      label: firstSv
        ? t("work.moreSvc", { name: locale === "en" ? firstSv.title.toLowerCase() : firstSv.title })
        : t("work.moreStories"),
      items: sameService,
    },
  ].filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-[1800px] space-y-12 px-4 py-12 sm:px-6 md:px-10 md:py-16">
        {groups.map((g) => (
          <div key={g.label}>
            <p className="font-mono-label text-muted-foreground">{g.label}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s, i) => (
                <StoryCard key={s.slug} study={s} staggerIndex={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
