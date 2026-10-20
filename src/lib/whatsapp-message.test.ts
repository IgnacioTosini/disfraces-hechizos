import { describe, expect, it } from "vitest";
import { formatWhatsAppMessage } from "./whatsapp-message";

describe("formato de mensajes de WhatsApp", () => {
  it("separa párrafos con una línea en blanco", () => {
    expect(formatWhatsAppMessage(["Hola.", "Datos:\nNombre: Ana", "Disfraz: Bruja"])).toBe("Hola.\n\nDatos:\nNombre: Ana\n\nDisfraz: Bruja");
  });

  it("omite párrafos opcionales vacíos sin perder la separación", () => {
    expect(formatWhatsAppMessage(["Hola.", "", undefined, "Consulta."])).toBe("Hola.\n\nConsulta.");
  });
});
