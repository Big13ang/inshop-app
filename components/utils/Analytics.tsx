import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import { env } from '@/env'

export default function Analytics() {
    if (!env.NEXT_PUBLIC_GA_ID && !env.NEXT_PUBLIC_GTM_ID) {
        return null;
    }

    return (
        <>
            {env.NEXT_PUBLIC_GTM_ID ? <GoogleTagManager gtmId={env.NEXT_PUBLIC_GTM_ID} /> : null}
            {env.NEXT_PUBLIC_GA_ID ? <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_ID} /> : null}
        </>
    )
}