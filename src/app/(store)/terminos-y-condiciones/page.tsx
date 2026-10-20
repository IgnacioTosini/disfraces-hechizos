import type { Metadata } from "next";
import LegalPage from "@/components/sections/legal/LegalPage";

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description: "Información sobre consultas, disponibilidad, alquiler, retiro y devolución de disfraces en Disfraces Hechizos, Mar del Plata.",
  alternates: { canonical: "/terminos-y-condiciones" },
};

export default function TermsPage() {
  return <LegalPage
    eyebrow="Antes de alquilar"
    title="Términos y condiciones"
    intro="Acá te contamos cómo funciona la consulta online y qué tener en cuenta al alquilar un disfraz con Disfraces Hechizos."
    updatedAt="20 de octubre de 2026"
    sections={[
      {
        title: "La consulta online no confirma una reserva",
        paragraphs: [
          "Podés seleccionar disfraces, talles y fechas para consultar. El envío del formulario o del mensaje por WhatsApp es una solicitud: no bloquea unidades ni confirma por sí solo una reserva.",
          "El equipo del local revisa la disponibilidad del talle para todo el período y te confirma por un medio de contacto. La reserva queda acordada cuando el local confirma expresamente el disfraz, el precio, las fechas y las condiciones particulares.",
        ],
      },
      {
        title: "Disponibilidad, precios y catálogo",
        paragraphs: [
          "Las fotos, descripciones, talles y precios publicados son orientativos y pueden cambiar. La disponibilidad se verifica para cada disfraz, talle y período; una consulta pendiente no impide que otra solicitud sea atendida.",
          "Antes de confirmar, el local informa el precio aplicable y las condiciones del alquiler. El sitio no cobra ni solicita pagos online.",
        ],
      },
      {
        title: "Elección y prueba en el local",
        paragraphs: [
          "El local recomienda consultar con anticipación para contar con más opciones. Según la información publicada por el comercio, podés acercarte a elegir y probarte alternativas; también podés consultar por disponibilidad para una fecha cercana o el mismo día.",
          "La atención es en España 1744, entre San Martín y Rivadavia, Mar del Plata. No hace falta solicitar turno según la información pública del local; confirmá por contacto directo si necesitás coordinar una atención especial o un feriado.",
        ],
      },
      {
        title: "Retiro, devolución y cuidado",
        paragraphs: [
          "Al confirmar el alquiler, el local acuerda con vos las fechas y horarios de retiro y devolución. Devolvé el disfraz en la fecha pautada y guardado en la bolsa entregada.",
          "El local informa que entrega los trajes limpios y con los accesorios necesarios, y se ocupa del lavado. No laves, cosas ni modifiques el disfraz; si detectás un faltante o un problema al recibirlo, avisá al equipo antes de usarlo.",
          "Cualquier cargo, garantía, depósito, cambio de fecha o tratamiento por demora o daño debe informarse y acordarse antes de confirmar el alquiler. Esta página no fija importes ni penalidades que el local no haya publicado.",
        ],
      },
      {
        title: "Identificación y retiro por otra persona",
        paragraphs: [
          "La información pública del local indica que puede solicitar el DNI para verificar los datos, pero no lo retiene. También indica que otra persona de confianza puede retirar o devolver el disfraz si cuenta con los datos y horarios acordados.",
        ],
      },
      {
        title: "Cambios, cancelaciones y derechos del consumidor",
        paragraphs: [
          "Si necesitás modificar o cancelar una solicitud o una reserva ya confirmada, comunicate directamente con el local e indicá el nombre, disfraz y fechas. Las condiciones concretas se informan al confirmar; tus derechos como consumidor se mantienen vigentes.",
          "La información legal de este sitio es orientativa y no limita los derechos establecidos por la normativa de defensa del consumidor. Para conocerlos, consultá la Ley 24.240 y los canales oficiales de atención al consumidor.",
        ],
      },
    ]}
  />;
}
