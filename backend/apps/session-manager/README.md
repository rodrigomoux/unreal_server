# session-manager

No MVP local, a lógica de sessão vive como módulo em `@survival/api`:

- `backend/apps/api/src/services/session-manager.ts`

Este app separado existe na estrutura para extração futura (processo próprio) quando a carga de tokens/reconnect justificar isolamento.
