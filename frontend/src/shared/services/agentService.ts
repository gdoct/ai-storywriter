import axios from './http';
import { getToken } from './tokenUtils';
import { Scenario } from '../types/ScenarioTypes';

export interface AgentMessage {
  type: 'chat' | 'status' | 'tool_call' | 'tool_result';
  content: string;
  // New envelope format fields
  node?: string;
  streaming?: boolean;
  // Tool result fields (for tool_result type)
  action?: string;
  scenario?: any;
  updated_scenario?: any;
  // Legacy metadata format (for backward compatibility)
  metadata?: {
    node?: string;
    final?: boolean;
    tool_call?: any;
    status?: string;
    error?: string;
    tool_result?: boolean;
    follow_up_questions?: string[];
    streaming?: boolean;
  };
}

export interface AgentRequest {
  message: string;
  scenario?: Scenario | null;
  stream?: boolean;
}


export type AgentStreamCallback = (message: AgentMessage) => void;

/**
 * Stream responses from the agent endpoint using Server-Sent Events
 * Uses the new real-time streaming endpoint for better performance
 */
export async function streamAgentResponse(
  request: AgentRequest,
  onMessage: AgentStreamCallback,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/streaming_agent/scenario/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        message: request.message,
        scenario: request.scenario
      }),
      signal: abortSignal
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Agent request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.substring(6); // Remove 'data: '
              const message: AgentMessage = JSON.parse(jsonStr);
              onMessage(message);
              
              // If this is a completion or error status, we can break
              if (message.type === 'status' && 
                  (message.metadata?.status === 'completed' || message.metadata?.error)) {
                return;
              }
            } catch (parseError) {
              console.error('Failed to parse agent message:', parseError, trimmedLine);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Agent request aborted by user');
      return;
    }
    console.error('Agent streaming error:', error);
    throw error;
  }
}


/**
 * Stream responses from the new real-time streaming agent endpoint
 * Provides token-by-token streaming without buffering
 */
export async function streamAgentResponseRealTime(
  request: AgentRequest,
  onMessage: AgentStreamCallback,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch('/api/streaming_agent/scenario/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        message: request.message,
        scenario: request.scenario
      }),
      signal: abortSignal
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Streaming agent request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.substring(6);
              const message: AgentMessage = JSON.parse(jsonStr);
              onMessage(message);
              
              // Check for completion
              if (message.type === 'status' && 
                  (message.metadata?.status === 'completed' || message.metadata?.error)) {
                return;
              }
            } catch (parseError) {
              console.error('Failed to parse streaming message:', parseError, trimmedLine);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Real-time streaming request aborted by user');
      return;
    }
    console.error('Real-time streaming error:', error);
    throw error;
  }
}

/**
 * Check if the agent service is available
 */
export async function checkAgentHealth(): Promise<{ status: string; agent?: string; features?: string[]; error?: string }> {
  try {
    const streamingResponse = await axios.get('/api/streaming_agent/scenario/stream/health');
    return streamingResponse.data;
  } catch (error) {
    console.error('Agent health check failed:', error);
    return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}