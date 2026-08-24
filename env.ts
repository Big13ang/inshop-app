import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
    server: {
        E2E_MOCK: z.string().default("false"),
        GLITCHTIP_DSN: z.string().default("https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5"),
        SENTRY_RELEASE: z.string().default("production"),
        SENTRY_ENVIRONMENT: z.string().default("production"),
    },
    client: {
        NEXT_PUBLIC_API_URL: z.url(),
        NEXT_PUBLIC_CDN_URL: z.url(),
        NEXT_PUBLIC_DEBUG_AUTH: z.enum(['true', 'false']),
        NEXT_PUBLIC_GLITCHTIP_DSN: z.string().min(1),
        NEXT_PUBLIC_SENTRY_RELEASE: z.string().min(1),
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: z.string().min(1),
    },
    experimental__runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
        NEXT_PUBLIC_DEBUG_AUTH: process.env.NEXT_PUBLIC_DEBUG_AUTH,
        NEXT_PUBLIC_GLITCHTIP_DSN: process.env.NEXT_PUBLIC_GLITCHTIP_DSN,
        NEXT_PUBLIC_SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
        NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
    },
});
