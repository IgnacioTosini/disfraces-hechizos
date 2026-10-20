import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";
import "@/components/admin/_admin-login.scss";

export const metadata: Metadata = {
  title: "Acceso al panel",
  description: "Acceso privado a la administración de Disfraces Hechizos.",
  robots: { index: false, follow: false, noarchive: true },
};

export default function LoginPage() {
  return (
    <main className="adminLogin">
      <div className="adminLogin__layout">
        <section className="adminLogin__story" aria-label="Panel de Disfraces Hechizos">
          <Link className="adminLogin__brand" href="/" aria-label="Volver a Disfraces Hechizos">
            <span className="adminLogin__brandIcon" aria-hidden="true">✦</span>
            <span className="adminLogin__brandText"><small>disfraces</small>Hechizos</span>
          </Link>
          <div className="adminLogin__storyCopy">
            <span className="adminLogin__pill"><span aria-hidden="true" /> Panel privado</span>
            <h1>Tu local,<br />todo en <em>orden.</em></h1>
            <p>Gestioná disfraces, talles y solicitudes desde un solo lugar.</p>
          </div>
          <p className="adminLogin__storyFoot">Disfraces Hechizos <span>·</span> Mar del Plata</p>
          <span className="adminLogin__spark adminLogin__spark--one" aria-hidden="true">✦</span>
          <span className="adminLogin__spark adminLogin__spark--two" aria-hidden="true">✧</span>
        </section>

        <section className="adminLogin__panel">
          <div className="adminLogin__panelInner">
            <p className="adminLogin__eyebrow">ADMINISTRACIÓN</p>
            <h2>Bienvenido</h2>
            <p className="adminLogin__description">Ingresá la contraseña para acceder al panel.</p>
            <LoginForm />
            <Link className="adminLogin__backLink" href="/">← Volver al sitio</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
