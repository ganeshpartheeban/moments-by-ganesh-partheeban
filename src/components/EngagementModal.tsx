import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Aperture } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "rms-engagement-dismissed-at";
const DELAY_MS = 8000;
const SUPPRESS_FOR_MS = 24 * 60 * 60 * 1000; // 1 day
const SUPPRESS_PATHS = ["/contact"];

export default function EngagementModal() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (SUPPRESS_PATHS.includes(location.pathname)) return;

    let dismissed = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const dismissedAt = raw ? Number(raw) : 0;
      dismissed = dismissedAt > 0 && Date.now() - dismissedAt < SUPPRESS_FOR_MS;
    } catch {
      // localStorage unavailable · fail open, show once.
    }
    if (dismissed) return;

    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setOpen(true);
    };

    // Trigger 1 · time on page.
    const timerId = setTimeout(trigger, DELAY_MS);

    // Trigger 2 · visitor reaches the end of the gallery (home page only).
    // Whichever fires first wins; the other is cancelled.
    let observer: IntersectionObserver | undefined;
    if (location.pathname === "/" && "IntersectionObserver" in window) {
      // Try immediately + on next frame in case the gallery isn't in DOM yet.
      const attach = () => {
        const sentinel = document.getElementById("gallery-end");
        if (!sentinel) return false;
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) trigger();
          },
          { rootMargin: "0px 0px -10% 0px" },
        );
        observer.observe(sentinel);
        return true;
      };
      if (!attach()) {
        // Gallery still mounting · retry next frame.
        requestAnimationFrame(() => attach());
      }
    }

    return () => {
      clearTimeout(timerId);
      observer?.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // No-op · modal still hides for the current page load.
    }
  };

  const handleWorkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    close();
    if (typeof window === "undefined") return;
    if (window.location.pathname === "/") {
      e.preventDefault();
      document
        .getElementById("work")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="engagement-modal-title"
      onClick={close}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-6 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden border border-border bg-background shadow-2xl motion-safe:animate-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-500"
      >
        {/* Top hairline accent */}
        <span className="absolute left-0 right-0 top-0 h-px bg-accent" />

        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <span aria-hidden className="text-lg">
            ×
          </span>
        </button>

        <div className="px-6 pb-7 pt-9 sm:px-9 sm:pb-9 sm:pt-10">
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Aperture className="h-3.5 w-3.5 text-accent" />
            {t("modal.label")}
          </p>

          <h2
            id="engagement-modal-title"
            className="mt-4 font-display text-2xl leading-[1.1] tracking-tight text-balance sm:text-3xl"
          >
            {t("modal.headline.before")}{" "}
            <em className="not-italic text-accent">
              {t("modal.headline.accent")}
            </em>
            ?
          </h2>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("modal.body")}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/contact"
              hash="booking-enquiry"
              onClick={close}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display text-base text-background transition-opacity hover:opacity-90"
            >
              {t("modal.cta.enquire")}
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <Link
              to="/"
              hash="work"
              onClick={handleWorkClick}
              className="group inline-flex items-center justify-center gap-2 border-b border-foreground pb-1 font-mono-label text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {t("modal.cta.work")}
              <span
                aria-hidden
                className="transition-transform group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          <p className="mt-6 font-mono-label text-[10px] text-muted-foreground/70">
            {t("modal.footnote")}
          </p>
        </div>
      </div>
    </div>
  );
}
