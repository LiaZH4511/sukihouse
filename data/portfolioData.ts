import selectedPortfolio from "./selectedPortfolio.json";

export type Photograph = {
  id: string;
  src: string;
  alt: string;
  date: string;
  location: string;
  orientation: "portrait" | "landscape";
  note?: string;
  camera?: string;
  lens?: string;
  film?: string;
  tags: string[];
};

export type Event = {
  id: string;
  slug: string;
  title: string;
  period?: string;
  description?: string;
  cover: string;
  photographs: Photograph[];
};

export type OverviewImage = Photograph & {
  associatedEvent: string;
  visualCategory: "portrait" | "landscape" | "human" | "environment";
};

type PortfolioRecord = Omit<Event, "photographs"> & {
  photographs: Array<Photograph & { originalFile?: string }>;
};

export const siteInfo = {
  name: "The Flowing Green",
  instagramUrl: "https://www.instagram.com/",
};

export const events: Event[] = (selectedPortfolio as PortfolioRecord[]).map((event) => ({
  id: event.slug,
  slug: event.slug,
  title: event.title,
  period: event.period,
  description: event.description,
  cover: event.cover,
  photographs: event.photographs.map(({ originalFile, ...photo }) => photo),
}));

export const overviewImages: OverviewImage[] = events.flatMap((event) =>
  event.photographs.slice(0, 4).map((photograph) => ({
    ...photograph,
    associatedEvent: event.slug,
    visualCategory: photograph.orientation === "portrait" ? "portrait" : "landscape",
  })),
);

export const aboutContent = {
  portrait: {
    src: events[0]?.cover ?? "/portfolio/island-edges-weather/01-dscf0207.jpg",
    alt: "The Flowing Green cover photograph",
  },
  paragraphs: [
    "The Flowing Green is a travel zine built from 44 selected photographs: water, gardens, campus ceremony, public memory, temple paths, and summer streets.",
    "The sequence keeps people at a distance and lets place carry the emotional weight: rail lines, plaques, humid trees, museum shadows, and small objects handled like evidence.",
    "This online version is prepared for a first public pass, with room for later color grading, retouching, and final caption work.",
  ],
};

export const contactInfo = {
  name: "The Flowing Green",
  email: "studio@example.com",
  location: "Kansai / Boston / island weather",
  availability: "A working web zine prepared for continued post-production.",
  image: {
    src: "/portfolio/temple-gardens-street-heat/12-dscf2115.jpg",
    alt: "Engraved stone and summer light",
  },
};
