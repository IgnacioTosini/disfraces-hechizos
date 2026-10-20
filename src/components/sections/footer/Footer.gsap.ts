import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateFooter(root: HTMLElement) {
    gsap.from(root.querySelector('.footerCta'), {
        autoAlpha: 0,
        y: 42,
        scale: 0.98,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
    })
    gsap.from(root.querySelectorAll('.footerMain > *'), {
        autoAlpha: 0,
        y: 34,
        duration: 0.7,
        stagger: 0.16,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.querySelector('.footerMain'), start: 'top 76%', once: true },
    })
}
