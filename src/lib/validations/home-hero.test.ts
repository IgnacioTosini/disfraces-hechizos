import { describe, expect, it } from "vitest";
import { readHomeHeroFormData } from "./home-hero";
import { defaultOccasionAccess } from "../occasion-access";

const sections = {
  occasionAccess: defaultOccasionAccess.map((card) => ({ ...card, tags: [...card.tags] })),
  bannerText: "Encontrá tu próximo personaje.",
  categoriesTitle: "¿Para quién es el disfraz?",
  categoriesDescription: "Elegí un punto de partida.",
  featuredTitleLead: "Un disfraz.",
  featuredTitleHighlight: "Mil posibilidades.",
  featuredCta: "Ver catálogo completo",
  instagramTitle: "Seguinos en Instagram",
  instagramDescription: "Novedades de disfraces.",
  instagramAction: "Ir a Instagram",
  howEyebrow: "Cómo funciona",
  howTitle: "Alquilar es fácil.",
  howDescription: "Elegí un disfraz y consultá con el local.",
  howSteps: Array.from({ length: 3 }, (_, index) => ({ title: `Paso ${index + 1}`, description: "Descripción del paso." })),
  faqEyebrow: "Preguntas frecuentes",
  faqTitle: "Antes de elegir.",
  faqDescription: "Consultá las dudas más comunes.",
  faqItems: Array.from({ length: 6 }, (_, index) => ({ question: `Pregunta ${index + 1}`, answer: "Respuesta de ejemplo para la consulta." })),
  footerCtaTitle: "¿Ya tenés tu personaje en mente?",
  footerCtaDescription: "Te ayudamos a encontrar tu disfraz.",
  footerCtaButton: "Hacer una consulta",
  footerAbout: "Alquiler de disfraces en Mar del Plata.",
  footerAddress: "España 1744, Mar del Plata",
  footerMapLabel: "Ver en Google Maps",
  footerPhoneLabel: "Teléfono",
  footerPhoneValue: "A confirmar",
  footerHoursLabel: "Horario",
  footerHoursValue: "A confirmar",
  footerDisclaimer: "La disponibilidad se confirma con el local.",
};

function makeFormData(copy: unknown = sections) {
  const formData = new FormData();
  formData.set("eyebrow", " Disfraces para cada ocasión ");
  formData.set("titleLineOne", "Hoy podés");
  formData.set("titleLineTwo", "ser");
  formData.set("titleHighlight", "quien quieras");
  formData.set("description", "Encontrá el disfraz ideal para tu próxima fiesta.");
  formData.set("primaryCtaLabel", "Explorar disfraces");
  formData.set("secondaryCtaLabel", "Cómo funciona el alquiler");
  formData.set("locationText", "Local en Mar del Plata");
  formData.set("imageUrl", "/images/hero.webp");
  formData.set("imagePublicId", "");
  formData.set("imageAlt", "Personas con disfraces para una fiesta");
  formData.set("sections", typeof copy === "string" ? copy : JSON.stringify(copy));
  return formData;
}

describe("contenido editable del Home", () => {
  it("acepta el formulario completo y normaliza los textos", () => {
    const result = readHomeHeroFormData(makeFormData());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.eyebrow).toBe("Disfraces para cada ocasión");
    expect(result.data.sections.howSteps).toHaveLength(3);
    expect(result.data.sections.faqItems).toHaveLength(6);
    expect(result.data.imagePublicId).toBe("");
  });

  it("rechaza una sección serializada con JSON inválido", () => {
    const result = readHomeHeroFormData(makeFormData("{"));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path[0] === "sections")).toBe(true);
  });

  it("rechaza preguntas o pasos faltantes para no guardar contenido incompleto", () => {
    const result = readHomeHeroFormData(makeFormData({ ...sections, faqItems: sections.faqItems.slice(0, 5) }));

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.path.includes("faqItems"))).toBe(true);
  });
});
