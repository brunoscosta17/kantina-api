# 🧩 Kantina API

API desenvolvida com **NestJS**, **Prisma ORM** e **PostgreSQL** para o sistema **Kantina**, uma plataforma de gestão de cantinas escolares com suporte a **multi-tenant**.

---

## 🚀 Tecnologias utilizadas

| Tecnologia                  | Versão    | Descrição                          |
| --------------------------- | --------- | ---------------------------------- |
| **Node.js**                 | 20.x      | Ambiente de execução JavaScript    |
| **NestJS**                  | ^11.0.0   | Framework backend modular e tipado |
| **Prisma ORM**              | ^6.17.0   | ORM para banco PostgreSQL          |
| **PostgreSQL**              | 15+       | Banco de dados relacional          |
| **Docker + Docker Compose** | latest    | Gerenciamento de ambiente local    |
| **Swagger**                 | integrado | Documentação interativa da API     |
| **JWT (Passport)**          | ^11.0.0   | Autenticação segura com tokens     |
| **Throttler**               | ^6.4.0    | Rate limiting de requisições       |
| **bcrypt**                  | ^6.0.0    | Hash de senhas                     |

---

## 🧱 Estrutura do projeto

kantina-api/
│
├── prisma/
│ ├── schema.prisma # Schema do banco de dados
│ ├── seed.ts # Seed padrão
│ └── seed.demo.ts # Seed com tenant e usuário de demonstração
│
├── src/
│ ├── app.module.ts # Módulo raiz da aplicação
│ ├── main.ts # Ponto de entrada (bootstrap)
│ ├── common/ # Filtros, interceptors e middlewares
│ ├── auth/ # Módulo de autenticação (login/register)
│ ├── tenants/ # Middleware e guardas de tenant
│ ├── users/ # CRUD de usuários
│ ├── catalog/ # Produtos e cardápio
│ ├── orders/ # Pedidos
│ ├── wallets/ # Carteiras digitais
│ └── students/ # Alunos vinculados ao tenant
│
├── Dockerfile # Build da imagem da API
├── docker-compose.yml # Serviços API + Banco de dados
├── package.json # Scripts e dependências
├── .env # Variáveis de ambiente (local)
└── README.md # Este documento

⚙️ Configuração do ambiente

# Banco de dados (modo local)

DATABASE_URL="postgresql://postgres:postgres@db:5432/kantina"

# JWT

JWT_SECRET="kantina-secret"

# Opcional: Banco remoto (Neon)

# DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

🐳 Execução com Docker

1️⃣ Build e subir containers

docker compose --profile local-db up -d --build

Isso cria dois containers:

kantina-api → aplicação NestJS

kantina-pg → banco PostgreSQL

2️⃣ Executar seed demo

docker compose exec api pnpm dlx tsx prisma/seed.demo.ts

✅ Saída esperada:

Seed DEMO OK
TENANT_ID= f9d0f15f-dc95-4b79-8b67-d8dcf0132ae4
Login como: admin@demo.com / admin123

🧠 Autenticação e Multi-Tenant

A API usa dois mecanismos de autenticação:

Header Tipo Descrição
x-tenant apiKey Identifica o tenant atual (exigido no /auth/login)
Authorization: Bearer <token> bearer Token JWT obtido após login

🔐 Fluxo completo

Vá até http://localhost:3000/docs

Clique em Authorize

tenant (apiKey) → cole o TENANT_ID do seed
(ex: f9d0f15f-dc95-4b79-8b67-d8dcf0132ae4)

bearer (http) → deixe vazio por enquanto

3 Execute a rota POST /auth/login

{
"email": "admin@demo.com",
"password": "admin123"
}

4 Copie o valor de accessToken retornado.

5 Volte em Authorize, e preencha o campo bearer com o token.

5 Agora todas as rotas autenticadas funcionarão automaticamente.

🧩 Rotas principais (MVP)
Módulo Método Endpoint Descrição
Auth POST /auth/login Login e geração de token
Auth POST /auth/register Cadastro de usuário (por tenant)
Catalog GET /catalog Lista de produtos do tenant
Orders GET /orders Lista de pedidos realizados
Wallets GET /wallets Consulta saldo e transações
Students GET /students Lista alunos vinculados
Tenants GET /tenants Admin: listar tenants (opcional)

🧪 Scripts úteis
Comando Descrição
pnpm start:dev Executa em modo desenvolvimento
pnpm build Compila TypeScript para dist/
pnpm prisma:generate Atualiza o cliente Prisma
pnpm prisma migrate dev Aplica migrações locais
pnpm prisma:seed Executa seed padrão
pnpm prisma:seed:demo Executa seed com tenant e admin demo
pnpm lint Corrige formatação e lint
pnpm test Executa testes unitários
docker compose exec api sh Acessa o shell dentro do container
docker compose logs -f api Visualiza logs da aplicação

🧰 Variáveis adicionais (para deploy futuro)
Variável Descrição
PORT Porta HTTP da aplicação (padrão: 3000)
JWT_EXPIRES_IN Tempo de expiração do token (ex: 900s)
FRONTEND_ORIGINS Lista de origens permitidas (CORS)
DATABASE_URL String de conexão completa do banco
NODE_ENV Define o modo (development ou production)

🧪 Testes

Os testes usam Jest e são estruturados por módulo.

pnpm test
pnpm test:watch

Para executar no container:

docker compose exec api pnpm test

🧱 Estrutura Multi-Tenant (resumo técnico)

Cada requisição carrega x-tenant no header.

O middleware de tenant intercepta a requisição e injeta req.tenantId.

O AuthService e demais módulos utilizam tenantId para isolar dados.

O JWT inclui a claim tid (tenant ID).

Após login, o tenant passa a ser inferido pelo token (sem header adicional).

🧑‍💻 Credenciais de demonstração
Campo Valor
Email admin@demo.com
Senha admin123
Tenant ID (obtido do seed demo)

📦 Deploy (exemplo)

Para gerar uma imagem pronta para produção:

docker build -t kantina-api:prod .
docker run -d -p 3000:3000 --env-file .env kantina-api:prod

🧾 Licença

Projeto interno © 2025 — Kantina.app.br
Desenvolvido por Bruno Costa.
