import React, { useEffect, useRef, useState } from 'react';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';
import './ChatTab.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const BACKEND_URL = 'http://localhost:5000';
const LLM_PROXY_ENDPOINT = `${BACKEND_URL}/proxy/llm/v1/chat/completions`;

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

    // Prepare payload as in chatbot.py
    const payload = {
      model: 'google/gemma-3-4b',
      messages: [
        ...messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: input }
      ],
      temperature: 0.8,
      max_tokens: 1024
    };

    try {
      const response = await fetch(LLM_PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (!response.body) throw new Error('No response body');
      const reader = response.body.getReader();
      let assistantText = '';
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = new TextDecoder().decode(value);
          // Split by newlines, process lines starting with 'data: '
          chunk.split('\n').forEach(line => {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              try {
                const json = JSON.parse(data);
                const choices = json.choices || [];
                for (const choice of choices) {
                  const delta = choice.delta || {};
                  const content = delta.content;
                  if (content) {
                    assistantText += content;
                    setMessages(prev => {
                      // Update the last assistant message
                      const updated = [...prev];
                      for (let i = updated.length - 1; i >= 0; i--) {
                        if (updated[i].role === 'assistant') {
                          updated[i] = { ...updated[i], content: assistantText };
                          break;
                        }
                      }
                      return updated;
                    });
                  }
                }
              } catch {
                // Not JSON, ignore
              }
            }
          });
        }
      }
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
