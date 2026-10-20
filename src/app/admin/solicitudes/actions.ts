"use server";

import { Prisma, RentalStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { readRentalRequestFormData } from "@/lib/validations/rental-request";
import { checkRentalAvailability, toRentalReservation, type RequestedRental } from "@/lib/rental-availability";

const reservingStatuses = [RentalStatus.CONFIRMED, RentalStatus.PICKED_UP, RentalStatus.RETURNED] as const;

export type RentalRequestActionResult = { success: boolean; message?: string; fieldErrors?: Record<string, string> };

async function requireAdmin(): Promise<RentalRequestActionResult | null> {
  return (await isAdminAuthenticated()) ? null : { success: false, message: "Tu sesión venció. Volvé a ingresar." };
}

function issueResult(issues: { path: PropertyKey[]; message: string }[]): RentalRequestActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { success: false, message: "Revisá los datos marcados.", fieldErrors };
}

function refresh() {
  revalidatePath("/admin/solicitudes");
  revalidatePath("/admin/clientes");
  revalidatePath("/admin");
}

export async function createRentalRequest(formData: FormData): Promise<RentalRequestActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = readRentalRequestFormData(formData);
  if (!parsed.success) return issueResult(parsed.error.issues);
  try {
    await prisma.$transaction(async (tx) => {
      const requestedIds = parsed.data.items.map(({ variantId }) => variantId);
      const variants = await tx.costumeVariant.findMany({
        where: { id: { in: requestedIds }, isActive: true, costume: { isActive: true } },
        include: { costume: { select: { name: true, rentalPrice: true } } },
      });
      if (variants.length !== requestedIds.length) throw new Error("INVALID_VARIANTS");
      const byId = new Map(variants.map((variant) => [variant.id, variant]));

      const phone = parsed.data.customerPhone.trim();
      const existingCustomer = await tx.customer.findFirst({ where: { phone } });
      const customer = existingCustomer
        ? await tx.customer.update({ where: { id: existingCustomer.id }, data: { name: parsed.data.customerName, email: parsed.data.customerEmail || null } })
        : await tx.customer.create({ data: { name: parsed.data.customerName, phone, email: parsed.data.customerEmail || null } });

      const request = await tx.rentalRequest.create({
        data: {
          pickupDate: new Date(`${parsed.data.pickupDate}T00:00:00.000Z`),
          returnDate: new Date(`${parsed.data.returnDate}T00:00:00.000Z`),
          notes: parsed.data.notes || null,
          customerId: customer.id,
        },
        select: { id: true },
      });
      for (const item of parsed.data.items) {
        const variant = byId.get(item.variantId)!;
        await tx.$executeRaw`INSERT INTO "RentalItem" ("id", "costumeName", "size", "quantity", "unitPrice", "isAvailableAgain", "rentalRequestId", "variantId", "pickupDate", "returnDate") VALUES (${`c${crypto.randomUUID().replaceAll("-", "")}`}, ${variant.costume.name}, ${variant.size}, ${item.quantity}, ${variant.costume.rentalPrice}, false, ${request.id}, ${variant.id}, ${new Date(`${parsed.data.pickupDate}T00:00:00.000Z`)}, ${new Date(`${parsed.data.returnDate}T00:00:00.000Z`)})`;
      }
    });
    refresh();
    return { success: true, message: "Solicitud registrada y cliente guardado en la agenda." };
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_VARIANTS") return { success: false, message: "Uno de los talles ya no está disponible. Actualizá la página y volvé a intentarlo." };
    console.error("[admin/solicitudes] No se pudo registrar la solicitud", error);
    return { success: false, message: "No se pudo registrar la solicitud. Revisá la conexión e intentá de nuevo." };
  }
}

