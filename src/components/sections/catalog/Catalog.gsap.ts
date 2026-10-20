import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateCatalogResults(root: HTMLElement) {
    const cards = root.querySelectorAll('.costumeCard')
    if (!cards.length) return

    gsap.from(cards, {
        autoAlpha: 0,
        y: 28,
        scale: 0.97,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power3.out',
        clearProps: 'opacity,visibility,transform',
    })
}
