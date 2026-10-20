import { z } from "zod";

const variantSchema = z.object({
  id: z.string().max(128).optional(),
  size: z.string().trim().min(1, "Completá el talle.").max(24, "El talle admite hasta 24 caracteres."),
  stockQuantity: z.coerce.number().int("El stock debe ser un número entero.").min(0, "El stock no puede ser negativo.").max(9999),
  isActive: z.boolean(),
});

const imageSchema = z.object({
  url: z.string().trim().min(1, "La imagen no tiene una URL válida.").max(2048, "La dirección de la imagen es demasiado larga."),
  publicId: z.string().max(255).nullable(),
  altText: z.string().trim().max(180, "El texto alternativo admite hasta 180 caracteres."),
  sortOrder: z.number().int().min(0).max(99),
});

function isSafeLegacyImagePath(url: string) {
  return url.startsWith("/") && !url.startsWith("//") && !url.split("/").includes("..") && !url.includes("\\");
}

export const costumeFormSchema = z.object({
  name: z.string().trim().min(2, "Usá al menos 2 caracteres.").max(100, "El nombre admite hasta 100 caracteres."),
  slug: z.string().trim().min(2, "Completá el identificador de la URL.").max(110).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones; sin espacios ni acentos."),
  description: z.string().trim().max(1200, "La descripción admite hasta 1200 caracteres."),
  audience: z.enum(["ADULT", "CHILD", "UNISEX"]),
  rentalPrice: z.union([
    z.literal(""),
    z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, "Ingresá un precio válido, con hasta 2 decimales."),
  ]).transform((value) => value === "" ? null : Number(value)),
  categoryId: z.string().min(8, "Elegí una categoría."),
  isFeatured: z.boolean(),
  isActive: z.boolean(),
  variants: z.array(variantSchema).min(1, "Agregá al menos un talle.").max(30, "Podés cargar hasta 30 talles."),
  images: z.array(imageSchema).max(8, "Podés cargar hasta 8 imágenes."),
}).superRefine((data, context) => {
  const sizes = new Set<string>();
  data.variants.forEach((variant, index) => {
    const normalized = variant.size.toLocaleLowerCase("es");
    if (sizes.has(normalized)) context.addIssue({ code: "custom", path: ["variants", index, "size"], message: "No repitas el mismo talle." });
    sizes.add(normalized);
  });
  data.images.forEach((image, index) => {
    const isAbsoluteUrl = z.url().safeParse(image.url).success;
    if (!isAbsoluteUrl && !(image.publicId === null && isSafeLegacyImagePath(image.url))) {
      context.addIssue({ code: "custom", path: ["images", index, "url"], message: "La imagen debe tener una URL válida o ser una ruta local existente." });
    }
    if (image.publicId && !image.url.startsWith("https://res.cloudinary.com/")) {
      context.addIssue({ code: "custom", path: ["images", index, "url"], message: "Las imágenes cargadas deben provenir de Cloudinary." });
    }
  });
});

export type CostumeFormValues = z.infer<typeof costumeFormSchema>;

export function readCostumeFormData(formData: FormData) {
  let variants: unknown = [];
  let images: unknown = [];
  try { variants = JSON.parse(String(formData.get("variants") ?? "[]")); } catch { variants = null; }
  try { images = JSON.parse(String(formData.get("images") ?? "[]")); } catch { images = null; }

  return costumeFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    audience: formData.get("audience"),
    rentalPrice: formData.get("rentalPrice") ?? "",
    categoryId: formData.get("categoryId"),
    isFeatured: formData.get("isFeatured") === "on",
    isActive: formData.get("isActive") === "on",
    variants,
    images,
  });
}
