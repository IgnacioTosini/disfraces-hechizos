import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRentalAvailability, toRentalReservation, type RequestedRental } from "@/lib/rental-availability";

const reservingStatuses = ["CONFIRMED", "PICKED_UP", "RETURNED"] as const;

function parseDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const slug = params.get("slug")?.trim() ?? "";
  const size = params.get("size")?.trim() ?? "";
  const pickupDate = parseDate(params.get("pickupDate"));
  const returnDate = parseDate(params.get("returnDate"));
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !size || size.length > 24 || !pickupDate || !returnDate || returnDate < pickupDate) {
    return NextResponse.json({ available: false, message: "Elegí un talle y un rango de fechas válido." }, { status: 400 });
  }
  if (params.get("pickupDate")! < todayInArgentina()) return NextResponse.json({ available: false, message: "Elegí una fecha desde hoy en adelante." }, { status: 400 });

  try {
    const variant = await prisma.costumeVariant.findFirst({
      where: { size, isActive: true, costume: { slug, isActive: true, category: { isActive: true } } },
      select: {
        id: true,
        stockQuantity: true,
        rentalItems: {
          where: { rentalRequest: { status: { in: [...reservingStatuses] } } },
          select: { variantId: true, quantity: true, pickupDate: true, returnDate: true, isAvailableAgain: true, rentalRequestId: true, rentalRequest: { select: { status: true } } },
        },
      },
    });
    if (!variant) return NextResponse.json({ available: false, message: "Este talle todavía no está cargado en el catálogo del local." }, { status: 404 });
    const [availability] = checkRentalAvailability(
      new Map([[variant.id, variant.stockQuantity]]),
      [{ variantId: variant.id, quantity: 1, pickupDate, returnDate }],
      variant.rentalItems.map(toRentalReservation),
    );
    const availableUnits = availability.availableUnits;
    return NextResponse.json({ available: availableUnits > 0, availableUnits, message: availableUnits > 0 ? `${availableUnits} ${availableUnits === 1 ? "unidad disponible" : "unidades disponibles"} para esas fechas. La reserva queda pendiente hasta que el local confirme.` : "No hay unidades disponibles para todo ese período." });
  } catch (error) {
    console.error("[availability] No se pudo consultar disponibilidad", error);
    return NextResponse.json({ available: false, message: "No se pudo consultar ahora. Volvé a intentar en unos segundos." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { items?: unknown } | null;
  if (!body || !Array.isArray(body.items) || body.items.length === 0 || body.items.length > 30) {
    return NextResponse.json({ available: false, message: "El carrito no tiene una selección válida para consultar." }, { status: 400 });
  }

  const items = body.items.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const item = candidate as Record<string, unknown>;
    const pickupDate = parseDate(typeof item.pickupDate === "string" ? item.pickupDate : null);
    const returnDate = parseDate(typeof item.returnDate === "string" ? item.returnDate : null);
    if (typeof item.variantId !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(item.variantId)
      || typeof item.quantity !== "number" || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20
      || !pickupDate || !returnDate || returnDate < pickupDate) return null;
    return { variantId: item.variantId, quantity: item.quantity, pickupDate, returnDate, pickupLabel: item.pickupDate as string, returnLabel: item.returnDate as string };
  });
  if (items.some((item) => item === null)) return NextResponse.json({ available: false, message: "Revisá las fechas, talles y cantidades del carrito." }, { status: 400 });
  const validItems = items as NonNullable<(typeof items)[number]>[];
  if (validItems.some((item) => item.pickupLabel < todayInArgentina())) return NextResponse.json({ available: false, message: "Hay una fecha anterior a hoy. Actualizá las fechas del carrito." }, { status: 400 });

  try {
    const variants = await prisma.costumeVariant.findMany({
      where: { id: { in: [...new Set(validItems.map((item) => item.variantId))] }, isActive: true, costume: { isActive: true, category: { isActive: true } } },
      select: {
        id: true,
        stockQuantity: true,
        rentalItems: {
          where: { rentalRequest: { status: { in: [...reservingStatuses] } } },
          select: { variantId: true, quantity: true, pickupDate: true, returnDate: true, isAvailableAgain: true, rentalRequestId: true, rentalRequest: { select: { status: true } } },
        },
      },
    });
    const stockByVariant = new Map(variants.map((variant) => [variant.id, variant.stockQuantity]));
    const reservations = variants.flatMap((variant) => variant.rentalItems.map(toRentalReservation));
    const requestedItems: RequestedRental[] = validItems.map((item) => ({ variantId: item.variantId, quantity: item.quantity, pickupDate: item.pickupLabel, returnDate: item.returnLabel }));
    const availability = checkRentalAvailability(stockByVariant, requestedItems, reservations);
    const itemResults = availability.map((item) => ({ variantId: item.variantId, pickupDate: typeof item.pickupDate === "string" ? item.pickupDate : item.pickupDate.toISOString().slice(0, 10), returnDate: typeof item.returnDate === "string" ? item.returnDate : item.returnDate.toISOString().slice(0, 10), available: item.available, availableUnits: item.availableUnits }));
    const available = itemResults.every((item) => item.available);
    return NextResponse.json({ available, items: itemResults, message: available ? "Todos los talles están disponibles para las fechas elegidas. La reserva queda pendiente hasta la confirmación del local." : "Al menos un talle no tiene unidades suficientes para todo el período." });
  } catch (error) {
    console.error("[availability] No se pudo verificar el carrito", error);
    return NextResponse.json({ available: false, message: "No se pudo verificar la disponibilidad ahora. Volvé a intentar." }, { status: 500 });
  }
}
