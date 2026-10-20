import { prisma } from "@/lib/prisma";
import CategoryManager, { type AdminCategory } from "@/components/admin/CategoryManager";

export const instant = false;

export default async function AdminCategoriesPage() {
  let categories: AdminCategory[] = [];
  let loadError = false;

  try {
    categories = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { _count: { select: { costumes: true } } },
    });
  } catch {
    loadError = true;
  }

  return <CategoryManager categories={categories} loadError={loadError} />;
}
