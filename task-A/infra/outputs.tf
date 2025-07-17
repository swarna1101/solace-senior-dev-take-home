output "lambda_function_name" {
  description = "Name of the deployed Lambda function"
  value       = aws_lambda_function.decrypt_service.function_name
}

output "api_gateway_url" {
  description = "Invoke URL for the deployed API Gateway"
  value       = "https://${aws_api_gateway_rest_api.decrypt_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.api_stage_name}/decrypt"
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for encrypted blobs"
  value       = aws_s3_bucket.encrypted_blobs.bucket
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for decryption"
  value       = aws_kms_key.decrypt_key.arn
}

output "kms_key_alias" {
  description = "Alias of the KMS key used for decryption"
  value       = aws_kms_alias.decrypt_key.name
} 