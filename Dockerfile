# Stage 1: deps — install dependencies only
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

# Use Chabokan npm registry
RUN npm config set registry https://mirror2.chabokan.net/npm/

# Copy only package files to leverage caching
COPY package*.json ./

# Install dependencies (uses cached node_modules if unchanged)
RUN npm ci --registry=https://mirror2.chabokan.net/npm/ --fetch-retries=5 --fetch-timeout=120000

# Stage 2: builder — build your app
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy app source code
COPY . .

# Build
RUN npm run build

# Stage 3: runner — minimal production image
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app from builder
COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]