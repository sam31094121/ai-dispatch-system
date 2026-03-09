import type { ApiResponse, ApiError } from '../types/common';
import { buildQueryString } from './utils';

export interface HttpClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  defaultHeaders?: Record<string, string>;
}

class HttpClient {
  private baseUrl: string;
  private getToken?: () => string | null;
  private defaultHeaders: Record<string, string>;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.getToken = options.getToken;
    this.defaultHeaders = options.defaultHeaders ?? {};
  }

  private buildHeaders(extraHeaders?: HeadersInit): HeadersInit {
    const token = this.getToken?.();

    return {
      'Content-Type': 'application/json',
      ...this.defaultHeaders,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders as Record<string, string>),
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: ApiError = new Error(data.message || response.statusText);
      error.code = data.errorCode || String(response.status);
      error.responseMessage = data.message;
      throw error;
    }

    return data as T;
  }

  public async get<T>(url: string, params?: Record<string, unknown>, extraHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    const queryString = params ? buildQueryString(params) : '';
    const response = await fetch(`${this.baseUrl}${url}${queryString}`, {
      method: 'GET',
      headers: this.buildHeaders(extraHeaders),
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  public async post<T>(url: string, body?: unknown, extraHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'POST',
      headers: this.buildHeaders(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  public async put<T>(url: string, body?: unknown, extraHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'PUT',
      headers: this.buildHeaders(extraHeaders),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }

  public async delete<T>(url: string, extraHeaders?: HeadersInit): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: 'DELETE',
      headers: this.buildHeaders(extraHeaders),
    });
    return this.handleResponse<ApiResponse<T>>(response);
  }
}

export const apiClient = new HttpClient({
  baseUrl: '/api/v1',
  getToken: () => localStorage.getItem('token'),
});

export default apiClient;
