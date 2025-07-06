import { Button } from '@drdata/ai-styles';
import React, { useEffect, useRef, useState } from 'react';
import { FaComment, FaRedo, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../contexts/AuthContext';
import { chatService, ChatStreamCallback } from '../../../services/chatService';
import { createContextAwareChatPrompt } from '../../../services/llmPromptService';
import { getSelectedModel } from '../../../services/modelSelection';
import { llmCompletionRequestMessage } from '../../../types/LLMTypes';
import { Scenario } from '../../../types/ScenarioTypes';
import './ChatAgent.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
}

interface ChatAgentProps {
  scenario: Scenario;
}

// Chat service status enum
enum CHAT_STATUS {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  GENERATING = 'generating',
  ERROR = 'error',
  UNAVAILABLE = 'unavailable'
}

const DEFAULT_SYSTEM_MESSAGE = 'You are a helpful assistant for creative writing.';

// Function to parse structured LLM response
const parseStructuredResponse = (responseText: string): { content: string; followUpQuestions: string[] } => {
  // First, try to strip markdown code block wrapper if present
  let cleanedText = responseText.trim();
  
  // Remove ```json and ``` wrapper if present
  if (cleanedText.startsWith('```json') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(7, -3).trim(); // Remove ```json from start and ``` from end
  } else if (cleanedText.startsWith('```') && cleanedText.endsWith('```')) {
    cleanedText = cleanedText.slice(3, -3).trim(); // Remove ``` from both ends
  }
  
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(cleanedText);
    
    // Check for different possible field names
    let content = '';
    let followUpQuestions: string[] = [];
    
    // Primary format from createContextAwareChatPrompt
    if (parsed.answer) {
      content = parsed.answer;
    } else if (parsed.content) {
      content = parsed.content;
    } else if (parsed.response) {
      content = parsed.response;
    } else if (typeof parsed === 'string') {
      content = parsed;
    }
    
    // Primary format from createContextAwareChatPrompt
    if (Array.isArray(parsed.followUpQuestions)) {
      followUpQuestions = parsed.followUpQuestions;
    } else if (Array.isArray(parsed.follow_up_questions)) {
      followUpQuestions = parsed.follow_up_questions;
    } else if (Array.isArray(parsed.followUp)) {
      followUpQuestions = parsed.followUp;
    } else if (Array.isArray(parsed.questions)) {
      followUpQuestions = parsed.questions;
    } else if (Array.isArray(parsed.suggestions)) {
      followUpQuestions = parsed.suggestions;
    }
    
    // If we successfully parsed JSON but didn't find expected fields,
    // use the extracted answer from the streaming parser as fallback
    if (!content) {
      content = extractAnswerFromPartialJson(cleanedText);
    }
    
    return {
      content: content || extractAnswerFromPartialJson(cleanedText) || 'No response content found',
      followUpQuestions
    };
  } catch (error) {
    // Log the full response when JSON parsing fails for debugging
    console.error('Failed to parse LLM response as JSON:', error);
    console.error('Full response text:', responseText);
    
    // If JSON parsing fails, try to extract the answer using the streaming parser
    const extractedContent = extractAnswerFromPartialJson(cleanedText);
    // Always use the extracted content, don't fall back to raw response
    return {
      content: extractedContent || 'Unable to parse response',
      followUpQuestions: []
    };
  }
};

