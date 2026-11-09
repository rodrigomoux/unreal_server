# Survival Platform

Infraestrutura híbrida para survival multiplayer 3D:

- **Unreal Dedicated Server** — autoridade do mundo e networking em tempo real
- **Node.js + TypeScript** — auth, sessões, persistência e APIs administrativas
- **AWS `sa-east-1`** — hospedagem futura (IaC presente, **não aplicada** nesta fase)

## Escopo atual

Este repositório contém o esqueleto local (código + Docker Compose + Terraform sem apply).

**Não** provisiona recursos AWS. Não rode `terraform apply` até autorização explícita.

## Pré-requisitos

- Node.js 20+ recomendado (16.20+ mínimo)
- Docker / Docker Compose
- (Opcional) Terraform CLI apenas para validar sintaxe local

## Subir infraestrutura local

```bash
cp .env.example .env
npm install
npm run infra:up
npm run build
npm run start:api
```

Serviços locais:

| Serviço | Porta | Notas |
|---------|-------|-------|
| API     | 3000  | Fastify |
| MongoDB | 27017 | Compose |
| Redis   | 6379  | Compose |
| Snapshots | `./data/snapshots` | filesystem local |
| MinIO   | 9000 / 9001 | opcional: `docker compose --profile s3 up -d` |

Conta demo (seed automático em development): `demo@survival.local` / `demo1234`

## Documentação

- [Arquitetura](documentation/architecture/overview.md)
- [Networking / autoridade](documentation/networking/authority-matrix.md)
- [Segurança](documentation/security/validation.md)
- [Operações e load test](documentation/operations/load-test-100ccu.md)
- [Integração Unreal](unreal/dedicated-server/README.md)
- [Terraform (sem apply)](infrastructure/terraform/README.md)

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run infra:up` | Sobe Mongo, Redis e MinIO |
| `npm run infra:down` | Para a stack local |
| `npm run dev:api` | API em modo watch |
| `npm run build` | Compila packages e API |
| `npm test` | Testes do backend |
