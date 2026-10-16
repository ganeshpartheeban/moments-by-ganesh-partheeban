import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Aperture, Camera, Lens, Sparkle } from "@/components/icons";
import { useI18n } from "@/lib/i18n";

type Tab = {
  to: string;
  hash?: string;
  exact?: boolean;
  labelKey: string;
  Icon: (p: { className?: string }) => React.ReactElement;
};

const TABS: Tab[] = [
  { to: "/", exact: true, labelKey: "tabs.work", Icon: Aperture },
  { to: "/about", labelKey: "tabs.about", Icon: Lens },
  { to: "/services", labelKey: "tabs.services", Icon: Camera },
  { to: "/press", labelKey: "tabs.features", Icon: Sparkle },
];

const HIDE_DELTA = 6;
const HIDE_AFTER_PX = 120;

export default function BottomTabBar() {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    lastY.current = window.scrollY;

    const update = () => {
      const y = window.scrollY;
      const dy = y - lastY.current;
      if (y < HIDE_AFTER_PX) {
        setHidden(false);
      } else if (dy > HIDE_DELTA) {
        setHidden(true);
      } else if (dy < -HIDE_DELTA) {
        setHidden(false);
      }
      lastY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true;
        window.requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Overlays (the lightbox) lock body scroll while open. Closing one is not
  // a scroll, so a bar hidden by the earlier scroll-down would stay hidden
  // until the user scrolls up · and their next tap lands on the page behind
  // it. Show the bar again as soon as the lock is released.
  useEffect(() => {
    if (typeof window === "undefined" || typeof MutationObserver === "undefined") return;
    let wasLocked = document.body.style.overflow === "hidden";
    const obs = new MutationObserver(() => {
      const locked = document.body.style.overflow === "hidden";
      if (wasLocked && !locked) setHidden(false);
      wasLocked = locked;
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Primary"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        boxShadow: "0 -8px 24px -12px rgba(20, 12, 4, 0.18), 0 -1px 0 0 rgba(20, 12, 4, 0.08)",
      }}
      className={
        "fixed inset-x-0 bottom-0 z-40 border-t border-foreground/15 bg-secondary/95 backdrop-blur-md transition-transform duration-300 ease-out md:hidden " +
        (hidden ? "translate-y-full" : "translate-y-0")
      }
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => (
          <li key={tab.to + (tab.hash ?? "")} className="flex-1">
            <Link
              to={tab.to}
              hash={tab.hash}
              activeOptions={{ exact: tab.exact }}
              activeProps={{ className: "text-accent" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors active:scale-95 motion-reduce:transition-none"
            >
              <tab.Icon className="h-5 w-5" />
              <span className="font-mono-label text-[9px] leading-none">
                {t(tab.labelKey)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
