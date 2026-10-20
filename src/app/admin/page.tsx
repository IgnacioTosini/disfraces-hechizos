import { connection } from "next/server";
import {
  DashboardStats,
  InspectionSection,
  RecentRequestsSection,
  UpcomingReturnsSection,
} from "@/components/admin/dashboard/AdminDashboardSections";
import { getAdminDashboardData } from "@/lib/admin-dashboard-data";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  let data: Awaited<ReturnType<typeof getAdminDashboardData>> | null = null;
  try {
    data = await getAdminDashboardData();
  } catch (error) {
    console.error("[admin] No se pudo cargar el resumen", error);
  }

  const stats = data?.stats ?? { costumes: 0, activeCostumes: 0, categories: 0, pending: 0, awaitingInspection: 0 };
  return <div className="adminDashboard">
    <header className="adminDashboard__header">
      <div><p className="adminDashboard__eyebrow">PANEL DE CONTROL</p><h1>Resumen</h1><p>Una vista rápida del catálogo y las consultas de alquiler.</p></div>
      <span className="adminDashboard__today">Administración</span>
    </header>

    {!data && <div className="adminDashboard__notice" role="status">No se pudieron cargar los datos. Revisá la conexión con la base de datos.</div>}
    <DashboardStats stats={stats} />
    {data && <>
      <InspectionSection requests={data.inspectionRequests} count={stats.awaitingInspection} />
      <UpcomingReturnsSection requests={data.upcomingReturns} />
      <RecentRequestsSection requests={data.recentRequests} />
    </>}
  </div>;
}
