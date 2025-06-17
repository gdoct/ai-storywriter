import React, { useEffect, useRef, useState } from 'react';
import { FaComment, FaTimes } from 'react-icons/fa';
import { AI_STATUS, useAIStatus } from '../../../contexts/AIStatusContext';
import { useAuthenticatedUser } from '../../../contexts/AuthenticatedUserContext';
import { createContextAwareChatPrompt } from '../../../services/llmPromptService';
import { streamChatCompletionWithStatus } from '../../../services/llmService';
import { getSelectedModel } from '../../../services/modelSelection';
import { llmCompletionRequestMessage } from '../../../types/LLMTypes';
import { Scenario } from '../../../types/ScenarioTypes';
import { Button } from './Button';
import './ChatAgent.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
}

interface ChatAgentProps {
  scenario: Scenario;
}

const DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant for creative writing.';

// Function to parse structured LLM response
const parseStructuredResponse = (responseText: string): { content: string; followUpQuestions: string[] } => {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(responseText);
    if (parsed.answer && Array.isArray(parsed.followUpQuestions)) {
      return {
        content: parsed.answer,
        followUpQuestions: parsed.followUpQuestions
      };
    }
  } catch (error) {
    // If JSON parsing fails, treat as plain text
  }
  
  // Fallback: treat as plain text response
  return {
    content: responseText,
    followUpQuestions: []
  };
};

