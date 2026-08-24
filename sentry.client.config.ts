import * as Sentry from "@sentry/nextjs";

export const GLITCHTIP_FALLBACK_DSN = "https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5";

const dsn =
  process.env.NEXT_PUBLIC_GLITCHTIP_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  GLITCHTIP_FALLBACK_DSN;

const release =
  process.env.NEXT_PUBLIC_SENTRY_RELEASE ||
  process.env.SENTRY_RELEASE ||
  undefined;

const environment =
  process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ||
  process.env.SENTRY_ENVIRONMENT ||
  process.env.NODE_ENV ||
  "development";

if (dsn && typeof Sentry.init === "function" && !Sentry.getClient?.()) {
  Sentry.init({
    dsn,
    release,
    environment,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    debug: process.env.NODE_ENV === "development",
    attachStacktrace: true,
  });

  if (typeof window !== "undefined") {
    console.log("[GlitchTip] Sentry client initialized successfully with DSN:", dsn, "Release:", release);
  }
}
