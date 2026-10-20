import { describe, expect, it } from "vitest";
import { isImageUploadFolder } from "./image-upload-folders";

describe("carpetas de subida", () => {
  it("acepta las carpetas de imágenes del sitio", () => {
    expect(isImageUploadFolder("ocasiones")).toBe(true);
    expect(isImageUploadFolder("contenido-inicio")).toBe(true);
  });

  it("rechaza carpetas no configuradas", () => {
    expect(isImageUploadFolder("ocasiones/halloween")).toBe(false);
    expect(isImageUploadFolder("home")).toBe(false);
    expect(isImageUploadFolder("../productos")).toBe(false);
  });
});
