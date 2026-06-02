import { createFileRoute, Link } from "@tanstack/react-router";
import portrait from "@/assets/portrait.jpg";
import { Aperture, Camera, Lens, Sparkle, ArrowUpRight } from "@/components/icons";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About · Moments by Ganesh Partheeban" },
      {
        name: "description",
        content:
          "An independent candid photographer based in India. Weddings, events, concerts, shows and behind-the-scenes. Quiet observation, honest interaction, real moments.",
      },
      { property: "og:title", content: "About · Moments by Ganesh Partheeban" },
      {
        property: "og:description",
        content: "An independent candid photographer based in India.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-8 pb-12 sm:px-6 sm:pt-12 sm:pb-16 md:px-10 md:pt-14 md:pb-24">
        <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
          <Aperture className="h-3.5 w-3.5 text-accent" />
          About
        </p>
        <div className="mt-8 grid items-start gap-10 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-7">
            <h1 className="font-display text-4xl leading-[1] tracking-tight text-balance sm:text-5xl md:text-7xl lg:text-8xl">
              I believe the
              <br />
              best photographs
              <br />
              happen <em className="not-italic text-accent">naturally</em>.
            </h1>
            <div className="mt-12 space-y-6 text-lg leading-relaxed text-foreground md:max-w-xl">
              <p>
                Hi, I'm Ganesh Partheeban, a candid photographer based in India.
                I cover a wide range of events: weddings and family functions,
                concerts and live shows, corporate launches, and behind-the-scenes
                work. I focus on capturing authentic human moments: laughter
                between friends, quiet glances, performers in their element,
                and the atmosphere that makes each event its own.
              </p>
              <p className="text-muted-foreground">
                I work independently at events, blending into the crowd and
                documenting moments naturally instead of interrupting them. Before
                every event, I spend time understanding the important people
                involved: family members, close friends, key rituals, and personal
                dynamics, so I can anticipate the moments that matter.
              </p>
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
                Ganesh Partheeban · Tamil Nadu, India
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-[1800px] px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-28">
          <p className="inline-flex items-center gap-2 font-mono-label text-background/60">
            <Aperture className="h-3.5 w-3.5 text-accent" />
            How I work
          </p>
          <div className="mt-10 grid gap-10 sm:grid-cols-2 md:grid-cols-3 md:gap-12">
            {[
              { n: "I.", t: "Observe honestly", b: "Stay quiet. Watch first. Wait for the moment instead of building it." },
              { n: "II.", t: "Interact comfortably", b: "Earn ease so people forget the camera is there. The frame relaxes with them." },
              { n: "III.", t: "Capture as it unfolds", b: "Document the event the way it actually happens. Minimal interference, no styling." },
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

      <section className="mx-auto max-w-[1800px] px-4 py-14 sm:px-6 sm:py-20 md:px-10 md:py-28">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
              <Lens className="h-3.5 w-3.5 text-accent" />
              Specialization
            </p>
          </div>
          <ul className="space-y-px md:col-span-8">
            {[
              "Natural expressions",
              "Real emotions",
              "Minimal interference",
              "Timeless visual storytelling",
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
            Start a conversation
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}