# syntax=docker/dockerfile:1.7

# Stage 1: deps
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

ARG NPM_REGISTRY=https://mirror2.chabokan.net/npm/
ARG NPM_INSTALL_MODE=prefer-offline
ENV NPM_CONFIG_CACHE=/root/.npm \
    NPM_CONFIG_PREFER_OFFLINE=true

COPY package.json .npmrc ./

RUN npm config set registry ${NPM_REGISTRY}

# NPM_INSTALL_MODE options:
# - prefer-offline  => use Verdaccio/cache first, but allow downloads if registry can proxy
# - offline         => never download missing packages, only use already cached/published packages
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    if [ "$NPM_INSTALL_MODE" = "offline" ]; then \
      npm install \
        --registry=${NPM_REGISTRY} \
        --package-lock=false \
        --offline \
        --fetch-retries=0 \
        --loglevel verbose; \
    else \
      npm install \
        --registry=${NPM_REGISTRY} \
        --package-lock=false \
        --prefer-offline \
        --fetch-retries=5 \
        --fetch-retry-mintimeout=20000 \
        --fetch-retry-maxtimeout=120000 \
        --timeout=600000 \
        --loglevel verbose; \
    fi


# Stage 2: builder
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

ARG NPM_REGISTRY=https://mirror2.chabokan.net/npm/

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry ${NPM_REGISTRY}
RUN npm run build


# Stage 3: runner
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

ARG NPM_REGISTRY=https://mirror2.chabokan.net/npm/

RUN npm config set registry ${NPM_REGISTRY}

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "start"]
