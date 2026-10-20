import { describe, expect, it } from "vitest";
import { readCostumeFormData } from "./costume";

function costumeForm(variants = [{ size: "M", stockQuantity: 2, isActive: true }], images: unknown[] = []) {
  const data = new FormData();
  data.set("name", "Astronauta");
  data.set("slug", "astronauta");
  data.set("description", "Traje espacial");
  data.set("audience", "ADULT");
  data.set("rentalPrice", "18000");
  data.set("categoryId", "category-123");
  data.set("isFeatured", "on");
  data.set("isActive", "on");
  data.set("variants", JSON.stringify(variants));
  data.set("images", JSON.stringify(images));
  return data;
}

describe("ABM de disfraces", () => {
  it("acepta un disfraz con talle y normaliza precio e imágenes vacías", () => {
    const result = readCostumeFormData(costumeForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rentalPrice).toBe(18000);
      expect(result.data.variants[0].stockQuantity).toBe(2);
      expect(result.data.images).toEqual([]);
    }
  });

  it("acepta imágenes Cloudinary y rutas locales heredadas", () => {
    const result = readCostumeFormData(costumeForm(undefined, [
      { url: "https://res.cloudinary.com/demo/image/upload/traje.webp", publicId: "demo/productos/traje", altText: "Astronauta", sortOrder: 0 },
      { url: "/images/traje-antiguo.webp", publicId: null, altText: "Foto anterior", sortOrder: 1 },
    ]));
    expect(result.success).toBe(true);
  });

  it("rechaza talles repetidos y una URL de imagen inválida", () => {
    const result = readCostumeFormData(costumeForm(
      [{ size: "M", stockQuantity: 2, isActive: true }, { size: "m", stockQuantity: 1, isActive: true }],
      [{ url: "ruta relativa sin barra", publicId: null, altText: "Traje", sortOrder: 0 }],
    ));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(({ path }) => path.join(".") === "variants.1.size")).toBe(true);
      expect(result.error.issues.some(({ path }) => path.join(".") === "images.0.url")).toBe(true);
    }
  });

  it("rechaza JSON roto de variantes e imágenes", () => {
    const data = costumeForm();
    data.set("variants", "[");
    data.set("images", "[");
    expect(readCostumeFormData(data).success).toBe(false);
  });
});
