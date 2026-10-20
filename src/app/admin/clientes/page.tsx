import { prisma } from "@/lib/prisma";
import CustomerManager, { type AdminCustomer } from "@/components/admin/CustomerManager";

export const instant = false;

export default async function AdminCustomersPage() {
  let customers: AdminCustomer[] = [];
  let loadError = false;
  try {
    const rows = await prisma.customer.findMany({
      where: { rentalRequests: { some: {} } },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      include: { _count: { select: { rentalRequests: true } } },
    });
    customers = rows.map((customer) => ({ ...customer, rentalRequestsCount: customer._count.rentalRequests }));
  } catch (error) {
    console.error("[admin/clientes] No se pudo cargar la lista", error);
    loadError = true;
  }
  return <CustomerManager customers={customers} loadError={loadError} />;
}
