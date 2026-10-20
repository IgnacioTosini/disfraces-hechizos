import { z } from "zod";

export const defaultOccasionAccess = [
  { id: "halloween", title: "Halloween", description: "Terror y personajes para una noche distinta.", tags: ["terror", "fantasia"], imageUrl: "/images/disfraz-freddy-hechizos.png", imagePublicId: null, imageAlt: "Disfraz de terror para Halloween" },
  { id: "cumples-infantiles", title: "Cumples infantiles", description: "Personajes divertidos para celebrar en familia.", tags: ["animados"], imageUrl: "/images/disfraz-dinosaurio-infantil.webp", imagePublicId: null, imageAlt: "Disfraz infantil de dinosaurio" },
  { id: "actos-escolares", title: "Actos escolares", description: "Ideas históricas y profesiones para representar.", tags: ["historicos", "profesiones"], imageUrl: "/images/disfraz-astronauta.webp", imagePublicId: null, imageAlt: "Disfraz de astronauta para una representación escolar" },
  { id: "fiestas-tematicas", title: "Fiestas temáticas", description: "Fantasía, aventura y clásicos para tu evento.", tags: ["fantasia", "historicos"], imageUrl: "/images/disfraz-bruja.webp", imagePublicId: null, imageAlt: "Disfraz de fantasía para una fiesta temática" },
] as const;

const occasionCardSchema = z.object({
  id: z.enum(["halloween", "cumples-infantiles", "actos-escolares", "fiestas-tematicas"]),
  title: z.string().trim().min(2, "Escribí un título.").max(60),
  description: z.string().trim().min(2, "Escribí una descripción.").max(140),
  tags: z.array(z.string().trim().min(2).max(40)).min(1, "Elegí al menos una etiqueta.").max(5),
  imageUrl: z.string().trim().min(1).max(2048),
  imagePublicId: z.string().trim().max(255).nullable(),
  imageAlt: z.string().trim().min(5, "Describí la imagen.").max(180),
}).superRefine((card, context) => {
  if (new Set(card.tags).size !== card.tags.length) context.addIssue({ code: "custom", path: ["tags"], message: "No repitas etiquetas." });
});

export const occasionAccessSchema = z.array(occasionCardSchema).length(4, "Se necesitan las cuatro tarjetas de ocasión.")
  .superRefine((cards, context) => {
    const ids = new Set(cards.map(({ id }) => id));
    if (ids.size !== 4) context.addIssue({ code: "custom", message: "No repitas tarjetas de ocasión." });
  });

export type OccasionAccessCard = z.infer<typeof occasionCardSchema>;
export type OccasionAccess = OccasionAccessCard[];

export function readOccasionAccess(value: unknown): OccasionAccess {
  const parsed = occasionAccessSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultOccasionAccess.map((card) => ({ ...card, tags: [...card.tags] }));
}
