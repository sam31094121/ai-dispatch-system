import type { 派單分組 } from '../constants/options';

export interface DispatchItem {
  id?: number;
  reportDate?: string;
  employeeName: string;
  normalizedName?: string;
  rankNo: number;
  dispatchGroup?: 派單分組;
  groupOrderNo: number;
  suggestionText: string | null;
  pressureText: string | null;
  motivationText: string | null;
  createdAt?: string;
}

export interface DispatchGeneratePayload {
  reportDate: string;
}

export interface DispatchGroupMap {
  A1: DispatchItem[];
  A2: DispatchItem[];
  B: DispatchItem[];
  C: DispatchItem[];
}

export interface DispatchGenerateResult {
  reportDate: string;
  groups: DispatchGroupMap;
}
