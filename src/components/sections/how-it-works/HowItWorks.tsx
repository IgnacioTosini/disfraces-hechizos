import Link from 'next/link'
import './_how-it-works.scss'
import HowItWorksAnimation from './HowItWorksAnimation'
import type { HomePageCopy } from '@/lib/home-hero'

const stepIcons = ['search', 'calendar', 'people']

function StepIcon({ name }: { name: string }) {
    if (name === 'search') return <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'><circle cx='10.8' cy='10.8' r='6.8' /><path d='m16 16 4.5 4.5' /></svg>
    if (name === 'calendar') return <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'><rect x='3.5' y='5' width='17' height='16' rx='2.5' /><path d='M7.5 3v4M16.5 3v4M4 9h16M8 13h3v3H8z' /></svg>
    return <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' aria-hidden='true'><circle cx='9' cy='8' r='3.2' /><path d='M3 20v-1.6a5.5 5.5 0 0 1 11 0V20M16 5a3.2 3.2 0 0 1 0 6.2M17 14a5.2 5.2 0 0 1 4 5.1V20' /></svg>
}

export default function HowItWorks({ content }: { content: Pick<HomePageCopy, 'howEyebrow' | 'howTitle' | 'howDescription' | 'howSteps'> }) {
    return (
        <section id='howItWorks' className='howItWorks' aria-labelledby='howItWorksTitle'>
            <div className='howItWorksInner'>
                <header className='howItWorksIntro'>
                    <p>{content.howEyebrow}</p>
                    <h2 id='howItWorksTitle'>{content.howTitle}</h2>
                    <span>{content.howDescription}</span>
                </header>
                <ol className='howItWorksSteps'>
                    {content.howSteps.map((step, index) => {
                        const number = String(index + 1).padStart(2, '0')
                        return <li key={number}>
                            <div className='howItWorksStepTop'>
                                <span className='howItWorksNumber'>{number}</span>
                                <span className='howItWorksIcon'><StepIcon name={stepIcons[index] ?? 'people'} /></span>
                            </div>
                            <h3>{step.title}</h3>
                            <p>{step.description}</p>
                            {number === '01' && <Link href='/catalogo' className='stepLink'>Ir al catálogo</Link>}
                        </li>
                    })}
                </ol>
            </div>
            <HowItWorksAnimation />
        </section>
    )
}
