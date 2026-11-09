# DS ↔ Backend bridge contract

## Headers

| Header | Quem envia | Uso |
|--------|------------|-----|
| `x-internal-token` | Dedicated Server | Autenticação serviço-a-serviço |
| `Authorization: Bearer` | Game Client | Apenas rotas públicas (`/auth`, `/world`) |

## Eventos (alto nível)

| type | Quando | Persistência |
|------|--------|--------------|
| `player.entered` | Após spawn autorizado | event log |
| `player.left` | Disconnect / kick | limpa sessão Redis |
| `player.died` | Morte confirmada no DS | event log + possível inventory commit |
| `inventory.commit` | Loot/craft/trade validado | Mongo character |
| `build.commit` | Estrutura permanente aceita | event log (+ snapshot dirty) |
| `world.checkpoint` | Save periódico | metadata Mongo + bytes store |
| `world.heartbeat` | Health | Redis TTL 30s |
| `security.anomaly` | Cheat heuristics | event log |

## Idempotência

Todo commit/evento mutável envia `idempotencyKey` estável (ex.: `inv:{characterId}:{revision}`).
Retries do DS não devem duplicar inventário.
