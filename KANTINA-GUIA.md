# Kantina - Guia Prático de Execução

## Ambiente de Desenvolvimento Local

### 1. Rodando o Backend (API)

#### Pré-requisitos

- Docker e Docker Compose instalados
- Node.js e pnpm instalados (opcional para rodar fora do Docker)

#### Passos

1. **Configure o ambiente:**
   - Edite o arquivo `.env.docker.local` e garanta:
     ```
     FRONTEND_ORIGINS=http://localhost:8081,http://localhost:5173,https://kantina.app.br
     ```

2. **Suba o backend e o banco de dados:**

   ```bash
   docker compose --profile local-db up --build
   ```

   - Isso irá:
     - Subir o banco Postgres
     - Rodar as migrações
     - Rodar o seed demo
     - Subir a API em `http://localhost:3000`

3. **Para ambiente limpo:**

   ```bash
   docker compose --profile local-db down -v
   docker compose --profile local-db up --build
   ```

   - Isso apaga todos os dados e reinicia o ambiente.

### 2. Rodando o Frontend (App)

#### Pré-requisitos

- Node.js e pnpm instalados

#### Passos

1. **Instale as dependências:**
   ```bash
   pnpm install
   ```
2. **Inicie o Expo Web:**

   ```bash
   pnpm expo start --web
   ```

   - O app estará disponível em `http://localhost:8081`

### 3. Testando

- Acesse o frontend em `http://localhost:8081`
- A API estará em `http://localhost:3000`
- Use o código de escola gerado pelo seed demo (veja logs do seed)

---

## Ambiente de Produção

### Backend

1. **Build da imagem Docker:**
   ```bash
   docker build -t kantina-api .
   ```
2. **Configure variáveis de ambiente:**
   - Use um arquivo `.env` com as variáveis corretas (banco, JWT, FRONTEND_ORIGINS, etc.)
3. **Suba o container:**
   ```bash
   docker run -p 3000:8080 --env-file .env kantina-api
   ```

### Hospedagem na Vercel

1. **Deploy do backend na Vercel:**
   - O projeto já está preparado para funcionar como Serverless Function (ver arquivo `src/vercel.ts`).
   - Configure as variáveis de ambiente no painel da Vercel:
     - `NODE_ENV=production`
     - `DATABASE_URL` (exemplo NeonDB ou outro Postgres gerenciado)
     - `JWT_SECRET` (segredo JWT)
     - `FRONTEND_ORIGINS` (origens permitidas do frontend)
     - `SWAGGER_BASE_URL` (opcional, para documentação)
   - O endpoint será algo como `https://<seu-projeto>.vercel.app/api`.
   - Para rotas protegidas, use o header `x-tenant` e o token JWT normalmente.

2. **Deploy do frontend na Vercel:**
   - Faça o build do app web:
     ```bash
     pnpm expo build:web
     ```
   - Suba a pasta `web-build` como projeto estático na Vercel.
   - Configure as variáveis de ambiente do frontend conforme necessário.

3. **Dicas Vercel:**
   - Use o painel de logs da Vercel para depuração.
   - Garanta que as variáveis de ambiente estejam corretas para produção.
   - Para banco NeonDB, use a string de conexão com `sslmode=require`.
   - Documentação Swagger pode ser acessada via `SWAGGER_BASE_URL`.

### Frontend

1. **Build do app para produção:**
   - Para web:
     ```bash
     pnpm expo build:web
     ```
   - Para mobile:
     ```bash
     pnpm expo build:android
     pnpm expo build:ios
     ```
2. **Hospede o build em um serviço de sua escolha (Vercel, Netlify, etc.)**

---

## Dicas

- Sempre garanta que os origins do frontend estejam em `FRONTEND_ORIGINS`.
- Para ambiente limpo, use `down -v` antes de subir o compose.
- Consulte os logs do seed demo para saber o código de escola.
- Para produção, use variáveis seguras e banco de dados dedicado.

---

**Pronto! Com esse guia, você consegue rodar e testar o Kantina localmente e em produção de forma padronizada.**

## Rodar o banco de dados localmente por prompt

- dentro da pasta kantina-api, execute:
  docker compose exec db psql -U postgres -d kantina

## Verificar tenants

- no prompt do Postgres, digite:
  SELECT \* FROM "Tenant";

## Passo a passo para refletir a alterações e testar novamente

1. Parar e limpar o ambiente
   - docker compose --profile local-db down -v

2. Subir o ambiente
   - docker compose --profile local-db up --build

3. Rodar o seed demo ou seed em prod
   - docker compose exec api pnpm dlx tsx prisma/seed.demo.ts
   - docker compose exec api pnpm dlx tsx prisma/seed.ts

4. Verificar o tenant no banco
   - docker compose exec db psql -U postgres -d kantina
   - SELECT \* FROM "Tenant";
