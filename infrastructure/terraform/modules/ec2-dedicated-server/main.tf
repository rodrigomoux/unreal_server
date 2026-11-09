variable "project" {
  type = string
}

variable "instance_type" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "sg_id" {
  type = string
}

resource "aws_instance" "dedicated_server" {
  ami                    = "ami-00000000000000000" # placeholder — replace before real apply
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.sg_id]

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name    = "${var.project}-dedicated-server"
    Role    = "unreal-dedicated-server"
    Project = var.project
  }

  lifecycle {
    ignore_changes = [ami]
  }
}

output "instance_id" {
  value = aws_instance.dedicated_server.id
}
