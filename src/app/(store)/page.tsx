import type { Metadata } from "next";
import Hero from "@/components/sections/hero/Hero";
import Categories from "@/components/sections/categories/Categories";
import FeaturedCostumes from "@/components/sections/featured-costumes/FeaturedCostumes";
import HowItWorks from "@/components/sections/how-it-works/HowItWorks";
import Faq from "@/components/sections/faq/Faq";
import { getStoreCatalog } from "@/lib/store-catalog";
import { getHomeHeroContent } from "@/lib/home-hero";
import { getSiteUrl } from "@/lib/site-url";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const content = await getHomeHeroContent();
  const title = "Alquiler de disfraces en Mar del Plata";

  return {
    title,
    description: content.description,
    alternates: { canonical: "/" },
    openGraph: {
      title: `${title} | Disfraces Hechizos`,
      description: content.description,
      url: "/",
      images: [{ url: "/images/logo-disfraces-hechizos-seo.png", width: 1200, height: 630, alt: "Logo de Disfraces Hechizos" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Disfraces Hechizos`,
      description: content.description,
      images: ["/images/logo-disfraces-hechizos-seo.png"],
    },
  };
}

export default async function Home() {
  const [{ costumes, loadError }, heroContent] = await Promise.all([
    getStoreCatalog(),
    getHomeHeroContent(),
  ]);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "Disfraces Hechizos",
    description: heroContent.description,
    url: getSiteUrl().toString(),
    image: heroContent.imageUrl,
    address: {
      "@type": "PostalAddress",
      streetAddress: "España 1744",
      addressLocality: "Mar del Plata",
      addressRegion: "Buenos Aires",
      addressCountry: "AR",
    },
    sameAs: ["https://www.instagram.com/disfraceshechizos/"],
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Hero content={heroContent} />
      <Categories content={heroContent.sections} />
      <FeaturedCostumes costumes={costumes} loadError={loadError} content={heroContent.sections} />
      <HowItWorks content={heroContent.sections} />
      <Faq content={heroContent.sections} />
    </main>
  );
}
