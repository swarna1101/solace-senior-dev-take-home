# Task A: Enclave-Style Decryption Service

## Overview

This task implements a secure decryption service using AWS Lambda and KMS to emulate a Trusted Execution Environment (TEE). The service receives encrypted blob keys, fetches the encrypted data from S3, and decrypts it using AWS KMS with strict IAM policies.

## Architecture

```
Client Request → API Gateway → Lambda Function → S3 (fetch encrypted blob) → KMS (decrypt) → Response
```

## Features

- **Secure Decryption**: Uses AWS KMS for hardware-backed key management
- **Least Privilege**: IAM policies restrict KMS usage to only this Lambda function
- **Encryption at Rest**: S3 bucket enforces encryption
- **HTTPS Only**: API Gateway enforces secure communication
- **CORS Support**: Configured for web client access

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** (>=1.0) or **AWS SAM CLI**
3. **Node.js** (>=16.x) for local testing
4. **AWS Account** with permissions for:
   - Lambda functions
   - KMS (Key Management Service)
   - S3 buckets
   - IAM roles and policies
   - API Gateway

## Quick Start

### 1. Deploy Infrastructure

```bash
cd task-A/infra
terraform init
terraform plan
terraform apply
```

### 2. Test the Service

```bash
# Test with sample encrypted blob
./tests/decrypt_test.sh
```

### 3. Manual Testing

```bash
# Using curl
curl -X POST https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod/decrypt \
  -H "Content-Type: application/json" \
  -d '{"blobKey": "sample-encrypted-blob.txt"}'
```

## Project Structure

```
task-A/
├── src/
│   ├── index.js              # Lambda function handler
│   └── utils/
│       ├── s3.js            # S3 operations
│       └── kms.js           # KMS operations
├── infra/
│   ├── main.tf              # Terraform configuration
│   ├── variables.tf         # Input variables
│   └── outputs.tf           # Output values
├── tests/
│   ├── decrypt_test.sh      # End-to-end test script
│   └── sample_data/         # Test encrypted blobs
└── README.md               # This file
```

## Environment Variables

The Lambda function uses these environment variables:

- `S3_BUCKET_NAME`: S3 bucket containing encrypted blobs
- `KMS_KEY_ALIAS`: KMS key alias for decryption
- `AWS_REGION`: AWS region for services

## Security Features

1. **KMS Key Policy**: Restricts decryption to only this Lambda function's role
2. **S3 Bucket Policy**: Allows Lambda read access only
3. **API Gateway**: Enforces HTTPS and CORS
4. **IAM Role**: Least privilege principle applied

## API Specification

### POST /decrypt

**Request:**
```json
{
  "blobKey": "path/to/encrypted/blob.txt"
}
```

**Response:**
```json
{
  "plaintext": "decrypted content",
  "status": "success"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "status": "error"
}
```

## Deployment

### Using Terraform

1. Navigate to infrastructure directory:
   ```bash
   cd task-A/infra
   ```

2. Initialize Terraform:
   ```bash
   terraform init
   ```

3. Configure variables:
   ```bash
   terraform plan -var="project_name=solace-decrypt"
   ```

4. Deploy:
   ```bash
   terraform apply -var="project_name=solace-decrypt"
   ```

### Using AWS SAM

1. Build the application:
   ```bash
   sam build
   ```

2. Deploy:
   ```bash
   sam deploy --guided
   ```

## Testing

### Local Testing

```bash
# Install dependencies
npm install

# Run tests
npm test

# Test with sample data
./tests/decrypt_test.sh
```

### Integration Testing

1. Upload an encrypted blob to S3
2. Call the API with the blob key
3. Verify decrypted content

## Troubleshooting

### Common Issues

1. **KMS Permission Denied**: Check IAM role permissions
2. **S3 Access Denied**: Verify bucket policy
3. **CORS Errors**: Check API Gateway CORS configuration
4. **Timeout**: Increase Lambda timeout for large blobs

### Logs

Check CloudWatch logs for the Lambda function:
```bash
aws logs tail /aws/lambda/solace-decrypt-service --follow
```

## Cleanup

To remove all resources:

```bash
cd task-A/infra
terraform destroy
```
