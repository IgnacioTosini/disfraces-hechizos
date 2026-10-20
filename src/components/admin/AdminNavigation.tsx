"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/inicio", label: "Contenido del inicio" },
  { href: "/admin/categorias", label: "Categorías" },
  { href: "/admin/disfraces", label: "Disfraces" },
  { href: "/admin/solicitudes", label: "Solicitudes" },
  { href: "/admin/clientes", label: "Clientes" },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;
  const activeLink = links.find(({ href }) => href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <nav className={`adminShell__nav${isOpen ? " adminShell__nav--open" : ""}`} aria-label="Administración">
      <button className="adminShell__navToggle" type="button" aria-expanded={isOpen} onClick={() => setOpenPath(isOpen ? null : pathname)}>
        <span><small>Sección actual</small><strong>{activeLink?.label ?? "Administración"}</strong></span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      <div className="adminShell__navLinks">
        {links.map(({ href, label }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={`adminShell__link${active ? " adminShell__link--active" : ""}`} aria-current={active ? "page" : undefined} onClick={() => setOpenPath(null)}>{label}</Link>;
        })}
        <Link href="/" className="adminShell__link" onClick={() => setOpenPath(null)}>Volver a la tienda</Link>
      </div>
    </nav>
  );
}
