"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { getCostumeFinderOptions } from "@/lib/costume-finder-settings";
import { getHomeHeroContent } from "@/lib/home-hero";
import { costumeFinderOptionsSchema, readCostumeFinderOptions } from "@/lib/validations/costume-finder";

export type FinderSettingsActionResult = { success: boolean; message: string; fieldErrors?: Record<string, string> };

export async function saveCostumeFinderOptions(formData: FormData): Promise<FinderSettingsActionResult> {
  if (!(await isAdminAuthenticated())) return { success: false, message: "Tu sesión venció. Volvé a ingresar." };
  const parsed = readCostumeFinderOptions(formData);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => { fieldErrors[String(issue.path[0] ?? "options")] ??= issue.message; });
    return { success: false, message: parsed.error.issues[0]?.message ?? "Revisá las opciones antes de guardar.", fieldErrors };
  }

  try {
    const currentOptions = await getCostumeFinderOptions();
    const nextIds = new Set(parsed.data.map((option) => option.id));
    const removedIds = currentOptions.filter((option) => !nextIds.has(option.id)).map((option) => option.id);
    if (removedIds.length) {
      const costumes = await prisma.costume.findMany({ where: { assistantTags: { hasSome: removedIds } }, select: { name: true }, take: 1 });
      if (costumes.length) return { success: false, message: "Quitá primero esta etiqueta de los disfraces que la usan." };
      const home = await getHomeHeroContent();
      if (home.sections.occasionAccess.some((card) => card.tags.some((tag) => removedIds.includes(tag)))) {
        return { success: false, message: "Quitá primero esta etiqueta de los accesos por ocasión que la usan." };
      }
    }

    const options = costumeFinderOptionsSchema.parse(parsed.data);
    await prisma.storeSettings.upsert({
      where: { id: "store" },
      create: { id: "store", costumeFinderOptions: options as Prisma.InputJsonValue },
      update: { costumeFinderOptions: options as Prisma.InputJsonValue },
    });
    revalidatePath("/admin/asistente");
    revalidatePath("/admin/disfraces");
    revalidatePath("/catalogo");
    revalidatePath("/");
    return { success: true, message: "Las opciones del asistente se actualizaron." };
  } catch (error) {
    console.error("[admin/asistente] No se pudieron guardar las opciones", error);
    return { success: false, message: "No se pudieron guardar los cambios. Intentá de nuevo." };
  }
}
