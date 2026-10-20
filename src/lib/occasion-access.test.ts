import { describe, expect, it } from "vitest";
import { defaultOccasionAccess, occasionAccessSchema, readOccasionAccess } from "./occasion-access";

describe("accesos por ocasión", () => {
  it("acepta las cuatro tarjetas iniciales", () => {
    expect(occasionAccessSchema.safeParse(defaultOccasionAccess).success).toBe(true);
  });

  it("requiere al menos una etiqueta por tarjeta", () => {
    const cards = defaultOccasionAccess.map((card, index) => index === 0 ? { ...card, tags: [] } : card);
    expect(occasionAccessSchema.safeParse(cards).success).toBe(false);
  });

  it("usa los accesos iniciales cuando la configuración guardada no es válida", () => {
    expect(readOccasionAccess(null)).toHaveLength(4);
    expect(readOccasionAccess(null)[0].id).toBe("halloween");
  });
});
