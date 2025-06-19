import { useEffect } from 'react';
import { useAIStatus } from '../contexts/AIStatusContext';

const DEFAULT_POLL_INTERVAL = 5000; // ms

export function useAIStatusPolling(interval: number = DEFAULT_POLL_INTERVAL) {
  const { setAiStatus } = useAIStatus();

  useEffect(() => {
    let isMounted = true;
    let timeout: NodeJS.Timeout;

    const poll = async () => {
      // const status = await fetchAIBackendStatus();
      // console.log('[AIStatusPolling] Polled AI status:', status); // debug
      // if (isMounted) setAiStatus(status);
      timeout = setTimeout(poll, interval);
    };
    poll();
    return () => {
      isMounted = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [interval, setAiStatus]);
}
