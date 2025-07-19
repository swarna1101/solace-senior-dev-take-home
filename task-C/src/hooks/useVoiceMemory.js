import { useCallback, useEffect, useState } from 'react';
import { generateKey, encryptText, decryptText, exportKey, importKey } from '../utils/crypto.js';

export const useVoiceMemory = () => {
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [memory, setMemory] = useState([]);

  useEffect(() => {
    initializeMemory();
  }, []);

  const initializeMemory = async () => {
    try {
      // Try to load existing key from localStorage
      const storedKeyData = localStorage.getItem('solace_encryption_key');
      let key;

      if (storedKeyData) {
        // Import existing key
        const keyBuffer = base64ToArrayBuffer(storedKeyData);
        key = await importKey(keyBuffer);
      } else {
        // Generate new key
        key = await generateKey();
        const keyData = await exportKey(key);
        localStorage.setItem('solace_encryption_key', arrayBufferToBase64(keyData));
      }

      setEncryptionKey(key);
      loadMemory(key);
    } catch (error) {
      console.error('Failed to initialize memory:', error);
    }
  };

  const loadMemory = useCallback(async (key) => {
    try {
      const storedMemory = localStorage.getItem('solace_voice_memory');
      if (storedMemory && key) {
        const decryptedMemory = await decryptText(
          key,
          storedMemory,
          localStorage.getItem('solace_memory_iv') || ''
        );
        const parsedMemory = JSON.parse(decryptedMemory);
        setMemory(parsedMemory);
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
      // If decryption fails, start with empty memory
      setMemory([]);
    }
  }, []);

  const addToMemory = useCallback(async (userMessage, assistantResponse) => {
    try {
      if (!encryptionKey) return;

      const newEntry = {
        user: userMessage,
        assistant: assistantResponse,
        timestamp: new Date().toISOString(),
      };

      const updatedMemory = [...memory, newEntry].slice(-3); // Keep last 3 conversations
      setMemory(updatedMemory);

      // Encrypt memory before storing
      const encryptedMemory = await encryptText(encryptionKey, JSON.stringify(updatedMemory));
      localStorage.setItem('solace_voice_memory', encryptedMemory.ciphertext);
      localStorage.setItem('solace_memory_iv', encryptedMemory.iv);
    } catch (error) {
      console.error('Failed to add to memory:', error);
    }
  }, [memory, encryptionKey]);

  const getMemory = useCallback(() => {
    return memory;
  }, [memory]);

  const clearMemory = useCallback(async () => {
    try {
      setMemory([]);
      localStorage.removeItem('solace_voice_memory');
      localStorage.removeItem('solace_memory_iv');
    } catch (error) {
      console.error('Failed to clear memory:', error);
    }
  }, []);

  return {
    memory,
    addToMemory,
    getMemory,
    clearMemory,
  };
};

// Helper functions for Base64 conversion
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
} 