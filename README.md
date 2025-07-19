# Solace Senior Developer Take-Home Assignment

## Overview

This repository contains three interconnected tasks that demonstrate secure voice processing capabilities. Each task builds upon the previous one to create a complete end-to-end voice processing pipeline with encryption, secure backend services, and a modern voice assistant interface.

## Project Structure

```
solace-senior-dev-take-home/
├── task-A/                    # Enclave-Style Decryption Service
│   ├── src/                   # Lambda function code
│   ├── infra/                 # Infrastructure as Code (Terraform)
│   ├── tests/                 # Test files and sample data
│   ├── package.json           # Dependencies
│   └── README.md              # Setup and deployment instructions
├── task-B/                    # Cross-Platform Client SDK
│   ├── src/                   # SDK source code
│   ├── demo/                  # React demo application
│   ├── tests/                 # Unit tests
│   ├── mock-backend/          # Mock backend server
│   ├── package.json           # Dependencies
│   └── README.md              # Installation and API documentation
├── task-C/                    # Solace Lite Voice Assistant
│   ├── src/                   # React voice assistant application
│   ├── mock-backend/          # Express server for TTS
│   ├── public/                # Static assets
│   ├── package.json           # Dependencies
│   └── README.md              # Setup and run instructions
├── .gitignore                 # Git ignore patterns
└── README.md                  # This file
```

## Task Overview

### Task A: Enclave-Style Decryption Service ✅ **IMPLEMENTED**

**Purpose**: Secure backend service using AWS Lambda and KMS for hardware-backed key management.

**Features**:
- AWS Lambda function with KMS integration
- Terraform infrastructure as code
- Secure S3 blob storage with encryption
- API Gateway with HTTPS enforcement
- CORS support for web client access
- Comprehensive test suite with sample encrypted data

**Architecture**:
```
Client Request → API Gateway → Lambda Function → S3 (fetch encrypted blob) → KMS (decrypt) → Response
```

**Status**: Fully implemented with production-ready infrastructure and security best practices.

### Task B: Cross-Platform Client SDK ✅ **IMPLEMENTED**

**Purpose**: Comprehensive client-side SDK for secure voice processing and encryption.

**Features**:
- AES-GCM-256 encryption using Web Crypto API
- Voice Activity Detection (VAD) with ML models
- Secure file upload/download with metadata
- Cross-platform compatibility (browser + React Native)
- React demo application included
- Comprehensive TypeScript definitions
- Unit tests and documentation

**Key Components**:
- `SolaceSDK` - Main SDK class
- `VoiceActivityDetector` - Real-time VAD
- `SolaceApiClient` - Backend integration
- Encryption utilities and blob handling

**Status**: Fully implemented with complete API documentation and demo application.

### Task C: Solace Lite Voice Assistant ✅ **IMPLEMENTED**

**Purpose**: End-to-end voice-to-voice AI companion with modern UI.

**Features**:
- Voice Activity Detection for automatic speech detection
- OpenAI Whisper API for speech-to-text transcription
- OpenAI GPT-3.5 for intelligent responses
- Text-to-Speech with voice customization (Male/Female)
- Encrypted conversation memory using Web Crypto API
- Test mode for demo purposes (bypasses API calls)
- Modern, responsive UI with glass morphism design
- Mock backend server for TTS processing

**Technical Stack**:
- React 18 with Vite
- Web Crypto API for encryption
- MediaRecorder API for audio capture
- Express.js mock backend
- OpenAI APIs (Whisper + GPT-3.5)

**Status**: Fully implemented with polished UI and comprehensive error handling.

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

## Prerequisites

### Development Environment
- **Node.js** (>=16.x)
- **Python** (>=3.9) - for AWS CLI
- **Git**

### CLI Tools
- **AWS CLI** - for AWS services interaction
- **Terraform** (>=1.0) - for infrastructure deployment

### Cloud Accounts & APIs
- **AWS Account** with permissions for Lambda, KMS, S3, IAM, API Gateway
- **OpenAI API** - for GPT chat and Whisper ASR (Task C)

## Quick Start

### 1. Task A - Deploy Backend Service

```bash
cd task-A/infra
terraform init
terraform plan
terraform apply
```

### 2. Task B - Test SDK

```bash
cd task-B
npm install
npm test
```

### 3. Task C - Run Voice Assistant

```bash
cd task-C
npm install

# Create .env file with OpenAI API key
echo "VITE_OPENAI_API_KEY=your_openai_api_key_here" > .env

# Start mock backend
cd mock-backend && npm install && npm start &

# Start frontend
cd .. && npm run dev
```

Visit `http://localhost:3001` to use the voice assistant.

## Implementation Status

### ✅ Task A - Complete
- [x] Lambda function with KMS decryption
- [x] Infrastructure as Code (Terraform)
- [x] Security best practices implemented
- [x] Sample encrypted blob and test script
- [x] Comprehensive README with setup instructions

### ✅ Task B - Complete
- [x] NPM package structure
- [x] Encryption/Decryption APIs (Web Crypto API)
- [x] Voice Activity Detection (VAD)
- [x] Upload/Download helpers
- [x] Sample demo application
- [x] Unit tests
- [x] Complete API documentation

### ✅ Task C - Complete
- [x] Voice capture and ASR integration
- [x] Chatbot with GPT integration
- [x] TTS with voice customization
- [x] Modern UI/UX with glass morphism
- [x] Error handling and logging
- [x] Test mode for reliable demos
- [x] Comprehensive README with setup instructions

## Key Features

### Security
- **End-to-End Encryption**: AES-GCM-256 using Web Crypto API
- **Hardware-Backed Keys**: AWS KMS for key management
- **Least Privilege**: IAM policies restrict access
- **HTTPS Enforcement**: All communications encrypted

### Voice Processing
- **Real-Time VAD**: Voice Activity Detection with ML models
- **ASR Integration**: OpenAI Whisper for speech-to-text
- **TTS Customization**: Male/Female voice options
- **Audio Format Conversion**: Automatic WAV conversion

### User Experience
- **Modern UI**: Glass morphism design with animations
- **Responsive Design**: Works on desktop and mobile
- **Error Handling**: Graceful fallbacks and user feedback
- **Test Mode**: Bypass API calls for reliable demos

## API Limitations

**Important**: Task C may encounter OpenAI API rate limits (429 errors) when making real API calls. This is expected behavior and can be resolved by:

- Using "Test Mode" for demos (bypasses all API calls)
- Waiting 1-2 minutes between requests
- Upgrading to a paid OpenAI plan for higher rate limits

## Development

### Testing

```bash
# Task A - Backend tests
cd task-A
./tests/decrypt_test.sh

# Task B - SDK tests
cd task-B
npm test

# Task C - Manual testing
cd task-C
npm run dev
# Visit http://localhost:3001
```

### Deployment

```bash
# Task A - Deploy to AWS
cd task-A/infra
terraform apply

# Task B - Publish to NPM (optional)
cd task-B
npm publish

# Task C - Build for production
cd task-C
npm run build
```


