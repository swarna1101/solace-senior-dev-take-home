/**
 * @fileoverview API helpers for Task A integration
 * Upload/download helpers for encrypted blob management
 */

/**
 * Default configuration for API requests
 */
const DEFAULT_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
};

/**
 * API Client class for Task A decryption service
 */
class SolaceApiClient {
  /**
   * Create a new API client
   * @param {Object} config - Client configuration
   * @param {string} config.baseUrl - Base URL for the API
   * @param {string} [config.apiKey] - Optional API key for authentication
   * @param {number} [config.timeout] - Request timeout in milliseconds
   * @param {number} [config.retries] - Number of retry attempts
   * @param {number} [config.retryDelay] - Delay between retries in milliseconds
   */
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || '';
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || DEFAULT_CONFIG.timeout;
    this.retries = config.retries || DEFAULT_CONFIG.retries;
    this.retryDelay = config.retryDelay || DEFAULT_CONFIG.retryDelay;
    
    if (!this.baseUrl) {
      console.warn('API base URL not provided. Some features may not work.');
    }
  }

  /**
   * Make an HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Fetch options
   * @returns {Promise<Response>} Fetch response
   * @private
   */
  async _makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add API key if provided
    if (this.apiKey) {
      requestOptions.headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let lastError;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        console.log(`Making request to ${url} (attempt ${attempt + 1}/${this.retries + 1})`);
        
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error;
        console.warn(`Request attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt < this.retries && !controller.signal.aborted) {
          await this._delay(this.retryDelay * (attempt + 1)); // exponential backoff
        }
      }
    }

    clearTimeout(timeoutId);
    throw new Error(`Request failed after ${this.retries + 1} attempts: ${lastError.message}`);
  }

  /**
   * Delay execution for specified milliseconds
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Upload encrypted blob data to storage
   * @param {string} blobKey - Unique identifier for the blob
   * @param {ArrayBuffer|Uint8Array} encryptedData - Encrypted blob data
   * @param {Object} [metadata] - Optional metadata
   * @returns {Promise<{success: boolean, blobKey: string, uploadedAt: string}>}
   */
  async uploadBlob(blobKey, encryptedData, metadata = {}) {
    if (!blobKey) {
      throw new Error('Blob key is required');
    }
    
    if (!encryptedData || encryptedData.byteLength === 0) {
      throw new Error('Encrypted data is required and cannot be empty');
    }

    try {
      const url = `${this.baseUrl}/upload`;
      
      // Convert to base64 for JSON transport
      const base64Data = this._arrayBufferToBase64(encryptedData);
      
      const payload = {
        blobKey,
        data: base64Data,
        metadata: {
          uploadedAt: new Date().toISOString(),
          size: encryptedData.byteLength,
          ...metadata,
        },
      };

      const response = await this._makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      console.log('Blob uploaded successfully:', blobKey);
      
      return {
        success: true,
        blobKey,
        uploadedAt: result.uploadedAt || new Date().toISOString(),
        ...result,
      };
    } catch (error) {
      console.error('Failed to upload blob:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Request decryption of a blob from Task A service
   * @param {string} blobKey - Unique identifier for the blob
   * @returns {Promise<{decryptedData: ArrayBuffer, metadata?: Object}>}
   */
  async decryptBlob(blobKey) {
    if (!blobKey) {
      throw new Error('Blob key is required');
    }

    try {
      const url = `${this.baseUrl}/decrypt`;
      
      const payload = { blobKey };

      const response = await this._makeRequest(url, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Decryption failed');
      }

      // Convert base64 back to ArrayBuffer
      const decryptedData = this._base64ToArrayBuffer(result.data);
      
      console.log('Blob decrypted successfully:', blobKey);
      
      return {
        decryptedData,
        metadata: result.metadata,
      };
    } catch (error) {
      console.error('Failed to decrypt blob:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Download encrypted blob data (without decryption)
   * @param {string} blobKey - Unique identifier for the blob
   * @returns {Promise<{encryptedData: ArrayBuffer, metadata?: Object}>}
   */
  async downloadBlob(blobKey) {
    if (!blobKey) {
      throw new Error('Blob key is required');
    }

    try {
      const url = `${this.baseUrl}/download/${encodeURIComponent(blobKey)}`;

      const response = await this._makeRequest(url, {
        method: 'GET',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Download failed');
      }

      // Convert base64 back to ArrayBuffer
      const encryptedData = this._base64ToArrayBuffer(result.data);
      
      console.log('Blob downloaded successfully:', blobKey);
      
      return {
        encryptedData,
        metadata: result.metadata,
      };
    } catch (error) {
      console.error('Failed to download blob:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * List available blobs
   * @param {Object} [options] - Query options
   * @param {number} [options.limit] - Maximum number of results
   * @param {string} [options.prefix] - Key prefix filter
   * @returns {Promise<{blobs: Array<{key: string, metadata: Object}>}>}
   */
  async listBlobs(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.prefix) params.set('prefix', options.prefix);
      
      const url = `${this.baseUrl}/list?${params.toString()}`;

      const response = await this._makeRequest(url, {
        method: 'GET',
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'List operation failed');
      }

      return {
        blobs: result.blobs || [],
      };
    } catch (error) {
      console.error('Failed to list blobs:', error);
      throw new Error(`List operation failed: ${error.message}`);
    }
  }

  /**
   * Delete a blob
   * @param {string} blobKey - Unique identifier for the blob
   * @returns {Promise<{success: boolean}>}
   */
  async deleteBlob(blobKey) {
    if (!blobKey) {
      throw new Error('Blob key is required');
    }

    try {
      const url = `${this.baseUrl}/delete`;
      
      const payload = { blobKey };

      const response = await this._makeRequest(url, {
        method: 'DELETE',
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Delete operation failed');
      }

      console.log('Blob deleted successfully:', blobKey);
      
      return { success: true };
    } catch (error) {
      console.error('Failed to delete blob:', error);
      throw new Error(`Delete operation failed: ${error.message}`);
    }
  }

  /**
   * Check API health/status
   * @returns {Promise<{status: string, timestamp: string}>}
   */
  async getStatus() {
    try {
      const url = `${this.baseUrl}/status`;

      const response = await this._makeRequest(url, {
        method: 'GET',
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to get API status:', error);
      throw new Error(`Status check failed: ${error.message}`);
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   * @param {ArrayBuffer} buffer - Buffer to convert
   * @returns {string} Base64 encoded string
   * @private
   */
  _arrayBufferToBase64(buffer) {
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
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

/**
 * Create a new API client instance
 * @param {Object} config - Client configuration
 * @returns {SolaceApiClient} API client instance
 */
function createApiClient(config) {
  return new SolaceApiClient(config);
}

/**
 * Utility functions for blob management
 */
const BlobUtils = {
  /**
   * Generate a unique blob key
   * @param {string} [prefix] - Optional prefix
   * @returns {string} Unique blob key
   */
  generateBlobKey(prefix = 'blob') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${prefix}-${timestamp}-${random}`;
  },

  /**
   * Validate blob key format
   * @param {string} blobKey - Blob key to validate
   * @returns {boolean} True if valid
   */
  isValidBlobKey(blobKey) {
    if (!blobKey || typeof blobKey !== 'string') {
      return false;
    }
    
    // Basic validation: alphanumeric, hyphens, underscores, dots
    return /^[a-zA-Z0-9._-]+$/.test(blobKey) && blobKey.length >= 3 && blobKey.length <= 256;
  },

  /**
   * Calculate data size in human readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Human readable size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};

module.exports = {
  SolaceApiClient,
  createApiClient,
  BlobUtils,
}; 