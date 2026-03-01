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
- SELECT \* FROM "Tenant";

## Verificar os users

- SELECT u.email, u.role, u."tenantId", t.code AS "schoolCode"
  FROM "User" u
  LEFT JOIN "Tenant" t ON u."tenantId" = t.id;

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

## Buildar o projeto sem apagar banco e gerar novo seed

- 1.  Subir o banco de dados e a API (backend) com Docker:

  Abra o terminal e execute:

  cd c:/projects/kantina/kantina-api
  pnpm dev:docker:up

Isso irá:

Subir o banco de dados Postgres (serviço db)
Subir a API (serviço api)
Rodar as migrations e seed demo (apenas na primeira vez, não apaga dados existentes)

- 2.  Iniciar o frontend (app):

  Abra outro terminal e execute:
  - cd c:/projects/kantina/kantina-app pnpm start

## Parar o e subir Docker, apagando o banco e gerando nova seed:

- pnpm dev:docker:down

- pnpm dev:docker:up

ou

docker compose --profile local-db down -v
docker compose --profile local-db up -d --build

Se quiser rodar só a API sem Docker, use:

- pnpm start:dev

## Aqui está o resumo dos comandos para o seu projeto kantina-api:

1. Subir Docker do zero (apaga banco e gera nova seed demo):
   pnpm dev:docker:down
   pnpm dev:docker:up

Ou equivalente:

docker compose --profile local-db down -v
docker compose --profile local-db up --build

2. Rodar a API e o banco normalmente (sem apagar banco, sem gerar nova seed):
   - pnpm dev:docker:up # Sobe API e banco, mantém dados existentes

Ou equivalente:

- docker compose --profile local-db up --build

## Exemplos de usuários e roles

admin@demo.com | ADMIN | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a
gestor@demo.com | GESTOR | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a
operador@demo.com | OPERADOR | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a
resp1@demo.com | RESPONSAVEL | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a
resp2@demo.com | RESPONSAVEL | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a
aluno@demo.com | ALUNO | admin123 | 77abd4e8-76a2-4bd7-ab93-c112886c218a

## Dados inseridos pela seed demo:
Tenant (Escola):
ID: 77abd4e8-76a2-4bd7-ab93-c112886c218a
Nome: "Escola Kantina Demo"
Código: Um número de 6 dígitos gerado aleatoriamente (será mostrado no log do seed)
Usuários criados:

Usuários criados:
Email	              Senha	    Role	      Tenant ID
admin@demo.com	    admin123	ADMIN	      77abd4e8-76a2-4bd7-ab93-c112886c218a
gestor@demo.com	    admin123	GESTOR	    77abd4e8-76a2-4bd7-ab93-c112886c218a
operador@demo.com	  admin123	OPERADOR	  77abd4e8-76a2-4bd7-ab93-c112886c218a
resp1@demo.com	    admin123	RESPONSAVEL	77abd4e8-76a2-4bd7-ab93-c112886c218a
resp2@demo.com	    admin123	RESPONSAVEL	77abd4e8-76a2-4bd7-ab93-c112886c218a
aluno@demo.com	    admin123	ALUNO	      77abd4e8-76a2-4bd7-ab93-c112886c218a

## Como consultar no banco:
1. Conectar ao banco:

docker compose exec db psql -U postgres -d kantina

2. Ver o código do tenant:

SELECT * FROM "Tenant";

3. Ver todos os usuários:

SELECT u.email, u.role, u."tenantId", t.code AS "schoolCode"
FROM "User" u
LEFT JOIN "Tenant" t ON u."tenantId" = t.id;

4. Ver estudantes:

SELECT * FROM "Student";

5. Ver categorias e itens:

SELECT c.name as categoria, ci.name as item, ci."priceCents", ci."isActive"
FROM "Category" c
LEFT JOIN "CatalogItem" ci ON c.id = ci."categoryId"
ORDER BY c."sortOrder", ci.name;

6. Ver carteiras dos alunos:

SELECT s.name as aluno, w."balanceCents"
FROM "Student" s
LEFT JOIN "Wallet" w ON s.id = w."studentId";

7. Para descobrir o código do tenant que foi gerado, você pode executar:

cd /c/projects/Kantina/kantina-api && docker compose exec db psql -U postgres -d kantina -c "SELECT code, name FROM \"Tenant\";"

## Migração para Railway
Como o Flat Controller ainda não resolve o problema do Vercel, vou te preparar a migração para Railway que é a solução definitiva.

Roadmap de Escalabilidade - Longo Prazo:

📅 IMEDIATO (hoje):
└── Railway (Deploy completo funcional)

📅 3-6 MESES (crescimento):  
├── Load Balancer + Multi-instâncias
├── Redis Cache 
└── CDN para assets

📅 6-12 MESES (escala média):
├── Microserviços por domínio
│   ├── Auth Service
│   ├── Catalog Service  
│   ├── Order Service
│   └── Payment Service
└── Message Queue (RabbitMQ)

📅 1-2 ANOS (escala alta):
├── Container Orchestration (K8s)
├── Event-driven architecture
├── CQRS + Event Sourcing
└── Multi-região
