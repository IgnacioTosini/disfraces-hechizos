import OccasionAccessManager from "@/components/admin/OccasionAccessManager";
import { getCostumeFinderOptions } from "@/lib/costume-finder-settings";
import { getHomeHeroContent } from "@/lib/home-hero";

export const instant = false;

export default async function AdminOccasionAccessPage() {
  const [content, options] = await Promise.all([getHomeHeroContent(), getCostumeFinderOptions()]);
  return <OccasionAccessManager initialCards={content.sections.occasionAccess} options={options} />;
}
