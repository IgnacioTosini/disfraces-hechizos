"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { readCostumeFormData, type CostumeFormValues } from "@/lib/validations/costume";

export type CostumeActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  deletedImagePublicIds?: string[];
};

async function requireAdmin(): Promise<CostumeActionResult | null> {
  return (await isAdminAuthenticated()) ? null : { success: false, message: "Tu sesión venció. Volvé a ingresar." };
}

function validationErrors(issues: { path: PropertyKey[]; message: string }[]): CostumeActionResult {
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

function isValidId(id: string) {
  return /^[a-zA-Z0-9_-]{8,128}$/.test(id);
}

function isProductImagePublicId(publicId: string) {
  const root = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "demo-store").replace(/\/+$/, "");
  return publicId.startsWith(`${root}/productos/`) && !publicId.split("/").some((part) => part === "." || part === "..");
}

function validateImageOwnership(values: CostumeFormValues, legacyImages: { url: string; publicId: string | null }[] = []) {
  for (const image of values.images) {
    if (image.publicId && !isProductImagePublicId(image.publicId)) return "Una imagen no pertenece a la carpeta de productos de Cloudinary.";
    if (!image.publicId && !legacyImages.some((legacy) => legacy.url === image.url)) return "Volvé a seleccionar las imágenes nuevas para subirlas a Cloudinary.";
  }
  return null;
}

function refreshCostumeViews() {
  revalidatePath("/admin/disfraces");
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/catalogo");
}

function toVariantData(variant: CostumeFormValues["variants"][number]) {
  return { size: variant.size, stockQuantity: variant.stockQuantity, isActive: variant.isActive };
}

function toImageData(image: CostumeFormValues["images"][number], index: number) {
  return { url: image.url, publicId: image.publicId, altText: image.altText || null, sortOrder: index };
}

export async function createCostume(formData: FormData): Promise<CostumeActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = readCostumeFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);
  const imageError = validateImageOwnership(parsed.data);
  if (imageError) return { success: false, message: imageError };

  try {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { isActive: true } });
    if (!category?.isActive) return { success: false, fieldErrors: { categoryId: "Elegí una categoría activa." }, message: "La categoría seleccionada no está disponible." };

    await prisma.costume.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        audience: parsed.data.audience,
        rentalPrice: parsed.data.rentalPrice === null ? null : new Prisma.Decimal(parsed.data.rentalPrice),
        isFeatured: parsed.data.isFeatured,
        isActive: parsed.data.isActive,
        categoryId: parsed.data.categoryId,
        variants: { create: parsed.data.variants.map(toVariantData) },
        images: { create: parsed.data.images.map(toImageData) },
      },
    });
    refreshCostumeViews();
    return { success: true, message: "Disfraz creado." };
  } catch (error) {
    if (isUniqueError(error)) return { success: false, fieldErrors: { slug: "Ese identificador ya está en uso." }, message: "Elegí otro identificador para la URL." };
    return { success: false, message: "No se pudo crear el disfraz. Intentá de nuevo." };
  }
}

