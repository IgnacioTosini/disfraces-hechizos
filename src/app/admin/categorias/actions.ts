"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { readCategoryFormData } from "@/lib/validations/category";

export type CategoryActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  imagePublicId?: string | null;
};

async function requireAdmin(): Promise<CategoryActionResult | null> {
  return (await isAdminAuthenticated()) ? null : { success: false, message: "Tu sesión venció. Volvé a ingresar." };
}

function validationErrors(issues: { path: PropertyKey[]; message: string }[]): CategoryActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return { success: false, fieldErrors, message: "Revisá los datos marcados." };
}

function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function refreshCategoryViews() {
  revalidatePath("/admin/categorias");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

function isCategoryImagePublicId(publicId: string) {
  const root = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "demo-store").replace(/\/+$/, "");
  return publicId.startsWith(`${root}/categorias/`) && !publicId.split("/").some((part) => part === "." || part === "..");
}

function validateCategoryImage(url: string, publicId: string, allowLegacy = false): CategoryActionResult | null {
  if (!url && !publicId) return null;
  if (url && !publicId && allowLegacy) return null;
  if (!url || !publicId) return { success: false, message: "La imagen no se guardó correctamente. Volvé a seleccionarla." };
  if (!url.startsWith("https://res.cloudinary.com/") || !isCategoryImagePublicId(publicId)) {
    return { success: false, message: "La imagen debe estar alojada en la carpeta de categorías de Cloudinary." };
  }
  return null;
}

export async function createCategory(formData: FormData): Promise<CategoryActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = readCategoryFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);
  const invalidImage = validateCategoryImage(parsed.data.imageUrl, parsed.data.imagePublicId);
  if (invalidImage) return invalidImage;

  try {
    await prisma.category.create({
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        imagePublicId: parsed.data.imagePublicId || null,
      },
    });
    refreshCategoryViews();
    return { success: true, message: "Categoría creada." };
  } catch (error) {
    if (isUniqueError(error)) return { success: false, fieldErrors: { slug: "Ese identificador ya está en uso." }, message: "Elegí otro identificador para la URL." };
    return { success: false, message: "No se pudo crear la categoría. Intentá de nuevo." };
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<CategoryActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) return { success: false, message: "La categoría indicada no es válida." };
  const parsed = readCategoryFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);
  const invalidImage = validateCategoryImage(parsed.data.imageUrl, parsed.data.imagePublicId, true);
  if (invalidImage) return invalidImage;

  try {
    await prisma.category.update({
      where: { id },
      data: {
        ...parsed.data,
        description: parsed.data.description || null,
        imageUrl: parsed.data.imageUrl || null,
        imagePublicId: parsed.data.imagePublicId || null,
      },
    });
    refreshCategoryViews();
    return { success: true, message: "Cambios guardados." };
  } catch (error) {
    if (isUniqueError(error)) return { success: false, fieldErrors: { slug: "Ese identificador ya está en uso." }, message: "Elegí otro identificador para la URL." };
    return { success: false, message: "No se pudo guardar. Puede que la categoría ya no exista." };
  }
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<CategoryActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id) || typeof isActive !== "boolean") return { success: false, message: "La solicitud no es válida." };
  try {
    await prisma.category.update({ where: { id }, data: { isActive } });
    refreshCategoryViews();
    return { success: true, message: isActive ? "Categoría activada." : "Categoría pausada." };
  } catch {
    return { success: false, message: "No se pudo actualizar el estado." };
  }
}

export async function deleteCategory(id: string): Promise<CategoryActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) return { success: false, message: "La categoría indicada no es válida." };
  try {
    const category = await prisma.category.findUnique({ where: { id }, select: { imagePublicId: true, _count: { select: { costumes: true } } } });
    if (!category) return { success: false, message: "La categoría ya no existe." };
    if (category._count.costumes > 0) return { success: false, message: "Esta categoría tiene disfraces asociados. Pausala o reasigná esos disfraces antes de eliminarla." };
    await prisma.category.delete({ where: { id } });
    refreshCategoryViews();
    return { success: true, message: "Categoría eliminada.", imagePublicId: category.imagePublicId };
  } catch {
    return { success: false, message: "No se pudo eliminar la categoría." };
  }
}
