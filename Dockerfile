# Stage 1: deps — install node_modules from internal Verdaccio
FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

# Copy only package.json (do NOT copy package-lock.json)
COPY package*.json ./

# Point npm to your internal registry
RUN npm config set registry http://inshop_verdaccio:4873/

# Install dependencies ignoring any lockfile
RUN npm install --registry=http://inshop_verdaccio:4873/ verbose

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