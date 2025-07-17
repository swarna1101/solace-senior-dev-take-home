/**
 * @fileoverview Solace Client SDK - Browser-compatible ES6 version
 * @author Solace Security
 * @version 1.0.0
 */

// Get crypto implementation (global in browser, mocked in tests)
const getCrypto = () => {
  if (typeof global !== 'undefined' && global.crypto) {
    return global.crypto;
  }
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof crypto !== 'undefined') {
    return crypto;
  }
  throw new Error('Web Crypto API not available');
};

/**
 * Generate a new AES-GCM encryption key
 * @returns {Promise<CryptoKey>} Generated cryptographic key
 */
async function generateKey() {
  const cryptoImpl = getCrypto();
  return await cryptoImpl.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // AES-256
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random initialization vector (IV)
 * @returns {Uint8Array} 12-byte random IV for AES-GCM
 */
function generateIV() {
  const cryptoImpl = getCrypto();
  return cryptoImpl.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
}

/**
 * Encrypt data using AES-GCM-256
 * @param {CryptoKey} key - The encryption key
 * @param {ArrayBuffer|Uint8Array} data - Data to encrypt
 * @param {Uint8Array} [iv] - Optional IV, will generate if not provided
 * @returns {Promise<{ciphertext: ArrayBuffer, iv: Uint8Array}>} Encrypted data and IV
 */
async function encrypt(key, data, iv = null) {
  if (!iv) {
    iv = generateIV();
  }
  
  const cryptoImpl = getCrypto();
  const ciphertext = await cryptoImpl.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  return { ciphertext, iv };
}

/**
 * Decrypt data using AES-GCM-256
 * @param {CryptoKey} key - The decryption key
 * @param {ArrayBuffer} ciphertext - Encrypted data
 * @param {Uint8Array} iv - Initialization vector used for encryption
 * @returns {Promise<ArrayBuffer>} Decrypted data
 */
async function decrypt(key, ciphertext, iv) {
  const cryptoImpl = getCrypto();
  return await cryptoImpl.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
}

/**
 * Export a key to raw format
 * @param {CryptoKey} key - Key to export
 * @returns {Promise<ArrayBuffer>} Raw key data
 */
async function exportKey(key) {
  const cryptoImpl = getCrypto();
  return await cryptoImpl.subtle.exportKey('raw', key);
}

/**
 * Import a key from raw format
 * @param {ArrayBuffer} keyData - Raw key data
 * @returns {Promise<CryptoKey>} Imported cryptographic key
 */
async function importKey(keyData) {
  const cryptoImpl = getCrypto();
  return await cryptoImpl.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} Decoded buffer
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt text data and return as Base64 encoded result
 * @param {CryptoKey} key - Encryption key
 * @param {string} text - Text to encrypt
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64 encoded ciphertext and IV
 */
async function encryptText(key, text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const { ciphertext, iv } = await encrypt(key, data);
  
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

/**
 * Decrypt Base64 encoded data and return as text
 * @param {CryptoKey} key - Decryption key
 * @param {string} ciphertextBase64 - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded IV
 * @returns {Promise<string>} Decrypted text
 */
async function decryptText(key, ciphertextBase64, ivBase64) {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const decryptedData = await decrypt(key, ciphertext, iv);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Simple VAD implementation for demo
 */
class VoiceActivityDetector {
  constructor(options = {}) {
    this.options = options;
    this.isListening = false;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.audioChunks = [];
    this.stream = null;
  }

  async start(options = {}) {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Convert to audio data for processing
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          const audioData = audioBuffer.getChannelData(0); // Get first channel
          
          // Trigger speech end callback with audio data
          if (this.options.onSpeechEnd) {
            this.options.onSpeechEnd(audioData);
          }
        }
      };
      
      this.mediaRecorder.start(1000); // Collect data every second
      this.isListening = true;
      
      // Trigger speech start callback
      if (this.options.onSpeechStart) {
        this.options.onSpeechStart();
      }
      
      console.log('VAD started');
    } catch (error) {
      console.error('Failed to start VAD:', error);
      throw error;
    }
  }

  async stop() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.isListening = false;
      
      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
      
      console.log('VAD stopped');
    }
  }
}

/**
 * Create VAD instance
 */
async function createVAD(options = {}) {
  return new VoiceActivityDetector(options);
}

/**
 * Audio utilities
 */
