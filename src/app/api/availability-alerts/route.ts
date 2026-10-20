import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { checkRentalAvailability, toRentalReservation } from "@/lib/rental-availability";
import { availabilityAlertSchema } from "@/lib/validations/availability-alert";

function dateValue(value: string) { return new Date(`${value}T00:00:00.000Z`); }

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function POST(request: NextRequest) {
  const parsed = availabilityAlertSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, message: "Revisá tus datos y las fechas elegidas." }, { status: 400 });
  const data = parsed.data;
  if (data.fromDate < todayInArgentina()) return NextResponse.json({ success: false, message: "Elegí una fecha desde hoy en adelante." }, { status: 400 });
  try {
    const alert = await prisma.$transaction(async (tx) => {
      const variant = await tx.costumeVariant.findFirst({
        where: { id: data.variantId, isActive: true, costume: { isActive: true, category: { isActive: true } } },
        include: { rentalItems: { where: { rentalRequest: { status: { in: ["CONFIRMED", "PICKED_UP", "RETURNED"] } } }, select: { variantId: true, quantity: true, pickupDate: true, returnDate: true, isAvailableAgain: true, rentalRequestId: true, rentalRequest: { select: { status: true } } } } },
      });
      if (!variant) throw new Error("INVALID_VARIANT");
      const [result] = checkRentalAvailability(new Map([[variant.id, variant.stockQuantity]]), [{ variantId: variant.id, quantity: 1, pickupDate: data.fromDate, returnDate: data.throughDate }], variant.rentalItems.map(toRentalReservation));
      if (result.available) throw new Error("AVAILABLE");

      const phone = data.customerPhone.trim();
      const existing = await tx.customer.findFirst({ where: { phone } });
      const customer = existing
        ? await tx.customer.update({ where: { id: existing.id }, data: { name: data.customerName, email: data.customerEmail || null } })
        : await tx.customer.create({ data: { name: data.customerName, phone, email: data.customerEmail || null } });
      const id = `a${crypto.randomUUID().replaceAll("-", "")}`;
      await tx.$executeRaw`INSERT INTO "AvailabilityAlert" ("id", "fromDate", "throughDate", "customerId", "variantId", "createdAt", "updatedAt") VALUES (${id}, ${dateValue(data.fromDate)}, ${dateValue(data.throughDate)}, ${customer.id}, ${variant.id}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      return { id };
    });
    revalidatePath("/admin/solicitudes");
    revalidatePath("/admin/clientes");
    return NextResponse.json({ success: true, alertId: alert.id, message: "Listo. El local tiene tus datos y te contactará si se libera." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_VARIANT") return NextResponse.json({ success: false, message: "Ese talle ya no está disponible en el catálogo." }, { status: 409 });
    if (error instanceof Error && error.message === "AVAILABLE") return NextResponse.json({ success: false, message: "Ahora hay unidades disponibles. Consultá el alquiler normalmente." }, { status: 409 });
    console.error("[availability-alerts] No se pudo registrar el aviso", error);
    return NextResponse.json({ success: false, message: "No se pudo guardar el aviso. Volvé a intentar." }, { status: 500 });
  }
}
