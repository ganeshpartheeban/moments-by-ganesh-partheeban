/**
 * Wedding & event stories · narrative photo sequences from a single shoot.
 *
 * `sequence` is an array of 1-based gallery photo numbers (matching the
 * gallery-N.JPG filenames). Renderers convert to 0-based array indices when
 * pulling Photo objects out of GALLERY.
 *
 * `kind` drives the subtitle line shown on the story page.
 */

export type CaseStudyKind = "wedding" | "concert" | "ritual" | "events";

export type CaseStudy = {
  slug: string;
  title: string;
  location: string;
  date: string;
  kind: CaseStudyKind;
  /** Short editorial intro shown above the photo masonry. */
  intro: string;
  /** 1-based gallery number used as the cover. */
  cover: number;
  /** 1-based gallery numbers, in display order. */
  sequence: number[];
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "mevlin-nikhil",
    title: "Mevlin weds Nikhil",
    location: "Kerala",
    date: "August 2025",
    kind: "wedding",
    intro:
      "Mevlin and Nikhil's Kerala wedding, photographed through monsoon-soft light. Family in motion, slow rituals, and the small in-between moments that usually slip past a camera.",
    cover: 1,
    sequence: [1, 6, 10, 12, 16, 18, 28, 37, 40],
  },
  {
    slug: "swati-sushin",
    title: "Swati weds Sushin",
    location: "Kerala",
    date: "October 2024",
    kind: "wedding",
    intro:
      "A late-monsoon house wedding for Swati and Sushin · two days of guests, ceremonies and quiet corners, documented as they actually unfolded rather than as they were planned to.",
    cover: 9,
    sequence: [9, 15, 17, 19, 20, 26, 27, 39],
  },
  {
    slug: "bhavana-jayanth",
    title: "Bhavana weds Jayanth",
    location: "Bengaluru",
    date: "April 2024",
    kind: "wedding",
    intro:
      "A Bengaluru wedding for Bhavana and Jayanth · close family, longer rituals, and the kind of glances and laughs that go missing in posed photographs.",
    cover: 11,
    sequence: [11, 22, 23, 24, 21, 25, 38],
  },
  {
    slug: "theyyam-kannur",
    title: "Theyyam",
    location: "Kannur",
    date: "December 2024",
    kind: "ritual",
    intro:
      "A night with Theyyam in Kannur · fire, drumbeat, and the heavy, dignified pull of a centuries-old ritual still very much alive on the Malabar coast.",
    cover: 5,
    sequence: [5, 8, 14, 45, 31],
  },
  {
    slug: "agam-bengaluru",
    title: "Agam Concert",
    location: "Bengaluru",
    date: "June 2025",
    kind: "concert",
    intro:
      "Agam live in Bengaluru · stagelight, instruments in motion, and a crowd carried, slowly and then all at once, by the music.",
    cover: 2,
    sequence: [2, 4, 41, 42],
  },
  {
    slug: "concerts-chennai",
    title: "Concerts & Events",
    location: "Chennai",
    date: "2025 & 2026",
    kind: "events",
    intro:
      "An evolving collection of Chennai's stage and street · frames from concerts, openings, and performances I keep returning to around the city.",
    cover: 30,
    sequence: [30, 32, 33, 34, 35, 44],
  },
];

export const findCaseStudy = (slug: string) =>
  CASE_STUDIES.find((c) => c.slug === slug);

export const kindLabel = (kind: CaseStudyKind): string => {
  switch (kind) {
    case "wedding":
      return "A wedding, in frames";
    case "concert":
      return "A concert, in frames";
    case "ritual":
      return "A ritual, in frames";
    case "events":
      return "Concerts & events, in frames";
  }
};
