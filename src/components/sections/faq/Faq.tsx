'use client'

import './_faq.scss'

import { useState } from 'react'
import FaqAnimation from './FaqAnimation'
import type { HomePageCopy } from '@/lib/home-hero'

export default function Faq({ content }: { content: Pick<HomePageCopy, 'faqEyebrow' | 'faqTitle' | 'faqDescription' | 'faqItems'> }) {
    const [openQuestions, setOpenQuestions] = useState<Set<string>>(() => new Set())

    const toggleQuestion = (question: string) => {
        setOpenQuestions((current) => {
            const next = new Set(current)
            if (next.has(question)) next.delete(question)
            else next.add(question)
            return next
        })
    }

    return (
        <section id='faq' className='faqSection' aria-labelledby='faqTitle'>
            <div className='faqInner'>
                <header className='faqIntro'>
                    <p>{content.faqEyebrow}</p>
                    <h2 id='faqTitle'>{content.faqTitle}</h2>
                    <span>{content.faqDescription}</span>
                </header>
                <div className='faqList'>
                    {content.faqItems.map(({ question, answer }, index) => {
                        const isOpen = openQuestions.has(question)
                        const answerId = `faqAnswer-${index}`
                        return (
                            <article className={`faqItem${isOpen ? ' isOpen' : ''}`} key={question}>
                                <h3>
                                    <button className='faqQuestion' type='button' aria-expanded={isOpen}
                                        aria-controls={answerId} onClick={() => toggleQuestion(question)}>
                                        <span className='faqQuestionText'>{question}</span><span className='faqChevron' aria-hidden='true' />
                                    </button>
                                </h3>
                                <div className='faqAnswer' id={answerId} aria-hidden={!isOpen} inert={!isOpen}>
                                    <div><p>{answer}</p></div>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
            <FaqAnimation />
        </section>
    )
}
