FROM node:24.11-alpine3.21 AS base

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY . .

RUN npx prisma generate

EXPOSE 8080

CMD ["node", "server.js"]