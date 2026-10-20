import Image from 'next/image'
import type { HomeHeroContent } from '@/lib/home-hero'
import type { StoreCatalogCostume } from '@/lib/store-catalog'

export default function HomePagePreview({ content, imageSrc, costumes }: { content: HomeHeroContent; imageSrc: string; costumes: StoreCatalogCostume[] }) {
  const copy = content.sections
  const products = costumes.filter((costume) => costume.isFeatured).slice(0, 5)
  const visibleProducts = products.length ? products : costumes.slice(0, 5)

  return <div className="homePreviewPage">
    <div className="homePreviewBanner">{copy.bannerText}</div>
    <section className="homePreviewHero">
      <div className="homePreviewHero__copy"><span>{content.eyebrow}</span><h1>{content.titleLineOne} {content.titleLineTwo} <em>{content.titleHighlight}</em></h1><p>{content.description}</p><strong>{content.primaryCtaLabel}　→</strong><small>{content.secondaryCtaLabel}</small><footer>{content.locationText}</footer></div>
      <div className="homePreviewHero__image"><Image src={imageSrc} alt={content.imageAlt} fill sizes="(max-width: 50rem) 100vw, 60vw" unoptimized={imageSrc.startsWith('blob:')} /></div>
    </section>
    <section className="homePreviewCategories"><header><h2>{copy.categoriesTitle}</h2><p>{copy.categoriesDescription}</p></header><div><article>Adultos</article><article>Infantiles</article><article>Personajes y temáticas</article></div><small>Las tarjetas de categorías se administran desde Categorías.</small></section>
    <section className="homePreviewFeatured"><header><h2>{copy.featuredTitleLead} <em>{copy.featuredTitleHighlight}</em></h2><span>{copy.featuredCta}　→</span></header><div className="homePreviewProducts">{visibleProducts.map((costume) => <article key={costume.id}>{costume.images[0]?.url && <Image src={costume.images[0].url} alt={costume.images[0].altText} width={400} height={300} sizes="20vw" />}<strong>{costume.name}</strong><small>{costume.category.name}</small></article>)}</div><aside><strong>{copy.instagramTitle}</strong><span>{copy.instagramDescription}</span><b>{copy.instagramAction}　→</b></aside></section>
    <section className="homePreviewHow"><header><span>{copy.howEyebrow}</span><h2>{copy.howTitle}</h2><p>{copy.howDescription}</p></header><div>{copy.howSteps.map((step, index) => <article key={index}><b>0{index + 1}</b><h3>{step.title}</h3><p>{step.description}</p></article>)}</div></section>
    <section className="homePreviewFaq"><header><span>{copy.faqEyebrow}</span><h2>{copy.faqTitle}</h2><p>{copy.faqDescription}</p></header><div>{copy.faqItems.map((item, index) => <article key={index}><strong>{item.question}</strong><p>{item.answer}</p></article>)}</div></section>
    <footer className="homePreviewFooter"><aside><h2>{copy.footerCtaTitle}</h2><p>{copy.footerCtaDescription}</p><strong>{copy.footerCtaButton}</strong></aside><div><p>{copy.footerAbout}</p><p>{copy.footerAddress} · {copy.footerPhoneLabel}: {copy.footerPhoneValue} · {copy.footerHoursLabel}: {copy.footerHoursValue}</p><small>{copy.footerDisclaimer}</small></div></footer>
  </div>
}
