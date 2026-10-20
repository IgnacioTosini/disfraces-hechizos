import { describe, expect, it } from "vitest";
import { readCustomerFormData } from "./customer";

function customerForm(overrides: Record<string, string> = {}) {
  const data = new FormData();
  Object.entries({ name: "Ana Pérez", phone: "+54 9 223 555 1234", email: "", ...overrides })
    .forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("ABM de clientes", () => {
  it("acepta teléfono y email opcional vacío", () => {
    const result = readCustomerFormData(customerForm());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("");
  });

  it("rechaza teléfono y email inválidos", () => {
    const result = readCustomerFormData(customerForm({ phone: "teléfono", email: "no-es-email" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(({ path }) => path[0] === "phone")).toBe(true);
      expect(result.error.issues.some(({ path }) => path[0] === "email")).toBe(true);
    }
  });
});
