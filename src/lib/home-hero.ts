import { prisma } from "@/lib/prisma";
import { defaultOccasionAccess, readOccasionAccess, type OccasionAccess } from "@/lib/occasion-access";

export type HomeHeroContent = {
  id: string;
  eyebrow: string;
  titleLineOne: string;
  titleLineTwo: string;
  titleHighlight: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  locationText: string;
  imageUrl: string;
  imagePublicId: string | null;
  imageAlt: string;
  sections: HomePageCopy;
};

export type HomePageCopy = {
  occasionAccess: OccasionAccess;
  bannerText: string;
  categoriesTitle: string;
  categoriesDescription: string;
  featuredTitleLead: string;
  featuredTitleHighlight: string;
  featuredCta: string;
  instagramTitle: string;
  instagramDescription: string;
  instagramAction: string;
  howEyebrow: string;
  howTitle: string;
  howDescription: string;
  howSteps: { title: string; description: string }[];
  faqEyebrow: string;
  faqTitle: string;
  faqDescription: string;
  faqItems: { question: string; answer: string }[];
  footerCtaTitle: string;
  footerCtaDescription: string;
  footerCtaButton: string;
  footerAbout: string;
  footerAddress: string;
  footerMapLabel: string;
  footerPhoneLabel: string;
  footerPhoneValue: string;
  footerHoursLabel: string;
  footerHoursValue: string;
  footerDisclaimer: string;
};

export const DEFAULT_HOME_PAGE_COPY: HomePageCopy = {
  occasionAccess: defaultOccasionAccess.map((card) => ({ ...card, tags: [...card.tags] })),
  bannerText: "Encontrá tu próximo personaje. Reservá tu disfraz con anticipación.",
  categoriesTitle: "¿Para quién es el disfraz?",
  categoriesDescription: "Elegí un punto de partida y te mostramos el catálogo filtrado.",
  featuredTitleLead: "Un disfraz.",
  featuredTitleHighlight: "Mil posibilidades.",
  featuredCta: "Ver catálogo completo",
  instagramTitle: "Seguinos en Instagram",
  instagramDescription: "Novedades e ideas de disfraces en @disfraceshechizos",
  instagramAction: "Ir a Instagram",
  howEyebrow: "Cómo funciona",
  howTitle: "Alquilar es fácil.",
  howDescription: "La web te ayuda a elegir. Del resto se encarga el equipo del local, con atención de persona a persona.",
  howSteps: [
    { title: "Encontrá tu disfraz", description: "Explorá el catálogo y elegí el personaje que más te guste." },
    { title: "Consultá talle y fecha", description: "Indicá qué talle necesitás y cuándo querés utilizarlo." },
    { title: "Coordiná con nosotros", description: "Contactá al equipo para confirmar la disponibilidad y los detalles del alquiler." },
  ],
  faqEyebrow: "Preguntas frecuentes",
  faqTitle: "Antes de elegir.",
  faqDescription: "Para condiciones específicas de alquiler, consultá directamente con el local.",
  faqItems: [
    { question: "¿Cómo funciona el alquiler?", answer: "Elegí un disfraz del catálogo y consultá por WhatsApp indicando el talle y la fecha de uso. El equipo del local te confirma disponibilidad, precio y condiciones antes de coordinar el alquiler." },
    { question: "¿Cómo consulto si un disfraz está disponible?", answer: "Abrí el detalle del disfraz o usá el botón de WhatsApp. Contanos qué modelo y talle buscás y para qué fecha; la disponibilidad se confirma directamente con el local." },
    { question: "¿Qué talles hay?", answer: "Los talles disponibles cambian según el disfraz. En cada ficha vas a encontrar los talles de referencia para consultar; el equipo del local puede ayudarte a confirmar cuál te conviene." },
    { question: "¿Con cuánta anticipación debería consultar?", answer: "Si ya tenés una fecha, te recomendamos consultar con anticipación para que el local pueda revisar la disponibilidad del disfraz y el talle." },
    { question: "¿Cómo puedo retirar el disfraz?", answer: "Una vez confirmada la disponibilidad, coordiná con el equipo del local la fecha y los detalles para retirarlo y devolverlo." },
    { question: "¿Cómo me comunico con el local?", answer: "Podés escribirnos desde el botón “Consultar por WhatsApp”. También podés acercarte al local en España 1744, Mar del Plata." },
  ],
  footerCtaTitle: "¿Ya tenés tu personaje en mente?",
  footerCtaDescription: "Contanos qué estás buscando y te ayudamos a encontrar el disfraz ideal.",
  footerCtaButton: "Hacer una consulta",
  footerAbout: "Alquiler de disfraces para adultos y niños en Mar del Plata. Personajes, temáticas y clásicos para cada ocasión.",
  footerAddress: "España 1744, Mar del Plata",
  footerMapLabel: "Ver en Google Maps",
  footerPhoneLabel: "Teléfono",
  footerPhoneValue: "A confirmar",
  footerHoursLabel: "Horario",
  footerHoursValue: "A confirmar",
  footerDisclaimer: "Precios, disponibilidad y condiciones de alquiler se confirman con el local.",
};

export const DEFAULT_HOME_HERO: HomeHeroContent = {
  id: "home",
  eyebrow: "Disfraces para cada ocasión",
  titleLineOne: "Hoy podés",
  titleLineTwo: "ser",
  titleHighlight: "quien quieras",
  description: "Encontrá el disfraz ideal para tu próxima fiesta, evento o celebración. Explorá nuestro catálogo y consultá por tu próximo look.",
  primaryCtaLabel: "Explorar disfraces",
  secondaryCtaLabel: "Cómo funciona el alquiler",
  locationText: "Local en España 1744 · Mar del Plata",
  imageUrl: "/images/hero-disfraces.webp",
  imagePublicId: null,
  imageAlt: "Cuatro personas con disfraces de pirata, reina egipcia, guerrera y astronauta",
  sections: DEFAULT_HOME_PAGE_COPY,
};

export async function getHomeHeroContent(): Promise<HomeHeroContent> {
  try {
    const [content, sectionsRows] = await Promise.all([
      prisma.homeHero.findUnique({ where: { id: "home" } }),
      prisma.$queryRaw<Array<{ sections: unknown }>>`SELECT "sections" FROM "HomeHero" WHERE "id" = 'home' LIMIT 1`,
    ]);
    if (!content) return DEFAULT_HOME_HERO;
    const rawSections = sectionsRows[0]?.sections ?? content.sections;
    const storedSections = rawSections && typeof rawSections === "object" && !Array.isArray(rawSections)
      ? rawSections as Partial<HomePageCopy>
      : {};
    return { ...content, sections: { ...DEFAULT_HOME_PAGE_COPY, ...storedSections, occasionAccess: readOccasionAccess(storedSections.occasionAccess) } };
  } catch (error) {
    console.error("[store] No se pudo cargar el contenido del hero", error);
    return DEFAULT_HOME_HERO;
  }
}
