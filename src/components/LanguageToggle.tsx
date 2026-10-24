import { useSyncExternalStore } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { localizedPath, type SiteLocale } from "@/lib/locale-path";

const noop = () => () => {};
// false during SSR and the hydrating render, true afterwards. The URL hash is
// never sent to the server, so hash-bearing hrefs must wait until after hydration.
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

/**
 * "தமிழ் / English" switch. Renders real anchors (crawlable, middle-click
 * friendly) that pre-compute the other locale's URL for the current page, and
 * routes clicks through the router so there is no full reload.
 */
export default function LanguageToggle({
  variant,
}: {
  variant: "header" | "footer" | "tab";
}) {
  const { locale, setLocale, t } = useI18n();
  const loc = useRouterState({ select: (s) => s.location });
  const hydrated = useHydrated();
  const hash = hydrated && loc.hash ? `#${loc.hash.replace(/^#/, "")}` : "";
  const hrefFor = (l: SiteLocale) => localizedPath(l, loc.pathname) + loc.searchStr + hash;
  const other: SiteLocale = locale === "ta" ? "en" : "ta";

  if (variant === "tab") {
    return (
      <a
        href={hrefFor(other)}
        hrefLang={other}
        lang={other}
        aria-label={t("language.switch")}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          setLocale(other);
        }}
        className="flex flex-col items-center justify-center gap-1 py-2.5 text-muted-foreground transition-colors active:scale-95 motion-reduce:transition-none"
      >
        <span aria-hidden className="flex h-5 w-5 items-center justify-center font-display text-lg leading-none">
          {other === "ta" ? "த" : "A"}
        </span>
        <span className="font-mono-label text-[9px] leading-none">{t(`language.${other}`)}</span>
      </a>
    );
  }

  const items: SiteLocale[] = ["ta", "en"];
  return (
    <span
      role="group"
      aria-label={t("language.switch")}
      className={
        "inline-flex items-center gap-1.5 font-mono-label " +
        (variant === "header" ? "ml-1 px-1 text-xs lg:ml-2 lg:text-sm" : "text-xs")
      }
    >
      {items.map((l, i) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          {i > 0 && (
            <span aria-hidden className="text-border">
              /
            </span>
          )}
          <a
            href={hrefFor(l)}
            hrefLang={l}
            lang={l}
            aria-current={l === locale ? "true" : undefined}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
              e.preventDefault();
              setLocale(l);
            }}
            className={
              l === locale
                ? "text-accent"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {t(`language.${l}`)}
          </a>
        </span>
      ))}
    </span>
  );
}
