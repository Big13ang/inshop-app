FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN npm install -g npm@10
RUN npm config set registry http://npm.inshop.internal/
RUN sed -i 's#https://mirror-npm.runflare.com#http://npm.inshop.internal#g' package-lock.json
RUN npm ci --registry=http://npm.inshop.internal/ --fetch-retries=5 --fetch-timeout=120000

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]