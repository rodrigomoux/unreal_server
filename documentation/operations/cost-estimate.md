# Estimativa de custos (premissas)

**Não usar estes números como fatura.** Cotar na [AWS Pricing Calculator](https://calculator.aws/) e no pricing do MongoDB Atlas para `sa-east-1`.

## Premissas de tráfego (medir no load test)

| Cenário | Egress médio / jogador |
|---------|-------------------------|
| Conservador | 20–40 kbps |
| Intermediário | 50–80 kbps |
| Alto (relevancy ruim) | 100–150 kbps |

Para 100 CCU contínuos / 30 dias, egress total ≈ `kbps * 100 * 86400 * 30 / 8 / 1e9` GB.

## Componentes a cotar

1. EC2 DS On-Demand 24/7 (`c7i.2xlarge` baseline; `4xlarge` se necessário) + EBS gp3  
2. Data Transfer Out (variável dominante se relevancy falhar)  
3. Backend (Fargate/EC2 pequeno)  
4. ElastiCache `cache.t4g.micro` → `small`  
5. MongoDB Atlas M10 → M20  
6. S3 snapshots + versioning  
7. CloudWatch (retenção curta)  
8. ALB (quando API pública)

## Decisões de custo já tomadas no plano

- **EC2** em vez de GameLift managed para 1 mundo 24/7  
- **Atlas** em vez de DocumentDB HA no MVP (DocumentDB tende a sair caro cedo)  
- Standby **frio** (sem EC2 quente duplicado)  

## GameLift

Disponível em `sa-east-1`, mas **fora do MVP** — overhead sem benefício claro para mundo persistente único sempre ligado.
