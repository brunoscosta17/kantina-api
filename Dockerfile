# ---- base ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build (com dev deps) ----
FROM base AS build
WORKDIR /app

# 1) deps + schema primeiro
COPY package.json pnpm-lock.yaml ./
COPY src/prisma ./src/prisma
RUN pnpm install --frozen-lockfile

# 2) código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# 3) gera Prisma Client (dev) e builda
RUN pnpm prisma generate --schema=src/prisma/schema.prisma
RUN pnpm build

# 4) troca para node_modules só de produção (sem scripts) E REGENERA o client
RUN rm -rf node_modules \
 && pnpm install --prod --frozen-lockfile --ignore-scripts \
 && pnpm dlx prisma generate --schema=src/prisma/schema.prisma

# ---- runtime ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# nada de instalar no runtime
COPY package.json pnpm-lock.yaml ./

# trazemos:
# - node_modules (prod) com client já gerado
# - dist compilado
# - schema (opcional; útil p/ ferramentas)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/main.js"]
