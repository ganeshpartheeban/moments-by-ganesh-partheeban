import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "@/components/icons";
import type { CaseStudy } from "@/lib/case-studies";
import { useI18n } from "@/lib/i18n";
import { localize } from "@/lib/localize";

const thumb = (num: number, size: 600 | 800 | 1000 | 1400) => `/gallery-thumbs/g${num}-${size}`;

// ---------------------------------------------------------------------------
// Shared cross-card scheduler
//
// All StoryCards on the page share a single clock: exactly one card advances
// its frame every TICK_MS, round-robin across whichever cards are currently
// registered (mounted + in view + motion allowed). This replaces the old
// per-card setInterval design where every card ran its own timer and the
// grid as a whole changed roughly every ~0.6s.
//
// The scheduler state lives on `window` (not a module-level `let`) so that a
// Vite/React-Refresh HMR update to this file — which re-evaluates the module
// body but does not necessarily unmount already-mounted cards — reattaches
// to the same timers instead of spinning up a second, duplicate scheduler.
// ---------------------------------------------------------------------------

const TICK_MS = 4000;
const FIRST_TICK_DELAY_MS = 4000;

interface StoryCardScheduler {
  /** card id -> "try to advance this card's frame; true if it did" */
  registry: Map<number, () => boolean>;
  /** registration order, used for round-robin rotation */
  order: number[];
  /** index into `order` of whose turn is next */
  pointer: number;
  tickTimer: number | null;
  firstTimer: number | null;
  nextId: number;
}

type SchedulerWindow = Window & { __storyCardScheduler?: StoryCardScheduler };

function getSchedulerWindow(): SchedulerWindow | null {
  if (typeof window === "undefined") return null;
  return window as SchedulerWindow;
}

function getScheduler(): StoryCardScheduler | null {
  const w = getSchedulerWindow();
  if (!w) return null;
  if (!w.__storyCardScheduler) {
    w.__storyCardScheduler = {
      registry: new Map(),
      order: [],
      pointer: 0,
      tickTimer: null,
      firstTimer: null,
      nextId: 0,
    };
  }
  return w.__storyCardScheduler;
}

function schedulerTick() {
  const s = getScheduler();
  if (!s) return;
  // Drop any ids that unregistered since the last tick.
  const ids = s.order.filter((id) => s.registry.has(id));
  s.order = ids;
  if (ids.length === 0) return;
  if (s.pointer >= ids.length) s.pointer = 0;
  // Advance exactly one card per tick. If the card whose turn it is isn't
  // ready (next frame not preloaded/decoded yet), try the next one in the
  // rotation instead of flashing a half-loaded image or doing nothing.
  for (let attempt = 0; attempt < ids.length; attempt++) {
    const idx = (s.pointer + attempt) % ids.length;
    const id = ids[idx];
    const tryAdvance = s.registry.get(id);
    if (tryAdvance && tryAdvance()) {
      s.pointer = (idx + 1) % ids.length;
      return;
    }
  }
  // Nobody was ready this tick; leave the pointer where it was and retry
  // the same card first next time.
}

function registerCard(id: number, tryAdvance: () => boolean) {
  const s = getScheduler();
  if (!s) return;
  s.registry.set(id, tryAdvance);
  if (!s.order.includes(id)) s.order.push(id);
  if (s.tickTimer === null && s.firstTimer === null) {
    const w = getSchedulerWindow();
    if (!w) return;
    s.firstTimer = w.setTimeout(() => {
      const s2 = getScheduler();
      if (!s2) return;
      s2.firstTimer = null;
      schedulerTick();
      s2.tickTimer = w.setInterval(schedulerTick, TICK_MS);
    }, FIRST_TICK_DELAY_MS);
  }
}

function unregisterCard(id: number) {
  const s = getScheduler();
  if (!s) return;
  s.registry.delete(id);
  s.order = s.order.filter((x) => x !== id);
  if (s.registry.size === 0) {
    const w = getSchedulerWindow();
    if (s.firstTimer !== null) {
      w?.clearTimeout(s.firstTimer);
      s.firstTimer = null;
    }
    if (s.tickTimer !== null) {
      w?.clearInterval(s.tickTimer);
      s.tickTimer = null;
    }
    s.pointer = 0;
  }
}

