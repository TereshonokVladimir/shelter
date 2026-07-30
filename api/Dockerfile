FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm install prisma@5.22.0 --no-save \
  && npx prisma generate \
  && chmod +x ./docker-entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R node:node /app

USER node
EXPOSE 4000
ENV PORT=4000
ENV DATABASE_URL="file:/app/data/dev.db"

ENTRYPOINT ["./docker-entrypoint.sh"]
