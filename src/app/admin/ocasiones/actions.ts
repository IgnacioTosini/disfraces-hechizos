"use server";

import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { getCostumeFinderOptions } from "@/lib/costume-finder-settings";
import { getHomeHeroContent } from "@/lib/home-hero";
import { prisma } from "@/lib/prisma";
import { occasionAccessSchema } from "@/lib/occasion-access";

export type OccasionAccessActionResult = { success: boolean; message: string; fieldErrors?: Record<string, string>; previousImagePublicIds?: string[] };

function isOccasionImagePublicId(publicId: string) {
  const root = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "demo-store").replace(/\/+$/, "");
  const prefix = `${root}/ocasiones/`;
  const filename = publicId.slice(prefix.length);
  return publicId.startsWith(prefix) && Boolean(filename) && !filename.includes("/") && !publicId.split("/").some((part) => part === "." || part === "..");
}

function isLegacyOccasionImagePublicId(publicId: string) {
  const root = (process.env.CLOUDINARY_UPLOAD_FOLDER ?? "demo-store").replace(/\/+$/, "");
  return publicId.startsWith(`${root}/ocasiones/`) && !publicId.split("/").some((part) => part === "." || part === "..");
}

function isSafeLocalImagePath(url: string) {
  return url.startsWith("/") && !url.startsWith("//") && !url.split("/").includes("..") && !url.includes("\\");
}

export async function saveOccasionAccess(formData: FormData): Promise<OccasionAccessActionResult> {
  if (!(await isAdminAuthenticated())) return { success: false, message: "Tu sesión venció. Volvé a ingresar." };

  let value: unknown;
  try {
    value = JSON.parse(String(formData.get("cards") ?? "null"));
  } catch {
    return { success: false, message: "No se pudieron leer las tarjetas. Revisá los datos e intentá de nuevo." };
  }
  const parsed = occasionAccessSchema.safeParse(value);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0] ?? "cards")] ??= issue.message;
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revisá las tarjetas antes de guardar.", fieldErrors };
  }

  try {
    const [currentContent, finderOptions] = await Promise.all([getHomeHeroContent(), getCostumeFinderOptions()]);
    const validTags = new Set(finderOptions.map(({ id }) => id));
    for (const card of parsed.data) {
      if (!card.tags.every((tag) => validTags.has(tag))) return { success: false, message: `Actualizá las etiquetas de “${card.title}”: alguna ya no está configurada en el asistente.` };
      const current = currentContent.sections.occasionAccess.find(({ id }) => id === card.id);
      if (card.imagePublicId) {
        const isCurrentLegacyImage = current?.imagePublicId === card.imagePublicId && isLegacyOccasionImagePublicId(card.imagePublicId);
        if (!card.imageUrl.startsWith("https://res.cloudinary.com/") || (!isOccasionImagePublicId(card.imagePublicId) && !isCurrentLegacyImage)) {
          return { success: false, message: `La imagen de “${card.title}” debe estar subida a la carpeta de ocasiones de Cloudinary.` };
        }
      } else if (!current || card.imageUrl !== current.imageUrl || !isSafeLocalImagePath(card.imageUrl)) {
        return { success: false, message: `Seleccioná una imagen para “${card.title}” y subila a Cloudinary.` };
      }
    }

    const previousImages = currentContent.sections.occasionAccess
      .map(({ imagePublicId }) => imagePublicId)
      .filter((publicId): publicId is string => Boolean(publicId) && !parsed.data.some((card) => card.imagePublicId === publicId));
    const json = JSON.stringify({ occasionAccess: parsed.data });
    await prisma.$executeRaw`
      INSERT INTO "HomeHero" ("id", "sections", "updatedAt")
      VALUES ('home', ${json}::jsonb, NOW())
      ON CONFLICT ("id") DO UPDATE SET
        "sections" = COALESCE("HomeHero"."sections", '{}'::jsonb) || EXCLUDED."sections",
        "updatedAt" = NOW()
    `;
    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/inicio");
    revalidatePath("/admin/ocasiones");
    return { success: true, message: "Los accesos por ocasión se actualizaron.", previousImagePublicIds: previousImages };
  } catch (error) {
    console.error("[admin/ocasiones] No se pudieron guardar los accesos", error);
    return { success: false, message: "No se pudieron guardar los cambios. Intentá de nuevo." };
  }
}
