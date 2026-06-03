import { useRouterState } from "@tanstack/react-router";
import { WhatsApp } from "@/components/icons";
import { CASE_STUDIES } from "@/lib/case-studies";

const WHATSAPP_NUMBER = "919884426838"; // +91 98844 26838 in wa.me format

function buildMessage(pathname: string): string {
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
  if (pathname.startsWith("/contact")) {
    return "Hi Ganesh, I'd like to enquire about a shoot.";
  }
  return "Hi Ganesh, I'd like to enquire about a shoot.";
}

export default function FloatingWhatsApp() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(pathname))}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message Ganesh on WhatsApp"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)",
        right: "calc(env(safe-area-inset-right, 0px) + 1.25rem)",
      }}
      className="group fixed z-40 flex min-h-11 min-w-11 items-center gap-2 rounded-full bg-accent px-4 py-3 text-background shadow-lg shadow-accent/30 transition-transform hover:scale-105 sm:!bottom-8 sm:!right-8"
    >
      <WhatsApp className="h-5 w-5" />
      <span className="hidden font-mono-label text-xs sm:inline">
        WhatsApp
      </span>
    </a>
  );
}
