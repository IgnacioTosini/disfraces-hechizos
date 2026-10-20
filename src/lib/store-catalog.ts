import { prisma } from "@/lib/prisma";

export type StoreCatalogCostume = {
  id: string;
  name: string;
  slug: string;
  description: string;
  audience: "ADULT" | "CHILD" | "UNISEX";
  rentalPrice: number;
  isFeatured: boolean;
  isActive: boolean;
  assistantTags: string[];
  categoryId: string;
  category: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; isActive: boolean; sortOrder: number };
  images: { id: string; url: string; publicId: string | null; altText: string; sortOrder: number; costumeId: string }[];
  variants: { id: string; size: string; stockQuantity: number; isActive: boolean; costumeId: string }[];
};

export async function getStoreCatalog() {
  try {
    const rows = await prisma.costume.findMany({
      where: { isActive: true, category: { isActive: true } },
      orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isActive: true }, orderBy: { size: "asc" } },
      },
    });
    return {
      loadError: false,
      costumes: rows.map((costume) => ({
        ...costume,
        description: costume.description ?? "Consultá los detalles con el local.",
        rentalPrice: Number(costume.rentalPrice ?? 0),
        images: costume.images.length
          ? costume.images.map((image) => ({ ...image, altText: image.altText ?? costume.name }))
          : [{ id: `${costume.id}-placeholder`, url: "/images/hero-disfraces.webp", publicId: null, altText: costume.name, sortOrder: 0, costumeId: costume.id }],
      })) satisfies StoreCatalogCostume[],
    };
  } catch (error) {
    console.error("[store] No se pudo cargar el catálogo desde la base", error);
    return { costumes: [] as StoreCatalogCostume[], loadError: true };
  }
}
