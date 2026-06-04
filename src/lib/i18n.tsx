import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "en" | "ta";

type Dict = Record<string, string>;

export const TRANSLATIONS: Record<Locale, Dict> = {
  en: {
    // Nav + brand
    "nav.work": "Work",
    "nav.about": "About",
    "nav.services": "Services",
    "tabs.work": "Work",
    "tabs.about": "About",
    "tabs.services": "Services",
    "tabs.features": "Features",
    "tabs.enquire": "Enquire",
    "nav.press": "Press",
    "nav.enquire": "Enquire",
    "header.brand.prefix": "Moments",
    "header.brand.suffix": "by Ganesh Partheeban",

    // Home · hero
    "home.hero.label": "Vol. I · Candid Documentary",
    "home.hero.line1": "Moments,",
    "home.hero.line2": "honestly",
    "home.hero.line3": "documented.",
    "home.hero.body":
      "Candid photography across weddings, concerts, and live events. No posing, no heavy edits · just the day as it happened.",
    "home.hero.cta.book": "Book your event",
    "home.hero.cta.instagram": "Enquire on Instagram",
    "home.hero.booking.window": "Bookings open",

    // Home · selected work
    "home.work.label": "Selected frames",
    "home.work.title":
      "Quiet glances, loud laughter, and everything in between.",
    "home.work.viewServices": "View services →",
    "home.stories.label": "Stories",
    "home.stories.title.before": "Weddings, rituals,",
    "home.stories.title.accent": "performances",
    "home.stories.body":
      "Each card is one event, documented across the day. Tap to step inside.",
    "home.singles.label": "Other frames",
    "home.singles.title":
      "Standalone frames from elsewhere.",

    // Home · philosophy
    "home.philosophy.label": "Philosophy",
    "home.philosophy.title.before": "What makes the work",
    "home.philosophy.title.accent": "different",
    "philosophy.01.title": "Real over perfect",
    "philosophy.01.body": "Authentic emotion always outranks staged perfection.",
    "philosophy.02.title": "Fast delivery",
    "philosophy.02.body":
      "Photos land quickly, so you can share memories while they still feel fresh.",
    "philosophy.03.title": "Social-media ready",
    "philosophy.03.body":
      "Pre-cropped, colour-corrected exports for Instagram and WhatsApp ship with every gallery.",
    "philosophy.04.title": "Minimal editing",
    "philosophy.04.body":
      "Natural skin tones, true-to-life light. No heavy retouching.",
    "philosophy.05.title": "Solo coverage",
    "philosophy.05.body": "I personally photograph your event. One voice, one style.",
    "philosophy.06.title": "Event-based pricing",
    "philosophy.06.body":
      "Priced by the event, never by the hour. No clock-watching.",

    // Home · press strip
    "home.press.label": "Featured in",
    "home.press.title.before": "Photographs that",
    "home.press.title.accent": "travelled",
    "home.press.body":
      "Selected editorial features that have used my photographs · from national press to international reports.",
    "home.press.seeAll": "See all {{count}} features",

    // Home · final CTA
    "home.cta.label": "Let's talk",
    "home.cta.title.line1": "Less posing.",
    "home.cta.title.line2.before": "More",
    "home.cta.title.line2.accent": "living",
    "home.cta.body":
      "Send a note. Bookings confirmed by date availability.",
    "home.cta.button": "Enquire now",

    // About
    "about.label": "About",
    "about.headline.l1": "I believe the",
    "about.headline.l2": "best photographs",
    "about.headline.l3.before": "happen",
    "about.headline.l3.accent": "naturally",
    "about.body.p1":
      "I'm Ganesh Partheeban, a candid photographer based in India. I cover weddings, family functions, concerts, launches, and behind-the-scenes work · documenting laughter between friends, quiet glances, and the atmosphere that makes each event its own.",
    "about.body.p2":
      "I work solo, blending into the crowd instead of interrupting it. Before every shoot I learn the family, the close friends, and the key rituals, so the camera anticipates rather than reacts.",
    "about.portrait.caption": "Ganesh Partheeban · Tamil Nadu, India",
    "about.howIWork.label": "How I work",
    "about.howIWork.01.t": "Observe honestly",
    "about.howIWork.01.b":
      "Stay quiet. Watch first. Wait for the moment instead of building it.",
    "about.howIWork.02.t": "Interact comfortably",
    "about.howIWork.02.b":
      "Earn ease so people forget the camera is there. The frame relaxes with them.",
    "about.howIWork.03.t": "Capture as it unfolds",
    "about.howIWork.03.b":
      "Document the event the way it actually happens. Minimal interference, no styling.",
    "about.testimonials.label": "Words from clients",
    "about.testimonials.shareYours": "Share yours",
    "about.testimonialForm.name": "Your name",
    "about.testimonialForm.venue": "Event / place (optional)",
    "about.testimonialForm.message": "A few words",
    "about.testimonialForm.placeholder":
      "What was it like? What did you keep coming back to?",
    "about.testimonialForm.submit": "Share testimonial",
    "about.testimonialForm.sending": "Sending…",
    "about.testimonialForm.thanks": "Thank you. Your words mean a lot.",
    "about.specialization.label": "Specialization",
    "about.specialization.01": "Natural expressions",
    "about.specialization.02": "Real emotions",
    "about.specialization.03": "Minimal interference",
    "about.specialization.04": "Timeless visual storytelling",
    "about.cta": "Start a conversation",

    // Services
    "services.label": "Services",
    "services.headline.l1": "One photographer.",
    "services.headline.l2.before": "meaningful moment.",
    "services.headline.l2.accent": "Every",
    "services.comingSoon": "Coming soon",
    "services.enquire": "Enquire",
    "services.notifyMe": "Notify me",
    "services.pricing.from": "From",
    "services.pricing.unit": "per event",
    "services.pricing.note":
      "Event-based pricing, never hourly. Travel and stay quoted separately. Bookings confirmed by date availability.",
    "services.delivery.label": "Delivery",
    "services.delivery.title": "Fast and shareable.",
    "services.delivery.body":
      "Galleries land quickly so you can share them while the day still feels fresh.",
    "services.delivery.note.label": "Please note",
    "services.delivery.note.body":
      "All deliverables are digital. I do not provide printed albums, hard copies, or physical photo books.",
    "services.working.label": "Working style",
    "services.working.title": "I work quietly inside the event.",
    "services.working.01": "Observing interactions",
    "services.working.02": "Anticipating emotions",
    "services.working.03": "Capturing genuine reactions",
    "services.working.04": "Documenting meaningful moments naturally",
    "services.coverage.label": "Coverage area",
    "services.coverage.title": "Available across India.",
    "services.coverage.body":
      "Bookings accepted across India. Travel and stay billed separately from the coverage.",
    "services.coverage.cta": "Check date availability",

    // Contact
    "contact.label": "Contact",
    "contact.headline.l1": "Get in touch.",
    "contact.headline.l2.accent": "Send a note.",
    "contact.body":
      "Candid coverage across India. Replies within a day or two · bookings confirmed by date availability.",
    "contact.card.fastestReply": "Fastest reply",
    "contact.card.fullBriefs": "For full briefs",
    "contact.testimonials.label": "Words from clients",
    "contact.faq.label": "FAQ",
    "contact.faq.title": "Frequently asked.",
    "contact.bookingEnquiry.label": "[ Booking enquiry ]",
    "contact.bookingEnquiry.headline.before": "Book a",
    "contact.bookingEnquiry.headline.accent": "date.",
    "contact.bookingEnquiry.body":
      "Fill in the form, or message me directly if that's quicker.",
    "contact.bookingEnquiry.basedIn": "Based in",
    "contact.bookingEnquiry.basedIn.value": "Chennai · Available across India",
    "contact.bookingEnquiry.footnote.l1": "Bookings confirmed by date availability.",
    "contact.bookingEnquiry.footnote.l2": "Travel & stay charges quoted separately.",
    "contact.form.name": "Your name",
    "contact.form.email": "Email",
    "contact.form.date": "Event date",
    "contact.form.city": "City",
    "contact.form.eventType": "Event type",
    "contact.form.budget": "Budget (₹ INR)",
    "contact.form.notes": "Tell me about it",
    "contact.form.notes.placeholder":
      "Who's getting married, what's the vibe, which functions, anything special I should know…",
    "contact.form.submit": "Send enquiry",
    "contact.form.sending": "Sending…",
    "contact.form.sent": "Thanks, I'll be in touch ✓",
    "contact.form.limit": "Limit reached",
    "contact.form.retry": "Try again ↻",
    "contact.form.sentNote":
      "Enquiry received. I'll reply to the email you provided within a day or two.",
    "contact.form.limitNote":
      "You've already sent five enquiries from this device. Please email ganeshpartheeban@gmail.com directly for any follow-up.",
    "contact.form.errorNote": "Couldn't send. Please email ganeshpartheeban@gmail.com directly.",

    // Press
    "press.label": "Press",
    "press.headline.before": "Photographs that",
    "press.headline.accent": "travelled",
    "press.headline.after": "the world.",
    "press.body":
      "A running list of editorial features that have used my photographs. From national newsrooms to international research reports · these are the places my frames have ended up.",
    "press.featuresLabel": "features",
    "press.andCounting": "and counting.",
    "press.readArticle": "Read article",
    "press.outro.label": "Have your photograph featured",
    "press.outro.title.before": "Editorial commissions",
    "press.outro.title.accent": "welcome",
    "press.outro.body":
      "If you're an editor or art director looking for India-based candid, documentary or event photography, get in touch.",

    // 404
    "404.label": "404 · Frame missing",
    "404.headline.l1": "This frame",
    "404.headline.l2.before": "got",
    "404.headline.l2.accent": "away",
    "404.body":
      "The page you're looking for has either moved or never existed. Even good photographers miss a frame sometimes.",
    "404.cta.primary": "Back to the work",
    "404.cta.secondary": "Or get in touch",

    // Modal
    "modal.label": "A note",
    "modal.headline.before": "Looking for a candid",
    "modal.headline.accent": "photographer",
    "modal.body": "Drop a note and I'll get back within a day or two.",
    "modal.cta.enquire": "Enquire",
    "modal.cta.work": "Browse work",
    "modal.footnote": "Replies within a day or two",

    // Cookie
    "cookie.body":
      "This site uses minimal essential cookies for performance. No ads, no third-party tracking.",
    "cookie.dismiss": "OK, got it",

    // Footer
    "footer.coverage": "Coverage",
    "footer.coverage.area": "Available across India",
    "footer.coverage.note":
      "Travel and stay are billed separately from event coverage.",
    "footer.booking.badge": "Bookings open for 2026",
    "footer.made": "Made with care · Tamil Nadu",
    "footer.index": "Index No. 01",
    "footer.tagline": "Photographs that feel like the moment itself.",
    "footer.contact": "Contact",
    "footer.copyright.suffix": "Ganesh Partheeban. Candid Photographer.",
    "footer.byline.l1": "Natural moments",
    "footer.byline.l2": "Real emotions",
    "footer.byline.l3": "Fast delivery",

    // Misc
    "language.toggle": "தமிழ்",
    "language.label": "Language",
    "common.close": "Close",
    "common.previous": "Previous",
    "common.next": "Next",
  },
  ta: {
    "nav.work": "வேலைகள்",
    "nav.about": "என்னைப் பற்றி",
    "nav.services": "சேவைகள்",
    "tabs.work": "வேலைகள்",
    "tabs.about": "பற்றி",
    "tabs.services": "சேவைகள்",
    "tabs.features": "சிறப்புக்கள்",
    "tabs.enquire": "தொடர்பு",
    "nav.press": "பதிப்புகள்",
    "nav.enquire": "கேட்க",
    "header.brand.prefix": "Moments",
    "header.brand.suffix": "by Ganesh Partheeban",

    "home.hero.label": "தொகுப்பு I · இயற்கையான ஆவணப்படுத்தல்",
    "home.hero.line1": "தருணங்கள்,",
    "home.hero.line2": "உண்மையாக",
    "home.hero.line3": "பதிவு செய்யப்பட்டவை.",
    "home.hero.body":
      "இயற்கையான தருணங்கள். உண்மையான உணர்வுகள். விரைவான டெலிவரி. திருமணங்கள், நிகழ்வுகள், இசை நிகழ்ச்சிகள், காட்சிகள் மற்றும் அதற்கு இடையேயான அனைத்தையும் இயற்கையாகப் படம்பிடிக்கும் ஒரு கேண்டிட் புகைப்படக்காரர். கட்டாய போஸ்கள் இல்லை, அதிக எடிட்டிங் இல்லை, செயற்கையான ஸ்டைலிங் இல்லை.",
    "home.hero.cta.book": "உங்கள் நிகழ்வை முன்பதிவு செய்யுங்கள்",
    "home.hero.cta.instagram": "Instagram-இல் தொடர்பு கொள்ளுங்கள்",
    "home.hero.booking.window": "முன்பதிவு திறந்துள்ளது",

    "home.work.label": "தேர்ந்தெடுக்கப்பட்ட படங்கள்",
    "home.work.title":
      "அமைதியான பார்வைகள், உரத்த சிரிப்புகள், அதற்கிடையேயான அனைத்தும்.",
    "home.work.viewServices": "சேவைகளைப் பார்க்கவும் →",
    "home.stories.label": "கதைகள்",
    "home.stories.title.before": "திருமணங்கள், சடங்குகள்,",
    "home.stories.title.accent": "நிகழ்ச்சிகள்",
    "home.stories.body":
      "ஒவ்வொரு கார்டும் ஒரு நாள் முழுவதும் ஆவணப்படுத்தப்பட்ட கதை · உள்ளே நுழைய ஒன்றைத் தட்டுங்கள்.",
    "home.singles.label": "மற்ற காட்சிகள்",
    "home.singles.title": "மற்றும் வேறிடங்களிலிருந்து சில தனிக் காட்சிகள்.",

    "home.philosophy.label": "தத்துவம்",
    "home.philosophy.title.before": "என் வேலையை",
    "home.philosophy.title.accent": "தனித்துவமாக்குவது",
    "philosophy.01.title": "உண்மை, பரிபூரணத்தைவிட",
    "philosophy.01.body":
      "உண்மையான உணர்வு எப்போதும் செயற்கை பரிபூரணத்தை மிஞ்சும்.",
    "philosophy.02.title": "விரைவான டெலிவரி",
    "philosophy.02.body":
      "புதிதாக உணரும் வேளையிலேயே நினைவுகளை பகிர்வதற்காக படங்கள் விரைவாகக் கிடைக்கும்.",
    "philosophy.03.title": "சமூக ஊடகங்களுக்கு தயார்",
    "philosophy.03.body":
      "ஒவ்வொரு கேலரியிலும் Instagram, ஸ்டோரிஸ் மற்றும் WhatsApp-க்கான முன்-வெட்டப்பட்ட, வண்ணம் சரிசெய்யப்பட்ட ஏற்றுமதிகள் இடம்பெறும்.",
    "philosophy.04.title": "குறைந்தபட்ச எடிட்டிங்",
    "philosophy.04.body":
      "இயற்கையான தோல் நிறங்கள், யதார்த்தமான வெளிச்சம், உண்மைக்கு நிகரான தருணங்கள்.",
    "philosophy.05.title": "தனிமை கவரேஜ்",
    "philosophy.05.body":
      "உங்கள் நிகழ்வை நானே நேரடியாகப் படம்பிடிக்கிறேன். ஒரே குரல், ஒரே நடை.",
    "philosophy.06.title": "நிகழ்வு அடிப்படையிலான விலை",
    "philosophy.06.body":
      "மணி அடிப்படையில் அல்ல, நிகழ்வின் அடிப்படையில் விலை. நேர கண்காணிப்பு இல்லை.",

    "home.press.label": "சிறப்பிடம் பெற்றவை",
    "home.press.title.before": "உலகம் முழுவதும்",
    "home.press.title.accent": "பயணித்த",
    "home.press.body":
      "எனது புகைப்படங்களை வெளியிட்ட தேர்ந்தெடுக்கப்பட்ட பதிப்புகள் · தேசிய பத்திரிகைகள் முதல் சர்வதேச அறிக்கைகள் வரை.",
    "home.press.seeAll": "அனைத்து {{count}} சிறப்பிடங்களைப் பார்க்கவும்",

    "home.cta.label": "பேசலாம்",
    "home.cta.title.line1": "குறைவான போஸ்கள்.",
    "home.cta.title.line2.before": "அதிக",
    "home.cta.title.line2.accent": "உயிர்ப்பு",
    "home.cta.body":
      "தருணத்தைப் போலவே உணரும் புகைப்படங்கள் வேண்டுமென்றால், ஒரு செய்தி அனுப்புங்கள். தேதி கிடைக்கும் தன்மையின் அடிப்படையில் முன்பதிவுகள் உறுதி செய்யப்படுகின்றன.",
    "home.cta.button": "இப்போதே கேட்கவும்",

    "about.label": "என்னைப் பற்றி",
    "about.headline.l1": "சிறந்த",
    "about.headline.l2": "புகைப்படங்கள்",
    "about.headline.l3.before": "என நம்புகிறேன்.",
    "about.headline.l3.accent": "இயற்கையாக நிகழ்கின்றன",
    "about.body.p1":
      "வணக்கம், நான் கணேஷ் பார்த்தீபன், இந்தியாவை தளமாகக் கொண்ட ஒரு கேண்டிட் புகைப்படக்காரர். திருமணங்கள், குடும்ப விழாக்கள், இசை நிகழ்ச்சிகள், நேரடி நிகழ்ச்சிகள், கார்ப்பரேட் தொடக்க விழாக்கள், மற்றும் பின்னணி வேலைகள் என பல வகையான நிகழ்வுகளை நான் பதிவு செய்கிறேன். நண்பர்களுக்கிடையேயான சிரிப்பு, அமைதியான பார்வைகள், கலைஞர்கள் தங்கள் சொந்த உலகில், மற்றும் ஒவ்வொரு நிகழ்வையும் தனித்துவமாக்கும் சூழல் · இவ்வாறான உண்மையான மனித தருணங்களைப் பிடிக்க முயல்கிறேன்.",
    "about.body.p2":
      "நான் நிகழ்வுகளில் சுயமாக வேலை செய்கிறேன், கூட்டத்தோடு கூட்டமாகி, தருணங்களை இடையூறு செய்யாமல் இயற்கையாக ஆவணப்படுத்துகிறேன். ஒவ்வொரு நிகழ்வுக்கும் முன், தொடர்புடைய முக்கிய நபர்களை · குடும்ப உறுப்பினர்கள், நெருங்கிய நண்பர்கள், முக்கிய சடங்குகள், தனிப்பட்ட உறவுகள் · புரிந்துகொள்ள நேரம் ஒதுக்குகிறேன், அதனால் முக்கியமான தருணங்களை முன்கூட்டியே அறிய முடியும்.",
    "about.portrait.caption": "கணேஷ் பார்த்தீபன் · தமிழ்நாடு, இந்தியா",
    "about.howIWork.label": "என் வேலை முறை",
    "about.howIWork.01.t": "உண்மையாக கவனிக்கவும்",
    "about.howIWork.01.b":
      "அமைதியாக இருங்கள். முதலில் கவனியுங்கள். தருணத்தை உருவாக்காமல் காத்திருங்கள்.",
    "about.howIWork.02.t": "இயல்பாக தொடர்பு கொள்ளுங்கள்",
    "about.howIWork.02.b":
      "மக்கள் கேமராவை மறக்கும் அளவுக்கு இயல்பாக இருக்கச் செய்யுங்கள். அதன் பின் காட்சி தானாக ஓய்வுபெறும்.",
    "about.howIWork.03.t": "நிகழும்போதே பிடியுங்கள்",
    "about.howIWork.03.b":
      "நிகழ்வு உண்மையில் நிகழும் விதத்தையே ஆவணப்படுத்துங்கள். குறைந்தபட்ச தலையீடு, ஸ்டைலிங் இல்லை.",
    "about.testimonials.label": "வாடிக்கையாளர் கருத்துகள்",
    "about.testimonials.shareYours": "உங்களுடையதை பகிருங்கள்",
    "about.testimonialForm.name": "உங்கள் பெயர்",
    "about.testimonialForm.venue": "நிகழ்வு / இடம் (விருப்பத்தேர்வு)",
    "about.testimonialForm.message": "சில வார்த்தைகள்",
    "about.testimonialForm.placeholder":
      "எப்படி இருந்தது? எது உங்களை மீண்டும் இழுத்து வந்தது?",
    "about.testimonialForm.submit": "கருத்தைப் பகிர",
    "about.testimonialForm.sending": "அனுப்புகிறது…",
    "about.testimonialForm.thanks": "நன்றி. உங்கள் வார்த்தைகள் மிகவும் முக்கியம்.",
    "about.specialization.label": "சிறப்பு",
    "about.specialization.01": "இயற்கையான வெளிப்பாடுகள்",
    "about.specialization.02": "உண்மையான உணர்வுகள்",
    "about.specialization.03": "குறைந்தபட்ச தலையீடு",
    "about.specialization.04": "காலத்தை மீறிய காட்சி கதைசொல்லல்",
    "about.cta": "உரையாடலைத் தொடங்குங்கள்",

    "services.label": "சேவைகள்",
    "services.headline.l1": "ஒரு புகைப்படக்காரர்.",
    "services.headline.l2.before": "முக்கியமான தருணம்.",
    "services.headline.l2.accent": "ஒவ்வொரு",
    "services.comingSoon": "விரைவில் வரும்",
    "services.enquire": "கேட்க",
    "services.notifyMe": "தெரிவிக்கவும்",
    "services.pricing.from": "தொடக்கம்",
    "services.pricing.unit": "ஒரு நிகழ்வுக்கு",
    "services.pricing.note":
      "மணி அடிப்படையில் அல்ல, நிகழ்வு அடிப்படையில் விலை. வெளியூர் நிகழ்வுகளுக்கு பயணம் மற்றும் தங்கும் கட்டணம் வெளிப்படையாக தனியாகக் கூறப்படும். தேதி கிடைக்கும் தன்மையின் அடிப்படையில் முன்பதிவுகள் உறுதி.",
    "services.delivery.label": "டெலிவரி",
    "services.delivery.title": "விரைவு, பகிர தயார்.",
    "services.delivery.body":
      "இன்றைய உலகில், தருணங்கள் உடனடியாக அன்பானவர்களுடன் பகிரப்பட வேண்டும். நிகழ்வுக்கு பிறகு விரைவில் நினைவுகளை மீண்டும் வாழவும் பகிரவும் தம்பதிகள் மற்றும் குடும்பங்களுக்கு எனது பணி முறை வடிவமைக்கப்பட்டுள்ளது.",
    "services.delivery.note.label": "குறிப்பு",
    "services.delivery.note.body":
      "அனைத்து டெலிவரிகளும் டிஜிட்டலாக உள்ளன. அச்சிடப்பட்ட ஆல்பங்கள், ஹார்ட் காப்பிகள், அல்லது இயற்பியல் புகைப்பட புத்தகங்கள் வழங்கப்படுவதில்லை.",
    "services.working.label": "வேலை முறை",
    "services.working.title": "நிகழ்வுக்குள் அமைதியாக வேலை செய்கிறேன்.",
    "services.working.01": "இடைவினைகளை கவனித்தல்",
    "services.working.02": "உணர்வுகளை முன்கூட்டியே அறிதல்",
    "services.working.03": "உண்மையான எதிர்வினைகளைப் பிடித்தல்",
    "services.working.04": "முக்கியமான தருணங்களை இயற்கையாக ஆவணப்படுத்தல்",
    "services.coverage.label": "சேவை வழங்கப்படும் இடம்",
    "services.coverage.title": "இந்தியா முழுவதும் கிடைக்கும்.",
    "services.coverage.body":
      "நாடு முழுவதிலுமிருந்து முன்பதிவுகளை ஏற்றுக்கொள்கிறேன். மணி அடிப்படையில் அல்ல, நிகழ்வு அடிப்படையில் விலை. பயணம் மற்றும் தங்கும் கட்டணம் நிகழ்வுக் கட்டணத்திலிருந்து தனியாக வழங்கப்படும்.",
    "services.coverage.cta": "தேதி கிடைப்பதை சரிபார்க்க",

    "contact.label": "தொடர்பு",
    "contact.headline.l1": "உங்கள் நிகழ்வைப்",
    "contact.headline.l2.accent": "பற்றி பேசலாம்",
    "contact.body":
      "இயற்கையாகவும், உணர்ச்சிபூர்வமாகவும், தருணத்திற்கு உண்மையாகவும் உணரும் கேண்டிட் புகைப்படம் தேடுகிறீர்கள் எனில் ஒரு செய்தி அனுப்புங்கள். தேதி கிடைக்கும் தன்மையின் அடிப்படையில் முன்பதிவுகள் உறுதி.",
    "contact.card.fastestReply": "விரைவான பதில்",
    "contact.card.fullBriefs": "முழுமையான விவரங்களுக்கு",
    "contact.testimonials.label": "வாடிக்கையாளர் கருத்துகள்",
    "contact.faq.label": "கேள்விகள்",
    "contact.faq.title": "அடிக்கடி கேட்கப்படுபவை.",
    "contact.bookingEnquiry.label": "[ முன்பதிவு கேள்வி ]",
    "contact.bookingEnquiry.headline.before": "உங்கள் நிகழ்வைப்",
    "contact.bookingEnquiry.headline.accent": "பற்றி பேசலாம்.",
    "contact.bookingEnquiry.body":
      "இயற்கையாகவும், உணர்ச்சிபூர்வமாகவும், தருணத்திற்கு உண்மையாகவும் உணரும் கேண்டிட் புகைப்படம் தேடுகிறீர்கள் எனில் · கீழே தொடர்பு கொள்ளவும் அல்லது நேரடியாக செய்தி அனுப்பவும்.",
    "contact.bookingEnquiry.basedIn": "இடம்",
    "contact.bookingEnquiry.basedIn.value":
      "சென்னை · இந்தியா முழுவதும் கிடைக்கும்",
    "contact.bookingEnquiry.footnote.l1":
      "தேதி கிடைக்கும் தன்மையின் அடிப்படையில் முன்பதிவுகள் உறுதி.",
    "contact.bookingEnquiry.footnote.l2":
      "பயணம் & தங்கும் கட்டணம் தனியாகக் கூறப்படும்.",
    "contact.form.name": "உங்கள் பெயர்",
    "contact.form.email": "மின்னஞ்சல்",
    "contact.form.date": "நிகழ்வு தேதி",
    "contact.form.city": "நகரம்",
    "contact.form.eventType": "நிகழ்வு வகை",
    "contact.form.budget": "பட்ஜெட் (₹ INR)",
    "contact.form.notes": "உங்கள் நிகழ்வைப் பற்றி",
    "contact.form.notes.placeholder":
      "யார் திருமணம் செய்கிறார்கள், எப்படிப்பட்ட வைப், எந்த சடங்குகள், நான் தெரிந்து கொள்ள வேண்டிய சிறப்பு விவரம்…",
    "contact.form.submit": "கேள்வியை அனுப்பு",
    "contact.form.sending": "அனுப்புகிறது…",
    "contact.form.sent": "நன்றி, விரைவில் தொடர்பு கொள்கிறேன் ✓",
    "contact.form.limit": "வரம்பை எட்டிவிட்டது",
    "contact.form.retry": "மீண்டும் முயற்சிக்கவும் ↻",
    "contact.form.sentNote":
      "கேள்வி பெறப்பட்டது. நீங்கள் அளித்த மின்னஞ்சல் முகவரிக்கு ஒன்று-இரண்டு நாட்களில் பதிலளிக்கிறேன்.",
    "contact.form.limitNote":
      "இந்த சாதனத்திலிருந்து ஐந்து கேள்விகளை ஏற்கனவே அனுப்பிவிட்டீர்கள். தொடர்புக்கு ganeshpartheeban@gmail.com என்ற முகவரிக்கு நேரடியாக மின்னஞ்சல் அனுப்பவும்.",
    "contact.form.errorNote":
      "அனுப்ப முடியவில்லை. ganeshpartheeban@gmail.com என்ற முகவரிக்கு நேரடியாக மின்னஞ்சல் அனுப்பவும்.",

    "press.label": "பதிப்புகள்",
    "press.headline.before": "உலகம் முழுவதும்",
    "press.headline.accent": "பயணித்த",
    "press.headline.after": "புகைப்படங்கள்.",
    "press.body":
      "எனது புகைப்படங்களை வெளியிட்ட பதிப்புகளின் தொடர்ச்சியான பட்டியல். தேசிய செய்தி அலுவலகங்கள் முதல் சர்வதேச ஆராய்ச்சி அறிக்கைகள் வரை · என் காட்சிகள் தோன்றிய இடங்கள் இவை.",
    "press.featuresLabel": "சிறப்பிடங்கள்",
    "press.andCounting": "எண்ணிக்கை அதிகரித்து வருகிறது.",
    "press.readArticle": "கட்டுரையைப் படிக்க",
    "press.outro.label": "உங்கள் புகைப்படத்தை இடம்பெறச் செய்யுங்கள்",
    "press.outro.title.before": "தலையங்க வேலைகளும்",
    "press.outro.title.accent": "வரவேற்கப்படுகின்றன",
    "press.outro.body":
      "இந்தியாவை தளமாகக் கொண்ட கேண்டிட், ஆவண, அல்லது நிகழ்வு புகைப்படம் தேடும் ஆசிரியர் அல்லது கலை இயக்குநராக இருந்தால், தொடர்பு கொள்ளுங்கள்.",

    "404.label": "404 · காட்சி காணவில்லை",
    "404.headline.l1": "இந்த காட்சி",
    "404.headline.l2.before": "தப்பிச்",
    "404.headline.l2.accent": "சென்றது",
    "404.body":
      "நீங்கள் தேடும் பக்கம் நகர்த்தப்பட்டிருக்கலாம் அல்லது இருந்திருக்காது. நல்ல புகைப்படக்காரர்களும் சில காட்சிகளை இழக்கிறார்கள்.",
    "404.cta.primary": "வேலைகளுக்குத் திரும்ப",
    "404.cta.secondary": "அல்லது தொடர்பு கொள்ள",

    "modal.label": "ஒரு குறிப்பு",
    "modal.headline.before": "உங்கள் சிறந்த",
    "modal.headline.accent": "தருணங்களை",
    "modal.body":
      "தொடர்பு கொண்டு உங்கள் நிகழ்வைப் பற்றி பேசலாம். அல்லது வேலையை முதலில் ஒரு பார்வை பார்க்க விரும்பினால், அதையும் செய்யலாம்.",
    "modal.cta.enquire": "கேட்க",
    "modal.cta.work": "முதலில் வேலையைப் பார்க்க",
    "modal.footnote":
      "தேதி கிடைப்பின் அடிப்படையில் முன்பதிவுகள் உறுதி · ஒரு-இரண்டு நாட்களில் பதில்",

    "cookie.body":
      "இந்த தளம் செயல்திறனுக்காக மட்டுமே குறைந்தபட்ச அத்தியாவசிய cookies-களைப் பயன்படுத்துகிறது. விளம்பரம் இல்லை, மூன்றாம் தரப்பு கண்காணிப்பு இல்லை.",
    "cookie.dismiss": "சரி, புரிந்தது",

    "footer.coverage": "சேவை வழங்கப்படும் இடம்",
    "footer.coverage.area": "இந்தியா முழுவதும் கிடைக்கும்",
    "footer.coverage.note":
      "பயணம் மற்றும் தங்கும் செலவுகள் நிகழ்வுக் கட்டணத்திலிருந்து தனியாக வழங்கப்படும்.",
    "footer.booking.badge": "2026க்கான முன்பதிவுகள் திறந்துள்ளன",
    "footer.made": "அன்புடன் உருவாக்கப்பட்டது · தமிழ்நாடு",
    "footer.index": "தொகுப்பு எண் 01",
    "footer.tagline": "தருணத்தைப் போலவே உணரும் புகைப்படங்கள்.",
    "footer.contact": "தொடர்பு",
    "footer.copyright.suffix": "Ganesh Partheeban. கேண்டிட் புகைப்படக்காரர்.",
    "footer.byline.l1": "இயற்கையான தருணங்கள்",
    "footer.byline.l2": "உண்மையான உணர்வுகள்",
    "footer.byline.l3": "விரைவான டெலிவரி",

    "language.toggle": "English",
    "language.label": "மொழி",
    "common.close": "மூடு",
    "common.previous": "முந்தைய",
    "common.next": "அடுத்த",
  },
};

const STORAGE_KEY = "rms-locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
};

const I18nContext = createContext<Ctx>({
  locale: "en",
  setLocale: () => {},
  t: (k) => TRANSLATIONS.en[k] ?? String(k),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "ta" || saved === "en") setLocaleState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
      document.documentElement.lang = l === "ta" ? "ta" : "en";
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: keyof typeof TRANSLATIONS.en) =>
      TRANSLATIONS[locale][key] ?? TRANSLATIONS.en[key] ?? String(key),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
