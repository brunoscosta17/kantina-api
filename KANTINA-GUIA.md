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
  pnpm flow:local:reset-demo

2. Rodar a API e o banco normalmente (sem apagar banco, sem gerar nova seed):
  pnpm flow:local:reuse-db

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

ou

docker compose exec db psql -U postgres -d kantina -c "SELECT code, name FROM \"Tenant\";"

## Fluxo de recarga via Pix (Integração Real)

Esta versão da recarga via Pix possui integração real com o **Mercado Pago**, mas já define as abstrações que permitem adicionar outros provedores (como Efí) futuramente.

### 1. Configurar Pix para o tenant

- Endpoint: `PATCH /tenants/:tenantId/pix-config`
- Serviço: TenantsService (método `updatePixConfig`)
- Campos suportados:
  - `pixProvider` (`"mercadopago"` ou `"gerencianet"`)
  - `pixKey`
  - `mercadopagoAccessToken` (e `PublicKey` opcional)
  - `minChargeCents` (valor mínimo de recarga em centavos)

> Em produção (Railway), configure também `PIX_WEBHOOK_SECRET` no serviço da API. O webhook irá esperar o header `x-pix-secret` com esse valor, exceto em chamadas oficiais originadas do Mercado Pago IPN.

### 2. Criar cobrança Pix para a carteira do aluno

- Endpoint: `POST /wallets/:studentId/pix-charge`
- Autenticação: JWT (`Authorization: Bearer <accessToken>`) + `x-tenant` com o código da escola
- Roles permitidas: `RESPONSAVEL`, `ADMIN`, `GESTOR`, `OPERADOR`

Fluxo interno:
- Resolve `tenantId` via JWT ou `TenantMiddleware`.
- Busca o `Tenant` e valida:
  - se `pixProvider` está configurado;
  - se `amountCents >= minChargeCents` (quando definido).
- Chama `PixService.createPixCharge(...)`, que bate na API do Mercado Pago e devolve:
  - `chargeId` (ID oficial da transação no banco original)
  - `pixCopiaCola`
  - `qrCodeImageUrl`
- Grava uma `WalletTransaction` com:
  - `type = 'PIX'`
  - `meta.status = 'pending'`
  - `requestId = chargeId`
- **Não** altera o saldo ainda (aguarda confirmação assíncrona do Pix).

### 3. Confirmar pagamento Pix (webhook e validação)

- Endpoint: `POST /wallets/pix-webhook`
- Controller dedicado: `PixWebhookController` (sem `JwtAuthGuard`)
- O webhook é capaz de parsear notificações do Mercado Pago (Webhooks e IPN).

Fluxo interno:
- Extrai o `chargeId` do payload dinamicamente.
- Procura a transação no banco de dados. Verifica na **API do Mercado Pago original** se `status === 'approved'` (medida anti-fraude).
- Em transação do Prisma:
  - Atualiza `meta.status` para `'paid'`.
  - Incrementa `Wallet.balanceCents` em `amountCents` da transação.
  - O `NotificationsService` é acionado para criar um push notice (Notification) para a `role` do Operador e para o ID do Responsável.

### 4. Polling no Frontend

Enquanto o QRCode está na tela, o aplicativo consulta a rota `GET /wallets/transactions/:txId/status`. Assim que o DB refletir o status `'paid'` (ação do webhook), o frontend quebra o cronômetro local e mostra a tela de SUCESSO.

### 5. Formato de resposta do histórico de recargas/movimentações

Tanto o endpoint de carteira administrativa (`GET /wallets/:studentId`) quanto o endpoint do responsável (`GET /auth/me/wallets`) retornam um histórico já formatado, pronto para exibição no frontend.

Exemplo de carteira (admin/gestor/operador):

