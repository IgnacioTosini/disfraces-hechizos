import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresá al menos 2 caracteres.").max(100, "El nombre admite hasta 100 caracteres."),
  phone: z.string().trim().min(6, "Ingresá un teléfono válido.").max(30, "El teléfono admite hasta 30 caracteres.").regex(/^[+\d\s().-]+$/, "Usá números y símbolos de teléfono válidos."),
  email: z.union([z.literal(""), z.email("Ingresá un email válido.").max(254, "El email es demasiado largo.")]),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;

export function readCustomerFormData(formData: FormData) {
  return customerFormSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
  });
}
