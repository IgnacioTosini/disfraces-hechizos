import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateOccasionAccess(root: HTMLElement) {
    gsap.from(root.querySelectorAll('.occasionAccess__card'), {
        autoAlpha: 0,
        y: 36,
        scale: .97,
        duration: .75,
        stagger: .1,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 78%', once: true },
    })
}
