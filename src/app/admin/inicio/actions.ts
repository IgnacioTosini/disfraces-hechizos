"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { DEFAULT_HOME_HERO } from "@/lib/home-hero";
import { upsertHomeHeroRow } from "@/lib/persist-home-hero";
import { prisma } from "@/lib/prisma";
import { readHomeHeroFormData, type HomeHeroFormValues } from "@/lib/validations/home-hero";

export type HomeHeroActionResult = {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  previousImagePublicId?: string | null;
};

function validationErrors(issues: { path: PropertyKey[]; message: string }[]): HomeHeroActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    fieldErrors[field] ??= issue.message;
  }
  return { success: false, fieldErrors, message: issues[0]?.message ?? "Revisá los datos marcados antes de guardar." };
}

function isSafeLocalImagePath(url: string) {
  return url.startsWith("/") && !url.startsWith("//") && !url.split("/").includes("..") && !url.includes("\\");
}

function isHomeImagePublicId(publicId: string) {
  const root = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "demo-store").replace(/\/+$/, "");
  return publicId.startsWith(`${root}/home/`) && !publicId.split("/").some((part) => part === "." || part === "..");
}

function validateImageOwnership(values: HomeHeroFormValues, currentImageUrl: string) {
  if (values.imagePublicId) {
    if (!values.imageUrl.startsWith("https://res.cloudinary.com/") || !isHomeImagePublicId(values.imagePublicId)) {
      return "La imagen debe estar alojada en la carpeta del inicio de Cloudinary.";
    }
    return null;
  }

  if (values.imageUrl !== currentImageUrl || !isSafeLocalImagePath(values.imageUrl)) {
    return "Seleccioná una imagen nueva para subirla a Cloudinary.";
  }
  return null;
}

export async function saveHomeHeroContent(formData: FormData): Promise<HomeHeroActionResult> {
  if (!(await isAdminAuthenticated())) return { success: false, message: "Tu sesión venció. Volvé a ingresar." };

  const parsed = readHomeHeroFormData(formData);
  if (!parsed.success) return validationErrors(parsed.error.issues);

  try {
    const current = await prisma.homeHero.findUnique({ where: { id: "home" } });
    const currentImageUrl = current?.imageUrl ?? DEFAULT_HOME_HERO.imageUrl;
    const imageError = validateImageOwnership(parsed.data, currentImageUrl);
    if (imageError) return { success: false, message: imageError };

    // This parameterized upsert supports a dev server with an older Prisma model cached in memory.
    const imagePublicId = parsed.data.imagePublicId;
    await upsertHomeHeroRow(prisma, parsed.data);
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/inicio");

    return {
      success: true,
      message: "Los textos e imagen del Home se actualizaron.",
      previousImagePublicId: current?.imagePublicId && current.imagePublicId !== imagePublicId ? current.imagePublicId : null,
    };
  } catch (error) {
    console.error("[admin] No se pudo guardar el Hero del inicio", error);
    return { success: false, message: "No se pudo guardar el contenido. Intentá nuevamente." };
  }
}