const AudioUtils = {
  audioToWAV(audioData) {
    // Simple WAV conversion for demo
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    view.setUint32(0, 0x52494646, false); // RIFF
    view.setUint32(4, 36 + audioData.length * 2, true); // File size
    view.setUint32(8, 0x57415645, false); // WAVE
    view.setUint32(12, 0x666D7420, false); // fmt
    view.setUint32(16, 16, true); // Chunk size
    view.setUint16(20, 1, true); // Audio format (PCM)
    view.setUint16(22, 1, true); // Channels
    view.setUint32(24, 16000, true); // Sample rate
    view.setUint32(28, 32000, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    view.setUint32(36, 0x64617461, false); // data
    view.setUint32(40, audioData.length * 2, true); // Data size
    
    // Audio data
    for (let i = 0; i < audioData.length; i++) {
      view.setInt16(44 + i * 2, audioData[i] * 32767, true);
    }
    
    return buffer;
  }
};

/**
 * Blob utilities
 */
const BlobUtils = {
  generateBlobKey(prefix = 'blob') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

/**
 * API client for Task A integration
 */
class SolaceApiClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey || '';
  }

  async uploadBlob(blob, metadata = {}) {
    // Mock implementation for demo
    console.log('Mock upload:', blob.size, 'bytes');
    return {
      blobKey: BlobUtils.generateBlobKey('upload'),
      uploadedAt: new Date().toISOString(),
      size: blob.size
    };
  }

  async downloadBlob(blobId) {
    // Mock implementation for demo
    console.log('Mock download:', blobId);
    return {
      blob: new Blob(['Mock data'], { type: 'text/plain' }),
      metadata: { type: 'mock', id: blobId }
    };
  }
}

/**
 * Create API client
 */
function createApiClient(config = {}) {
  return new SolaceApiClient(config);
}

/**
 * Solace SDK class - High-level interface combining all functionality
 */
class SolaceSDK {
  /**
   * Create a new Solace SDK instance
   * @param {Object} config - Configuration options
   * @param {string} [config.apiBaseUrl] - Base URL for Task A API
   * @param {string} [config.apiKey] - API key for authentication
   * @param {Object} [config.vadOptions] - VAD configuration options
   */
  constructor(config = {}) {
    this.config = config;
    this.apiClient = null;
    this.vad = null;
    this.encryptionKey = null;
    
    // Initialize API client if URL provided
    if (config.apiBaseUrl) {
      // API client will be initialized lazily when needed
      this._apiConfig = {
        baseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
      };
    }
  }

  /**
   * Initialize the SDK with encryption key and VAD
   * @param {Object} options - Initialization options
   * @param {CryptoKey} [options.encryptionKey] - Pre-existing encryption key
   * @param {boolean} [options.generateKey] - Whether to generate a new key
   * @param {boolean} [options.initializeVAD] - Whether to initialize VAD
   * @param {Object} [options.vadOptions] - VAD configuration options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      // Set up encryption key
      if (options.encryptionKey) {
        this.encryptionKey = options.encryptionKey;
      } else if (options.generateKey !== false) {
        this.encryptionKey = await generateKey();
        console.log('Generated new encryption key');
      }

      // Initialize VAD if requested
      if (options.initializeVAD !== false) {
        this.vad = await createVAD({
          ...this.config.vadOptions,
          ...options.vadOptions,
        });
        console.log('VAD initialized');
      }

      // Initialize API client if configured
      if (this._apiConfig) {
        this.apiClient = new SolaceApiClient(this._apiConfig);
        console.log('API client initialized');
      }

      console.log('Solace SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Solace SDK:', error);
      throw error;
    }
  }

  /**
   * Encrypt text using the SDK's encryption key
   * @param {string} text - Text to encrypt
   * @returns {Promise<{ciphertext: string, iv: string}>} Encrypted data
   */
  async encryptText(text) {
    if (!this.encryptionKey) {
      throw new Error('SDK not initialized or no encryption key available');
    }
    return await encryptText(this.encryptionKey, text);
  }

  /**
   * Decrypt text using the SDK's encryption key
   * @param {string} ciphertext - Base64 encoded ciphertext
   * @param {string} iv - Base64 encoded IV
   * @returns {Promise<string>} Decrypted text
   */
  async decryptText(ciphertext, iv) {
    if (!this.encryptionKey) {
      throw new Error('SDK not initialized or no encryption key available');
    }
    return await decryptText(this.encryptionKey, ciphertext, iv);
  }

  /**
   * Start voice activity detection
   * @param {Object} options - VAD options
   * @returns {Promise<void>}
   */
  async startVAD(options = {}) {
    if (!this.vad) {
      throw new Error('VAD not initialized. Call initialize({ initializeVAD: true }) first.');
    }
    return await this.vad.start(options);
  }

  /**
   * Stop voice activity detection
   * @returns {Promise<void>}
   */
  async stopVAD() {
    if (!this.vad) {
      throw new Error('VAD not initialized');
    }
    return await this.vad.stop();
  }

  /**
   * Upload encrypted blob to Task A API
   * @param {Blob} blob - Blob to upload and encrypt
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} Upload response
   */
  async uploadBlob(blob, metadata = {}) {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Provide apiBaseUrl in config.');
    }
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    // Encrypt the blob
    const arrayBuffer = await blob.arrayBuffer();
    const { ciphertext, iv } = await encrypt(this.encryptionKey, arrayBuffer);
    
    // Create encrypted blob
    const encryptedBlob = new Blob([ciphertext], { type: 'application/octet-stream' });
    
