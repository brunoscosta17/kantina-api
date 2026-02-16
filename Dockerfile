# ---- base ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build (com dev deps) ----
FROM base AS build
WORKDIR /app

# 1) deps + arquivos necessários para install
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY src/prisma ./src/prisma

RUN pnpm install --frozen-lockfile

# 2) código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# 3) gera Prisma Client e builda
RUN pnpm exec prisma generate --schema=src/prisma/schema.prisma
RUN pnpm build

# 4) deixa node_modules só com prod deps (SEM reinstalar / SEM rodar prisma)
RUN pnpm prune --prod

# ---- migrate (para rodar prisma migrate deploy) ----
FROM base AS migrate
WORKDIR /app

# precisa dos arquivos do prisma + config para rodar migrations
COPY package.json pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY prisma.config.ts ./prisma.config.ts
COPY src ./src

# instala com devDependencies (prisma CLI fica disponível)
RUN pnpm install --frozen-lockfile

# (opcional) gerar client não é obrigatório para migrate, mas não atrapalha
# RUN pnpm exec prisma generate --schema=src/prisma/schema.prisma

CMD ["sh", "-lc", "pnpm exec prisma migrate deploy --schema=src/prisma/schema.prisma"]

# ---- runtime ----
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# nada de instalar no runtime
COPY package.json ./

# trazemos tudo pronto do build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/prisma ./prisma

EXPOSE 8080
CMD ["node", "dist/main.js"]
