import { describe, expect, it } from "vitest";
import { buildRequestStatusWhatsAppUrl } from "./whatsapp-request-status";

describe("mensaje de estado por WhatsApp", () => {
  it("usa el teléfono del cliente y explica el estado y fechas de la solicitud", () => {
    const url = buildRequestStatusWhatsAppUrl({
      phone: "223 577-7798",
      customerName: "Ana Pérez",
      requestId: "request-abcdefgh",
      status: "CONFIRMED",
      items: [{ costumeName: "Astronauta", size: "L", pickupDate: "2026-11-10", returnDate: "2026-11-12" }],
    });
    const parsed = new URL(url);
    const message = parsed.searchParams.get("text") ?? "";

    expect(parsed.host).toBe("wa.me");
    expect(parsed.pathname).toBe("/5492235777798");
    expect(message).toContain("Ana Pérez");
    expect(message).toContain("Tu alquiler está confirmado.");
    expect(message).toContain("Astronauta · talle L");
    expect(message).toContain("10 de nov de 2026 al 12 de nov de 2026");
    expect(message).toContain("#cdefgh.\n\nTu alquiler está confirmado.");
    expect(message).toContain("Disfraces y fechas:\n• Astronauta · talle L · 10 de nov de 2026 al 12 de nov de 2026\n\nSi necesitás");
  });

  it("preserva teléfonos que ya tienen código internacional", () => {
    const url = buildRequestStatusWhatsAppUrl({ phone: "+54 9 223 555 1234", customerName: "Ana", requestId: "abc123456", status: "PENDING", items: [] });
    expect(new URL(url).pathname).toBe("/5492235551234");
  });
});
