import Image from 'next/image'
import Link from 'next/link'
import './_categories.scss'
import CategoriesAnimation from './CategoriesAnimation'
import type { HomePageCopy } from '@/lib/home-hero'

const categories = [
    { title: 'Adultos', description: 'Disfraces para fiestas, eventos y celebraciones.', image: '/images/categoria-adultos.webp', alt: 'Mujer con disfraz elegante inspirado en los años veinte', href: '/catalogo?audience=ADULT' },
    { title: 'Infantiles', description: 'Opciones para niños y niñas.', image: '/images/categoria-infantiles.webp', alt: 'Niños sonrientes con disfraces de princesa y dinosaurio', href: '/catalogo?audience=CHILD' },
    { title: 'Personajes y temáticas', description: 'Históricos, fantasía, terror, profesiones y más.', image: '/images/categoria-tematicas.webp', alt: 'Hombre con vestuario histórico escocés', href: '/catalogo' },
]

export default function Categories({ content }: { content: Pick<HomePageCopy, 'categoriesTitle' | 'categoriesDescription'> }) {
    return (
        <section className='categoriesContainer' aria-labelledby='categoriesTitle'>
            <div className='categoriesInner'>
                <header className='categoriesHeader'>
                        <h2 id='categoriesTitle'>{content.categoriesTitle}</h2>
                        <p>{content.categoriesDescription}</p>
                </header>
                <div className='categoriesGrid'>
                    {categories.map((category) => (
                        <Link className='categoryCard' href={category.href} key={category.title}>
                            <Image src={category.image} alt={category.alt} fill sizes='(max-width: 760px) 100vw, (max-width: 1100px) 50vw, 400px' />
                            <div className='categoryCardContent'>
                                <div>
                                    <h3>{category.title}</h3>
                                    <p>{category.description}</p>
                                </div>
                                <span className='categoryCardArrow' aria-hidden='true'>↗</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
            <CategoriesAnimation />
        </section>
    )
}

