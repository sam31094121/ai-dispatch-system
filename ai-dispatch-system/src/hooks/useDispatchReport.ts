/**
 * useDispatchReport — 派單報表資料主 hook
 *
 * 唯一資料來源：fetchLatestStructuredReport()
 * 狀態：loading → success(data) | success(empty) | error
 * 10 秒 poll version，有變化才整包重刷
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import type { DispatchReportPayload } from '../types/dispatchReport';
import { fetchLatestStructuredReport, fetchStructuredReport } from '../services/dispatchReportApi';

export type ReportState =
  | { status: 'loading' }
  | { status: 'success'; data: DispatchReportPayload }
  | { status: 'empty' }
  | { status: 'error'; message: string };

export interface UseDispatchReportReturn {
  state:    ReportState;
  refetch:  () => Promise<void>;
  lastFetchedAt: string | null;
}

const POLL_MS = 10_000;

export function useDispatchReport(): UseDispatchReportReturn {
  const [state, setState]       = useState<ReportState>({ status: 'loading' });
  const [lastFetchedAt, setLast] = useState<string | null>(null);
  const lastDate = useRef<string | null>(null);

  const fetchFull = useCallback(async () => {
    setState({ status: 'loading' });
    const result = await fetchLatestStructuredReport();
    if (result.ok) {
      lastDate.current = result.data.reportMeta.date;
      setState({ status: 'success', data: result.data });
    } else if (result.errorCode === 'NO_RANKING' || result.errorCode === 'NOT_GENERATED') {
      setState({ status: 'empty' });
    } else {
      setState({ status: 'error', message: result.message });
    }
    setLast(new Date().toISOString());
  }, []);

  // Version poll — only re-fetch if date changed
  const pollVersion = useCallback(async () => {
    if (!lastDate.current) return;
    try {
      const res  = await fetch('/api/v1/latest/version');
      const json = await res.json();
      const newDate: string | undefined = json.data?.reportDate ?? json.data?.report_date;
      if (newDate && newDate !== lastDate.current) {
        const result = await fetchStructuredReport(newDate);
        if (result.ok) {
          lastDate.current = newDate;
          setState({ status: 'success', data: result.data });
          setLast(new Date().toISOString());
        }
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchFull();
    const t = setInterval(pollVersion, POLL_MS);
    return () => clearInterval(t);
  }, [fetchFull, pollVersion]);

  return { state, refetch: fetchFull, lastFetchedAt };
}
