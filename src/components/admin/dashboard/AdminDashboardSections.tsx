import Link from "next/link";
import { getAdminDashboardData } from "@/lib/admin-dashboard-data";

type DashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
type DashboardStats = DashboardData["stats"];
type InspectionRequest = DashboardData["inspectionRequests"][number];
type UpcomingReturn = DashboardData["upcomingReturns"][number];
type RecentRequest = DashboardData["recentRequests"][number];

const dateFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeZone: "UTC" });
const statusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  CONTACTED: "Contactado",
  CONFIRMED: "Confirmado",
  PICKED_UP: "Retirado",
  RETURNED: "Devuelto",
  CANCELLED: "Cancelado",
};

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  return <section className="adminDashboard__stats" aria-label="Estadísticas">
    <article className="adminDashboard__stat"><span>Disfraces</span><strong>{stats.costumes}</strong><small>{stats.activeCostumes} publicados</small></article>
    <article className="adminDashboard__stat"><span>Categorías</span><strong>{stats.categories}</strong><small>En el catálogo</small></article>
    <article className="adminDashboard__stat"><span>Consultas pendientes</span><strong>{stats.pending}</strong><small>Esperan seguimiento</small></article>
  </section>;
}

export function InspectionSection({ requests, count }: { requests: DashboardData["inspectionRequests"]; count: number }) {
  if (!requests.length) return null;
  return <section className="adminDashboard__inspection" aria-labelledby="inspectionTitle">
    <div className="adminDashboard__inspectionHeader"><div><p className="adminDashboard__eyebrow">REVISIÓN DEL LOCAL</p><h2 id="inspectionTitle">Disfraces devueltos para revisar</h2><p>Siguen fuera de disponibilidad hasta que confirmes que pueden volver al catálogo.</p></div><span>{count}</span></div>
    <ul>{requests.map((request) => <InspectionRow key={request.id} request={request} />)}</ul>
    <Link href="/admin/solicitudes">Revisar solicitudes →</Link>
  </section>;
}

function InspectionRow({ request }: { request: InspectionRequest }) {
  return <li><div><strong>{request.customer.name}</strong><span>{request.items.map((item) => `${item.costumeName} · ${item.size}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ")}</span></div><span className="adminDashboard__inspectionDate">Devuelto {dateFormat.format(request.returnDate)}</span><Link href={`/admin/solicitudes#solicitud-${request.id}`}>Abrir solicitud →</Link></li>;
}

export function UpcomingReturnsSection({ requests }: { requests: DashboardData["upcomingReturns"] }) {
  return <section className="adminDashboard__upcoming" aria-labelledby="upcomingTitle">
    <div className="adminDashboard__inspectionHeader"><div><p className="adminDashboard__eyebrow">PRÓXIMAS DEVOLUCIONES</p><h2 id="upcomingTitle">Prepará la revisión de estos disfraces</h2><p>Al recibirlos, marcá la solicitud como devuelta y revisá cada unidad antes de volver a ofrecerla.</p></div><span>{requests.length}</span></div>
    {requests.length ? <ul>{requests.map((request) => <UpcomingReturnRow key={request.id} request={request} />)}</ul> : <p className="adminDashboard__empty">No hay disfraces que deban volver en los próximos tres días.</p>}
  </section>;
}

function UpcomingReturnRow({ request }: { request: UpcomingReturn }) {
  return <li><div><strong>{request.customer.name}</strong><span>{request.items.map((item) => `${item.costumeName} · ${item.size}${item.quantity > 1 ? ` ×${item.quantity}` : ""} · hasta ${dateFormat.format(item.returnDate)}`).join(", ")}</span></div><Link href={`/admin/solicitudes#solicitud-${request.id}`}>Abrir solicitud →</Link></li>;
}

export function RecentRequestsSection({ requests }: { requests: DashboardData["recentRequests"] }) {
  return <section className="adminDashboard__requests">
    <div className="adminDashboard__sectionHeading"><div><p className="adminDashboard__eyebrow">ACTIVIDAD</p><h2>Consultas recientes</h2></div><span>Últimas 6</span></div>
    {requests.length ? <div className="adminDashboard__tableWrap"><table>
      <thead><tr><th>Cliente</th><th>Disfraces</th><th>Fecha de retiro</th><th>Estado</th></tr></thead>
      <tbody>{requests.map((request) => <RecentRequestRow key={request.id} request={request} />)}</tbody>
    </table></div> : <div className="adminDashboard__empty">Todavía no hay consultas para mostrar.</div>}
  </section>;
}

function RecentRequestRow({ request }: { request: RecentRequest }) {
  return <tr>
    <td><strong>{request.customer.name}</strong><small>{request.customer.phone}</small></td>
    <td>{request.items.map((item) => `${item.costumeName} · ${item.size}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ")}</td>
    <td>{dateFormat.format(request.pickupDate)}</td>
    <td><span className={`adminDashboard__status adminDashboard__status--${request.status.toLowerCase()}`}>{statusLabels[request.status] ?? request.status}</span></td>
  </tr>;
}
