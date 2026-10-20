import CostumeFinderSettingsManager from "@/components/admin/CostumeFinderSettingsManager";
import { prisma } from "@/lib/prisma";
import { defaultCostumeFinderOptions, getCostumeFinderOptions } from "@/lib/costume-finder-settings";

export const instant = false;

export default async function AdminCostumeFinderPage() {
  const options = await getCostumeFinderOptions();
  let usageByTag: Record<string, number> = {};

  try {
    const costumes = await prisma.costume.findMany({ select: { assistantTags: true } });
    usageByTag = Object.fromEntries(options.map(({ id }) => [id, costumes.filter((costume) => costume.assistantTags.includes(id)).length]));
  } catch (error) {
    console.error("[admin/asistente] No se pudo cargar el uso de las etiquetas", error);
    usageByTag = Object.fromEntries(options.map(({ id }) => [id, 0]));
  }

  const fallbackOptions = defaultCostumeFinderOptions.map((option) => ({ ...option, keywords: [...option.keywords] }));
  return <CostumeFinderSettingsManager initialOptions={options.length ? options : fallbackOptions} usageByTag={usageByTag} />;
}
