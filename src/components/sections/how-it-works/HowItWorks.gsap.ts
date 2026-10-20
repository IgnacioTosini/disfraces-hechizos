import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateHowItWorks(root: HTMLElement) {
    gsap.from(root.querySelectorAll('.howItWorksSteps > li'), {
        autoAlpha: 0,
        y: 48,
        scale: 0.97,
        duration: 0.85,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
    })
}
