import { useRouterState } from "@tanstack/react-router";
import { Instagram, WhatsApp } from "@/components/icons";
import { CASE_STUDIES } from "@/lib/case-studies";

const WHATSAPP_NUMBER = "919884426838";
const INSTAGRAM_URL = "https://www.instagram.com/ganeshpartheeban/";

function buildWhatsAppMessage(pathname: string): string {
  const storyMatch = pathname.match(/^\/work\/([^/]+)\/?$/);
  if (storyMatch) {
    const story = CASE_STUDIES.find((s) => s.slug === storyMatch[1]);
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
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(pathname))}`;

  return (
    <div
      aria-label="Get in touch"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
        right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
      }}
      className="fixed z-40 flex flex-col gap-3 sm:!bottom-8 sm:!right-8"
    >
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow Ganesh on Instagram"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg shadow-foreground/25 transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
      >
        <Instagram className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message Ganesh on WhatsApp"
        className="group flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 active:scale-95 sm:h-14 sm:w-14"
      >
        <WhatsApp className="h-5 w-5 sm:h-6 sm:w-6" />
      </a>
    </div>
  );
}
