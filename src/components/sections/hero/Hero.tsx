import Image from 'next/image'
import Link from 'next/link'
import HeroAnimation from './HeroAnimation'
import type { HomeHeroContent } from '@/lib/home-hero'
import './_hero.scss'

export default function Hero({ content }: { content: HomeHeroContent }) {
    return (
        <section className='heroContainer' aria-labelledby='heroTitle'>
            <div className='heroContentLeft'>
                <span className='heroSubtitle'>{content.eyebrow}</span>
                <div className='heroTexts'>
                    <h1 id='heroTitle'>{content.titleLineOne}<br />{content.titleLineTwo} <span>{content.titleHighlight}</span></h1>
                    <p>{content.description}</p>
                </div>
                <div className='heroButtons'>
                    <Link href='/catalogo' className='primaryButton'>{content.primaryCtaLabel} <span aria-hidden='true'>→</span></Link>
                    <Link href='/#howItWorks' className='secondaryButton'>{content.secondaryCtaLabel}</Link>
                </div>
                <p className='heroLocation'>{content.locationText}</p>
            </div>
            <div className='heroContentRight'>
                <Image className='heroImage' src={content.imageUrl}
                    alt={content.imageAlt}
                    fill sizes='(max-width: 900px) 100vw, 710px' priority />
                <ul className='heroCategories' aria-label='Categorías de disfraces'>
                    {['Aventura', 'Histórico', 'Fantasía', 'Profesiones'].map((category) => (
                        <li key={category}>{category}</li>
                    ))}
                </ul>
            </div>
            <HeroAnimation />
        </section>
    )
}