    // Upload with metadata including IV
    return await this.apiClient.uploadBlob(encryptedBlob, {
      ...metadata,
      iv: arrayBufferToBase64(iv),
      encrypted: true,
    });
  }

  /**
   * Download and decrypt blob from Task A API
   * @param {string} blobId - Blob ID to download
   * @returns {Promise<{blob: Blob, metadata: Object}>} Decrypted blob and metadata
   */
  async downloadBlob(blobId) {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Provide apiBaseUrl in config.');
    }
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }

    const { blob, metadata } = await this.apiClient.downloadBlob(blobId);
    
    if (metadata.encrypted && metadata.iv) {
      // Decrypt the blob
      const arrayBuffer = await blob.arrayBuffer();
      const iv = new Uint8Array(base64ToArrayBuffer(metadata.iv));
      const decryptedData = await decrypt(this.encryptionKey, arrayBuffer, iv);
      
      return {
        blob: new Blob([decryptedData]),
        metadata: { ...metadata, encrypted: false },
      };
    }
    
    return { blob, metadata };
  }

  /**
   * Process audio data (convert to WAV, encrypt, and upload)
   * @param {Float32Array} audioData - Audio data from VAD
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processing result
   */
  async processAudioData(audioData, options = {}) {
    if (!audioData || audioData.length === 0) {
      throw new Error('Audio data is required and cannot be empty');
    }

    try {
      // Convert audio to WAV format
      const wavBuffer = AudioUtils.audioToWAV(audioData);
      
      // Generate blob key
      const blobKey = BlobUtils.generateBlobKey('audio');
      
      // Calculate metadata
      const duration = audioData.length / 16000; // Assuming 16kHz sample rate
      const metadata = {
        type: 'audio',
        format: 'wav',
        duration,
        sampleRate: 16000,
        channels: 1,
        samples: audioData.length,
        ...options.metadata,
      };

      // Create blob and upload
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const uploadResult = await this.uploadBlob(blob, metadata);
      
      return {
        blobKey: uploadResult.blobKey,
        uploadResult,
        metadata,
      };
    } catch (error) {
      console.error('Failed to process audio data:', error);
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  /**
   * Get current encryption key in exportable format
   * @returns {Promise<string>} Base64 encoded key
   */
  async getEncryptionKey() {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }
    const keyData = await exportKey(this.encryptionKey);
    return arrayBufferToBase64(keyData);
  }

  /**
   * Set encryption key from exported format
   * @param {string} keyBase64 - Base64 encoded key
   * @returns {Promise<void>}
   */
  async setEncryptionKey(keyBase64) {
    const keyData = base64ToArrayBuffer(keyBase64);
    this.encryptionKey = await importKey(keyData);
  }

  /**
   * Get VAD instance for advanced control
   * @returns {VoiceActivityDetector|null} VAD instance or null if not initialized
   */
  getVAD() {
    return this.vad;
  }

  /**
   * Get API client instance for advanced control
   * @returns {SolaceApiClient|null} API client instance or null if not initialized
   */
  getApiClient() {
    return this.apiClient;
  }

  /**
   * Cleanup resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    if (this.vad) {
      await this.vad.stop();
      this.vad = null;
    }
    
    this.apiClient = null;
    this.encryptionKey = null;
    
    console.log('Solace SDK cleaned up');
  }
}

/**
 * Feature detection utilities
 */
const Features = {
  /**
   * Check if Web Crypto API is available
   * @returns {boolean} True if available
   */
  hasWebCrypto() {
    try {
      if (typeof global !== 'undefined' && global.crypto && global.crypto.subtle) {
        return true;
      }
      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return true;
      }
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Check if WebRTC is available
   * @returns {boolean} True if available
   */
  hasWebRTC() {
    try {
      return typeof RTCPeerConnection !== 'undefined' || 
             typeof webkitRTCPeerConnection !== 'undefined' || 
             typeof mozRTCPeerConnection !== 'undefined';
    } catch {
      return false;
    }
  },

  /**
   * Check if Web Workers are available
   * @returns {boolean} True if available
   */
  hasWebWorkers() {
    try {
      return typeof Worker !== 'undefined';
    } catch {
      return false;
    }
  },

  /**
   * Get supported audio formats
   * @returns {Array<string>} List of supported MIME types
   */
  getSupportedAudioFormats() {
    const formats = [
      'audio/webm',
      'audio/webm;codecs=opus',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
    ];
    
    if (typeof MediaRecorder === 'undefined') {
      return [];
    }
    
    return formats.filter(format => MediaRecorder.isTypeSupported(format));
  },
};

/**
 * SDK version
 */
const VERSION = '1.0.0';

// ES6 exports for browser compatibility
export {
  SolaceSDK,
  Features,
  VERSION,
  // Crypto functions
  generateKey,
  generateIV,
  encrypt,
  decrypt,
  exportKey,
  importKey,
  arrayBufferToBase64,
  base64ToArrayBuffer,
  encryptText,
  decryptText,
  // VAD functions
  VoiceActivityDetector,
  AudioUtils,
  createVAD,
  // API functions
  SolaceApiClient,
  createApiClient,
  BlobUtils,
}; 