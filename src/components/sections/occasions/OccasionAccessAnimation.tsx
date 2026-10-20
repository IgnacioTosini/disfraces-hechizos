'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateOccasionAccess } from './OccasionAccess.gsap'

export default function OccasionAccessAnimation() {
    useGsapSection('.occasionAccess', animateOccasionAccess)
    return null
}
