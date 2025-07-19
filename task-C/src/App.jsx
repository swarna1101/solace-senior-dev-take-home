import React, { useState, useEffect, useRef } from 'react';
import VoiceCompanion from './components/VoiceCompanion';
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for required environment variables
    const requiredEnvVars = ['VITE_OPENAI_API_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
    
    if (missingVars.length > 0) {
      setError(`Missing required environment variables: ${missingVars.join(', ')}`);
      return;
    }

    setIsInitialized(true);
  }, []);

  if (error) {
    return (
      <div className="app">
        <div className="error-container">
          <h1>🚨 Configuration Error</h1>
          <p>{error}</p>
          <p>Please check your environment variables and restart the application.</p>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="app">
        <div className="loading-container">
          <h1>🎙️ Solace Lite</h1>
          <p>Initializing voice companion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <VoiceCompanion />
    </div>
  );
}

export default App; 