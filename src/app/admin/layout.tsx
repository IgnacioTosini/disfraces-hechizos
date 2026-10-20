import Link from "next/link";
import type { Metadata } from "next";
import AdminLogout from "@/components/admin/AdminLogout";
import AdminNavigation from "@/components/admin/AdminNavigation";
import "@/components/admin/admin.scss";

export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false, noarchive: true },
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="adminShell">
      <aside className="adminShell__sidebar">
        <Link href="/admin" className="adminShell__brand">Disfraces <span>Hechizos</span></Link>
        <p className="adminShell__caption">ADMINISTRACIÓN</p>
        <AdminNavigation />
        <AdminLogout />
      </aside>
      <main className="adminShell__main">{children}</main>
    </div>
  );
}
