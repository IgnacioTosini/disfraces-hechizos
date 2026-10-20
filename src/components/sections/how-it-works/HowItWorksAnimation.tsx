'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateHowItWorks } from './HowItWorks.gsap'

export default function HowItWorksAnimation() {
    useGsapSection('.howItWorks', animateHowItWorks)
    return null
}
