import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Aperture, Camera, Film, Lens, MapPin, ArrowUpRight } from "@/components/icons";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildServiceListLD,
  ldScriptBody,
} from "@/lib/seo";

const SERVICE_LIST_FOR_SEO = [
  { name: "Candid Wedding Photography", description: "Full-day candid coverage of weddings and wedding-related events across India." },
  { name: "Reception Photography", description: "Natural reception, after-party and stage coverage with family group portraits." },
  { name: "Engagement & Pre-Wedding Photography", description: "Storytelling for roka, sagai, engagement and pre-wedding gatherings." },
  { name: "Family & Cultural Events", description: "Candid coverage for traditional functions, cultural ceremonies and milestone family events." },
  { name: "Events, Concerts & Behind-the-Scenes", description: "Documentary coverage for concerts, live performances, corporate events and BTS." },
  { name: "Candid Videography (Coming Soon)", description: "Short documentary films and social-ready reels as an add-on to photography." },
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Photography Services · Weddings, Events, Concerts · Ganesh Partheeban" },
      {
        name: "description",
        content:
          "Candid photography services across India — weddings, receptions, engagement and pre-wedding, family and cultural events, concerts, shows and behind-the-scenes. Event-based pricing. Bookings from Chennai, Bengaluru and across India.",
      },
      { property: "og:title", content: "Services · Moments by Ganesh Partheeban" },
      { property: "og:url", content: absoluteUrl("/services") },
      {
        property: "og:description",
        content:
          "Candid coverage for weddings, receptions, engagements, family events, concerts, shows, and behind-the-scenes across India.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/services") }],
    scripts: [
      {
        type: "application/ld+json",
        children: ldScriptBody(buildServiceListLD(SERVICE_LIST_FOR_SEO)),
      } as Record<string, string>,
      {
        type: "application/ld+json",
        children: ldScriptBody(
          buildBreadcrumbLD([
            { name: "Work", url: "/" },
            { name: "Services", url: "/services" },
          ]),
        ),
      } as Record<string, string>,
    ],
  }),
  component: ServicesPage,
});

type Service = {
  n: string;
  title: string;
  body: string;
  bullets: string[];
  eventType: string;
  comingSoon?: boolean;
};

const services: Service[] = [
  {
    n: "S01",
    title: "Candid Wedding Photography",
    body: "Complete candid coverage of weddings and wedding-related events, from ceremony to celebration.",
    bullets: [
      "Full-day candid coverage",
      "Pre-event briefing",
      "All wedding rituals",
      "Social-ready exports",
    ],
    eventType: "Wedding",
  },
  {
    n: "S02",
    title: "Reception Photography",
    body: "Natural coverage of interactions, emotions, and celebrations during receptions and after-parties.",
    bullets: [
      "Stage & guest coverage",
      "Family group portraits",
      "Speeches & toasts",
      "Atmosphere photography",
    ],
    eventType: "Reception",
  },
  {
    n: "S03",
    title: "Engagement & Pre-Wedding",
    body: "Authentic storytelling for intimate ceremonies, roka, sagai, and pre-wedding gatherings.",
    bullets: [
      "Ceremony documentation",
      "Family interactions",
      "Couple portraits",
      "Decor & details",
    ],
    eventType: "Engagement",
  },
  {
    n: "S04",
    title: "Family & Cultural Events",
    body: "Coverage for traditional functions, milestone celebrations, and special gatherings.",
    bullets: [
      "Cultural ceremonies",
      "Multi-generational portraits",
      "Ritual documentation",
      "Celebration coverage",
    ],
    eventType: "Family / Cultural",
  },
  {
    n: "S05",
    title: "Events, Concerts & Behind-the-Scenes",
    body: "Documentary coverage for live events, concerts, shows, and behind-the-scenes. The same observational eye, applied to stage, crowd, and crew.",
    bullets: [
      "Concerts & live performances",
      "Corporate & cultural events",
      "Shows, launches & showcases",
      "Behind-the-scenes documentation",
    ],
    eventType: "Event / Concert / Show",
  },
  {
    n: "S06",
    title: "Candid Videography",
    body: "Same documentary approach, in motion. Short films and reels that capture how the day actually felt.",
    bullets: [
      "Highlight reels · 3–5 minutes",
      "Full ceremony films",
      "Social-ready vertical cuts",
      "Available as add-on to photography",
    ],
    eventType: "Videography (Notify)",
    comingSoon: true,
  },
];