// Function to extract just the answer from streaming JSON response
const extractAnswerFromPartialJson = (partialResponse: string): string => {
  try {
    // Try to parse as complete JSON first
    const parsed = JSON.parse(partialResponse);
    if (parsed.answer) {
      return parsed.answer;
    }
  } catch (error) {
    // If full JSON parsing fails, try to extract partial answer
    const answerMatch = partialResponse.match(/"answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/);
    if (answerMatch) {
      // Decode JSON escaped characters
      return answerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    }
  }
  
  // If we can't parse it as JSON, return the original text
  return partialResponse;
};

export const ChatAgent: React.FC<ChatAgentProps> = ({ scenario }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [panelSize, setPanelSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { aiStatus, setAiStatus, setShowAIBusyModal } = useAIStatus();
  const { refreshCredits } = useAuthenticatedUser();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isAIUnavailable = [AI_STATUS.BUSY, AI_STATUS.UNAVAILABLE, AI_STATUS.ERROR, AI_STATUS.LOADING].includes(aiStatus);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating || isAIUnavailable) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setIsGenerating(true);

    // Build chat history string from existing messages (excluding the current user message)
    const chatHistory = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

    // Prepare llmCompletionRequestMessage for LLM using context-aware prompt
    const promptObj: llmCompletionRequestMessage = scenario 
      ? createContextAwareChatPrompt(scenario, input, chatHistory)
      : {
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          userMessage: input
        };

    try {
      // Fetch user-selected model
      const model = getSelectedModel();
      let fullResponse = '';
      
      await streamChatCompletionWithStatus(
        promptObj,
        (assistantText, isDone) => {
          if (isDone) {
            fullResponse = assistantText;
          } else {
            fullResponse += assistantText;
          }
          
          // During streaming, extract and show just the answer content
          const displayText = extractAnswerFromPartialJson(fullResponse);
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { ...updated[i], content: displayText };
                break;
              }
            }
            return updated;
          });
          
          // When streaming is complete, parse the full structured response
          if (isDone) {
            const parsed = parseStructuredResponse(fullResponse);
            setMessages(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { 
                    ...updated[i], 
                    content: parsed.content,
                    followUpQuestions: parsed.followUpQuestions
                  };
                  break;
                }
              }
              return updated;
            });
          }
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
      // Refresh credits after chat completion with a small delay
      setTimeout(() => {
        refreshCredits();
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
    // Auto-send the follow-up question
    if (!isGenerating && !isAIUnavailable) {
      setTimeout(() => {
        const userMessage: Message = { role: 'user', content: question };
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
        setInput('');
        setIsGenerating(true);

        // Build chat history string from existing messages (excluding the current user message)
        const chatHistory = messages.map(msg => `${msg.role.toUpperCase()}: ${msg.content}`).join('\n');

        // Prepare llmCompletionRequestMessage for LLM using context-aware prompt
        const promptObj: llmCompletionRequestMessage = scenario 
          ? createContextAwareChatPrompt(scenario, question, chatHistory)
          : {
              systemMessage: DEFAULT_SYSTEM_MESSAGE,
              userMessage: question
            };

        (async () => {
          try {
            // Fetch user-selected model
            const model = getSelectedModel();
            let fullResponse = '';
            
            await streamChatCompletionWithStatus(
              promptObj,
              (assistantText, isDone) => {
                if (isDone) {
                  fullResponse = assistantText;
                } else {
                  fullResponse += assistantText;
                }
                
                // During streaming, extract and show just the answer content
                const displayText = extractAnswerFromPartialJson(fullResponse);
                setMessages(prev => {
                  const updated = [...prev];
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === 'assistant') {
                      updated[i] = { ...updated[i], content: displayText };
                      break;
                    }
                  }
                  return updated;
                });
                
                // When streaming is complete, parse the full structured response
                if (isDone) {
                  const parsed = parseStructuredResponse(fullResponse);
                  setMessages(prev => {
                    const updated = [...prev];
                    for (let i = updated.length - 1; i >= 0; i--) {
                      if (updated[i].role === 'assistant') {
                        updated[i] = { 
                          ...updated[i], 
                          content: parsed.content,
                          followUpQuestions: parsed.followUpQuestions
                        };
                        break;
                      }
                    }
                    return updated;
                  });
                }
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
            // Refresh credits after chat completion with a small delay
            setTimeout(() => {
              refreshCredits();
            }, 1000);
          }
        })();
      }, 100);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX; // Subtract because we're resizing from top-left
      const deltaY = startY - e.clientY;
      
      const newWidth = Math.max(320, Math.min(startWidth + deltaX, window.innerWidth - 4 * 16)); // 4rem = 64px
      const newHeight = Math.max(400, Math.min(startHeight + deltaY, window.innerHeight - 10 * 16)); // 10rem = 160px
      
      setPanelSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        className={`chat-agent-button ${isOpen ? 'chat-agent-button--active' : ''}`}
        onClick={handleToggle}
        title="Chat with AI Assistant"
      >
        <FaComment />
        {messages.length > 0 && (
          <span className="chat-agent-button__badge">{messages.length}</span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div 
          ref={panelRef}
          className="chat-agent-panel"
          style={{
            width: `${panelSize.width}px`,
            height: `${panelSize.height}px`
          }}
        >
          {/* Resize handle */}
          <div 
            className="chat-agent-resize-handle"
            onMouseDown={handleMouseDown}
            style={{ cursor: isResizing ? 'nw-resize' : 'nw-resize' }}
          />
          
          <div className="chat-agent-header">
            <div className="chat-agent-header__title">
              <FaComment />
              <span>AI Assistant</span>
            </div>
            <div className="chat-agent-header__actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                disabled={messages.length === 0}
              >
                Clear
              </Button>
              <button 
                className="chat-agent-close-btn"
                onClick={handleClose}
                title="Close chat"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="chat-agent-content">
            <div className="chat-agent-messages">
              {messages.length === 0 ? (
                <div className="chat-agent-welcome">
                  <h3>Welcome to the Context-Aware Chat Assistant!</h3>
                  <p>Ask questions about your current scenario, characters, or story elements. The AI knows all about your project!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`chat-agent-message chat-agent-message--${msg.role}`}>
                    <div className="chat-agent-message__content">{msg.content}</div>
                    {msg.role === 'assistant' && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                      <div className="chat-agent-followup-questions">
                        <div className="chat-agent-followup-questions__label">Follow-up questions:</div>
                        {msg.followUpQuestions.map((question, qIdx) => (
                          <button
                            key={qIdx}
                            className="chat-agent-followup-question"
                            onClick={() => handleFollowUpClick(question)}
                            disabled={isGenerating || isAIUnavailable}
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-agent-input-container">
              <textarea
                className="chat-agent-input"
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
              <Button
                variant="primary"
                onClick={handleSend}
                disabled={isGenerating || !input.trim() || isAIUnavailable}
                loading={isGenerating}
                className="chat-agent-send-btn"
              >
                {isGenerating ? 'Generating...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