// Function to extract just the answer from streaming JSON response
const extractAnswerFromPartialJson = (partialResponse: string): string => {
  try {
    // Try to parse as complete JSON first
    const parsed = JSON.parse(partialResponse);
    if (parsed.answer) {
      return parsed.answer;
    } else if (parsed.content) {
      return parsed.content;
    } else if (parsed.response) {
      return parsed.response;
    }
  } catch (error) {
    // If full JSON parsing fails, try to extract partial answer using regex
    // Try different field names - prioritize "answer" since that's what createContextAwareChatPrompt uses
    const patterns = [
      /"answer"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/,
      /"content"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/,
      /"response"\s*:\s*"([^"]*(?:\\.[^"]*)*)"?/
    ];
    
    for (const pattern of patterns) {
      const match = partialResponse.match(pattern);
      if (match) {
        // Decode JSON escaped characters
        return match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
      }
    }
  }
  
  // If we can't parse it as JSON, return empty string to avoid showing JSON
  return "";
};

export const ChatAgent: React.FC<ChatAgentProps> = ({ scenario }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatStatus, setChatStatus] = useState<CHAT_STATUS>(CHAT_STATUS.IDLE);
  const [panelSize, setPanelSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { refreshCredits } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check chat service availability on mount
  useEffect(() => {
    const checkChatService = async () => {
      try {
        const isAvailable = await chatService.isAvailable();
        if (!isAvailable) {
          setChatStatus(CHAT_STATUS.UNAVAILABLE);
        } else {
          setChatStatus(CHAT_STATUS.IDLE);
        }
      } catch (error) {
        console.error('Failed to check chat service:', error);
        setChatStatus(CHAT_STATUS.UNAVAILABLE);
      }
    };
    
    checkChatService();
  }, []);

  const isChatUnavailable = [CHAT_STATUS.UNAVAILABLE, CHAT_STATUS.ERROR].includes(chatStatus);
  const isChatBusy = [CHAT_STATUS.CONNECTING, CHAT_STATUS.GENERATING].includes(chatStatus);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isGenerating || isChatUnavailable || isChatBusy) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setLastUserMessage(input); // Store the last user message for regeneration
    setInput('');
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

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
      
      const onStream: ChatStreamCallback = (assistantText, isDone) => {
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
      };

      await chatService.streamChatCompletion(
        promptObj,
        onStream,
        { model: model || undefined, temperature: 0.8, max_tokens: 1024 }
      );
    } catch (err) {
      console.error('Chat error:', err);
      setChatStatus(CHAT_STATUS.ERROR);
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the chat service.' };
            break;
          }
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
      setChatStatus(CHAT_STATUS.IDLE);
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
    if (!isGenerating && !isChatUnavailable && !isChatBusy) {
      setTimeout(() => {
        const userMessage: Message = { role: 'user', content: question };
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
        setLastUserMessage(question); // Store the last user message for regeneration
        setInput('');
        setIsGenerating(true);
        setChatStatus(CHAT_STATUS.GENERATING);

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
            
            const onStream: ChatStreamCallback = (assistantText, isDone) => {
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
            };

            await chatService.streamChatCompletion(
              promptObj,
              onStream,
              { model: model || undefined, temperature: 0.8, max_tokens: 1024 }
            );
          } catch (err) {
            console.error('Chat error:', err);
            setChatStatus(CHAT_STATUS.ERROR);
            setMessages(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the chat service.' };
                  break;
                }
              }
              return updated;
            });
          } finally {
            setIsGenerating(false);
            setChatStatus(CHAT_STATUS.IDLE);
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
    setLastUserMessage('');
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

  const handleRefresh = async () => {
    if (!lastUserMessage || isGenerating || isChatUnavailable || isChatBusy) return;
    
    // Remove the last assistant message if it exists
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated.pop();
      }
      // Add a new empty assistant message
      updated.push({ role: 'assistant', content: '' });
      return updated;
    });
    
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

    // Build chat history string from existing messages (excluding the last assistant message)
    const chatHistory = messages
      .filter((msg, idx) => !(idx === messages.length - 1 && msg.role === 'assistant'))
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');

    // Prepare llmCompletionRequestMessage for LLM using context-aware prompt
    const promptObj: llmCompletionRequestMessage = scenario 
      ? createContextAwareChatPrompt(scenario, lastUserMessage, chatHistory)
      : {
          systemMessage: DEFAULT_SYSTEM_MESSAGE,
          userMessage: lastUserMessage
        };

    try {
      // Fetch user-selected model
      const model = getSelectedModel();
      let fullResponse = '';
      
      const onStream: ChatStreamCallback = (assistantText, isDone) => {
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
      };

      await chatService.streamChatCompletion(
        promptObj,
        onStream,
        { model: model || undefined, temperature: 0.8, max_tokens: 1024 }
      );
    } catch (err) {
      console.error('Chat error:', err);
      setChatStatus(CHAT_STATUS.ERROR);
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the chat service.' };
            break;
          }
        }
        return updated;
      });
    } finally {
      setIsGenerating(false);
      setChatStatus(CHAT_STATUS.IDLE);
      // Refresh credits after chat completion with a small delay
      setTimeout(() => {
        refreshCredits();
      }, 1000);
    }
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
                  <h3>Welcome to the Chat Assistant!</h3>
                  <p>Ask questions about your current scenario, characters, or story elements. The AI knows all about your project!</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // Only show follow-up questions for the last assistant message
                  const isLastAssistantMessage = msg.role === 'assistant' && 
                    idx === messages.length - 1 && 
                    !isGenerating;
                  
                  return (
                    <div key={idx} className={`chat-agent-message chat-agent-message--${msg.role}`}>
                      <div className="chat-agent-message__content">{msg.content}</div>
                      {isLastAssistantMessage && msg.followUpQuestions && msg.followUpQuestions.length > 0 && (
                        <div className="chat-agent-followup-questions">
                          <div className="chat-agent-followup-questions__label">Follow-up questions:</div>
                          {msg.followUpQuestions.map((question, qIdx) => (
                            <button
                              key={qIdx}
                              className="chat-agent-followup-question"
                              onClick={() => handleFollowUpClick(question)}
                              disabled={isGenerating || isChatUnavailable || isChatBusy}
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
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
                disabled={isGenerating || isChatUnavailable || isChatBusy}
                title={isChatUnavailable ?
                  chatStatus === CHAT_STATUS.UNAVAILABLE ? 'Chat service is unavailable.' :
                  chatStatus === CHAT_STATUS.ERROR ? 'Chat service error.' : ''
                  : isChatBusy ?
                  chatStatus === CHAT_STATUS.CONNECTING ? 'Connecting to chat service...' :
                  chatStatus === CHAT_STATUS.GENERATING ? 'Generating response...' : ''
                  : ''}
              />
              <div className="chat-agent-input-buttons">
                <Button
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={!lastUserMessage || isGenerating || isChatUnavailable || isChatBusy}
                  className="chat-agent-refresh-btn"
                >
                  <FaRedo />
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSend}
                  disabled={isGenerating || !input.trim() || isChatUnavailable || isChatBusy}
                  busy={isGenerating}
                  className="chat-agent-send-btn"
                >
                  {isGenerating ? 'Generating...' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
