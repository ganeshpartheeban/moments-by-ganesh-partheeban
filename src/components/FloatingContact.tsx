import { useRouterState } from "@tanstack/react-router";
import { WhatsApp } from "@/components/icons";
import { CASE_STUDIES } from "@/lib/case-studies";

const WHATSAPP_NUMBER = "919884426838";

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
    <a
      href={waHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Ganesh on WhatsApp"
      style={{
        // Sits above the mobile bottom tab bar; desktop override below.
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px + 0.75rem)",
        right: "calc(env(safe-area-inset-right, 0px) + 1rem)",
      }}
      className="group fixed z-30 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 active:scale-95 md:!bottom-8 md:!right-8 md:h-14 md:w-14"
    >
      <WhatsApp className="h-5 w-5 sm:h-6 sm:w-6" />
    </a>
  );
}
