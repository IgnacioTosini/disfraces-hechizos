import { describe, expect, it } from "vitest";
import { readCategoryFormData } from "./category";

function categoryForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ name: "Fantasía", slug: "fantasia", description: "Disfraces fantásticos", imageUrl: "", imagePublicId: "", sortOrder: "0", ...overrides })
    .forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("ABM de categorías", () => {
  it("acepta una categoría sin imagen y convierte el orden a número", () => {
    const result = readCategoryFormData(categoryForm());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.sortOrder).toBe(0);
  });

  it("rechaza slug inválido e imagen con URL incorrecta", () => {
    const result = readCategoryFormData(categoryForm({ slug: "Fantasía y terror", imageUrl: "no-es-url" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(({ path }) => path[0] === "slug")).toBe(true);
      expect(result.error.issues.some(({ path }) => path[0] === "imageUrl")).toBe(true);
    }
  });
});
