/**
 * useLatest — 後端唯一真實來源 hook
 *
 * 行為規格：
 * 1. 啟動時立刻 fetch /api/v1/latest 整包資料
 * 2. 每 10 秒 poll /api/v1/latest/version
 * 3. 若 version 變動 → 整包刷新（不可局部更新）
 * 4. audit_ok = false → data 為 null，errorReason 有值
 * 5. 前端絕對不得自行排序、分組、計算成交率、產生公告
 */
import { useState, useEffect, useRef, useCallback } from 'react';

const BASE = 'http://localhost:3001';
const POLL_INTERVAL_MS = 10_000;

export interface LatestRanking {
  id: number;
  report_date: string;
  employee_name: string;
  normalized_name: string;
  total_followup_count: number;
  total_followup_amount: number;
  total_revenue_amount: number;
  total_actual_amount: number;
  total_cancel_amount: number;
  rank_no: number;
  ranking_rule_text: string;
  source_platform_data: string;
}

export interface LatestGroup {
  rank_no: number;
  employee_name: string;
  normalized_name: string;
  dispatch_group: string;
  group_order_no: number;
  suggestion_text: string;
  pressure_text: string;
  motivation_text: string;
}

export interface LatestAnnouncement {
  fullText: string;
  lineText: string;
  shortText: string;
  voiceText: string;
  managerText: string;
}

export interface LatestData {
  version: string;
  computedAt: string;
  reportDate: string;
  auditOk: true;
  sortRules: string;
  groupRules: string;
  rankings: LatestRanking[];
  groups: { A1: LatestGroup[]; A2: LatestGroup[]; B: LatestGroup[]; C: LatestGroup[] };
  announcement: LatestAnnouncement;
}

export interface LatestState {
  loading: boolean;
  data: LatestData | null;
  auditOk: boolean;
  errorReason: string | null;
  version: string | null;
  lastFetchedAt: string | null;
  refetch: () => void;
}

export function useLatest(): LatestState {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LatestData | null>(null);
  const [auditOk, setAuditOk] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [version, setVersion] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const knownVersion = useRef<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFull = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/v1/latest`);
      const json = await res.json();

      if (json.data?.auditOk === false) {
        // 審計失敗：只回傳錯誤原因，不顯示任何派單結果
        setData(null);
        setAuditOk(false);
        setErrorReason(json.data.errorReason ?? json.message ?? '審計失敗');
        setVersion(json.data.version ?? null);
        knownVersion.current = json.data.version ?? null;
      } else if (json.success && json.data) {
        setData(json.data as LatestData);
        setAuditOk(true);
        setErrorReason(null);
        setVersion(json.data.version);
        knownVersion.current = json.data.version;
      } else {
        // NOT_LATEST 或其他錯誤
        setData(null);
        setAuditOk(false);
        setErrorReason(json.message ?? '尚未產生派單結果');
      }
      setLastFetchedAt(new Date().toISOString());
    } catch {
      setErrorReason('無法連線到後端，請確認伺服器運作中');
    } finally {
      setLoading(false);
    }
  }, []);

  // 版本探針 — 只 poll version，有變化才整包刷新
  const pollVersion = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/api/v1/latest/version`);
      const json = await res.json();
      const newVersion = json.data?.version ?? null;
      if (newVersion && newVersion !== knownVersion.current) {
        await fetchFull();
      }
    } catch {
      // 靜默失敗，等下次 poll
    }
  }, [fetchFull]);

  useEffect(() => {
    fetchFull();
    pollTimer.current = setInterval(pollVersion, POLL_INTERVAL_MS);
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [fetchFull, pollVersion]);

  return { loading, data, auditOk, errorReason, version, lastFetchedAt, refetch: fetchFull };
}
