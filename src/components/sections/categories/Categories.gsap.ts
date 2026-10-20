import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateCategories(root: HTMLElement) {
    gsap.from(root.querySelectorAll('.categoryCard'), {
        autoAlpha: 0,
        y: 54,
        scale: 0.96,
        duration: 0.9,
        stagger: 0.18,
        ease: 'back.out(1.25)',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
    })
}