export async function updateRentalRequestStatus(id: string, status: string): Promise<RentalRequestActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id) || !Object.values(RentalStatus).includes(status as RentalStatus)) return { success: false, message: "La actualización no es válida." };
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.rentalRequest.findUnique({ where: { id }, select: { status: true } });
      if (!current) return { success: false, message: "La solicitud ya no existe." };
      if (current.status === RentalStatus.RETURNED && status !== RentalStatus.RETURNED) {
        const uncheckedItems = await tx.$queryRaw<{ count: number }[]>`SELECT COUNT(*)::int AS "count" FROM "RentalItem" WHERE "rentalRequestId" = ${id} AND "isAvailableAgain" = false`;
        if ((uncheckedItems[0]?.count ?? 0) > 0) return { success: false, message: "Confirmá primero la revisión de los disfraces devueltos." };
      }

      const reservesStock = status === RentalStatus.CONFIRMED || status === RentalStatus.PICKED_UP;
      const alreadyReservesStock = current.status === RentalStatus.CONFIRMED || current.status === RentalStatus.PICKED_UP;
      if (reservesStock && !alreadyReservesStock) {
        const rentalLines = await tx.rentalItem.findMany({ where: { rentalRequestId: id }, select: { id: true, variantId: true, quantity: true, pickupDate: true, returnDate: true } });
        if (!rentalLines.length || rentalLines.some((item) => !item.variantId)) {
          return { success: false, message: "No se puede confirmar: falta vincular un talle del inventario a esta solicitud." };
        }
        const variantIds = [...new Set(rentalLines.map((item) => item.variantId!))];
        const lockedVariants = await tx.$queryRaw<{ id: string }[]>`
          SELECT "id" FROM "CostumeVariant" WHERE "id" IN (${Prisma.join(variantIds)}) ORDER BY "id" FOR UPDATE
        `;
        if (lockedVariants.length !== variantIds.length) {
          return { success: false, message: "No se puede confirmar: uno de los talles ya no está activo en el inventario." };
        }
        const variants = await tx.costumeVariant.findMany({
          where: { id: { in: variantIds }, isActive: true },
          select: {
            id: true,
            stockQuantity: true,
            rentalItems: {
              where: { rentalRequest: { status: { in: [...reservingStatuses] } } },
              select: { variantId: true, quantity: true, pickupDate: true, returnDate: true, isAvailableAgain: true, rentalRequestId: true, rentalRequest: { select: { status: true } } },
            },
          },
        });
        if (variants.length !== variantIds.length) {
          return { success: false, message: "No se puede confirmar: uno de los talles ya no está activo en el inventario." };
        }
        const requestedItems: RequestedRental[] = rentalLines.map((item) => ({ variantId: item.variantId!, quantity: item.quantity, pickupDate: item.pickupDate, returnDate: item.returnDate }));
        const stockByVariant = new Map(variants.map((variant) => [variant.id, variant.stockQuantity]));
        const reservations = variants.flatMap((variant) => variant.rentalItems.map(toRentalReservation));
        if (checkRentalAvailability(stockByVariant, requestedItems, reservations, id).some((item) => !item.available)) {
          return { success: false, message: "No hay unidades suficientes de uno o más talles para esas fechas. Revisá las solicitudes confirmadas antes de continuar." };
        }
      }
      await tx.rentalRequest.update({ where: { id }, data: { status: status as RentalStatus } });
      return { success: true, message: "Estado de la solicitud actualizado." };
    });
    if (!result.success) return result;
    refresh();
    return result;
  } catch (error) {
    console.error("[admin/solicitudes] No se pudo actualizar el estado", { id, error });
    return { success: false, message: "No se pudo actualizar la solicitud." };
  }
}

export async function markRentalItemsAvailableAgain(id: string): Promise<RentalRequestActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) return { success: false, message: "La solicitud indicada no es válida." };
  try {
    const request = await prisma.rentalRequest.findUnique({ where: { id }, select: { status: true } });
    if (!request) return { success: false, message: "La solicitud ya no existe." };
    if (request.status !== RentalStatus.RETURNED) return { success: false, message: "Marcá la solicitud como devuelta antes de confirmar la revisión." };
    await prisma.$executeRaw`UPDATE "RentalItem" SET "isAvailableAgain" = true WHERE "rentalRequestId" = ${id}`;
    refresh();
    return { success: true, message: "Revisión confirmada. Los disfraces vuelven a contar como disponibles." };
  } catch (error) {
    console.error("[admin/solicitudes] No se pudo confirmar la revisión", { id, error });
    return { success: false, message: "No se pudo confirmar la revisión." };
  }
}
