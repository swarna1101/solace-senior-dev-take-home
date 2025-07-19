/**
 * Simplified encryption utilities for Task C
 * Uses Web Crypto API for AES-GCM encryption
 */

/**
 * Generate a new AES-GCM encryption key
 * @returns {Promise<CryptoKey>} Generated cryptographic key
 */
export async function generateKey() {
  return await crypto.subtle.generateKey(
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
export function generateIV() {
  return crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
}

/**
 * Encrypt data using AES-GCM-256
 * @param {CryptoKey} key - The encryption key
 * @param {ArrayBuffer|Uint8Array} data - Data to encrypt
 * @param {Uint8Array} [iv] - Optional IV, will generate if not provided
 * @returns {Promise<{ciphertext: ArrayBuffer, iv: Uint8Array}>} Encrypted data and IV
 */
export async function encrypt(key, data, iv = null) {
  if (!iv) {
    iv = generateIV();
  }
  
  const ciphertext = await crypto.subtle.encrypt(
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
export async function decrypt(key, ciphertext, iv) {
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Base64 encoded string
 */
export function arrayBufferToBase64(buffer) {
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
export function base64ToArrayBuffer(base64) {
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
export async function encryptText(key, text) {
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
export async function decryptText(key, ciphertextBase64, ivBase64) {
  const ciphertext = base64ToArrayBuffer(ciphertextBase64);
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const decryptedData = await decrypt(key, ciphertext, iv);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Export a key to raw format
 * @param {CryptoKey} key - Key to export
 * @returns {Promise<ArrayBuffer>} Raw key data
 */
export async function exportKey(key) {
  return await crypto.subtle.exportKey('raw', key);
}

/**
 * Import a key from raw format
 * @param {ArrayBuffer} keyData - Raw key data
 * @returns {Promise<CryptoKey>} Imported cryptographic key
 */
export async function importKey(keyData) {
  return await crypto.subtle.importKey(
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