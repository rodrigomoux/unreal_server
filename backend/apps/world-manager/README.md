# world-manager

No MVP local, a lógica de mundo/snapshots vive como módulo em `@survival/api`:

- `backend/apps/api/src/services/world-manager.ts`

Extração para processo dedicado fica para quando houver múltiplas instâncias de mundo ou fila pesada de checkpoints.
