'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateFooter } from './Footer.gsap'

export default function FooterAnimation() {
    useGsapSection('.siteFooter', animateFooter)
    return null
}
