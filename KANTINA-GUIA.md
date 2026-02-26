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
