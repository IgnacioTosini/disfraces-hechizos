import { z } from "zod";
import { occasionAccessSchema } from "../occasion-access";

const homePageCopySchema = z.object({
  occasionAccess: occasionAccessSchema,
  bannerText: z.string().trim().min(2).max(120),
  categoriesTitle: z.string().trim().min(2).max(100),
  categoriesDescription: z.string().trim().min(2).max(180),
  featuredTitleLead: z.string().trim().min(2).max(60),
  featuredTitleHighlight: z.string().trim().min(2).max(60),
  featuredCta: z.string().trim().min(2).max(50),
  instagramTitle: z.string().trim().min(2).max(60),
  instagramDescription: z.string().trim().min(2).max(120),
  instagramAction: z.string().trim().min(2).max(40),
  howEyebrow: z.string().trim().min(2).max(50),
  howTitle: z.string().trim().min(2).max(80),
  howDescription: z.string().trim().min(2).max(220),
  howSteps: z.array(z.object({ title: z.string().trim().min(2).max(70), description: z.string().trim().min(2).max(180) })).length(3),
  faqEyebrow: z.string().trim().min(2).max(50),
  faqTitle: z.string().trim().min(2).max(80),
  faqDescription: z.string().trim().min(2).max(220),
  faqItems: z.array(z.object({ question: z.string().trim().min(2).max(120), answer: z.string().trim().min(2).max(500) })).length(6),
  footerCtaTitle: z.string().trim().min(2).max(100),
  footerCtaDescription: z.string().trim().min(2).max(220),
  footerCtaButton: z.string().trim().min(2).max(50),
  footerAbout: z.string().trim().min(2).max(300),
  footerAddress: z.string().trim().min(2).max(120),
  footerMapLabel: z.string().trim().min(2).max(60),
  footerPhoneLabel: z.string().trim().min(2).max(30),
  footerPhoneValue: z.string().trim().min(2).max(60),
  footerHoursLabel: z.string().trim().min(2).max(30),
  footerHoursValue: z.string().trim().min(2).max(60),
  footerDisclaimer: z.string().trim().min(2).max(220),
});

export const homeHeroSchema = z.object({
  eyebrow: z.string().trim().min(2, "Escribí el texto pequeño que aparece sobre el título.").max(80, "Usá hasta 80 caracteres."),
  titleLineOne: z.string().trim().min(1, "Completá la primera línea del título.").max(50, "Usá hasta 50 caracteres."),
  titleLineTwo: z.string().trim().min(1, "Completá la segunda línea del título.").max(32, "Usá hasta 32 caracteres."),
  titleHighlight: z.string().trim().min(2, "Completá la frase destacada.").max(60, "Usá hasta 60 caracteres."),
  description: z.string().trim().min(10, "La descripción es demasiado corta.").max(360, "La descripción admite hasta 360 caracteres."),
  primaryCtaLabel: z.string().trim().min(2, "Completá el texto del botón principal.").max(40, "Usá hasta 40 caracteres."),
  secondaryCtaLabel: z.string().trim().min(2, "Completá el texto del segundo botón.").max(50, "Usá hasta 50 caracteres."),
  locationText: z.string().trim().min(2, "Completá el texto de ubicación.").max(100, "Usá hasta 100 caracteres."),
  imageUrl: z.string().trim().min(1, "Elegí una imagen para el hero.").max(2048, "La dirección de la imagen es demasiado larga."),
  imagePublicId: z.string().trim().max(255, "El identificador de la imagen no es válido."),
  imageAlt: z.string().trim().min(5, "Describí brevemente la imagen.").max(180, "El texto alternativo admite hasta 180 caracteres."),
  sections: z.string().transform((raw, context) => {
    try {
      const parsed = homePageCopySchema.safeParse(JSON.parse(raw));
      if (parsed.success) return parsed.data;
      for (const issue of parsed.error.issues) context.addIssue({ ...issue, path: ["sections", ...issue.path] });
    } catch {
      context.addIssue({ code: "custom", message: "No se pudieron leer los textos del Home.", path: ["sections"] });
    }
    return z.NEVER;
  }),
});

export type HomeHeroFormValues = z.infer<typeof homeHeroSchema>;

export function readHomeHeroFormData(formData: FormData) {
  return homeHeroSchema.safeParse({
    eyebrow: formData.get("eyebrow"),
    titleLineOne: formData.get("titleLineOne"),
    titleLineTwo: formData.get("titleLineTwo"),
    titleHighlight: formData.get("titleHighlight"),
    description: formData.get("description"),
    primaryCtaLabel: formData.get("primaryCtaLabel"),
    secondaryCtaLabel: formData.get("secondaryCtaLabel"),
    locationText: formData.get("locationText"),
    imageUrl: formData.get("imageUrl"),
    imagePublicId: formData.get("imagePublicId") ?? "",
    imageAlt: formData.get("imageAlt"),
    sections: formData.get("sections"),
  });
}
