import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import RentalRequestManager, { type AdminRentalRequest, type RentalVariantOption } from "@/components/admin/RentalRequestManager";

export const instant = false;

export default async function AdminRentalRequestsPage() {
  let requests: AdminRentalRequest[] = [];
  let variants: RentalVariantOption[] = [];
  let loadError = false;
  try {
    const [rows, availableVariants] = await Promise.all([
      prisma.rentalRequest.findMany({
        orderBy: [{ createdAt: "desc" }],
        include: { customer: true, items: true },
      }),
      prisma.costumeVariant.findMany({
        where: { isActive: true, costume: { isActive: true } },
        orderBy: [{ costume: { name: "asc" } }, { size: "asc" }],
        include: { costume: { select: { id: true, name: true, rentalPrice: true } } },
      }),
    ]);
    const requestIds = rows.map((request) => request.id);
    const releaseStates = requestIds.length ? await prisma.$queryRaw<{ id: string; isAvailableAgain: boolean; pickupDate: Date; returnDate: Date }[]>`
      SELECT "id", "isAvailableAgain", "pickupDate", "returnDate" FROM "RentalItem" WHERE "rentalRequestId" IN (${Prisma.join(requestIds)})
    ` : [];
    const itemDataById = new Map(releaseStates.map((item) => [item.id, item]));
    requests = rows.map((request) => ({ ...request, items: request.items.map((item) => {
      const itemData = itemDataById.get(item.id);
      return { ...item, unitPrice: item.unitPrice?.toString() ?? null, pickupDate: itemData?.pickupDate ?? request.pickupDate, returnDate: itemData?.returnDate ?? request.returnDate, isAvailableAgain: itemData?.isAvailableAgain ?? false };
    }) }));
    variants = availableVariants.map((variant) => ({ id: variant.id, size: variant.size, costume: { ...variant.costume, rentalPrice: variant.costume.rentalPrice?.toString() ?? null }, rentalPrice: variant.costume.rentalPrice?.toString() ?? null }));
  } catch (error) {
    console.error("[admin/solicitudes] No se pudieron cargar los datos", error);
    loadError = true;
  }
  return <RentalRequestManager requests={requests} variants={variants} loadError={loadError} />;
}
