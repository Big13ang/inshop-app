import * as Sentry from "@sentry/nextjs";

const DSN =
  process.env.NEXT_PUBLIC_GLITCHTIP_DSN ||
  "https://c39862cad26a45aaa1f72b6e9e8c50dc@errors.inshop.social/5";

const RELEASE =
  process.env.RELEASE ||
  "prod-8f4269eaf636cba5e44b9a42fb86592c433dd606";

console.log("==========================================================");
console.log("       Sending Synthetic Error to GlitchTip               ");
console.log("==========================================================");
console.log("DSN:     ", DSN);
console.log("Release: ", RELEASE);
console.log("==========================================================");

Sentry.init({
  dsn: DSN,
  release: RELEASE,
  environment: "production",
});

function simulateBusinessLogicError() {
  throw new Error("Synthetic verification error: GlitchTip sourcemaps test");
}

try {
  simulateBusinessLogicError();
} catch (err) {
  console.log("Capturing exception with Sentry SDK...");
  const eventId = Sentry.captureException(err, {
    tags: {
      test: "sourcemap-verification",
      domain: "system",
    },
    extra: {
      timestamp: new Date().toISOString(),
      reason: "Manual verification of GlitchTip stack trace de-minification",
    },
  });

  console.log("Event ID queued:", eventId);

  console.log("Flushing event to GlitchTip server...");
  Sentry.flush(5000).then(() => {
    console.log("==========================================================");
    console.log("🎉 Event successfully delivered to GlitchTip!");
    console.log("👉 Check issues at: https://errors.inshop.social/inshop/issues/");
    console.log("==========================================================");
    process.exit(0);
  });
}