export async function updateCostume(id: string, formData: FormData): Promise<CostumeActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!isValidId(id)) return { success: false, message: "El disfraz indicado no es válido." };
  const parsed = readCostumeFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);

  try {
    const current = await prisma.costume.findUnique({
      where: { id },
      include: { images: true, variants: { include: { _count: { select: { rentalItems: true } } } } },
    });
    if (!current) return { success: false, message: "El disfraz ya no existe." };
    const imageError = validateImageOwnership(parsed.data, current.images);
    if (imageError) return { success: false, message: imageError };

    const currentVariantIds = new Set(current.variants.map(({ id: variantId }) => variantId));
    if (parsed.data.variants.some((variant) => variant.id && !currentVariantIds.has(variant.id))) {
      return { success: false, message: "Uno de los talles no pertenece a este disfraz. Actualizá la página e intentá de nuevo." };
    }
    const requestedVariantIds = new Set(parsed.data.variants.flatMap((variant) => variant.id ? [variant.id] : []));
    const removedVariants = current.variants.filter((variant) => !requestedVariantIds.has(variant.id));
    if (removedVariants.some((variant) => variant._count.rentalItems > 0)) {
      return { success: false, message: "Hay talles vinculados a solicitudes anteriores. Pausalos y dejá el stock en cero para conservar el historial." };
    }

    const selectedCategory = await prisma.category.findUnique({ where: { id: parsed.data.categoryId }, select: { isActive: true } });
    if (!selectedCategory || (!selectedCategory.isActive && current.categoryId !== parsed.data.categoryId)) {
      return { success: false, fieldErrors: { categoryId: "Elegí una categoría activa." }, message: "La categoría seleccionada no está disponible." };
    }

    const retainedPublicIds = new Set(parsed.data.images.flatMap((image) => image.publicId ? [image.publicId] : []));
    const deletedImagePublicIds = current.images.flatMap((image) => image.publicId && !retainedPublicIds.has(image.publicId) ? [image.publicId] : []);

    await prisma.$transaction(async (transaction) => {
      await transaction.costume.update({
        where: { id },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          description: parsed.data.description || null,
          audience: parsed.data.audience,
          rentalPrice: parsed.data.rentalPrice === null ? null : new Prisma.Decimal(parsed.data.rentalPrice),
          isFeatured: parsed.data.isFeatured,
          isActive: parsed.data.isActive,
          categoryId: parsed.data.categoryId,
        },
      });

      for (const variant of removedVariants) await transaction.costumeVariant.delete({ where: { id: variant.id } });
      for (const variant of parsed.data.variants) {
        if (variant.id) {
          await transaction.costumeVariant.update({ where: { id: variant.id }, data: toVariantData(variant) });
        } else {
          await transaction.costumeVariant.create({ data: { ...toVariantData(variant), costumeId: id } });
        }
      }

      await transaction.costumeImage.deleteMany({ where: { costumeId: id } });
      if (parsed.data.images.length) {
        await transaction.costumeImage.createMany({ data: parsed.data.images.map((image, index) => ({ ...toImageData(image, index), costumeId: id })) });
      }
    });
    refreshCostumeViews();
    return { success: true, message: "Cambios guardados.", deletedImagePublicIds };
  } catch (error) {
    if (isUniqueError(error)) return { success: false, fieldErrors: { slug: "Ese identificador ya está en uso." }, message: "Elegí otro identificador para la URL." };
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { success: false, message: "Ya existe un talle con ese nombre para este disfraz." };
    return { success: false, message: "No se pudieron guardar los cambios. Revisá los talles e intentá de nuevo." };
  }
}

export async function setCostumeActive(id: string, isActive: boolean): Promise<CostumeActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!isValidId(id) || typeof isActive !== "boolean") return { success: false, message: "La solicitud no es válida." };
  try {
    await prisma.costume.update({ where: { id }, data: { isActive } });
    refreshCostumeViews();
    return { success: true, message: isActive ? "Disfraz activado." : "Disfraz pausado." };
  } catch {
    return { success: false, message: "No se pudo actualizar el estado." };
  }
}

export async function deleteCostume(id: string): Promise<CostumeActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!isValidId(id)) return { success: false, message: "El disfraz indicado no es válido." };
  try {
    const costume = await prisma.costume.findUnique({
      where: { id },
      select: { images: { select: { publicId: true } }, variants: { select: { _count: { select: { rentalItems: true } } } } },
    });
    if (!costume) return { success: false, message: "El disfraz ya no existe." };
    if (costume.variants.some((variant) => variant._count.rentalItems > 0)) {
      return { success: false, message: "Este disfraz tiene talles vinculados a solicitudes. Pausalo para conservar el historial." };
    }
    await prisma.costume.delete({ where: { id } });
    refreshCostumeViews();
    return { success: true, message: "Disfraz eliminado.", deletedImagePublicIds: costume.images.flatMap((image) => image.publicId ? [image.publicId] : []) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        console.error("[admin/disfraces] FK bloqueó la eliminación", { id, meta: error.meta });
        return { success: false, message: "No se puede eliminar porque hay datos vinculados a este disfraz. Revisá sus solicitudes y talles asociados." };
      }
      if (error.code === "P2025") return { success: false, message: "El disfraz ya no existe o fue eliminado desde otra sesión. Actualizá la página." };
      console.error("[admin/disfraces] Error de Prisma al eliminar", { id, code: error.code });
    } else {
      console.error("[admin/disfraces] Error inesperado al eliminar", { id, error });
    }
    return { success: false, message: "No se pudo eliminar el disfraz por un error de la base de datos. Revisá la consola del servidor para ver el detalle." };
  }
}
