import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const STORAGE_KEY = "rms-cookie-notice-dismissed";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage unavailable · show once then forget.
    }
    if (!dismissed) {
      // Tiny delay so the notice doesn't compete with first paint.
      const showId = setTimeout(() => setVisible(true), 1200);
      // Auto-dismiss after 10s · counts as acknowledged so it doesn't reappear.
      const hideId = setTimeout(() => {
        setVisible(false);
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          // ignore
        }
      }, 1200 + 10_000);
      return () => {
        clearTimeout(showId);
        clearTimeout(hideId);
      };
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-label="Privacy notice"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)",
        left: "calc(env(safe-area-inset-left, 0px) + 0.75rem)",
      }}
      className="fixed z-30 max-w-[calc(100vw-6rem)] rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-md backdrop-blur-md sm:max-w-xs"
    >
      <p className="leading-relaxed">{t("cookie.body")}</p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-1 font-mono-label text-[10px] text-accent hover:underline"
      >
        {t("cookie.dismiss")}
      </button>
    </div>
  );
}
