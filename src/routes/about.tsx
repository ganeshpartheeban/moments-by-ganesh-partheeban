import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import portrait from "@/assets/portrait.jpg";
import { Aperture, Camera, Lens, Sparkle, ArrowUpRight } from "@/components/icons";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildReviewsLD,
  ldScriptBody,
} from "@/lib/seo";
import { FORM_ENDPOINT, FORM_TOKEN } from "@/lib/form-config";
import { useI18n } from "@/lib/i18n";

type Testimonial = { q: string; name: string; venue: string };

const TESTIMONIALS = [
  {
    q: "The way he captures light, shades, details, and fleeting moments is quietly magical, often introducing you to a version of yourself you hadn't noticed before. Ganesh has a beautiful way of making people feel seen, both through his lens and in the moments he preserves.",
    name: "Swetha Krishnaswamy",
    venue: "Bengaluru, 2025",
  },
  {
    q: "Ganesh managed to capture just more than the bride and groom. He captured what the other photographers missed, the emotions and moments of our friends and family. I've been sharing the pictures taken by Ganesh to everyone rather than the ones taken by the official photographers, which says a lot about how much we love his work.",
    name: "The Damala Family",
    venue: "Bengaluru, 2025",
  },
  {
    q: "There is something more to Ganesh's clicks than one sees at first glance. Every picture tells a story, and his work has a unique ability to transport you back to that moment, making you relive the joy, laughter, and love all over again.",
    name: "Vignesh Kavikumar",
    venue: "Chennai, 2024",
  },
];

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Ganesh Partheeban · Candid Photographer in Chennai" },
      {
        name: "description",
        content:
          "Meet Ganesh Partheeban, an independent candid wedding and event photographer based in Chennai, Tamil Nadu. Documentary coverage across India — weddings, family functions, concerts, shows, behind-the-scenes.",
      },
      { property: "og:title", content: "About · Moments by Ganesh Partheeban" },
      { property: "og:url", content: absoluteUrl("/about") },
      {
        property: "og:description",
        content:
          "Independent candid photographer based in Chennai. Quiet observation, honest interaction, real moments.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/about") }],
    scripts: [
      {
        type: "application/ld+json",
        children: ldScriptBody(
          buildBreadcrumbLD([
            { name: "Work", url: "/" },
            { name: "About", url: "/about" },
          ]),
        ),
      } as Record<string, string>,
      {
        type: "application/ld+json",
        children: ldScriptBody(buildReviewsLD(TESTIMONIALS)),
      } as Record<string, string>,
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 md:px-10 md:pt-14 md:pb-24">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Aperture className="h-3.5 w-3.5 text-accent" />
          {t("about.label")}
        </p>
        <div className="mt-8 grid items-start gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <h1 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
              {t("about.headline.l1")}
              <br />
              {t("about.headline.l2")}
              <br />
              {t("about.headline.l3.before")}{" "}
              <em className="not-italic text-accent">
                {t("about.headline.l3.accent")}
              </em>
              .
            </h1>
            <div className="mt-12 space-y-6 text-lg leading-relaxed text-foreground md:max-w-xl">
              <p>{t("about.body.p1")}</p>
              <p className="text-muted-foreground">{t("about.body.p2")}</p>
            </div>
          </div>
          <div className="self-start md:col-span-5">
            <figure>
              <img
                src={portrait}
                alt="Portrait of Ganesh Partheeban with his camera"
                loading="eager"
                decoding="async"
                className="aspect-[4/5] max-h-[78vh] w-full object-cover object-center md:aspect-[3/4]"
              />
              <figcaption className="mt-3 inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                <Camera className="h-3.5 w-3.5 text-accent" />
                {t("about.portrait.caption")}
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-14 md:px-10 md:py-18">
          <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
            <Aperture className="h-3.5 w-3.5 text-accent" />
            {t("about.howIWork.label")}
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-12">
            {[
              { n: "I.", t: t("about.howIWork.01.t"), b: t("about.howIWork.01.b") },
              { n: "II.", t: t("about.howIWork.02.t"), b: t("about.howIWork.02.b") },
              { n: "III.", t: t("about.howIWork.03.t"), b: t("about.howIWork.03.b") },
            ].map((s) => (
              <div key={s.n} className="relative">
                <span className="absolute -left-0 top-0 h-px w-8 bg-accent" />
                <p className="pt-4 font-display text-3xl text-accent">{s.n}</p>
                <h3 className="mt-5 font-display text-2xl">{s.t}</h3>
                <p className="mt-3 text-background/70">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="testimonials"
        className="scroll-mt-20 border-b border-border bg-secondary/40"
      >
        <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-18">
          <div className="grid gap-12 md:grid-cols-[3fr_2fr] md:gap-16">
            <div>
              <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                <Sparkle className="h-3.5 w-3.5 text-accent" />
                {t("about.testimonials.label")}
              </p>
              <TestimonialCarousel items={TESTIMONIALS} />
            </div>
            <div className="border-t border-border pt-12 md:border-l md:border-t-0 md:pl-12 md:pt-0">
              <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                <Sparkle className="h-3.5 w-3.5 text-accent" />
                {t("about.testimonials.shareYours")}
              </p>
              <TestimonialForm />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-18">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Lens className="h-3.5 w-3.5 text-accent" />
              {t("about.specialization.label")}
            </p>
          </div>
          <ul className="space-y-px md:col-span-8">
            {[
              t("about.specialization.01"),
              t("about.specialization.02"),
              t("about.specialization.03"),
              t("about.specialization.04"),
            ].map((item, i) => (
              <li
                key={item}
                className="flex items-baseline justify-between border-b border-border py-6"
              >
                <span className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl">{item}</span>
                <span className="inline-flex items-center gap-2 font-mono-label text-accent">
                  <Sparkle className="h-3 w-3" />
                  0{i + 1}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-16">
          <Link
            to="/contact"
            className="group inline-flex items-center gap-2 border-b border-foreground pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
          >
            {t("about.cta")}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

const CAROUSEL_INTERVAL_MS = 15_000;

function TestimonialCarousel({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const count = items.length;

  // Auto-advance to the next testimonial every 15s. The timer is keyed on
  // `index` so any manual nav (prev/next) resets the clock — visitors don't
  // get yanked forward immediately after clicking back.
  useEffect(() => {
    if (count <= 1) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % count);
    }, CAROUSEL_INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [count, index]);

  if (count === 0) return null;

  const go = (delta: number) =>
    setIndex((i) => (i + delta + count) % count);

  return (
    <div className="mt-10 md:mt-12">
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(calc(${-index * 80}% + 10%))` }}
        >
          {items.map((t, i) => {
            const active = i === index;
            return (
              <figure
                key={i}
                aria-hidden={!active}
                className="w-[80%] flex-shrink-0 px-2 sm:px-4"
              >
                <div
                  className={
                    "flex flex-col gap-6 border-l-2 bg-background p-6 transition-opacity duration-500 sm:p-8 " +
                    (active
                      ? "border-accent opacity-100"
                      : "border-border opacity-40")
                  }
                >
                  <p className="font-display text-lg leading-snug sm:text-xl md:text-2xl">
                    <span className="text-accent">“</span>
                    {t.q}
                    <span className="text-accent">”</span>
                  </p>
                  <figcaption>
                    <p className="font-display text-base text-foreground">{t.name}</p>
                    <p className="mt-1 font-mono-label text-xs text-muted-foreground">
                      {t.venue}
                    </p>
                  </figcaption>
                </div>
              </figure>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-6 flex items-center gap-4">
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>←</span>
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next testimonial"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <span aria-hidden>→</span>
          </button>
          <span className="font-mono-label text-xs text-muted-foreground">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

type TestimonialFormStatus = "idle" | "sending" | "sent" | "error";

function TestimonialForm() {
  const { t } = useI18n();
  const [status, setStatus] = useState<TestimonialFormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "sending" || status === "sent") return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    const venue = String(fd.get("venue") ?? "").trim();
    const message = String(fd.get("message") ?? "").trim();

    if (!name || !message) {
      setErrorMsg("Please add your name and a few words.");
      setStatus("error");
      return;
    }
    if (message.length > 1000) {
      setErrorMsg("Please keep it under 1000 characters.");
      setStatus("error");
      return;
    }

    // Unique placeholder email per testimonial keeps the per-email rate limit
    // (intended for booking enquiries) from blocking legitimate testimonials.
    const placeholderEmail = `testimonial-${Date.now()}@noreply.ganeshpartheeban.in`;
    const data = new FormData();
    data.set("name", name);
    data.set("email", placeholderEmail);
    data.set("eventType", "Testimonial");
    data.set("city", venue);
    data.set("notes", message);
    data.set("token", FORM_TOKEN);

    setStatus("sending");
    try {
      await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: data,
        mode: "no-cors",
      });
      setStatus("sent");
      form.reset();
    } catch {
      setErrorMsg("Couldn't send right now. Please try again later.");
      setStatus("error");
    }
  };

  if (status === "sent") {
    return (
      <p className="mt-10 max-w-sm font-display text-xl leading-snug text-foreground md:mt-12 md:text-2xl">
        <span className="text-accent">“</span>
        {t("about.testimonialForm.thanks")}
        <span className="text-accent">”</span>
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-10 space-y-5 md:mt-12"
      noValidate
    >
      <TField
        label={t("about.testimonialForm.name")}
        name="name"
        placeholder="Sai Karthik"
        required
        onInput={() => status === "error" && setStatus("idle")}
      />
      <TField
        label={t("about.testimonialForm.venue")}
        name="venue"
        placeholder="Bengaluru, 2026"
      />
      <div className="border-b border-border pb-2">
        <label
          htmlFor="testimonial-message"
          className="font-mono-label text-xs text-muted-foreground"
        >
          {t("about.testimonialForm.message")}
        </label>
        <textarea
          id="testimonial-message"
          name="message"
          rows={4}
          required
          placeholder={t("about.testimonialForm.placeholder")}
          onInput={() => status === "error" && setStatus("idle")}
          className="mt-2 w-full resize-y bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-mono-label text-xs text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending"
          ? t("about.testimonialForm.sending")
          : t("about.testimonialForm.submit")}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>

      {status === "error" && (
        <p className="font-mono-label text-xs text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}

function TField({
  label,
  name,
  placeholder,
  required,
  onInput,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  onInput?: () => void;
}) {
  return (
    <div className="border-b border-border pb-2">
      <label
        htmlFor={`tf-${name}`}
        className="font-mono-label text-xs text-muted-foreground"
      >
        {label}
      </label>
      <input
        id={`tf-${name}`}
        name={name}
        type="text"
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        onInput={onInput}
        className="mt-2 w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
      />
    </div>
  );
}