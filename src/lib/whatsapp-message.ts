/** Arma párrafos para WhatsApp, descartando bloques opcionales vacíos. */
export function formatWhatsAppMessage(paragraphs: Array<string | null | undefined>) {
  return paragraphs.map((paragraph) => paragraph?.trim()).filter((paragraph): paragraph is string => Boolean(paragraph)).join("\n\n");
}
