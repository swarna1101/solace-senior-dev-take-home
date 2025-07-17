/**
 * @fileoverview Solace Client SDK - Main entry point
 * @author Solace Security
 * @version 1.0.0
 */

// Core encryption/decryption functionality
const crypto = require('./crypto.js');
const vad = require('./vad.js');
const api = require('./api.js');

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
        this.encryptionKey = await crypto.generateKey();
        console.log('Generated new encryption key');
      }

      // Initialize VAD if requested
      if (options.initializeVAD !== false) {
        this.vad = await vad.createVAD({
          ...this.config.vadOptions,
          ...options.vadOptions,
        });
        console.log('VAD initialized');
      }

      // Initialize API client if configured
      if (this._apiConfig) {
        this.apiClient = new api.SolaceApiClient(this._apiConfig);
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
    return await crypto.encryptText(this.encryptionKey, text);
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
    return await crypto.decryptText(this.encryptionKey, ciphertext, iv);
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
    const { ciphertext, iv } = await crypto.encrypt(this.encryptionKey, arrayBuffer);
    
    // Create encrypted blob
    const encryptedBlob = new Blob([ciphertext], { type: 'application/octet-stream' });
    
    // Upload with metadata including IV
    return await this.apiClient.uploadBlob(encryptedBlob, {
      ...metadata,
      iv: crypto.arrayBufferToBase64(iv),
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
      const iv = new Uint8Array(crypto.base64ToArrayBuffer(metadata.iv));
      const decryptedData = await crypto.decrypt(this.encryptionKey, arrayBuffer, iv);
      
      return {
        blob: new Blob([decryptedData]),
        metadata: { ...metadata, encrypted: false },
      };
    }
    
    return { blob, metadata };
  }

  /**
   * Get current encryption key in exportable format
   * @returns {Promise<string>} Base64 encoded key
   */
  async getEncryptionKey() {
    if (!this.encryptionKey) {
      throw new Error('No encryption key available');
    }
    const keyData = await crypto.exportKey(this.encryptionKey);
    return crypto.arrayBufferToBase64(keyData);
  }

  /**
   * Set encryption key from exported format
   * @param {string} keyBase64 - Base64 encoded key
   * @returns {Promise<void>}
   */
  async setEncryptionKey(keyBase64) {
    const keyData = crypto.base64ToArrayBuffer(keyBase64);
    this.encryptionKey = await crypto.importKey(keyData);
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

// Export everything
module.exports = {
  // Main SDK class
  SolaceSDK,
  
  // Feature detection
  Features,
  VERSION,
  
  // Direct access to modules
  ...crypto,
  ...vad,
  ...api,
}; 