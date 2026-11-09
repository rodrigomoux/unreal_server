# Terraform (AWS) — NÃO APLICAR

Este diretório contém o esqueleto de IaC para `sa-east-1`.

## Regra operacional

- É permitido: `terraform fmt`, `terraform validate` (com backend local).
- **É proibido** nesta fase: `terraform apply`, `terraform destroy`, criação manual de recursos AWS.

Somente rode apply após autorização explícita do responsável pelo projeto.

## Módulos previstos

| Módulo | Função |
|--------|--------|
| `modules/vpc` | VPC, subnets, security groups |
| `modules/ec2-dedicated-server` | EC2 do Unreal Dedicated Server |
| `modules/s3-snapshots` | Bucket de snapshots do mundo |
| `modules/elasticache` | Redis para tokens/eventos |

## Variáveis críticas (futuro)

- `region = "sa-east-1"`
- `ds_instance_type` (ex.: `c7i.2xlarge`)
- `max_players = 100`
