import type { Metadata } from "next";
import LegalPage from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacidad y datos personales",
  description: "Conocé qué datos se usan para atender solicitudes de alquiler de disfraces y cómo ejercer tus derechos.",
  alternates: { canonical: "/privacidad" },
};

export default function PrivacyPage() {
  return <LegalPage
    eyebrow="Tu información"
    title="Privacidad y datos personales"
    intro="Usamos los datos que compartís para responder tu consulta y coordinar, si así lo acordás, el alquiler del disfraz."
    updatedAt="20 de octubre de 2026"
    sections={[
      {
        title: "Qué información recibimos",
        paragraphs: [
          "Cuando enviás una consulta, podemos recibir tu nombre y apellido, teléfono, correo electrónico si lo completás, los disfraces y talles elegidos, las fechas solicitadas y las aclaraciones que decidas agregar.",
          "No ingreses datos sensibles ni información de pago en los campos de consulta. El sitio no procesa pagos online.",
        ],
      },
      {
        title: "Para qué la usamos",
        paragraphs: [
          "Los datos se utilizan para identificar tu solicitud, consultar disponibilidad, contactarte, coordinar el alquiler y mantener el seguimiento necesario para atenderlo. No usamos la información de la consulta para enviarte publicidad ajena a ese pedido.",
        ],
      },
      {
        title: "Acceso, conservación y seguridad",
        paragraphs: [
          "La información queda disponible para el equipo que administra las solicitudes. Se conserva durante el tiempo necesario para responder y dar seguimiento al alquiler, y por el plazo que puedan exigir obligaciones legales. Se aplican medidas razonables para evitar accesos no autorizados.",
          "No publicamos tus datos ni los vendemos. Si fuera necesario compartir información con proveedores técnicos que alojan o mantienen el sitio, se limitará a lo necesario para prestar ese servicio.",
        ],
      },
      {
        title: "Tus derechos",
        paragraphs: [
          "Podés solicitar acceso a tus datos, corregirlos o pedir su actualización y, cuando corresponda, su supresión. Para hacerlo, escribí a marcelaarchuby@hotmail.com e indicá cómo identificar la consulta. El ejercicio de estos derechos se rige por la Ley 25.326.",
          "La Agencia de Acceso a la Información Pública, como autoridad de aplicación, recibe denuncias y reclamos vinculados con la protección de datos personales.",
        ],
      },
      {
        title: "Métricas del sitio",
        paragraphs: [
          "El sitio utiliza Vercel Analytics para obtener métricas generales de navegación y mejorar su funcionamiento. Estas métricas no incluyen el contenido que escribís en la consulta de alquiler.",
        ],
      },
      {
        title: "Responsable y contacto",
        paragraphs: [
          "La responsable informada para el tratamiento de estos datos es Marcela Archuby, quien opera comercialmente como Disfraces Hechizos. Domicilio de atención: España 1744, entre San Martín y Rivadavia, Mar del Plata. Para pedir acceso, corrección o supresión de datos, escribí a marcelaarchuby@hotmail.com o llamá al +54 223 474-9026.",
        ],
      },
    ]}
  />;
}