```json
{
  "id": "wallet-id",
  "tenantId": "tenant-id",
  "studentId": "student-id",
  "balanceCents": 2500,
  "transactions": [
    {
      "id": "tx-id-1",
      "type": "PIX",
      "label": "Recarga Pix",
      "direction": "CREDIT",
      "amountCents": 2000,
      "createdAt": "2026-03-02T12:34:56.000Z",
      "requestId": "gn_xxxxxxxx",
      "meta": {
        "status": "paid",
        "provider": "gerencianet",
        "note": "Recarga via Pix"
      }
    },
    {
      "id": "tx-id-2",
      "type": "DEBIT",
      "label": "Débito de consumo",
      "direction": "DEBIT",
      "amountCents": 500,
      "createdAt": "2026-03-02T11:00:00.000Z",
      "requestId": "debit-001",
      "meta": {}
    }
  ]
}
```

Regras de formatação usadas internamente:

- `label`:
  - `TOPUP` → `"Recarga manual"`
  - `PIX` → `"Recarga Pix"`
  - `DEBIT` → `"Débito de consumo"`
  - `REFUND` → `"Estorno"`
  - Outros tipos → o próprio valor de `type`.
- `direction`:
  - `TOPUP`, `PIX`, `REFUND` → `"CREDIT"` (entrada de saldo)
  - Qualquer outro (ex.: `DEBIT`) → `"DEBIT"` (saída de saldo).

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

## Vamos para Railway então?
Com os arquivos já preparados (railway.json, Dockerfile.railway, etc.), você está a 10 minutos de ter uma API 100% funcional.

Próximos passos para Railway:
Criar conta: https://railway.app
Conectar GitHub
Deploy automático a partir do seu repositório
Adicionar PostgreSQL plugin
Configurar variáveis de ambiente
Railway vai resolver:

✅ Todos os endpoints POST/PUT/DELETE
✅ Todas as sub-rotas (/auth/login, /catalog/items, etc.)
✅ PostgreSQL gerenciado
✅ SSL automático
✅ Logs completos
✅ Escalabilidade real

##  ROADMAP DE ESCALABILIDADE COMPLETO

Fase 1: Railway (Hoje - 1 semana)
✅ Deploy funcional em 15 minutos
✅ PostgreSQL managed
✅ SSL automático
✅ Logs centralizados
Custo: $5-15/mês

Fase 2: Otimização (1-3 meses)
🔄 Redis para cache e sessões
🔄 CDN (Cloudflare) para assets
🔄 Monitoring (Railway + DataDog)
Custo: $20-50/mês

Fase 3: Microserviços (6-12 meses)
├── kantina-auth-service    (Railway)
├── kantina-catalog-service (Railway)  
├── kantina-order-service   (Railway)
└── kantina-payment-service (Railway)

Fase 4: Enterprise (1-2 anos)
🏗️ Kubernetes (GKE/EKS)
🏗️ Event-driven (Pub/Sub)
🏗️ Multi-região
Custo: $500+/mês

## Limitações Atuais (Vercel)
Problema Fundamental:

Vercel foi projetado para sites estáticos e APIs simples
Serverless Functions têm timeouts de 10s (hobby) / 15s (pro)
Não suporta rotas complexas do NestJS
Cold starts impactam performance
Sem persistência de estado entre requisições
Impacto no Kantina:

❌ POST /auth/login → 404
❌ PUT /catalog/items → 404  
❌ DELETE /orders → 404
❌ WebSockets → Impossível
❌ Background jobs → Impossível
❌ File uploads → Limitado

Vantagens Estratégicas do Railway:

1. Arquitetura Adequada

Railway:
  ✅ Containers completos (não serverless)
  ✅ Persistent processes 
  ✅ Suporte total ao NestJS
  ✅ WebSockets nativo
  ✅ Background jobs
  ✅ File system access

2. Escalabilidade Preparada

Crescimento Orgânico:
  Hoje: 1 cantina → $5-10/mês
  10 cantinas → $20-30/mês  
  50 cantinas → $100-150/mês
  100+ cantinas → $300-500/mês
  
Auto-scaling:
  ✅ CPU/Memory scaling automático
  ✅ Multiple replicas 
  ✅ Load balancing integrado

3. Database Performance

-- Railway PostgreSQL vs Vercel External DB
Railway: 
  ✅ <5ms latency (mesmo datacenter)
  ✅ Connection pooling nativo
  ✅ Automatic backups
  ✅ Point-in-time recovery

