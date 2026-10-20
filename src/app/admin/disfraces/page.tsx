import { prisma } from "@/lib/prisma";
import CostumeManager, { type AdminCostume, type CostumeCategoryOption } from "@/components/admin/CostumeManager";

export const instant = false;

export default async function AdminCostumesPage() {
  let costumes: AdminCostume[] = [];
  let categories: CostumeCategoryOption[] = [];
  let loadError = false;

  try {
    const [costumeRows, categoryRows] = await Promise.all([
      prisma.costume.findMany({
        orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
        include: {
          category: { select: { id: true, name: true, isActive: true } },
          images: { orderBy: { sortOrder: "asc" } },
          variants: { orderBy: { size: "asc" }, include: { _count: { select: { rentalItems: true } } } },
        },
      }),
      prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    ]);

    costumes = costumeRows.map((costume) => ({
      ...costume,
      rentalPrice: costume.rentalPrice?.toString() ?? null,
      variants: costume.variants.map((variant) => ({ ...variant, rentalItemsCount: variant._count.rentalItems })),
    }));
    categories = categoryRows;
  } catch {
    loadError = true;
  }

  return <CostumeManager costumes={costumes} categories={categories} loadError={loadError} />;
}
