import { z } from "zod";

const rentalLineSchema = z.object({
  variantId: z.string().min(8, "Elegí un talle válido."),
  quantity: z.number().int().min(1, "La cantidad mínima es 1.").max(20, "La cantidad máxima es 20."),
});

export const rentalRequestFormSchema = z.object({
  customerName: z.string().trim().min(2, "Ingresá el nombre del cliente.").max(100),
  customerPhone: z.string().trim().min(6, "Ingresá un teléfono válido.").max(30).regex(/^[+\d\s().-]+$/, "Usá números y símbolos de teléfono válidos."),
  customerEmail: z.union([z.literal(""), z.email("Ingresá un email válido.").max(254)]),
  pickupDate: z.iso.date("Elegí una fecha de retiro válida."),
  returnDate: z.iso.date("Elegí una fecha de devolución válida."),
  notes: z.string().trim().max(2000, "Las aclaraciones admiten hasta 2000 caracteres."),
  items: z.array(rentalLineSchema).min(1, "Agregá al menos un disfraz."),
}).refine((data) => data.returnDate >= data.pickupDate, { path: ["returnDate"], message: "La devolución debe ser el mismo día o después del retiro." })
  .superRefine((data, context) => {
    const seen = new Set<string>();
    for (const item of data.items) {
      if (seen.has(item.variantId)) {
        context.addIssue({ code: "custom", path: ["items"], message: "Cada talle debe aparecer una sola vez; ajustá la cantidad en esa línea." });
        return;
      }
      seen.add(item.variantId);
    }
  });

export function readRentalRequestFormData(formData: FormData) {
  let items: unknown = [];
  try { items = JSON.parse(String(formData.get("items") ?? "[]")); } catch { /* handled by zod */ }
  return rentalRequestFormSchema.safeParse({
    customerName: formData.get("customerName"),
    customerPhone: formData.get("customerPhone"),
    customerEmail: formData.get("customerEmail") ?? "",
    pickupDate: formData.get("pickupDate"),
    returnDate: formData.get("returnDate"),
    notes: formData.get("notes") ?? "",
    items,
  });
}
