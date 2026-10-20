import type { Metadata, Viewport } from "next";
import { Analytics } from '@vercel/analytics/next';
import "./globals.scss";

export const metadata: Metadata = {
  metadataBase: new URL((process.env.SITE_URL || "https://www.disfraceshechizos.com.ar").replace(/\/$/, "")),
  title: {
    default: "Alquiler de disfraces en Mar del Plata | Disfraces Hechizos",
    template: "%s | Disfraces Hechizos",
  },
  applicationName: "Disfraces Hechizos",
  description: "Encontrá disfraces para adultos y niños en Mar del Plata. Explorá el catálogo y consultá talles y fechas de alquiler.",
  keywords: ["alquiler de disfraces", "disfraces en Mar del Plata", "disfraces para adultos", "disfraces infantiles", "Disfraces Hechizos"],
  icons: { icon: "/favicon-disfraces-hechizos.png" },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Disfraces Hechizos",
    title: "Alquiler de disfraces en Mar del Plata",
    description: "Encontrá disfraces para adultos y niños. Explorá el catálogo y consultá talles y fechas de alquiler.",
    url: "/",
    images: [{ url: "/images/logo-disfraces-hechizos-seo.png", width: 1200, height: 630, alt: "Logo de Disfraces Hechizos" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alquiler de disfraces en Mar del Plata | Disfraces Hechizos",
    description: "Explorá disfraces para adultos y niños y consultá disponibilidad en Mar del Plata.",
    images: ["/images/logo-disfraces-hechizos-seo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
