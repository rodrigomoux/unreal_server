variable "project" {
  type = string
}

variable "subnet_ids" {
  type = list(string)
}

variable "sg_id" {
  type = string
}

resource "aws_elasticache_subnet_group" "redis" {
  name       = "${var.project}-redis-subnets"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project}-redis"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.redis.name
  security_group_ids   = [var.sg_id]
}

output "primary_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}
