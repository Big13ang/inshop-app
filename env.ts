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
    },
    experimental__runtimeEnv: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
});