import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";
import { env } from "@/env";
import { debugAuth } from "@/lib/utils/authDebug";

debugAuth('auth-client', 'createAuthClient', {
    baseURL: env.NEXT_PUBLIC_API_URL,
});

export const authClient = createAuthClient({
    baseURL: env.NEXT_PUBLIC_API_URL,
    plugins: [
        phoneNumberClient(),
    ]
});
