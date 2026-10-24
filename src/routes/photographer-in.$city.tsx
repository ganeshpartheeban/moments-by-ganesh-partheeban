import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight, Film, MapPin } from "@/components/icons";
import StoryCard from "@/components/StoryCard";
import { CityLinks, FaqList } from "@/components/SeoSections";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildCityLD,
  buildFAQLD,
  ldScriptBody,
} from "@/lib/seo";
import { findCity } from "@/lib/cities";
import { SERVICES } from "@/lib/services";
import { CASE_STUDIES } from "@/lib/case-studies";
import { useI18n, translate, type Locale } from "@/lib/i18n";
import { localize, localizeAll } from "@/lib/localize";

export const Route = createFileRoute("/photographer-in/$city")({
  loader: ({ params }) => {
    const city = findCity(params.city);
    if (!city) throw notFound();
    return city;
  },
  head: ({ loaderData, match }) => {
    const locale = (match.context as { locale: Locale }).locale;
    const raw = loaderData;
    if (!raw) return { meta: [{ title: "City not found" }] };
    const c = localize(raw, locale);
    const url = `/photographer-in/${c.slug}`;
    const place = translate(
      locale,
      c.slug === "across-india" ? "city.place.india" : "city.place.in",
      { name: c.name },
    );
    const title = translate(locale, "meta.city.title", { place });
    const description = translate(locale, "meta.city.desc", { place });
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      scripts: [
        { type: "application/ld+json", children: ldScriptBody(buildCityLD(c)) } as Record<string, string>,
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildBreadcrumbLD([
              { name: translate(locale, "nav.work"), url: "/" },
              { name: translate(locale, "nav.services"), url: "/services" },
              { name: c.name, url },
            ]),
          ),
        } as Record<string, string>,
        { type: "application/ld+json", children: ldScriptBody(buildFAQLD(c.faqs)) } as Record<string, string>,
      ],
    };
  },
  component: CityPage,
});

function CityPage() {
  const { t, locale } = useI18n();
  const c = localize(Route.useLoaderData(), locale);
  const stories = localizeAll(CASE_STUDIES, locale).filter((s) => c.stories.includes(s.slug));
  const services = localizeAll(SERVICES, locale).filter((s) => c.services.includes(s.slug));
  const isIndia = c.slug === "across-india";
  const place = isIndia ? t("city.place.india") : t("city.place.in", { name: c.name });
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-10 sm:px-6 md:px-10 md:pt-18 md:pb-14">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          {c.state}
        </p>
        <h1 className="mt-6 max-w-5xl font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
          {t("city.lead")} <em className="not-italic text-accent">{place}</em>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t("city.sub")}
        </p>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:gap-12 md:px-10 md:py-20">
          <div className="space-y-6 md:col-span-7">
            {c.intro.map((p) => (
              <p key={p.slice(0, 24)} className="text-base leading-relaxed text-foreground/90 md:text-lg">
                {p}
              </p>
            ))}
          </div>
          {c.wellKnownVenues.length > 0 && (
            <aside className="md:col-span-5 md:pl-10">
              <p className="font-mono-label text-muted-foreground">{t("city.venues")}</p>
              <ul className="mt-6 space-y-3">
                {c.wellKnownVenues.map((v) => (
                  <li key={v} className="flex gap-3 font-display text-xl text-foreground">
                    <span className="mt-3 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {v}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                {t("city.venues.note")}
              </p>
            </aside>
          )}
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 md:px-10 md:py-20">
          <p className="font-mono-label text-muted-foreground">
            {t("city.photograph", { place })}
          </p>
          <ul className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <li key={s.slug} className="bg-background">
                <Link
                  to="/services/$slug"
                  params={{ slug: s.slug }}
                  className="group flex h-full items-start justify-between gap-3 px-5 py-5 transition-colors hover:bg-accent/[0.05] sm:px-6"
                >
                  <span>
                    <span className="block font-display text-xl leading-tight">{s.title}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">{s.short}</span>
                  </span>
                  <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 md:px-10 md:py-20">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Film className="h-3.5 w-3.5 text-accent" />
              {isIndia ? t("city.stories.india") : t("city.stories.in", { name: c.state === "Kerala" ? c.state : c.name })}
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {stories.map((s, i) => (
                <StoryCard key={s.slug} study={s} eager={i < 2} staggerIndex={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:px-10 md:py-20">
          <div className="md:col-span-4">
            <p className="font-mono-label text-muted-foreground">{t("seo.questions")}</p>
            <h2 className="mt-4 font-display text-3xl leading-[1.05] tracking-tight sm:text-4xl md:text-5xl">
              {t("seo.goodToKnow")}
            </h2>
          </div>
          <div className="md:col-span-8">
            <FaqList faqs={c.faqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 md:px-10 md:py-16">
          <CityLinks title={t("seo.otherPlaces")} />
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1800px] items-end gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:px-10 md:py-20">
          <h2 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:col-span-8 md:text-7xl">
            {isIndia ? t("city.cta.india") : t("city.cta.in", { name: c.name })}
          </h2>
          <div className="md:col-span-4">
            <p className="text-background/70">
              {t("seo.cta.body")}
            </p>
            <Link
              to="/contact"
              hash="booking-enquiry"
              className="group mt-8 inline-flex items-center gap-2 border-b border-background pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
            >
              {t("nav.enquire")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
