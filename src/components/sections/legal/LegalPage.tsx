import Link from "next/link";
import "./_legal.scss";

type LegalSection = { title: string; paragraphs: string[] };

export default function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legalPage">
      <div className="legalPage__inner">
        <Link className="legalPage__back" href="/">← Volver al inicio</Link>
        <header className="legalPage__header">
          <p className="legalPage__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legalPage__intro">{intro}</p>
          <p className="legalPage__updated">Última actualización: {updatedAt}</p>
        </header>
        <div className="legalPage__sections">
          {sections.map((section, index) => (
            <section className="legalPage__section" key={section.title}>
              <span className="legalPage__number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
          <aside className="legalPage__contact">
            <h2>¿Necesitás hablar con el local?</h2>
            <p>España 1744, entre San Martín y Rivadavia, Mar del Plata.</p>
            <p><a href="tel:+542234749026">+54 223 474-9026</a><span aria-hidden="true"> · </span><a href="mailto:marcelaarchuby@hotmail.com">marcelaarchuby@hotmail.com</a></p>
            <p><a href="https://www.instagram.com/disfraceshechizos/" target="_blank" rel="noopener noreferrer">Instagram @disfraceshechizos ↗</a></p>
          </aside>
          <nav className="legalPage__related" aria-label="Información legal">
            <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
            <Link href="/privacidad">Privacidad y datos personales</Link>
            <a href="https://www.argentina.gob.ar/normativa/nacional/638/actualizacion" target="_blank" rel="noopener noreferrer">Ley de Defensa del Consumidor ↗</a>
            <a href="https://www.argentina.gob.ar/aaip/datospersonales/derechos" target="_blank" rel="noopener noreferrer">Derechos sobre datos personales ↗</a>
          </nav>
        </div>
      </div>
    </main>
  );
}
