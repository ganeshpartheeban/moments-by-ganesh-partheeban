/**
 * Service lines · single source of truth for /services, /services/$slug,
 * city pages and JSON-LD. English at top level, Tamil in each item's `ta` object.
 */

/** Global pricing baseline shown wherever a service has no own `fromPrice`. */
export const BASE_PRICE = { amount: 10000, currency: "INR", label: "from ₹10,000 per event" } as const;

export type Faq = { q: string; a: string };

export type ServiceLineText = {
  title: string;
  short: string;
  intro: string[];
  whatYouGet: string[];
  idealFor: string[];
  ceremonies: string[];
  faqs: Faq[];
};

export type ServiceLine = {
  slug: string;
  /** Index number shown on the services list, e.g. "S01". */
  n: string;
  title: string;
  /** Contact-form event type used for the enquire deep link. */
  eventType: string;
  short: string;
  /** 2-3 paragraphs. */
  intro: string[];
  whatYouGet: string[];
  idealFor: string[];
  /** Occasion vocabulary, written the way people search for it. */
  ceremonies: string[];
  faqs: Faq[];
  /** Story slugs from case-studies.ts. */
  relatedStories: string[];
  /** Per-service price override in INR. Undefined = global baseline. */
  fromPrice?: number;
  comingSoon?: boolean;
  /** Tamil versions of the text fields; merged over English by localize(). */
  ta?: Partial<ServiceLineText>;
};

const commonFaqs = (extra: Faq[] = []): Faq[] => [
  {
    q: "How is pricing decided?",
    a: "Pricing is event-based, never hourly. It starts from ₹10,000 per event and depends on the kind of event, its length and the number of functions. Send the date, venue and a short note through the enquiry form and I will reply with a clear quote.",
  },
  {
    q: "Do you travel outside Chennai?",
    a: "Yes. I am based in Chennai and available across India. Travel and stay are quoted separately and shared with you upfront, so there are no surprises later.",
  },
  {
    q: "Is delivery digital only?",
    a: "Yes. All deliverables are digital, shared as an online gallery. I do not provide printed albums, hard copies or physical photo books, though you are free to print the files anywhere you like.",
  },
  ...extra,
  {
    q: "How do I book a date?",
    a: "Use the booking enquiry form on the contact page with your date, venue and event type. Bookings are confirmed by date availability, so the earlier you write, the better the chance the date is still open.",
  },
];

const commonFaqsTa = (extra: Faq[] = []): Faq[] => [
  {
    q: "கட்டணம் எப்படி நிர்ணயிக்கப்படுகிறது?",
    a: "கட்டணம் நிகழ்வின் அடிப்படையில்தான், மணி நேரத்தின் அடிப்படையில் அல்ல. ஒரு நிகழ்வுக்கு ₹10,000-இலிருந்து தொடங்குகிறது; நிகழ்வின் வகை, நேர அளவு, விழாக்களின் எண்ணிக்கை ஆகியவற்றைப் பொறுத்து மாறும். தேதி, இடம், சிறு குறிப்பு ஆகியவற்றை விசாரணைப் படிவத்தில் அனுப்புங்கள்; தெளிவான கட்டண விவரத்துடன் பதிலளிக்கிறேன்.",
  },
  {
    q: "சென்னைக்கு வெளியே வருவீர்களா?",
    a: "வருவேன். நான் சென்னையைச் சேர்ந்தவன்; இந்தியா முழுவதும் பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்; பின்னர் எதிர்பாராத செலவு எதுவும் வராது.",
  },
  {
    q: "படங்கள் டிஜிட்டலாக மட்டும்தானா?",
    a: "ஆம். எல்லாமே டிஜிட்டல் வடிவில், ஆன்லைன் கேலரியாக வழங்கப்படும். அச்சிட்ட ஆல்பம், பிரிண்ட் அல்லது ஃபோட்டோ புத்தகங்கள் நான் தருவதில்லை; கோப்புகளை நீங்கள் விரும்பும் இடத்தில் அச்சிட்டுக்கொள்ளலாம்.",
  },
  ...extra,
  {
    q: "ஒரு தேதியை எப்படி முன்பதிவு செய்வது?",
    a: "தொடர்பு பக்கத்தில் உள்ள முன்பதிவு விசாரணைப் படிவத்தில் தேதி, இடம், நிகழ்வு வகையைக் குறிப்பிடுங்கள். முன்பதிவுகள் தேதி கிடைக்கும் தன்மையைப் பொறுத்தே உறுதியாகின்றன; எனவே முன்கூட்டியே எழுதினால் தேதி காலியாக இருக்கும் வாய்ப்பு அதிகம்.",
  },
];

