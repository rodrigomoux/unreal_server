# Arquitetura — Survival Multiplayer

## Princípio

Gameplay em tempo real ocorre **somente** entre Unreal Client e Unreal Dedicated Server (networking nativo). O backend Node.js gerencia contas, tokens, inventário persistente, economia e snapshots — nunca movimento, física ou combate frame-a-frame.

## Componentes

| Componente | Responsabilidade |
|------------|------------------|
| Unreal Client | Apresentação, prediction, UX; sem autoridade crítica |
| Unreal Dedicated Server | Autoridade do mundo, replicação, validação |
| Backend API (Fastify) | Auth, join tokens, commits, admin |
| Redis | Tokens one-time, sessões ativas, streams de eventos, health |
| MongoDB | Contas, personagens, event log, metadata de snapshots |
| Snapshot store | Local (`data/snapshots`) agora; S3 depois |

## Mundo único

Um `worldId` + uma `instanceId` compartilhada por até 100 jogadores. Sem shards no MVP. Contratos já carregam esses IDs para expansão futura.

## Fluxo resumido

1. Login → JWT de acesso  
2. `/world/join` → host/porta + join token TTL curto  
3. Client conecta ao DS com o token  
4. DS chama `/internal/validate-join` (single-use)  
5. DS emite eventos de alto nível; backend persiste fora do tick  

## Local vs AWS

| Agora (local) | Futuro (AWS `sa-east-1`) |
|---------------|--------------------------|
| Docker Compose Mongo/Redis/MinIO | EC2 DS, ElastiCache, S3, Atlas |
| Arquivos em `data/snapshots` | Bucket versionado |
| Terraform stub sem apply | Apply somente com autorização |
