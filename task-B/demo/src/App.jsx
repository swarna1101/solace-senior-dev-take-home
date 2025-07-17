import React, { useState, useEffect, useRef } from 'react';
import { 
  SolaceSDK, 
  Features,
  createVAD,
  AudioUtils,
  BlobUtils,
  VERSION 
} from '@solace/client-sdk/src/index.browser.js';
import './App.css';

function App() {
  const [sdk, setSdk] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioRecordings, setAudioRecordings] = useState([]);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [logs, setLogs] = useState([]);
  const [features, setFeatures] = useState({});
  const [config, setConfig] = useState({
    apiBaseUrl: 'https://your-api-gateway-url.amazonaws.com/prod',
    apiKey: '',
  });

  // Text encryption demo
  const [textToEncrypt, setTextToEncrypt] = useState('Hello, Solace Security!');
  const [encryptedText, setEncryptedText] = useState(null);
  const [decryptedText, setDecryptedText] = useState('');

  // File upload demo
  const fileInputRef = useRef(null);
  const [uploadedBlobs, setUploadedBlobs] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, { timestamp, message, type }].slice(-100)); // Keep last 100 logs
  };

  useEffect(() => {
    // Check feature availability
    setFeatures({
      webCrypto: Features.hasWebCrypto(),
      webRTC: Features.hasWebRTC(),
      webWorkers: Features.hasWebWorkers(),
      audioFormats: Features.getSupportedAudioFormats(),
    });

    addLog(`Solace Client SDK v${VERSION} loaded`);
    addLog(`Features: WebCrypto=${Features.hasWebCrypto()}, WebRTC=${Features.hasWebRTC()}`);
  }, []);

  const initializeSDK = async () => {
    try {
      addLog('Initializing Solace SDK...');
      const newSdk = new SolaceSDK({
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
      });

      await newSdk.initialize({
        generateKey: true,
        initializeVAD: true,
        vadOptions: {
          onSpeechStart: () => {
            addLog('🎤 Speech started', 'success');
          },
          onSpeechEnd: async (audioData) => {
            addLog(`🎤 Speech ended (${audioData.length} samples)`, 'success');
            
            try {
              // Process the audio data
              const result = await newSdk.processAudioData(audioData, {
                metadata: { source: 'microphone', recordedAt: new Date().toISOString() }
              });
              
              addLog(`Audio processed and uploaded as ${result.blobKey}`, 'success');
              setAudioRecordings(prev => [...prev, {
                blobKey: result.blobKey,
                duration: result.metadata.duration,
                size: result.metadata.samples,
                timestamp: new Date().toISOString(),
              }]);
            } catch (error) {
              addLog(`Error processing audio: ${error.message}`, 'error');
            }
          },
          onVADMisfire: () => {
            addLog('🎤 VAD misfire detected', 'warning');
          },
        },
      });

      // Get and display the encryption key
      const keyData = await newSdk.getEncryptionKey();
      setEncryptionKey(Array.from(new Uint8Array(keyData)).map(b => b.toString(16).padStart(2, '0')).join(''));

      setSdk(newSdk);
      setIsInitialized(true);
      addLog('SDK initialized successfully!', 'success');
    } catch (error) {
      addLog(`SDK initialization failed: ${error.message}`, 'error');
    }
  };

  const startListening = async () => {
    try {
      await sdk.startVAD();
      setIsListening(true);
      addLog('Started listening for voice activity', 'success');
    } catch (error) {
      addLog(`Failed to start listening: ${error.message}`, 'error');
    }
  };

  const stopListening = async () => {
    try {
      await sdk.stopVAD();
      setIsListening(false);
      addLog('Stopped listening for voice activity', 'info');
    } catch (error) {
      addLog(`Failed to stop listening: ${error.message}`, 'error');
    }
  };

  const encryptTextDemo = async () => {
    try {
      const result = await sdk.encryptText(textToEncrypt);
      setEncryptedText(result);
      addLog(`Text encrypted successfully`, 'success');
    } catch (error) {
      addLog(`Text encryption failed: ${error.message}`, 'error');
    }
  };

  const decryptTextDemo = async () => {
    try {
      if (!encryptedText) {
        addLog('No encrypted text available', 'warning');
        return;
      }
      const result = await sdk.decryptText(encryptedText.ciphertext, encryptedText.iv);
      setDecryptedText(result);
      addLog(`Text decrypted successfully`, 'success');
    } catch (error) {
      addLog(`Text decryption failed: ${error.message}`, 'error');
    }
  };

  const uploadFileDemo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      addLog(`Uploading file: ${file.name} (${BlobUtils.formatSize(file.size)})`);
      
      const arrayBuffer = await file.arrayBuffer();
      const blobKey = BlobUtils.generateBlobKey('file');
      
      const result = await sdk.uploadEncryptedBlob(blobKey, arrayBuffer, {
        filename: file.name,
        type: file.type,
        originalSize: file.size,
      });

      addLog(`File uploaded successfully as ${result.blobKey}`, 'success');
      setUploadedBlobs(prev => [...prev, {
        blobKey: result.blobKey,
        filename: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: result.uploadedAt,
      }]);
    } catch (error) {
      addLog(`File upload failed: ${error.message}`, 'error');
    }

    // Reset file input
    event.target.value = '';
  };

  const downloadFile = async (blob) => {
    try {
      addLog(`Downloading ${blob.filename}...`);
      
      const result = await sdk.downloadDecryptedBlob(blob.blobKey);
      
      // Create download link
      const downloadBlob = new Blob([result.decryptedData], { type: blob.type });
      const url = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = blob.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog(`File downloaded successfully`, 'success');
    } catch (error) {
      addLog(`File download failed: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const destroySDK = async () => {
    if (sdk) {
      await sdk.destroy();
      setSdk(null);
      setIsInitialized(false);
      setIsListening(false);
      addLog('SDK destroyed', 'info');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔐 Solace Client SDK Demo</h1>
        <p>Version {VERSION} - Secure Voice Processing & Encryption</p>
      </header>

      <main className="app-main">
        {/* Feature Support */}
        <section className="card">
          <h2>🔍 Feature Support</h2>
          <div className="feature-grid">
            <div className={`feature ${features.webCrypto ? 'supported' : 'unsupported'}`}>
              <span>🔒 Web Crypto API</span>
              <span>{features.webCrypto ? '✅' : '❌'}</span>
            </div>
            <div className={`feature ${features.webRTC ? 'supported' : 'unsupported'}`}>
              <span>🎤 WebRTC (Microphone)</span>
              <span>{features.webRTC ? '✅' : '❌'}</span>
            </div>
            <div className={`feature ${features.webWorkers ? 'supported' : 'unsupported'}`}>
              <span>👷 Web Workers</span>
              <span>{features.webWorkers ? '✅' : '❌'}</span>
            </div>
          </div>
        </section>

        {/* SDK Configuration */}
        <section className="card">
          <h2>⚙️ SDK Configuration</h2>
          <div className="config-form">
            <div className="form-group">
              <label>API Base URL:</label>
              <input
                type="url"
                value={config.apiBaseUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, apiBaseUrl: e.target.value }))}
                placeholder="https://your-api-gateway-url.amazonaws.com/prod"
                disabled={isInitialized}
              />
            </div>
            <div className="form-group">
              <label>API Key (optional):</label>
              <input
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="Your API key"
                disabled={isInitialized}
              />
            </div>
            <div className="button-group">
              {!isInitialized ? (
                <button 
                  onClick={initializeSDK} 
                  className="btn btn-primary"
                  disabled={!features.webCrypto}
                >
                  Initialize SDK
                </button>
              ) : (
                <button onClick={destroySDK} className="btn btn-secondary">
                  Destroy SDK
                </button>
              )}
            </div>
          </div>
        </section>

        {isInitialized && (
          <>
            {/* Encryption Key Display */}
            <section className="card">
              <h2>🔑 Encryption Key</h2>
              <div className="key-display">
                <code>{encryptionKey}</code>
                <p><small>AES-256-GCM key (hex encoded)</small></p>
              </div>
            </section>

            {/* Text Encryption Demo */}
            <section className="card">
              <h2>📝 Text Encryption Demo</h2>
              <div className="demo-section">
                <div className="form-group">
                  <label>Text to encrypt:</label>
                  <textarea
                    value={textToEncrypt}
                    onChange={(e) => setTextToEncrypt(e.target.value)}
                    rows={3}
                    placeholder="Enter text to encrypt..."
                  />
                </div>
                <div className="button-group">
                  <button onClick={encryptTextDemo} className="btn btn-primary">
                    Encrypt Text
                  </button>
                  <button 
                    onClick={decryptTextDemo} 
                    className="btn btn-secondary"
                    disabled={!encryptedText}
                  >
                    Decrypt Text
                  </button>
                </div>
                {encryptedText && (
                  <div className="result">
                    <h4>Encrypted:</h4>
                    <div className="encrypted-data">
                      <p><strong>Ciphertext:</strong> <code>{encryptedText.ciphertext.substring(0, 50)}...</code></p>
                      <p><strong>IV:</strong> <code>{encryptedText.iv}</code></p>
                    </div>
                  </div>
                )}
                {decryptedText && (
                  <div className="result">
                    <h4>Decrypted:</h4>
                    <p className="decrypted-text">{decryptedText}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Voice Activity Detection */}
            {features.webRTC && (
              <section className="card">
                <h2>🎤 Voice Activity Detection</h2>
                <div className="vad-controls">
                  <div className="button-group">
                    {!isListening ? (
                      <button onClick={startListening} className="btn btn-primary">
                        Start Listening
                      </button>
                    ) : (
                      <button onClick={stopListening} className="btn btn-danger">
                        Stop Listening
                      </button>
                    )}
                  </div>
                  <div className={`status-indicator ${isListening ? 'listening' : 'idle'}`}>
                    {isListening ? '🔴 Listening...' : '⚫ Idle'}
                  </div>
                </div>

                {audioRecordings.length > 0 && (
                  <div className="recordings">
                    <h4>Audio Recordings ({audioRecordings.length})</h4>
                    <div className="recordings-list">
                      {audioRecordings.map((recording, index) => (
                        <div key={index} className="recording-item">
                          <span className="recording-info">
                            <strong>{recording.blobKey}</strong>
                            <br />
                            Duration: {recording.duration.toFixed(2)}s | Samples: {recording.size}
                          </span>
                          <span className="recording-time">{new Date(recording.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* File Upload Demo */}
            <section className="card">
              <h2>📎 File Upload/Download Demo</h2>
              <div className="file-demo">
                <div className="upload-area">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={uploadFileDemo}
                    style={{ display: 'none' }}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="btn btn-primary"
                  >
                    Select File to Upload
                  </button>
                </div>

                {uploadedBlobs.length > 0 && (
                  <div className="uploaded-files">
                    <h4>Uploaded Files ({uploadedBlobs.length})</h4>
                    <div className="files-list">
                      {uploadedBlobs.map((blob, index) => (
                        <div key={index} className="file-item">
                          <div className="file-info">
                            <strong>{blob.filename}</strong>
                            <br />
                            <small>
                              {BlobUtils.formatSize(blob.size)} | {blob.type}
                              <br />
                              Key: {blob.blobKey}
                            </small>
                          </div>
                          <button 
                            onClick={() => downloadFile(blob)} 
                            className="btn btn-small btn-secondary"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* Logs */}
        <section className="card logs-section">
          <div className="logs-header">
            <h2>📋 Activity Logs</h2>
            <button onClick={clearLogs} className="btn btn-small btn-secondary">
              Clear Logs
            </button>
          </div>
          <div className="logs">
            {logs.length === 0 ? (
              <p className="no-logs">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`log-entry log-${log.type}`}>
                  <span className="log-timestamp">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>
          Built with ❤️ using Solace Client SDK v{VERSION}
          <br />
          <small>Secure voice processing and encryption for modern applications</small>
        </p>
      </footer>
    </div>
  );
}

export default App; 