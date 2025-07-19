import React, { useRef, useEffect } from 'react';
import './ChatInterface.css';

const ChatInterface = ({ conversationHistory, onClearConversation }) => {
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h3>Conversation History</h3>
        {conversationHistory.length > 0 && (
          <button 
            className="clear-button"
            onClick={onClearConversation}
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="chat-messages" ref={chatRef}>
        {conversationHistory.length === 0 ? (
          <div className="empty-chat">
            <div className="empty-icon">💬</div>
            <p>No conversations yet</p>
            <p>Start talking to begin a conversation!</p>
          </div>
        ) : (
          conversationHistory.map((entry) => (
            <div key={entry.id} className="chat-entry">
              <div className="message user-message">
                <div className="message-header">
                  <span className="user-icon">👤</span>
                  <span className="message-time">{formatTime(entry.timestamp)}</span>
                </div>
                <div className="message-content">
                  {entry.user}
                </div>
              </div>
              
              <div className="message assistant-message">
                <div className="message-header">
                  <span className="assistant-icon">🤖</span>
                  <span className="message-time">{formatTime(entry.timestamp)}</span>
                  <span className="voice-indicator">
                    {entry.voice === 'female' ? '👩' : '👨'}
                  </span>
                </div>
                <div className="message-content">
                  {entry.assistant}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 