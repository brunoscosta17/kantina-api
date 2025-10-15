# Kantina API

Backend do SaaS **Kantina** (gestão de cantina escolar).
Stack (Fase 1): NestJS + Prisma + PostgreSQL (Neon).

## Como foi configurado

- Padrão de formatação: Prettier + EditorConfig (LF).
- Git normalizado com `.gitattributes`.
- Nada de `package.json` ainda (será criado pelo Nest CLI na Fase 1).
  EOF

## Como rodar (Docker Compose)

```bash
cp .env.example .env
docker compose --profile local-db up --build
# http://localhost:3000/docs
```
