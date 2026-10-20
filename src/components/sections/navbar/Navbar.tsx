'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useCart } from '@/components/cart/CartProvider'
import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import type { StoreCatalogCostume } from '@/lib/store-catalog'
import { animateNavbar } from './Navbar.gsap'
import './_navbar.scss'

const links = [
    { label: 'Inicio', href: '/' },
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'Cómo funciona', href: '/#howItWorks' },
    { label: 'Preguntas frecuentes', href: '/#faq' },
    { label: 'Contacto', href: '/#contacto' },
]

function isLinkActive(href: string, pathname: string, activeSection: string) {
    if (href === '/') return pathname === '/' && (!activeSection || activeSection === 'inicio')
    if (href === '/catalogo') return pathname === '/catalogo' || (pathname === '/' && activeSection === 'catalogo')
    if (href === '/#howItWorks') return pathname === '/' && activeSection === 'howItWorks'
    if (href === '/#faq') return pathname === '/' && activeSection === 'faq'
    if (href === '/#contacto') return pathname === '/' && activeSection === 'contacto'
    return false
}

type NavbarProps = { whatsappNumber?: string; costumes: StoreCatalogCostume[] }

export default function Navbar({ whatsappNumber, costumes }: NavbarProps) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isFixed, setIsFixed] = useState(false)
    const [activeSection, setActiveSection] = useState('')
    const pathname = usePathname()
    const phone = whatsappNumber?.replace(/\D/g, '')
    const { itemCount, openCart } = useCart()
    const suggestions = useMemo(() => {
        const normalize = (value: string) => value.toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{Diacritic}/gu, '')
        const query = normalize(searchQuery.trim())
        if (query.length < 2) return []
        return costumes.filter((costume) => costume.isActive
            && normalize(`${costume.name} ${costume.category.name}`).includes(query)).slice(0, 5)
    }, [costumes, searchQuery])

    useGsapSection('.navbarContainer', animateNavbar)

    useEffect(() => {
        const banner = document.querySelector<HTMLElement>('.bannerContainer')
        const updatePosition = () => {
            const bannerHeight = banner?.getBoundingClientRect().height ?? 0
            document.documentElement.style.setProperty('--banner-height', `${bannerHeight}px`)
            const fixed = window.scrollY >= bannerHeight
            setIsFixed(fixed)
        }

        updatePosition()
        const bannerObserver = banner && typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(updatePosition)
            : null
        if (banner) bannerObserver?.observe(banner)
        window.addEventListener('scroll', updatePosition, { passive: true })
        window.addEventListener('resize', updatePosition)

        return () => {
            window.removeEventListener('scroll', updatePosition)
            window.removeEventListener('resize', updatePosition)
            bannerObserver?.disconnect()
        }
    }, [])

    useEffect(() => {
        if (pathname !== '/') return

        const sectionIds = ['featuredCostumes', 'howItWorks', 'faq', 'contacto']
        const sections = sectionIds.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null)
        const observer = new IntersectionObserver(() => {
            const visibleSections = sections
                .filter((section) => section.getBoundingClientRect().top <= window.innerHeight * 0.35)
                .filter((section) => section.getBoundingClientRect().bottom > window.innerHeight * 0.2)

            const currentSection = visibleSections.at(-1)
            setActiveSection(currentSection?.id === 'featuredCostumes' ? 'catalogo' : currentSection?.id || 'inicio')
        }, { threshold: [0, 0.01], rootMargin: '-20% 0px -65% 0px' })

        sections.forEach((section) => observer.observe(section))
        return () => observer.disconnect()
    }, [pathname])

    return (
        <div className={`navbarSlot${menuOpen ? ' isMenuOpen' : ''}${searchOpen ? ' isSearchOpen' : ''}`}>
        <nav className={`navbarContainer${isFixed ? ' isFixed' : ''}`} aria-label='Navegación principal'>
            <div className='navbarContent'>
                <Link className='navbarBrand' href='/' aria-label='Disfraces Hechizos, inicio'>
                    <span className='brandEyebrow'>disfraces</span>
                    <span className='brandName'>Hechizos <span aria-hidden='true'>✦</span></span>
                </Link>

                <button className='navbarToggle' type='button' aria-expanded={menuOpen}
                    aria-controls='navbarLinks' aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
                    onClick={() => setMenuOpen(!menuOpen)}>
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' aria-hidden='true'>
                        <path d={menuOpen ? 'M6 6l12 12M6 18L18 6' : 'M4 6h16M4 12h16M4 18h16'} />
                    </svg>
                </button>

                <ul id='navbarLinks' className={`navbarLinks${menuOpen ? ' isOpen' : ''}`}>
                    {links.map(({ label, href }) => {
                        const active = isLinkActive(href, pathname, activeSection)
                        return <li key={label}>
                            <Link href={href} onClick={() => setMenuOpen(false)}
                                className={active ? 'isActive' : undefined}
                                aria-current={active ? 'location' : undefined}>
                                {label}
                            </Link>
                        </li>
                    })}
                </ul>

                <div className='navbarActions'>
                    <button className='searchToggle' type='button' aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar disfraces'}
                        aria-expanded={searchOpen} aria-controls='navbarSearch' onClick={() => setSearchOpen(!searchOpen)}>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' aria-hidden='true'>
                            <circle cx='10.5' cy='10.5' r='7' /><path d='m16 16 5 5' />
                        </svg>
                    </button>
                    <button className='navbarCartButton' type='button' onClick={(event) => openCart(event.currentTarget)} aria-haspopup='dialog' aria-label={`Abrir carrito, ${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' aria-hidden='true'>
                            <path d='M3 4h2l2.1 11.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 1.9-1.4L22 9H6' strokeLinecap='round' strokeLinejoin='round' />
                            <circle cx='10' cy='20' r='1' /><circle cx='18' cy='20' r='1' />
                        </svg>
                        <span>Carrito</span><strong>{itemCount}</strong>
                    </button>
                    <a className='whatsappButton' href={phone ? `https://wa.me/${phone}` : undefined}
                        aria-disabled={!phone} target={phone ? '_blank' : undefined} rel={phone ? 'noopener noreferrer' : undefined}>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.6' aria-hidden='true'>
                            <path d='M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z' />
                            <path d='M9 8c0 3.5 2 5.5 5 6l1-1.5-2-1-1 1M9 8l1 2-1 1' strokeLinecap='round' strokeLinejoin='round' />
                        </svg>
                        Consultar por WhatsApp
                    </a>
                </div>

                <form id='navbarSearch' className='navbarSearch' action='/catalogo' method='get' hidden={!searchOpen} onSubmit={() => setSearchOpen(false)}>
                    <label htmlFor='costumeSearch'>Buscá tu próximo personaje</label>
                    <div className='searchFields'>
                        <input id='costumeSearch' name='q' type='search' role='combobox' aria-autocomplete='list'
                            aria-expanded={searchOpen && searchQuery.trim().length >= 2} aria-controls='costumeSuggestions'
                            value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)}
                            onKeyDown={(event) => { if (event.key === 'Escape') setSearchQuery('') }}
                            placeholder='¿Qué disfraz buscás?' required />
                        <button type='submit'>Buscar</button>
                    </div>
                    {searchQuery.trim().length >= 2 && (
                        <ul className='searchSuggestions' id='costumeSuggestions' role='listbox' aria-label='Disfraces sugeridos'>
                            {suggestions.length ? suggestions.map((costume) => {
                                const image = costume.images[0]
                                return (
                                    <li key={costume.id}>
                                        <Link role='option' aria-selected='false'
                                            href={`/catalogo?q=${encodeURIComponent(costume.name)}&costume=${encodeURIComponent(costume.slug)}`}
                                            onClick={() => setSearchOpen(false)}>
                                            <Image src={image.url} alt='' width={48} height={56} />
                                            <span><strong>{costume.name}</strong><small>{costume.category.name}</small></span>
                                            <span className='suggestionArrow' aria-hidden='true'>→</span>
                                        </Link>
                                    </li>
                                )
                            }) : (
                                <li className='searchNoResults'>No encontramos coincidencias. Podés ver todos los resultados en el catálogo.</li>
                            )}
                        </ul>
                    )}
                </form>
            </div>
        </nav>
        </div>
    )
}
