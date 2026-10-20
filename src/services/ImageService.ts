import {
  type ImageUploadFolder,
  isImageUploadFolder,
} from "@/lib/image-upload-folders";
import { validateImageFile } from "@/lib/image-upload-validation";

export type UploadedImage = { url: string; public_id: string };
export type CloudinaryUploadResponse =
  ({ success: true } & UploadedImage) | { success: false; error: string };
type DeleteResponse = { success: true } | { success: false; error: string };

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export class ImageService {
  static async optimizeImage(file: File): Promise<File> {
    const error = validateImageFile(file);
    if (error) throw new Error(error);
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const ratio = Math.min(
        1,
        1920 / image.naturalWidth,
        1920 / image.naturalHeight,
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("No se pudo procesar la imagen.");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (result) =>
            result
              ? resolve(result)
              : reject(new Error("No se pudo convertir la imagen.")),
          "image/webp",
          0.85,
        ),
      );
      if (blob.size >= file.size) return file;
      const extension = blob.type === "image/webp" ? "webp" : "png";
      return new File(
        [blob],
        `${file.name.replace(/\.[^.]+$/, "")}.${extension}`,
        { type: blob.type },
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  static async uploadImage(
    file: File,
    { folder }: { folder: ImageUploadFolder },
  ): Promise<CloudinaryUploadResponse> {
    try {
      if (!isImageUploadFolder(folder))
        throw new Error("La carpeta de imágenes no es válida.");
      const form = new FormData();
      form.append("file", await this.optimizeImage(file));
      form.append("folder", folder);
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(60000),
      });
      const data = (await response.json()) as CloudinaryUploadResponse;
      if (!response.ok && data.success) throw new Error("No se pudo subir la imagen.");
      if (!data.success)
        return {
          success: false,
          error: data.error || "No se pudo subir la imagen.",
        };
      if (
        typeof data.url !== "string" ||
        !data.url.startsWith("https://res.cloudinary.com/") ||
        typeof data.public_id !== "string" ||
        !data.public_id
      )
        throw new Error("El servidor devolvió una imagen inválida.");
      return data;
    } catch (error) {
      return {
        success: false,
        error: errorMessage(error, "No se pudo subir la imagen."),
      };
    }
  }

  static async deleteImage(publicId: string): Promise<DeleteResponse> {
    try {
      if (!publicId.trim())
        throw new Error("Falta el identificador de la imagen.");
      const response = await fetch(
        `/api/delete-image?publicId=${encodeURIComponent(publicId)}`,
        { method: "DELETE", signal: AbortSignal.timeout(30000) },
      );
      const data = (await response.json()) as DeleteResponse;
      return data.success
        ? { success: true }
        : {
            success: false,
            error: data.error || "No se pudo eliminar la imagen.",
          };
    } catch (error) {
      return {
        success: false,
        error: errorMessage(error, "No se pudo eliminar la imagen."),
      };
    }
  }
}
