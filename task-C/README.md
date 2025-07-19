# Task C: Solace Lite - Voice-to-Voice AI Companion

A minimal voice-to-voice AI companion with chat and voice customization, trained in psychiatric knowledge.

## Features

- Voice Activity Detection (VAD) for automatic speech detection
- OpenAI Whisper API for speech-to-text transcription
- OpenAI GPT-3.5 for intelligent responses
- Text-to-Speech with voice customization (Male/Female)
- Encrypted conversation memory using Web Crypto API
- Test mode for demo purposes (bypasses API calls)
- Modern, responsive UI with glass morphism design

## Project Structure

```
task-C/
├── public/
├── src/
│   ├── components/
│   │   ├── VoiceCompanion.jsx      # Main app component
│   │   ├── VoiceCapture.jsx        # Voice recording interface
│   │   ├── VoiceSettings.jsx       # Voice selection (Male/Female)
│   │   ├── ChatInterface.jsx       # Conversation history display
│   │   ├── VoiceCompanion.css
│   │   ├── VoiceCapture.css
│   │   ├── VoiceSettings.css
│   │   └── ChatInterface.css
│   ├── hooks/
│   │   ├── useOpenAI.js           # OpenAI API integration
│   │   ├── useTTS.js              # Text-to-speech functionality
│   │   └── useVoiceMemory.js      # Encrypted localStorage memory
│   ├── utils/
│   │   ├── vad-simple.js          # Simple VAD implementation
│   │   └── crypto.js              # AES-GCM encryption utilities
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── mock-backend/
│   ├── server.js                  # Express server for TTS and blob storage
│   └── package.json
├── package.json
├── vite.config.js
└── README.md
```

## Setup

### Prerequisites

- Node.js 16+ 
- OpenAI API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file in the root directory:
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

3. Start the mock backend server:
```bash
cd mock-backend
npm install
npm start
```

4. Start the development server:
```bash
npm run dev
```

## Usage

1. **Enable Test Mode**: Check the "Test Mode" checkbox to bypass API calls for reliable demos
2. **Voice Selection**: Choose between Male or Female voice
3. **Start Listening**: Click the microphone button to begin voice interaction
4. **Speak**: The app will automatically detect speech and transcribe it
5. **Listen**: The AI will respond with synthesized speech

## API Limitations

**Important**: Due to OpenAI API rate limits, the application may encounter 429 "Too Many Requests" errors when making real API calls. This is expected behavior when:

- Making multiple requests in quick succession
- Exceeding OpenAI's rate limits
- Using the free tier API key

**Solutions**:
- Use "Test Mode" for demos (bypasses all API calls)
- Wait 1-2 minutes between requests
- Upgrade to a paid OpenAI plan for higher rate limits

## Technical Implementation

### Voice Activity Detection
- Uses `MediaRecorder` API for audio capture
- Simple VAD implementation with configurable thresholds
- Automatic speech start/stop detection

### Speech Processing
- Converts audio to WAV format for OpenAI Whisper
- Rate limiting and retry logic for API calls
- Error handling for transcription failures

### Memory System
- AES-GCM-256 encryption for localStorage
- Stores conversation history securely
- Maintains context for AI responses

### Text-to-Speech
- Mock backend server for TTS processing
- Browser speech synthesis fallback
- Voice customization (Male/Female)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend Server

The mock backend runs on port 4000 and provides:
- Health check endpoint
- Blob storage for audio files
- TTS service endpoints
- CORS support for frontend integration

## Troubleshooting

### Common Issues

1. **"Rate limit exceeded" errors**
   - Enable Test Mode for demos
   - Wait between requests
   - Check OpenAI API key validity

2. **Microphone not working**
   - Ensure browser permissions are granted
   - Check HTTPS/localhost requirement
   - Verify microphone hardware

3. **VAD misfires**
   - Adjust VAD sensitivity in `vad-simple.js`
   - Check audio input levels
   - Use manual stop button if needed

### Debug Mode

Enable browser console logging to see:
- VAD status and audio processing
- API request/response details
- Error messages and stack traces
- Memory operations

## Dependencies

### Frontend
- React 18
- Vite
- Web Crypto API (built-in)
- MediaRecorder API (built-in)

### Backend
- Express.js
- CORS middleware
- File upload handling
