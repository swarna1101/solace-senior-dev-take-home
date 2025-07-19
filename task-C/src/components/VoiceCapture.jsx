import React, { useState, useEffect, useRef } from 'react';
import { createSimpleVAD } from '../utils/vad-simple.js';
import { generateKey, encryptText, decryptText, exportKey, importKey } from '../utils/crypto.js';
import './VoiceCapture.css';

const VoiceCapture = ({ 
  isListening, 
  isProcessing, 
  onSpeechStart, 
  onSpeechEnd, 
  onVADMisfire, 
  onStopListening 
}) => {
  const [vad, setVad] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [vadStatus, setVadStatus] = useState('idle'); // idle, listening, processing
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    initializeVAD();
    return () => {
      if (vad) {
        vad.destroy();
      }
    };
  }, []);

  const initializeVAD = async () => {
    try {
      setDebugInfo('Initializing Simple VAD...');
      
      // Check if Web Audio API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Web Audio API not supported in this browser');
      }

      // Initialize encryption key
      setDebugInfo('Generating encryption key...');
      const key = await generateKey();
      setEncryptionKey(key);

      // Initialize Simple VAD
      setDebugInfo('Creating Simple VAD instance...');
      const vadInstance = await createSimpleVAD({
        positiveSpeechThreshold: 0.5,
        negativeSpeechThreshold: 0.35,
        preSpeechPadFrames: 1,
        redemptionFrames: 8,
        frameSamples: 1536,
        minSpeechFrames: 3,
      });

      setVad(vadInstance);
      setIsInitialized(true);
      setDebugInfo('Simple VAD initialized successfully');
      console.log('Simple VAD initialized successfully');
    } catch (err) {
      const errorMsg = `Failed to initialize VAD: ${err.message}`;
      setError(errorMsg);
      setDebugInfo(`Error: ${err.message}`);
      console.error('VAD initialization error:', err);
    }
  };

  const startListening = async () => {
    if (!vad || !isInitialized) {
      const errorMsg = 'VAD not initialized';
      setError(errorMsg);
      setDebugInfo(errorMsg);
      return;
    }

    try {
      setDebugInfo('Starting Simple VAD...');
      console.log('Starting Simple VAD...');
      
      await vad.startListening({
        onSpeechStart: () => {
          console.log('Speech started');
          setVadStatus('listening');
          onSpeechStart();
        },
        onSpeechEnd: async (audioData) => {
          console.log('Speech ended, audio length:', audioData.length);
          setVadStatus('processing');
          onSpeechEnd(audioData);
        },
        onVADMisfire: () => {
          console.log('VAD misfire detected');
          setVadStatus('idle');
          onVADMisfire();
        },
      });
      
      setDebugInfo('Simple VAD started successfully');
      console.log('Simple VAD started successfully');
    } catch (err) {
      const errorMsg = `Failed to start listening: ${err.message}`;
      setError(errorMsg);
      setDebugInfo(`Error: ${err.message}`);
      console.error('Start listening error:', err);
    }
  };

  const stopListening = async () => {
    if (!vad) return;

    try {
      setDebugInfo('Stopping Simple VAD...');
      await vad.stopListening();
      setVadStatus('idle');
      onStopListening();
      setDebugInfo('Simple VAD stopped');
    } catch (err) {
      const errorMsg = `Failed to stop listening: ${err.message}`;
      setError(errorMsg);
      setDebugInfo(`Error: ${err.message}`);
      console.error('Stop listening error:', err);
    }
  };

  const handleToggleListening = () => {
    console.log('Toggle listening clicked, current state:', { isListening, isProcessing, isInitialized });
    
    if (isListening || isProcessing) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleManualStop = () => {
    console.log('Manual stop clicked');
    stopListening();
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';
    if (isListening) return 'Stop Listening';
    return 'Start Listening';
  };

  const getButtonClass = () => {
    if (isProcessing) return 'voice-button processing';
    if (isListening) return 'voice-button listening';
    return 'voice-button idle';
  };

  if (error) {
    return (
      <div className="voice-capture-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <p className="debug-info">{debugInfo}</p>
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="voice-capture-loading">
        <div className="loading-spinner"></div>
        <p>Initializing voice capture...</p>
        <p className="debug-info">{debugInfo}</p>
      </div>
    );
  }

  return (
    <div className="voice-capture">
      <button
        className={getButtonClass()}
        onClick={handleToggleListening}
        disabled={isProcessing}
      >
        <div className="button-content">
          <div className="mic-icon">
            {isProcessing ? '⏳' : isListening ? '🎤' : '🎙️'}
          </div>
          <span>{getButtonText()}</span>
        </div>
      </button>
      
      {isListening && (
        <button
          className="manual-stop-button"
          onClick={handleManualStop}
          disabled={isProcessing}
        >
          Stop Recording
        </button>
      )}
      
      <div className="status-indicator">
        <div className={`status-dot ${vadStatus}`}></div>
        <span className="status-text">
          {vadStatus === 'idle' && 'Ready to listen'}
          {vadStatus === 'listening' && 'Listening... (will auto-stop in 5s)'}
          {vadStatus === 'processing' && 'Processing speech...'}
        </span>
      </div>
      
      {debugInfo && (
        <div className="debug-info">
          <small>{debugInfo}</small>
        </div>
      )}
    </div>
  );
};

export default VoiceCapture; 