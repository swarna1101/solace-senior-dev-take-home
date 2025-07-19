import { useCallback, useRef } from 'react';

export const useOpenAI = () => {
  const lastRequestTime = useRef(0);
  const requestCount = useRef(0);

  const transcribeAudio = useCallback(async (audioData) => {
    try {
      // Rate limiting: Wait at least 1 second between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      if (timeSinceLastRequest < 1000) {
        console.log('Rate limiting: Waiting before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
      }

      // Update request tracking
      lastRequestTime.current = Date.now();
      requestCount.current++;

      console.log(`Making transcription request #${requestCount.current}`);

      // Convert Float32Array to WAV format for OpenAI Whisper
      const wavBuffer = audioToWAV(audioData);
      const formData = new FormData();
      formData.append('file', new Blob([wavBuffer], { type: 'audio/wav' }), 'audio.wav');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (response.status === 429) {
        console.log('Rate limit hit, waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Transcription successful:', result.text);
      return result.text;
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }, []);

  const getChatResponse = useCallback(async (userMessage, memory = []) => {
    try {
      // Rate limiting: Wait at least 500ms between chat requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime.current;
      if (timeSinceLastRequest < 500) {
        console.log('Rate limiting: Waiting before next chat request...');
        await new Promise(resolve => setTimeout(resolve, 500 - timeSinceLastRequest));
      }

      // Update request tracking
      lastRequestTime.current = Date.now();
      requestCount.current++;

      console.log(`Making chat request #${requestCount.current}`);

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: `You are Solace, a compassionate AI voice companion with expertise in psychiatric knowledge. 
          You provide supportive, empathetic responses while maintaining professional boundaries. 
          Keep responses concise (1-2 sentences) for voice interaction. 
          Be warm, understanding, and helpful.`
        },
        // Add memory context (last 3 conversations)
        ...memory.slice(-3).flatMap(entry => [
          { role: 'user', content: entry.user },
          { role: 'assistant', content: entry.assistant }
        ]),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (response.status === 429) {
        console.log('Rate limit hit for chat, waiting 1 second before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }

      if (!response.ok) {
        throw new Error(`Chat completion failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Chat response successful');
      return result.choices[0].message.content;
    } catch (error) {
      console.error('Chat completion error:', error);
      throw new Error(`Failed to get response: ${error.message}`);
    }
  }, []);

  return {
    transcribeAudio,
    getChatResponse,
  };
};

// Helper function to convert Float32Array to WAV format
function audioToWAV(audioData, sampleRate = 16000) {
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

  // Convert audio data to 16-bit PCM
  for (let i = 0; i < length; i++) {
    const sample = Math.max(-1, Math.min(1, audioData[i]));
    const pcm = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(44 + i * 2, pcm, true);
  }

  return buffer;
} 