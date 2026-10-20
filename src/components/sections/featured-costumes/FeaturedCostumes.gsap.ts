import { gsap } from '@/components/ui/gsap/gsapClient'

export function animateFeaturedCostumes(root: HTMLElement) {
    const mosaic = root.querySelector('.costumeMosaic')
    gsap.from(root.querySelector('.featuredCostumesHeader'), {
        autoAlpha: 0,
        y: 38,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: root, start: 'top 68%', once: true },
    })
    if (mosaic) gsap.from(mosaic.querySelectorAll('.mosaicFeatured, .mosaicSmallCard'), {
        autoAlpha: 0,
        y: 46,
        scale: 0.965,
        duration: 0.85,
        stagger: 0.14,
        ease: 'power3.out',
        scrollTrigger: { trigger: mosaic, start: 'top 68%', once: true },
    })
    gsap.from(root.querySelector('.instagramStrip'), {
        autoAlpha: 0,
        y: 28,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: root.querySelector('.instagramStrip'), start: 'top 76%', once: true },
    })
}
