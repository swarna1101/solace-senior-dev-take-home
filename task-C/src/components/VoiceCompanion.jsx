import React, { useState, useCallback } from 'react';
import VoiceCapture from './VoiceCapture';
import ChatInterface from './ChatInterface';
import VoiceSettings from './VoiceSettings';
import { useOpenAI } from '../hooks/useOpenAI';
import { useTTS } from '../hooks/useTTS';
import { useVoiceMemory } from '../hooks/useVoiceMemory';
import './VoiceCompanion.css';

const VoiceCompanion = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const { transcribeAudio, getChatResponse } = useOpenAI();
  const { speak } = useTTS();
  const { addToMemory, getMemory } = useVoiceMemory();

  const handleSpeechStart = useCallback(() => {
    console.log('Speech started in VoiceCompanion');
    setIsProcessing(true);
    setError(null);
  }, []);

  const handleSpeechEnd = useCallback(async (audioData) => {
    console.log('Speech ended in VoiceCompanion');
    setIsProcessing(true);
    setError(null);

    try {
      let transcription;
      
      if (testMode) {
        // Test mode: simulate transcription
        console.log('Test mode: Simulating transcription...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        transcription = "Hello, this is a test message";
        console.log('Test transcription:', transcription);
      } else {
        // Real mode: actual transcription
        console.log('Transcribing audio...');
        transcription = await transcribeAudio(audioData);
      }

      if (!transcription || transcription.trim() === '') {
        throw new Error('No speech detected. Please try again.');
      }

      console.log('Transcription:', transcription);

      // Get AI response
      let aiResponse;
      if (testMode) {
        // Test mode: simulate AI response
        console.log('Test mode: Simulating AI response...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        aiResponse = "Hello! I'm Solace, your AI companion. This is a test response.";
        console.log('Test AI response:', aiResponse);
      } else {
        // Real mode: actual AI response
        const memory = getMemory();
        aiResponse = await getChatResponse(transcription, memory);
      }

      console.log('AI Response:', aiResponse);

      // Add to memory
      addToMemory(transcription, aiResponse);

      // Add to conversation history
      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        user: transcription,
        assistant: aiResponse,
        voice: 'female' // Default voice
      };
      setConversationHistory(prev => [...prev, newEntry]);

      // Speak the response
      await speak(aiResponse);

      console.log('Voice processing completed successfully');
    } catch (error) {
      console.error('Voice processing error:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  }, [transcribeAudio, getChatResponse, speak, addToMemory, getMemory, testMode]);

  const toggleListening = useCallback(() => {
    setIsListening(!isListening);
    setError(null);
  }, [isListening]);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return (
    <div className="voice-companion">
      <div className="header">
        <h1>🎤 Solace Lite</h1>
        <p>Your AI Voice Companion</p>
      </div>

      <div className="main-content">
        <div className="voice-section">
          <VoiceCapture
            isListening={isListening}
            onToggle={toggleListening}
            onSpeechStart={handleSpeechStart}
            onSpeechEnd={handleSpeechEnd}
            isProcessing={isProcessing}
          />
          
          <VoiceSettings />
        </div>

        <div className="test-mode-toggle">
          <label>
            <input
              type="checkbox"
              checked={testMode}
              onChange={(e) => setTestMode(e.target.checked)}
            />
            Test Mode (bypasses API calls)
          </label>
          {testMode && (
            <div className="test-mode-info">
              ✅ Test mode enabled - UI flow works without API calls
            </div>
          )}
        </div>

        <ChatInterface 
          conversationHistory={conversationHistory}
          onClearConversation={clearConversation}
        />
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}
    </div>
  );
};

export default VoiceCompanion; 