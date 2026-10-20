import HomeHeroManager from "@/components/admin/HomeHeroManager";
import { getHomeHeroContent } from "@/lib/home-hero";
import { getStoreCatalog } from "@/lib/store-catalog";

export const instant = false;

export default async function AdminHomeHeroPage() {
  const [content, catalog] = await Promise.all([getHomeHeroContent(), getStoreCatalog()]);
  return <HomeHeroManager initialContent={content} costumes={catalog.costumes} />;
}
