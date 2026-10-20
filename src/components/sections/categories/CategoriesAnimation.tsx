'use client'

import { useGsapSection } from '@/components/ui/gsap/gsapClient'
import { animateCategories } from './Categories.gsap'

export default function CategoriesAnimation() {
    useGsapSection('.categoriesContainer', animateCategories)
    return null
}
