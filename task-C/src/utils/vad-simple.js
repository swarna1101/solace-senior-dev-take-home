/**
 * Simple Voice Activity Detection utility
 * Basic implementation for testing without external dependencies
 */
export class SimpleVoiceActivityDetector {
  constructor() {
    this.mediaRecorder = null;
    this.audioContext = null;
    this.stream = null;
    this.isListening = false;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onVADMisfire = null;
    this.audioChunks = [];
    this.recordingTimeout = null;
  }

  /**
   * Initialize the VAD with configuration options
   * @param {Object} options - Configuration options
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
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('Simple VAD initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Simple VAD:', error);
      throw new Error(`Simple VAD initialization failed: ${error.message}`);
    }
  }

  /**
   * Start listening for voice activity
   * @param {Object} callbacks - Callback functions
   * @returns {Promise<void>}
   */
  async startListening(callbacks = {}) {
    if (!this.stream) {
      throw new Error('Simple VAD not initialized. Call initialize() first.');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return;
    }

    // Update callbacks if provided
    if (callbacks.onSpeechStart) this.onSpeechStart = callbacks.onSpeechStart;
    if (callbacks.onSpeechEnd) this.onSpeechEnd = callbacks.onSpeechEnd;
    if (callbacks.onVADMisfire) this.onVADMisfire = callbacks.onVADMisfire;

    try {
      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
        if (this.onSpeechStart) {
          this.onSpeechStart();
        }
        
        // Set a timeout to stop recording after 5 seconds (simulate speech end)
        this.recordingTimeout = setTimeout(() => {
          this.stopListening();
        }, 5000);
      };

      this.mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped');
        if (this.recordingTimeout) {
          clearTimeout(this.recordingTimeout);
          this.recordingTimeout = null;
        }
        
        if (this.audioChunks.length > 0) {
          try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Convert to Float32Array for processing
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const channelData = audioBuffer.getChannelData(0);
            
            if (this.onSpeechEnd) {
              this.onSpeechEnd(channelData);
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            if (this.onVADMisfire) {
              this.onVADMisfire();
            }
          }
        }
      };

      // Start recording
      this.mediaRecorder.start();
      this.isListening = true;
      console.log('Started listening for voice activity');
    } catch (error) {
      console.error('Failed to start listening:', error);
      throw new Error(`Failed to start Simple VAD: ${error.message}`);
    }
  }

  /**
   * Stop listening for voice activity
   * @returns {Promise<void>}
   */
  async stopListening() {
    if (!this.mediaRecorder || !this.isListening) {
      return;
    }

    try {
      this.mediaRecorder.stop();
      this.isListening = false;
      console.log('Stopped listening for voice activity');
    } catch (error) {
      console.error('Failed to stop listening:', error);
      throw new Error(`Failed to stop Simple VAD: ${error.message}`);
    }
  }

  /**
   * Destroy the VAD instance and clean up resources
   */
  async destroy() {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.mediaRecorder) {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder = null;
      } catch (error) {
        console.error('Error stopping MediaRecorder:', error);
      }
    }

    if (this.stream) {
      try {
        this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;
      } catch (error) {
        console.error('Error stopping stream:', error);
      }
    }

    this.isListening = false;
    console.log('Simple VAD destroyed successfully');
  }

  /**
   * Check if currently listening
   * @returns {boolean}
   */
  getIsListening() {
    return this.isListening;
  }
}

/**
 * Create a new Simple VAD instance
 * @param {Object} options - VAD options
 * @returns {Promise<SimpleVoiceActivityDetector>}
 */
export async function createSimpleVAD(options = {}) {
  const vad = new SimpleVoiceActivityDetector();
  await vad.initialize(options);
  return vad;
} 