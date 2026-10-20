'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { formatARS } from '@/lib/formatters'
import { formatWhatsAppMessage } from '@/lib/whatsapp-message'
import type { StoreCatalogCostume } from '@/lib/store-catalog'
import './_cart.scss'

type CartItem = { costumeId: string; variantId: string; size: string; quantity: number; pickupDate: string; returnDate: string }
type CartContextValue = {
    items: CartItem[]
    itemCount: number
    addItem: (costumeId: string, variantId: string, size: string, pickupDate: string, returnDate: string) => void
    removeItem: (item: CartItem) => void
    changeQuantity: (item: CartItem, amount: number) => void
    openCart: (trigger?: HTMLElement) => void
}
type RequestResponse = { success: boolean; message: string }

const CartContext = createContext<CartContextValue | null>(null)
const CART_STORAGE_KEY = 'disfraces-hechizos.cart.v1'
const dateFormat = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const formatDate = (value: string) => dateFormat.format(new Date(`${value}T00:00:00.000Z`))

export function useCart() {
    const context = useContext(CartContext)
    if (!context) throw new Error('useCart debe utilizarse dentro de CartProvider')
    return context
}

export default function CartProvider({ children, whatsappNumber, costumes }: { children: ReactNode; whatsappNumber: string; costumes: StoreCatalogCostume[] }) {
    const router = useRouter()
    const [items, setItems] = useState<CartItem[]>([])
    const [cartLoaded, setCartLoaded] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [toastMessage, setToastMessage] = useState('')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerEmail, setCustomerEmail] = useState('')
    const [notes, setNotes] = useState('')
    const [checkingAvailability, setCheckingAvailability] = useState(false)
    const [availabilityMessage, setAvailabilityMessage] = useState('')
    const [whatsappLink, setWhatsappLink] = useState('')
    const costumesRef = useRef(costumes)
    const drawerRef = useRef<HTMLElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const phone = whatsappNumber.replace(/\D/g, '')
    const itemCount = items.reduce((count, item) => count + item.quantity, 0)
    const total = useMemo(() => items.reduce((sum, item) => {
        const costume = costumes.find(({ id }) => id === item.costumeId)
        return sum + (costume?.rentalPrice ?? 0) * item.quantity
    }, 0), [costumes, items])

    function restoreCart(serialized: string | null) {
        if (!serialized) { setItems([]); return }
        try {
            const saved: unknown = JSON.parse(serialized)
            if (!Array.isArray(saved)) { setItems([]); return }
            const restored = saved.flatMap((entry): CartItem[] => {
                if (!entry || typeof entry !== 'object') return []
                const item = entry as Partial<CartItem>
                if (typeof item.costumeId !== 'string' || typeof item.variantId !== 'string' || typeof item.size !== 'string' || typeof item.pickupDate !== 'string' || typeof item.returnDate !== 'string' || !Number.isInteger(item.quantity) || (item.quantity ?? 0) < 1) return []
                const costume = costumesRef.current.find(({ id }) => id === item.costumeId)
                const variant = costume?.variants.find(({ id, size }) => id === item.variantId && size === item.size)
                if (!costume || !variant || variant.stockQuantity < 1) return []
                return [{ costumeId: item.costumeId!, variantId: item.variantId!, size: item.size!, pickupDate: item.pickupDate!, returnDate: item.returnDate!, quantity: Math.min(item.quantity!, variant.stockQuantity) }]
            })
            setItems(restored)
        } catch {
            setItems([])
        }
    }

    useEffect(() => {
        const restoreTimeout = window.setTimeout(() => {
            restoreCart(window.localStorage.getItem(CART_STORAGE_KEY))
            setCartLoaded(true)
        }, 0)
        function syncCart(event: StorageEvent) {
            if (event.key === CART_STORAGE_KEY) restoreCart(event.newValue)
        }
        window.addEventListener('storage', syncCart)
        return () => {
            window.clearTimeout(restoreTimeout)
            window.removeEventListener('storage', syncCart)
        }
    // Read once on mount; catalog refreshes should not overwrite the saved cart.
    }, [])

    useEffect(() => {
        if (!cartLoaded) return
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    }, [cartLoaded, items])

    useEffect(() => {
        costumesRef.current = costumes
        if (!cartLoaded) return
        const reconcileTimeout = window.setTimeout(() => {
            setItems((current) => current.flatMap((item) => {
                const costume = costumes.find(({ id }) => id === item.costumeId)
                const variant = costume?.variants.find(({ id }) => id === item.variantId)
                if (!variant || variant.stockQuantity < 1) return []
                return [{ ...item, size: variant.size, quantity: Math.min(item.quantity, variant.stockQuantity) }]
            }))
        }, 0)
        return () => window.clearTimeout(reconcileTimeout)
    }, [cartLoaded, costumes])

    useEffect(() => {
        const refreshStoreData = () => {
            if (document.visibilityState === 'visible') router.refresh()
        }
        const interval = window.setInterval(refreshStoreData, 30_000)
        return () => window.clearInterval(interval)
    }, [router])

    useEffect(() => {
        if (!isOpen) return
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        drawerRef.current?.focus()
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setIsOpen(false)
            if (event.key !== 'Tab' || !drawerRef.current) return
            const focusable = drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled)')
            const first = focusable[0]
            const last = focusable[focusable.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKeyDown)
            previousFocusRef.current?.focus()
        }
    }, [isOpen])

    useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current) }, [])

    function invalidateAvailability() {
        setAvailabilityMessage('')
        setWhatsappLink('')
    }

    function notify(message: string) {
        setToastMessage(message)
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 3200)
    }

    function addItem(costumeId: string, variantId: string, size: string, pickupDate: string, returnDate: string) {
        const costume = costumes.find(({ id }) => id === costumeId)
        const variant = costume?.variants.find(({ id }) => id === variantId)
        if (!costume || !variant || !pickupDate || !returnDate) return
        const keyMatches = (item: CartItem) => item.costumeId === costumeId && item.variantId === variantId && item.pickupDate === pickupDate && item.returnDate === returnDate
        const alreadyAdded = items.some(keyMatches)
        const existing = items.find(keyMatches)
        if (variant.stockQuantity < 1 || (existing?.quantity ?? 0) >= variant.stockQuantity) {
            notify(variant.stockQuantity < 1 ? `No hay unidades cargadas para el talle ${size}` : `Alcanzaste el stock de ${costume.name}, talle ${size} (${variant.stockQuantity})`)
            return
        }
        setItems((current) => {
            const currentItem = current.find(keyMatches)
            if (currentItem) return current.map((item) => keyMatches(item) ? { ...item, quantity: Math.min(variant.stockQuantity, item.quantity + 1) } : item)
            return [...current, { costumeId, variantId, size, pickupDate, returnDate, quantity: 1 }]
        })
        invalidateAvailability()
        notify(alreadyAdded ? `Se actualizó la cantidad de ${costume.name}` : `${costume.name} se agregó al carrito`)
    }

    function removeItem(target: CartItem) {
        setItems((current) => current.filter((item) => item !== target))
        invalidateAvailability()
    }

    function changeQuantity(target: CartItem, amount: number) {
        const costume = costumes.find(({ id }) => id === target.costumeId)
        const variant = costume?.variants.find(({ id }) => id === target.variantId)
        const currentItem = items.find((item) => item === target)
        if (amount > 0 && currentItem && variant && currentItem.quantity >= variant.stockQuantity) {
            notify(`Alcanzaste el stock de ${costume?.name}, talle ${target.size} (${variant.stockQuantity})`)
            return
        }
        setItems((current) => current.flatMap((item) => {
            if (item !== target) return [item]
            const quantity = item.quantity + amount
            return quantity > 0 ? [{ ...item, quantity: amount > 0 ? Math.min(variant?.stockQuantity ?? quantity, quantity) : quantity }] : []
        }))
        invalidateAvailability()
    }

    function openCart(trigger?: HTMLElement) {
        previousFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
        setIsOpen(true)
    }

    function finishCartInquiry() {
        setItems([])
        invalidateAvailability()
        setAvailabilityMessage('')
        setIsOpen(false)
    }

    async function verifyAndPrepareInquiry() {
        if (!phone || !customerName.trim() || !customerPhone.trim() || items.length === 0) return
        setCheckingAvailability(true)
        invalidateAvailability()
        try {
            const response = await fetch('/api/rental-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName, customerPhone, customerEmail, notes,
                    items: items.map(({ variantId, quantity, pickupDate, returnDate }) => ({ variantId, quantity, pickupDate, returnDate })),
                }),
            })
            const result = await response.json() as RequestResponse
            setAvailabilityMessage(result.message || 'No se pudo verificar la disponibilidad.')
            if (!response.ok || !result.success) return

            const lineItems = items.map((item) => {
                const costume = costumes.find(({ id }) => id === item.costumeId)
                return costume ? `• ${costume.name} — talle ${item.size} — desde ${formatDate(item.pickupDate)} hasta ${formatDate(item.returnDate)} — cantidad ${item.quantity} — ${formatARS(costume.rentalPrice * item.quantity)}` : ''
            }).filter(Boolean)
            const message = formatWhatsAppMessage([
                'Hola, quisiera consultar disponibilidad para un alquiler:',
                [`Nombre: ${customerName.trim()}`, `Teléfono: ${customerPhone.trim()}`, customerEmail.trim() ? `Email: ${customerEmail.trim()}` : ''].filter(Boolean).join('\n'),
                lineItems.join('\n'),
                [`Total orientativo: ${formatARS(total)}`, notes.trim() ? `Aclaraciones: ${notes.trim()}` : ''].filter(Boolean).join('\n'),
                'Entiendo que la disponibilidad y las condiciones se confirman con el local.',
            ])
            setWhatsappLink(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`)
        } catch {
            setAvailabilityMessage('No se pudo verificar la disponibilidad ahora. Volvé a intentar.')
        } finally {
            setCheckingAvailability(false)
        }
    }

    const value: CartContextValue = { items, itemCount, addItem, removeItem, changeQuantity, openCart }

    return (
        <CartContext.Provider value={value}>
            {children}
            {isOpen && (
                <div className='cartDrawerBackdrop' onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}>
                    <section className='cartDrawer' role='dialog' aria-modal='true' aria-labelledby='cartDrawerTitle' tabIndex={-1} ref={drawerRef}>
                        <header className='cartDrawerHeader'>
                            <div><p>Tu selección</p><h2 id='cartDrawerTitle'>Carrito <span>({itemCount})</span></h2></div>
                            <button type='button' onClick={() => setIsOpen(false)} aria-label='Cerrar carrito'>×</button>
                        </header>
                        {items.length ? (
                            <>
                                <ul className='cartDrawerItems'>
                                    {items.map((item, index) => {
                                        const costume = costumes.find(({ id }) => id === item.costumeId)
                                        if (!costume) return null
                                        const variant = costume.variants.find(({ id }) => id === item.variantId)
                                        const stockQuantity = variant?.stockQuantity ?? 0
                                        const image = costume.images[0]
                                        return (
                                            <li key={`${item.variantId}-${item.pickupDate}-${item.returnDate}-${index}`}>
                                                <Image src={image?.url ?? '/images/hero-disfraces.webp'} alt={image?.altText ?? ''} width={76} height={92} />
                                                <div className='cartItemInfo'>
                                                    <h3>{costume.name}</h3>
                                                    <p>Talle {item.size} · {formatARS(costume.rentalPrice)} c/u</p>
                                                    <p className='cartItemDates'>Desde {formatDate(item.pickupDate)} · Hasta {formatDate(item.returnDate)}</p>
                                                    <div className='cartQuantity' aria-label={`Cantidad de ${costume.name}`}>
                                                        <button type='button' onClick={() => changeQuantity(item, -1)} aria-label='Quitar una unidad'>−</button>
                                                        <span>{item.quantity}<small>de {stockQuantity}</small></span>
                                                        <button type='button' onClick={() => changeQuantity(item, 1)} disabled={item.quantity >= stockQuantity} aria-label='Agregar una unidad'>+</button>
                                                    </div>
                                                </div>
                                                <div className='cartItemEnd'><strong>{formatARS(costume.rentalPrice * item.quantity)}</strong><button type='button' onClick={() => removeItem(item)}>Quitar</button></div>
                                            </li>
                                        )
                                    })}
                                </ul>
                                <form className='cartRequestForm' onSubmit={(event) => { event.preventDefault(); void verifyAndPrepareInquiry() }}>
                                    <h3>Datos para la consulta</h3>
                                    <label>Nombre y apellido<input required autoComplete='name' value={customerName} disabled={Boolean(whatsappLink)} onChange={(event) => { setCustomerName(event.target.value); setWhatsappLink('') }} /></label>
                                    <label>Teléfono<input required type='tel' autoComplete='tel' value={customerPhone} disabled={Boolean(whatsappLink)} onChange={(event) => { setCustomerPhone(event.target.value); setWhatsappLink('') }} /></label>
                                    <label>Email <span>(opcional)</span><input type='email' autoComplete='email' value={customerEmail} disabled={Boolean(whatsappLink)} onChange={(event) => { setCustomerEmail(event.target.value); setWhatsappLink('') }} /></label>
                                    <label>Aclaraciones <span>(opcional)</span><textarea rows={2} value={notes} disabled={Boolean(whatsappLink)} onChange={(event) => { setNotes(event.target.value); setWhatsappLink('') }} placeholder='Contanos algún detalle sobre el alquiler...' /></label>
                                    <p className='cartSchemaNotice'>La consulta no confirma una reserva. El local verificará disponibilidad y condiciones.</p>
                                    {availabilityMessage && <p className={`cartAvailabilityNotice${whatsappLink ? ' isAvailable' : ''}`} role='status'>{availabilityMessage}</p>}
                                    <div className='cartDrawerFooter'>
                                        <p><span>Total orientativo</span><strong>{formatARS(total)}</strong></p>
                                        {!whatsappLink && <button type='submit' disabled={!phone || !customerName.trim() || !customerPhone.trim() || checkingAvailability || items.some((item) => !item.pickupDate || !item.returnDate)}>
                                            {checkingAvailability ? 'Registrando solicitud…' : 'Registrar solicitud'}
                                        </button>
                                        }
                                        {whatsappLink && <a className='cartWhatsAppLink' href={whatsappLink} target='_blank' rel='noopener noreferrer' onClick={finishCartInquiry}>Consultar por WhatsApp</a>}
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className='cartDrawerEmpty'><p>Tu carrito está vacío.</p><span>Agregá disfraces desde el detalle de cada producto.</span><button type='button' onClick={() => setIsOpen(false)}>Seguir explorando</button></div>
                        )}
                    </section>
                </div>
            )}
            {toastMessage && <div className='cartToast' role='status' aria-live='polite'><span aria-hidden='true'>✓</span><p>{toastMessage}</p><button type='button' onClick={() => setToastMessage('')} aria-label='Cerrar aviso'>×</button><div className='cartToastProgress' /></div>}
        </CartContext.Provider>
    )
}
