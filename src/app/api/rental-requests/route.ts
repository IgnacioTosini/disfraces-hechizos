import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRentalAvailability, toRentalReservation, type RequestedRental } from "@/lib/rental-availability";

const reservingStatuses = ["CONFIRMED", "PICKED_UP", "RETURNED"] as const;

const requestSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(6).max(30).regex(/^[+\d\s().-]+$/),
  customerEmail: z.union([z.literal(""), z.email().max(254)]).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
  items: z.array(z.object({
    variantId: z.string().regex(/^[a-zA-Z0-9_-]{8,128}$/),
    quantity: z.number().int().min(1).max(20),
    pickupDate: z.iso.date(),
    returnDate: z.iso.date(),
  }).refine((item) => item.returnDate >= item.pickupDate, { path: ["returnDate"], message: "La devolución debe ser el mismo día o después del retiro." })).min(1).max(30),
}).superRefine((data, context) => {
  const seen = new Set<string>();
  data.items.forEach((item, index) => {
    const key = `${item.variantId}|${item.pickupDate}|${item.returnDate}`;
    if (seen.has(key)) context.addIssue({ code: "custom", path: ["items", index], message: "Combiná las unidades repetidas en una sola línea." });
    seen.add(key);
  });
});

function dateValue(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: "Revisá los datos de contacto, talles y fechas." }, { status: 400 });
  }

  const data = parsed.data;
  if (data.items.some((item) => item.pickupDate < todayInArgentina())) {
    return NextResponse.json({ success: false, message: "Hay una fecha anterior a hoy." }, { status: 400 });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const variantIds = [...new Set(data.items.map((item) => item.variantId))];
      const variants = await tx.costumeVariant.findMany({
        where: { id: { in: variantIds }, isActive: true, costume: { isActive: true, category: { isActive: true } } },
        include: {
          costume: { select: { name: true, rentalPrice: true } },
          rentalItems: {
            where: { rentalRequest: { status: { in: [...reservingStatuses] } } },
            select: { variantId: true, quantity: true, pickupDate: true, returnDate: true, isAvailableAgain: true, rentalRequestId: true, rentalRequest: { select: { status: true } } },
          },
        },
      });
      if (variants.length !== variantIds.length) throw new Error("INVALID_VARIANTS");
      const stockByVariant = new Map(variants.map((variant) => [variant.id, variant.stockQuantity]));
      const reservations = variants.flatMap((variant) => variant.rentalItems.map(toRentalReservation));
      const requestedItems: RequestedRental[] = data.items.map((item) => ({ variantId: item.variantId, quantity: item.quantity, pickupDate: item.pickupDate, returnDate: item.returnDate }));
      if (checkRentalAvailability(stockByVariant, requestedItems, reservations).some((item) => !item.available)) throw new Error("UNAVAILABLE");

      const phone = data.customerPhone.trim();
      const existingCustomer = await tx.customer.findFirst({ where: { phone } });
      const customer = existingCustomer
        ? await tx.customer.update({ where: { id: existingCustomer.id }, data: { name: data.customerName, email: data.customerEmail || null } })
        : await tx.customer.create({ data: { name: data.customerName, phone, email: data.customerEmail || null } });

      const pickupDate = dateValue(data.items.map(({ pickupDate }) => pickupDate).sort()[0]);
      const returnDate = dateValue(data.items.map(({ returnDate }) => returnDate).sort().at(-1)!);
      const variantsById = new Map(variants.map((variant) => [variant.id, variant]));
      const rentalRequest = await tx.rentalRequest.create({
        data: {
          pickupDate,
          returnDate,
          notes: data.notes || null,
          customerId: customer.id,
        },
        select: { id: true },
      });
      for (const item of data.items) {
        const variant = variantsById.get(item.variantId)!;
        await tx.$executeRaw`INSERT INTO "RentalItem" ("id", "costumeName", "size", "quantity", "unitPrice", "isAvailableAgain", "rentalRequestId", "variantId", "pickupDate", "returnDate") VALUES (${`c${crypto.randomUUID().replaceAll("-", "")}`}, ${variant.costume.name}, ${variant.size}, ${item.quantity}, ${variant.costume.rentalPrice}, false, ${rentalRequest.id}, ${variant.id}, ${dateValue(item.pickupDate)}, ${dateValue(item.returnDate)})`;
      }
      return rentalRequest;
    });

    revalidatePath("/admin/solicitudes");
    revalidatePath("/admin/clientes");
    revalidatePath("/admin");
    return NextResponse.json({ success: true, requestId: created.id, message: "Solicitud registrada. El local confirmará disponibilidad y condiciones." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_VARIANTS") {
      return NextResponse.json({ success: false, message: "Uno de los talles ya no está disponible en el catálogo. Actualizá e intentá de nuevo." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "UNAVAILABLE") {
      return NextResponse.json({ success: false, message: "La disponibilidad cambió y no hay unidades suficientes para todas las fechas seleccionadas. Revisá el carrito." }, { status: 409 });
    }
    console.error("[rental-requests] No se pudo registrar la consulta", error);
    return NextResponse.json({ success: false, message: "No se pudo registrar la consulta. Volvé a intentar." }, { status: 500 });
  }
}
