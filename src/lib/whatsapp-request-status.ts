import { formatWhatsAppMessage } from "./whatsapp-message";

export type RequestStatusForWhatsApp = "PENDING" | "CONTACTED" | "CONFIRMED" | "PICKED_UP" | "RETURNED" | "CANCELLED";

type StatusMessageItem = { costumeName: string; size: string; pickupDate: Date | string; returnDate: Date | string };

const statusMessages: Record<RequestStatusForWhatsApp, string> = {
  PENDING: "Recibimos tu solicitud y estamos revisando la disponibilidad.",
  CONTACTED: "Ya nos comunicamos con vos para seguir tu solicitud.",
  CONFIRMED: "Tu alquiler está confirmado.",
  PICKED_UP: "El disfraz figura como retirado. ¡Que lo disfrutes!",
  RETURNED: "Registramos la devolución del disfraz.",
  CANCELLED: "La solicitud figura como cancelada.",
};

function normalizePhoneForWhatsApp(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");
  if (digits.startsWith("54")) return digits;
  return `549${digits.replace(/^0/, "")}`;
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function buildRequestStatusWhatsAppUrl({
  phone,
  customerName,
  requestId,
  status,
  items,
}: {
  phone: string;
  customerName: string;
  requestId: string;
  status: RequestStatusForWhatsApp;
  items: StatusMessageItem[];
}) {
  const itemLines = items.map((item) => `• ${item.costumeName} · talle ${item.size} · ${formatDate(item.pickupDate)} al ${formatDate(item.returnDate)}`);
  const message = formatWhatsAppMessage([
    `Hola ${customerName}, te escribimos de Disfraces Hechizos por tu solicitud #${requestId.slice(-6)}.`,
    statusMessages[status],
    itemLines.length ? ["Disfraces y fechas:", ...itemLines].join("\n") : "",
    "Si necesitás hacer algún cambio, respondé este mensaje.",
  ]);

  return `https://wa.me/${normalizePhoneForWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
}

