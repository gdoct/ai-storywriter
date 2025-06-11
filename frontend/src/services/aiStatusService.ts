import { AI_STATUS } from '../contexts/AIStatusContext';

const BACKEND_URL = 'http://localhost:5000';
const STATUS_ENDPOINT = `${BACKEND_URL}/proxy/llm/v1/status`;

export async function fetchAIBackendStatus(): Promise<AI_STATUS> {
  try {
    const res = await fetch(STATUS_ENDPOINT, { method: 'GET' });
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
    return AI_STATUS.UNAVAILABLE;
  }
}
