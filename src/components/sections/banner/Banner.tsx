import './_banner.scss'

import type { HomePageCopy } from '@/lib/home-hero'

export default function Banner({ content }: { content: Pick<HomePageCopy, 'bannerText'> }) {
    return (
        <div className='bannerSlot'>
            <div className='bannerContainer'>
                <p>{content.bannerText}</p>
            </div>
        </div>
    )
}
