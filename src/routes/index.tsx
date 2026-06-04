import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState, type CSSProperties } from "react";
import { GALLERY, formatExif } from "@/lib/gallery";
import { Aperture, Camera, Film, Lens, Sparkle, ArrowUpRight } from "@/components/icons";
import {
  SITE_URL,
  buildBreadcrumbLD,
  buildImageGalleryLD,
  ldScriptBody,
} from "@/lib/seo";
import { PRESS } from "@/lib/press";
import { useI18n } from "@/lib/i18n";
import { useColumnCount, distribute } from "@/lib/masonry";
import { CASE_STUDIES } from "@/lib/case-studies";
import { PHOTO_META } from "@/lib/photo-meta";
import StoryCard from "@/components/StoryCard";

const Lightbox = lazy(() => import("@/components/Lightbox"));

const thumbBase = (i: number) => `/gallery-thumbs/g${i + 1}`;
const THUMB_SIZES = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";
const HERO_SIZES = "(min-width: 1024px) 40vw, (min-width: 640px) 50vw, 100vw";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Candid Wedding & Event Photographer in Chennai, India · Moments by Ganesh Partheeban",
      },
      {
        name: "description",
        content:
          "Candid wedding, reception, engagement, concert and event photography across India by Ganesh Partheeban. Based in Chennai, documenting moments as they happen · natural, honest, fast delivery.",
      },
      {
        property: "og:title",
        content: "Candid Wedding & Event Photographer · Moments by Ganesh Partheeban",
      },
      { property: "og:url", content: SITE_URL },
      {
        property: "og:description",
        content:
          "Candid photography across India · weddings, events, concerts, shows and behind-the-scenes. Moments, honestly documented.",
      },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: ldScriptBody(
          buildBreadcrumbLD([{ name: "Work", url: "/" }]),
        ),
      } as Record<string, string>,
      {
        type: "application/ld+json",
        children: ldScriptBody(
          buildImageGalleryLD(
            GALLERY.map((p, i) => ({
              url: `/gallery-thumbs/g${i + 1}-1000.jpg`,
              width: p.width,
              height: p.height,
              alt: p.alt,
            })),
          ),
        ),
      } as Record<string, string>,
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <Hero />
      <Stories />
      <OtherFrames />
      <Philosophy />
      <Press />
      <CTA />
    </div>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1800px] px-4 pt-8 pb-8 sm:px-6 md:px-10 md:pt-12 md:pb-12">
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <p className="rise inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Aperture className="h-3.5 w-3.5 text-accent" />
              {t("home.hero.label")}
            </p>
            <h1 className="rise rise-2 mt-4 font-display text-4xl leading-[0.95] tracking-tight text-foreground text-balance sm:text-5xl md:mt-6 md:text-6xl lg:text-7xl xl:text-8xl">
              {t("home.hero.line1")}
              <br />
              <em className="not-italic text-accent">{t("home.hero.line2")}</em>
              <br />
              {t("home.hero.line3")}
            </h1>
            <p className="rise rise-3 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:mt-8 md:text-lg">
              {t("home.hero.body")}
            </p>
            <p className="rise rise-3 mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.06] px-3 py-1 font-mono-label text-[11px] text-accent">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
              </span>
              {t("home.hero.booking.window")}
            </p>
            <div className="rise rise-4 mt-6 flex flex-wrap items-center gap-6 md:mt-8">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 border-b border-foreground pb-1 text-foreground"
              >
                <span className="font-display text-lg">{t("home.hero.cta.book")}</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="https://www.instagram.com/ganeshpartheeban/"
                target="_blank"
                rel="noreferrer"
                className="font-mono-label text-muted-foreground hover:text-foreground"
              >
                {t("home.hero.cta.instagram")}
              </a>
            </div>
          </div>
          <div className="rise rise-3 md:col-span-5">
            <figure className="relative">
              <picture>
                <source
                  type="image/avif"
                  srcSet="/hero-480.avif 480w, /hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
                  sizes={HERO_SIZES}
                />
                <source
                  type="image/webp"
                  srcSet="/hero-480.webp 480w, /hero-800.webp 800w, /hero-1200.webp 1200w, /hero-1600.webp 1600w"
                  sizes={HERO_SIZES}
                />
                <img
                  src="/hero-1200.jpg"
                  srcSet="/hero-480.jpg 480w, /hero-800.jpg 800w, /hero-1200.jpg 1200w, /hero-1600.jpg 1600w"
                  sizes={HERO_SIZES}
                  width={1200}
                  height={1500}
                  alt="Candid photograph by Ganesh Partheeban"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/5] max-h-[78vh] w-full object-cover md:aspect-[3/4]"
                />
              </picture>
              <figcaption className="mt-3 flex items-center justify-end gap-2 font-mono-label text-muted-foreground">
                <Camera className="h-3.5 w-3.5 text-accent" />
                <span>18mm · f/5.6 · ISO 320 · NIKON D3400</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
      <div className="hairline mx-auto max-w-[1400px]" />
      <Marquee />
    </section>
  );
}

