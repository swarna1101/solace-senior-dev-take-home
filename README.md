# Solace Senior Developer Take-Home Assignment

## Overview

This repository contains three interconnected tasks that demonstrate secure voice processing capabilities:

- **Task A**: Enclave-Style Decryption Service (AWS Lambda + KMS)
- **Task B**: Cross-Platform Client SDK (@solace/client-sdk)
- **Task C**: Solace Lite End-to-End Demo (Voice Assistant)

## Project Structure

```
solace-senior-dev-take-home/
├── task-A/                    # Enclave-Style Decryption Service
│   ├── src/                   # Lambda function code
│   ├── infra/                 # Infrastructure as Code (Terraform/SAM)
│   ├── tests/                 # Test files
│   └── README.md              # Setup and deployment instructions
├── task-B/                    # Cross-Platform Client SDK
│   ├── src/                   # SDK source code
│   ├── demo/                  # Sample React/React Native app
│   ├── tests/                 # Unit tests
│   └── README.md              # Installation and API documentation
├── task-C/                    # Solace Lite End-to-End Demo
│   ├── src/                   # Voice assistant application
│   ├── public/                # Static assets
│   └── README.md              # Setup and run instructions
├── .gitignore                 # Git ignore patterns
├── .env.example               # Example environment variables
└── README.md                  # This file
```

## Prerequisites

### Development Environment
- **Node.js** (>=16.x)
- **Python** (>=3.9)
- **Git**

### CLI Tools
- **AWS CLI** - for AWS services interaction
- **Docker** - for containerization (optional)
- **Terraform** or **AWS SAM CLI** - for infrastructure as code

### Cloud Accounts
- **AWS Account** with permissions for Lambda, KMS, S3, IAM, API Gateway
- **NPM Account** (optional) - for publishing @solace/client-sdk
- **OpenAI API** - for GPT chat and Whisper ASR (Task C)
- **AWS Polly** or similar - for Text-to-Speech (Task C)

## Submission Checklist

### Task A: Enclave-Style Decryption Service
- [ ] Lambda function with KMS decryption
- [ ] Infrastructure as Code (Terraform/SAM)
- [ ] Security best practices implemented
- [ ] Sample encrypted blob and test script
- [ ] README.md with setup and deployment instructions

### Task B: Cross-Platform Client SDK
- [ ] NPM package structure
- [ ] Encryption/Decryption APIs (Web Crypto API)
- [ ] Voice Activity Detection (VAD)
- [ ] Upload/Download helpers
- [ ] Sample demo application
- [ ] Unit tests
- [ ] README.md with installation and API documentation

### Task C: Solace Lite End-to-End Demo
- [ ] Voice capture and ASR integration
- [ ] Chatbot with GPT integration
- [ ] TTS with voice customization
- [ ] Modern UI/UX
- [ ] Error handling and logging
- [ ] README.md with setup and run instructions

## Architecture Overview

```
User Voice Input → Task C (Voice Assistant)
                    ↓
                Task B SDK (Encryption/VAD)
                    ↓
                Task A (Decryption Service)
                    ↓
                AWS KMS (Key Management)
```

Each task builds upon the previous one, creating a complete secure voice processing pipeline.