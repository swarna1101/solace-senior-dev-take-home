variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "solace-decrypt"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "solace-decrypt-service"
}

variable "lambda_zip_path" {
  description = "Path to the Lambda function zip file"
  type        = string
  default     = "../function.zip"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for encrypted blobs"
  type        = string
  default     = "solace-encrypted-blobs"
}

variable "kms_key_alias" {
  description = "KMS key alias"
  type        = string
  default     = "solace/decrypt"
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
} 