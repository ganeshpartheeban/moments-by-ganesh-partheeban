import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "@/components/icons";
import { kindLabel, type CaseStudy } from "@/lib/case-studies";

const DWELL_MS = 3500;

const thumb = (num: number, size: 600 | 800 | 1000 | 1400) =>
  `/gallery-thumbs/g${num}-${size}`;

export default function StoryCard({
  study,
  eager = false,
  staggerIndex = 0,
}: {
  study: CaseStudy;
  /** Eager-load the first frame (use for above-fold cards). */
  eager?: boolean;
  /** Position among siblings — used to offset the cycle so cards don't all flip together. */
  staggerIndex?: number;
}) {
  const frames = study.sequence;
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  // Track which frames have been shown — render only mounted ones to keep DOM light.
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Pause the auto-cycle when the card is offscreen — saves CPU + battery.
  useEffect(() => {
    if (!cardRef.current || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => setInView(e.isIntersecting)),
      { rootMargin: "200px" },
    );
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || frames.length <= 1) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const advance = () => {
      setActive((i) => {
        const next = (i + 1) % frames.length;
        setMounted((m) => {
          if (m.has(next)) return m;
          const copy = new Set(m);
          copy.add(next);
          return copy;
        });
        return next;
      });
    };
    // Stagger first tick + slight per-card cadence drift so cards never flip in unison.
    const offset = (staggerIndex * 900) % DWELL_MS;
    const drift = (staggerIndex % 3) * 250;
    let intervalId: number | undefined;
    const startId = window.setTimeout(() => {
      advance();
      intervalId = window.setInterval(advance, DWELL_MS + drift);
    }, offset);
    return () => {
      window.clearTimeout(startId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [inView, frames.length, staggerIndex]);

  return (
    <Link
      to="/work/$slug"
      params={{ slug: study.slug }}
      className="group block transition-transform duration-150 ease-out focus:outline-none active:scale-[0.985] motion-reduce:transition-none"
    >
      <div
        ref={cardRef}
        className="relative aspect-[4/5] w-full overflow-hidden bg-secondary"
      >
        {frames.map((num, i) =>
          mounted.has(i) ? (
            <picture key={num}>
              <source
                type="image/avif"
                srcSet={`${thumb(num, 600)}.avif 600w, ${thumb(num, 800)}.avif 800w, ${thumb(num, 1000)}.avif 1000w`}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <source
                type="image/webp"
                srcSet={`${thumb(num, 600)}.webp 600w, ${thumb(num, 800)}.webp 800w, ${thumb(num, 1000)}.webp 1000w`}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              />
              <img
                src={`${thumb(num, 800)}.jpg`}
                alt=""
                loading={eager && i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager && i === 0 ? "high" : "auto"}
                className={
                  "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transition-none " +
                  (i === active ? "opacity-100" : "opacity-0")
                }
              />
            </picture>
          ) : null,
        )}

        {/* Bottom gradient + meta */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 sm:p-6">
          <div className="text-white">
            <p className="font-mono-label text-[10px] uppercase tracking-wider text-white/70">
              {kindLabel(study.kind)}
            </p>
            <h3 className="mt-1 font-display text-xl leading-tight tracking-tight text-balance sm:text-2xl md:text-3xl">
              {study.title}
            </h3>
            <p className="mt-1 font-mono-label text-xs text-white/80">
              {study.location} · {study.date}
            </p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>

        {/* Position indicator dots */}
        {frames.length > 1 && (
          <div className="absolute right-4 top-4 flex gap-1.5">
            {frames.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 rounded-full transition-all duration-500 " +
                  (i === active ? "w-4 bg-white" : "w-1 bg-white/40")
                }
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
