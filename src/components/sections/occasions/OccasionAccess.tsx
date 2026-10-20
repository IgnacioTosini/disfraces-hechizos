import Image from 'next/image'
import Link from 'next/link'
import type { OccasionAccess } from '@/lib/occasion-access'
import OccasionAccessAnimation from './OccasionAccessAnimation'
import './_occasion-access.scss'

export default function OccasionAccess({ cards, availableTags }: { cards: OccasionAccess; availableTags: string[] }) {
    return <section className="occasionAccess" aria-labelledby="occasionAccessTitle">
        <div className="occasionAccess__inner">
            <header className="occasionAccess__header">
                <div><p>Ideas para tu próximo evento</p><h2 id="occasionAccessTitle">Accesos por ocasión</h2></div>
                <span>Elegí una ocasión y encontrá disfraces para inspirarte.</span>
            </header>
            <div className="occasionAccess__grid">
                {cards.map((occasion) => {
                    const tags = occasion.tags.filter((tag) => availableTags.includes(tag))
                    if (!tags.length) return null
                    return <Link className="occasionAccess__card" href={`/catalogo?tags=${tags.join(',')}`} key={occasion.title}>
                        <Image src={occasion.imageUrl} alt={occasion.imageAlt} fill sizes="(max-width: 640px) 78vw, (max-width: 1000px) 45vw, 25vw" />
                        <span className="occasionAccess__overlay" />
                        <span className="occasionAccess__copy"><strong>{occasion.title}</strong><small>{occasion.description}</small></span>
                        <span className="occasionAccess__arrow" aria-hidden="true">↗</span>
                    </Link>
                })}
            </div>
            <OccasionAccessAnimation />
        </div>
    </section>
}
