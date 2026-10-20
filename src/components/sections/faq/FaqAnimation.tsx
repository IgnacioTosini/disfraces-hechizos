'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateFaq } from './Faq.gsap'

export default function FaqAnimation() {
    useGsapSection('.faqSection', animateFaq)
    return null
}
