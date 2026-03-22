import type { ApiResponse } from '../types';

export class ApiClient {
  static async get<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const resp = await fetch(url);
      const json = await resp.json();
      return {
        success: resp.ok,
        message: json.message || (resp.ok ? '成功' : '請求失敗'),
        data: json.data !== undefined ? json.data : json
      };
    } catch (e: any) {
      return { success: false, message: e.message, data: null as any };
    }
  }

  static async post<T>(url: string, body: any): Promise<ApiResponse<T>> {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await resp.json();
      return {
        success: resp.ok,
        message: json.message || (resp.ok ? '成功' : '請求失敗'),
        data: json.data !== undefined ? json.data : json
      };
    } catch (e: any) {
      return { success: false, message: e.message, data: null as any };
    }
  }
}
