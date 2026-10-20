import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateHero(root: HTMLElement) {
    const intro = root.querySelector('.heroContentLeft')
    const image = root.querySelector('.heroContentRight')
    if (!intro || !image) return

    const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    timeline
        .from(intro.querySelector('.heroSubtitle'), { autoAlpha: 0, y: 22, duration: 0.65 })
        .from(intro.querySelector('.heroTexts'), { autoAlpha: 0, y: 44, scale: 0.97, duration: 0.9 }, '-=0.2')
        .from(intro.querySelectorAll('.heroButtons > *'), { autoAlpha: 0, y: 24, duration: 0.65, stagger: 0.14 }, '-=0.25')
        .from(intro.querySelector('.heroLocation'), { autoAlpha: 0, y: 18, duration: 0.55 }, '-=0.15')
        .from(image, { autoAlpha: 0, scale: 0.94, y: 26, duration: 1.05 }, '-=0.65')
        .from(image.querySelectorAll('.heroCategories li'), { autoAlpha: 0, y: 16, scale: 0.92, duration: 0.5, stagger: 0.1 }, '-=0.35')
}