function ServicesPage() {
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-10 sm:px-6 sm:pt-16 sm:pb-12 md:px-10 md:pt-24 md:pb-20">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Camera className="h-3.5 w-3.5 text-accent" />
          Services
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
          One photographer.
          <br />
          <em className="not-italic text-accent">Every</em> meaningful moment.
        </h1>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-[1800px] px-4 sm:px-6 md:px-10">
          {services.map((s) => (
            <article
              key={s.n}
              className={
                "group grid items-start gap-6 border-b border-border py-12 md:grid-cols-12 md:gap-10 md:py-16 " +
                (s.comingSoon ? "opacity-95" : "")
              }
            >
              <p className="md:col-span-1">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/[0.06] px-2.5 py-1 font-mono-label text-xs text-accent">
                  {s.n}
                </span>
              </p>
              <div className="md:col-span-6">
                <h2 className="flex flex-wrap items-center gap-3 font-display text-2xl leading-tight tracking-tight text-balance sm:text-3xl md:text-4xl lg:text-5xl">
                  {s.title}
                  {s.comingSoon && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/60 bg-accent/10 px-3 py-1 font-mono-label text-xs text-accent">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      Coming soon
                    </span>
                  )}
                </h2>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {s.bullets.map((b) => (
                    <li
                      key={b}
                      className="flex items-start gap-2 text-sm text-muted-foreground md:text-base"
                    >
                      <span className="mt-1.5 inline-block h-1 w-1 rounded-full bg-accent" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="md:col-span-5">
                <p className="text-muted-foreground md:text-lg">{s.body}</p>
                <div className="mt-5">
                  {s.comingSoon ? (
                    <NotifyForm />
                  ) : (
                    <a
                      href={`/contact?eventType=${encodeURIComponent(s.eventType)}#booking-enquiry`}
                      className="group inline-flex items-center gap-2 border-b border-foreground pb-1 font-mono-label text-foreground transition-colors hover:text-accent hover:border-accent"
                    >
                      Enquire
                      <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
          <p className="mx-auto max-w-2xl py-8 text-center font-mono-label text-xs leading-relaxed text-muted-foreground">
            Pricing is event-based, not hourly. For destination events, travel
            and stay are quoted transparently alongside the coverage. Bookings
            confirmed by date availability.
          </p>
        </div>
      </section>

      {/* Delivery */}
      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-12 md:gap-12 md:px-10 md:py-32">
          <div className="md:col-span-5">
            <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
              <Film className="h-3.5 w-3.5 text-accent" />
              Delivery
            </p>
            <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              Fast and shareable.
            </h2>
          </div>
          <div className="space-y-6 md:col-span-7 md:pl-12">
            <p className="text-lg leading-relaxed text-background/80">
              In today's world, moments are meant to be shared instantly with loved
              ones. My workflow is built so couples and families can relive and
              share their memories as soon as possible after the event.
            </p>
            <div className="rounded-none border border-background/20 p-6 md:p-8">
              <p className="font-mono-label text-background/60">Please note</p>
              <p className="mt-3 text-background/90">
                All deliverables are digital. I do not provide printed albums, hard
                copies, or physical photo books.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach + Coverage */}
      <section className="mx-auto grid max-w-[1800px] gap-10 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-2 md:gap-12 md:px-10 md:py-32">
        <div>
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Aperture className="h-3.5 w-3.5 text-accent" />
            Working style
          </p>
          <h2 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl">
            I work quietly inside the event.
          </h2>
          <ul className="mt-8 space-y-4 text-muted-foreground">
            {[
              "Observing interactions",
              "Anticipating emotions",
              "Capturing genuine reactions",
              "Documenting meaningful moments naturally",
            ].map((i) => (
              <li key={i} className="flex gap-3">
                <span className="text-accent">·</span>
                <span className="text-foreground">{i}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            Coverage area
          </p>
          <h2 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl">
            Available across India.
          </h2>
          <p className="mt-8 text-muted-foreground">
            I accept bookings from all over the country. Pricing is event-based
            rather than hourly. Travel and stay are billed separately from the
            base event coverage.
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-flex items-center gap-3 border-b border-foreground pb-1 font-display text-lg"
          >
            Check date availability <span>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string;
const FORM_TOKEN = import.meta.env.VITE_FORM_TOKEN as string;

type NotifyStatus = "idle" | "sending" | "sent" | "error";

function NotifyForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<NotifyStatus>("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setStatus("error");
      return;
    }
    const data = new FormData();
    data.set("name", "Videography Notify");
    data.set("email", email.trim());
    data.set("eventType", "Videography (Notify)");
    data.set("notes", "Wants to be notified when candid videography launches.");
    data.set("token", FORM_TOKEN);

    setStatus("sending");
    try {
      await fetch(FORM_ENDPOINT, { method: "POST", body: data, mode: "no-cors" });
      setStatus("sent");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="font-mono-label text-xs text-accent">
        Thanks, you'll hear from me when it launches.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status === "error") setStatus("idle");
        }}
        placeholder="your@email.com"
        aria-label="Email for videography launch notification"
        className="min-w-0 flex-1 border-b border-foreground/30 bg-transparent pb-1 font-mono-label text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 font-mono-label text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? "…" : "Notify me ↗"}
      </button>
      {status === "error" && (
        <span className="basis-full font-mono-label text-xs text-red-500">
          Please enter a valid email.
        </span>
      )}
    </form>
  );
}