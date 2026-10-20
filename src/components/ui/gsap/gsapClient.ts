'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export type SectionAnimation = (root: HTMLElement) => void

export function useGsapSection(selector: string, animate: SectionAnimation, refreshKey?: string | number) {
    useEffect(() => {
        const root = document.querySelector<HTMLElement>(selector)
        if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

        const context = gsap.context(() => animate(root), root)
        return () => context.revert()
    }, [animate, refreshKey, selector])
}

export { gsap, ScrollTrigger }