export const SERVICES: ServiceLine[] = [
  {
    slug: "candid-wedding-photography",
    n: "S01",
    title: "Candid Wedding Photography",
    eventType: "Wedding",
    short:
      "Complete candid coverage of weddings and wedding-related events, from ceremony to celebration.",
    intro: [
      "A wedding is a long day made of very short moments: an uncle wiping his eyes during the thaali, a grandmother correcting a flower on the bride's braid, two cousins laughing at something nobody else heard. I work quietly inside the event and photograph these as they happen, rather than asking the family to stop and pose.",
      "South Indian weddings carry a lot of ritual and a fixed order of events. Knowing when the Kashi Yatra begins, when the Oonjal swings or when the Muhurtham will actually happen means I am already in position, not catching up. Whether it is a Kerala Hindu or Christian ceremony, a Chettinad, Iyer or Iyengar wedding, a Muslim nikah or a church service, I will ask about the sequence beforehand and respect the sanctity of each part.",
      "You get an honest, documentary record of the day: ritual, family, decor and emotion, in the order it unfolded. Delivery is digital only, through an online gallery.",
    ],
    whatYouGet: [
      "Full-day candid coverage",
      "A short pre-event briefing on rituals and key people",
      "All wedding rituals documented in sequence",
      "Family and group portraits, kept quick and relaxed",
      "Decor, details and venue atmosphere",
      "Online gallery with social-ready exports",
    ],
    idealFor: [
      "Couples who want to be present, not directed",
      "Families with long, multi-function weddings",
      "Traditional ceremonies with detailed rituals",
      "Destination and out-of-town weddings",
    ],
    ceremonies: [
      "Muhurtham",
      "Nalangu",
      "Kashi Yatra",
      "Oonjal",
      "Kerala Hindu weddings",
      "Kerala Christian weddings",
      "Chettinad weddings",
      "Iyer weddings",
      "Iyengar weddings",
      "Muslim nikah",
      "Church weddings",
    ],
    faqs: commonFaqs([
      {
        q: "Will you bring a second shooter?",
        a: "I shoot most weddings on my own, which keeps the coverage quiet and personal. For larger weddings or parallel functions, a second shooter can be arranged on request and is quoted separately.",
      },
      {
        q: "How long does delivery take?",
        a: "Galleries are delivered digitally and the timeline is confirmed when you book, depending on the length of the event. I aim to get them to you while the day still feels fresh.",
      },
    ]),
    ta: {
      title: "கேண்டிட் திருமணப் புகைப்படம்",
      short: "திருமணங்கள் மற்றும் திருமணம் சார்ந்த நிகழ்வுகளின் முழுமையான கேண்டிட் பதிவு, சடங்கிலிருந்து கொண்டாட்டம் வரை.",
      intro: [
        "திருமணம் என்பது மிகச் சிறிய தருணங்களால் ஆன ஒரு நீண்ட நாள்: தாலி கட்டும்போது கண்ணைத் துடைத்துக்கொள்ளும் ஒரு மாமா, மணப்பெண்ணின் பின்னலில் பூவைச் சரிசெய்யும் பாட்டி, வேறு யாருக்கும் கேட்காத ஒன்றைக் கேட்டுச் சிரிக்கும் இரண்டு உறவினர்கள். குடும்பத்தை நிறுத்தி போஸ் கொடுக்கச் சொல்லாமல், நிகழ்வுக்குள் அமைதியாக இருந்து இவற்றை நடக்கும்போதே படம்பிடிக்கிறேன்.",
        "தென்னிந்தியத் திருமணங்களில் சடங்குகள் அதிகம்; அவற்றுக்கு ஒரு நிலையான வரிசையும் உண்டு. காசி யாத்திரை எப்போது தொடங்கும், ஊஞ்சல் எப்போது ஆடும், முகூர்த்தம் எந்த நேரத்தில் நடக்கும் என்பது தெரிந்திருந்தால், நான் முன்பே சரியான இடத்தில் இருப்பேன், பின்தொடர்ந்து ஓட வேண்டியிருக்காது. கேரள இந்து அல்லது கிறிஸ்தவத் திருமணமாக இருந்தாலும், செட்டிநாடு, ஐயர், ஐயங்கார் திருமணமாக இருந்தாலும், முஸ்லிம் நிக்காஹ் அல்லது தேவாலய வழிபாடாக இருந்தாலும், வரிசையை முன்பே கேட்டறிந்து, ஒவ்வொரு பகுதியின் புனிதத்தையும் மதிப்பேன்.",
        "அந்த நாளின் நேர்மையான ஆவணப் பதிவு உங்களுக்குக் கிடைக்கும்: சடங்கு, குடும்பம், அலங்காரம், உணர்வு, எல்லாம் நடந்த வரிசையிலேயே. படங்கள் டிஜிட்டலாக மட்டும், ஆன்லைன் கேலரி வழியாக வழங்கப்படும்.",
      ],
      whatYouGet: [
        "முழு நாள் கேண்டிட் கவரேஜ்",
        "சடங்குகள், முக்கிய நபர்கள் பற்றிய சிறு முன்னறிவிப்பு உரையாடல்",
        "அனைத்துத் திருமணச் சடங்குகளும் வரிசைப்படி பதிவு",
        "குடும்ப மற்றும் குழுப் படங்கள், விரைவாகவும் இயல்பாகவும்",
        "அலங்காரம், சிறு விவரங்கள், மண்டபத்தின் சூழல்",
        "சமூக ஊடகத்துக்குத் தயாரான படங்களுடன் ஆன்லைன் கேலரி",
      ],
      idealFor: [
        "இயக்கப்படாமல், இயல்பாக இருக்க விரும்பும் தம்பதியர்",
        "பல விழாக்கள் கொண்ட நீண்ட திருமணங்களை நடத்தும் குடும்பங்கள்",
        "விரிவான சடங்குகள் கொண்ட பாரம்பரியத் திருமணங்கள்",
        "டெஸ்டினேஷன் மற்றும் வெளியூர்த் திருமணங்கள்",
      ],
      ceremonies: [
        "முகூர்த்தம்",
        "நலங்கு",
        "காசி யாத்திரை",
        "ஊஞ்சல்",
        "கேரள இந்துத் திருமணங்கள்",
        "கேரள கிறிஸ்தவத் திருமணங்கள்",
        "செட்டிநாட்டுத் திருமணங்கள்",
        "ஐயர் திருமணங்கள்",
        "ஐயங்கார் திருமணங்கள்",
        "முஸ்லிம் நிக்காஹ்",
        "தேவாலயத் திருமணங்கள்",
      ],
      faqs: commonFaqsTa([
        {
          q: "இரண்டாவது புகைப்படக்காரரை அழைத்து வருவீர்களா?",
          a: "பெரும்பாலான திருமணங்களை நான் தனியாகவே படம்பிடிக்கிறேன்; அதனால் கவரேஜ் அமைதியாகவும் நெருக்கமாகவும் இருக்கும். பெரிய திருமணங்களுக்கோ ஒரே நேரத்தில் நடக்கும் விழாக்களுக்கோ கேட்டுக்கொண்டால் இரண்டாவது புகைப்படக்காரரை ஏற்பாடு செய்யலாம்; அதற்கான கட்டணம் தனியாகத் தெரிவிக்கப்படும்.",
        },
        {
          q: "படங்கள் கிடைக்க எவ்வளவு நாளாகும்?",
          a: "கேலரி டிஜிட்டலாக வழங்கப்படும்; நிகழ்வின் நீளத்தைப் பொறுத்து, முன்பதிவின்போது காலக்கெடு உறுதி செய்யப்படும். அந்த நாளின் நினைவு புதிதாக இருக்கும்போதே படங்கள் உங்களுக்குக் கிடைக்க முயல்கிறேன்.",
        },
      ]),
    },
    relatedStories: ["mevlin-nikhil", "swati-sushin", "bhavana-jayanth"],
  },
  {
    slug: "reception-photography",
    n: "S02",
    title: "Reception Photography",
    eventType: "Reception",
    short:
      "Natural coverage of interactions, emotions and celebrations during receptions and after-parties.",
    intro: [
      "Receptions are fast, crowded and lit by stage lights and fairy lights, which is exactly where a documentary approach works best. I move through the room, watch the stage line and the dance floor, and photograph guests as they greet, tease and celebrate.",
      "The stage line can run for hours, with family and friends queuing for photographs with the couple. I keep group portraits efficient and well-framed, then go back to the candid frames in between: the toast, the nervous speech, the couple catching a breath at the side.",
      "Receptions work as a standalone booking or as the evening chapter of full wedding coverage.",
    ],
    whatYouGet: [
      "Stage and guest coverage",
      "Family and friends group portraits",
      "Speeches, toasts and first dance",
      "Atmosphere, decor and lighting details",
      "Online gallery with social-ready exports",
    ],
    idealFor: [
      "Separate evening receptions",
      "Large guest lists with long stage queues",
      "Couples who want candid moments alongside group portraits",
      "After-parties and sangeet-style evenings",
    ],
    ceremonies: [
      "Wedding reception",
      "Sangeet",
      "After-party",
      "Cocktail evening",
      "Stage line",
    ],
    faqs: commonFaqs([
      {
        q: "Can you cover only the reception?",
        a: "Yes. Receptions can be booked on their own or added to wedding-day coverage. Pricing is per event, from ₹10,000.",
      },
      {
        q: "How long does delivery take?",
        a: "Delivery is digital through an online gallery, with the timeline confirmed at booking.",
      },
    ]),
    ta: {
      title: "ரிசப்ஷன் புகைப்படம்",
      short: "ரிசப்ஷன்கள் மற்றும் ஆஃப்டர்-பார்ட்டிகளில் நிகழும் உரையாடல்கள், உணர்வுகள், கொண்டாட்டங்களின் இயல்பான பதிவு.",
      intro: [
        "ரிசப்ஷன்கள் வேகமானவை, கூட்டம் நிறைந்தவை, மேடை விளக்குகளாலும் அலங்கார விளக்குகளாலும் ஒளிர்பவை; ஆவணப் பாணி மிகவும் பொருந்தும் இடம் இதுவே. அறை முழுவதும் நகர்ந்து, மேடை வரிசையையும் நடனத் தளத்தையும் கவனித்து, விருந்தினர்கள் வாழ்த்துவதையும் கேலி செய்வதையும் கொண்டாடுவதையும் படம்பிடிக்கிறேன்.",
        "மேடை வரிசை பல மணி நேரம் நீளலாம்; குடும்பமும் நண்பர்களும் தம்பதியருடன் படம் எடுக்க வரிசையில் நிற்பார்கள். குழுப் படங்களை விரைவாகவும் நேர்த்தியாகவும் முடித்துவிட்டு, இடையிடையே கேண்டிட் காட்சிகளுக்குத் திரும்புகிறேன்: வாழ்த்துரை, பதற்றத்துடன் பேசும் உரை, ஓரமாக ஒரு நிமிடம் மூச்சு விடும் தம்பதியர்.",
        "ரிசப்ஷனைத் தனியாகவும் முன்பதிவு செய்யலாம்; முழுத் திருமண கவரேஜின் மாலைப் பகுதியாகவும் சேர்க்கலாம்.",
      ],
      whatYouGet: [
        "மேடை மற்றும் விருந்தினர் கவரேஜ்",
        "குடும்ப, நண்பர் குழுப் படங்கள்",
        "உரைகள், வாழ்த்துகள், முதல் நடனம்",
        "சூழல், அலங்காரம், விளக்கு அமைப்பின் விவரங்கள்",
        "சமூக ஊடகத்துக்குத் தயாரான படங்களுடன் ஆன்லைன் கேலரி",
      ],
      idealFor: [
        "தனியாக நடக்கும் மாலை ரிசப்ஷன்கள்",
        "நீண்ட மேடை வரிசை கொண்ட பெரிய விருந்தினர் பட்டியல்கள்",
        "குழுப் படங்களுடன் கேண்டிட் தருணங்களும் வேண்டும் தம்பதியர்",
        "ஆஃப்டர்-பார்ட்டிகள் மற்றும் சங்கீத் பாணி மாலைகள்",
      ],
      ceremonies: [
        "திருமண ரிசப்ஷன்",
        "சங்கீத்",
        "ஆஃப்டர்-பார்ட்டி",
        "காக்டெய்ல் மாலை",
        "மேடை வரிசை",
      ],
      faqs: commonFaqsTa([
        {
          q: "ரிசப்ஷனை மட்டும் படம்பிடிக்க முடியுமா?",
          a: "முடியும். ரிசப்ஷனைத் தனியாகவும் முன்பதிவு செய்யலாம்; திருமண நாள் கவரேஜுடன் சேர்க்கவும் செய்யலாம். கட்டணம் ஒரு நிகழ்வுக்கு ₹10,000-இலிருந்து.",
        },
        {
          q: "படங்கள் கிடைக்க எவ்வளவு நாளாகும்?",
          a: "படங்கள் ஆன்லைன் கேலரி மூலம் டிஜிட்டலாக வழங்கப்படும்; காலக்கெடு முன்பதிவின்போது உறுதி செய்யப்படும்.",
        },
      ]),
    },
    relatedStories: ["bhavana-jayanth", "swati-sushin"],
  },
  {
    slug: "engagement-pre-wedding-photography",
    n: "S03",
    title: "Engagement & Pre-Wedding",
    eventType: "Engagement",
    short:
      "Authentic storytelling for intimate ceremonies, roka, sagai and pre-wedding gatherings.",
    intro: [
      "The functions before a wedding are often the most relaxed. Families are meeting, the nerves are lower and there is time to notice small things. I cover engagement ceremonies, roka, sagai and nischayathartham with the same observational approach: ceremony, family interactions and the couple being themselves.",
      "For couples who want portraits, I keep sessions unhurried and unscripted, with simple prompts instead of stiff poses. Decor, rings, outfits and the details families spend weeks preparing are all part of the record.",
    ],
    whatYouGet: [
      "Ceremony documentation",
      "Family interactions and rituals",
      "Couple portraits, unscripted",
      "Decor, rings and details",
      "Online gallery with social-ready exports",
    ],
    idealFor: [
      "Engagement and betrothal ceremonies at home or in a hall",
      "Couples who dislike formal posing",
      "Families gathering from different cities",
      "Pre-wedding portrait sessions",
    ],
    ceremonies: [
      "Engagement",
      "Nischayathartham",
      "Roka",
      "Sagai",
      "Betrothal",
      "Mehendi",
      "Haldi",
      "Pre-wedding portrait session",
    ],
    faqs: commonFaqs([
      {
        q: "Do you do pre-wedding portrait sessions?",
        a: "Yes, as unhurried, location-based sessions with light direction rather than heavy posing. Share the location and mood you have in mind and I will suggest timing and light.",
      },
    ]),
    ta: {
      title: "நிச்சயதார்த்தம் & ப்ரீ-வெட்டிங்",
      short: "நெருக்கமான விழாக்கள், ரோகா, சகாய் மற்றும் திருமணத்துக்கு முந்தைய ஒன்றுகூடல்களின் உண்மையான பதிவு.",
      intro: [
        "திருமணத்துக்கு முந்தைய விழாக்கள்தான் பெரும்பாலும் மிகவும் தளர்வானவை. குடும்பங்கள் முதன்முறையாகச் சந்திக்கின்றன, பதற்றம் குறைவு, சிறு விஷயங்களை ரசிக்க நேரமும் உண்டு. நிச்சயதார்த்தம், நிச்சயதாம்பூலம், ரோகா, சகாய் போன்ற விழாக்களை அதே கவனிக்கும் பாணியில் பதிவு செய்கிறேன்: சடங்கு, குடும்ப உரையாடல்கள், தம்பதியர் தாங்களாகவே இருப்பது.",
        "போர்ட்ரெய்ட் வேண்டுமென்றால், அவசரமின்றி, திரைக்கதை இல்லாமல், இறுக்கமான போஸ்களுக்குப் பதிலாக எளிய குறிப்புகளுடன் படப்பிடிப்பை நடத்துகிறேன். அலங்காரம், மோதிரங்கள், உடைகள், குடும்பங்கள் வாரக்கணக்கில் தயாரித்த சிறு விவரங்கள் எல்லாமே பதிவின் ஒரு பகுதி.",
      ],
      whatYouGet: [
        "விழாவின் ஆவணப் பதிவு",
        "குடும்ப உரையாடல்கள் மற்றும் சடங்குகள்",
        "திரைக்கதை இல்லாத தம்பதியர் படங்கள்",
        "அலங்காரம், மோதிரங்கள், சிறு விவரங்கள்",
        "சமூக ஊடகத்துக்குத் தயாரான படங்களுடன் ஆன்லைன் கேலரி",
      ],
      idealFor: [
        "வீட்டிலோ மண்டபத்திலோ நடக்கும் நிச்சயதார்த்த விழாக்கள்",
        "முறையான போஸ் கொடுக்க விரும்பாத தம்பதியர்",
        "வெவ்வேறு ஊர்களிலிருந்து ஒன்றுகூடும் குடும்பங்கள்",
        "ப்ரீ-வெட்டிங் போர்ட்ரெய்ட் படப்பிடிப்புகள்",
      ],
      ceremonies: [
        "நிச்சயதார்த்தம்",
        "நிச்சயதாம்பூலம்",
        "ரோகா",
        "சகாய்",
        "திருமண உறுதி விழா",
        "மெஹந்தி",
        "ஹல்தி",
        "ப்ரீ-வெட்டிங் போர்ட்ரெய்ட் படப்பிடிப்பு",
      ],
      faqs: commonFaqsTa([
        {
          q: "ப்ரீ-வெட்டிங் போர்ட்ரெய்ட் படப்பிடிப்புகள் செய்வீர்களா?",
          a: "செய்வேன். இடத்தைப் பொறுத்த, அவசரமில்லாத படப்பிடிப்புகளாக, கனமான போஸ்களுக்குப் பதிலாக மெல்லிய வழிகாட்டலுடன். நீங்கள் மனதில் வைத்திருக்கும் இடத்தையும் உணர்வையும் சொல்லுங்கள்; நேரம், வெளிச்சம் பற்றி நான் பரிந்துரைக்கிறேன்.",
        },
      ]),
    },
    relatedStories: ["mevlin-nikhil", "swati-sushin"],
  },
  {
    slug: "family-cultural-event-photography",
    n: "S04",
    title: "Family & Cultural Events",
    eventType: "Family / Cultural",
    short:
      "Coverage for traditional functions, milestone celebrations and special gatherings.",
    intro: [
      "Some of the most important photographs a family owns come from functions that never get a professional photographer: a 60th birthday with three generations on one sofa, a baby shower, a naming ceremony, a housewarming. These are the days that gather everyone, and the images matter long after.",
      "I photograph traditional and cultural functions with attention to ritual and to people. That includes the priest's hands during the homam, an elder's blessing, the first taste of rice at an Annaprasanam, the moment the family sees the new home lit with lamps. I will ask beforehand which parts of the ritual are private or should not be photographed, and follow that.",
      "Coverage can be a couple of hours for a home function or a full day for a larger celebration, and is quoted per event.",
    ],
    whatYouGet: [
      "Cultural and religious ceremonies documented in sequence",
      "Multi-generational family portraits",
      "Ritual details: lamps, offerings, rangoli, decor",
      "Candid coverage of guests and celebration",
      "Online gallery with social-ready exports",
    ],
    idealFor: [
      "Milestone birthdays and anniversaries",
      "Home functions where families gather from afar",
      "Temple, community hall and in-house ceremonies",
      "Festivals and school or college events",
    ],
    ceremonies: [
      "Sashtiabdapoorthi (60th birthday)",
      "Sathabhishekam",
      "Valaikappu (baby shower)",
      "Naming ceremony",
      "Annaprasanam",
      "Upanayanam",
      "Puberty function (Manjal Neerattu Vizha)",
      "Housewarming (Grihapravesam)",
      "Pujas and festivals",
      "School and college events",
    ],
    faqs: commonFaqs([
      {
        q: "Can you photograph inside a temple or during private rituals?",
        a: "Only where it is permitted. I check the venue's rules and the family's wishes beforehand and do not photograph anything that should stay private.",
      },
      {
        q: "Is there a minimum duration for small home functions?",
        a: "Coverage is priced per event rather than per hour, starting from ₹10,000. Tell me the function and its expected length and I will give a clear quote.",
      },
    ]),
    ta: {
      title: "குடும்ப & பாரம்பரிய விழாக்கள்",
      short: "பாரம்பரிய விழாக்கள், வாழ்க்கை மைல்கல் கொண்டாட்டங்கள் மற்றும் சிறப்பு ஒன்றுகூடல்களுக்கான கவரேஜ்.",
      intro: [
        "ஒரு குடும்பத்திடம் இருக்கும் மிக முக்கியமான படங்களில் சில, தொழில்முறைப் புகைப்படக்காரரே வராத விழாக்களிலிருந்து வருபவை: மூன்று தலைமுறைகள் ஒரே சோஃபாவில் அமர்ந்த ஒரு 60-ஆம் ஆண்டு விழா, வளைகாப்பு, பெயர் சூட்டு விழா, கிரகப்பிரவேசம். எல்லோரையும் ஒன்று சேர்க்கும் நாட்கள் இவை; இந்தப் படங்களின் மதிப்பு பல ஆண்டுகள் கழித்தும் நிற்கும்.",
        "பாரம்பரிய மற்றும் கலாச்சார விழாக்களை சடங்கின் மீதும் மனிதர்கள் மீதும் கவனம் வைத்துப் படம்பிடிக்கிறேன். ஹோமத்தில் பூசாரியின் கைகள், பெரியவர்களின் ஆசீர்வாதம், அன்னப்ராசனத்தில் குழந்தை முதன்முதலில் சோறு சுவைக்கும் தருணம், புதிய வீடு விளக்குகளால் ஒளிர்வதைக் குடும்பம் பார்க்கும் கணம் எல்லாம் இதில் அடங்கும். சடங்கின் எந்தப் பகுதிகள் தனிப்பட்டவை அல்லது படம் எடுக்கக் கூடாதவை என்பதை முன்பே கேட்டறிந்து அதைப் பின்பற்றுவேன்.",
        "வீட்டு விழாவுக்கு இரண்டு மணி நேரம், பெரிய கொண்டாட்டத்துக்கு முழு நாள் எனக் கவரேஜை அமைக்கலாம்; கட்டணம் நிகழ்வின் அடிப்படையில் தெரிவிக்கப்படும்.",
      ],
      whatYouGet: [
        "கலாச்சார மற்றும் சமயச் சடங்குகள் வரிசைப்படி பதிவு",
        "பல தலைமுறைக் குடும்பப் படங்கள்",
        "சடங்கின் விவரங்கள்: விளக்குகள், படையல்கள், கோலம், அலங்காரம்",
        "விருந்தினர்கள் மற்றும் கொண்டாட்டத்தின் கேண்டிட் பதிவு",
        "சமூக ஊடகத்துக்குத் தயாரான படங்களுடன் ஆன்லைன் கேலரி",
      ],
      idealFor: [
        "வாழ்க்கை மைல்கல் பிறந்தநாள்கள் மற்றும் திருமண நாள் விழாக்கள்",
        "தொலைவிலிருந்து குடும்பம் கூடும் வீட்டு விழாக்கள்",
        "கோயில், சமுதாயக் கூடம், வீட்டில் நடக்கும் விழாக்கள்",
        "திருவிழாக்கள் மற்றும் பள்ளி, கல்லூரி நிகழ்ச்சிகள்",
      ],
      ceremonies: [
        "சஷ்டியப்தபூர்த்தி (60-ஆம் ஆண்டு விழா)",
        "சதாபிஷேகம்",
        "வளைகாப்பு",
        "பெயர் சூட்டு விழா",
        "அன்னப்ராசனம்",
        "உபநயனம்",
        "மஞ்சள் நீராட்டு விழா",
        "கிரகப்பிரவேசம்",
        "பூஜைகள் மற்றும் திருவிழாக்கள்",
        "பள்ளி, கல்லூரி நிகழ்ச்சிகள்",
      ],
      faqs: commonFaqsTa([
        {
          q: "கோயிலுக்குள்ளோ தனிப்பட்ட சடங்குகளின்போதோ படம் எடுக்க முடியுமா?",
          a: "அனுமதி உள்ள இடங்களில் மட்டுமே. இடத்தின் விதிகளையும் குடும்பத்தின் விருப்பத்தையும் முன்பே கேட்டறிவேன்; தனிப்பட்டதாக இருக்க வேண்டிய எதையும் படம் எடுக்க மாட்டேன்.",
        },
        {
          q: "சிறிய வீட்டு விழாக்களுக்குக் குறைந்தபட்ச நேரம் உண்டா?",
          a: "கட்டணம் மணி நேரத்தின் அடிப்படையில் அல்ல, நிகழ்வின் அடிப்படையில், ₹10,000-இலிருந்து. விழா என்ன, எவ்வளவு நேரம் நடக்கும் எனச் சொல்லுங்கள்; தெளிவான கட்டண விவரம் தருகிறேன்.",
        },
      ]),
    },
    relatedStories: ["theyyam-kannur", "swati-sushin"],
  },
  {
    slug: "event-concert-photography",
    n: "S05",
    title: "Events, Concerts & Behind-the-Scenes",
    eventType: "Event / Concert / Show",
    short:
      "Documentary coverage for live events, concerts, shows and behind-the-scenes. The same observational eye, applied to stage, crowd and crew.",
    intro: [
      "Live events move quickly and rarely repeat. I photograph concerts and performances from the stage edge to the back of the crowd: instruments in motion, the artist's expression, the audience carried by the music, and the crew working just out of sight.",
      "The same approach covers product launches, corporate evenings, award nights and cultural programmes. You get the event as it felt, with the branding and key moments you need for press and social use, delivered digitally.",
      "Behind-the-scenes coverage, from rehearsals and set-up to green rooms, is often where the most honest frames come from, and it can be booked alongside the main event. Press and editorial assignments are also welcome.",
    ],
    whatYouGet: [
      "Concerts and live performance coverage",
      "Corporate evenings, launches and showcases",
      "Award nights and cultural programmes",
      "Behind-the-scenes documentation",
      "Press and editorial-ready selects",
      "Online gallery with social-ready exports",
    ],
    idealFor: [
      "Bands, artists and promoters",
      "Brands running launches and corporate evenings",
      "Organisers who need press and social images quickly",
      "Rehearsals, shows and backstage stories",
    ],
    ceremonies: [
      "Concerts",
      "Product launches",
      "Corporate evenings",
      "Award nights",
      "Behind-the-scenes",
      "Press and editorial",
      "Cultural programmes",
    ],
    faqs: commonFaqs([
      {
        q: "Can you shoot in low stage light?",
        a: "Yes. Concerts and evening events are a regular part of my work, and the stories on this site include concert and live-event coverage.",
      },
      {
        q: "Can I get a few images quickly for press or social?",
        a: "Quick selects for same-day or next-day use can be discussed when you book. Share the deadline and where the images will be used.",
      },
    ]),
    ta: {
      title: "நிகழ்ச்சிகள், இசை நிகழ்ச்சிகள் & திரைக்குப் பின்னால்",
      short: "நேரடி நிகழ்ச்சிகள், இசை நிகழ்ச்சிகள், மேடைக் காட்சிகள் மற்றும் திரைக்குப் பின்னாலான ஆவணப் பதிவு. அதே கவனிக்கும் பார்வை, மேடை, கூட்டம், குழு மீது.",
      intro: [
        "நேரடி நிகழ்ச்சிகள் வேகமாக நகர்பவை, மீண்டும் நிகழாதவை. இசை நிகழ்ச்சிகளையும் மேடைப் படைப்புகளையும் மேடை ஓரத்திலிருந்து கூட்டத்தின் பின்வரிசை வரை படம்பிடிக்கிறேன்: இயங்கும் இசைக்கருவிகள், கலைஞரின் முகபாவம், இசையில் மூழ்கும் பார்வையாளர்கள், கண்ணுக்குத் தெரியாமல் உழைக்கும் குழுவினர்.",
        "தயாரிப்பு அறிமுக விழாக்கள், கார்ப்பரேட் மாலைகள், விருது நிகழ்ச்சிகள், கலாச்சார நிகழ்ச்சிகளுக்கும் இதே அணுகுமுறைதான். நிகழ்வு எப்படி உணரப்பட்டதோ அப்படியே, பத்திரிகை மற்றும் சமூக ஊடகப் பயன்பாட்டுக்கு வேண்டிய பிராண்டிங்குடனும் முக்கிய தருணங்களுடனும், டிஜிட்டலாக வழங்கப்படும்.",
        "ஒத்திகைகள், ஏற்பாடுகள், கிரீன் ரூம் போன்ற திரைக்குப் பின்னாலான பதிவுகளில்தான் பெரும்பாலும் மிகவும் நேர்மையான படங்கள் கிடைக்கும்; அதையும் முக்கிய நிகழ்வுடன் சேர்த்து முன்பதிவு செய்யலாம். பத்திரிகை மற்றும் எடிட்டோரியல் பணிகளும் வரவேற்கப்படுகின்றன.",
      ],
      whatYouGet: [
        "இசை நிகழ்ச்சிகள் மற்றும் நேரடிப் படைப்புகளின் கவரேஜ்",
        "கார்ப்பரேட் மாலைகள், அறிமுக விழாக்கள், ஷோகேஸ்கள்",
        "விருது நிகழ்ச்சிகள் மற்றும் கலாச்சார நிகழ்ச்சிகள்",
        "திரைக்குப் பின்னாலான ஆவணப் பதிவு",
        "பத்திரிகை மற்றும் எடிட்டோரியலுக்குத் தயாரான தேர்வுகள்",
        "சமூக ஊடகத்துக்குத் தயாரான படங்களுடன் ஆன்லைன் கேலரி",
      ],
      idealFor: [
        "இசைக்குழுக்கள், கலைஞர்கள், ஏற்பாட்டாளர்கள்",
        "அறிமுக விழாக்களையும் கார்ப்பரேட் மாலைகளையும் நடத்தும் பிராண்டுகள்",
        "பத்திரிகை மற்றும் சமூக ஊடகப் படங்கள் விரைவாகத் தேவைப்படும் அமைப்பாளர்கள்",
        "ஒத்திகைகள், நிகழ்ச்சிகள், மேடைக்குப் பின்னாலான கதைகள்",
      ],
      ceremonies: [
        "இசை நிகழ்ச்சிகள்",
        "தயாரிப்பு அறிமுக விழாக்கள்",
        "கார்ப்பரேட் மாலைகள்",
        "விருது நிகழ்ச்சிகள்",
        "திரைக்குப் பின்னால்",
        "பத்திரிகை மற்றும் எடிட்டோரியல்",
        "கலாச்சார நிகழ்ச்சிகள்",
      ],
      faqs: commonFaqsTa([
        {
          q: "குறைவான மேடை வெளிச்சத்தில் படம்பிடிக்க முடியுமா?",
          a: "முடியும். இசை நிகழ்ச்சிகளும் மாலை நேர நிகழ்வுகளும் என் வேலையின் வழக்கமான பகுதி; இந்தத் தளத்தின் கதைகளிலேயே இசை நிகழ்ச்சி மற்றும் நேரடி நிகழ்ச்சிப் பதிவுகள் உள்ளன.",
        },
        {
          q: "பத்திரிகை அல்லது சமூக ஊடகத்துக்குச் சில படங்களை விரைவாகப் பெற முடியுமா?",
          a: "அதே நாளோ மறுநாளோ பயன்படுத்தத் தேவையான விரைவுத் தேர்வுகளை முன்பதிவின்போது பேசிக்கொள்ளலாம். காலக்கெடுவையும் படங்கள் எங்கு பயன்படுத்தப்படும் என்பதையும் தெரிவியுங்கள்.",
        },
      ]),
    },
    relatedStories: ["agam-bengaluru", "concerts-chennai"],
  },
  {
    slug: "candid-videography",
    n: "S06",
    title: "Candid Videography",
    eventType: "Videography (Notify)",
    short:
      "Same documentary approach, in motion. Short films and reels that capture how the day actually felt.",
    intro: [
      "Candid videography is coming soon: the same documentary approach, in motion. The aim is short films that feel like the day, not a staged production.",
      "It will be offered as an add-on to photography. If you would like to be told when it launches, leave your email on the services page.",
    ],
    whatYouGet: [
      "Highlight reels of three to five minutes",
      "Full ceremony films",
      "Social-ready vertical cuts",
      "Available as an add-on to photography",
    ],
    idealFor: [
      "Couples and families who want motion alongside photographs",
      "Events that need short social cuts",
    ],
    ceremonies: ["Wedding highlight reels", "Ceremony films", "Event reels"],
    faqs: [
      {
        q: "When will videography be available?",
        a: "It is coming soon and there is no date yet. Leave your email on the services page and I will let you know when it launches.",
      },
      {
        q: "Can I book photography now?",
        a: "Yes. All photography services are open for booking, from ₹10,000 per event, subject to date availability.",
      },
    ],
    ta: {
      title: "கேண்டிட் வீடியோகிராஃபி",
      short: "அதே ஆவணப் பாணி, இயக்கத்தில். அந்த நாள் உண்மையில் எப்படி உணரப்பட்டதோ அதைப் பிடிக்கும் குறும்படங்களும் ரீல்களும்.",
      intro: [
        "கேண்டிட் வீடியோகிராஃபி விரைவில் வருகிறது: அதே ஆவணப் பாணி, இயக்கத்தில். மேடையிட்ட தயாரிப்பாக அல்லாமல், அந்த நாளைப் போலவே உணரும் குறும்படங்களே இலக்கு.",
        "இது புகைப்படச் சேவையுடன் சேர்க்கும் கூடுதல் சேவையாக வழங்கப்படும். அறிமுகமாகும்போது தெரிவிக்க வேண்டுமென்றால், சேவைகள் பக்கத்தில் உங்கள் மின்னஞ்சலைக் கொடுங்கள்.",
      ],
      whatYouGet: [
        "மூன்று முதல் ஐந்து நிமிட ஹைலைட் ரீல்கள்",
        "முழுச் சடங்குப் படங்கள்",
        "சமூக ஊடகத்துக்குத் தயாரான செங்குத்து வெட்டுகள்",
        "புகைப்படச் சேவையுடன் கூடுதலாகக் கிடைக்கும்",
      ],
      idealFor: [
        "புகைப்படங்களுடன் இயக்கப் பதிவும் விரும்பும் தம்பதியரும் குடும்பங்களும்",
        "குறுகிய சமூக ஊடக வெட்டுகள் தேவைப்படும் நிகழ்வுகள்",
      ],
      ceremonies: ["திருமண ஹைலைட் ரீல்கள்", "சடங்குப் படங்கள்", "நிகழ்ச்சி ரீல்கள்"],
      faqs: [
        {
          q: "வீடியோகிராஃபி எப்போது கிடைக்கும்?",
          a: "விரைவில் வருகிறது; இன்னும் தேதி இல்லை. சேவைகள் பக்கத்தில் உங்கள் மின்னஞ்சலைக் கொடுங்கள்; அறிமுகமாகும்போது தெரிவிக்கிறேன்.",
        },
        {
          q: "இப்போது புகைப்படச் சேவையை முன்பதிவு செய்யலாமா?",
          a: "செய்யலாம். அனைத்துப் புகைப்படச் சேவைகளும் முன்பதிவுக்குத் திறந்துள்ளன, ஒரு நிகழ்வுக்கு ₹10,000-இலிருந்து, தேதி கிடைக்கும் தன்மையைப் பொறுத்து.",
        },
      ],
    },
    relatedStories: ["mevlin-nikhil", "agam-bengaluru"],
    comingSoon: true,
  },
];

export const findService = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const servicePrice = (s: ServiceLine) =>
  s.fromPrice ?? BASE_PRICE.amount;
