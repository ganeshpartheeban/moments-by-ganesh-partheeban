/**
 * City pages · content for /photographer-in/$city. English at top level, Tamil in each item's `ta` object.
 * Venue names are well-known public venues, listed for orientation only.
 * They do not imply past shoots unless a story links to them.
 */
import type { Faq } from "./services";

export type CityText = {
  name: string;
  state: string;
  intro: string[];
  wellKnownVenues: string[];
  faqs: Faq[];
};

export type City = {
  slug: string;
  name: string;
  state: string;
  intro: string[];
  wellKnownVenues: string[];
  /** Story slugs from case-studies.ts. */
  stories: string[];
  faqs: Faq[];
  /** Service slugs offered (all six). */
  services: string[];
  /** schema.org areaServed type. */
  areaType: "City" | "State" | "Country";
  /** Tamil versions of the text fields; merged over English by localize(). */
  ta?: Partial<CityText>;
};

const ALL_SERVICES = [
  "candid-wedding-photography",
  "reception-photography",
  "engagement-pre-wedding-photography",
  "family-cultural-event-photography",
  "event-concert-photography",
  "candid-videography",
];

const cityFaqs = (name: string, travel: string, extra: Faq[] = []): Faq[] => [
  {
    q: `Are you available for ${name} dates?`,
    a: `Bookings are confirmed by date availability. Send your date, venue and event type through the enquiry form and I will confirm quickly whether it is open.`,
  },
  {
    q: `What does it cost to book a photographer in ${name}?`,
    a: `Pricing is event-based, from ₹10,000 per event, and depends on the event type, length and number of functions. ${travel}`,
  },
  ...extra,
  {
    q: "Is delivery digital only?",
    a: "Yes. All deliverables are digital, through an online gallery. I do not provide printed albums or physical photo books.",
  },
  {
    q: "How do I book?",
    a: "Fill in the booking enquiry form on the contact page with your date, venue and a short note about the event.",
  },
];

const cityFaqsTa = (name: string, travel: string, extra: Faq[] = []): Faq[] => [
  {
    q: `${name} தேதிகளுக்கு நீங்கள் கிடைப்பீர்களா?`,
    a: "முன்பதிவுகள் தேதி கிடைக்கும் தன்மையைப் பொறுத்தே உறுதியாகின்றன. தேதி, இடம், நிகழ்வு வகையை விசாரணைப் படிவத்தில் அனுப்புங்கள்; அந்தத் தேதி காலியாக உள்ளதா என்பதை விரைவாகத் தெரிவிக்கிறேன்.",
  },
  {
    q: `${name}-இல் புகைப்படக்காரரை முன்பதிவு செய்ய எவ்வளவு ஆகும்?`,
    a: `கட்டணம் நிகழ்வின் அடிப்படையில், ஒரு நிகழ்வுக்கு ₹10,000-இலிருந்து; நிகழ்வின் வகை, நேர அளவு, விழாக்களின் எண்ணிக்கையைப் பொறுத்தது. ${travel}`,
  },
  ...extra,
  {
    q: "படங்கள் டிஜிட்டலாக மட்டும்தானா?",
    a: "ஆம். எல்லாமே ஆன்லைன் கேலரி வழியாக டிஜிட்டலாக வழங்கப்படும். அச்சிட்ட ஆல்பங்கள் அல்லது ஃபோட்டோ புத்தகங்கள் நான் தருவதில்லை.",
  },
  {
    q: "எப்படி முன்பதிவு செய்வது?",
    a: "தொடர்பு பக்கத்தில் உள்ள முன்பதிவு விசாரணைப் படிவத்தில் தேதி, இடம், நிகழ்வு பற்றிய சிறு குறிப்பைக் கொடுங்கள்.",
  },
];

const TRAVEL_TA = "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.";
const KERALA_STORIES = ["mevlin-nikhil", "swati-sushin", "theyyam-kannur"];

