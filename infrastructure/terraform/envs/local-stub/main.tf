terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local stub only — no remote state / no apply in this phase.
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region = var.region

  # Guardrail: refuse real credentials accidental apply in CI/local by default.
  # Remove skip flags only when explicitly authorized to provision AWS.
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  access_key                  = "local-stub"
  secret_key                  = "local-stub"
}

variable "region" {
  type    = string
  default = "sa-east-1"
}

variable "project" {
  type    = string
  default = "survival-platform"
}

variable "ds_instance_type" {
  type    = string
  default = "c7i.2xlarge"
}

variable "max_players" {
  type    = number
  default = 100
}

module "vpc" {
  source     = "../../modules/vpc"
  project    = var.project
  cidr_block = "10.20.0.0/16"
}

module "dedicated_server" {
  source        = "../../modules/ec2-dedicated-server"
  project       = var.project
  instance_type = var.ds_instance_type
  subnet_id     = module.vpc.public_subnet_ids[0]
  sg_id         = module.vpc.dedicated_server_sg_id
}

module "snapshots" {
  source  = "../../modules/s3-snapshots"
  project = var.project
}

module "redis" {
  source     = "../../modules/elasticache"
  project    = var.project
  subnet_ids = module.vpc.private_subnet_ids
  sg_id      = module.vpc.redis_sg_id
}

output "notice" {
  value = "Terraform stub only. DO NOT terraform apply without explicit authorization."
}