function Marquee() {
  const words = [
    "Real over perfect",
    "Social-media ready",
    "Minimal editing",
    "Solo coverage",
    "Fast delivery",
    "Event-based pricing",
    "Available across India",
  ];
  return (
    <div className="hidden overflow-hidden border-b border-border py-4 sm:block sm:py-6">
      <div className="flex gap-8 whitespace-nowrap px-4 sm:gap-12 sm:px-6 md:px-10">
        {[...words, ...words].map((w, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-6 font-display text-base text-muted-foreground sm:text-xl md:text-2xl"
          >
            {w}
            <Sparkle className="h-4 w-4 text-accent" />
          </span>
        ))}
      </div>
    </div>
  );
}



const STORY_NUMBERS_SET = new Set<number>(
  CASE_STUDIES.flatMap((s) => s.sequence),
);

function Stories() {
  const { t } = useI18n();
  return (
    <section
      id="work"
      className="mx-auto w-full max-w-[1800px] scroll-mt-20 px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-18"
    >
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
        <div>
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Film className="h-3.5 w-3.5 text-accent" />
            {t("home.stories.label")} · {CASE_STUDIES.length}
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
            {t("home.stories.title.before")}{" "}
            <em className="not-italic text-accent">
              {t("home.stories.title.accent")}
            </em>
            .
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            {t("home.stories.body")}
          </p>
        </div>
        <Link
          to="/services"
          className="font-mono-label text-foreground hover:text-accent"
        >
          {t("home.work.viewServices")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {CASE_STUDIES.map((s, i) => (
          <StoryCard key={s.slug} study={s} eager={i < 3} staggerIndex={i} />
        ))}
      </div>
    </section>
  );
}

function OtherFrames() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const standaloneIndices = useMemo(
    () => GALLERY.map((_, i) => i).filter((i) => !STORY_NUMBERS_SET.has(i + 1)),
    [],
  );

  const cols = useColumnCount(3);
  const columns = useMemo(
    () => distribute(standaloneIndices.map((i) => GALLERY[i]), cols),
    [cols, standaloneIndices],
  );

  if (standaloneIndices.length === 0) return null;

  return (
    <section className="border-t border-border bg-secondary/20">
      <div className="w-full px-3 py-14 sm:px-6 sm:py-20 md:px-8 md:py-24">
        <div className="mx-auto mb-10 max-w-[1800px] md:mb-14">
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Lens className="h-3.5 w-3.5 text-accent" />
            {t("home.singles.label")} · {standaloneIndices.length}
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-2xl leading-[1.1] tracking-tight text-balance sm:text-3xl md:text-4xl">
            {t("home.singles.title")}
          </h2>
        </div>

        <div className="flex w-full gap-3 overflow-hidden lg:gap-4">
          {columns.map((col, ci) => (
            <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
              {col.map(({ photo: p, index: localIdx }) => {
                const galleryIndex = standaloneIndices[localIdx];
                const exif = formatExif(p);
                const meta = PHOTO_META[galleryIndex + 1];
                const metaLine = meta
                  ? [
                      meta.featuring && `featuring ${meta.featuring}`,
                      [meta.venue, meta.location].filter(Boolean).join(", "),
                      meta.date,
                    ]
                      .filter(Boolean)
                      .join(" · ")
                  : "";
                return (
                  <figure
                    key={galleryIndex}
                    className="group"
                    style={{ contentVisibility: "auto", containIntrinsicSize: "auto 700px" } as CSSProperties}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(galleryIndex)}
                      aria-label={`Open ${p.alt} in viewer`}
                      className="block w-full cursor-zoom-in bg-background transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.985] motion-reduce:transition-none"
                    >
                      <picture>
                        <source
                          type="image/avif"
                          srcSet={`${thumbBase(galleryIndex)}-600.avif 600w, ${thumbBase(galleryIndex)}-800.avif 800w, ${thumbBase(galleryIndex)}-1000.avif 1000w, ${thumbBase(galleryIndex)}-1400.avif 1400w`}
                          sizes={THUMB_SIZES}
                        />
                        <source
                          type="image/webp"
                          srcSet={`${thumbBase(galleryIndex)}-600.webp 600w, ${thumbBase(galleryIndex)}-800.webp 800w, ${thumbBase(galleryIndex)}-1000.webp 1000w, ${thumbBase(galleryIndex)}-1400.webp 1400w`}
                          sizes={THUMB_SIZES}
                        />
                        <img
                          src={`${thumbBase(galleryIndex)}-1000.jpg`}
                          srcSet={`${thumbBase(galleryIndex)}-600.jpg 600w, ${thumbBase(galleryIndex)}-800.jpg 800w, ${thumbBase(galleryIndex)}-1000.jpg 1000w, ${thumbBase(galleryIndex)}-1400.jpg 1400w`}
                          sizes={THUMB_SIZES}
                          width={p.width}
                          height={p.height}
                          alt={p.alt}
                          loading="lazy"
                          decoding="async"
                          className="block h-auto w-full transition-opacity duration-300 group-hover:opacity-90 motion-reduce:transition-none"
                        />
                      </picture>
                    </button>
                    {(meta || exif || p.camera) && (
                      <figcaption className="mt-2 space-y-1">
                        {meta && (
                          <p className="font-display text-sm text-foreground">
                            {meta.title}
                            {meta.detail && (
                              <span className="text-muted-foreground"> · {meta.detail}</span>
                            )}
                          </p>
                        )}
                        {metaLine && (
                          <p className="font-mono-label text-[10px] leading-relaxed text-muted-foreground">
                            {metaLine}
                          </p>
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

      {openIndex !== null && (
        <Suspense fallback={null}>
          <Lightbox
            index={openIndex}
            photoIndices={standaloneIndices}
            onClose={() => setOpenIndex(null)}
            onChange={setOpenIndex}
          />
        </Suspense>
      )}
    </section>
  );
}

function Philosophy() {
  const { t } = useI18n();
  const points = [
    { n: "01", title: t("philosophy.01.title"), body: t("philosophy.01.body") },
    { n: "02", title: t("philosophy.02.title"), body: t("philosophy.02.body") },
    { n: "03", title: t("philosophy.03.title"), body: t("philosophy.03.body") },
    { n: "04", title: t("philosophy.04.title"), body: t("philosophy.04.body") },
    { n: "05", title: t("philosophy.05.title"), body: t("philosophy.05.body") },
    { n: "06", title: t("philosophy.06.title"), body: t("philosophy.06.body") },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 text-accent" />
              {t("home.philosophy.label")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl">
              {t("home.philosophy.title.before")}{" "}
              <em className="not-italic text-accent">
                {t("home.philosophy.title.accent")}
              </em>
              .
            </h2>
          </div>
          <div className="grid gap-px bg-border md:col-span-8 sm:grid-cols-2">
            {points.map((p) => (
              <div
                key={p.n}
                className="group relative bg-background p-6 transition-colors hover:bg-accent/[0.04] sm:p-8 md:p-10"
              >
                <span className="absolute left-0 top-0 h-px w-8 bg-accent transition-all duration-300 group-hover:w-16" />
                <p className="font-mono-label text-accent">{p.n}</p>
                <h3 className="mt-5 font-display text-xl sm:text-2xl md:text-3xl">{p.title}</h3>
                <p className="mt-3 text-muted-foreground">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Press() {
  const { t } = useI18n();
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-18">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 text-accent" />
              {t("home.press.label")}
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl">
              {t("home.press.title.before")}{" "}
              <em className="not-italic text-accent">
                {t("home.press.title.accent")}
              </em>
              .
            </h2>
            <p className="mt-6 max-w-sm text-muted-foreground">
              {t("home.press.body")}
            </p>
            <Link
              to="/press"
              className="group mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 font-mono-label text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {t("home.press.seeAll").replace("{{count}}", String(PRESS.length))}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
          <ul className="grid auto-rows-fr gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 md:col-span-8 lg:grid-cols-3">
            {PRESS.map((p) => (
              <li key={p.url} className="bg-background">
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-full items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/[0.05] sm:px-6 sm:py-5"
                >
                  <span className="font-display text-base leading-tight text-foreground sm:text-lg">
                    {p.name}
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-16 md:px-10 md:py-24">
        <div className="grid items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
              <Film className="h-3.5 w-3.5 text-accent" />
              {t("home.cta.label")}
            </p>
            <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
              {t("home.cta.title.line1")}
              <br />
              {t("home.cta.title.line2.before")}{" "}
              <em className="not-italic text-accent">
                {t("home.cta.title.line2.accent")}
              </em>
              .
            </h2>
          </div>
          <div className="md:col-span-4 md:pb-4">
            <p className="text-background/70">{t("home.cta.body")}</p>
            <Link
              to="/contact"
              className="group mt-8 inline-flex items-center gap-2 border-b border-background pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
            >
              {t("home.cta.button")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
