import type { PrismaClient } from "@prisma/client";
import type { HomeHeroFormValues } from "@/lib/validations/home-hero";

type RawExecutor = Pick<PrismaClient, "$executeRaw">;

export async function upsertHomeHeroRow(executor: RawExecutor, content: HomeHeroFormValues) {
  const { imagePublicId, sections, ...values } = content;
  return executor.$executeRaw`
    INSERT INTO "HomeHero" (
      "id", "eyebrow", "titleLineOne", "titleLineTwo", "titleHighlight", "description",
      "primaryCtaLabel", "secondaryCtaLabel", "locationText", "imageUrl", "imagePublicId",
      "imageAlt", "sections", "updatedAt"
    ) VALUES (
      ${"home"}, ${values.eyebrow}, ${values.titleLineOne}, ${values.titleLineTwo}, ${values.titleHighlight},
      ${values.description}, ${values.primaryCtaLabel}, ${values.secondaryCtaLabel}, ${values.locationText},
      ${values.imageUrl}, ${imagePublicId || null}, ${values.imageAlt}, ${JSON.stringify(sections)}::jsonb, NOW()
    )
    ON CONFLICT ("id") DO UPDATE SET
      "eyebrow" = EXCLUDED."eyebrow",
      "titleLineOne" = EXCLUDED."titleLineOne",
      "titleLineTwo" = EXCLUDED."titleLineTwo",
      "titleHighlight" = EXCLUDED."titleHighlight",
      "description" = EXCLUDED."description",
      "primaryCtaLabel" = EXCLUDED."primaryCtaLabel",
      "secondaryCtaLabel" = EXCLUDED."secondaryCtaLabel",
      "locationText" = EXCLUDED."locationText",
      "imageUrl" = EXCLUDED."imageUrl",
      "imagePublicId" = EXCLUDED."imagePublicId",
      "imageAlt" = EXCLUDED."imageAlt",
      "sections" = EXCLUDED."sections",
      "updatedAt" = NOW()
  `;
}
