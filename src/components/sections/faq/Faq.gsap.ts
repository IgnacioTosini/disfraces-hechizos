import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateFaq(root: HTMLElement) {
    gsap.from(root.querySelector('.faqIntro'), {
        autoAlpha: 0,
        y: 36,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
    })
    gsap.from(root.querySelectorAll('.faqItem'), {
        autoAlpha: 0,
        y: 30,
        duration: 0.7,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.querySelector('.faqList'), start: 'top 74%', once: true },
    })
}
