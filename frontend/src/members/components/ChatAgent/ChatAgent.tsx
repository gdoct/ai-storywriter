import { Button } from '@drdata/ai-styles';
import React, { useEffect, useRef, useState } from 'react';
import { FaComment, FaCopy, FaRedo, FaTimes } from 'react-icons/fa';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { streamAgentResponse, checkAgentHealth, AgentMessage, AgentRequest } from '../../../shared/services/agentService';
import { Scenario } from '../../../shared/types/ScenarioTypes';
import './ChatAgent.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  followUpQuestions?: string[];
  toolCalls?: any[];
  metadata?: any;
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

// Agent-based chat uses structured messages directly

export const ChatAgent: React.FC<ChatAgentProps> = ({ scenario, onScenarioUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatStatus, setChatStatus] = useState<CHAT_STATUS>(CHAT_STATUS.IDLE);
  const [panelSize, setPanelSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
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
    setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setLastUserMessage(input); // Store the last user message for regeneration
    setInput('');
    setIsGenerating(true);
    setChatStatus(CHAT_STATUS.GENERATING);

    try {
      // Create and store abort controller
      abortControllerRef.current = new AbortController();
      
      // Prepare agent request
      const agentRequest: AgentRequest = {
        message: input,
        scenario: scenario,
        stream: true
      };
      
      let currentContent = '';
      let toolCalls: any[] = [];

      const onAgentMessage = (message: AgentMessage) => {
        if (message.type === 'chat') {
          // Handle chat messages - display as chat bubbles
          console.log('Received chat message:', message.content, 'streaming:', message.metadata?.streaming);
          if (message.metadata?.streaming || message.streaming) {
            // For streaming messages, accumulate content
            console.log('Accumulating streaming chunk:', message.content);
            currentContent += message.content;
          } else {
            // For complete messages, replace content
            console.log('Setting complete message:', message.content);
            currentContent = message.content;
          }
          
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { 
                  ...updated[i], 
                  content: currentContent,
                  toolCalls: toolCalls,
                  followUpQuestions: message.metadata?.follow_up_questions
                };
                break;
              }
            }
            return updated;
          });
        } else if (message.type === 'status') {
          // Handle status messages - display as badges
          if (message.metadata?.error) {
            throw new Error(message.metadata.error);
          }
          
          // Handle follow-up questions without overwriting message content
          if (message.content === 'follow_up_questions' && message.metadata?.follow_up_questions) {
            setMessages(prev => {
              const updated = [...prev];
              for (let i = updated.length - 1; i >= 0; i--) {
                if (updated[i].role === 'assistant') {
                  updated[i] = { 
                    ...updated[i], 
                    // Keep existing content, just add follow-up questions
                    followUpQuestions: message.metadata.follow_up_questions
                  };
                  break;
                }
              }
              return updated;
            });
          } else {
            // Regular status update
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
          }
          
        } else if (message.type === 'tool_call') {
          // Handle tool calls (legacy support and client-side tools)
          if (message.metadata?.tool_call) {
            const toolCall = message.metadata.tool_call;
            toolCalls.push(toolCall);
            
            // Handle client-side tool calls
            if (toolCall.action === 'update_scenario' && onScenarioUpdate) {
              const updatedScenario = toolCall.parameters?.updated_scenario;
              if (updatedScenario) {
                // Update the scenario in the parent component
                onScenarioUpdate(updatedScenario);
              }
            } else if (toolCall.action === 'create_scenario' && onScenarioUpdate) {
              const newScenario = toolCall.parameters?.scenario;
              if (newScenario) {
                // Update the parent component with the newly created scenario
                onScenarioUpdate(newScenario);
              }
            }
          }
          
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

      await streamAgentResponse(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
    } catch (err) {
      // Check if the error is due to cancellation
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error message
        console.log('Agent request cancelled by user');
      } else {
        console.error('Agent error:', err);
        setChatStatus(CHAT_STATUS.ERROR);
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the agent service.' };
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

  const handleSuggestionClick = (suggestion: string) => {
    if (isGenerating || isChatUnavailable || isChatBusy) return;
    
    // Set the input and trigger send immediately
    setInput(suggestion);
    
    // Use setTimeout to ensure the input state is updated before sending
    setTimeout(() => {
      // Simulate the send action directly
      const sendSuggestion = async () => {
        const userMessage: Message = { role: 'user', content: suggestion };
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
        setLastUserMessage(suggestion);
        setInput(''); // Clear input
        setIsGenerating(true);
        setChatStatus(CHAT_STATUS.GENERATING);

        try {
          abortControllerRef.current = new AbortController();
          
          const agentRequest: AgentRequest = {
            message: suggestion,
            scenario: scenario,
            stream: true
          };
          
          let currentContent = '';
          let toolCalls: any[] = [];

          const onAgentMessage = (message: AgentMessage) => {
            if (message.type === 'chat') {
              if (message.metadata?.streaming || message.streaming) {
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
                      toolCalls: toolCalls,
                      followUpQuestions: message.metadata?.follow_up_questions
                    };
                    break;
                  }
                }
                return updated;
              });
            } else if (message.type === 'status') {
              if (message.metadata?.error) {
                throw new Error(message.metadata.error);
              }
              
              // Handle follow-up questions without overwriting message content
              if (message.content === 'follow_up_questions' && message.metadata?.follow_up_questions) {
                setMessages(prev => {
                  const updated = [...prev];
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === 'assistant') {
                      updated[i] = { 
                        ...updated[i], 
                        followUpQuestions: message.metadata.follow_up_questions
                      };
                      break;
                    }
                  }
                  return updated;
                });
              } else {
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
              }
            } else if (message.type === 'tool_call') {
              if (message.metadata?.tool_call) {
                const toolCall = message.metadata.tool_call;
                toolCalls.push(toolCall);
                
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

          await streamAgentResponse(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
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
                  updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the agent service.' };
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
      
      sendSuggestion();
    }, 10);
  };

  const handleFollowUpClick = (question: string) => {
    setInput(question);
    // Auto-send the follow-up question
    if (!isGenerating && !isChatUnavailable && !isChatBusy) {
      setTimeout(() => {
        // Store the question in input and trigger handleSend
        setInput(question);
        // Simulate the send action by calling handleSend with the question
        const sendFollowUp = async () => {
          const userMessage: Message = { role: 'user', content: question };
          setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
          setLastUserMessage(question);
          setInput('');
          setIsGenerating(true);
          setChatStatus(CHAT_STATUS.GENERATING);

          try {
            abortControllerRef.current = new AbortController();
            
            const agentRequest: AgentRequest = {
              message: question,
              scenario: scenario,
              stream: true
            };
            
            let currentContent = '';
            let toolCalls: any[] = [];

            const onAgentMessage = (message: AgentMessage) => {
              if (message.type === 'chat') {
                if (message.metadata?.streaming || message.streaming) {
                  // For streaming messages, accumulate content
                  currentContent += message.content;
                } else {
                  // For complete messages, replace content
                  currentContent = message.content;
                }
                
                setMessages(prev => {
                  const updated = [...prev];
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if (updated[i].role === 'assistant') {
                      updated[i] = { 
                        ...updated[i], 
                        content: currentContent,
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
                  }
                }
                
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

            await streamAgentResponse(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
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
                    updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the agent service.' };
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
        
        sendFollowUp();
      }, 100);
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

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here if desired
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
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

    try {
      // Create and store abort controller
      abortControllerRef.current = new AbortController();
      
      // Prepare agent request
      const agentRequest: AgentRequest = {
        message: lastUserMessage,
        scenario: scenario,
        stream: true
      };
      
      let currentContent = '';
      let toolCalls: any[] = [];

      const onAgentMessage = (message: AgentMessage) => {
        if (message.type === 'chat') {
          if (message.metadata?.streaming || message.streaming) {
            // For streaming messages, accumulate content
            currentContent += message.content;
          } else {
            // For complete messages, replace content
            currentContent = message.content;
          }
          
          setMessages(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].role === 'assistant') {
                updated[i] = { 
                  ...updated[i], 
                  content: currentContent,
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
            }
          }
          
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

      await streamAgentResponse(agentRequest, onAgentMessage, abortControllerRef.current?.signal);
    } catch (err) {
      // Check if the error is due to cancellation
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't show error message
        console.log('Agent request cancelled by user');
      } else {
        console.error('Agent error:', err);
        setChatStatus(CHAT_STATUS.ERROR);
        setMessages(prev => {
          const updated = [...prev];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { ...updated[i], content: 'Sorry, there was an error communicating with the agent service.' };
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
        title="Chat with AI Assistant (Real-time Streaming)"
      >
        <FaComment />
        <span className="chat-agent-streaming-indicator" title="Real-time streaming available">⚡</span>
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
                  <h3>Welcome to the AI Assistant!</h3>
                  <p>Ask questions about your scenario, characters, or story elements.</p>
                  
                  {/* Default suggestions */}
                  <div className="chat-agent-default-suggestions">
                    <div className="chat-agent-suggestions-label">Try these suggestions:</div>
                    <button
                      className="chat-agent-suggestion-btn"
                      onClick={() => handleSuggestionClick("Explain the main conflict in this scenario")}
                      disabled={isGenerating || isChatUnavailable || isChatBusy}
                    >
                      Explain the main conflict in this scenario
                    </button>
                    <button
                      className="chat-agent-suggestion-btn"
                      onClick={() => handleSuggestionClick("Add more depth to the main character")}
                      disabled={isGenerating || isChatUnavailable || isChatBusy}
                    >
                      Add more depth to the main character
                    </button>
                    <button
                      className="chat-agent-suggestion-btn"
                      onClick={() => handleSuggestionClick("Suggest plot twists for this story")}
                      disabled={isGenerating || isChatUnavailable || isChatBusy}
                    >
                      Suggest plot twists for this story
                    </button>
                    <button
                      className="chat-agent-suggestion-btn"
                      onClick={() => handleSuggestionClick("Create a new supporting character")}
                      disabled={isGenerating || isChatUnavailable || isChatBusy}
                    >
                      Create a new supporting character
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  // Only show follow-up questions for the last assistant message
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
                                    <strong>{toolCall.action || 'Action'}:</strong> {toolCall.status || 'pending'}
                                  </div>
                                ))}
                              </div>
                            </details>
                          </div>
                        )}
                        <div className="chat-agent-message__content">{msg.content}</div>
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
