# Playwright runner for the real-backend suite, for machines without Node
# (the E2E server, CI). Build from the repo root:
#   docker build -f e2e-real/runner/Dockerfile -t inshop-e2e-runner .
# Run it with E2E_BASE_URL, E2E_API_URL and E2E_DATABASE_URL set.

# Keep in step with @playwright/test in runner/package.json
FROM mcr.microsoft.com/playwright:v1.63.0-noble

WORKDIR /suite

# Only what the specs import, not the app's dependencies
COPY e2e-real/runner/package.json e2e-real/runner/package-lock.json ./
RUN npm ci --no-audit --no-fund

# The page objects import app constants through tsconfig.json's `@/` alias
COPY tsconfig.json ./
COPY features ./features
COPY e2e-real ./e2e-real

ENTRYPOINT ["npx", "playwright", "test", "-c", "e2e-real/playwright.config.ts"]
