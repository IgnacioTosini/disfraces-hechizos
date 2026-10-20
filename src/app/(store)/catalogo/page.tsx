import type { Metadata } from 'next'
import Catalog from '@/components/sections/catalog/Catalog'
import { getStoreCatalog } from '@/lib/store-catalog'
import { getCostumeFinderOptions } from '@/lib/costume-finder-settings'

export const instant = false

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
    const params = await searchParams
    const hasFilters = Object.values(params).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value))

    return {
        title: 'Catálogo de disfraces para alquilar',
        description: 'Explorá disfraces para adultos y niños en Mar del Plata. Filtrá por categoría, temática y talle, y consultá disponibilidad.',
        alternates: { canonical: '/catalogo' },
        robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
        openGraph: {
            title: 'Catálogo de disfraces para alquilar | Disfraces Hechizos',
            description: 'Explorá disfraces para adultos y niños y consultá disponibilidad en Mar del Plata.',
            url: '/catalogo',
        },
    }
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ categoria?: string; audience?: string; q?: string | string[]; search?: string | string[]; tags?: string; costume?: string }> }) {
    const params = await searchParams
    const [{ costumes, loadError }, finderOptions] = await Promise.all([getStoreCatalog(), getCostumeFinderOptions()])
    const requestedAudience = params.audience || params.categoria
    const requestedQuery = params.q || params.search || ''
    const initialAudience = requestedAudience === 'adultos' || requestedAudience === 'ADULT'
        ? 'ADULT'
        : requestedAudience === 'infantil' || requestedAudience === 'CHILD'
            ? 'CHILD'
            : 'ALL'
    const initialQuery = Array.isArray(requestedQuery) ? requestedQuery[0] || '' : requestedQuery
    const initialTags = (params.tags || '').split(',').filter((tag) => finderOptions.some((option) => option.id === tag))
    return <Catalog key={`${initialAudience}:${initialQuery}:${initialTags.join(',')}:${params.costume || ''}`} whatsappNumber={process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5492235777798'} costumes={costumes} finderOptions={finderOptions} loadError={loadError} initialAudience={initialAudience} initialQuery={initialQuery} initialTags={initialTags} initialCostumeSlug={params.costume} />
}
