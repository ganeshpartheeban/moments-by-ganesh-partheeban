import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Aperture,
  Camera,
  Film,
  Instagram,
  Mail,
  MapPin,
  Sparkle,
  ArrowUpRight,
} from "@/components/icons";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · Moments by Ganesh Partheeban" },
      {
        name: "description",
        content:
          "Enquire about candid photography across weddings, events, concerts, shows and behind-the-scenes. Bookings confirmed by date availability.",
      },
      { property: "og:title", content: "Contact · Moments by Ganesh Partheeban" },
      {
        property: "og:description",
        content: "Enquire about candid photography across India.",
      },
    ],
  }),
  component: ContactPage,
});

const testimonials = [
  {
    q: "The photos felt real and emotional. Nothing looked forced. It actually felt like our wedding, not someone else's idea of one.",
    name: "M & A",
    venue: "Bengaluru Reception, 2025",
  },
  {
    q: "We received the images incredibly fast and could immediately share them with family back home.",
    name: "The Iyer family",
    venue: "Coimbatore, 2025",
  },
  {
    q: "Ganesh captured moments we didn't even realize were happening. We keep finding new favorites months later.",
    name: "S & K",
    venue: "Pondicherry Mehendi, 2024",
  },
];

const faqs = [
  {
    q: "Do you work alone?",
    a: "Yes. I personally handle photography coverage at every event.",
  },
  {
    q: "Do you provide albums or printed photos?",
    a: "No, all deliverables are digital only.",
  },
  {
    q: "How quickly are photos delivered?",
    a: "I prioritise fast turnaround and early sharing whenever possible.",
  },
  {
    q: "Do you travel outside your city?",
    a: "Yes. I accept bookings across India.",
  },
  {
    q: "Are travel and stay included?",
    a: "No. Travel and accommodation are separate from the event pricing.",
  },
  {
    q: "Is pricing hourly?",
    a: "No. Pricing is based on the event itself and the coverage required, with no hourly limitations and no clock-watching.",
  },
  {
    q: "How do we lock a date?",
    a: "A quick chat over Instagram or email, then a signed agreement and a booking advance confirms the date on my calendar.",
  },
];

function ContactPage() {
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-14 sm:px-6 sm:pt-16 sm:pb-20 md:px-10 md:pt-24 md:pb-28">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Mail className="h-3.5 w-3.5 text-accent" />
          Contact
        </p>
        <h1 className="mt-6 max-w-4xl font-display text-4xl leading-[0.95] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl xl:text-[7.5rem]">
          Let's talk about
          <br />
          <em className="not-italic text-accent">your event</em>.
        </h1>
        <p className="mt-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
          If you're looking for candid photography that feels natural,
          emotional, and true to the moment. Send a note. Bookings are confirmed
          by date availability.
        </p>

        <div className="mt-16 grid gap-px border border-border bg-border md:grid-cols-2">
          <a
            href="https://www.instagram.com/ganeshpartheeban/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-baseline justify-between bg-background p-8 transition-colors hover:bg-secondary md:p-12"
          >
            <div>
              <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                <Instagram className="h-3.5 w-3.5 text-accent" />
                Fastest reply
              </p>
              <p className="mt-4 font-display text-3xl md:text-5xl">
                Instagram DM
              </p>
              <p className="mt-2 text-muted-foreground">@ganeshpartheeban</p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="mailto:ganeshpartheeban@gmail.com"
            className="group flex items-baseline justify-between bg-background p-8 transition-colors hover:bg-secondary md:p-12"
          >
            <div>
              <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                <Mail className="h-3.5 w-3.5 text-accent" />
                For full briefs
              </p>
              <p className="mt-4 font-display text-3xl md:text-5xl">Email</p>
              <p className="mt-2 text-muted-foreground">
                ganeshpartheeban@gmail.com
              </p>
            </div>
            <ArrowUpRight className="h-6 w-6 text-accent transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </section>

      <BookingEnquiry />

      {/* Testimonials */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-20 md:px-10 md:py-28">
          <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
            <Sparkle className="h-3.5 w-3.5 text-accent" />
            Words from clients
          </p>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <figure key={i} className="flex flex-col gap-6">
                <p className="font-display text-2xl leading-snug md:text-3xl">
                  <span className="text-accent">“</span>
                  {t.q}
                  <span className="text-accent">”</span>
                </p>
                <figcaption>
                  <p className="font-display text-base text-foreground">
                    {t.name}
                  </p>
                  <p className="mt-1 font-mono-label text-xs text-muted-foreground">
                    {t.venue}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-20 md:px-10 md:py-32">
        <div className="grid gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Film className="h-3.5 w-3.5 text-accent" />
              FAQ
            </p>
            <h2 className="mt-6 font-display text-3xl leading-[1.05] tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
              Frequently asked.
            </h2>
          </div>
          <dl className="space-y-px md:col-span-8">
            {faqs.map((f, i) => (
              <div
                key={i}
                className="grid gap-3 border-b border-border py-8 md:grid-cols-12 md:gap-8"
              >
                <dt className="font-display text-xl leading-tight md:col-span-5 md:text-2xl">
                  {f.q}
                </dt>
                <dd className="text-muted-foreground md:col-span-7">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Family / Cultural",
  "Event / Concert / Show",
  "Behind-the-scenes",
] as const;
type EventType = (typeof EVENT_TYPES)[number];

const FORM_ENDPOINT = import.meta.env.VITE_FORM_ENDPOINT as string;
const FORM_TOKEN = import.meta.env.VITE_FORM_TOKEN as string;

type FormStatus = "idle" | "sending" | "sent" | "error" | "limit";

const SUBMISSIONS_KEY = "rms-enquiry-emails";
const MAX_PER_EMAIL = 5;

function getSubmittedCount(email: string): number {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    return map[email.toLowerCase().trim()] ?? 0;
  } catch {
    return 0;
  }
}

function recordSubmission(email: string) {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    const key = email.toLowerCase().trim();
    map[key] = (map[key] ?? 0) + 1;
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(map));
  } catch {}
}

const LOCATION_TIMEOUT_MS = 4000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
    );
  });
}

