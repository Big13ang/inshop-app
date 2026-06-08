# Stage 1: deps — install node_modules from internal Verdaccio
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

# Copy only package.json (do NOT copy package-lock.json)
COPY package*.json ./

# Point npm to your internal registry
RUN npm config set registry https://mirror2.chabokan.net/npm/

# Install dependencies ignoring any lockfile with retries and timeout
RUN npm install --registry=https://mirror2.chabokan.net/npm/ \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --timeout=600000 \
    verbose

# Stage 2: builder — build the app
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry https://mirror2.chabokan.net/npm/
RUN npm run build

# Stage 3: runner — production
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

# Remove dev dependencies and install only production packages with retries and timeout
RUN npm config set registry https://mirror2.chabokan.net/npm/ && \
    npm install --omit=dev \
    --registry=https://mirror2.chabokan.net/npm/ \
    --fetch-retries=5 \
    --fetch-retry-mintimeout=20000 \
    --fetch-retry-maxtimeout=120000 \
    --timeout=600000 \
    verbose

EXPOSE 3000
CMD ["npm", "start"]