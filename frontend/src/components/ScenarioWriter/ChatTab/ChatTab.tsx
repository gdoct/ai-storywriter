import React, { useEffect, useRef, useState } from 'react';
import { LLMMessage, streamChatCompletion } from '../../../services/llmService';
import { getSelectedModel } from '../../../services/modelSelection';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';
import './ChatTab.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatTab: React.FC<TabProps> = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsGenerating(true);

    // Prepare chat history for LLM
    const chatHistory: LLMMessage[] = [
      ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: input }
    ];

    try {
      // Fetch user-selected model
      const model = getSelectedModel();
      await streamChatCompletion(
        chatHistory,
        (assistantText, isDone) => {
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { ...updated[i], content: assistantText };
                break;
              }
            }
            return updated;
          });
        },
        { model: model || undefined, temperature: 0.8, max_tokens: 1024 }
      );
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], content: 'Sorry, there was an error.' };
            break;
          }
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="tab-container scenario-editor-panel">
      <div className="scenario-tab-title">Chat with AI Assistant</div>
      <div className="tab-actions">
        <div className="tab-actions-primary" />
        <div className="tab-actions-secondary" />
      </div>
      <p className="style-tab-description">
        Chat with an AI assistant to help develop your story ideas, get writing tips, or answer questions about your creative project.
      </p>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <h3>Welcome to the Chat Assistant!</h3>
              <p>Ask questions about writing, get suggestions for your story, or brainstorm ideas together.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-message-content">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            disabled={isGenerating}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={isGenerating || !input.trim()}
          >
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
