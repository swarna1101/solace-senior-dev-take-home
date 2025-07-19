import React, { useState } from 'react';
import './VoiceSettings.css';

const VoiceSettings = () => {
  const [selectedVoice, setSelectedVoice] = useState('female');
  
  const voices = [
    { id: 'female', name: 'Female', icon: '👩' },
    { id: 'male', name: 'Male', icon: '👨' }
  ];

  const handleVoiceChange = (voiceId) => {
    setSelectedVoice(voiceId);
    console.log('Voice changed to:', voiceId);
  };

  return (
    <div className="voice-settings">
      <h3>Voice Selection</h3>
      <div className="voice-options">
        {voices.map(voice => (
          <button
            key={voice.id}
            className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''}`}
            onClick={() => handleVoiceChange(voice.id)}
          >
            <span className="voice-icon">{voice.icon}</span>
            <span className="voice-name">{voice.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default VoiceSettings; 