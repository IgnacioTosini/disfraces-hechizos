export type CostumeExample = {
    id: string
    name: string
    slug: string
    description: string
    audience: 'ADULT' | 'CHILD' | 'UNISEX'
    rentalPrice: number
    isFeatured: boolean
    isActive: boolean
    categoryId: string
    category: { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; isActive: boolean; sortOrder: number }
    images: { id: string; url: string; publicId: string | null; altText: string; sortOrder: number; costumeId: string }[]
    variants: { id: string; size: string; stockQuantity: number; isActive: boolean; costumeId: string }[]
}

const categories = {
    professions: { id: 'category-profesiones', name: 'Profesiones', slug: 'profesiones', description: null, imageUrl: null, isActive: true, sortOrder: 1 },
    celebration: { id: 'category-fiesta', name: 'Fiesta y celebración', slug: 'fiesta-y-celebracion', description: null, imageUrl: null, isActive: true, sortOrder: 2 },
    historical: { id: 'category-historico', name: 'Histórico', slug: 'historico', description: null, imageUrl: null, isActive: true, sortOrder: 3 },
    animated: { id: 'category-animados', name: 'Animados', slug: 'animados', description: null, imageUrl: null, isActive: true, sortOrder: 4 },
}

function costume({
    id, name, slug, description, audience, rentalPrice, category, image, altText, sizes, isFeatured = false,
}: {
    id: string; name: string; slug: string; description: string;
    audience: CostumeExample['audience']; rentalPrice: number;
    category: CostumeExample['category']; image: string; altText: string; sizes: string[]; isFeatured?: boolean;
}): CostumeExample {
    return {
        id, name, slug, description, audience, rentalPrice,
        isFeatured, isActive: true,
        categoryId: category.id, category,
        images: [{ id: `${id}-image-1`, url: image, publicId: null, altText, sortOrder: 0, costumeId: id }],
        variants: sizes.map((size) => ({ id: `${id}-${size.toLowerCase()}`, size, stockQuantity: 1, isActive: true, costumeId: id })),
    }
}

export const costumeExamples: CostumeExample[] = [
    costume({ id: 'costume-astronauta', name: 'Astronauta', slug: 'astronauta', description: 'Disfraz espacial con casco incluido.', audience: 'ADULT', rentalPrice: 18000, category: categories.professions, isFeatured: true, image: '/images/disfraz-astronauta.webp', altText: 'Disfraz blanco de astronauta con casco', sizes: ['M', 'L', 'XL'] }),
    costume({ id: 'costume-cavernicola', name: 'Cavernícola', slug: 'cavernicola', description: 'Túnica animal print y accesorios.', audience: 'ADULT', rentalPrice: 14000, category: categories.celebration, image: '/images/disfraz-cavernicola.webp', altText: 'Disfraz de cavernícola con túnica animal print', sizes: ['M', 'L', 'XL'] }),
    costume({ id: 'costume-cleopatra', name: 'Cleopatra', slug: 'cleopatra', description: 'Vestido egipcio blanco con detalles dorados.', audience: 'ADULT', rentalPrice: 20000, category: categories.historical, isFeatured: true, image: '/images/disfraz-cleopatra.webp', altText: 'Vestido de reina egipcia blanco y dorado', sizes: ['S', 'M', 'L'] }),
    costume({ id: 'costume-dinosaurio', name: 'Dinosaurio', slug: 'dinosaurio', description: 'Enterito suave con capucha de dinosaurio.', audience: 'CHILD', rentalPrice: 12000, category: categories.animated, isFeatured: true, image: '/images/disfraz-dinosaurio.webp', altText: 'Disfraz infantil verde de dinosaurio', sizes: ['2-4', '4-6', '6-8'] }),
    costume({ id: 'costume-enfermera', name: 'Enfermera', slug: 'enfermera', description: 'Clásico uniforme blanco de enfermería.', audience: 'ADULT', rentalPrice: 16000, category: categories.professions, image: '/images/disfraz-enfermera.webp', altText: 'Disfraz blanco de enfermera', sizes: ['S', 'M', 'L'] }),
    costume({ id: 'costume-escoces', name: 'Escocés histórico', slug: 'escoces-historico', description: 'Kilt y chaqueta tradicional con tartán.', audience: 'ADULT', rentalPrice: 19000, category: categories.historical, image: '/images/disfraz-escoces.webp', altText: 'Disfraz histórico escocés con kilt de tartán', sizes: ['M', 'L', 'XL'] }),
]

export const featuredCostumeExamples = costumeExamples.filter(({ isFeatured }) => isFeatured)

