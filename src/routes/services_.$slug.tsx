import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowUpRight, Camera, Film } from "@/components/icons";
import StoryCard from "@/components/StoryCard";
import { CityLinks, FaqList } from "@/components/SeoSections";
import {
  absoluteUrl,
  buildBreadcrumbLD,
  buildFAQLD,
  buildServiceLD,
  ldScriptBody,
} from "@/lib/seo";
import { BASE_PRICE, SERVICES, findService, servicePrice } from "@/lib/services";
import { CASE_STUDIES } from "@/lib/case-studies";
import { useI18n, translate, type Locale } from "@/lib/i18n";
import { localize, localizeAll } from "@/lib/localize";

export const Route = createFileRoute("/services_/$slug")({
  loader: ({ params }) => {
    const service = findService(params.slug);
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData, match }) => {
    const locale = (match.context as { locale: Locale }).locale;
    const raw = loaderData;
    if (!raw) return { meta: [{ title: "Service not found" }] };
    const sv = localize(raw, locale);
    const url = `/services/${sv.slug}`;
    const title = translate(locale, "meta.service.title", { name: sv.title });
    const description = translate(locale, "meta.service.desc", {
      short: sv.short,
      price: translate(locale, sv.comingSoon ? "meta.price.soon" : "meta.price.from"),
    });
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
      ],
      scripts: [
        { type: "application/ld+json", children: ldScriptBody(buildServiceLD(sv)) } as Record<string, string>,
        {
          type: "application/ld+json",
          children: ldScriptBody(
            buildBreadcrumbLD([
              { name: translate(locale, "nav.work"), url: "/" },
              { name: translate(locale, "nav.services"), url: "/services" },
              { name: sv.title, url },
            ]),
          ),
        } as Record<string, string>,
        { type: "application/ld+json", children: ldScriptBody(buildFAQLD(sv.faqs)) } as Record<string, string>,
      ],
    };
  },
  component: ServicePage,
});

function ServicePage() {
  const { t, locale } = useI18n();
  const sv = localize(Route.useLoaderData(), locale);
  const stories = localizeAll(CASE_STUDIES, locale).filter((s) => sv.relatedStories.includes(s.slug));
  const others = localizeAll(SERVICES, locale).filter((s) => s.slug !== sv.slug);
  const price = servicePrice(sv);
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-10 sm:px-6 md:px-10 md:pt-18 md:pb-14">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Camera className="h-3.5 w-3.5 text-accent" />
          <Link to="/services" className="hover:text-foreground">{t("nav.services")}</Link>
          <span aria-hidden>/</span>
          <span>{sv.n}</span>
        </p>
        <h1 className="mt-6 max-w-5xl font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
          {sv.title}
          {sv.comingSoon && (
            <span className="ml-4 inline-flex translate-y-[-0.3em] items-center gap-1.5 rounded-full border border-accent/60 bg-accent/10 px-3 py-1 align-middle font-mono-label text-xs text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {t("svc.comingSoon")}
            </span>
          )}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">{sv.short}</p>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-[1800px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:gap-12 md:px-10 md:py-20">
          <div className="space-y-6 md:col-span-7">
            {sv.intro.map((p) => (
              <p key={p.slice(0, 24)} className="text-base leading-relaxed text-foreground/90 md:text-lg">
                {p}
              </p>
            ))}
          </div>
          <aside className="md:col-span-5 md:pl-10">
            <p className="font-mono-label text-muted-foreground">{t("svc.pricing")}</p>
            <p className="mt-3 font-display text-3xl text-foreground sm:text-4xl">
              {sv.comingSoon ? t("svc.comingSoon") : (
                <>
                  {t("svc.from")} <span className="text-accent">₹{price.toLocaleString("en-IN")}</span>{" "}
                  <span className="text-xl text-muted-foreground">{t("svc.perEvent")}</span>
                </>
              )}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {sv.comingSoon
                ? t("svc.comingSoon.note")
                : t("svc.pricing.note", { base: BASE_PRICE.label })}
            </p>
            <Link
              to="/contact"
              hash="booking-enquiry"
              search={{ eventType: sv.eventType } as never}
              className="group mt-6 inline-flex items-center gap-2 border-b border-foreground pb-1 font-mono-label text-foreground transition-colors hover:border-accent hover:text-accent"
            >
              {t("svc.enquireAbout")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="mx-auto grid max-w-[1800px] gap-12 px-4 py-12 sm:px-6 md:grid-cols-2 md:px-10 md:py-20">
          <div>
            <p className="font-mono-label text-muted-foreground">{t("svc.whatYouGet")}</p>
            <ul className="mt-6 space-y-3">
              {sv.whatYouGet.map((b) => (
                <li key={b} className="flex gap-3 text-foreground">
                  <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-12 font-mono-label text-muted-foreground">{t("svc.idealFor")}</p>
            <ul className="mt-6 space-y-3">
              {sv.idealFor.map((b) => (
                <li key={b} className="flex gap-3 text-muted-foreground">
                  <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono-label text-muted-foreground">{t("svc.occasions")}</p>
            <ul className="mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
              {sv.ceremonies.map((c) => (
                <li key={c} className="bg-background px-5 py-4 font-display text-lg leading-tight">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {stories.length > 0 && (
        <section className="border-t border-border">
          <div className="mx-auto max-w-[1800px] px-4 py-12 sm:px-6 md:px-10 md:py-20">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Film className="h-3.5 w-3.5 text-accent" />
              {t("svc.related")}
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
            <FaqList faqs={sv.faqs} />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-secondary/60">
        <div className="mx-auto grid max-w-[1800px] gap-12 px-4 py-12 sm:px-6 md:grid-cols-2 md:px-10 md:py-16">
          <CityLinks />
          <div>
            <p className="font-mono-label text-muted-foreground">{t("svc.other")}</p>
            <ul className="mt-6 space-y-3">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    to="/services/$slug"
                    params={{ slug: o.slug }}
                    className="font-display text-xl text-foreground transition-colors hover:text-accent"
                  >
                    {o.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto grid max-w-[1800px] items-end gap-10 px-4 py-12 sm:px-6 md:grid-cols-12 md:px-10 md:py-20">
          <h2 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:col-span-8 md:text-7xl">
            {t("svc.cta.before")} <em className="not-italic text-accent">{t("svc.cta.accent")}</em>
            {t("svc.cta.after")}
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
