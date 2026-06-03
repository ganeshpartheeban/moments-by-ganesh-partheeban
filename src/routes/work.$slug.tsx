import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Aperture, ArrowUpRight, Camera, MapPin } from "@/components/icons";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildImageGalleryLD,
  ldScriptBody,
} from "@/lib/seo";
import { GALLERY, formatExif } from "@/lib/gallery";
import { findCaseStudy, kindLabel } from "@/lib/case-studies";
import { PHOTO_META } from "@/lib/photo-meta";
import { useColumnCount, distribute } from "@/lib/masonry";

const Lightbox = lazy(() => import("@/components/Lightbox"));

const thumbBase = (i: number) => `/gallery-thumbs/g${i + 1}`;
const SIZES = "(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw";

export const Route = createFileRoute("/work/$slug")({
  loader: ({ params }) => {
    const study = findCaseStudy(params.slug);
    if (!study) throw notFound();
    return study;
  },
  head: ({ loaderData }) => {
    const study = loaderData;
    if (!study) return { meta: [{ title: "Story not found" }] };
    const labelByKind: Record<string, string> = {
      wedding: "A wedding in frames",
      concert: "A concert in frames",
      ritual: "A ritual in frames",
      events: "Concerts & events in frames",
    };
    const titleSuffix = labelByKind[study.kind] ?? "In frames";
    const galleryImages = study.sequence
      .map((n) => {
        const p = GALLERY[n - 1];
        if (!p) return null;
        const meta = PHOTO_META[n];
        const caption = meta
          ? [
              meta.title + (meta.detail ? ` — ${meta.detail}` : ""),
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
          title: `${study.title} · ${titleSuffix} · Ganesh Partheeban`,
        },
        {
          name: "description",
          content: `A short photographic story from ${study.title} — documented candidly by Ganesh Partheeban in ${study.location}, ${study.date}.`,
        },
        { property: "og:title", content: `${study.title} · ${study.location}` },
        {
          property: "og:url",
          content: absoluteUrl(`/work/${study.slug}`),
        },
        {
          property: "og:description",
          content: `Candid photography from ${study.title} — ${study.location}, ${study.date}.`,
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
          content: `${study.title} — ${study.location}`,
        },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: absoluteUrl(`/og/${study.slug}.jpg`),
        },
      ],
      links: [{ rel: "canonical", href: absoluteUrl(`/work/${study.slug}`) }],
      scripts: [
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildBreadcrumbLD([
              { name: "Work", url: "/" },
              { name: study.title, url: `/work/${study.slug}` },
            ]),
          ),
        } as Record<string, string>,
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildImageGalleryLD(galleryImages, {
              name: `${study.title} · ${titleSuffix}`,
              description: `Candid photographs from ${study.title} — ${study.location}, ${study.date}.`,
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
  const study = Route.useLoaderData();

  // Resolve the sequence's gallery indices once.
  const frames = useMemo(
    () =>
      study.sequence
        .map((n) => ({ galleryIndex: n - 1, photo: GALLERY[n - 1] }))
        .filter((f) => Boolean(f.photo)),
    [study.sequence],
  );

  const [openPhotoIndex, setOpenPhotoIndex] = useState<number | null>(null);
  // Cap masonry at 3 columns — stories feel more focused than the home gallery.
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
      {/* Hero */}
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 md:px-10 md:pt-20 md:pb-16">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Aperture className="h-3.5 w-3.5 text-accent" />
          {kindLabel(study.kind)}
        </p>
        <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-8">
            <h1 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
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
          </div>
          <div className="md:col-span-4 md:pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-accent" />
                  Location
                </dt>
                <dd className="mt-1 font-display text-xl">{study.location}</dd>
              </div>
              <div>
                <dt className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                  <Camera className="h-3.5 w-3.5 text-accent" />
                  Documented
                </dt>
                <dd className="mt-1 font-display text-xl">{study.date}</dd>
              </div>
            </dl>
          </div>
        </div>
        <p className="mt-10 max-w-2xl text-muted-foreground md:text-lg">
          {study.intro}
        </p>
        <p className="mt-4 font-mono-label text-xs text-muted-foreground/70">
          Click any frame to view it full-screen.
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
                        className="block w-full cursor-zoom-in bg-background focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                                    {" "}— {meta.detail}
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

      {/* CTA */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-6 sm:py-24 md:px-10 md:py-32">
          <div className="grid items-end gap-10 md:grid-cols-12">
            <div className="md:col-span-8">
              <p className="font-mono-label text-background/60">
                Photographs that feel like the moment itself
              </p>
              <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl">
                {study.kind === "wedding"
                  ? "Want a story like this for "
                  : "Want this kind of coverage for "}
                <em className="not-italic text-accent">your day</em>?
              </h2>
            </div>
            <div className="md:col-span-4">
              <p className="text-background/70">
                Send a note about your event. Bookings are confirmed by date
                availability.
              </p>
              <Link
                to="/contact"
                hash="booking-enquiry"
                className="group mt-8 inline-flex items-center gap-2 border-b border-background pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
              >
                Enquire
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/"
                hash="work"
                className="mt-6 block font-mono-label text-xs text-background/60 hover:text-background"
              >
                ← Back to all work
              </Link>
            </div>
          </div>
        </div>
      </section>

      {openPhotoIndex !== null && (
        <Suspense fallback={null}>
          <Lightbox
            index={openPhotoIndex}
            onClose={() => setOpenPhotoIndex(null)}
            onChange={setOpenPhotoIndex}
          />
        </Suspense>
      )}
    </div>
  );
}
