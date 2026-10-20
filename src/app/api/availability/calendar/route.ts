import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function todayInArgentina() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function plusDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim() ?? "";
  const size = request.nextUrl.searchParams.get("size")?.trim() ?? "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !size || size.length > 24) {
    return NextResponse.json({ message: "Elegí un disfraz y talle válido." }, { status: 400 });
  }

  const from = todayInArgentina();
  const through = plusDays(from, 365);
  try {
    const variant = await prisma.costumeVariant.findFirst({
      where: { size, isActive: true, costume: { slug, isActive: true, category: { isActive: true } } },
      select: { id: true, stockQuantity: true },
    });
    if (!variant) return NextResponse.json({ message: "No encontramos ese talle activo." }, { status: 404 });
    const rows = await prisma.$queryRaw<{ pickupDate: Date; returnDate: Date; quantity: number; status: string }[]>`
      SELECT ri."pickupDate", ri."returnDate", ri."quantity", rr."status"
      FROM "CostumeVariant" cv
      JOIN "Costume" c ON c."id" = cv."costumeId"
      JOIN "RentalItem" ri ON ri."variantId" = cv."id"
      JOIN "RentalRequest" rr ON rr."id" = ri."rentalRequestId"
      JOIN "Category" cat ON cat."id" = c."categoryId"
      WHERE cv."id" = ${variant.id} AND cv."isActive" = true AND c."isActive" = true AND cat."isActive" = true
        AND (
          (rr."status" IN ('CONFIRMED', 'PICKED_UP') AND ri."pickupDate" <= ${through} AND ri."returnDate" >= ${new Date(`${from}T00:00:00.000Z`)})
          OR (rr."status" = 'RETURNED' AND ri."isAvailableAgain" = false AND ri."returnDate" <= ${through})
        )
    `;
    const reservations = rows.map((row) => ({
      from: row.status === "RETURNED" ? (row.returnDate.toISOString().slice(0, 10) < from ? from : row.returnDate.toISOString().slice(0, 10)) : (row.pickupDate.toISOString().slice(0, 10) < from ? from : row.pickupDate.toISOString().slice(0, 10)),
      through: row.status === "RETURNED" ? through.toISOString().slice(0, 10) : row.returnDate.toISOString().slice(0, 10),
      quantity: row.quantity,
    }));
    return NextResponse.json({ from, through: through.toISOString().slice(0, 10), stockQuantity: variant.stockQuantity, reservations });
  } catch (error) {
    console.error("[availability/calendar] No se pudieron cargar las fechas ocupadas", error);
    return NextResponse.json({ message: "No se pudieron cargar las fechas. Volvé a intentar." }, { status: 500 });
  }
}
