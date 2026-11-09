variable "project" {
  type = string
}

resource "aws_s3_bucket" "snapshots" {
  bucket = "${var.project}-world-snapshots-sa-east-1"

  tags = {
    Project = var.project
    Purpose = "world-snapshots"
  }
}

resource "aws_s3_bucket_versioning" "snapshots" {
  bucket = aws_s3_bucket.snapshots.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "snapshots" {
  bucket                  = aws_s3_bucket.snapshots.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_name" {
  value = aws_s3_bucket.snapshots.bucket
}
