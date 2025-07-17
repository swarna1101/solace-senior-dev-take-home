# @solace/client-sdk

A comprehensive client-side SDK for secure voice processing and encryption, featuring Web Crypto API encryption, Voice Activity Detection (VAD), and seamless integration with Solace's secure backend services.

---

## 📁 File Structure

- `src/crypto.js` – Core encryption/decryption utilities
- `src/vad.js` – Voice Activity Detection (VAD) logic
- `src/api.js` – API client for backend integration
- `src/index.js` – Main CommonJS entry point
- `src/index.browser.js` – Browser-compatible ES6 entry point (for demo)
- `src/types.d.ts` – TypeScript type definitions
- `demo/` – React demo application
- `tests/` – Minimal passing test(s) for demonstration

---

## 🚀 Features

- **🔐 End-to-End Encryption**: AES-GCM-256 encryption using Web Crypto API
- **🎤 Voice Activity Detection**: Real-time VAD with configurable thresholds
- **📁 Secure File Handling**: Upload/download encrypted blobs with metadata
- **🔗 Backend Integration**: Seamless integration with Task A decryption service
- **⚡ Modern APIs**: Promise-based, ES6+ compatible
- **🌐 Cross-Platform**: Works in browsers and React Native
- **📱 React Demo**: Complete sample application included
- **🧪 Well-Tested**: Minimal passing test(s) included for demonstration

## 📦 Installation

```bash
npm install @solace/client-sdk
```

Or with yarn:

```bash
yarn add @solace/client-sdk
```

---

## 🔧 Quick Start

### Basic Usage

> **Note:** For local development or the included demo, import from `@solace/client-sdk/src/index.browser.js` instead of the package root.

```javascript
import { SolaceSDK } from '@solace/client-sdk';
// For demo/local: import { SolaceSDK } from '@solace/client-sdk/src/index.browser.js';

// Initialize the SDK
const sdk = new SolaceSDK({
  apiBaseUrl: 'https://your-api-gateway-url.amazonaws.com/prod',
  apiKey: 'your-api-key', // optional
});

await sdk.initialize({
  generateKey: true,      // Generate new encryption key
  initializeVAD: true,    // Enable voice activity detection
});

// Encrypt text
const encrypted = await sdk.encryptText('Hello, World!');
console.log('Encrypted:', encrypted);

// Decrypt text
const decrypted = await sdk.decryptText(encrypted.ciphertext, encrypted.iv);
console.log('Decrypted:', decrypted);
```

### Voice Activity Detection

```javascript
// Start listening for voice activity
await sdk.startVAD({
  onSpeechStart: () => {
    console.log('🎤 Speech started');
  },
  onSpeechEnd: async (audioData) => {
    console.log(`🎤 Speech ended: ${audioData.length} samples`);
    
    // Process and upload audio
    const result = await sdk.processAudioData(audioData);
    console.log('Audio uploaded:', result.blobKey);
  },
  onVADMisfire: () => {
    console.log('🎤 VAD misfire detected');
  },
});

// Stop listening
await sdk.stopVAD();
```

### File Upload/Download

```javascript
// Upload encrypted file
const fileData = await file.arrayBuffer();
const result = await sdk.uploadBlob(fileData, {
  filename: file.name,
  type: file.type,
});

// Download and decrypt file
const { blob, metadata } = await sdk.downloadBlob(result.blobKey);
// Use the blob as needed
```

## 📚 API Reference

### Core Classes

#### `SolaceSDK`

The main SDK class providing high-level functionality.

##### Constructor

```typescript
new SolaceSDK(config?: SDKConfig)
```

**Parameters:**
- `config.apiBaseUrl?` - Base URL for the backend API
- `config.apiKey?` - Optional API key for authentication
- `config.vadOptions?` - Default VAD configuration options

##### Methods

**`initialize(options?: InitializeOptions): Promise<void>`**

Initialize the SDK with encryption and VAD capabilities.

```javascript
await sdk.initialize({
  generateKey: true,        // Generate new encryption key
  encryptionKey: key,       // Use existing key (alternative to generateKey)
  initializeVAD: true,      // Enable voice activity detection
  vadOptions: {             // VAD configuration
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
  },
});
```

**`encryptText(text: string): Promise<TextEncryptionResult>`**

Encrypt text and return Base64-encoded result.

**`decryptText(ciphertext: string, iv: string): Promise<string>`**

Decrypt Base64-encoded text data.

**`startVAD(callbacks?: VADCallbacks): Promise<void>`**

Start voice activity detection with optional callbacks.

**`stopVAD(): Promise<void>`**

Stop voice activity detection.

**`uploadBlob(blob: Blob|ArrayBuffer, metadata?: object): Promise<UploadResult>`**

Encrypt and upload blob data to the backend service.

**`downloadBlob(blobKey: string): Promise<{blob: Blob, metadata: object}>`**

Download and decrypt blob data from the backend service.

**`processAudioData(audioData: Float32Array, options?: AudioProcessingOptions): Promise<AudioProcessingResult>`**

Process audio data (convert to WAV, encrypt, and upload).

**`cleanup(): Promise<void>`**

Clean up and destroy SDK resources.

#### `VoiceActivityDetector`

Real-time voice activity detection using advanced ML models.

```javascript
import { createVAD } from '@solace/client-sdk';
// For demo/local: import { createVAD } from '@solace/client-sdk/src/index.browser.js';

const vad = await createVAD();
// ...
```

#### `SolaceApiClient`

Low-level API client for backend communication.

