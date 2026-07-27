FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Accept optional npm authentication credentials via build arguments
ARG NPM_USER
ARG NPM_PASS
ARG NPM_AUTH
ARG NPM_TOKEN

# Install dependencies based on package-lock.json and provided npm auth/secret.
COPY package.json package-lock.json* .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=secret,id=npmrc,target=/tmp/npmrc \
    sh -c '\
      set -e; \
      if [ -f /tmp/npmrc ] && [ -s /tmp/npmrc ]; then \
        cp /tmp/npmrc .npmrc; \
      fi; \
      if [ -n "$NPM_AUTH" ]; then \
        echo "//npm.inshop.social/:_auth=$NPM_AUTH" >> .npmrc; \
      elif [ -n "$NPM_TOKEN" ]; then \
        echo "//npm.inshop.social/:_authToken=$NPM_TOKEN" >> .npmrc; \
      elif [ -n "$NPM_USER" ] && [ -n "$NPM_PASS" ]; then \
        npm_auth=$(printf "%s:%s" "$NPM_USER" "$NPM_PASS" | base64 | tr -d "\n"); \
        echo "//npm.inshop.social/:_auth=$npm_auth" >> .npmrc; \
      fi; \
      if ! grep -qE "_auth=|_authToken=" .npmrc 2>/dev/null || grep -q "_auth=Og==" .npmrc 2>/dev/null; then \
        echo "Warning: No valid npm authentication credentials provided for private registry. Falling back to public npm registry."; \
        echo "registry=https://registry.npmjs.org/" > .npmrc; \
      fi; \
      if ! npm ci --verbose; then \
        echo "Warning: npm ci failed with configured registry. Retrying with public npm registry..."; \
        echo "registry=https://registry.npmjs.org/" > .npmrc; \
        npm ci --verbose; \
      fi'

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose Next.js environment variable during build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_CDN_URL
ENV NEXT_PUBLIC_CDN_URL=$NEXT_PUBLIC_CDN_URL


# Build Next.js
RUN --mount=type=cache,target=/app/.next/cache npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permissions for runtime-generated Next.js files.
RUN mkdir .next tmp
RUN chown nextjs:nodejs .next tmp

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# server.js is created by next build from the standalone output
CMD ["node", "server.js"]
