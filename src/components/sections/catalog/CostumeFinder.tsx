'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import type { StoreCatalogCostume } from '@/lib/store-catalog'
import { formatARS } from '@/lib/formatters'
import Pagination from '@/components/ui/pagination/Pagination'
import { usePaginatedItems } from '@/components/ui/pagination/usePaginatedItems'
import type { CostumeFinderOption } from '@/lib/costume-finder-settings'
import RentalDatePicker from './RentalDatePicker'

type Audience = 'ALL' | 'ADULT' | 'CHILD'
type FinderResult = { variantId: string; available: boolean; availableUnits: number }
type Props = {
    costumes: StoreCatalogCostume[]
    options: CostumeFinderOption[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onChoose: (costumeId: string, size: string, from: string, to: string, trigger: HTMLElement) => void
}

const allStylesOption = { id: '__all__', label: 'Sorprendeme', keywords: [] }

function normalize(value: string) {
    return value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function today() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' })
}

function oneYearFromToday() {
    const date = new Date(`${today()}T00:00:00.000Z`)
    date.setUTCFullYear(date.getUTCFullYear() + 1)
    return date.toISOString().slice(0, 10)
}

export default function CostumeFinder({ costumes, options, open, onOpenChange, onChoose }: Props) {
    const [audience, setAudience] = useState<Audience>('ALL')
    const [style, setStyle] = useState('__all__')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [results, setResults] = useState<FinderResult[]>([])
    const [searched, setSearched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searchGeneration, setSearchGeneration] = useState(0)

    const candidates = useMemo(() => {
        const selectedStyle = options.find((item) => item.id === style)
        return costumes
            .filter((costume) => costume.isActive && costume.variants.some((variant) => variant.isActive))
            .filter((costume) => audience === 'ALL' || costume.audience === audience || costume.audience === 'UNISEX')
            .map((costume) => {
                const searchable = normalize(`${costume.name} ${costume.description} ${costume.category.name}`)
                const tagged = costume.assistantTags.includes(style)
                const matches = !selectedStyle || tagged || selectedStyle.keywords.some((word) => searchable.includes(normalize(word)))
                return { costume, matches }
            })
            .filter(({ matches }) => matches)
            .sort((a, b) => Number(b.costume.isFeatured) - Number(a.costume.isFeatured) || a.costume.name.localeCompare(b.costume.name, 'es'))
    }, [audience, costumes, options, style])

    const availableByVariant = new Map(results.filter((item) => item.available).map((item) => [item.variantId, item.availableUnits]))
    const recommendations = candidates.flatMap(({ costume }) => {
        const availableSizes = costume.variants
            .filter((variant) => variant.isActive && availableByVariant.has(variant.id))
            .map((variant) => ({ size: variant.size, units: availableByVariant.get(variant.id) ?? 0 }))
        return availableSizes.length ? [{ costume, availableSizes }] : []
    })
    const recommendationPagination = usePaginatedItems(recommendations, 6, searchGeneration)

    useEffect(() => {
        if (!open) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onOpenChange(false)
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [open, onOpenChange])

    async function findCostumes() {
        if (!from || !to || to < from) {
            setError('Elegí un rango válido: la fecha “Hasta” debe ser igual o posterior a “Desde”.')
            return
        }
        const requested = candidates.flatMap(({ costume }) => costume.variants.filter(({ isActive }) => isActive).map((variant) => ({
            variantId: variant.id, quantity: 1, pickupDate: from, returnDate: to,
        })))
        if (!requested.length) {
            setResults([])
            setSearched(true)
            return
        }

        setLoading(true)
        setError('')
        setSearched(false)
        try {
            const availabilityResults: FinderResult[] = []
            for (let index = 0; index < requested.length; index += 30) {
                const response = await fetch('/api/availability', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: requested.slice(index, index + 30) }),
                })
                const result = await response.json() as { items?: FinderResult[]; message?: string }
                if (!response.ok) throw new Error(result.message || 'No se pudo consultar la disponibilidad.')
                availabilityResults.push(...(result.items ?? []))
            }
            setResults(availabilityResults)
            setSearchGeneration((current) => current + 1)
            setSearched(true)
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'No se pudo consultar la disponibilidad. Probá otra vez.')
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null

    return (
        <div className='finderBackdrop' onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false) }}>
            <section className='finderDialog' role='dialog' aria-modal='true' aria-labelledby='finder-title'>
                <header className='finderHeader'>
                    <div><p className='finderEyebrow'>ASISTENTE DE BÚSQUEDA</p><h2 id='finder-title'>Encontrá tu próximo disfraz</h2></div>
                    <button type='button' className='finderClose' onClick={() => onOpenChange(false)} aria-label='Cerrar asistente'>×</button>
                </header>
                <p className='finderIntro'>Contanos para quién y cuándo lo necesitás. Revisamos los talles disponibles para esas fechas.</p>

                <div className='finderFields'>
                    <fieldset><legend>01 · ¿Para quién?</legend><div className='finderOptions'>
                        {([['ALL', 'Sin preferencia'], ['ADULT', 'Adultos'], ['CHILD', 'Infantil']] as const).map(([value, label]) => <button key={value} type='button' className={audience === value ? 'isSelected' : ''} onClick={() => { setAudience(value); setSearched(false) }}>{label}</button>)}
                    </div></fieldset>
                    <fieldset><legend>02 · ¿Qué estilo te gusta?</legend><div className='finderOptions'>
                        {[...options, allStylesOption].map((item) => <button key={item.id} type='button' className={style === item.id ? 'isSelected' : ''} onClick={() => { setStyle(item.id); setSearched(false) }}>{item.label}</button>)}
                    </div></fieldset>
                    <fieldset className='finderCalendarField'><legend>03 · ¿Para qué fechas?</legend>
                        <div className='finderCalendar'>
                            <RentalDatePicker
                                from={today()}
                                through={oneYearFromToday()}
                                reservations={[]}
                                stockQuantity={1}
                                startDate={from}
                                endDate={to}
                                loading={false}
                                loadError=''
                                showAvailabilityLegend={false}
                                availabilityNote='La disponibilidad se comprueba al buscar y el local confirma cada solicitud.'
                                onStartDate={(date) => { setFrom(date); if (to && date > to) setTo(''); setError(''); setSearched(false) }}
                                onEndDate={(date) => { setTo(date); setError(''); setSearched(false) }}
                            />
                        </div>
                    </fieldset>
                </div>

                <button className='finderSubmit' type='button' disabled={loading || !from || !to || to < from} onClick={() => void findCostumes()}>
                    {loading ? 'Revisando disponibilidad…' : searched ? 'Volver a buscar' : 'Ver disfraces disponibles'}
                </button>
                {error && <p className='finderMessage isError' role='alert'>{error}</p>}
                {searched && !error && (recommendations.length ? <div className='finderRecommendations' aria-live='polite'>
                    <h3>{recommendations.length === 1 ? 'Encontramos una opción' : `Encontramos ${recommendations.length} opciones`}</h3>
                    <div className='finderCards'>{recommendationPagination.pageItems.map(({ costume, availableSizes }) => {
                        const image = costume.images[0]
                        const firstSize = availableSizes[0]
                        return <article className='finderCard' key={costume.id}>
                            <div className='finderCardImage'>{image && <Image src={image.url} alt={image.altText} fill sizes='(max-width: 650px) 80vw, 180px' />}</div>
                            <div className='finderCardBody'><p className='finderCardCategory'>{costume.category.name}</p><h4>{costume.name}</h4><p className='finderCardPrice'>{formatARS(costume.rentalPrice)} <span>orientativo</span></p>
                                <p className='finderCardSizes'>Talles disponibles: {availableSizes.map(({ size }) => size).join(' · ')}</p>
                                <button type='button' onClick={(event) => onChoose(costume.id, firstSize.size, from, to, event.currentTarget)}>Ver detalle</button>
                            </div>
                        </article>
                    })}</div>
                    <Pagination page={recommendationPagination.page} pageCount={recommendationPagination.pageCount} onPageChange={recommendationPagination.setPage} itemCount={recommendations.length} pageSize={6} itemLabel='disfraces recomendados' />
                </div> : <p className='finderMessage' role='status'>No encontramos talles disponibles para esa combinación. Probá ampliar el estilo o cambiar las fechas.</p>)}
                <p className='finderFootnote'>La disponibilidad es orientativa y el local confirma cada solicitud antes de reservar.</p>
            </section>
        </div>
    )
}
