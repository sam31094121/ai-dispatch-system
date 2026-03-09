import type { 平台名稱, 報表模式, 身分標記 } from '../constants/dictionaries';

export interface DailyReportInputForm {
  reportDate: string;
  platformName: 平台名稱 | '';
  reportMode: 報表模式 | '';
  rawTextContent: string;
  noteText: string;
}

export interface TotalsForm {
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  changeReason: string;
}

export interface DetailForm {
  id: number;
  employeeName: string;
  normalizedName: string;
  identityTag: 身分標記;
  totalCalls: number;
  assignedDealsCount: number;
  followupDealsCount: number;
  closingRatePercent: number | null;
  followupAmount: number;
  cancelledReturnAmount: number;
  totalRevenueAmount: number;
  isManuallyConfirmed: boolean;
  changeReason: string;
}
