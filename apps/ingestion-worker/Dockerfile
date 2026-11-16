FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./

COPY packages/db/ ./packages/db/
COPY packages/shared-types/ ./packages/shared-types/
COPY apps/ingestion-worker/ ./apps/ingestion-worker/

RUN pnpm install --frozen-lockfile

CMD ["pnpm", "--filter", "@vision/ingestion-worker", "start"]
