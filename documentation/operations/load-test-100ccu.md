# Plano de load test — 100 CCU

## Objetivos

Validar um único mundo com 100 jogadores simultâneos sem saturar tick, CPU ou banda de saída.

## Preparação

1. Baseline Replication Graph + relevancy + dormancy no DS  
2. Instrumentar: tick ms, CPU, RAM, actors replicados/jogador, kbps out/jogador  
3. Backend: latência de validate-join e inventory commit (p95)  

## Ramp

| Etapa | Jogadores | Duração |
|-------|-----------|---------|
| Warm | 10 | 5 min |
| Mid | 50 | 10 min |
| Full | 100 | 20+ min |

## Cenários

1. Exploração dispersa (melhor caso de interest management)  
2. Combate denso em hotspot  
3. Base building / muitas estruturas  
4. Reconnect storm (50 disconnect/reconnect)  
5. Kill do processo DS + restore  

## Critérios de aceite

- Tick dentro do budget definido pelo projeto UE  
- Banda média/jogador dentro da premissa (alvo inicial 20–80 kbps)  
- Zero inventário duplicado sob retries  
- Restore a partir do último snapshot funcional  
- Sem crash / memory leak evidente em 30 min @ 100  

## Ferramentas

- Bots UE headless / Automation workers  
- `curl`/k6 contra API (`/auth`, `/world/join`)  
- CloudWatch no futuro; localmente logs + `docker stats`  

## Ajuste antes de subir instância AWS

Se banda ou tick estourar: reduzir frequência de replicação, aumentar dormancy, apertar relevancy — **não** shardar o mundo no MVP.
