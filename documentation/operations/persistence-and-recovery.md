# Persistência e recuperação

## Modelo

- Estado runtime vive no Dedicated Server  
- Checkpoints periódicos (opaco `dataBase64`) → store local / S3 futuro  
- Commits de inventário/economia via `/internal/inventory/commit`  
- Event log append-only com idempotência  

## Endpoints internos

| Método | Path | Uso |
|--------|------|-----|
| POST | `/internal/world/checkpoint` | Grava snapshot |
| GET | `/internal/world/restore-latest` | Restore drill |
| GET | `/internal/world/snapshots` | Lista metadados |
| POST | `/internal/inventory/commit` | Persistência de inventário |

## Restore drill (local)

1. Subir infra (`npm run infra:up`) e API  
2. DS (ou curl) envia checkpoint  
3. Simular queda do processo DS  
4. `GET /internal/world/restore-latest`  
5. Confirmar checksum/bytes e reabrir mundo  

## RTO inicial

Standby frio: minutos (snapshot + boot DS), não zero-downtime. Aceitável para MVP de mundo único.
