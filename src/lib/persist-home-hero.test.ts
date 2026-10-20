import { describe, expect, it, vi } from "vitest";
import type { HomeHeroFormValues } from "./validations/home-hero";
import { upsertHomeHeroRow } from "./persist-home-hero";

describe("persistencia del contenido del inicio", () => {
  it("guarda sections con un upsert SQL parametrizado", async () => {
    const sections = { bannerText: "Texto actualizado del banner" };
    const content = {
      eyebrow: "Disfraces para cada ocasión",
      titleLineOne: "Hoy podés",
      titleLineTwo: "ser",
      titleHighlight: "quien quieras",
      description: "Encontrá el disfraz ideal para tu próxima fiesta.",
      primaryCtaLabel: "Explorar disfraces",
      secondaryCtaLabel: "Cómo funciona el alquiler",
      locationText: "Mar del Plata",
      imageUrl: "/images/hero.webp",
      imagePublicId: "",
      imageAlt: "Personas con disfraces",
      sections,
    } as unknown as HomeHeroFormValues;
    const executeRaw = vi.fn(async () => 1);

    await upsertHomeHeroRow({ $executeRaw: executeRaw } as never, content);

    const [queryParts, ...parameters] = executeRaw.mock.calls[0] as unknown as [TemplateStringsArray, ...unknown[]];
    const query = Array.from(queryParts).join("?");
    expect(query).toContain('INSERT INTO "HomeHero"');
    expect(query).toContain('"sections"');
    expect(query).toContain('ON CONFLICT ("id") DO UPDATE');
    expect(query).not.toContain(sections.bannerText);
    expect(parameters).toContain(JSON.stringify(sections));
  });
});
