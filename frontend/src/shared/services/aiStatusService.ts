import { AI_STATUS } from '../contexts/AIStatusContext';
import { getToken } from './tokenUtils';

// Auto-detect if we're running in dev mode or production
const isDevMode = window.location.port === '3000';
const backendUrl = import.meta.env.VITE_API_URL;
const STATUS_ENDPOINT = isDevMode && backendUrl
  ? `${backendUrl}/api/proxy/llm/v1/status`
  : '/api/proxy/llm/v1/status';

export async function fetchAIBackendStatus(): Promise<AI_STATUS> {
  try {
    const headers: Record<string, string> = {};
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(STATUS_ENDPOINT, { 
      method: 'GET',
      headers
    });
    if (res.status === 200) {
      const data = await res.json();
      // Backend returns { busy: true/false }
      if (typeof data.busy === 'boolean') {
        return data.busy ? AI_STATUS.BUSY : AI_STATUS.IDLE;
      }
      // If response is malformed, treat as unavailable
      return AI_STATUS.UNAVAILABLE;
    } else if (res.status === 409) {
      return AI_STATUS.BUSY;
    } else {
      return AI_STATUS.UNAVAILABLE;
    }
  } catch (e) {
    console.error('Error fetching AI backend status:', e);
    return AI_STATUS.UNAVAILABLE;
  }
}
