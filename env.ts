import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
    server: {
        // DATABASE_URL: z.url(),
        // OPEN_AI_API_KEY: z.string().min(1),
        E2E_MOCK: z.string().optional(),
    },
    client: {
        NEXT_PUBLIC_API_URL: z.url(),
        NEXT_PUBLIC_CDN_URL: z.url(),
        NEXT_PUBLIC_DEBUG_AUTH: z.enum(['true', 'false']).optional(),
    },
    experimental__runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
        NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
        NEXT_PUBLIC_DEBUG_AUTH: process.env.NEXT_PUBLIC_DEBUG_AUTH,
    },
});
