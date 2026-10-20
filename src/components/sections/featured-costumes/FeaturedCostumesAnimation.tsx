'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateFeaturedCostumes } from './FeaturedCostumes.gsap'

export default function FeaturedCostumesAnimation() {
    useGsapSection('.featuredCostumes', animateFeaturedCostumes)
    return null
}
