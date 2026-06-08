FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm config set registry http://npm.inshop.internal/
RUN npm ci --registry=http://npm.inshop.internal/ --fetch-retries=5 --fetch-timeout=120000

FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry http://npm.inshop.internal/
RUN npm run build

FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]