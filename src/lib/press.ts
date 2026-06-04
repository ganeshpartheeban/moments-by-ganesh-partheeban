/**
 * Editorial features · publications that have used Ganesh's photographs.
 *
 * Order is curated for visual prominence: highest-recognition outlets first
 * so they land in the most-visible grid cells.
 */

export type PressCategory =
  | "Editorial"
  | "Travel & Lifestyle"
  | "Global & Academic"
  | "Culture"
  | "Specialist";

export type PressFeature = {
  name: string;
  url: string;
  topic: string;
  category: PressCategory;
};

export const PRESS: PressFeature[] = [
  // National & high-authority editorial
  {
    name: "The Hindu",
    url: "https://www.thehindu.com/sci-tech/science/is-bursting-firecrackers-in-rainy-weather-worse/article70186177.ece",
    topic: "Are wet firecrackers worse for the air?",
    category: "Editorial",
  },
  {
    name: "Aaj Tak",
    url: "https://www.aajtak.in/visualstories/news/green-patakhe-diwali-2025-firecracker-guidelines-supreme-court-amlbs-264270-20-10-2025",
    topic: "Diwali 2025 green-firecracker guidelines",
    category: "Editorial",
  },
  {
    name: "NDTV Profit",
    url: "https://www.ndtvprofit.com/nation/cyclone-biparjoy-less-than-200-kilometres-from-gujarat-coast-74000-evacuated",
    topic: "Cyclone Biparjoy coverage",
    category: "Editorial",
  },
  {
    name: "LiveMint",
    url: "https://www.livemint.com/web-stories/5-festivals-celebrated-in-winter-in-india-11701342759879.html",
    topic: "Five festivals celebrated in Indian winters",
    category: "Editorial",
  },
  // Travel & lifestyle
  {
    name: "Condé Nast Traveller India",
    url: "https://www.cntraveller.in/web-stories/new-airports-coming-india/",
    topic: "New airports coming to India",
    category: "Travel & Lifestyle",
  },
  {
    name: "Travel + Leisure Asia",
    url: "https://www.travelandleisureasia.com/in/web-stories/destinations/places-to-visit-in-kerala-in-rainy-season/",
    topic: "Kerala in the rainy season",
    category: "Travel & Lifestyle",
  },
  // Global & academic
  {
    name: "UN ESCAP",
    url: "https://www.unescap.org/sites/default/d8files/knowledge-products/Asia-Pacific%20Disaster%20Report%202022%20for%20ESCAP%20Subregions%20-%20Pathways%20to%20Adaptation%20and%20Resilience%20in%20South%20and%20South%E2%80%91West%20Asia_1.pdf",
    topic: "Asia-Pacific Disaster Report 2022",
    category: "Global & Academic",
  },
  {
    name: "Cornell University",
    url: "https://as.cornell.edu/news/effective-government-saves-lives-cyclones-other-disasters",
    topic: "Government response to cyclone disasters",
    category: "Global & Academic",
  },
  {
    name: "Earth.Org",
    url: "https://earth.org/data_visualization/how-hurricanes-activity-links-to-climate-change/",
    topic: "How hurricane activity links to climate change",
    category: "Global & Academic",
  },
  {
    name: "IPS Noticias",
    url: "https://ipsnoticias.net/2024/04/a-los-agricultores-indios-les-hacen-falta-mejores-previsiones-sobre-los-monzones/ganesh-partheeban-f7crmlurzke-unsplash/",
    topic: "Indian farmers and monsoon forecasts",
    category: "Editorial",
  },
  // Indian travel & culture
  {
    name: "The South First",
    url: "https://thesouthfirst.com/karnataka/5-best-places-in-karnataka-to-enjoy-monsoons/",
    topic: "Best monsoon escapes in Karnataka",
    category: "Editorial",
  },
  {
    name: "TripXL",
    url: "https://tripxl.com/blog/places-to-visit-near-belur/",
    topic: "Places to visit near Belur",
    category: "Travel & Lifestyle",
  },
  {
    name: "Travel Escape",
    url: "https://www.travelescape.in/rameshwaram-travel-guide/",
    topic: "Rameshwaram travel guide",
    category: "Travel & Lifestyle",
  },
  {
    name: "Indulge Express",
    url: "https://www.indulgexpress.com/food/trends/2025/Jan/13/pongal-the-dish-of-gratitude-prepared-during-sankranti",
    topic: "Pongal · the dish of gratitude",
    category: "Culture",
  },
  // Specialist
  {
    name: "Pool Table Portfolio",
    url: "https://pooltableportfolio.com/blogs/magazine/baroque-and-rococo-design-in-england-stuart-to-georgian-eras",
    topic: "Baroque & Rococo design history",
    category: "Specialist",
  },
  {
    name: "Tahiri Herrera",
    url: "https://www.tahirihherrera.com/brainspotting",
    topic: "Brainspotting therapy",
    category: "Specialist",
  },
  {
    name: "Big Blog of Gardening",
    url: "https://www.bigblogofgardening.com/18-ways-to-sabotage-your-own-garden/",
    topic: "Gardening missteps to avoid",
    category: "Specialist",
  },
  // Culture & festival
  {
    name: "Hoovu Fresh",
    url: "https://hoovufresh.com/blogs/blog/4-days-of-pongal",
    topic: "Four days of Pongal",
    category: "Culture",
  },
  {
    name: "PartyVillas",
    url: "https://www.partyvillas.in/blog/web-stories/top-5-farmhouse-activities-for-a-fun-filled-diwali-getaway/",
    topic: "Diwali farmhouse getaways",
    category: "Culture",
  },
  {
    name: "Julahaa",
    url: "https://www.julahaa.com/blog/index.php/2024/10/24/pongal-2025-history-importance-significance/",
    topic: "Pongal 2025 · history & significance",
    category: "Culture",
  },
  {
    name: "HerStories",
    url: "https://herstories.xyz/cinema-tamil-7/",
    topic: "Tamil cinema",
    category: "Culture",
  },
  {
    name: "EatMy News",
    url: "https://www.eatmy.news/2023/08/10-unmissable-cultural-festivals-and-events-from-around-world.html",
    topic: "Cultural festivals around the world",
    category: "Culture",
  },
];
