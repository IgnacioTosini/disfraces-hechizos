import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Usá al menos 2 caracteres.").max(80, "El nombre admite hasta 80 caracteres."),
  slug: z.string().trim().min(2, "Completá el identificador de la URL.").max(90).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usá minúsculas, números y guiones; sin espacios ni acentos."),
  description: z.string().trim().max(500, "La descripción admite hasta 500 caracteres."),
  imageUrl: z.union([z.literal(""), z.string().trim().url("Ingresá una URL válida.")]),
  imagePublicId: z.string().trim().max(255, "El identificador de imagen no es válido."),
  sortOrder: z.coerce.number().int("Ingresá un número entero.").min(0, "El orden no puede ser negativo.").max(9999, "El orden máximo es 9999."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function readCategoryFormData(formData: FormData) {
  return categoryFormSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    imagePublicId: formData.get("imagePublicId") ?? "",
    sortOrder: formData.get("sortOrder"),
  });
}