Vercel + External:
  ❌ 50-200ms latency  
  ❌ Connection limits
  ❌ Cold connection overhead

🏗️ Comparação com Alternativas
Railway vs AWS/GCP/Azure

Railway:
  ✅ Deploy em 5 minutos
  ✅ Zero DevOps complexity  
  ✅ Automatic SSL/DNS
  ✅ Built-in monitoring
  ❌ Vendor lock-in moderate

AWS/GCP:
  ❌ Setup: semanas/meses
  ❌ DevOps expertise required
  ❌ Configuration complexity
  ✅ Ultimate flexibility

Railway vs Heroku

Railway:
  ✅ Pricing moderno ($5-20/app)
  ✅ Modern tooling
  ✅ No dyno sleep
  ✅ Better performance
  
Heroku:
  ❌ Expensive ($25-50+/app)
  ❌ Legacy platform
  ❌ Dyno sleeping (hobby)

📈 Roadmap de Escalabilidade Detalhado
Fase 1: MVP → 10 Cantinas (Railway Monolito)

Timeframe: 0-6 meses
Architecture: 
  └── kantina-api (NestJS monolito)
      ├── Multi-tenant by design ✅
      ├── PostgreSQL (Railway)
      └── Redis cache

Capacity: 10 cantinas, 1000+ usuários
Cost: $30-50/mês

Fase 2: 10-50 Cantinas (Railway + Otimizações)

Timeframe: 6-12 meses  
Additions:
  ├── CDN (Cloudflare) para assets
  ├── Redis para sessions/cache
  ├── Background jobs (Bull/Agenda)
  ├── Monitoring (DataDog/New Relic)
  └── Multiple Railway instances

Capacity: 50 cantinas, 5000+ usuários  
Cost: $100-200/mês

Fase 3: 50+ Cantinas (Microserviços)

Timeframe: 1-2 anos
Migration Strategy:
  ├── kantina-auth-service     (Railway)
  ├── kantina-tenant-service   (Railway)  
  ├── kantina-catalog-service  (Railway)
  ├── kantina-order-service    (Railway)
  ├── kantina-payment-service  (Railway)
  └── kantina-notification     (Railway)

Database Strategy:
  ├── Auth DB (PostgreSQL)
  ├── Tenant DB (PostgreSQL) 
  ├── Catalog DB (PostgreSQL)
  ├── Orders DB (PostgreSQL)
  └── Analytics DB (ClickHouse)

Capacity: Unlimited cantinas
Cost: $500-1000/mês

Fase 4: Enterprise (K8s/Cloud)

Timeframe: 2+ anos
Platform: Kubernetes (GKE/EKS) 
Patterns:
  ├── Event-driven architecture
  ├── CQRS + Event Sourcing
  ├── API Gateway (Kong/Traefik)
  ├── Service Mesh (Istio)
  └── Multi-região deployment

Capacity: National scale
Cost: $2000+/mês

💰 Análise Financeira
ROI Comparison (12 meses)

Opção 1 - Vercel (Limitado):
  Deploy: ❌ Funcionalidade limitada
  Manutenção: Alto (workarounds)
  Escalabilidade: ❌ Impossível
  
Opção 2 - AWS DIY:
  Setup: $5000-15000 (DevOps)
  Deploy: 1-3 meses  
  Manutenção: $2000+/mês (DevOps)
  
Opção 3 - Railway:
  Setup: $0 (você mesmo)
  Deploy: 15 minutos
  Manutenção: $100-500/mês
  Migration: Smooth para K8s quando necessário

🎯 Por que Railway é Perfeito para Kantina
1. Multi-tenancy Ready

// Sua arquitetura já está preparada
@Injectable() 
export class TenantMiddleware {
  // Cada cantina = tenant isolado ✅
  // Database per tenant ou shared ✅  
  // Scaling horizontal natural ✅
}

2. Performance Requirements

Cantina Typical Load:
  ├── Horário pico: 11:30-13:30
  ├── Concurrent orders: 50-200/cantina
  ├── Response time: <500ms required
  └── Uptime: 99.9% required

Railway Capabilities:
  ✅ Auto-scale durante picos
  ✅ Response time: <100ms
  ✅ Uptime: 99.95%+
  ✅ Geographic distribution ready

