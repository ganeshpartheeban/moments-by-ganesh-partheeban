import { createFileRoute, Link } from "@tanstack/react-router";
import { Aperture, Sparkle, ArrowUpRight } from "@/components/icons";
import { absoluteUrl, buildBreadcrumbLD, ldScriptBody } from "@/lib/seo";
import { PRESS, type PressCategory } from "@/lib/press";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/press")({
  head: () => ({
    meta: [
      {
        title:
          "Press · Photographs by Ganesh Partheeban featured in editorial publications",
      },
      {
        name: "description",
        content:
          "Selected editorial features that have used Ganesh Partheeban's photographs — from The Hindu and NDTV Profit to UN ESCAP, Cornell University, and Condé Nast Traveller.",
      },
      { property: "og:title", content: "Press · Moments by Ganesh Partheeban" },
      { property: "og:url", content: absoluteUrl("/press") },
      {
        property: "og:description",
        content:
          "Editorial features that have used Ganesh Partheeban's photographs.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/press") }],
    scripts: [
      {
        type: "application/ld+json",
        children: ldScriptBody(
          buildBreadcrumbLD([
            { name: "Work", url: "/" },
            { name: "Press", url: "/press" },
          ]),
        ),
      } as Record<string, string>,
    ],
  }),
  component: PressPage,
});

const CATEGORY_ORDER: PressCategory[] = [
  "Editorial",
  "Travel & Lifestyle",
  "Global & Academic",
  "Culture",
  "Specialist",
];

function PressPage() {
  const { t } = useI18n();
  // Group by category, preserving CATEGORY_ORDER.
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: PRESS.filter((p) => p.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-12 pb-12 sm:px-6 sm:pt-16 sm:pb-16 md:px-10 md:pt-20 md:pb-20">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Sparkle className="h-3.5 w-3.5 text-accent" />
          {t("press.label")}
        </p>
        <div className="mt-6 grid gap-10 md:grid-cols-12 md:gap-16">
          <h1 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:col-span-7 md:text-7xl">
            {t("press.headline.before")}{" "}
            <em className="not-italic text-accent">{t("press.headline.accent")}</em>{" "}
            {t("press.headline.after")}
          </h1>
          <p className="text-muted-foreground md:col-span-5 md:text-lg">
            {t("press.body")}
          </p>
        </div>
        <div className="mt-10 flex items-baseline gap-6 border-t border-border pt-6">
          <p className="font-display text-2xl text-foreground sm:text-3xl">
            <span className="text-accent">{PRESS.length}</span>{" "}
            {t("press.featuresLabel")}
          </p>
          <p className="font-mono-label text-xs text-muted-foreground">
            {t("press.andCounting")}
          </p>
        </div>
      </section>

      {grouped.map(({ category, items }) => (
        <section
          key={category}
          className="border-t border-border first:border-y odd:bg-secondary/40"
        >
          <div className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-14 md:px-10 md:py-16">
            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-3">
                <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
                  <Aperture className="h-3.5 w-3.5 text-accent" />
                  {category}
                </p>
                <p className="mt-3 font-display text-xl leading-tight tracking-tight sm:text-2xl">
                  {items.length} {items.length === 1 ? "feature" : "features"}
                </p>
              </div>

              <div className="grid gap-px overflow-hidden border border-border bg-border md:col-span-9 sm:grid-cols-2">
                {items.map((p) => (
                  <a
                    key={p.url}
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-accent/[0.04] sm:p-8"
                  >
                    <p className="font-mono-label text-xs text-muted-foreground">
                      {hostnameOf(p.url)}
                    </p>
                    <h2 className="font-display text-2xl leading-tight tracking-tight sm:text-3xl">
                      {p.name}
                    </h2>
                    <p className="text-muted-foreground">{p.topic}</p>
                    <div className="mt-2 inline-flex items-center gap-2 font-mono-label text-xs text-foreground transition-colors group-hover:text-accent">
                      {t("press.readArticle")}
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-[1800px] px-4 py-10 sm:px-6 sm:py-16 md:px-10 md:py-20">
        <div className="grid items-end gap-10 md:grid-cols-12">
          <div className="md:col-span-8">
            <p className="font-mono-label text-muted-foreground">
              {t("press.outro.label")}
            </p>
            <h2 className="mt-6 font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl">
              {t("press.outro.title.before")}
              <br />
              also{" "}
              <em className="not-italic text-accent">
                {t("press.outro.title.accent")}
              </em>
              .
            </h2>
          </div>
          <div className="md:col-span-4">
            <p className="text-muted-foreground">{t("press.outro.body")}</p>
            <Link
              to="/contact"
              className="group mt-8 inline-flex items-center gap-2 border-b border-foreground pb-1 font-display text-lg transition-colors hover:border-accent hover:text-accent"
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

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
