# Stage 1: deps — install node_modules
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

# Copy package files first (Docker cache)
COPY package*.json ./

# Use the internal registry (Verdaccio) available in Swarm overlay network
RUN npm config set registry http://inshop_verdaccio:4873/
RUN npm ci --registry=http://inshop_verdaccio:4873/ --loglevel verbose

# Stage 2: builder — build the app
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry http://inshop_verdaccio:4873/
RUN npm run build

# Stage 3: runner — production
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]