3. Developer Experience

# Deploy atual (problemático)
vercel deploy → ❌ Rotas não funcionam

# Deploy Railway (funcional)  
git push → ✅ Deploy automático completo
railway logs → ✅ Debug real-time
railway shell → ✅ Access direto ao container

🔮 Visão de Futuro
Railway como Stepping Stone Ideal

Immediate (Railway):
  ✅ Resolve todos problemas atuais
  ✅ Permite focar no produto, não infraestrutura
  ✅ Scaling automático até 50+ cantinas
  ✅ Migration path clara para enterprise

Long-term (K8s):
  ✅ Railway prepara para Kubernetes
  ✅ Container-first desde início
  ✅ Microservices transition natural
  ✅ Multi-cloud ready

Railway Lock-in: Mínimo
├── Containers Docker → Portable
├── PostgreSQL → Standard
├── Environment vars → Standard  
├── CI/CD → Git-based
└── Migration: 1-2 semanas para qualquer cloud

🏆 Decisão Estratégica
Para Kantina especificamente:

Imediato: Railway resolve 100% dos problemas atuais em 15 minutos
6 meses: Suporta crescimento orgânico até 20-30 cantinas
12 meses: Microservices migration suave no próprio Railway
24 meses: Kubernetes migration com zero vendor lock-in
Alternativas Descartadas:

❌ Vercel: Não funciona para APIs complexas
❌ AWS direto: Overkill e complexity desnecessária agora
❌ Heroku: Caro e legado
❌ DigitalOcean App: Menos features que Railway
Railway é a escolha estratégica perfeita: resolve hoje, escala amanhã, migra facilmente depois.

## Fluxos de trabalho (scripts principais)

Para facilitar o dia a dia, use estes fluxos prontos (sempre na pasta `kantina-api`).

### 1. Testar API localmente com banco e seed atuais

- Script: `pnpm flow:local:reuse-db`
- O que faz:
  - Sobe Docker com o profile `local-db` usando os dados existentes.
  - Mantém o banco como está; ótimo quando você não quer perder dados de teste.

### 2. Testar localmente com banco zerado + seed demo nova

- Script: `pnpm flow:local:reset-demo`
- O que faz:
  - `pnpm dev:docker:down` → derruba containers e volumes (apaga o banco).
  - `pnpm dev:docker:up` → sobe Postgres + API, aplica migrations e roda a seed demo.
- Use quando quiser um ambiente completamente limpo, com os dados padrão da seed demo.

### 3. Testar alterações de schema Prisma (local)

- Script: `pnpm flow:local:schema`
- O que faz:
  - `pnpm db:migrate:dev` → gera/aplica migrations no banco de desenvolvimento local (usando `DATABASE_URL` da máquina).
  - `pnpm dev:docker:reset-demo` → recria o ambiente Docker com o novo schema e seed demo nova.
- Fluxo recomendado quando você altera `src/prisma/schema.prisma`.

### 4. Testar e subir mudanças para produção (Railway)

- Script: `pnpm flow:prod:full`
- O que faz:
  1. `pnpm deploy:prod` → roda lint, testes e dá `git push origin main`.
  2. `pnpm db:migrate:railway` → aplica migrations pendentes no Postgres da Railway usando `.env.railway.local`.
- Pré‑requisitos:
  - Railway configurada para fazer deploy automático a partir da branch `main`.
  - Arquivo `.env.railway.local` com `DATABASE_URL` apontando para o Postgres público da Railway.

## Ambiente de Produção - Railway (Passo a passo)

Esta seção documenta exatamente como o Kantina foi configurado para rodar na Railway e como você deve operar o ambiente de produção (deploy, migrations, seed e testes).

### 1. Criar projeto e serviços na Railway

1. Crie uma conta em https://railway.app e faça login.
2. Clique em **New Project → Deploy from GitHub** e selecione o repositório que contém a pasta `kantina-api`.
3. Dentro do projeto, crie um serviço **Postgres** (plugin nativo da Railway).
4. Certifique‑se de que:
  - Existe um serviço chamado algo como **kantina-api** apontando para a pasta `kantina-api` do repositório.
  - O serviço **kantina-api** está ligado ao serviço **Postgres** (Railway faz isso automaticamente quando você usa a variável `Postgres.DATABASE_URL`).

