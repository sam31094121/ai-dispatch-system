/**
 * useCopyText — 統一複製文字到剪貼簿
 *
 * 所有複製行為必須經過此 hook
 * 不允許元件自行呼叫 navigator.clipboard
 * 成功 / 失敗統一回傳 toast 訊息
 */
import { useState, useCallback } from 'react';

export interface UseCopyTextReturn {
  copy:      (text: string, label?: string) => void;
  toastMsg:  string | null;
  clearToast: () => void;
}

const TOAST_DURATION_MS = 2000;

export function useCopyText(): UseCopyTextReturn {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timerRef = { current: 0 };

  const copy = useCallback((text: string, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      clearTimeout(timerRef.current);
      setToastMsg(label ? `已複製 ${label}` : '已複製');
      timerRef.current = window.setTimeout(() => setToastMsg(null), TOAST_DURATION_MS);
    }).catch(() => {
      setToastMsg('複製失敗，請手動選取');
      timerRef.current = window.setTimeout(() => setToastMsg(null), TOAST_DURATION_MS);
    });
  }, []);

  const clearToast = useCallback(() => setToastMsg(null), []);

  return { copy, toastMsg, clearToast };
}