function nextCardId(): number {
  const s = getScheduler();
  return s ? s.nextId++ : -1;
}

export default function StoryCard({
  study: rawStudy,
  eager = false,
  staggerIndex: _staggerIndex = 0,
}: {
  study: CaseStudy;
  /** Eager-load the first frame (use for above-fold cards). */
  eager?: boolean;
  /** Unused by the shared scheduler; kept for prop compatibility. */
  staggerIndex?: number;
}) {
  const { t, locale } = useI18n();
  const study = localize(rawStudy, locale);
  const frames = study.sequence;
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  // Track which frames have been shown · render only mounted ones to keep DOM light.
  const [mounted, setMounted] = useState<Set<number>>(() => new Set([0]));
  const cardRef = useRef<HTMLDivElement | null>(null);

  const activeRef = useRef(0);
  const readyFramesRef = useRef<Set<number>>(new Set());
  const imgRefs = useRef<Record<number, HTMLImageElement | null>>({});
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = nextCardId();

  // Pause the auto-cycle when the card is offscreen · saves CPU + battery,
  // and keeps it out of the shared rotation (see registration effect below).
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
    activeRef.current = active;
  }, [active]);

  // Keep the frame *after* the active one mounted ahead of time so its
  // <picture> starts fetching well before it's this card's turn — far more
  // than the ~1.5s head start asked for, since a card only gets a turn once
  // every `registered cards × TICK_MS`.
  useEffect(() => {
    if (frames.length <= 1) return;
    const next = (active + 1) % frames.length;
    setMounted((m) => (m.has(next) ? m : new Set(m).add(next)));
  }, [active, frames.length]);

  const markFrameReady = useCallback((i: number) => {
    const img = imgRefs.current[i];
    if (img && typeof img.decode === "function") {
      img.decode().then(
        () => readyFramesRef.current.add(i),
        // decode() can reject (e.g. the image changed src mid-flight); the
        // load/error event already told us the bytes are there, so treat it
        // as ready rather than risk starving this frame of a turn forever.
        () => readyFramesRef.current.add(i),
      );
    } else {
      readyFramesRef.current.add(i);
    }
  }, []);

  // Catch frames that were already cached (and so never fire a fresh load
  // event) as soon as they're mounted.
  useEffect(() => {
    mounted.forEach((i) => {
      if (readyFramesRef.current.has(i)) return;
      const img = imgRefs.current[i];
      if (img && img.complete && img.naturalWidth > 0) markFrameReady(i);
    });
  }, [mounted, markFrameReady]);

  // Called by the shared scheduler when it's this card's turn. Only steps
  // forward — and reports success — if the next frame has finished loading
  // and decoding; otherwise the scheduler moves on to another card so we
  // never cross-fade into a half-loaded image.
  const tryAdvance = useCallback(() => {
    if (frames.length <= 1) return false;
    const next = (activeRef.current + 1) % frames.length;
    if (!readyFramesRef.current.has(next)) return false;
    setActive(next);
    return true;
  }, [frames.length]);

  useEffect(() => {
    if (!inView || frames.length <= 1) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = idRef.current;
    if (id === null || id < 0) return;
    registerCard(id, tryAdvance);
    return () => unregisterCard(id);
  }, [inView, frames.length, tryAdvance]);

  return (
    <Link
      to="/work/$slug"
      params={{ slug: study.slug }}
      data-story-slug={study.slug}
      className="group block transition-transform duration-150 ease-out focus:outline-none active:scale-[0.985] motion-reduce:transition-none"
    >
      <div ref={cardRef} className="relative aspect-[4/5] w-full overflow-hidden bg-secondary">
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
                ref={(el) => {
                  imgRefs.current[i] = el;
                }}
                src={`${thumb(num, 800)}.jpg`}
                alt=""
                loading={eager && i === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={eager && i === 0 ? "high" : "auto"}
                onLoad={() => markFrameReady(i)}
                onError={() => markFrameReady(i)}
                className={
                  "absolute inset-0 h-full w-full object-cover [transition:opacity_1200ms_ease-in-out,scale_700ms_ease-out,transform_700ms_ease-out] group-hover:scale-[1.02] motion-reduce:transition-none " +
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
              {t(`kind.${study.kind}`)}
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
                  "h-1 rounded-full transition-all duration-[1200ms] ease-in-out " +
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
