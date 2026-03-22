import { useState, useEffect, useCallback } from 'react';

export interface ModuleInfo {
  key: string;
  label: string;
  enabled: boolean;
  locked: boolean;
  description: string;
}

export interface SystemStatusData {
  engine: {
    running: boolean;
    startedAt: string | null;
    currentTime: string;
    timezone: string;
  };
  modules: ModuleInfo[];
  storage: {
    todayDir: boolean;
    latestFile: boolean;
    logFile: boolean;
    logSize: number;
    backupCount: number;
  };
  database: {
    todayReportCount: number;
    latestSnapshot: {
      version: string;
      reportDate: string;
      auditResult: string;
      computedAt: string;
    } | null;
  };
  alerts: string[];
}

export function useSystemStatus(pollInterval = 5000) {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/system/status');
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
        setError(null);
      } else {
        setError(json.message ?? '查詢失敗');
      }
    } catch (e: any) {
      setError('無法連線後端');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, pollInterval);
    return () => clearInterval(timer);
  }, [fetchStatus, pollInterval]);

  const boot = async () => {
    const res = await fetch('/api/v1/system/boot', { method: 'POST' });
    const json = await res.json();
    await fetchStatus();
    return json;
  };

  const stop = async () => {
    const res = await fetch('/api/v1/system/stop', { method: 'POST' });
    const json = await res.json();
    await fetchStatus();
    return json;
  };

  const repair = async () => {
    const res = await fetch('/api/v1/system/repair', { method: 'POST' });
    const json = await res.json();
    await fetchStatus();
    return json;
  };

  const toggleModule = async (moduleKey: string) => {
    const res = await fetch(`/api/v1/system/modules/${moduleKey}/toggle`, { method: 'POST' });
    const json = await res.json();
    await fetchStatus();
    return json;
  };

  return { status, loading, error, fetchStatus, boot, stop, repair, toggleModule };
}
