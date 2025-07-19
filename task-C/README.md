# Task C: Solace Lite End-to-End Demo

## Overview

A minimal voice→voice companion with chat and voice customization, trained in psychiatric knowledge. This demo showcases:

- **Voice Capture & ASR**: Real-time microphone input with Voice Activity Detection (VAD)
- **Chatbot**: OpenAI GPT-3.5 integration for intelligent responses
- **TTS & Voice Customization**: Text-to-speech with male/female voice options
- **UI/UX**: Modern React interface with voice controls
- **Memory Layer**: Encrypted localStorage for conversation history
- **Error Handling**: Comprehensive error handling and logging

## Features

### 🎤 Voice Capture & ASR
- Real-time microphone input using Web Audio API
- Voice Activity Detection using @ricky0123/vad-web
- Audio transcription via OpenAI Whisper API
- Automatic speech start/stop detection

### 🤖 Chatbot
- OpenAI GPT-3.5/4 integration
- Psychiatric knowledge training
- Context-aware responses
- Conversation memory (last 3 exchanges)

### 🔊 TTS & Voice Customization
- Text-to-speech synthesis
- Male/Female voice selection
- Audio playback with fallback to browser speech synthesis
- Mock TTS service for demo purposes

### 🎨 UI/UX
- Modern React interface with glassmorphism design
- Real-time voice status indicators
- Conversation history display
- Voice selection controls
- Error handling and user feedback

### 🔐 Security & Memory
- End-to-end encryption using Web Crypto API
- Encrypted localStorage for conversation history
- Secure key management
- Privacy-focused design

## Prerequisites

1. **Node.js** (>=16.x)
2. **npm** or **yarn**
3. **OpenAI API Key** (for ASR and chatbot)
4. **Modern browser** with Web Audio API support

## Environment Variables

Create a `.env` file in the `task-C` directory:

```bash
# Required
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Optional (for production TTS)
VITE_AWS_POLLY_ACCESS_KEY=your_aws_access_key
VITE_AWS_POLLY_SECRET_KEY=your_aws_secret_key
VITE_AWS_REGION=us-east-1
```

## Quick Start

### 1. Install Dependencies

```bash
cd task-C
npm install
```

### 2. Start Mock Backend

```bash
npm run mock-backend
```

This starts the mock backend server on `http://localhost:4000`

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Usage

1. **Grant microphone permissions** when prompted
2. **Select voice preference** (Male/Female)
3. **Click "Start Listening"** to begin voice interaction
4. **Speak clearly** - the system will detect speech automatically
5. **Wait for response** - the AI will transcribe, process, and respond
6. **View conversation history** in the chat interface

## Project Structure

```
task-C/
├── src/
│   ├── components/
│   │   ├── VoiceCompanion.jsx      # Main voice companion component
│   │   ├── VoiceCapture.jsx        # Voice capture and VAD
│   │   ├── VoiceSettings.jsx       # Voice selection UI
│   │   └── ChatInterface.jsx       # Conversation display
│   ├── hooks/
│   │   ├── useOpenAI.js           # OpenAI API integration
│   │   ├── useTTS.js              # Text-to-speech utilities
│   │   └── useVoiceMemory.js      # Encrypted memory management
│   ├── utils/
│   │   ├── vad.js                 # Voice Activity Detection
│   │   └── crypto.js              # Encryption utilities
│   ├── App.jsx                    # Main app component
│   └── main.jsx                   # React entry point
├── mock-backend/
│   └── server.js                  # Mock backend server
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration
└── README.md                      # This file
```

## API Endpoints

### Mock Backend (localhost:4000)

- `GET /health` - Health check
- `POST /upload` - Upload encrypted blobs
- `GET /download/:blobKey` - Download blobs
- `POST /api/tts` - Text-to-speech service
- `GET /blobs` - List stored blobs
- `DELETE /blobs/:blobKey` - Delete blob

### External APIs

- **OpenAI Whisper**: Audio transcription
- **OpenAI GPT-3.5**: Chat completion
- **Browser Speech Synthesis**: Fallback TTS

## Technical Details

### Voice Activity Detection
- Uses @ricky0123/vad-web for real-time speech detection
- Configurable thresholds for speech start/stop
- Automatic audio capture and processing

### Encryption
- AES-GCM-256 encryption using Web Crypto API
- Secure key generation and storage
- Encrypted conversation memory in localStorage

### Audio Processing
- Float32Array to WAV conversion for OpenAI Whisper
- 16kHz sample rate for optimal transcription
- Automatic audio format conversion

### Error Handling
- Network error detection and recovery
- Microphone permission handling
- Graceful fallbacks for failed services
- User-friendly error messages

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Check browser permissions
   - Ensure HTTPS or localhost
   - Try refreshing the page

2. **OpenAI API errors**
   - Verify API key in .env file
   - Check API key permissions
   - Ensure sufficient credits

3. **VAD not detecting speech**
   - Speak clearly and loudly
   - Check microphone input levels
   - Try adjusting VAD thresholds

4. **TTS not working**
   - Check browser speech synthesis support
   - Verify mock backend is running
   - Check console for errors

### Debug Mode

Enable debug logging by opening browser console and running:
```javascript
localStorage.setItem('debug', 'true');
```

## Production Deployment

For production deployment:

1. **Replace mock TTS** with AWS Polly or similar service
2. **Add proper CORS** configuration
3. **Implement rate limiting** for API endpoints
4. **Add authentication** for sensitive operations
5. **Use HTTPS** for all communications
6. **Configure proper error monitoring**

## Security Considerations

- API keys are stored in environment variables
- Encryption keys are generated locally
- No sensitive data is transmitted unencrypted
- Conversation history is encrypted at rest
- Microphone access requires explicit user permission

## Performance Notes

- VAD processing is real-time and optimized
- Audio conversion is done efficiently
- Memory usage is minimal and controlled
- Network requests are batched where possible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details 