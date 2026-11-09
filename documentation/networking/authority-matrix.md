# Matriz de autoridade

Categorias:

1. **Client exclusivo** — não altera estado compartilhado  
2. **Client + validação posterior do Server** — prediction/optimistic UX  
3. **Server exclusivo** — estados críticos / competitivos / persistentes  

| Operação | Cat. | Client | Dedicated Server | Backend |
|----------|------|--------|------------------|---------|
| HUD / UI / áudio / VFX / câmera | 1 | Exclusivo | — | — |
| Predição de movimento | 2 | Executa | Reconcilia | — |
| Coleta / uso / reach | 2 | Optimistic UX | Valida e commit | Persistência sob evento |
| Preview de construção | 2 | Preview | Aceita/rejeita | Snapshot/evento |
| Dano / morte / loot final | 3 | Só FX | Exclusivo | Log/persist |
| Inventário persistente / economia | 3 | UI | Runtime apply | Fonte da verdade |
| Progressão / recompensas | 3 | — | Gatilho | Persistência |
| Cosméticos locais | 1 | Exclusivo | — | — |

Endpoint de referência na API: `GET /authority-matrix`.

## Networking Unreal (prioridade)

1. Actor relevancy + interest management  
2. Net dormancy para Actors estáticos/ociosos  
3. **Replication Graph** como baseline para ~100 CCU  
4. Frequência/prioridade por classe de Actor  
5. RPCs enxutos; sem broadcast desnecessário  
6. Iris — avaliar só após escolher versão UE e medir vs Replication Graph  
7. Client prediction + server reconciliation para movimento/ações cat. 2  

**Proibido:** clientes validando uns aos outros para estado persistente.
