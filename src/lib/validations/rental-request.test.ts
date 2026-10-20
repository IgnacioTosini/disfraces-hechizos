import { describe, expect, it } from "vitest";
import { readRentalRequestFormData } from "./rental-request";

function rentalForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({
    customerName: "Ana Pérez",
    customerPhone: "+54 9 223 555 1234",
    customerEmail: "",
    pickupDate: "2026-11-10",
    returnDate: "2026-11-12",
    notes: "",
    items: JSON.stringify([{ variantId: "variant-123", quantity: 1 }]),
    ...overrides,
  }).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("ABM de solicitudes", () => {
  it("acepta fechas válidas y convierte las líneas del pedido", () => {
    const result = readRentalRequestFormData(rentalForm());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.items[0].quantity).toBe(1);
  });

  it("rechaza devolución anterior al retiro", () => {
    const result = readRentalRequestFormData(rentalForm({ returnDate: "2026-11-09" }));
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some(({ path }) => path[0] === "returnDate")).toBe(true);
  });

  it("rechaza talles duplicados o JSON inválido", () => {
    const duplicate = readRentalRequestFormData(rentalForm({ items: JSON.stringify([
      { variantId: "variant-123", quantity: 1 }, { variantId: "variant-123", quantity: 2 },
    ]) }));
    expect(duplicate.success).toBe(false);

    const invalidJson = readRentalRequestFormData(rentalForm({ items: "[" }));
    expect(invalidJson.success).toBe(false);
  });
});
