import Image from 'next/image'
import Link from 'next/link'
import type { StoreCatalogCostume } from '@/lib/store-catalog'
import { formatARS } from '@/lib/formatters'
import FeaturedCostumesAnimation from './FeaturedCostumesAnimation'
import './_featured-costumes.scss'
import type { HomePageCopy } from '@/lib/home-hero'

export default function FeaturedCostumes({ costumes, loadError, content }: { costumes: StoreCatalogCostume[]; loadError: boolean; content: Pick<HomePageCopy, 'featuredTitleLead' | 'featuredTitleHighlight' | 'featuredCta' | 'instagramTitle' | 'instagramDescription' | 'instagramAction'> }) {
    const featured = costumes.filter(({ isFeatured }) => isFeatured)
    const displayCostumes = (featured.length ? featured : costumes).slice(0, 5)
    const [mainCostume, ...otherCostumes] = displayCostumes
    const compact = displayCostumes.length <= 2
    const single = displayCostumes.length === 1
    return (
        <section id='featuredCostumes' className='featuredCostumes' aria-labelledby='featuredCostumesTitle'>
            <div className='featuredCostumesInner'>
                <header className='featuredCostumesHeader'>
                    <h2 id='featuredCostumesTitle'>{content.featuredTitleLead} <span>{content.featuredTitleHighlight}</span></h2>
                    <Link href='/catalogo'>{content.featuredCta} <span aria-hidden='true'>→</span></Link>
                </header>
                {loadError ? <p className='featuredCostumesEmpty'>No se pudo conectar con el catálogo.</p> : mainCostume ? <div className={`costumeMosaic${compact ? ' costumeMosaic--compact' : ''}${single ? ' costumeMosaic--single' : ''}`}>
                    <CostumeLink costume={mainCostume} featured />
                    {!!otherCostumes.length && <div className='mosaicSmallGrid'>
                        {otherCostumes.map((costume) => <CostumeLink costume={costume} key={costume.id} />)}
                    </div>}
                </div> : <p className='featuredCostumesEmpty'>Todavía no hay disfraces publicados. Volvé pronto a conocer las novedades.</p>}
                <a className='instagramStrip' href='https://www.instagram.com/disfraceshechizos/' target='_blank' rel='noopener noreferrer'>
                    <span className='instagramIcon' aria-hidden='true'>
                        <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8'><rect x='3' y='3' width='18' height='18' rx='5' /><circle cx='12' cy='12' r='4' /><circle cx='17.5' cy='6.5' r='0.8' fill='currentColor' /></svg>
                    </span>
                    <span className='instagramCopy'><strong>{content.instagramTitle}</strong><small>{content.instagramDescription}</small></span>
                    <span className='instagramAction'>{content.instagramAction} <span aria-hidden='true'>→</span></span>
                </a>
            </div>
            <FeaturedCostumesAnimation />
        </section>
    )
}

function CostumeLink({ costume, featured = false }: { costume: StoreCatalogCostume; featured?: boolean }) {
    const image = costume.images[0]
    const price = costume.rentalPrice ? formatARS(costume.rentalPrice) : 'Consultar precio'
    return <Link className={featured ? 'mosaicFeatured' : 'mosaicSmallCard'} href={`/catalogo?costume=${encodeURIComponent(costume.slug)}`} aria-label={`Ver ${costume.name} en el catálogo`}>
        {image && <Image src={image.url} alt={image.altText} fill sizes={featured ? '(max-width: 700px) 100vw, 50vw' : '(max-width: 700px) 45vw, 22vw'} />}
        <span className='mosaicTag'>{costume.category.name}</span>
        <span className='mosaicProductCopy'><strong>{costume.name}</strong><small>{costume.rentalPrice ? `Desde ${price}` : price}</small></span>
    </Link>
}
