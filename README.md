# 🧩 Kantina API

API desenvolvida com **NestJS**, **Prisma ORM** e **PostgreSQL** para o sistema **Kantina**, uma plataforma de gestão de cantinas escolares com suporte a **multi-tenant**, autenticação JWT e documentação interativa via Swagger.

## ⚡️ Quick Start

### 🧰 Pré-requisitos
- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [pnpm](https://pnpm.io/)

### 🚀 Passos rápidos

# 1️⃣ Clonar o repositório
git clone https://github.com/seuusuario/kantina-api.git
cd kantina-api

# 2️⃣ Subir os containers (API + DB)
docker compose --profile local-db up -d --build

# 3️⃣ Criar e popular o banco de dados
docker compose exec api pnpm prisma migrate dev --name init
docker compose exec api pnpm dlx tsx prisma/seed.demo.ts

# ✅ Credenciais demo
# TENANT_ID= <exibido no terminal>
# Email: admin@demo.com
# Senha: admin123

# 4️⃣ Acessar a documentação
# 👉 http://localhost:3000/docs

🚀 Tecnologias utilizadas

Tecnologia	Versão	Descrição
Node.js	20.x	Ambiente de execução JavaScript
NestJS	^11.0.0	Framework backend modular e tipado
Prisma ORM	^6.17.0	ORM para PostgreSQL
PostgreSQL	15+	Banco de dados relacional
Docker + Docker Compose	latest	Ambiente de desenvolvimento isolado
Swagger	integrado	Documentação interativa da API
JWT (Passport)	^11.0.0	Autenticação segura via token
Throttler	^6.4.0	Rate limiting (100 req / 15 min)
bcrypt	^6.0.0	Hash de senhas

🧱 Estrutura do projeto

kantina-api/
│
├── prisma/
│   ├── schema.prisma           # Schema do banco de dados
│   ├── seed.ts                 # Seed padrão
│   └── seed.demo.ts            # Seed com tenant e usuário demo
│
├── src/
│   ├── app.module.ts           # Módulo raiz
│   ├── main.ts                 # Bootstrap da aplicação
│   ├── common/                 # Filtros e interceptors globais
│   ├── auth/                   # Autenticação (login/register)
│   ├── tenants/                # Middleware multi-tenant
│   ├── users/                  # Usuários
│   ├── catalog/                # Produtos e cardápio
│   ├── orders/                 # Pedidos
│   ├── wallets/                # Carteiras digitais
│   └── students/               # Alunos vinculados
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── .env
└── README.md
⚙️ Configuração do ambiente
🔧 Variáveis de ambiente (.env)
env

DATABASE_URL="postgresql://postgres:postgres@db:5432/kantina"
JWT_SECRET="kantina-secret"
FRONTEND_ORIGINS="http://localhost:5173,https://kantina.app.br"
💡 Caso use banco remoto (ex: Neon):

DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

🐳 Execução com Docker
1️⃣ Subir containers

docker compose --profile local-db up -d --build
Isso cria dois containers:

kantina-api → aplicação NestJS

kantina-pg → banco PostgreSQL

Ver logs:


docker compose logs -f api
Encerrar tudo:


docker compose down -v
🧩 Banco de dados & Prisma
Reset do banco

docker compose exec api pnpm prisma migrate reset --force
Criar migração inicial

docker compose exec api pnpm prisma migrate dev --name init
Status das migrações

docker compose exec api pnpm prisma migrate status
🌱 Seed de demonstração

docker compose exec api pnpm dlx tsx prisma/seed.demo.ts
✅ Saída esperada:

nginx

Seed DEMO OK
TENANT_ID= 77abd4e8-76a2-4bd7-ab93-c112886c218a
Login como: admin@demo.com / admin123
🔐 Autenticação e Multi-Tenant
A API usa dois mecanismos:

Header	Tipo	Descrição
x-tenant	apiKey	Identifica o tenant atual (exigido apenas no /auth/login)
Authorization: Bearer <token>	bearer	Token JWT obtido após login

🧠 Fluxo de autenticação (Swagger)
Acesse: http://localhost:3000/docs

Clique em Authorize

No campo tenant (apiKey) insira o TENANT_ID gerado pelo seed

Execute o POST /auth/login:

{
  "email": "admin@demo.com",
  "password": "admin123"
}
Copie o accessToken retornado e insira no campo bearer

Teste as demais rotas autenticadas normalmente

📚 Rotas principais (MVP)
Módulo	Método	Endpoint	Descrição
Auth	POST	/auth/login	Login e geração de token
Auth	POST	/auth/register	Cadastro de usuário
Catalog	GET	/catalog	Lista de produtos
Orders	GET	/orders	Lista de pedidos
Wallets	GET	/wallets/:studentId	Consulta saldo
Wallets	POST	/wallets/:studentId/topup	Adiciona saldo
Wallets	POST	/wallets/:studentId/debit	Debita valor
Wallets	POST	/wallets/:studentId/refund	Reembolsa valor
Reports	GET	/reports/orders	Relatório de pedidos
Reports	GET	/reports/transactions	Relatório de transações
Health	GET	/health	Verifica status da API

🧪 Scripts úteis
Comando	Descrição
pnpm start:dev	Executa em modo desenvolvimento
pnpm build	Compila TypeScript para dist/
pnpm prisma:generate	Atualiza o cliente Prisma
pnpm prisma migrate dev	Aplica migrações locais
pnpm prisma:seed:demo	Executa seed demo
docker compose exec api sh	Acessa o shell do container
docker compose logs -f api	Visualiza logs da API

🧰 Variáveis adicionais
Variável	Descrição
PORT	Porta HTTP da API (padrão: 3000)
JWT_EXPIRES_IN	Tempo de expiração do token (padrão: 900s)
FRONTEND_ORIGINS	Lista de origens permitidas (CORS)
NODE_ENV	Ambiente (development / production)

🧱 Estrutura Multi-Tenant (resumo técnico)
Cada requisição leva x-tenant no header

Middleware insere req.tenantId automaticamente

O AuthService e demais módulos usam tenantId para isolar dados

O JWT inclui a claim tid (tenant ID)

Após login, o tenant é inferido via token — não é mais necessário enviar x-tenant

🧑‍💻 Credenciais de demonstração
Campo	Valor
Email	admin@demo.com
Senha	admin123
Tenant ID	(obtido no seed demo)

🧭 Swagger UI
📍 http://localhost:3000/docs

💡 Deploy em Produção (Docker Compose + NeonDB)
🗂️ Estrutura de arquivos de produção

kantina-api/
├── docker-compose.prod.yml
├── .env.prod
└── ...
📦 Exemplo de .env.prod
env

NODE_ENV=production
PORT=3000

# Banco hospedado (NeonDB, Supabase, Render etc.)
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

JWT_SECRET="kantina-secret"
JWT_EXPIRES_IN="900s"

FRONTEND_ORIGINS="https://kantina.app.br"
🐳 docker-compose.prod.yml
yaml

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: kantina-api-prod
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    environment:
      - NODE_ENV=production
    command: >
      sh -c "pnpm prisma migrate deploy &&
             pnpm start:prod"

🚀 Rodar em produção

docker compose -f docker-compose.prod.yml up -d --build
Ver logs:

docker compose -f docker-compose.prod.yml logs -f api

Acessar:
👉 https://kantina.app.br (em deploy real)
👉 http://localhost:3000/docs (modo local)

🧾 Licença
Projeto interno © 2025 — Kantina.app.br
Desenvolvido por Bruno Costa
