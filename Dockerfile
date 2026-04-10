# blog-next 生产镜像：Next.js standalone 输出
# 构建：docker build -t blog-next:latest .
# 通常与 docker-compose 一起使用，见 docs/Docker编排与流水线部署.md

FROM node:22-bookworm-slim AS base
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-factor 2 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && (npm install -g pnpm@9 --registry=https://registry.npmmirror.com \
    || npm install -g pnpm@9 --registry=https://registry.npmjs.org)
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# 启用 Next standalone 输出（仅 Linux 构建镜像时需要）
ENV NEXT_STANDALONE=true

RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 非 root 运行（Next standalone 默认监听 PORT）
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
