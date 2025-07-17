/**
 * @fileoverview Voice Activity Detection utilities
 * Implements VAD using @ricky0123/vad-web package
 */

import { MicVAD, utils } from '@ricky0123/vad-web';

/**
 * Voice Activity Detection class
 * Provides real-time voice activity detection capabilities
 */
export class VoiceActivityDetector {
  constructor() {
    this.vad = null;
    this.isListening = false;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onVADMisfire = null;
    this.audioContext = null;
    this.mediaStream = null;
  }

  /**
   * Initialize the VAD with configuration options
   * @param {Object} options - Configuration options
   * @param {Function} options.onSpeechStart - Callback when speech starts
   * @param {Function} options.onSpeechEnd - Callback when speech ends (receives audio data)
   * @param {Function} options.onVADMisfire - Callback for VAD misfire events
   * @param {number} options.positiveSpeechThreshold - Threshold for positive speech detection (0-1)
   * @param {number} options.negativeSpeechThreshold - Threshold for negative speech detection (0-1)
   * @param {number} options.preSpeechPadFrames - Frames to include before speech
   * @param {number} options.redemptionFrames - Frames for redemption period
   * @param {number} options.frameSamples - Number of samples per frame
   * @param {number} options.minSpeechFrames - Minimum frames for valid speech
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    const defaultOptions = {
      positiveSpeechThreshold: 0.5,
      negativeSpeechThreshold: 0.35,
      preSpeechPadFrames: 1,
      redemptionFrames: 8,
      frameSamples: 1536,
      minSpeechFrames: 3,
      ...options
    };

    this.onSpeechStart = defaultOptions.onSpeechStart;
    this.onSpeechEnd = defaultOptions.onSpeechEnd;
    this.onVADMisfire = defaultOptions.onVADMisfire;

    try {
      this.vad = await MicVAD.new({
        onSpeechStart: () => {
          console.log('Speech started');
          if (this.onSpeechStart) {
            this.onSpeechStart();
          }
        },
        onSpeechEnd: (audio) => {
          console.log('Speech ended, audio length:', audio.length);
          if (this.onSpeechEnd) {
            this.onSpeechEnd(audio);
          }
        },
        onVADMisfire: () => {
          console.log('VAD misfire detected');
          if (this.onVADMisfire) {
            this.onVADMisfire();
          }
        },
        positiveSpeechThreshold: defaultOptions.positiveSpeechThreshold,
        negativeSpeechThreshold: defaultOptions.negativeSpeechThreshold,
        preSpeechPadFrames: defaultOptions.preSpeechPadFrames,
        redemptionFrames: defaultOptions.redemptionFrames,
        frameSamples: defaultOptions.frameSamples,
        minSpeechFrames: defaultOptions.minSpeechFrames,
      });

      console.log('VAD initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VAD:', error);
      throw new Error(`VAD initialization failed: ${error.message}`);
    }
  }

  /**
   * Start listening for voice activity
   * @returns {Promise<void>}
   */
  async startListening() {
    if (!this.vad) {
      throw new Error('VAD not initialized. Call initialize() first.');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    try {
      await this.vad.start();
      this.isListening = true;
      console.log('Started listening for voice activity');
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw new Error(`Failed to start VAD: ${error.message}`);
    }
  }

  /**
   * Stop listening for voice activity
   * @returns {Promise<void>}
   */
  async stopListening() {
    if (!this.vad || !this.isListening) {
      return;
    }

    try {
      this.vad.pause();
      this.isListening = false;
      console.log('Stopped listening for voice activity');
    } catch (error) {
      console.error('Failed to stop listening:', error);
      throw new Error(`Failed to stop VAD: ${error.message}`);
    }
  }

  /**
   * Destroy the VAD instance and clean up resources
   */
  async destroy() {
    if (this.vad) {
      try {
        this.vad.destroy();
        this.vad = null;
        this.isListening = false;
        console.log('VAD destroyed successfully');
      } catch (error) {
        console.error('Error destroying VAD:', error);
      }
    }
  }

  /**
   * Check if currently listening
   * @returns {boolean}
   */
  getIsListening() {
    return this.isListening;
  }

  /**
   * Get the current VAD instance
   * @returns {MicVAD|null}
   */
  getVADInstance() {
    return this.vad;
  }
}

/**
 * Utility functions for audio processing
 */
export const AudioUtils = {
  /**
   * Convert Float32Array audio data to ArrayBuffer (16-bit PCM)
   * @param {Float32Array} audioData - Audio data from VAD
   * @param {number} sampleRate - Sample rate (default: 16000)
   * @returns {ArrayBuffer} PCM audio data
   */
  float32ToPCM16(audioData, sampleRate = 16000) {
    const buffer = new ArrayBuffer(audioData.length * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(i * 2, pcm, true); // little-endian
    }
    
    return buffer;
  },

  /**
   * Convert audio data to WAV format
   * @param {Float32Array} audioData - Audio data
   * @param {number} sampleRate - Sample rate (default: 16000)
   * @returns {ArrayBuffer} WAV audio data
   */
  audioToWAV(audioData, sampleRate = 16000) {
    const length = audioData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float32 to int16
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, pcm, true);
      offset += 2;
    }
    
    return buffer;
  },

  /**
   * Create a Blob from audio data
   * @param {ArrayBuffer} audioBuffer - Audio data
   * @param {string} mimeType - MIME type (default: 'audio/wav')
   * @returns {Blob} Audio blob
   */
  createAudioBlob(audioBuffer, mimeType = 'audio/wav') {
    return new Blob([audioBuffer], { type: mimeType });
  },

  /**
   * Calculate audio duration in seconds
   * @param {Float32Array} audioData - Audio data
   * @param {number} sampleRate - Sample rate (default: 16000)
   * @returns {number} Duration in seconds
   */
  calculateDuration(audioData, sampleRate = 16000) {
    return audioData.length / sampleRate;
  },

  /**
   * Apply volume gain to audio data
   * @param {Float32Array} audioData - Audio data
   * @param {number} gain - Gain factor (1.0 = no change)
   * @returns {Float32Array} Modified audio data
   */
  applyGain(audioData, gain) {
    const result = new Float32Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      result[i] = Math.max(-1, Math.min(1, audioData[i] * gain));
    }
    return result;
  }
};

/**
 * Create a new VoiceActivityDetector instance
 * @returns {VoiceActivityDetector}
 */
export function createVAD() {
  return new VoiceActivityDetector();
}

// Export utils from vad-web for convenience
export { utils as VADUtils }; 