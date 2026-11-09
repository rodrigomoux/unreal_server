# Validação e segurança

## Premissa

O client pode estar modificado. Nunca confiar em HP, recursos, speed, posição sem checagem, hits, tempos de ação ou quantidades informadas pelo client.

## Controles no Dedicated Server

- Caps de velocidade / aceleração  
- Validação de distância e linha de visão  
- Cooldowns server-side  
- Sequence numbers em comandos  
- Anti-replay (join tokens single-use + idempotency keys)  
- Rate limit de RPCs / ações  
- Tolerâncias de divergência + correção forçada  
- Logs de anomalia (`security.anomaly`)  

## Controles no Backend

| Controle | Implementação local |
|----------|---------------------|
| Auth JWT | `@survival/authentication` |
| Join token one-time | Redis `GETDEL` + JWT tipado `join` |
| Internal DS auth | Header `x-internal-token` |
| Rate limit | Redis counters (`RateLimiter`) |
| Idempotência de commits | Índice único `idempotencyKey` no event log |
| Sessão duplicada | `active-character:{id}` no Redis |

## O que não enviar ao backend

- Transforms por frame  
- Inputs brutos contínuos  
- Resultados de física/combate frame-a-frame  

Apenas eventos de alto nível e commits já validados pelo DS.
