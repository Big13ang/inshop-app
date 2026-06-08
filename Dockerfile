# Stage 1: deps
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

ARG NPM_REGISTRY=http://npm.inshop.internal/

COPY package*.json ./

RUN npm config set registry ${NPM_REGISTRY}

RUN npm install \
    --registry=${NPM_REGISTRY} \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --timeout=600000 \
    --loglevel verbose


# Stage 2: builder
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

ARG NPM_REGISTRY=http://npm.inshop.internal/

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry ${NPM_REGISTRY}
RUN npm run build


# Stage 3: runner
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG NPM_REGISTRY=http://npm.inshop.internal/

COPY --from=builder /app ./

RUN npm config set registry ${NPM_REGISTRY} && \
    npm install --omit=dev \
    --registry=${NPM_REGISTRY} \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --timeout=600000 \
    --loglevel verbose

EXPOSE 3000

CMD ["npm", "start"]