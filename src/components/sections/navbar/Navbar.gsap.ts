import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateNavbar(root: HTMLElement) {
    const elements = [
        root.querySelector('.navbarBrand'),
        ...Array.from(root.querySelectorAll('.navbarLinks li')),
        ...Array.from(root.querySelectorAll('.navbarActions > *')),
    ].filter((element): element is Element => element !== null)

    if (!elements.length) return

    gsap.from(elements, {
        autoAlpha: 0,
        y: 22,
        scale: 0.96,
        duration: 0.75,
        stagger: 0.075,
        delay: 0.12,
        ease: 'back.out(1.35)',
        clearProps: 'opacity,visibility,transform',
    })
}
