# ---- base ----
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ---- build ----
FROM base AS build
WORKDIR /app

# lock + deps para ci
COPY package.json pnpm-lock.yaml ./

# ⚠️ agora copiamos o schema a partir de src/prisma
COPY src/prisma ./src/prisma

# instale deps (dev incluído) para compilar
RUN pnpm install --frozen-lockfile

# copie o restante do código
COPY tsconfig*.json nest-cli.json ./
COPY src ./src

# gere o Prisma Client usando o novo caminho do schema
RUN pnpm prisma generate --schema=src/prisma/schema.prisma

# build do Nest (gera dist/**, incluindo dist/prisma/seed.js)
RUN pnpm build


# --- runtime stage ---
FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# leve os artefatos compilados
COPY --from=build /app/dist ./dist

# coloque o schema no caminho que o Prisma espera em prod (/app/prisma)
# (copiamos do src para /prisma)
COPY --from=build /app/src/prisma ./prisma

# (opcional, mas útil quando só copiamos node_modules prod)
RUN pnpm dlx prisma generate --schema=prisma/schema.prisma

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]
