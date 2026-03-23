import { useState, useEffect, useCallback } from 'react';

export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface HeartbeatState {
  status: ConnectionStatus;
  latency: number;
  attempts: number;
  lastCheck: Date | null;
}

export const useHeartbeat = (intervalMs = 8000) => {
  const [state, setState] = useState<HeartbeatState>(({
    status: 'connected',
    latency: -1,
    attempts: 0,
    lastCheck: null,
  }));

  const checkHealth = useCallback(async () => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 4000); // 4秒超時

      const res = await fetch('/api/v1/health', { signal: controller.signal });
      clearTimeout(id);

      const endTime = performance.now();
      const latency = Math.round(endTime - startTime);

      if (res.ok) {
        setState({
          status: 'connected',
          latency,
          attempts: 0,
          lastCheck: new Date(),
        });
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      setState(prev => {
        const nextAttempts = prev.attempts + 1;
        // 連續三次失敗判定為斷線，否則為重連中
        const nextStatus = nextAttempts >= 3 ? 'disconnected' : 'reconnecting';
        return {
          status: nextStatus,
          latency: -1,
          attempts: nextAttempts,
          lastCheck: new Date(),
        };
      });
    }
  }, []);

  useEffect(() => {
    // 立即檢查一次
    checkHealth();

    // 建立定時器
    const timer = setInterval(() => {
      checkHealth();
    }, intervalMs);

    // 斷線時加快嘗試頻率 (指數退避或加速)
    let reconnectTimer: any;
    if (state.status !== 'connected') {
      reconnectTimer = setInterval(() => {
        checkHealth();
      }, 3000); // 斷線時每 3 秒重連
    }

    return () => {
      clearInterval(timer);
      if (reconnectTimer) clearInterval(reconnectTimer);
    };
  }, [checkHealth, intervalMs, state.status]);

  return {
    ...state,
    triggerManualCheck: checkHealth,
  };
};
