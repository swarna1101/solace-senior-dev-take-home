/**
 * @fileoverview TypeScript definitions for Solace Client SDK
 */

// Crypto types
export interface EncryptionResult {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
}

export interface TextEncryptionResult {
  ciphertext: string;
  iv: string;
}

// VAD types
export interface VADOptions {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onVADMisfire?: () => void;
  positiveSpeechThreshold?: number;
  negativeSpeechThreshold?: number;
  preSpeechPadFrames?: number;
  redemptionFrames?: number;
  frameSamples?: number;
  minSpeechFrames?: number;
}

export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Float32Array) => void;
  onVADMisfire?: () => void;
}

export declare class VoiceActivityDetector {
  constructor();
  initialize(options?: VADOptions): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): Promise<void>;
  destroy(): Promise<void>;
  getIsListening(): boolean;
  getVADInstance(): any;
}

export interface AudioUtilsStatic {
  float32ToPCM16(audioData: Float32Array, sampleRate?: number): ArrayBuffer;
  audioToWAV(audioData: Float32Array, sampleRate?: number): ArrayBuffer;
  createAudioBlob(audioBuffer: ArrayBuffer, mimeType?: string): Blob;
  calculateDuration(audioData: Float32Array, sampleRate?: number): number;
  applyGain(audioData: Float32Array, gain: number): Float32Array;
}

// API types
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface UploadResult {
  success: boolean;
  blobKey: string;
  uploadedAt: string;
}

export interface DecryptionResult {
  decryptedData: ArrayBuffer;
  metadata?: Record<string, any>;
}

export interface DownloadResult {
  encryptedData: ArrayBuffer;
  metadata?: Record<string, any>;
}

export interface BlobListOptions {
  limit?: number;
  prefix?: string;
}

export interface BlobListResult {
  blobs: Array<{
    key: string;
    metadata: Record<string, any>;
  }>;
}

export interface StatusResult {
  status: string;
  timestamp: string;
}

export declare class SolaceApiClient {
  constructor(config: ApiClientConfig);
  uploadBlob(blobKey: string, encryptedData: ArrayBuffer | Uint8Array, metadata?: Record<string, any>): Promise<UploadResult>;
  decryptBlob(blobKey: string): Promise<DecryptionResult>;
  downloadBlob(blobKey: string): Promise<DownloadResult>;
  listBlobs(options?: BlobListOptions): Promise<BlobListResult>;
  deleteBlob(blobKey: string): Promise<{ success: boolean }>;
  getStatus(): Promise<StatusResult>;
}

export interface BlobUtilsStatic {
  generateBlobKey(prefix?: string): string;
  isValidBlobKey(blobKey: string): boolean;
  formatSize(bytes: number): string;
}

// SDK types
export interface SDKConfig {
  apiBaseUrl?: string;
  apiKey?: string;
  vadOptions?: VADOptions;
}

export interface InitializeOptions {
  encryptionKey?: CryptoKey;
  generateKey?: boolean;
  initializeVAD?: boolean;
  vadOptions?: VADOptions;
}

export interface AudioProcessingOptions {
  blobKey?: string;
  metadata?: Record<string, any>;
}

export interface AudioProcessingResult {
  blobKey: string;
  uploadResult: UploadResult;
  metadata: Record<string, any>;
}

export interface FeaturesStatic {
  hasWebCrypto(): boolean;
  hasWebRTC(): boolean;
  hasWebWorkers(): boolean;
  getSupportedAudioFormats(): {
    wav: boolean;
    mp3: boolean;
    ogg: boolean;
    webm: boolean;
  };
}

export declare class SolaceSDK {
  constructor(config?: SDKConfig);
  initialize(options?: InitializeOptions): Promise<void>;
  encryptText(text: string): Promise<TextEncryptionResult>;
  decryptText(ciphertextBase64: string, ivBase64: string): Promise<string>;
  startVAD(callbacks?: VADCallbacks): Promise<void>;
  stopVAD(): Promise<void>;
  uploadEncryptedBlob(blobKey: string, data: ArrayBuffer | Uint8Array, metadata?: Record<string, any>): Promise<UploadResult>;
  downloadDecryptedBlob(blobKey: string): Promise<DecryptionResult>;
  processAudioData(audioData: Float32Array, options?: AudioProcessingOptions): Promise<AudioProcessingResult>;
  getEncryptionKey(): Promise<ArrayBuffer>;
  setEncryptionKey(keyData: ArrayBuffer): Promise<void>;
  getApiClient(): SolaceApiClient | null;
  getVAD(): VoiceActivityDetector | null;
  destroy(): Promise<void>;
}

// Crypto functions
export declare function generateKey(): Promise<CryptoKey>;
export declare function generateIV(): Uint8Array;
export declare function encrypt(key: CryptoKey, data: ArrayBuffer | Uint8Array, iv?: Uint8Array): Promise<EncryptionResult>;
export declare function decrypt(key: CryptoKey, ciphertext: ArrayBuffer, iv: Uint8Array): Promise<ArrayBuffer>;
export declare function exportKey(key: CryptoKey): Promise<ArrayBuffer>;
export declare function importKey(keyData: ArrayBuffer): Promise<CryptoKey>;
export declare function arrayBufferToBase64(buffer: ArrayBuffer): string;
export declare function base64ToArrayBuffer(base64: string): ArrayBuffer;
export declare function encryptText(key: CryptoKey, text: string): Promise<TextEncryptionResult>;
export declare function decryptText(key: CryptoKey, ciphertextBase64: string, ivBase64: string): Promise<string>;

// VAD functions
export declare function createVAD(): VoiceActivityDetector;

// API functions
export declare function createApiClient(config: ApiClientConfig): SolaceApiClient;

// SDK functions
export declare function createSDK(config?: SDKConfig): SolaceSDK;

// Constants and utilities
export declare const VERSION: string;
export declare const AudioUtils: AudioUtilsStatic;
export declare const BlobUtils: BlobUtilsStatic;
export declare const Features: FeaturesStatic;
export declare const VADUtils: any;

// Default export
export default SolaceSDK; 