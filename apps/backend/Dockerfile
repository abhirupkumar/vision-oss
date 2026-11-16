FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/backend/ ./apps/backend/

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @vision/db build || true

FROM node:20-alpine AS runner

WORKDIR /app

RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app ./

EXPOSE 3001

CMD ["node", "apps/backend/dist/index.js"]
