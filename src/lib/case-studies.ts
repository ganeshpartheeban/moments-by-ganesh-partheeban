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

export type CaseStudyText = {
  title: string;
  location: string;
  intro: string;
  ceremonies: string[];
  venue: string;
};

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
  /** Service slugs from services.ts this story illustrates. */
  services: string[];
  /** City slug from cities.ts (or a region page such as kerala). */
  citySlug: string;
  /** Ceremonies featured, in the vocabulary people search for. */
  ceremonies?: string[];
  venue?: string;
  /** Tamil versions of the text fields; merged over English by localize(). */
  ta?: Partial<CaseStudyText>;
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
    services: ["candid-wedding-photography", "engagement-pre-wedding-photography"],
    citySlug: "kerala",
    ceremonies: ["Kerala wedding"],
    ta: {
      title: "மெவ்லின் & நிகில் திருமணம்",
      location: "கேரளா",
      intro:
        "மெவ்லின் மற்றும் நிகிலின் கேரளத் திருமணம், பருவமழையின் மென்மையான வெளிச்சத்தில் பதிவானது. இயங்கும் குடும்பம், மெதுவான சடங்குகள், பெரும்பாலும் கேமராவிலிருந்து நழுவிப்போகும் சிறு இடைத் தருணங்கள்.",
      ceremonies: ["கேரளத் திருமணம்"],
    },
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
    services: ["candid-wedding-photography", "family-cultural-event-photography"],
    citySlug: "kerala",
    ceremonies: ["Kerala wedding", "House wedding"],
    ta: {
      title: "ஸ்வாதி & சுஷின் திருமணம்",
      location: "கேரளா",
      intro:
        "ஸ்வாதி மற்றும் சுஷினுக்கான பருவமழை இறுதிக்கால வீட்டுத் திருமணம் · இரண்டு நாட்கள் விருந்தினர்கள், சடங்குகள், அமைதியான மூலைகள்; திட்டமிட்டபடி அல்ல, உண்மையில் நடந்தபடியே பதிவு செய்யப்பட்டவை.",
      ceremonies: ["கேரளத் திருமணம்", "வீட்டுத் திருமணம்"],
    },
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
    services: ["candid-wedding-photography", "reception-photography"],
    citySlug: "bengaluru",
    ceremonies: ["Wedding rituals"],
    ta: {
      title: "பவானா & ஜெயந்த் திருமணம்",
      location: "பெங்களூரு",
      intro:
        "பவானா மற்றும் ஜெயந்தின் பெங்களூரு திருமணம் · நெருங்கிய குடும்பம், நீண்ட சடங்குகள், போஸ் கொடுத்த படங்களில் தவறிப்போகும் பார்வைகளும் சிரிப்புகளும்.",
      ceremonies: ["திருமணச் சடங்குகள்"],
    },
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
    services: ["family-cultural-event-photography"],
    citySlug: "kerala",
    ceremonies: ["Theyyam"],
    ta: {
      title: "தெய்யம்",
      location: "கண்ணூர்",
      intro:
        "கண்ணூரில் ஒரு தெய்யம் இரவு · நெருப்பு, மேளத்தின் ஒலி, மலபார் கடற்கரையில் இன்றும் உயிர்ப்புடன் இருக்கும் பல நூற்றாண்டுப் பழமையான சடங்கின் கனமான, கம்பீரமான ஈர்ப்பு.",
      ceremonies: ["தெய்யம்"],
    },
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
    services: ["event-concert-photography"],
    citySlug: "bengaluru",
    ceremonies: ["Concert"],
    ta: {
      title: "அகம் இசை நிகழ்ச்சி",
      location: "பெங்களூரு",
      intro:
        "பெங்களூருவில் அகம் நேரலை · மேடை விளக்கு, இயங்கும் இசைக்கருவிகள், இசையால் மெல்ல, பின் ஒரே நேரத்தில் ஈர்க்கப்படும் கூட்டம்.",
      ceremonies: ["இசை நிகழ்ச்சி"],
    },
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
    services: ["event-concert-photography"],
    citySlug: "chennai",
    ceremonies: ["Concerts", "Openings"],
    ta: {
      title: "இசை நிகழ்ச்சிகள் & நிகழ்வுகள்",
      location: "சென்னை",
      intro:
        "சென்னையின் மேடையும் தெருவும் · இசை நிகழ்ச்சிகள், தொடக்க விழாக்கள், நகரம் முழுவதும் நான் மீண்டும் மீண்டும் திரும்பிச் செல்லும் நிகழ்ச்சிகளிலிருந்து எடுத்த தொடர்ந்து வளரும் தொகுப்பு.",
      ceremonies: ["இசை நிகழ்ச்சிகள்", "தொடக்க விழாக்கள்"],
    },
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