```javascript
import { createApiClient } from '@solace/client-sdk';
// For demo/local: import { createApiClient } from '@solace/client-sdk/src/index.browser.js';

const client = createApiClient({
  baseUrl: 'https://your-api.com',
  apiKey: 'your-key',
  timeout: 30000,
  retries: 3,
});

// Upload blob
await client.uploadBlob(blob, metadata);

// Download blob
const { blob, metadata } = await client.downloadBlob(blobKey);
```

### Utility Functions

#### Encryption Functions

```javascript
import { 
  generateKey, 
  encrypt, 
  decrypt, 
  encryptText, 
  decryptText 
} from '@solace/client-sdk';
// For demo/local: import from '@solace/client-sdk/src/index.browser.js';

// Generate encryption key
const key = await generateKey();

// Encrypt/decrypt binary data
const { ciphertext, iv } = await encrypt(key, data);
const decrypted = await decrypt(key, ciphertext, iv);

// Encrypt/decrypt text
const encrypted = await encryptText(key, 'Hello');
const decrypted = await decryptText(key, encrypted.ciphertext, encrypted.iv);
```

#### Audio Utilities

```javascript
import { AudioUtils } from '@solace/client-sdk';
// For demo/local: import from '@solace/client-sdk/src/index.browser.js';

// Convert audio formats
const wavBuffer = AudioUtils.audioToWAV(float32Audio);
// ...
```

#### Blob Utilities

```javascript
import { BlobUtils } from '@solace/client-sdk';
// For demo/local: import from '@solace/client-sdk/src/index.browser.js';

// Generate unique keys
const key = BlobUtils.generateBlobKey('audio');

// Format file sizes
const size = BlobUtils.formatSize(1024); // "1 KB"
```

### Feature Detection

```javascript
import { Features } from '@solace/client-sdk';
// For demo/local: import from '@solace/client-sdk/src/index.browser.js';

// Check browser capabilities
if (Features.hasWebCrypto()) {
  console.log('✅ Encryption supported');
}

if (Features.hasWebRTC()) {
  console.log('✅ Microphone access supported');
}

// Get supported audio formats
const formats = Features.getSupportedAudioFormats();
console.log('Audio support:', formats);
```

---

## 📝 TypeScript Support

TypeScript definitions are included in `src/types.d.ts` for all public APIs and types.

---

## 🎯 Configuration

### VAD Options

Voice Activity Detection can be fine-tuned with these options:

```javascript
const vadOptions = {
  positiveSpeechThreshold: 0.5,    // Threshold for detecting speech (0-1)
  negativeSpeechThreshold: 0.35,   // Threshold for detecting silence (0-1)
  preSpeechPadFrames: 1,           // Frames to include before speech
  redemptionFrames: 8,             // Frames for redemption period
  frameSamples: 1536,              // Samples per frame
  minSpeechFrames: 3,              // Minimum frames for valid speech
};
```

### API Client Configuration

```javascript
const apiConfig = {
  baseUrl: 'https://api.example.com',  // Required: API base URL
  apiKey: 'your-api-key',              // Optional: Authentication key
  timeout: 30000,                      // Request timeout (ms)
  retries: 3,                          // Number of retry attempts
  retryDelay: 1000,                    // Delay between retries (ms)
};
```

---

## 🌐 React Integration

The SDK includes a complete React demo application. To run it:

```bash
cd demo
npm install
npm run dev
```

### React Hook Example

```jsx
import React, { useState, useEffect } from 'react';
import { SolaceSDK } from '@solace/client-sdk';
// For demo/local: import from '@solace/client-sdk/src/index.browser.js';

// ...
```

---

## 🔒 Security Considerations

### Encryption

- **Algorithm**: AES-GCM-256 with Web Crypto API
- **Key Generation**: Cryptographically secure random keys
- **IV Handling**: Unique IV per encryption operation
- **Key Storage**: Keys should be stored securely (e.g., IndexedDB)

### Best Practices

1. **Always validate input data** before encryption/processing
2. **Use HTTPS** in production environments
3. **Implement proper key management** for your use case
4. **Regularly rotate encryption keys**
5. **Validate blob keys** before API calls
6. **Handle errors gracefully** with proper user feedback

### Privacy

- **Microphone Access**: Always request user permission
- **Data Transmission**: All data is encrypted before transmission
- **Local Storage**: Consider encrypting locally stored data
- **Logging**: Avoid logging sensitive information

---

## 🧪 Testing

Run the test suite:

```bash
npm test
```

> **Note:** Minimal passing tests are included for demonstration. For production, expand test coverage as needed.

---

## 🛠️ Development

### Building the SDK

```bash
npm run build
```

### Running the Demo

```bash
cd demo
npm install
npm run dev
```

---

## 📋 Requirements

### Browser Support

- **Chrome**: 88+
- **Firefox**: 84+
- **Safari**: 14+
- **Edge**: 88+

### Required APIs

- **Web Crypto API**: For encryption operations
- **MediaDevices API**: For microphone access (VAD)
- **Fetch API**: For network requests
- **WebAssembly**: For VAD processing

### Node.js Support

- **Node.js**: 16+ (for development and testing)

---

## 🤝 Integration with Task A

This SDK is designed to work seamlessly with the Task A Enclave-Style Decryption Service:

```javascript
// The SDK automatically handles:
// 1. Local encryption with AES-GCM-256
// 2. Secure transmission to Task A API
// 3. KMS-based decryption in Lambda
// 4. Secure key management

const result = await sdk.uploadBlob(buffer, { ... });
// Data is encrypted locally, then sent to Task A for secure storage

const { blob, metadata } = await sdk.downloadBlob(result.blobKey);
// Task A Lambda decrypts using KMS and returns plaintext
```
