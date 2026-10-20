'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateHero } from './Hero.gsap'

export default function HeroAnimation() {
    useGsapSection('.heroContainer', animateHero)
    return null
}
