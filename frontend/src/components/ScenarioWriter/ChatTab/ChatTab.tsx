import React, { useEffect, useRef, useState } from 'react';
import { AI_STATUS, useAIStatus } from '../../../contexts/AIStatusContext';
import { createContextAwareChatPrompt } from '../../../services/llmPromptService';
import { streamChatCompletionWithStatus } from '../../../services/llmService';
import { getSelectedModel } from '../../../services/modelSelection';
import { llmCompletionRequestMessage } from '../../../types/LLMTypes';
import { TabProps } from '../common/TabInterface';
import '../common/TabStylesNew.css';
import './ChatTab.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant for creative writing.';

const ChatTab: React.FC<TabProps> = ({ currentScenario }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { aiStatus, setAiStatus, setShowAIBusyModal } = useAIStatus();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAIUnavailable = [AI_STATUS.BUSY, AI_STATUS.UNAVAILABLE, AI_STATUS.ERROR, AI_STATUS.LOADING].includes(aiStatus);

  const handleSend = async () => {
    if (!input.trim() || isGenerating || isAIUnavailable) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsGenerating(true);

    // Build chat history string from existing messages (excluding the current user message)
    const chatHistory = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

    // Prepare llmCompletionRequestMessage for LLM using context-aware prompt
    const promptObj: llmCompletionRequestMessage = currentScenario 
      ? createContextAwareChatPrompt(currentScenario, input, chatHistory)
      : {
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          userMessage: input
        };

    try {
      // Fetch user-selected model
      const model = getSelectedModel();
      await streamChatCompletionWithStatus(
        promptObj,
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
        { model: model || undefined, temperature: 0.8, max_tokens: 1024 },
        setAiStatus,
        setShowAIBusyModal
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
        Chat with an AI assistant about your current scenario. The assistant has full context of your story, characters, and writing style.
      </p>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <h3>Welcome to the Context-Aware Chat Assistant!</h3>
              <p>Ask questions about your current scenario, characters, or story elements. The AI knows all about your project!</p>
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
            disabled={isGenerating || isAIUnavailable}
            title={isAIUnavailable ?
              aiStatus === AI_STATUS.BUSY ? 'AI is busy. Please wait.' :
              aiStatus === AI_STATUS.UNAVAILABLE ? 'AI is unavailable.' :
              aiStatus === AI_STATUS.ERROR ? 'AI error.' :
              aiStatus === AI_STATUS.LOADING ? 'Checking AI status...' : ''
              : ''}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={isGenerating || !input.trim() || isAIUnavailable}
            title={isAIUnavailable ?
              aiStatus === AI_STATUS.BUSY ? 'AI is busy. Please wait.' :
              aiStatus === AI_STATUS.UNAVAILABLE ? 'AI is unavailable.' :
              aiStatus === AI_STATUS.ERROR ? 'AI error.' :
              aiStatus === AI_STATUS.LOADING ? 'Checking AI status...' : ''
              : ''}
          >
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
