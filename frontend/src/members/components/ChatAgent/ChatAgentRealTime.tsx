import { Button } from '@drdata/ai-styles';
import React, { useEffect, useRef, useState } from 'react';
import { FaComment, FaCopy, FaRedo, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { streamAgentResponseRealTime, checkAgentHealth, AgentMessage, AgentRequest } from '../../../shared/services/agentService';
import { Scenario } from '../../../shared/types/ScenarioTypes';
import './ChatAgent.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
  toolCalls?: any[];
  metadata?: any;
  isStreaming?: boolean; // Track if message is still being streamed
}

interface StatusUpdate {
  content: string;
  node?: string;
  timestamp: number;
}

interface ChatAgentProps {
  scenario: Scenario;
  onScenarioUpdate?: (updatedScenario: Scenario) => void;
}

// Chat service status enum
enum CHAT_STATUS {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  GENERATING = 'generating',
  ERROR = 'error',
  UNAVAILABLE = 'unavailable'
}

export const ChatAgentRealTime: React.FC<ChatAgentProps> = ({ scenario, onScenarioUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatStatus, setChatStatus] = useState<CHAT_STATUS>(CHAT_STATUS.IDLE);
  const [panelSize, setPanelSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [streamingFeatureAvailable, setStreamingFeatureAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { refreshCredits } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check agent service availability on mount
  useEffect(() => {
    const checkAgentService = async () => {
      try {
        const health = await checkAgentHealth();
        if (health.status === 'healthy') {
          setChatStatus(CHAT_STATUS.IDLE);
          // Check if real-time streaming is available
          setStreamingFeatureAvailable(health.features?.includes('real_time_streaming') || false);
        } else {
          setChatStatus(CHAT_STATUS.UNAVAILABLE);
        }
      } catch (error) {
        console.error('Failed to check agent service:', error);
        setChatStatus(CHAT_STATUS.UNAVAILABLE);
      }
    };
    
    checkAgentService();
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
    setMessages(prev => [...prev, userMessage, { 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    }]);
    setLastUserMessage(input);
    setInput('');
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

    try {
      // Create and store abort controller
      abortControllerRef.current = new AbortController();
      
      // Prepare agent request
      const agentRequest: AgentRequest = {
        message: input,
        scenario: scenario
      };
      
      let currentContent = '';
      let toolCalls: any[] = [];

      const onAgentMessage = (message: AgentMessage) => {
        if (message.type === 'chat') {
          // Handle real-time chat tokens
          if (message.metadata?.token || message.metadata?.streaming) {
            // Real-time token streaming - append immediately
            currentContent += message.content;
            
            setMessages(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { 
                    ...updated[i], 
                    content: currentContent,
                    isStreaming: true,
                    toolCalls: toolCalls,
                    followUpQuestions: message.metadata?.follow_up_questions
                  };
                  break;
                }
              }
              return updated;
            });
          } else {
            // Complete message or final chunk
            currentContent = message.content;
            
            setMessages(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { 
                    ...updated[i], 
                    content: currentContent,
                    isStreaming: false,
                    toolCalls: toolCalls,
                    followUpQuestions: message.metadata?.follow_up_questions
                  };
                  break;
                }
              }
              return updated;
            });
          }
        } else if (message.type === 'status') {
          // Handle status messages
          if (message.metadata?.error) {
            throw new Error(message.metadata.error);
          }
          
          setStatusUpdates(prev => [
            ...prev,
            {
              content: message.content,
              node: message.metadata?.node,
              timestamp: Date.now()
            }
          ]);
          
          // Auto-remove status updates after 5 seconds
          setTimeout(() => {
            setStatusUpdates(prev => prev.slice(1));
          }, 5000);
          
        } else if (message.type === 'tool_call') {
          // Handle tool calls
          if (message.metadata?.tool_call) {
            const toolCall = message.metadata.tool_call;
            toolCalls.push(toolCall);
            
            // Handle client-side tool calls
            if (toolCall.action === 'update_scenario' && onScenarioUpdate) {
              const updatedScenario = toolCall.parameters?.updated_scenario;
              if (updatedScenario) {
                onScenarioUpdate(updatedScenario);
              }
            } else if (toolCall.action === 'create_scenario' && onScenarioUpdate) {
              const newScenario = toolCall.parameters?.scenario;
              if (newScenario) {
                onScenarioUpdate(newScenario);
              }
            }
          }
          
          // Update messages with tool call info
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { 
                  ...updated[i], 
                  content: currentContent || message.content,
                  toolCalls: toolCalls,
                  followUpQuestions: message.metadata?.follow_up_questions
                };
                break;
              }
            }
            return updated;
          });
        }
      };

      // Use the real-time streaming function for better performance
      await streamAgentResponseRealTime(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
      
      // Mark final message as no longer streaming
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], isStreaming: false };
            break;
          }
        }
        return updated;
      });
      
    } catch (err) {
      // Check if the error is due to cancellation
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Agent request cancelled by user');
      } else {
        console.error('Agent error:', err);
        setChatStatus(CHAT_STATUS.ERROR);
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { 
                ...updated[i], 
                content: 'Sorry, there was an error communicating with the agent service.',
                isStreaming: false 
              };
              break;
            }
          }
          return updated;
        });
      }
    } finally {
      setIsGenerating(false);
      setChatStatus(CHAT_STATUS.IDLE);
      abortControllerRef.current = null;
      // Refresh credits after chat completion
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
    // Auto-send the follow-up question after a brief delay
    if (!isGenerating && !isChatUnavailable && !isChatBusy) {
      setTimeout(() => {
        handleSendFollowUp(question);
      }, 100);
    }
  };

  const handleSendFollowUp = async (question: string) => {
    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage, { 
      role: 'assistant', 
      content: '', 
      isStreaming: true 
    }]);
    setLastUserMessage(question);
    setInput('');
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

    try {
      abortControllerRef.current = new AbortController();
      
      const agentRequest: AgentRequest = {
        message: question,
        scenario: scenario
      };
      
      let currentContent = '';
      let toolCalls: any[] = [];

      const onAgentMessage = (message: AgentMessage) => {
        if (message.type === 'chat') {
          if (message.metadata?.token || message.metadata?.streaming) {
            currentContent += message.content;
          } else {
            currentContent = message.content;
          }
          
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { 
                  ...updated[i], 
                  content: currentContent,
                  isStreaming: message.metadata?.streaming || false,
                  toolCalls: toolCalls,
                  followUpQuestions: message.metadata?.follow_up_questions
                };
                break;
              }
            }
            return updated;
          });
        } else if (message.type === 'status') {
          setStatusUpdates(prev => [
            ...prev,
            {
              content: message.content,
              node: message.metadata?.node,
              timestamp: Date.now()
            }
          ]);
          
          setTimeout(() => {
            setStatusUpdates(prev => prev.slice(1));
          }, 5000);
          
        } else if (message.type === 'tool_call') {
          if (message.metadata?.tool_call) {
            const toolCall = message.metadata.tool_call;
            toolCalls.push(toolCall);
            
            // Handle client-side tool calls
            if (toolCall.action === 'update_scenario' && onScenarioUpdate) {
              const updatedScenario = toolCall.parameters?.updated_scenario;
              if (updatedScenario) {
                onScenarioUpdate(updatedScenario);
              }
            } else if (toolCall.action === 'create_scenario' && onScenarioUpdate) {
              const newScenario = toolCall.parameters?.scenario;
              if (newScenario) {
                onScenarioUpdate(newScenario);
              }
            }
          }
        }
      };

      await streamAgentResponseRealTime(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
      
      // Mark final message as no longer streaming
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], isStreaming: false };
            break;
          }
        }
        return updated;
      });
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Agent request cancelled by user');
      } else {
        console.error('Agent error:', err);
        setChatStatus(CHAT_STATUS.ERROR);
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { 
                ...updated[i], 
                content: 'Sorry, there was an error communicating with the agent service.',
                isStreaming: false 
              };
              break;
            }
          }
          return updated;
        });
      }
    } finally {
      setIsGenerating(false);
      setChatStatus(CHAT_STATUS.IDLE);
      abortControllerRef.current = null;
      setTimeout(() => {
        refreshCredits();
      }, 1000);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setLastUserMessage('');
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setIsGenerating(false);
    setChatStatus(CHAT_STATUS.IDLE);
    
    // Remove the last empty assistant message if it exists
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant' && !updated[updated.length - 1].content) {
        updated.pop();
      }
      return updated;
    });
  };

  // Resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = panelSize.width;
    const startHeight = panelSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;
      
      const newWidth = Math.max(320, Math.min(startWidth + deltaX, window.innerWidth - 4 * 16));
      const newHeight = Math.max(400, Math.min(startHeight + deltaY, window.innerHeight - 10 * 16));
      
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

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleRefresh = async () => {
    if (!lastUserMessage || isGenerating || isChatUnavailable || isChatBusy) return;
    
    // Remove the last assistant message and add a new streaming one
    setMessages(prev => {
      const updated = [...prev];
      if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
        updated.pop();
      }
      updated.push({ role: 'assistant', content: '', isStreaming: true });
      return updated;
    });
    
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

    try {
      abortControllerRef.current = new AbortController();
      
      const agentRequest: AgentRequest = {
        message: lastUserMessage,
        scenario: scenario
      };
      
      let currentContent = '';
      let toolCalls: any[] = [];

      const onAgentMessage = (message: AgentMessage) => {
        if (message.type === 'chat') {
          if (message.metadata?.token || message.metadata?.streaming) {
            currentContent += message.content;
          } else {
            currentContent = message.content;
          }
          
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { 
                  ...updated[i], 
                  content: currentContent,
                  isStreaming: message.metadata?.streaming || false,
                  toolCalls: toolCalls,
                  followUpQuestions: message.metadata?.follow_up_questions
                };
                break;
              }
            }
            return updated;
          });
        } else if (message.type === 'status') {
          setStatusUpdates(prev => [
            ...prev,
            {
              content: message.content,
              node: message.metadata?.node,
              timestamp: Date.now()
            }
          ]);
          
          setTimeout(() => {
            setStatusUpdates(prev => prev.slice(1));
          }, 5000);
          
        } else if (message.type === 'tool_call') {
          if (message.metadata?.tool_call) {
            const toolCall = message.metadata.tool_call;
            toolCalls.push(toolCall);
            
            // Handle client-side tool calls
            if (toolCall.action === 'update_scenario' && onScenarioUpdate) {
              const updatedScenario = toolCall.parameters?.updated_scenario;
              if (updatedScenario) {
                onScenarioUpdate(updatedScenario);
              }
            } else if (toolCall.action === 'create_scenario' && onScenarioUpdate) {
              const newScenario = toolCall.parameters?.scenario;
              if (newScenario) {
                onScenarioUpdate(newScenario);
              }
            }
          }
        }
      };

      await streamAgentResponseRealTime(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
      
      // Mark final message as no longer streaming
      setMessages(prev => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === 'assistant') {
            updated[i] = { ...updated[i], isStreaming: false };
            break;
          }
        }
        return updated;
      });
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Agent request cancelled by user');
      } else {
        console.error('Agent error:', err);
        setChatStatus(CHAT_STATUS.ERROR);
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { 
                ...updated[i], 
                content: 'Sorry, there was an error communicating with the agent service.',
                isStreaming: false 
              };
              break;
            }
          }
          return updated;
        });
      }
    } finally {
      setIsGenerating(false);
      setChatStatus(CHAT_STATUS.IDLE);
      abortControllerRef.current = null;
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
        title={streamingFeatureAvailable ? "Chat with AI Assistant (Real-time Streaming)" : "Chat with AI Assistant"}
      >
        <FaComment />
        {streamingFeatureAvailable && (
          <span className="chat-agent-streaming-indicator" title="Real-time streaming available">⚡</span>
        )}
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
              {streamingFeatureAvailable && (
                <span className="chat-agent-realtime-badge" title="Real-time streaming enabled">
                  ⚡ Real-time
                </span>
              )}
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
            {/* Status Updates */}
            {statusUpdates.length > 0 && (
              <div className="chat-agent-status-container">
                {statusUpdates.map((status, idx) => (
                  <div key={idx} className="chat-agent-status-badge">
                    <span className="chat-agent-status-content">{status.content}</span>
                    {status.node && (
                      <span className="chat-agent-status-node">({status.node})</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            <div className="chat-agent-messages">
              {messages.length === 0 ? (
                <div className="chat-agent-welcome">
                  <h3>Welcome to the Real-Time AI Assistant!</h3>
                  <p>Ask questions about your scenario, characters, or story elements. The AI streams responses in real-time for a smooth conversational experience!</p>
                  {streamingFeatureAvailable && (
                    <div className="chat-agent-feature-highlight">
                      <span>⚡</span> Real-time streaming active - responses appear as they're generated!
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isLastAssistantMessage = msg.role === 'assistant' && 
                    idx === messages.length - 1 && 
                    !isGenerating;
                  
                  return (
                    <div key={idx} className={`chat-agent-message chat-agent-message--${msg.role}`}>
                      <div className="chat-agent-message__header">
                        {msg.role === 'assistant' && msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="chat-agent-tool-calls">
                            <details>
                              <summary style={{cursor: 'pointer', color: '#666', fontStyle: 'italic', marginBottom: '8px'}}>
                                🔧 Tool Actions ({msg.toolCalls.length})
                              </summary>
                              <div style={{
                                background: '#f5f5f5', 
                                padding: '8px', 
                                borderRadius: '4px', 
                                fontSize: '0.9em',
                                color: '#666',
                                marginBottom: '8px'
                              }}>
                                {msg.toolCalls.map((toolCall, tcIdx) => (
                                  <div key={tcIdx} style={{ marginBottom: '4px' }}>
                                    <strong>{toolCall.action || 'Action'}:</strong> {toolCall.status || 'completed'}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                        <div className={`chat-agent-message__content ${msg.isStreaming ? 'streaming' : ''}`}>
                          {msg.content}
                          {msg.isStreaming && <span className="streaming-cursor">|</span>}
                        </div>
                        {msg.role === 'assistant' && msg.content && (
                          <button
                            className="chat-agent-copy-btn"
                            onClick={() => handleCopyToClipboard(msg.content)}
                            title="Copy to clipboard"
                          >
                            <FaCopy />
                          </button>
                        )}
                      </div>
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
                {isGenerating ? (
                  <Button
                    variant="secondary"
                    onClick={handleCancelGeneration}
                    className="chat-agent-cancel-btn"
                  >
                    <FaTimes /> Cancel
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={handleSend}
                    disabled={!input.trim() || isChatUnavailable || isChatBusy}
                    className="chat-agent-send-btn"
                  >
                    Send
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAgentRealTime;