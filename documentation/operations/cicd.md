# CI/CD e atualização do Dedicated Server

## CI atual

Workflow: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)

- `npm install` / `npm run build` / `npm test`
- Guardrail: **proíbe** `terraform apply` no CI

## Deploy API (futuro)

1. Build imagem `infrastructure/docker/Dockerfile.api`
2. Push para registry
3. Rolling update em ECS/EC2
4. Health check `GET /health`

## Atualização do Dedicated Server

1. Janela de manutenção / `status=maintenance`
2. Kick/drain de jogadores
3. Checkpoint forçado (`/internal/world/checkpoint`)
4. Troca do build do DS
5. Restore (`/internal/world/restore-latest`)
6. Heartbeat `online` + liberar joins
7. Clients com `protocolVersion` incompatível são rejeitados

## AWS

Terraform em `infrastructure/terraform` é **stub**. Aplicar somente com autorização explícita.
