import { create } from 'zustand';
import type { EngineParsedResult, ReportPlatform, ReportType } from '../types/report';
import { parseReportText, resetParserCounter } from '../engine/reportParser';
import { runAutoFix } from '../engine/autoFixEngine';

interface ReportState {
  currentParseResult: EngineParsedResult | null;
  setCurrentParseResult: (result: EngineParsedResult | null) => void;
  updateTotals: (totals: EngineParsedResult['totals']) => void;
  updateDetail: (id: string, detail: Partial<EngineParsedResult['details'][0]>) => void;
  inputForm: {
    date: string;
    platform: ReportPlatform;
    reportType: ReportType;
    rawText: string;
  };
  updateInputForm: (fields: Partial<ReportState['inputForm']>) => void;
  parseRawText: (text: string, platform: ReportPlatform, reportType: ReportType, date: string) => Promise<boolean>;
}

export const useReportStore = create<ReportState>((set) => ({
  currentParseResult: null,
  setCurrentParseResult: (result) => set({ currentParseResult: result }),

  updateTotals: (totals) => set((state) => ({
    currentParseResult: state.currentParseResult ? { ...state.currentParseResult, totals } : null
  })),

  updateDetail: (id, updatedDetail) => set((state) => ({
    currentParseResult: state.currentParseResult ? {
      ...state.currentParseResult,
      details: state.currentParseResult.details.map((d) => d.id === id ? { ...d, ...updatedDetail } : d)
    } : null
  })),

  inputForm: {
    date: new Date().toISOString().split('T')[0],
    platform: '整合',
    reportType: '累積',
    rawText: ''
  },

  updateInputForm: (fields) => set((state) => ({
    inputForm: { ...state.inputForm, ...fields }
  })),

  parseRawText: async (text, platform, reportType, date) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resetParserCounter();

        // ── 步驟 1：解析原始文字 ──
        const { details, totals } = parseReportText(text);

        if (details.length === 0) {
          resolve(false);
          return;
        }

        // ── 步驟 2：執行 A/B/C 衝突分級修正 ──
        const fixResult = runAutoFix(text, details, totals);

        set({
          currentParseResult: {
            date,
            platform,
            reportType,
            rawText: text,
            parsedAt: new Date().toISOString(),
            totals,
            details,
            autoFixRecords: fixResult.autoFixRecords,
            conflicts: fixResult.conflicts,
          }
        });
        resolve(true);
      }, 800);
    });
  }
}));