### 2. Configuração de build e start

O arquivo [kantina-api/railway.json](kantina-api/railway.json) já está preparado para a Railway:

- Builder: Nixpacks (automático).
- Comandos:
  - `buildCommand`: `pnpm install && pnpm run build`
  - `startCommand`: `node dist/main`

Você não precisa configurar isso manualmente no painel; basta manter o `railway.json` versionado que a Railway lê essas instruções no deploy.

### 3. Variáveis de ambiente na Railway

No serviço **kantina-api**, configure as variáveis em **Variables**:

Obrigatórias:

- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`  (selecione a variável gerada automaticamente pelo plugin Postgres)
- `JWT_SECRET=...` (segredo para tokens de acesso)
- `JWT_REFRESH_SECRET=...` (segredo para tokens de refresh)
- `FRONTEND_ORIGINS=http://localhost:8081,http://localhost:5173,https://kantina.app.br` (ajuste conforme seus frontends reais)

Opcionais úteis:

- `SWAGGER_BASE_URL=https://kantina-api-production.up.railway.app` (faz o Swagger apontar para a URL pública correta).
 - `PIX_WEBHOOK_SECRET=...` (segredo compartilhado usado pelo endpoint `POST /wallets/pix-webhook` via header `x-pix-secret`).

Após salvar as variáveis, faça um **Redeploy** do serviço para que elas entrem em vigor.

### 4. Saúde, documentação e testes em produção

- Health check: `GET https://kantina-api-production.up.railway.app/health`
- Documentação Swagger: `GET https://kantina-api-production.up.railway.app/docs`
- Endpoint utilitário para popular dados demo: `POST https://kantina-api-production.up.railway.app/create-demo-data`

Esse último cria um tenant de demonstração com usuários e itens básicos para testes. A resposta traz o `tenant.code` e credenciais padrão (por exemplo `admin@demo.com` / `admin123`).

### 5. Scripts locais para operar o ambiente Railway

Para facilitar a operação, foram criados scripts no [kantina-api/package.json](kantina-api/package.json).

#### 5.1. Arquivo `.env.railway.local`

Crie um arquivo `.env.railway.local` na pasta `kantina-api` contendo, no mínimo:

```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:SEU_TOKEN@ballast.proxy.rlwy.net:PORTA/railway
```

Use a **Connection URL (Public Network)** exibida no plugin Postgres da Railway (não use o host interno `postgres.railway.internal`).

Esse arquivo é usado **apenas** pelos comandos Prisma rodando da sua máquina, nunca é enviado para o servidor.

#### 5.2. Rodar migrations em produção

Script:

- `pnpm db:migrate:railway`

O que faz:

- Usa `dotenv -e .env.railway.local` para carregar o `DATABASE_URL` público da Railway.
- Executa `prisma migrate deploy --schema=src/prisma/schema.prisma` contra o Postgres da Railway.

Quando usar:

- Sempre que você criar/alterar modelos no `schema.prisma` e gerar novas migrations localmente, rode esse comando para aplicar as migrations também em produção.

#### 5.3. Rodar seed demo em produção (opcional)

Script:

- `pnpm db:seed:railway:demo`

O que faz:

- Usa `.env.railway.local` para conectar no Postgres da Railway.
- Executa `tsx src/prisma/seed.demo.ts`, populando o banco com dados de demonstração (tenant, usuários, catálogo etc.).

Use com cuidado em produção real; é ideal para ambientes de staging ou para preparar um ambiente de demo.

#### 5.4. Deploy simplificado da API

Script:

- `pnpm deploy:prod`

O que faz:

1. `pnpm lint` – roda o ESLint no projeto.
2. `pnpm test` – executa a suíte de testes.
3. `git push origin main` – envia a branch `main` para o repositório remoto.

Pré‑requisito:

- O projeto Railway deve estar configurado para fazer deploy automático a partir da branch `main` desse repositório.

