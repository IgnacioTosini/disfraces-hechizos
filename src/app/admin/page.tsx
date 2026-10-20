import { Prisma } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" });

const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  CONFIRMED: "Confirmado",
  PICKED_UP: "Retirado",
  RETURNED: "Devuelto",
  CANCELLED: "Cancelado",
};

export default async function AdminDashboardPage() {
  let stats = { costumes: 0, activeCostumes: 0, categories: 0, pending: 0, awaitingInspection: 0 };
  let recentRequests: Awaited<ReturnType<typeof getRecentRequests>> = [];
  let inspectionRequests: Awaited<ReturnType<typeof getInspectionRequests>> = [];
  let databaseError = false;

  try {
    const [costumes, activeCostumes, categories, pending, requests, inspections, inspectionCounts] = await Promise.all([
      prisma.costume.count(),
      prisma.costume.count({ where: { isActive: true } }),
      prisma.category.count(),
      prisma.rentalRequest.count({ where: { status: "PENDING" } }),
      getRecentRequests(),
      getInspectionRequests(),
      prisma.$queryRaw<{ count: number }[]>`SELECT COUNT(DISTINCT rr."id")::int AS "count" FROM "RentalRequest" rr JOIN "RentalItem" ri ON ri."rentalRequestId" = rr."id" WHERE rr."status" = 'RETURNED' AND ri."isAvailableAgain" = false`,
    ]);
    stats = { costumes, activeCostumes, categories, pending, awaitingInspection: inspectionCounts[0]?.count ?? 0 };
    recentRequests = requests;
    inspectionRequests = inspections;
  } catch {
    databaseError = true;
  }

  return (
    <div className="adminDashboard">
      <header className="adminDashboard__header">
        <div>
          <p className="adminDashboard__eyebrow">PANEL DE CONTROL</p>
          <h1>Resumen</h1>
          <p>Una vista rápida del catálogo y las consultas de alquiler.</p>
        </div>
        <span className="adminDashboard__today">Administración</span>
      </header>

      {databaseError && (
        <div className="adminDashboard__notice" role="status">
          No se pudieron cargar los datos. Revisá la conexión con la base de datos.
        </div>
      )}

      <section className="adminDashboard__stats" aria-label="Estadísticas">
        <article className="adminDashboard__stat"><span>Disfraces</span><strong>{stats.costumes}</strong><small>{stats.activeCostumes} publicados</small></article>
        <article className="adminDashboard__stat"><span>Categorías</span><strong>{stats.categories}</strong><small>En el catálogo</small></article>
        <article className="adminDashboard__stat"><span>Consultas pendientes</span><strong>{stats.pending}</strong><small>Esperan seguimiento</small></article>
      </section>

      {inspectionRequests.length > 0 && <section className="adminDashboard__inspection" aria-labelledby="inspectionTitle">
        <div className="adminDashboard__inspectionHeader"><div><p className="adminDashboard__eyebrow">REVISIÓN DEL LOCAL</p><h2 id="inspectionTitle">Disfraces devueltos para revisar</h2><p>Siguen fuera de disponibilidad hasta que confirmes que pueden volver al catálogo.</p></div><span>{stats.awaitingInspection}</span></div>
        <ul>{inspectionRequests.map((request) => <li key={request.id}><div><strong>{request.customer.name}</strong><span>{request.items.filter((item) => !item.isAvailableAgain).map((item) => `${item.costumeName} · ${item.size}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ")}</span></div><span className="adminDashboard__inspectionDate">Devuelto {dateFormat.format(request.returnDate)}</span></li>)}</ul>
        <Link href="/admin/solicitudes">Revisar solicitudes →</Link>
      </section>}

      <section className="adminDashboard__requests">
        <div className="adminDashboard__sectionHeading">
          <div><p className="adminDashboard__eyebrow">ACTIVIDAD</p><h2>Consultas recientes</h2></div>
          <span>Últimas 6</span>
        </div>
        {recentRequests.length ? (
          <div className="adminDashboard__tableWrap">
            <table>
              <thead><tr><th>Cliente</th><th>Disfraces</th><th>Fecha de retiro</th><th>Estado</th></tr></thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id}>
                    <td><strong>{request.customer.name}</strong><small>{request.customer.phone}</small></td>
                    <td>{request.items.map((item) => `${item.costumeName} · ${item.size}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ")}</td>
                    <td>{dateFormat.format(request.pickupDate)}</td>
                    <td><span className={`adminDashboard__status adminDashboard__status--${request.status.toLowerCase()}`}>{statusLabels[request.status] ?? request.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="adminDashboard__empty">Todavía no hay consultas para mostrar.</div>
        )}
      </section>
    </div>
  );
}

function getRecentRequests() {
  return prisma.rentalRequest.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: { customer: true, items: true },
  });
}

function getInspectionRequests() {
  return (async () => {
    const ids = await prisma.$queryRaw<{ id: string }[]>`
      SELECT rr."id" FROM "RentalRequest" rr
      WHERE rr."status" = 'RETURNED' AND EXISTS (
        SELECT 1 FROM "RentalItem" ri WHERE ri."rentalRequestId" = rr."id" AND ri."isAvailableAgain" = false
      ) ORDER BY rr."returnDate" ASC LIMIT 8
    `;
    if (!ids.length) return [];
    const requests = await prisma.rentalRequest.findMany({
      where: { id: { in: ids.map(({ id }) => id) } },
      orderBy: { returnDate: "asc" },
      include: { customer: { select: { name: true } }, items: { select: { id: true, costumeName: true, size: true, quantity: true } } },
    });
    const itemIds = requests.flatMap((request) => request.items.map((item) => item.id));
    const releases = itemIds.length ? await prisma.$queryRaw<{ id: string; isAvailableAgain: boolean }[]>`
      SELECT "id", "isAvailableAgain" FROM "RentalItem" WHERE "id" IN (${Prisma.join(itemIds)})
    ` : [];
    const releasedById = new Map(releases.map((item) => [item.id, item.isAvailableAgain]));
    return requests.map((request) => ({ ...request, items: request.items.map((item) => ({ ...item, isAvailableAgain: releasedById.get(item.id) ?? false })) }));
  })();
}
