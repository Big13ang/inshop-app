# Stage 1: deps — install dependencies only
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

# Set npm to use Chabokan registry
RUN npm config set registry https://mirror2.chabokan.net/npm/

# Copy only package files to leverage Docker cache
COPY package*.json ./

# Ensure package-lock.json URLs point to Chabokan
RUN sed -i 's#https://mirror-npm.runflare.com#https://mirror2.chabokan.net/npm#g' package-lock.json

# Install dependencies
RUN npm ci --registry=https://mirror2.chabokan.net/npm/ --fetch-retries=5 --fetch-timeout=120000

# Stage 2: builder — build the app
FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all app source code
COPY . .

# Build app
RUN npm run build

# Stage 3: runner — minimal production image
FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built app from builder stage
COPY --from=builder /app ./

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]