async function resolveLocation(): Promise<string> {
  const providers: Array<() => Promise<string>> = [
    async () => {
      const r = await fetch("https://ipapi.co/json/");
      const j = await r.json();
      const parts = [j.city, j.region, j.country_name].filter(Boolean);
      return parts.length ? `${parts.join(", ")}${j.ip ? ` (${j.ip})` : ""}` : "";
    },
    async () => {
      const r = await fetch("https://ipwho.is/");
      const j = await r.json();
      if (j && j.success !== false) {
        const parts = [j.city, j.region, j.country].filter(Boolean);
        return parts.length ? `${parts.join(", ")}${j.ip ? ` (${j.ip})` : ""}` : "";
      }
      return "";
    },
    async () => {
      const r = await fetch("https://api.country.is/");
      const j = await r.json();
      return j && j.country ? `${j.country}${j.ip ? ` (${j.ip})` : ""}` : "";
    },
  ];
  for (const p of providers) {
    try {
      const result = await withTimeout(p(), LOCATION_TIMEOUT_MS);
      if (result) return result;
    } catch {
      // try next provider
    }
  }
  return "";
}

function formatInr(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3;
}

function BookingEnquiry() {
  const [eventType, setEventType] = useState<EventType>("Wedding");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [budget, setBudget] = useState<string>("");
  const locationRef = useRef<string>("");
  const locationPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("eventType");
    if (requested && EVENT_TYPES.includes(requested as EventType)) {
      setEventType(requested as EventType);
    }
    if (window.location.hash === "#booking-enquiry") {
      requestAnimationFrame(() => {
        document
          .getElementById("booking-enquiry")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  useEffect(() => {
    locationPromiseRef.current = resolveLocation()
      .then((loc) => {
        locationRef.current = loc;
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();

    if (getSubmittedCount(email) >= MAX_PER_EMAIL) {
      setStatus("limit");
      return;
    }

    data.set("eventType", eventType);
    data.set("token", FORM_TOKEN);

    // If the location lookup is still in flight, wait up to 2s for it.
    if (!locationRef.current && locationPromiseRef.current) {
      try {
        await withTimeout(locationPromiseRef.current, 2000);
      } catch {}
    }
    data.set("location", locationRef.current);

    setStatus("sending");
    try {
      await fetch(FORM_ENDPOINT, { method: "POST", body: data, mode: "no-cors" });
      recordSubmission(email);
      setStatus("sent");
      form.reset();
      setEventType("Wedding");
      setBudget("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="booking-enquiry" className="scroll-mt-20 bg-foreground text-background">
      <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-16 sm:px-6 sm:py-24 md:grid-cols-12 md:gap-16 md:px-10 md:py-32">
        <div className="md:col-span-5">
          <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
            <Camera className="h-3.5 w-3.5 text-accent" />
            [ Booking enquiry ]
          </p>
          <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            Let's talk about{" "}
            <em className="not-italic text-accent">your event.</em>
          </h2>
          <p className="mt-8 max-w-md text-background/70">
            If you're looking for candid photography that feels natural,
            emotional, and true to the moment. Reach out below or message me
            directly.
          </p>
          <dl className="mt-12 space-y-6">
            <div>
              <dt className="inline-flex items-center gap-2 font-mono-label text-background/50">
                <Instagram className="h-3.5 w-3.5 text-accent" />
                Instagram
              </dt>
              <dd className="mt-1">
                <a
                  href="https://www.instagram.com/ganeshpartheeban/"
                  target="_blank"
                  rel="noreferrer"
                  className="border-b border-transparent hover:border-accent hover:text-accent"
                >
                  @ganeshpartheeban
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline-flex items-center gap-2 font-mono-label text-background/50">
                <Mail className="h-3.5 w-3.5 text-accent" />
                Email
              </dt>
              <dd className="mt-1">
                <a
                  href="mailto:ganeshpartheeban@gmail.com"
                  className="border-b border-transparent hover:border-accent hover:text-accent"
                >
                  ganeshpartheeban@gmail.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline-flex items-center gap-2 font-mono-label text-background/50">
                <MapPin className="h-3.5 w-3.5 text-accent" />
                Based in
              </dt>
              <dd className="mt-1">Chennai · Available across India</dd>
            </div>
          </dl>
          <p className="mt-12 font-mono-label text-xs leading-relaxed text-background/50">
            Bookings confirmed by date availability.
            <br />
            Travel &amp; stay charges quoted separately.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative md:col-span-7 rounded-xs border border-background/15 bg-background/[0.03] p-4 sm:p-6 md:p-10"
        >
          <Field n="01" label="Your name" name="name" placeholder="Sai Karthik" required />
          <Field
            n="02"
            label="Email"
            name="email"
            type="email"
            placeholder="saikarthik@gmail.com"
            required
          />
          <Field n="03" label="Event date" name="date" placeholder="October 18, 2027" />
          <Field n="04" label="City" name="city" placeholder="Bengaluru" />

          <div className="border-b border-background/15 py-6">
            <p className="font-mono-label text-xs text-background/50">05 / Event type</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {EVENT_TYPES.map((t) => {
                const active = t === eventType;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className={
                      "rounded-full border px-4 py-2 text-sm transition-colors " +
                      (active
                        ? "border-accent bg-accent text-background"
                        : "border-background/30 text-background/80 hover:border-background/60")
                    }
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-b border-background/15 py-6">
            <label
              htmlFor="budget"
              className="font-mono-label text-xs text-background/50"
            >
              06 / Budget (₹ INR)
            </label>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-lg text-background/60">₹</span>
              <input
                id="budget"
                name="budget"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="20,000"
                value={budget}
                onChange={(e) => setBudget(formatInr(e.target.value))}
                className="w-full bg-transparent text-background placeholder:text-background/40 focus:outline-none"
              />
            </div>
          </div>

          <div className="py-6">
            <label
              htmlFor="notes"
              className="font-mono-label text-xs text-background/50"
            >
              07 / Tell me about it
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              placeholder="Hi Ganesh, looking for casual candid coverage for our wedding. Small intimate gathering, mostly family. Would love to chat about availability and what's possible within budget."
              className="mt-3 w-full resize-y border-b border-background/20 bg-transparent pb-2 text-background placeholder:text-background/40 focus:border-accent focus:outline-none"
            />
          </div>

          {/* Honeypot — bots fill this; real users never see it. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 opacity-0"
          />

          <button
            type="submit"
            disabled={status === "sending" || status === "sent" || status === "limit"}
            className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full bg-accent px-6 py-4 font-display text-lg text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending"
              ? "Sending…"
              : status === "sent"
                ? "Thanks, I'll be in touch ✓"
                : status === "limit"
                  ? "Limit reached"
                  : status === "error"
                    ? "Try again ↻"
                    : "Send enquiry ↗"}
          </button>

          {status === "limit" && (
            <p className="mt-4 font-mono-label text-xs text-accent">
              You've already sent five enquiries from this device. Please email{" "}
              <a
                href="mailto:ganeshpartheeban@gmail.com"
                className="underline hover:text-accent"
              >
                ganeshpartheeban@gmail.com
              </a>{" "}
              directly for any follow-up.
            </p>
          )}
          {status === "sent" && (
            <p className="mt-4 font-mono-label text-xs text-accent">
              Enquiry received. I'll reply to the email you provided within a day or two.
            </p>
          )}
          {status === "error" && (
            <p className="mt-4 font-mono-label text-xs text-red-300">
              Couldn't send. Please email{" "}
              <a
                href="mailto:ganeshpartheeban@gmail.com"
                className="underline hover:text-accent"
              >
                ganeshpartheeban@gmail.com
              </a>{" "}
              directly.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}

function Field({
  n,
  label,
  name,
  type = "text",
  placeholder,
  required,
}: {
  n: string;
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="border-b border-background/15 py-6">
      <label htmlFor={name} className="font-mono-label text-xs text-background/50">
        {n} / {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-3 w-full bg-transparent text-background placeholder:text-background/40 focus:outline-none"
      />
    </div>
  );
}