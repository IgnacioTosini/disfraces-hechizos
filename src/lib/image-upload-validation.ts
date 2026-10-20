export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: {
  type: string;
  size: number;
}): string | null {
  if (!IMAGE_MIME_TYPES.some((type) => type === file.type))
    return "Seleccioná una imagen JPG, PNG o WebP.";
  if (file.size === 0) return "La imagen está vacía.";
  if (file.size > MAX_IMAGE_BYTES)
    return "La imagen no puede superar los 10 MB.";
  return null;
}
