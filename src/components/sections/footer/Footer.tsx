import Link from 'next/link'
import { cacheLife } from 'next/cache'
import FooterAnimation from './FooterAnimation'
import './_footer.scss'
import type { HomePageCopy } from '@/lib/home-hero'

async function getCurrentYear() {
    'use cache'
    cacheLife({ stale: 86_400, revalidate: 86_400, expire: 31_536_000 })
    return new Date().getFullYear()
}

const navigation = [
    { label: 'Inicio', href: '/' },
    { label: 'Catálogo', href: '/catalogo' },
    { label: 'Cómo funciona', href: '/#howItWorks' },
    { label: 'Preguntas frecuentes', href: '/#faq' },
]

const categories = [
    { label: 'Adultos', href: '/catalogo?audience=ADULT' },
    { label: 'Infantiles', href: '/catalogo?audience=CHILD' },
    { label: 'Personajes y temáticas', href: '/catalogo' },
]

export default async function Footer({ whatsappNumber, content }: { whatsappNumber: string; content: Pick<HomePageCopy, 'footerCtaTitle' | 'footerCtaDescription' | 'footerCtaButton' | 'footerAbout' | 'footerAddress' | 'footerMapLabel' | 'footerPhoneLabel' | 'footerPhoneValue' | 'footerHoursLabel' | 'footerHoursValue' | 'footerDisclaimer'> }) {
    const phone = whatsappNumber.replace(/\D/g, '')
    const message = encodeURIComponent('Hola, quería consultar por un disfraz.')
    const year = await getCurrentYear()

    return (
        <footer className='siteFooter'>
            <div className='siteFooterInner'>
                <section className='footerCta' aria-labelledby='footerCtaTitle'>
                    <div>
                        <h2 id='footerCtaTitle'>{content.footerCtaTitle}</h2>
                        <p>{content.footerCtaDescription}</p>
                    </div>
                    <a href={`https://wa.me/${phone}?text=${message}`} target='_blank' rel='noopener noreferrer' className='footerCtaButton'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.7' aria-hidden='true'><path d='M20 11.5a8 8 0 0 1-11.9 7L4 20l1.5-4.1A8 8 0 1 1 20 11.5Z' /></svg>
                        {content.footerCtaButton}
                    </a>
                </section>

                <div className='footerMain'>
                    <div className='footerAbout'>
                        <Link href='/' className='footerBrand' aria-label='Disfraces Hechizos, inicio'>
                            <span>disfraces</span>
                            <strong>Hechizos <span aria-hidden='true'>✦</span></strong>
                        </Link>
                        <p>{content.footerAbout}</p>
                    </div>

                    <nav className='footerColumn' aria-label='Navegación del pie'>
                        <h3>Navegación</h3>
                        {navigation.map(({ label, href }) => <Link href={href} key={label}>{label}</Link>)}
                    </nav>

                    <nav className='footerColumn' aria-label='Categorías de disfraces'>
                        <h3>Categorías</h3>
                        {categories.map(({ label, href }) => <Link href={href} key={label}>{label}</Link>)}
                    </nav>

                    <div id='contacto' className='footerColumn footerLocal'>
                        <h3>El local</h3>
                        <a className='footerAddress' href='https://www.google.com/maps/search/?api=1&query=Espa%C3%B1a+1744%2C+Mar+del+Plata' target='_blank' rel='noopener noreferrer'>
                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'><path d='M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z' /><circle cx='12' cy='10' r='2.3' /></svg>
                            <span>{content.footerAddress}<small>{content.footerMapLabel} ↗</small></span>
                        </a>
                        <a className='footerInstagram' href='https://www.instagram.com/disfraceshechizos/' target='_blank' rel='noopener noreferrer'>
                            <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'><rect x='3' y='3' width='18' height='18' rx='5' /><circle cx='12' cy='12' r='4' /><circle cx='17.5' cy='6.5' r='0.8' fill='currentColor' /></svg>
                            @disfraceshechizos
                        </a>
                        <div className='footerContactFacts'>
                            <p><span>{content.footerPhoneLabel}</span><strong>{content.footerPhoneValue}</strong></p>
                            <p><span>{content.footerHoursLabel}</span><strong>{content.footerHoursValue}</strong></p>
                        </div>
                    </div>
                </div>

                <div className='footerBottom'>
                    <p>© {year} Disfraces Hechizos · Mar del Plata · Diseñado por Ignacio Tosini</p>
                    <nav className='footerLegal' aria-label='Información legal'>
                        <Link href='/terminos-y-condiciones'>Términos y condiciones</Link>
                        <Link href='/privacidad'>Privacidad</Link>
                    </nav>
                    <p>{content.footerDisclaimer}</p>
                </div>
            </div>
            <FooterAnimation />
        </footer>
    )
}
