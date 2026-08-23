import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.NEXT_PUBLIC_GLITCHTIP_DSN ||
  process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
    debug: process.env.NODE_ENV === "development",
    environment: process.env.NODE_ENV || "development",
  });
  if (typeof window !== "undefined") {
    console.log("[GlitchTip] Sentry client initialized successfully with DSN:", dsn);
  }
} else {
  console.warn(
    "[GlitchTip] NEXT_PUBLIC_GLITCHTIP_DSN is not defined in the client environment. Please restart your dev server after modifying .env."
  );
}

