import { useRouterState } from "@tanstack/react-router";
import { WhatsApp } from "@/components/icons";
import { GOOGLE_REVIEW_URL } from "@/lib/seo";
import { CASE_STUDIES } from "@/lib/case-studies";
import { useI18n, type Locale } from "@/lib/i18n";
import { localize } from "@/lib/localize";

const WHATSAPP_NUMBER = "919884426838";

function buildWhatsAppMessage(pathname: string, locale: Locale): string {
  const storyMatch = pathname.match(/^\/work\/([^/]+)\/?$/);
  if (storyMatch) {
    const found = CASE_STUDIES.find((s) => s.slug === storyMatch[1]);
    const story = found ? localize(found, locale) : undefined;
    if (story) {
      return `Hi Ganesh, enquiring after seeing the "${story.title}" story (${story.location}).`;
    }
  }
  if (pathname.startsWith("/services")) {
    return "Hi Ganesh, I'd like to know more about your services.";
  }
  if (pathname.startsWith("/about")) {
    return "Hi Ganesh, I came across your About page and wanted to get in touch.";
  }
  return "Hi Ganesh, I'd like to enquire about a shoot.";
}

export default function FloatingContact() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { locale, t } = useI18n();
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(pathname, locale))}`;
  // The stories admin has its own floating selection panel in this corner.
  if (pathname.startsWith("/stories/admin")) return null;

  return (
    <div
      style={{
        // Sits above the mobile bottom tab bar; desktop override below.
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px + 0.75rem)",
        right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
      }}
      className="fixed z-30 flex flex-col items-end gap-2.5 md:!bottom-8 md:!right-8"
    >
      {
        <a
          href={GOOGLE_REVIEW_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("floating.review")}
          data-track="google-review-floating"
          className="group flex items-center gap-2"
        >
          <span className="pointer-events-none hidden translate-x-1 rounded-full border border-foreground/15 bg-background/95 px-3 py-1 font-mono-label text-[10px] text-foreground opacity-0 shadow-sm backdrop-blur transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100 md:inline-block">
            {t("floating.review")}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-background/95 text-foreground shadow-lg shadow-black/10 backdrop-blur transition-transform group-hover:scale-105 group-active:scale-95 md:h-11 md:w-11">
            <span aria-hidden className="font-display text-lg leading-none text-accent md:text-xl">★</span>
          </span>
        </a>
      }
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Ganesh on WhatsApp"
        data-track="whatsapp-floating"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 active:scale-95 md:h-14 md:w-14"
      >
        <WhatsApp className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
    </div>
  );
}
