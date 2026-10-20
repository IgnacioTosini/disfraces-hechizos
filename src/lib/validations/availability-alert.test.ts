import { describe, expect, it } from "vitest";
import { availabilityAlertSchema } from "./availability-alert";

const validAlert = {
  variantId: "variant-123456",
  fromDate: "2026-11-10",
  throughDate: "2026-11-12",
  customerName: "  Martina López  ",
  customerPhone: "+54 9 223 555 1234",
  customerEmail: "",
};

describe("aviso de disponibilidad", () => {
  it("acepta el contacto y recorta el nombre", () => {
    const result = availabilityAlertSchema.safeParse(validAlert);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.customerName).toBe("Martina López");
  });

  it("rechaza un rango invertido", () => {
    expect(availabilityAlertSchema.safeParse({ ...validAlert, throughDate: "2026-11-09" }).success).toBe(false);
  });

  it("rechaza teléfono y email inválidos", () => {
    expect(availabilityAlertSchema.safeParse({ ...validAlert, customerPhone: "sin teléfono" }).success).toBe(false);
    expect(availabilityAlertSchema.safeParse({ ...validAlert, customerEmail: "no-es-email" }).success).toBe(false);
  });
});
