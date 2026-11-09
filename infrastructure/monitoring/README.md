# Monitoring

## Local (agora)

- Logs da API via Fastify logger  
- `docker stats` / healthchecks do Compose  
- Event log em Mongo (`event_log`)  

## AWS (futuro — sem provisionar agora)

- CloudWatch metrics: CPU/RAM/rede do EC2 DS  
- Alarmes de processo/health do DS  
- Retenção curta de logs para custo  
- Dashboard: playerCount (Redis health), join failures, inventory commit errors  

## Sinais importantes

| Sinal | Origem |
|-------|--------|
| `world:health` | Redis (TTL 30s) |
| Tick time / actors replicated | Unreal DS metrics |
| Auth/join 4xx/5xx | API logs |
| Anomalias | `security.anomaly` events |
