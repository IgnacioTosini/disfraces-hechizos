'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import RentalDatePicker, { type BusyRentalRange } from '@/components/sections/catalog/RentalDatePicker'
import Pagination from '@/components/ui/pagination/Pagination'
import { usePaginatedItems } from '@/components/ui/pagination/usePaginatedItems'
import type { StoreCatalogCostume } from '@/lib/store-catalog'
import { formatARS } from '@/lib/formatters'
import { animateCatalogResults } from './Catalog.gsap'
import './_catalog.scss'

type AudienceFilter = 'ALL' | 'ADULT' | 'CHILD'
type AvailabilityResult = { available: boolean; availableUnits?: number; message: string }
type RequestResult = { success: boolean; message: string }
type CalendarResult = { from: string; through: string; stockQuantity: number; reservations: BusyRentalRange[]; message?: string }

const dateFormat = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const formatDate = (value: string) => dateFormat.format(new Date(`${value}T00:00:00.000Z`))

function localToday() {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function dateAfterToday(days: number) {
    const date = new Date(`${localToday()}T00:00:00.000Z`)
    date.setUTCDate(date.getUTCDate() + days)
    return date.toISOString().slice(0, 10)
}

export default function Catalog({ whatsappNumber, costumes: catalogCostumes, loadError = false, initialAudience = 'ALL', initialQuery = '', initialCostumeSlug }: { whatsappNumber: string; costumes: StoreCatalogCostume[]; loadError?: boolean; initialAudience?: AudienceFilter; initialQuery?: string; initialCostumeSlug?: string }) {
    const [query, setQuery] = useState(initialQuery)
    const [audience, setAudience] = useState<AudienceFilter>(initialAudience)
    const [categoryId, setCategoryId] = useState('ALL')
    const [size, setSize] = useState('ALL')
    const [draftAudience, setDraftAudience] = useState<AudienceFilter>(initialAudience)
    const [draftCategoryId, setDraftCategoryId] = useState('ALL')
    const [draftSize, setDraftSize] = useState('ALL')
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [sort, setSort] = useState('name-asc')
    const [selectedCostumeId, setSelectedCostumeId] = useState<string | null>(() => catalogCostumes.find(({ slug }) => slug === initialCostumeSlug)?.id ?? null)
    const [imageExpanded, setImageExpanded] = useState(false)
    const [selectedVariantSize, setSelectedVariantSize] = useState('')
    const [pickupDate, setPickupDate] = useState('')
    const [returnDate, setReturnDate] = useState('')
    const [availability, setAvailability] = useState<AvailabilityResult | null>(null)
    const [checkingAvailability, setCheckingAvailability] = useState(false)
    const [calendar, setCalendar] = useState<CalendarResult | null>(null)
    const [calendarLoading, setCalendarLoading] = useState(false)
    const [calendarError, setCalendarError] = useState('')
    const [inquiryFormOpen, setInquiryFormOpen] = useState(false)
    const [registeringInquiry, setRegisteringInquiry] = useState(false)
    const [inquiryResult, setInquiryResult] = useState('')
    const [inquiryWhatsAppLink, setInquiryWhatsAppLink] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [inquiryNotes, setInquiryNotes] = useState('')
    const modalRef = useRef<HTMLElement>(null)
    const imageExpandedRef = useRef(false)
    const imageButtonRef = useRef<HTMLButtonElement>(null)
    const imageViewerCloseRef = useRef<HTMLButtonElement>(null)
    const wasImageExpandedRef = useRef(false)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const filtersRef = useRef<HTMLElement>(null)
    const previousFiltersFocusRef = useRef<HTMLElement | null>(null)
    const calendarRequestRef = useRef<AbortController | null>(null)
    const { addItem } = useCart()
    const categoryOptions = useMemo(() => [...new Map(catalogCostumes.map(({ category }) => [category.id, category])).values()], [catalogCostumes])
    const sizeOptions = useMemo(() => [...new Set(catalogCostumes.flatMap(({ variants }) => variants.map(({ size }) => size)))], [catalogCostumes])

    const costumes = useMemo(() => {
        const filtered = catalogCostumes.filter((costume) =>
            costume.isActive
            && (audience === 'ALL' || costume.audience === audience || costume.audience === 'UNISEX')
            && (categoryId === 'ALL' || costume.categoryId === categoryId)
            && (size === 'ALL' || costume.variants.some((variant) => variant.isActive && variant.size === size))
            && costume.name.toLocaleLowerCase('es-AR').includes(query.trim().toLocaleLowerCase('es-AR')),
        )

        return filtered.sort((a, b) => {
            if (sort === 'name-desc') return b.name.localeCompare(a.name, 'es')
            if (sort === 'price-asc') return a.rentalPrice - b.rentalPrice
            if (sort === 'price-desc') return b.rentalPrice - a.rentalPrice
            return a.name.localeCompare(b.name, 'es')
        })
    }, [audience, catalogCostumes, categoryId, query, size, sort])
    const catalogPagination = usePaginatedItems(costumes, 9, JSON.stringify([query, audience, categoryId, size, sort]))
    const catalogAnimationKey = `${catalogPagination.page}:${costumes.map(({ id }) => id).join(',')}`
    useGsapSection('.catalogResults', animateCatalogResults, catalogAnimationKey)

    const phone = whatsappNumber.replace(/\D/g, '')
    const selectedCostume = catalogCostumes.find(({ id }) => id === selectedCostumeId)
    const selectedCostumeImage = selectedCostume?.images[0]
    const activeVariants = selectedCostume?.variants.filter((variant) => variant.isActive) ?? []
    const activeFilterCount = [audience !== 'ALL', categoryId !== 'ALL', size !== 'ALL'].filter(Boolean).length
    useEffect(() => {
        if (imageExpanded) imageViewerCloseRef.current?.focus()
        else if (wasImageExpandedRef.current) imageButtonRef.current?.focus()
        wasImageExpandedRef.current = imageExpanded
    }, [imageExpanded])

    useEffect(() => {
        if (!filtersOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        filtersRef.current?.querySelector<HTMLElement>('header button')?.focus()
        function handleEscape(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setFiltersOpen(false)
                return
            }
            if (event.key !== 'Tab' || !filtersRef.current) return
            const focusable = filtersRef.current.querySelectorAll<HTMLElement>(
                'button:not(:disabled)',
            )
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first?.focus()
            }
        }
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleEscape)
            previousFiltersFocusRef.current?.focus()
        }
    }, [filtersOpen])

    useEffect(() => {
        if (!selectedCostume) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        modalRef.current?.focus()
        const earliestDate = localToday()
        modalRef.current?.querySelectorAll<HTMLInputElement>('.costumeModalDates input[type="date"]').forEach((input) => {
            if (!input.min || input.min < earliestDate) input.min = earliestDate
        })

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                if (imageExpandedRef.current) {
                    imageExpandedRef.current = false
                    setImageExpanded(false)
                }
                else setSelectedCostumeId(null)
                return
            }
            if (event.key !== 'Tab' || !modalRef.current) return

            if (imageExpandedRef.current) {
                event.preventDefault()
                imageViewerCloseRef.current?.focus()
                return
            }

            const focusable = modalRef.current.querySelectorAll<HTMLElement>(
                'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)',
            )
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first?.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
            previousFocusRef.current?.focus()
        }
    }, [selectedCostume])

    function openCostume(costumeId: string, trigger: HTMLElement) {
        const costume = catalogCostumes.find(({ id }) => id === costumeId)
        const initialVariant = costume?.variants.find(({ isActive }) => isActive)
        previousFocusRef.current = trigger
        imageExpandedRef.current = false
        setImageExpanded(false)
        setSelectedVariantSize(initialVariant?.size ?? '')
        setPickupDate('')
        setReturnDate('')
        resetInquiryState()
        if (costume && initialVariant) void loadCalendar(costume.slug, initialVariant.size)
        setSelectedCostumeId(costumeId)
    }

    function resetInquiryState() {
        setAvailability(null)
        setInquiryResult('')
        setInquiryWhatsAppLink('')
        setInquiryFormOpen(false)
    }

    function closeCostume() {
        calendarRequestRef.current?.abort()
        imageExpandedRef.current = false
        setImageExpanded(false)
        setSelectedCostumeId(null)
    }

    function openImageViewer() {
        imageExpandedRef.current = true
        setImageExpanded(true)
    }

    function closeImageViewer() {
        imageExpandedRef.current = false
        setImageExpanded(false)
    }

    function handleVariantSizeClick(event: MouseEvent<HTMLButtonElement>) {
        if (!selectedCostume) return
        const size = event.currentTarget.dataset.size
        if (!size) return
        setSelectedVariantSize(size)
        resetInquiryState()
        void loadCalendar(selectedCostume.slug, size)
    }

    async function loadCalendar(slug: string, selectedSize: string) {
        calendarRequestRef.current?.abort()
        const controller = new AbortController()
        calendarRequestRef.current = controller
        setCalendar(null)
        setCalendarError('')
        setCalendarLoading(true)
        try {
            const params = new URLSearchParams({ slug, size: selectedSize })
            const response = await fetch(`/api/availability/calendar?${params.toString()}`, { signal: controller.signal })
            const result = await response.json() as CalendarResult
            if (!response.ok) throw new Error(result.message || 'No se pudieron cargar las fechas.')
            setCalendar(result)
        } catch (error) {
            if (!controller.signal.aborted) setCalendarError(error instanceof Error ? error.message : 'No se pudieron cargar las fechas.')
        } finally {
            if (!controller.signal.aborted) setCalendarLoading(false)
        }
    }

    function addToCart() {
        if (!selectedCostume || !selectedVariantSize || !availability?.available || !pickupDate || !returnDate) return
        const variant = selectedCostume.variants.find(({ size, isActive }) => isActive && size === selectedVariantSize)
        if (!variant) return
        addItem(selectedCostume.id, variant.id, selectedVariantSize, pickupDate, returnDate)
        closeCostume()
    }

    async function registerIndividualInquiry(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        if (!selectedCostume || !availability?.available || !selectedVariantSize || !pickupDate || !returnDate || !customerName.trim() || !customerPhone.trim()) return
        const variant = selectedCostume.variants.find(({ size, isActive }) => isActive && size === selectedVariantSize)
        if (!variant) return
        setRegisteringInquiry(true)
        setInquiryResult('')
        setInquiryWhatsAppLink('')
        try {
            const response = await fetch('/api/rental-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName, customerPhone, customerEmail, notes: inquiryNotes,
                    items: [{ variantId: variant.id, quantity: 1, pickupDate, returnDate }],
                }),
            })
            const result = await response.json() as RequestResult
            setInquiryResult(result.message)
            if (!response.ok || !result.success || !phone) return
            const message = [
                'Hola, quisiera consultar el alquiler:',
                `Nombre: ${customerName.trim()}`,
                `Teléfono: ${customerPhone.trim()}`,
                customerEmail.trim() ? `Email: ${customerEmail.trim()}` : '',
                `Disfraz: ${selectedCostume.name}`,
                `Talle: ${selectedVariantSize}`,
                `Desde: ${formatDate(pickupDate)}`,
                `Hasta: ${formatDate(returnDate)}`,
                inquiryNotes.trim() ? `Aclaraciones: ${inquiryNotes.trim()}` : '',
                '', 'La consulta queda pendiente de confirmación del local.',
            ].filter(Boolean).join('\n')
            setInquiryWhatsAppLink(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
        } catch {
            setInquiryResult('No se pudo registrar la consulta. Volvé a intentar.')
        } finally {
            setRegisteringInquiry(false)
        }
    }

    async function checkAvailability() {
        if (!selectedCostume || !selectedVariantSize || !pickupDate || !returnDate || returnDate < pickupDate) return
        setCheckingAvailability(true)
        setAvailability(null)
        try {
            const params = new URLSearchParams({ slug: selectedCostume.slug, size: selectedVariantSize, pickupDate, returnDate })
            const response = await fetch(`/api/availability?${params.toString()}`)
            const result = await response.json() as AvailabilityResult
            setAvailability(result)
        } catch {
            setAvailability({ available: false, message: 'No se pudo consultar ahora. Volvé a intentar en unos segundos.' })
        } finally {
            setCheckingAvailability(false)
        }
    }

    function openFilters(trigger: HTMLElement) {
        previousFiltersFocusRef.current = trigger
        setDraftAudience(audience)
        setDraftCategoryId(categoryId)
        setDraftSize(size)
        setFiltersOpen(true)
    }

    function applyFilters() {
        setAudience(draftAudience)
        setCategoryId(draftCategoryId)
        setSize(draftSize)
        setFiltersOpen(false)
    }

    function clearDraftFilters() {
        setDraftAudience('ALL')
        setDraftCategoryId('ALL')
        setDraftSize('ALL')
    }

    return (
        <main className='catalogContainer'>
            <div className='catalogInner'>
                <header className='catalogHeader'>
                    <p className='catalogEyebrow'>Catálogo</p>
                    <div className='catalogTitleRow'>
                        <h1>Encontrá tu próximo disfraz</h1>
                        <label className='catalogSearch'>
                            <span aria-hidden='true'>⌕</span>
                            <input type='search' value={query} onChange={(event) => setQuery(event.target.value)} placeholder='Buscar por nombre...' />
                        </label>
                    </div>
                </header>

                <div className='catalogLayout'>
                    <aside className='catalogFilters' aria-label='Filtros del catálogo'>
                        <h2>Filtros</h2>
                        <fieldset>
                            <legend>Público</legend>
                            <div className='filterOptions'>
                                {([['ALL', 'Todos'], ['ADULT', 'Adultos'], ['CHILD', 'Infantil']] as const).map(([value, label]) => (
                                    <button className={audience === value ? 'isSelected' : ''} type='button' key={value} onClick={() => setAudience(value)}>{label}</button>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Categoría</legend>
                            <div className='filterOptions'>
                                <button className={categoryId === 'ALL' ? 'isSelected' : ''} type='button' onClick={() => setCategoryId('ALL')}>Todas</button>
                                {categoryOptions.map((category) => (
                                    <button className={categoryId === category.id ? 'isSelected' : ''} type='button' key={category.id} onClick={() => setCategoryId(category.id)}>{category.name}</button>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Talle</legend>
                            <div className='filterOptions'>
                                <button className={size === 'ALL' ? 'isSelected' : ''} type='button' onClick={() => setSize('ALL')}>Todos</button>
                                {sizeOptions.map((option) => (
                                    <button className={size === option ? 'isSelected' : ''} type='button' key={option} onClick={() => setSize(option)}>{option}</button>
                                ))}
                            </div>
                        </fieldset>
                    </aside>

                    <section className='catalogResults' aria-label='Disfraces disponibles'>
                        <div className='catalogToolbar'>
                            <p><strong>{costumes.length}</strong> {costumes.length === 1 ? 'disfraz encontrado' : 'disfraces encontrados'}</p>
                            <button className='mobileFilterButton' type='button' onClick={(event) => openFilters(event.currentTarget)}>
                                Filtros{activeFilterCount ? ` (${activeFilterCount})` : ''}
                            </button>
                            <label>Ordenar por
                                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                                    <option value='name-asc'>Nombre: A–Z</option>
                                    <option value='name-desc'>Nombre: Z–A</option>
                                    <option value='price-asc'>Precio: menor a mayor</option>
                                    <option value='price-desc'>Precio: mayor a menor</option>
                                </select>
                            </label>
                        </div>
                        {loadError ? <p className='catalogEmpty'>No se pudo conectar con el catálogo. Volvé a intentarlo más tarde.</p> : costumes.length ? (
                            <>
                            <div className='costumeGrid'>
                                {catalogPagination.pageItems.map((costume) => {
                                    const image = costume.images[0]
                                    return (
                                        <article className='costumeCard' key={costume.id}>
                                            <div className='costumeImage'>
                                                <Image src={image.url} alt={image.altText} fill sizes='(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 300px' />
                                                <span className='costumeCategory'>{costume.category.name}</span>
                                                <button className='viewCostumeButton' type='button'
                                                    onClick={(event) => openCostume(costume.id, event.currentTarget)}>
                                                    Ver disfraz
                                                </button>
                                            </div>
                                            <div className='costumeInfo'>
                                                <div className='costumeNamePrice'>
                                                    <h3>{costume.name}</h3>
                                                    <p>{formatARS(costume.rentalPrice)}<small>orientativo</small></p>
                                                </div>
                                                <p className='costumeMeta'>{costume.audience === 'CHILD' ? 'INFANTIL' : 'ADULTO'} · {costume.category.name}</p>
                                                <p className='costumeSizes'>Talles para consultar: {costume.variants.filter((variant) => variant.isActive).map(({ size }) => size).join(' · ')}</p>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                            <Pagination page={catalogPagination.page} pageCount={catalogPagination.pageCount} onPageChange={catalogPagination.setPage} itemCount={costumes.length} pageSize={9} itemLabel="disfraces" />
                            </>
                        ) : (
                            <p className='catalogEmpty'>No encontramos disfraces con esos filtros. Probá cambiar la búsqueda.</p>
                        )}
                    </section>
                </div>
            </div>
            {filtersOpen && (
                <div className='mobileFiltersBackdrop' onMouseDown={(event) => {
                    if (event.target === event.currentTarget) setFiltersOpen(false)
                }}>
                    <section className='mobileFiltersPanel' role='dialog' aria-modal='true' aria-labelledby='mobileFiltersTitle' ref={filtersRef} tabIndex={-1}>
                        <header>
                            <h2 id='mobileFiltersTitle'>Filtros</h2>
                            <button type='button' onClick={() => setFiltersOpen(false)} aria-label='Cerrar filtros'>×</button>
                        </header>
                        <div className='mobileFiltersContent'>
                            <fieldset>
                                <legend>Público</legend>
                                <div className='filterOptions'>
                                    {([['ALL', 'Todos'], ['ADULT', 'Adultos'], ['CHILD', 'Infantil']] as const).map(([value, label]) => (
                                        <button className={draftAudience === value ? 'isSelected' : ''} type='button' key={value} onClick={() => setDraftAudience(value)}>{label}</button>
                                    ))}
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>Categoría</legend>
                                <div className='filterOptions'>
                                    <button className={draftCategoryId === 'ALL' ? 'isSelected' : ''} type='button' onClick={() => setDraftCategoryId('ALL')}>Todas</button>
                                    {categoryOptions.map((category) => (
                                        <button className={draftCategoryId === category.id ? 'isSelected' : ''} type='button' key={category.id} onClick={() => setDraftCategoryId(category.id)}>{category.name}</button>
                                    ))}
                                </div>
                            </fieldset>
                            <fieldset>
                                <legend>Talle</legend>
                                <div className='filterOptions'>
                                    <button className={draftSize === 'ALL' ? 'isSelected' : ''} type='button' onClick={() => setDraftSize('ALL')}>Todos</button>
                                    {sizeOptions.map((option) => (
                                        <button className={draftSize === option ? 'isSelected' : ''} type='button' key={option} onClick={() => setDraftSize(option)}>{option}</button>
                                    ))}
                                </div>
                            </fieldset>
                        </div>
                        <footer>
                            <button className='clearFiltersButton' type='button' onClick={clearDraftFilters}>Limpiar</button>
                            <button className='applyFiltersButton' type='button' onClick={applyFilters}>Aplicar filtros</button>
                        </footer>
                    </section>
                </div>
            )}
            {selectedCostume && selectedCostumeImage && (
                    <div className='costumeModalBackdrop' onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeCostume()
                    }}>
                        <section className='costumeModal' role='dialog' aria-modal='true' aria-labelledby='costumeModalTitle' tabIndex={-1} ref={modalRef}>
                            <button className='costumeModalClose' type='button' onClick={closeCostume} aria-label='Cerrar detalle del disfraz' aria-hidden={imageExpanded} inert={imageExpanded}>×</button>
                            <button className='costumeModalImage' type='button' onClick={openImageViewer} aria-label={`Ver imagen completa de ${selectedCostume.name}`} aria-hidden={imageExpanded} inert={imageExpanded} ref={imageButtonRef}>
                                <Image src={selectedCostumeImage.url} alt={selectedCostumeImage.altText} fill sizes='(max-width: 700px) 100vw, 50vw' priority />
                            </button>
                            <div className='costumeModalDetails' aria-hidden={imageExpanded} inert={imageExpanded}>
                                <p className='costumeModalEyebrow'>{selectedCostume.category.name} · {selectedCostume.audience === 'CHILD' ? 'Infantil' : 'Adultos'}</p>
                                <h2 id='costumeModalTitle'>{selectedCostume.name}</h2>
                                <p className='costumeModalDescription'>{selectedCostume.description}</p>
                                <p className='costumeModalPrice'><strong>{formatARS(selectedCostume.rentalPrice)}</strong><span>· precio orientativo de alquiler, a confirmar con el local</span></p>

                                <fieldset className='costumeModalSizes'>
                                    <legend>Talle</legend>
                                    <div>
                                        {activeVariants.map((variant) => (
                                            <button className={selectedVariantSize === variant.size ? 'isSelected' : ''} type='button' key={variant.id}
                                                data-size={variant.size}
                                                aria-pressed={selectedVariantSize === variant.size}
                                                onClick={handleVariantSizeClick}>
                                                {variant.size}
                                            </button>
                                        ))}
                                    </div>
                                </fieldset>

                                <fieldset className='costumeModalDates'>
                                    <legend>Fechas del alquiler</legend>
                                    <RentalDatePicker
                                        from={calendar?.from ?? localToday()}
                                        through={calendar?.through ?? dateAfterToday(365)}
                                        reservations={calendar?.reservations ?? []}
                                        stockQuantity={calendar?.stockQuantity ?? 0}
                                        startDate={pickupDate}
                                        endDate={returnDate}
                                        loading={calendarLoading}
                                        loadError={calendarError}
                                        onStartDate={(date) => { setPickupDate(date); resetInquiryState() }}
                                        onEndDate={(date) => { setReturnDate(date); resetInquiryState() }}
                                    />
                                    <button className='checkAvailabilityButton' type='button' onClick={checkAvailability} disabled={checkingAvailability || !selectedVariantSize || !pickupDate || !returnDate || returnDate < pickupDate}>
                                        {checkingAvailability ? 'Consultando…' : 'Consultar estas fechas'}
                                    </button>
                                    {availability && <p className={`availabilityResult${availability.available ? ' availabilityResult--available' : ' availabilityResult--unavailable'}`} role='status'>{availability.message}</p>}
                                </fieldset>

                                <p className='costumeModalNotice'>La consulta no bloquea unidades. El alquiler queda pendiente hasta que el local confirme y revise el disfraz.</p>
                                {inquiryFormOpen ? (
                                    <form className='costumeInquiryForm' onSubmit={(event) => { void registerIndividualInquiry(event) }}>
                                        <div className='costumeInquiryHeading'><span aria-hidden='true'>✳</span><div><strong>Tus datos de contacto</strong><small>El local los usará para responderte.</small></div></div>
                                        <div className='costumeInquiryFields'>
                                            <label className='costumeModalField'>Nombre y apellido<input required autoComplete='name' value={customerName} disabled={Boolean(inquiryWhatsAppLink)} onChange={(event) => setCustomerName(event.target.value)} placeholder='Ej.: Martina López' /></label>
                                            <label className='costumeModalField'>Teléfono<input required type='tel' autoComplete='tel' value={customerPhone} disabled={Boolean(inquiryWhatsAppLink)} onChange={(event) => setCustomerPhone(event.target.value)} placeholder='+54 9 223 …' /></label>
                                            <label className='costumeModalField'>Email <span>(opcional)</span><input type='email' autoComplete='email' value={customerEmail} disabled={Boolean(inquiryWhatsAppLink)} onChange={(event) => setCustomerEmail(event.target.value)} placeholder='nombre@ejemplo.com' /></label>
                                            <label className='costumeModalField'>Aclaraciones <span>(opcional)</span><textarea rows={2} value={inquiryNotes} disabled={Boolean(inquiryWhatsAppLink)} onChange={(event) => setInquiryNotes(event.target.value)} placeholder='Algún detalle sobre el alquiler…' /></label>
                                        </div>
                                        {inquiryResult && <p className={`inquirySubmitResult${inquiryWhatsAppLink ? ' isSuccess' : ''}`} role='status'>{inquiryResult}</p>}
                                        <div className='costumeModalActions'>
                                            {inquiryWhatsAppLink
                                                ? <a href={inquiryWhatsAppLink} target='_blank' rel='noopener noreferrer'>Abrir WhatsApp</a>
                                                : <button type='submit' disabled={!availability?.available || !customerName.trim() || !customerPhone.trim() || registeringInquiry}>{registeringInquiry ? 'Registrando…' : 'Registrar solicitud'}</button>}
                                            <button type='button' onClick={() => setInquiryFormOpen(false)} disabled={registeringInquiry}>Volver al detalle</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className='costumeModalActions'>
                                        <button type='button' disabled={!availability?.available} onClick={() => setInquiryFormOpen(true)}>Consultar por WhatsApp</button>
                                        <button className='addToCartButton' type='button' disabled={!availability?.available} onClick={addToCart}>Agregar al carrito</button>
                                        <button type='button' onClick={closeCostume}>Seguir explorando</button>
                                    </div>
                                )}
                            </div>
                            {imageExpanded && (
                                <div className='costumeImageViewer' role='group' aria-label={`Imagen completa de ${selectedCostume.name}`} onMouseDown={(event) => {
                                    if (event.target === event.currentTarget) closeImageViewer()
                                }}>
                                    <button className='costumeImageViewerClose' type='button' onClick={closeImageViewer} aria-label='Volver al detalle del disfraz' ref={imageViewerCloseRef}>×</button>
                                    <Image src={selectedCostumeImage.url} alt={selectedCostumeImage.altText} fill sizes='100vw' priority />
                                </div>
                            )}
                        </section>
                    </div>
            )}
        </main>
    )
}
