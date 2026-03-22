/**
 * dispatchReportApi.ts — 派單報表 API 層
 *
 * 所有 /announcements 相關請求集中於此
 * 前端不得直接 fetch，只呼叫此模組的函式
 */

import type { DispatchReportPayload, ApiEnvelope } from '../types/dispatchReport';

const BASE = '/api/v1';

type ApiResult<T> =
  | { ok: true;  data: T }
  | { ok: false; message: string; errorCode: string | null };

async function call<T>(url: string, options?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res      = await fetch(url, options);
    const envelope: ApiEnvelope<T> = await res.json();
    if (envelope.success && envelope.data !== null) {
      return { ok: true, data: envelope.data };
    }
    return { ok: false, message: envelope.message, errorCode: envelope.error_code };
  } catch (e) {
    return { ok: false, message: '網路錯誤，無法連線到後端', errorCode: 'NETWORK_ERROR' };
  }
}

/**
 * 取得指定日期的結構化派單報表
 * GET /api/v1/announcements/:date/structured
 */
export async function fetchStructuredReport(date: string): Promise<ApiResult<DispatchReportPayload>> {
  return call<DispatchReportPayload>(`${BASE}/announcements/${date}/structured`);
}

/**
 * 取得最新結構化派單報表（從 latest endpoint 組裝）
 * GET /api/v1/latest — 再從 reportDate 呼叫 /structured
 */
export async function fetchLatestStructuredReport(): Promise<ApiResult<DispatchReportPayload>> {
  // 先取 latest 得到 reportDate
  const latestRes = await call<{ reportDate?: string; report_date?: string }>(`${BASE}/latest`);
  if (!latestRes.ok) return latestRes;

  const date = latestRes.data.reportDate ?? latestRes.data.report_date;
  if (!date) return { ok: false, message: '無法取得最新報表日期', errorCode: 'NO_DATE' };

  return fetchStructuredReport(date);
}