Fluxo recomendado ao adicionar um novo recurso na API:

1. Implementar a feature e, se necessário, criar migrations locais (
  - `pnpm db:migrate:dev` para ambiente local).
2. Rodar testes localmente se desejar (`pnpm test`).
3. Comitar as mudanças normalmente (`git add`, `git commit`).
4. Rodar `pnpm deploy:prod`.
5. Após o deploy concluir na Railway, se houve mudanças de schema, executar `pnpm db:migrate:railway` para atualizar o banco de produção.

### 6. Coleção Insomnia para testar a API na Railway

O arquivo [kantina-api/insomnia-kantina-api-railway.json](kantina-api/insomnia-kantina-api-railway.json) contém uma coleção pronta para o Insomnia.

Como usar:

1. No Insomnia: `Application → Import/Export → Import Data → From File`.
2. Selecione `insomnia-kantina-api-railway.json`.
3. O workspace **"Kantina API - Railway"** será criado com:
  - Pastas: Setup, Auth (Flat), Catalog (Flat), Auth (API), Catalog (API), Orders, Wallets.
  - Variáveis de ambiente (`base_url`, `tenant_code`, tokens) já configuradas para a Railway.
4. Fluxo típico de teste em produção:
  - `POST Create Demo Data` → obtém `tenant_code`.
  - `POST Login (API)` → obtém `accessToken`/`refreshToken`.
  - Testar endpoints de catálogo, pedidos e carteiras usando o header `Authorization: Bearer <accessToken>`.

  ## Como descobrir rapidamente tenant/code e logins de teste

  Você tem três formas principais de obter as informações de acesso para testes (tenant, códigos e usuários demo):

  1. **Seed demo local (Docker)**
    - Comando de fluxo: `pnpm flow:local:reset-demo`.
    - Isso executa o seed demo (`src/prisma/seed.demo.ts`) dentro do container.
    - Veja os logs do serviço `seed` (por exemplo com `docker compose logs seed`) e procure por um bloco como:
      - `TENANT_ID=...`
      - `TENANT_CODE=...`
      - lista de e-mails por role (ADMIN, GESTOR, OPERADOR, RESPONSÁVEIS, ALUNO), todos com senha `admin123`.

  2. **Seed demo apontando para a Railway**
    - Comando: `pnpm db:seed:railway:demo`.
    - Usa `.env.railway.local` para conectar no Postgres da Railway e roda o mesmo `seed.demo.ts`.
    - O resumo completo (tenant id, código e logins) é impresso direto no seu terminal local.

  3. **Endpoint utilitário em produção**
    - Endpoint: `POST https://kantina-api-production.up.railway.app/create-demo-data`.
    - A resposta JSON já traz:
      - `tenant.code` (código da escola para usar no header `x-tenant`).
      - `login.email` / `login.password` (usuário ADMIN).
      - `testUsers` com e-mail, senha e role de cada tipo de usuário.

  Recomendação prática:

  - Para desenvolvimento local: use sempre o fluxo `pnpm flow:local:reset-demo` e leia os logs do seed.
  - Para ambientes ligados à Railway (staging/prod): use `pnpm db:seed:railway:demo` ou o endpoint `/create-demo-data` conforme o cenário.

## Fluxo para atualizar banco em produção (Railway)

Pré‑requisito: arquivo .env.railway.local com DATABASE_URL apontando para o Postgres público da Railway.

No terminal, na pasta kantina-api:

pnpm db:migrate:railway → aplica todas as migrations pendentes no banco da Railway.

Opcional: pnpm db:seed:railway:demo → roda o seed demo no banco da Railway.

Isso substitui aquele comando manual longo que você rodou antes.

## Fluxo para subir código para produção

Pressupondo que a Railway está conectada ao seu repositório GitHub e que a branch main dispara o deploy:

Faz suas alterações de código.

git add . && git commit -m "feat: nova feature X" (commit manual).

Na pasta kantina-api:

pnpm deploy:prod

Ele vai:
Rodar lint e test localmente.
Se estiver tudo ok, dar git push origin main.
A Railway pega o novo commit na main e faz o deploy automaticamente.
