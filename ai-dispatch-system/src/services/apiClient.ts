// ═══════════════════════════════════════════════════════
// API Client：封裝 fetch，自動轉換 snake ↔ camel
// ═══════════════════════════════════════════════════════

import { snakeToCamel, camelToSnake } from './mapper';
import type { ApiEnvelope } from '../types/api';

const BASE_URL = '/api/v1';

/** 通用 API 回傳（已將 data 轉為前端 camelCase） */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode: string | null;
}

/** 將 API 信封轉換為前端用的回傳格式 */
function transformEnvelope<TApi, TFront>(envelope: ApiEnvelope<TApi>): ApiResponse<TFront> {
  return {
    success: envelope.success,
    message: envelope.message,
    data: snakeToCamel<TFront>(envelope.data),
    errorCode: envelope.error_code,
  };
}

/** GET 請求 — 回傳自動 snake → camel */
export async function apiGet<TFront>(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResponse<TFront>> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  const res = await fetch(url.toString());
  const envelope: ApiEnvelope<unknown> = await res.json();
  return transformEnvelope<unknown, TFront>(envelope);
}

/** POST 請求 — body 自動 camel → snake，回傳自動 snake → camel */
export async function apiPost<TFront>(
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse<TFront>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(camelToSnake(body)) : undefined,
  });
  const envelope: ApiEnvelope<unknown> = await res.json();
  return transformEnvelope<unknown, TFront>(envelope);
}

/** PUT 請求 — body 自動 camel → snake，回傳自動 snake → camel */
export async function apiPut<TFront>(
  path: string,
  body?: Record<string, unknown>,
): Promise<ApiResponse<TFront>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(camelToSnake(body)) : undefined,
  });
  const envelope: ApiEnvelope<unknown> = await res.json();
  return transformEnvelope<unknown, TFront>(envelope);
}

/** DELETE 請求 — 回傳自動 snake → camel */
export async function apiDelete<TFront>(
  path: string,
): Promise<ApiResponse<TFront>> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  const envelope: ApiEnvelope<unknown> = await res.json();
  return transformEnvelope<unknown, TFront>(envelope);
}
