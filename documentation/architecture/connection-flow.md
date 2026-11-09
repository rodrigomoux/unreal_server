# Fluxo de conexão do jogador

```mermaid
sequenceDiagram
  participant C as UnrealClient
  participant API as BackendAPI
  participant R as Redis
  participant DB as Mongo
  participant DS as DedicatedServer

  C->>API: POST /auth/login
  API->>DB: validar conta
  API-->>C: access JWT
  C->>API: POST /world/join
  API->>DB: ownership do personagem
  API->>R: capacidade + SET joinToken TTL
  API-->>C: host port joinToken
  C->>DS: Connect + joinToken
  DS->>API: POST /internal/validate-join
  API->>R: GETDEL token
  API-->>DS: ok characterId loadout sessionId
  DS-->>C: spawn
  DS->>API: POST /internal/events/player player.entered
```

## Regras

| Caso | Comportamento |
|------|----------------|
| Token expirado | DS rejeita; client pede novo `/world/join` |
| Token reutilizado | `already_used` |
| Sessão duplicada | Nova sessão substitui; DS deve kickar a anterior (`kickedPreviousSession`) |
| Queda do DS | Health `degraded`/`offline`; restore snapshot + re-join |
| Desconexão | `player.left` limpa sessão ativa no Redis |