export const CITIES: City[] = [
  {
    slug: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    areaType: "City",
    intro: [
      "Chennai is home base, so there is no travel cost for events in the city and nearby areas, and last-minute dates are often easier to say yes to. I photograph weddings, receptions, family functions and live events around the city.",
      "Tamil weddings here run on rhythm: Nalangu in the morning, Kashi Yatra, Oonjal and the Muhurtham itself at the auspicious time, often in a mandapam where several functions share the same day. Family functions such as Sashtiabdapoorthi, Valaikappu, Annaprasanam and puberty functions are a big part of life in the city too, and I enjoy photographing them as much as the large weddings.",
      "Venues range from classic mandapams and community halls to five-star hotels and resorts along East Coast Road and Mahabalipuram. Concerts, launches and corporate evenings happen across the city all year round, and Chennai's stage and street is one of the ongoing stories on this site.",
    ],
    wellKnownVenues: [
      "ITC Grand Chola",
      "Taj Coromandel",
      "The Leela Palace Chennai",
      "Mahabalipuram resorts",
      "East Coast Road (ECR) resorts",
      "Classic Chennai mandapams and community halls",
    ],
    stories: ["concerts-chennai"],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Chennai",
      "As I live in Chennai, local events carry no travel charge. For venues further out along ECR or towards Mahabalipuram, any travel is shared with you upfront.",
      [
        {
          q: "Do you cover traditional Tamil ceremonies?",
          a: "Yes. Weddings with Nalangu, Kashi Yatra and Oonjal, and family functions such as Sashtiabdapoorthi, Valaikappu, Annaprasanam and Grihapravesam are a regular part of my work. I ask about the sequence beforehand so I am in place for each part.",
        },
      ],
    ),
    ta: {
      name: "சென்னை",
      state: "தமிழ்நாடு",
      intro: [
        "சென்னைதான் என் இருப்பிடம்; அதனால் நகரிலும் அருகிலுள்ள பகுதிகளிலும் நடக்கும் நிகழ்வுகளுக்குப் பயணச் செலவு இல்லை, கடைசி நேரத் தேதிகளுக்கும் பெரும்பாலும் ஒப்புக்கொள்ள முடியும். திருமணங்கள், ரிசப்ஷன்கள், குடும்ப விழாக்கள், நேரடி நிகழ்ச்சிகளை நகரம் முழுவதும் படம்பிடிக்கிறேன்.",
        "இங்குள்ள தமிழ்த் திருமணங்களுக்கு ஒரு தாளம் உண்டு: காலையில் நலங்கு, காசி யாத்திரை, ஊஞ்சல், பிறகு நல்ல நேரத்தில் முகூர்த்தம்; பல விழாக்கள் ஒரே நாளில் ஒரே மண்டபத்தில் நடப்பதும் வழக்கம். சஷ்டியப்தபூர்த்தி, வளைகாப்பு, அன்னப்ராசனம், மஞ்சள் நீராட்டு விழா போன்ற குடும்ப விழாக்களும் நகரின் வாழ்க்கையில் பெரும் பங்கு வகிக்கின்றன; பெரிய திருமணங்களைப் போலவே இவற்றையும் படம்பிடிப்பதை நான் விரும்புகிறேன்.",
        "பாரம்பரிய மண்டபங்கள், சமுதாயக் கூடங்கள் முதல் ஐந்து நட்சத்திர ஹோட்டல்கள், கிழக்குக் கடற்கரைச் சாலை (ECR) மற்றும் மகாபலிபுரம் ரிசார்ட்டுகள் வரை இடங்கள் பலவிதம். இசை நிகழ்ச்சிகள், அறிமுக விழாக்கள், கார்ப்பரேட் மாலைகள் ஆண்டு முழுவதும் நகரில் நடக்கின்றன; சென்னையின் மேடையும் தெருவும் இந்தத் தளத்தில் தொடர்ந்து வளரும் கதைகளில் ஒன்று.",
      ],
      wellKnownVenues: [
        "ITC Grand Chola",
        "Taj Coromandel",
        "The Leela Palace Chennai",
        "மகாபலிபுரம் ரிசார்ட்டுகள்",
        "கிழக்குக் கடற்கரைச் சாலை (ECR) ரிசார்ட்டுகள்",
        "சென்னையின் பாரம்பரிய மண்டபங்களும் சமுதாயக் கூடங்களும்",
      ],
      faqs: cityFaqsTa("சென்னை", "நான் சென்னைவாசி என்பதால் உள்ளூர் நிகழ்வுகளுக்குப் பயணக் கட்டணம் இல்லை. ECR அல்லது மகாபலிபுரம் பக்கம் தொலைவான இடங்களுக்குப் பயணம் தேவைப்பட்டால், அது முன்கூட்டியே தெரிவிக்கப்படும்.", [
        {
          q: "பாரம்பரியத் தமிழ்ச் சடங்குகளையும் படம்பிடிப்பீர்களா?",
          a: "ஆம். நலங்கு, காசி யாத்திரை, ஊஞ்சல் கொண்ட திருமணங்களும், சஷ்டியப்தபூர்த்தி, வளைகாப்பு, அன்னப்ராசனம், கிரகப்பிரவேசம் போன்ற குடும்ப விழாக்களும் என் வழக்கமான வேலையின் பகுதி. ஒவ்வொரு பகுதிக்கும் நான் சரியான இடத்தில் இருக்க, வரிசையை முன்பே கேட்டறிவேன்.",
        },
      ]),
    },
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    areaType: "City",
    intro: [
      "I travel from Chennai to Bengaluru for weddings, receptions and live events. The city has a story on this site already: a Bengaluru wedding and a concert, both photographed candidly, so you can see how I work there.",
      "Bengaluru weddings often blend traditions. Kannada, Tamil, Telugu, Kodava and North Indian families all celebrate in the same city, and receptions with mixed guest lists are common. I ask about the customs of each family beforehand so nothing important is missed.",
      "Venues include banquet halls, garden venues, hotels and the resorts and farmhouses on the edges of the city, with a lively concert and corporate circuit through the year. Travel and stay are quoted separately and shared upfront.",
    ],
    wellKnownVenues: [
      "The Leela Palace Bengaluru",
      "ITC Gardenia",
      "Taj West End",
      "Bangalore Palace grounds",
      "Chowdiah Memorial Hall",
    ],
    stories: ["bhavana-jayanth", "agam-bengaluru"],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Bengaluru",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
      [
        {
          q: "Have you photographed in Bengaluru before?",
          a: "Yes. This site includes a Bengaluru wedding (Bhavana weds Jayanth) and a Bengaluru concert (Agam), both documented candidly.",
        },
      ],
    ),
    ta: {
      name: "பெங்களூரு",
      state: "கர்நாடகா",
      intro: [
        "திருமணங்கள், ரிசப்ஷன்கள், நேரடி நிகழ்ச்சிகளுக்காக சென்னையிலிருந்து பெங்களூருவுக்குப் பயணிக்கிறேன். இந்த நகரத்துக்கு இந்தத் தளத்தில் ஏற்கனவே ஒரு கதை உண்டு: ஒரு பெங்களூரு திருமணமும் ஒரு இசை நிகழ்ச்சியும், இரண்டுமே கேண்டிடாகப் பதிவானவை; அங்கே நான் எப்படி வேலை செய்கிறேன் என்பதை நீங்கள் பார்க்கலாம்.",
        "பெங்களூரு திருமணங்களில் பெரும்பாலும் பல மரபுகள் கலந்திருக்கும். கன்னடம், தமிழ், தெலுங்கு, கொடவா, வட இந்தியக் குடும்பங்கள் அனைத்தும் ஒரே நகரில் கொண்டாடுகின்றன; கலவையான விருந்தினர் பட்டியலுடன் ரிசப்ஷன்களும் பொதுவானவை. எதுவும் விடுபடாமல் இருக்க, ஒவ்வொரு குடும்பத்தின் வழக்கங்களையும் முன்பே கேட்டறிகிறேன்.",
        "திருமண மண்டபங்கள், தோட்ட அரங்குகள், ஹோட்டல்கள், நகர எல்லையிலுள்ள ரிசார்ட்டுகள், பண்ணை வீடுகள் எனப் பலவித இடங்கள் உண்டு; ஆண்டு முழுவதும் இசை நிகழ்ச்சிகளும் கார்ப்பரேட் நிகழ்வுகளும் சுறுசுறுப்பாக நடக்கும். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்.",
      ],
      wellKnownVenues: [
        "The Leela Palace Bengaluru",
        "ITC Gardenia",
        "Taj West End",
        "பெங்களூரு அரண்மனை வளாகம்",
        "Chowdiah Memorial Hall",
      ],
      faqs: cityFaqsTa("பெங்களூரு", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "பெங்களூருவில் முன்பு படம்பிடித்திருக்கிறீர்களா?",
          a: "ஆம். இந்தத் தளத்தில் ஒரு பெங்களூரு திருமணமும் (Bhavana weds Jayanth) ஒரு பெங்களூரு இசை நிகழ்ச்சியும் (Agam) உள்ளன; இரண்டுமே கேண்டிடாகப் பதிவு செய்யப்பட்டவை.",
        },
      ]),
    },
  },
  {
    slug: "coimbatore",
    name: "Coimbatore",
    state: "Tamil Nadu",
    areaType: "City",
    intro: [
      "Coimbatore is a few hours from Chennai by road, rail or air, and I travel there for weddings, receptions and family functions. Travel and stay are quoted separately and shared upfront, and for single-day events I plan the journey around your function.",
      "Kongu region weddings have their own flavour: large extended families, long ceremonies and warm, boisterous celebrations. Temple weddings, hall weddings and resort-style celebrations on the outskirts are all common. I will ask about the family's customs and the planned sequence before the day.",
      "Besides weddings, I cover milestone family functions and cultural, college and corporate events in and around the city.",
    ],
    wellKnownVenues: [
      "The Residency Towers Coimbatore",
      "Le Meridien Coimbatore",
      "Codissia Trade Fair Complex",
      "Marudhamalai Temple",
    ],
    stories: [],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Coimbatore",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
    ),
    ta: {
      name: "கோயம்புத்தூர்",
      state: "தமிழ்நாடு",
      intro: [
        "கோயம்புத்தூர் சென்னையிலிருந்து சாலை, ரயில் அல்லது விமானம் வழியாகச் சில மணி நேரத் தொலைவில் உள்ளது; திருமணங்கள், ரிசப்ஷன்கள், குடும்ப விழாக்களுக்காக அங்கே பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்; ஒரே நாள் நிகழ்வுகளுக்கு உங்கள் விழாவைச் சுற்றிப் பயணத்தைத் திட்டமிடுகிறேன்.",
        "கொங்குப் பகுதித் திருமணங்களுக்குத் தனிச் சுவை உண்டு: பெரிய கூட்டுக் குடும்பங்கள், நீண்ட சடங்குகள், அன்பான, ஆரவாரமான கொண்டாட்டங்கள். கோயில் திருமணங்கள், மண்டபத் திருமணங்கள், புறநகரில் ரிசார்ட் பாணிக் கொண்டாட்டங்கள் எல்லாம் வழக்கம். குடும்பத்தின் வழக்கங்களையும் திட்டமிட்ட வரிசையையும் நாளுக்கு முன்பே கேட்டறிவேன்.",
        "திருமணங்கள் தவிர, நகரிலும் சுற்றுப்புறங்களிலும் நடக்கும் குடும்ப மைல்கல் விழாக்கள், கலாச்சார, கல்லூரி, கார்ப்பரேட் நிகழ்வுகளையும் படம்பிடிக்கிறேன்.",
      ],
      wellKnownVenues: [
        "The Residency Towers Coimbatore",
        "Le Meridien Coimbatore",
        "Codissia Trade Fair Complex",
        "மருதமலை கோயில்",
      ],
      faqs: cityFaqsTa("கோயம்புத்தூர்", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்."),
    },
  },
  {
    slug: "madurai",
    name: "Madurai",
    state: "Tamil Nadu",
    areaType: "City",
    intro: [
      "Madurai is among the oldest living cities in Tamil Nadu, and the temple at its centre shapes how people celebrate. I travel from Chennai for weddings, family functions and festival coverage here. Travel and stay are quoted separately and shared upfront.",
      "Weddings in and around Madurai often follow long-established customs, with family gathering from surrounding towns and villages. Family functions such as Sathabhishekam, Sashtiabdapoorthi and Upanayanam are important occasions, and I photograph them with attention to ritual and elders.",
      "Venues include traditional mandapams, hotels and wedding halls, and I will always check temple and venue photography rules beforehand.",
    ],
    wellKnownVenues: [
      "Meenakshi Amman Temple",
      "Thirumalai Nayakkar Mahal",
      "Gateway Hotel Pasumalai",
      "Traditional Madurai mandapams",
    ],
    stories: [],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Madurai",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
      [
        {
          q: "Can you photograph inside temples?",
          a: "Only where it is permitted. I check the temple's and venue's rules and your family's wishes beforehand.",
        },
      ],
    ),
    ta: {
      name: "மதுரை",
      state: "தமிழ்நாடு",
      intro: [
        "தமிழ்நாட்டின் பழமையான, இன்றும் உயிர்ப்புடன் உள்ள நகரங்களில் மதுரையும் ஒன்று; நடுவில் உள்ள கோயில் மக்கள் கொண்டாடும் விதத்தையே வடிவமைக்கிறது. திருமணங்கள், குடும்ப விழாக்கள், திருவிழாப் பதிவுகளுக்காகச் சென்னையிலிருந்து இங்கே பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்.",
        "மதுரையிலும் சுற்றுவட்டாரத்திலும் நடக்கும் திருமணங்கள் பெரும்பாலும் நீண்டகால வழக்கங்களைப் பின்பற்றுகின்றன; சுற்றியுள்ள ஊர்களிலிருந்தும் கிராமங்களிலிருந்தும் குடும்பங்கள் கூடுகின்றன. சதாபிஷேகம், சஷ்டியப்தபூர்த்தி, உபநயனம் போன்ற குடும்ப விழாக்கள் முக்கிய நிகழ்வுகள்; சடங்கிலும் பெரியவர்களிடமும் கவனம் வைத்து அவற்றைப் படம்பிடிக்கிறேன்.",
        "பாரம்பரிய மண்டபங்கள், ஹோட்டல்கள், திருமண மண்டபங்கள் இடங்களாக உள்ளன; கோயில் மற்றும் இடத்தின் புகைப்பட விதிகளை எப்போதும் முன்பே சரிபார்ப்பேன்.",
      ],
      wellKnownVenues: [
        "மீனாட்சி அம்மன் கோயில்",
        "திருமலை நாயக்கர் மஹால்",
        "Gateway Hotel Pasumalai",
        "மதுரையின் பாரம்பரிய மண்டபங்கள்",
      ],
      faqs: cityFaqsTa("மதுரை", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "கோயிலுக்குள் படம் எடுக்க முடியுமா?",
          a: "அனுமதி உள்ள இடங்களில் மட்டுமே. கோயிலின், இடத்தின் விதிகளையும் உங்கள் குடும்பத்தின் விருப்பத்தையும் முன்பே கேட்டறிவேன்.",
        },
      ]),
    },
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    areaType: "City",
    intro: [
      "I travel from Chennai to Hyderabad for weddings, receptions and events. Travel and stay are quoted separately and shared upfront, and an early enquiry helps with date and flight planning.",
      "Hyderabad celebrations are layered: Telugu weddings with their own rituals and long muhurtham schedules, Muslim nikahs and walima receptions, and large multi-day functions with mehendi and sangeet. I ask about each family's customs and the order of events before the day.",
      "The city also has a busy corporate and concert calendar, and I cover launches, showcases and live events there.",
    ],
    wellKnownVenues: [
      "Taj Falaknuma Palace",
      "Taj Krishna",
      "ITC Kakatiya",
      "HITEX Exhibition Centre",
      "Shilpakala Vedika",
    ],
    stories: [],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Hyderabad",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
    ),
    ta: {
      name: "ஹைதராபாத்",
      state: "தெலங்கானா",
      intro: [
        "திருமணங்கள், ரிசப்ஷன்கள், நிகழ்ச்சிகளுக்காகச் சென்னையிலிருந்து ஹைதராபாத்துக்குப் பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்; தேதி, விமானத் திட்டமிடலுக்கு முன்கூட்டிய விசாரணை உதவும்.",
        "ஹைதராபாத் கொண்டாட்டங்கள் பல அடுக்குகள் கொண்டவை: தனித்துவமான சடங்குகளும் நீண்ட முகூர்த்த அட்டவணைகளும் கொண்ட தெலுங்குத் திருமணங்கள், முஸ்லிம் நிக்காஹ்களும் வலீமா ரிசப்ஷன்களும், மெஹந்தி, சங்கீத்துடன் கூடிய பல நாள் விழாக்கள். ஒவ்வொரு குடும்பத்தின் வழக்கங்களையும் நிகழ்வுகளின் வரிசையையும் நாளுக்கு முன்பே கேட்டறிவேன்.",
        "நகரில் கார்ப்பரேட் மற்றும் இசை நிகழ்ச்சி நாட்காட்டியும் பரபரப்பாக உள்ளது; அங்கே அறிமுக விழாக்கள், ஷோகேஸ்கள், நேரடி நிகழ்ச்சிகளையும் படம்பிடிக்கிறேன்.",
      ],
      wellKnownVenues: [
        "Taj Falaknuma Palace",
        "Taj Krishna",
        "ITC Kakatiya",
        "HITEX Exhibition Centre",
        "Shilpakala Vedika",
      ],
      faqs: cityFaqsTa("ஹைதராபாத்", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்."),
    },
  },
  {
    slug: "kerala",
    name: "Kerala",
    state: "Kerala",
    areaType: "State",
    intro: [
      "Kerala is already part of this site: two weddings and a Theyyam night in Kannur, all photographed candidly. I travel from Chennai across the state for weddings, church ceremonies, temple festivals and family functions. Travel and stay are quoted separately and shared upfront.",
      "Weddings here follow three distinct rhythms. Kerala Hindu weddings are often short, early-morning muhurtham ceremonies in a temple or hall, followed by a sadya. Christian weddings centre on the church service and a lively reception. Muslim nikah ceremonies are intimate family occasions. In the north, Theyyam season brings fire, drums and all-night rituals, and temple festivals across the state call for a quiet, respectful approach. I ask about each family's customs and the venue's photography rules beforehand.",
      "Settings range from Kochi's heritage lanes and backwater resorts to hill stations such as Munnar and Wayanad and the beaches around Kovalam. From Chennai, Kochi and Trivandrum are a short flight away, and an overnight train is a workable option for longer stays. An early enquiry helps with planning, especially in the wedding season.",
    ],
    wellKnownVenues: [
      "Bolgatty Palace, Kochi",
      "Kumarakom Lake Resort",
      "Taj Malabar Resort & Spa, Kochi",
      "Fort Kochi heritage venues",
      "Kovalam beach resorts",
    ],
    stories: KERALA_STORIES,
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Kerala",
      "I travel from Chennai by flight or overnight train, so travel and stay are quoted separately and shared with you upfront.",
      [
        {
          q: "Can you photograph Theyyam and temple festivals?",
          a: "Yes. This site includes a Theyyam night in Kannur. Temple and festival coverage depends on the temple committee's permission and the family's wishes, so I check both beforehand and do not photograph anything that should stay private.",
        },
      ],
    ),
    ta: {
      name: "கேரளா",
      state: "கேரளா",
      intro: [
        "கேரளா ஏற்கனவே இந்தத் தளத்தின் ஒரு பகுதி: இரண்டு திருமணங்களும் கண்ணூரில் ஒரு தெய்யம் இரவும், எல்லாம் கேண்டிடாகப் பதிவு செய்யப்பட்டவை. திருமணங்கள், தேவாலய வழிபாடுகள், கோயில் திருவிழாக்கள், குடும்ப விழாக்களுக்காகச் சென்னையிலிருந்து மாநிலம் முழுவதும் பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.",
        "இங்குள்ள திருமணங்களுக்கு மூன்று தனித்தனி தாளங்கள் உண்டு. கேரள இந்துத் திருமணங்கள் பெரும்பாலும் கோயிலிலோ மண்டபத்திலோ அதிகாலையில் நடக்கும் சுருக்கமான முகூர்த்த விழாக்கள்; அதன்பின் சத்யா விருந்து. கிறிஸ்தவத் திருமணங்கள் தேவாலய வழிபாட்டையும் உற்சாகமான ரிசப்ஷனையும் மையமாகக் கொண்டவை. முஸ்லிம் நிக்காஹ் என்பது நெருங்கிய குடும்ப நிகழ்வு. வடக்கில் தெய்யம் காலம் நெருப்பையும் மேளத்தையும் இரவு முழுவதும் நீளும் சடங்குகளையும் கொண்டுவருகிறது; மாநிலம் முழுவதும் நடக்கும் கோயில் திருவிழாக்களுக்கு அமைதியான, மரியாதையான அணுகுமுறை தேவை. ஒவ்வொரு குடும்பத்தின் வழக்கங்களையும் இடத்தின் புகைப்பட விதிகளையும் முன்பே கேட்டறிந்துகொள்கிறேன்.",
        "கொச்சியின் பாரம்பரியத் தெருக்கள், காயல் நீர்ப்பரப்பு ரிசார்ட்டுகள் தொடங்கி, மூணாறு, வயநாடு போன்ற மலைவாசஸ்தலங்கள், கோவளம் கடற்கரை வரை பலவிதமான இடங்கள் உண்டு. சென்னையிலிருந்து கொச்சியும் திருவனந்தபுரமும் ஒரு குறுகிய விமானப் பயணத் தொலைவில் உள்ளன; நீண்ட தங்கலுக்கு இரவு ரயிலும் ஏற்ற வழி. குறிப்பாகத் திருமணக் காலத்தில், முன்கூட்டியே விசாரித்தால் திட்டமிட உதவும்.",
      ],
      wellKnownVenues: [
        "Bolgatty Palace, கொச்சி",
        "Kumarakom Lake Resort",
        "Taj Malabar Resort & Spa, கொச்சி",
        "கோட்டை கொச்சியின் பாரம்பரிய அரங்குகள்",
        "கோவளம் கடற்கரை ரிசார்ட்டுகள்",
      ],
      faqs: cityFaqsTa("கேரளா", "நான் சென்னையிலிருந்து விமானம் அல்லது இரவு ரயிலில் பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "தெய்யம் மற்றும் கோயில் திருவிழாக்களைப் படம்பிடிப்பீர்களா?",
          a: "ஆம். கண்ணூரில் ஒரு தெய்யம் இரவு இந்தத் தளத்திலேயே உள்ளது. கோயில் மற்றும் திருவிழாப் பதிவு, கோயில் குழுவின் அனுமதியையும் குடும்பத்தின் விருப்பத்தையும் பொறுத்தது; இரண்டையும் முன்பே கேட்டறிவேன், தனிப்பட்டதாக இருக்க வேண்டிய எதையும் படம் எடுக்க மாட்டேன்.",
        },
      ]),
    },
  },
  {
    slug: "kochi",
    name: "Kochi",
    state: "Kerala",
    areaType: "City",
    intro: [
      "Kerala is already part of this site: two Kerala weddings and a Theyyam night in Kannur, all photographed candidly. I travel from Chennai to Kochi and across the state for weddings, church ceremonies and family functions. Travel and stay are quoted separately and shared upfront.",
      "Kochi has a mix of Kerala Hindu, Christian and Muslim weddings, each with its own rhythm. Christian weddings centre on the church service and a lively reception, Hindu weddings are often short, early-morning muhurtham ceremonies, and nikah ceremonies are intimate family occasions. I ask about each one beforehand.",
      "The backwaters, old Fort Kochi streets and resorts around the city make for beautiful settings, and monsoon-soft light is a familiar condition for me.",
    ],
    wellKnownVenues: [
      "Grand Hyatt Kochi Bolgatty",
      "Taj Malabar Resort & Spa, Willingdon Island",
      "Le Meridien Kochi",
      "Fort Kochi",
      "Vypin Island and backwater resorts",
    ],
    stories: ["mevlin-nikhil", "swati-sushin", "theyyam-kannur"],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Kochi",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
      [
        {
          q: "Do you photograph Kerala Christian and Hindu weddings?",
          a: "Yes. This site includes Kerala weddings, and I am comfortable with church ceremonies, Hindu muhurtham ceremonies and nikah ceremonies. I ask about the sequence beforehand.",
        },
      ],
    ),
    ta: {
      name: "கொச்சி",
      state: "கேரளா",
      intro: [
        "கேரளா ஏற்கனவே இந்தத் தளத்தின் ஒரு பகுதி: இரண்டு கேரளத் திருமணங்களும் கண்ணூரில் ஒரு தெய்யம் இரவும், எல்லாம் கேண்டிடாகப் பதிவானவை. திருமணங்கள், தேவாலய வழிபாடுகள், குடும்ப விழாக்களுக்காகச் சென்னையிலிருந்து கொச்சிக்கும் மாநிலம் முழுவதும் பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்.",
        "கொச்சியில் கேரள இந்து, கிறிஸ்தவ, முஸ்லிம் திருமணங்கள் கலந்துள்ளன; ஒவ்வொன்றுக்கும் தனித் தாளம் உண்டு. கிறிஸ்தவத் திருமணங்கள் தேவாலய வழிபாட்டையும் உற்சாகமான ரிசப்ஷனையும் மையமாகக் கொண்டவை; இந்துத் திருமணங்கள் பெரும்பாலும் சுருக்கமான, அதிகாலை முகூர்த்த விழாக்கள்; நிக்காஹ் என்பது நெருங்கிய குடும்ப நிகழ்வு. ஒவ்வொன்றையும் முன்பே கேட்டறிவேன்.",
        "காயல் நீர்ப்பரப்பு, கோட்டை கொச்சியின் பழைய தெருக்கள், நகரைச் சுற்றியுள்ள ரிசார்ட்டுகள் அழகான பின்னணிகளைத் தருகின்றன; பருவமழையின் மென்மையான வெளிச்சம் எனக்குப் பழக்கமான சூழல்.",
      ],
      wellKnownVenues: [
        "Grand Hyatt Kochi Bolgatty",
        "Taj Malabar Resort & Spa, Willingdon Island",
        "Le Meridien Kochi",
        "கோட்டை கொச்சி",
        "வைபின் தீவும் காயல் ரிசார்ட்டுகளும்",
      ],
      faqs: cityFaqsTa("கொச்சி", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "கேரள கிறிஸ்தவ, இந்துத் திருமணங்களைப் படம்பிடிப்பீர்களா?",
          a: "ஆம். இந்தத் தளத்தில் கேரளத் திருமணங்கள் உள்ளன; தேவாலய வழிபாடுகள், இந்து முகூர்த்த விழாக்கள், நிக்காஹ் விழாக்கள் ஆகியவற்றில் எனக்குப் பழக்கம் உண்டு. வரிசையை முன்பே கேட்டறிவேன்.",
        },
      ]),
    },
  },
  {
    slug: "trivandrum",
    name: "Trivandrum",
    state: "Kerala",
    areaType: "City",
    intro: [
      "I travel from Chennai to Trivandrum (Thiruvananthapuram) for weddings, receptions and family functions, and across Kerala more widely. Travel and stay are quoted separately and shared upfront.",
      "Weddings here follow the quieter, tradition-focused Kerala style: Hindu muhurtham ceremonies in temples and halls, Christian weddings with a church service and reception, and nikah ceremonies at family venues. Kerala work on this site, including two weddings and a Theyyam night in the north, shows how I handle these ceremonies.",
      "Beaches around Kovalam and Varkala, hotels and temple-adjacent halls are common settings. For temple weddings I check photography rules beforehand.",
    ],
    wellKnownVenues: [
      "Padmanabhaswamy Temple",
      "Kovalam beach resorts",
      "Varkala Cliff",
      "Kanakakkunnu Palace",
      "Mascot Hotel",
    ],
    stories: ["mevlin-nikhil", "swati-sushin", "theyyam-kannur"],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Trivandrum",
      "I travel from Chennai, so travel and stay are quoted separately and shared with you upfront.",
      [
        {
          q: "Can you photograph at temples?",
          a: "Only where it is permitted. I check each temple's rules and your family's wishes beforehand.",
        },
      ],
    ),
    ta: {
      name: "திருவனந்தபுரம்",
      state: "கேரளா",
      intro: [
        "திருமணங்கள், ரிசப்ஷன்கள், குடும்ப விழாக்களுக்காகச் சென்னையிலிருந்து திருவனந்தபுரத்துக்கும் (Thiruvananthapuram), கேரளா முழுவதும் பயணிக்கிறேன். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்.",
        "இங்குள்ள திருமணங்கள் அமைதியான, மரபை மையமாகக் கொண்ட கேரள பாணியைப் பின்பற்றுகின்றன: கோயில்களிலும் மண்டபங்களிலும் இந்து முகூர்த்த விழாக்கள், தேவாலய வழிபாடும் ரிசப்ஷனும் கொண்ட கிறிஸ்தவத் திருமணங்கள், குடும்ப அரங்குகளில் நிக்காஹ் விழாக்கள். இந்தத் தளத்திலுள்ள கேரளப் பதிவுகள், அதாவது இரண்டு திருமணங்களும் வடக்கில் ஒரு தெய்யம் இரவும், இந்தச் சடங்குகளை நான் எப்படிக் கையாள்கிறேன் என்பதைக் காட்டுகின்றன.",
        "கோவளம், வர்க்கலா கடற்கரைகள், ஹோட்டல்கள், கோயிலை ஒட்டிய மண்டபங்கள் வழக்கமான இடங்கள். கோயில் திருமணங்களுக்குப் புகைப்பட விதிகளை முன்பே சரிபார்ப்பேன்.",
      ],
      wellKnownVenues: [
        "பத்மநாபசுவாமி கோயில்",
        "கோவளம் கடற்கரை ரிசார்ட்டுகள்",
        "வர்க்கலா கிளிஃப்",
        "Kanakakkunnu Palace",
        "Mascot Hotel",
      ],
      faqs: cityFaqsTa("திருவனந்தபுரம்", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "கோயில்களில் படம் எடுக்க முடியுமா?",
          a: "அனுமதி உள்ள இடங்களில் மட்டுமே. ஒவ்வொரு கோயிலின் விதிகளையும் உங்கள் குடும்பத்தின் விருப்பத்தையும் முன்பே கேட்டறிவேன்.",
        },
      ]),
    },
  },
  {
    slug: "pondicherry",
    name: "Pondicherry",
    state: "Puducherry",
    areaType: "City",
    intro: [
      "Pondicherry is one of the easiest trips from Chennai, around three to four hours by road along the coast, and a popular choice for destination weddings, engagement sessions and pre-wedding portraits. Travel is quoted separately and shared upfront.",
      "The French Quarter's yellow walls, quiet streets and seafront give the town a character unlike any other in Tamil Nadu, and many couples choose it for its light and calm. Tamil, Christian and mixed-tradition weddings all happen here, often in boutique hotels, heritage houses and beach resorts.",
      "I also cover family functions and small gatherings in and around the town.",
    ],
    wellKnownVenues: [
      "Promenade Beach",
      "Auroville",
      "Le Pondy",
      "Sri Aurobindo Ashram",
      "White Town (French Quarter)",
    ],
    stories: [],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "Pondicherry",
      "I travel from Chennai, so travel is quoted separately and shared with you upfront.",
      [
        {
          q: "Do you do pre-wedding sessions in Pondicherry?",
          a: "Yes. Unhurried, light-led portrait sessions are a good fit for the town. Share the mood you want and I will suggest timing and locations.",
        },
      ],
    ),
    ta: {
      name: "புதுச்சேரி",
      state: "புதுச்சேரி",
      intro: [
        "புதுச்சேரி சென்னையிலிருந்து எளிதில் சென்றுவரக்கூடிய இடங்களில் ஒன்று; கடற்கரைச் சாலை வழியாக மூன்று முதல் நான்கு மணி நேரம். டெஸ்டினேஷன் திருமணங்கள், நிச்சயதார்த்தப் படப்பிடிப்புகள், ப்ரீ-வெட்டிங் போர்ட்ரெய்ட்களுக்குப் பிரபலமான தேர்வு. பயணச் செலவு தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்.",
        "பிரெஞ்சுப் பகுதியின் மஞ்சள் சுவர்கள், அமைதியான தெருக்கள், கடற்கரை ஆகியவை இந்த ஊருக்குத் தமிழ்நாட்டில் வேறெங்கும் இல்லாத ஒரு தனித்தன்மையைத் தருகின்றன; அதன் வெளிச்சத்துக்காகவும் அமைதிக்காகவும் பல தம்பதியர் இதைத் தேர்ந்தெடுக்கிறார்கள். தமிழ், கிறிஸ்தவ, கலப்பு மரபுத் திருமணங்கள் எல்லாம் இங்கே நடக்கின்றன; பெரும்பாலும் சிறு ஹோட்டல்கள், பாரம்பரிய இல்லங்கள், கடற்கரை ரிசார்ட்டுகளில்.",
        "ஊரிலும் சுற்றுப்புறங்களிலும் நடக்கும் குடும்ப விழாக்களையும் சிறு ஒன்றுகூடல்களையும் நான் படம்பிடிக்கிறேன்.",
      ],
      wellKnownVenues: [
        "கடற்கரைச் சாலை (Promenade Beach)",
        "ஆரோவில்",
        "Le Pondy",
        "ஸ்ரீ அரவிந்தர் ஆசிரமம்",
        "வெள்ளை நகரம் (பிரெஞ்சுப் பகுதி)",
      ],
      faqs: cityFaqsTa("புதுச்சேரி", "நான் சென்னையிலிருந்து பயணிக்கிறேன்; பயணச் செலவு தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "புதுச்சேரியில் ப்ரீ-வெட்டிங் படப்பிடிப்புகள் செய்வீர்களா?",
          a: "ஆம். அவசரமில்லாத, வெளிச்சத்தை மையமாகக் கொண்ட போர்ட்ரெய்ட் படப்பிடிப்புகள் இந்த ஊருக்குப் பொருந்தும். நீங்கள் விரும்பும் உணர்வைச் சொல்லுங்கள்; நேரம், இடங்களை நான் பரிந்துரைக்கிறேன்.",
        },
      ]),
    },
  },
  {
    slug: "across-india",
    name: "Across India",
    state: "India",
    areaType: "Country",
    intro: [
      "I am based in Chennai and available across India. Past work on this site includes Kerala, Bengaluru and Chennai, and I am happy to travel for weddings, family functions and events in any other city or town.",
      "For destination weddings, an early enquiry helps with planning. Travel and stay are quoted separately and shared with you upfront, and I will ask about local customs, the sequence of events and venue photography rules beforehand.",
      "If your city is not listed on its own page, it does not mean I am unavailable. Send the date, place and event type and I will confirm.",
    ],
    wellKnownVenues: [],
    stories: ["mevlin-nikhil", "swati-sushin", "bhavana-jayanth", "theyyam-kannur", "agam-bengaluru", "concerts-chennai"],
    services: ALL_SERVICES,
    faqs: cityFaqs(
      "your city",
      "Travel and stay outside Chennai are quoted separately and shared with you upfront.",
      [
        {
          q: "Do you take destination weddings?",
          a: "Yes. Send the date, place and event type and I will confirm availability and share a clear quote including travel.",
        },
      ],
    ),
    ta: {
      name: "இந்தியா முழுவதும்",
      state: "இந்தியா",
      intro: [
        "நான் சென்னையைச் சேர்ந்தவன்; இந்தியா முழுவதும் கிடைக்கிறேன். இந்தத் தளத்திலுள்ள முந்தைய வேலைகளில் கேரளா, பெங்களூரு, சென்னை அடங்கும்; வேறெந்த நகரத்திலோ ஊரிலோ நடக்கும் திருமணங்கள், குடும்ப விழாக்கள், நிகழ்வுகளுக்கும் மகிழ்ச்சியுடன் பயணிக்கிறேன்.",
        "டெஸ்டினேஷன் திருமணங்களுக்கு முன்கூட்டிய விசாரணை திட்டமிட உதவும். பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே தெரிவிக்கப்படும்; உள்ளூர் வழக்கங்கள், நிகழ்வுகளின் வரிசை, இடத்தின் புகைப்பட விதிகளையும் முன்பே கேட்டறிவேன்.",
        "உங்கள் ஊருக்குத் தனிப் பக்கம் இல்லையென்றால், நான் கிடைக்க மாட்டேன் என்று அர்த்தமல்ல. தேதி, இடம், நிகழ்வு வகையை அனுப்புங்கள்; உறுதி செய்கிறேன்.",
      ],
      wellKnownVenues: [],
      faqs: cityFaqsTa("உங்கள் ஊர்", "சென்னைக்கு வெளியேயான பயணம், தங்குமிடச் செலவுகள் தனியாகக் கணக்கிடப்பட்டு, முன்கூட்டியே உங்களுக்குத் தெரிவிக்கப்படும்.", [
        {
          q: "டெஸ்டினேஷன் திருமணங்களை ஏற்பீர்களா?",
          a: "ஆம். தேதி, இடம், நிகழ்வு வகையை அனுப்புங்கள்; தேதி கிடைக்கும் தன்மையை உறுதிசெய்து, பயணம் உட்பட தெளிவான கட்டண விவரம் தருகிறேன்.",
        },
      ]),
    },
  },
];

export const findCity = (slug: string) => CITIES.find((c) => c.slug === slug);
