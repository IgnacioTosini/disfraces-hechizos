"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { readCustomerFormData } from "@/lib/validations/customer";

export type CustomerActionResult = { success: boolean; message?: string; fieldErrors?: Record<string, string> };

async function requireAdmin(): Promise<CustomerActionResult | null> {
  return (await isAdminAuthenticated()) ? null : { success: false, message: "Tu sesión venció. Volvé a ingresar." };
}

function validationErrors(issues: { path: PropertyKey[]; message: string }[]): CustomerActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { success: false, fieldErrors, message: "Revisá los datos marcados." };
}

function validId(id: string) { return /^[a-zA-Z0-9_-]{8,128}$/.test(id); }

function refreshCustomerViews() {
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
}

export async function updateCustomer(id: string, formData: FormData): Promise<CustomerActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!validId(id)) return { success: false, message: "El cliente indicado no es válido." };
  const parsed = readCustomerFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);
  try {
    await prisma.customer.update({ where: { id }, data: { ...parsed.data, email: parsed.data.email || null } });
    refreshCustomerViews();
    return { success: true, message: "Datos del cliente actualizados." };
  } catch (error) {
    console.error("[admin/clientes] No se pudo actualizar el cliente", { id, error });
    return { success: false, message: "No se pudieron guardar los cambios." };
  }
}
