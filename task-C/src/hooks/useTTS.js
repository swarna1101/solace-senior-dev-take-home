import { useCallback } from 'react';

export const useTTS = () => {
  const synthesizeSpeech = useCallback(async (text, voice = 'female') => {
    try {
      // For demo purposes, we'll use a simple TTS service
      // In production, you would use AWS Polly or similar
      
      // Map voice selection to TTS parameters
      const voiceConfig = {
        female: {
          voice: 'Joanna',
          engine: 'neural',
          language: 'en-US'
        },
        male: {
          voice: 'Matthew',
          engine: 'neural',
          language: 'en-US'
        }
      };

      const config = voiceConfig[voice] || voiceConfig.female;

      // For demo, we'll use a mock TTS service
      // In production, replace with actual AWS Polly call
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: config.voice,
          engine: config.engine,
          language: config.language,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS failed: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return audioBlob;
    } catch (error) {
      console.error('TTS error:', error);
      
      // Fallback: Use browser's built-in speech synthesis
      return fallbackTTS(text, voice);
    }
  }, []);

  const playAudio = useCallback(async (audioBlob) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve, reject) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (error) => {
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };
        audio.play().catch(reject);
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      throw new Error(`Failed to play audio: ${error.message}`);
    }
  }, []);

  // Fallback TTS using browser's speech synthesis
  const fallbackTTS = useCallback((text, voice) => {
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = speechSynthesis.getVoices().find(v => 
          voice === 'female' ? v.name.includes('female') : v.name.includes('male')
        ) || null;
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        utterance.onend = () => resolve(new Blob());
        utterance.onerror = (error) => reject(error);
        
        speechSynthesis.speak(utterance);
      } else {
        reject(new Error('Speech synthesis not supported'));
      }
    });
  }, []);

  return {
    synthesizeSpeech,
    playAudio,
  };
}; 