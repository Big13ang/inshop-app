FROM mirror2.chabokan.net/library/node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./

RUN npm config set registry http://109.122.249.153/
RUN npm ci --registry=http://109.122.249.153/

FROM mirror2.chabokan.net/library/node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm config set registry http://109.122.249.153/
RUN npm run build

FROM mirror2.chabokan.net/library/node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app ./

EXPOSE 3000
CMD ["npm", "start"]