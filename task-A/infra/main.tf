terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 Bucket for encrypted blobs
resource "aws_s3_bucket" "encrypted_blobs" {
  bucket = var.s3_bucket_name

  tags = {
    Name        = "Solace Encrypted Blobs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "encrypted_blobs" {
  bucket = aws_s3_bucket.encrypted_blobs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "encrypted_blobs" {
  bucket = aws_s3_bucket.encrypted_blobs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "encrypted_blobs" {
  bucket = aws_s3_bucket.encrypted_blobs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# KMS Key for encryption/decryption
resource "aws_kms_key" "decrypt_key" {
  description             = "KMS key for Solace decrypt service"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.lambda_role.arn
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "solace-decrypt-key"
    Environment = var.environment
    Project     = var.project_name
  }
}

# KMS Key Alias
resource "aws_kms_alias" "decrypt_key" {
  name          = "alias/${var.kms_key_alias}"
  target_key_id = aws_kms_key.decrypt_key.key_id
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-lambda-role"
    Environment = var.environment
    Project     = var.project_name
  }
}

# IAM Policy for Lambda
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject"
        ]
        Resource = "${aws_s3_bucket.encrypted_blobs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.decrypt_key.arn
      }
    ]
  })
}

# Lambda Function
resource "aws_lambda_function" "decrypt_service" {
  filename         = var.lambda_zip_path
  function_name    = var.lambda_function_name
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256

  environment {
    variables = {
      S3_BUCKET_NAME = aws_s3_bucket.encrypted_blobs.bucket
      KMS_KEY_ALIAS  = aws_kms_alias.decrypt_key.name
      AWS_REGION     = var.aws_region
    }
  }

  tags = {
    Name        = var.lambda_function_name
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "decrypt_api" {
  name        = "${var.project_name}-api"
  description = "API Gateway for Solace decrypt service"

  tags = {
    Name        = "${var.project_name}-api"
    Environment = var.environment
    Project     = var.project_name
  }
}

# API Gateway Resource
resource "aws_api_gateway_resource" "decrypt_resource" {
  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  parent_id   = aws_api_gateway_rest_api.decrypt_api.root_resource_id
  path_part   = "decrypt"
}

# API Gateway Method
resource "aws_api_gateway_method" "decrypt_method" {
  rest_api_id   = aws_api_gateway_rest_api.decrypt_api.id
  resource_id   = aws_api_gateway_resource.decrypt_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "decrypt_integration" {
  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  resource_id = aws_api_gateway_resource.decrypt_resource.id
  http_method = aws_api_gateway_method.decrypt_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.decrypt_service.invoke_arn
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.decrypt_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.decrypt_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "decrypt_deployment" {
  depends_on = [
    aws_api_gateway_integration.decrypt_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  stage_name  = var.api_stage_name
}

# CORS Configuration
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.decrypt_api.id
  resource_id   = aws_api_gateway_resource.decrypt_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "options_200" {
  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  resource_id = aws_api_gateway_resource.decrypt_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  resource_id = aws_api_gateway_resource.decrypt_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.decrypt_api.id
  resource_id = aws_api_gateway_resource.decrypt_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
} 