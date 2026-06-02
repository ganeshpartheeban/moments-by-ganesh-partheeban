import { createFileRoute, Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { GALLERY, GALLERY_COUNT, formatExif, type Photo } from "@/lib/gallery";
import { Aperture, Camera, Film, Lens, Sparkle, ArrowUpRight } from "@/components/icons";
import { SITE_URL, absoluteUrl, buildBreadcrumbLD, ldScriptBody } from "@/lib/seo";

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
          "Candid wedding, reception, engagement, concert and event photography across India by Ganesh Partheeban. Based in Chennai, documenting moments as they happen — natural, honest, fast delivery.",
      },
      {
        property: "og:title",
        content: "Candid Wedding & Event Photographer · Moments by Ganesh Partheeban",
      },
      { property: "og:url", content: SITE_URL },
      {
        property: "og:description",
        content:
          "Candid photography across India — weddings, events, concerts, shows and behind-the-scenes. Moments, honestly documented.",
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
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div>
      <Hero />
      <SelectedWork />
      <Philosophy />
      <CTA />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-[1800px] px-4 pt-8 pb-8 sm:px-6 md:px-10 md:pt-12 md:pb-12">
        <div className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
          <div className="md:col-span-7">
            <p className="rise inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Aperture className="h-3.5 w-3.5 text-accent" />
              Vol. I · Candid Documentary
            </p>
            <h1 className="rise rise-2 mt-4 font-display text-4xl leading-[0.95] tracking-tight text-foreground text-balance sm:text-5xl md:mt-6 md:text-6xl lg:text-7xl xl:text-8xl">
              Moments,
              <br />
              <em className="not-italic text-accent">honestly</em>
              <br />
              documented.
            </h1>
            <p className="rise rise-3 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:mt-8 md:text-lg">
              Natural moments. Genuine emotions. Fast delivery. A candid photographer
              covering weddings, events, concerts, shows and everything in between,
              documenting them as they truly happen, with no forced poses, no heavy
              edits, no artificial styling.
            </p>
            <div className="rise rise-4 mt-8 flex flex-wrap items-center gap-6 md:mt-10">
              <Link
                to="/contact"
                className="group inline-flex items-center gap-3 border-b border-foreground pb-1 text-foreground"
              >
                <span className="font-display text-lg">Book your event</span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="https://www.instagram.com/ganeshpartheeban/"
                target="_blank"
                rel="noreferrer"
                className="font-mono-label text-muted-foreground hover:text-foreground"
              >
                Enquire on Instagram
              </a>
            </div>
          </div>
          <div className="rise rise-3 md:col-span-5">
            <figure className="relative">
              <picture>
                <source
                  type="image/avif"
                  srcSet="/hero-800.avif 800w, /hero-1200.avif 1200w, /hero-1600.avif 1600w"
                  sizes={HERO_SIZES}
                />
                <source
                  type="image/webp"
                  srcSet="/hero-800.webp 800w, /hero-1200.webp 1200w, /hero-1600.webp 1600w"
                  sizes={HERO_SIZES}
                />
                <img
                  src="/hero-1200.jpg"
                  srcSet="/hero-800.jpg 800w, /hero-1200.jpg 1200w, /hero-1600.jpg 1600w"
                  sizes={HERO_SIZES}
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
    <div className="overflow-hidden border-b border-border py-4 sm:py-6">
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

function useColumnCount(): number {
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const compute = () => {
      const w = window.innerWidth;
      setCols(w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);
  return cols;
}

function distribute(photos: Photo[], cols: number): Array<Array<{ photo: Photo; index: number }>> {
  const buckets: Array<Array<{ photo: Photo; index: number }>> = Array.from(
    { length: cols },
    () => [],
  );
  const heights = new Array(cols).fill(0);
  photos.forEach((photo, index) => {
    let shortest = 0;
    for (let c = 1; c < cols; c++) if (heights[c] < heights[shortest]) shortest = c;
    buckets[shortest].push({ photo, index });
    heights[shortest] += photo.height / photo.width;
  });
  return buckets;
}

function SelectedWork() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cols = useColumnCount();
  const columns = useMemo(() => distribute(GALLERY, cols), [cols]);
  return (
    <section id="work" className="w-full px-3 py-14 sm:px-6 sm:py-20 md:px-8 md:py-32">
      <div className="mx-auto mb-12 flex max-w-[1800px] flex-wrap items-end justify-between gap-6 md:mb-16">
        <div>
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Lens className="h-3.5 w-3.5 text-accent" />
            Selected frames · {GALLERY_COUNT} photographs
          </p>
          <h2 className="mt-4 max-w-2xl font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
            Quiet glances, loud laughter, and everything in between.
          </h2>
        </div>
        <Link
          to="/services"
          className="font-mono-label text-foreground hover:text-accent"
        >
          View services →
        </Link>
      </div>

      <div className="flex w-full gap-3 overflow-hidden lg:gap-4">
        {columns.map((col, ci) => (
          <div key={ci} className="flex min-w-0 flex-1 flex-col gap-3 lg:gap-4">
            {col.map(({ photo: p, index: i }) => {
              const exif = formatExif(p);
              return (
                <figure
                  key={i}
                  className="group"
                  style={
                    i < 4
                      ? undefined
                      : { contentVisibility: "auto", containIntrinsicSize: "auto 700px" }
                  }
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={`Open ${p.alt} in viewer`}
                    className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <picture>
                      <source
                        type="image/avif"
                        srcSet={`${thumbBase(i)}-600.avif 600w, ${thumbBase(i)}-1000.avif 1000w, ${thumbBase(i)}-1400.avif 1400w`}
                        sizes={THUMB_SIZES}
                      />
                      <source
                        type="image/webp"
                        srcSet={`${thumbBase(i)}-600.webp 600w, ${thumbBase(i)}-1000.webp 1000w, ${thumbBase(i)}-1400.webp 1400w`}
                        sizes={THUMB_SIZES}
                      />
                      <img
                        src={`${thumbBase(i)}-1000.jpg`}
                        srcSet={`${thumbBase(i)}-600.jpg 600w, ${thumbBase(i)}-1000.jpg 1000w, ${thumbBase(i)}-1400.jpg 1400w`}
                        sizes={THUMB_SIZES}
                        alt={p.alt}
                        loading={i < 4 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={i < 2 ? "high" : "auto"}
                        className="block h-auto w-full transition-opacity duration-300 group-hover:opacity-90 motion-reduce:transition-none"
                      />
                    </picture>
                  </button>
                  {(exif || p.camera) && (
                    <figcaption className="mt-2 font-mono-label text-xs text-muted-foreground">
                      {exif}
                      {exif && p.camera ? " · " : ""}
                      {p.camera}
                    </figcaption>
                  )}
                </figure>
              );
            })}
          </div>
        ))}
      </div>

      {openIndex !== null && (
        <Suspense fallback={null}>
          <Lightbox
            index={openIndex}
            onClose={() => setOpenIndex(null)}
            onChange={setOpenIndex}
          />
        </Suspense>
      )}
    </section>
  );
}


function Philosophy() {
  const points = [
    {
      n: "01",
      title: "Real over perfect",
      body: "Authentic emotion always outranks staged perfection.",
    },
    {
      n: "02",
      title: "Fast delivery",
      body: "Photos land quickly, so you can share memories while they still feel fresh.",
    },
    {
      n: "03",
      title: "Social-media ready",
      body: "Every gallery ships with pre-cropped, color-corrected exports for Instagram, stories and WhatsApp. Share the moment they land.",
    },
    {
      n: "04",
      title: "Minimal editing",
      body: "Natural skin tones, realistic lighting, true-to-life moments.",
    },
    {
      n: "05",
      title: "Solo coverage",
      body: "I personally photograph your event. One voice, one style.",
    },
    {
      n: "06",
      title: "Event-based pricing",
      body: "Priced by the event, never by the hour. No clock-watching.",
    },
  ];
  return (
    <section className="border-y border-border bg-secondary/40">
      <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Sparkle className="h-3.5 w-3.5 text-accent" />
              Philosophy
            </p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl">
              What makes the work <em className="not-italic text-accent">different</em>.
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

function CTA() {
  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-6 sm:py-24 md:px-10 md:py-40">
        <div className="grid items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
              <Film className="h-3.5 w-3.5 text-accent" />
              Let's talk
            </p>
            <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
              Less posing.
              <br />
              More <em className="not-italic text-accent">living</em>.
            </h2>
          </div>
          <div className="md:col-span-4 md:pb-4">
            <p className="text-background/70">
              If you want photographs that feel like the moment itself, send a note.
              Bookings are confirmed by date availability.
            </p>
            <Link
              to="/contact"
              className="group mt-8 inline-flex items-center gap-2 border-b border-background pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
            >
              Enquire now
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
