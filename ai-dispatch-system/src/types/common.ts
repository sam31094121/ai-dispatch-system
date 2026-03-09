export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  error_code: string | null;
}

export interface ApiError extends Error {
  code?: string | null;
  responseMessage?: string;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface DateRangeQuery {
  dateFrom?: string;
  dateTo?: string;
}

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

export interface BaseTimestamps {
  createdAt: string;
  updatedAt?: string;
}
