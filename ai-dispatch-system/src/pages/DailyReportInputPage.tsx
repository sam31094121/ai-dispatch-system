// ════════════════════════════════════════════════════
// 每日業績樞紐 V2 — 貼文字 or 貼截圖，AI 全自動解析
// 帝王能量聚財配色系統
// ════════════════════════════════════════════════════
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 平台選項, 報表模式選項 } from '../constants/dictionaries';
import type { DailyReportInputForm } from '../types/forms';
import { reportService } from '../services/report.service';
import { geminiService } from '../services/gemini.service';
import { useReportStore } from '../data/reportStore';
import { StatusBadge } from '../components/StatusBadge';
import { EMPEROR_UI, TU, MU, HUO, SHUI } from '../constants/wuxingColors';

interface DailyReportInputPageProps {
  onParsed?: (payload: { reportId: number; reportDate: string }) => void;
}

// ── 帝王配色輸入框樣式 ──
const inputBase: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${EMPEROR_UI.borderAccent}`,
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
  background: EMPEROR_UI.pageBg,
  color: EMPEROR_UI.textSecondary,
  transition: 'border-color 0.2s',
  fontFamily: '"Microsoft JhengHei", system-ui, sans-serif',
};

const inputAutoFill: React.CSSProperties = {
  ...inputBase,
  border: `1.5px solid ${MU.bright}`,
  background: MU.abyss,
  color: MU.text,
};

const fieldLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  color: EMPEROR_UI.textMuted,
  marginBottom: 5,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  letterSpacing: '0.08em',
};

const initialForm: DailyReportInputForm = {
  reportDate: '', platformName: '', reportMode: '', rawTextContent: '', noteText: '',
};

const AUTO_SECS = 5;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DailyReportInputPage({ onParsed }: DailyReportInputPageProps): React.ReactElement {
  const [form, setForm] = useState<DailyReportInputForm>(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<number | null>(null);

  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState('');
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [pastedImage, setPastedImage] = useState<string | null>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const cdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isValid = useMemo(() =>
    Boolean(form.reportDate && form.platformName && form.reportMode && form.rawTextContent.trim().length > 10),
    [form]
  );

  function set<K extends keyof DailyReportInputForm>(key: K, val: DailyReportInputForm[K], manual = true) {
    setForm(prev => ({ ...prev, [key]: val }));
    if (manual) setAutoFilled(prev => { const n = new Set(prev); n.delete(key); return n; });
  }

  function applyMeta(meta: { reportDate: string; platformName: string; reportMode: string }) {
    const filled: string[] = [];
    setForm(prev => {
      const n = { ...prev };
      if (meta.reportDate && !prev.reportDate) { n.reportDate = meta.reportDate; filled.push('reportDate'); }
      if (meta.platformName && !prev.platformName) { n.platformName = meta.platformName as any; filled.push('platformName'); }
      if (meta.reportMode && !prev.reportMode) { n.reportMode = meta.reportMode as any; filled.push('reportMode'); }
      return n;
    });
    if (filled.length) {
      setAutoFilled(prev => { const n = new Set(prev); filled.forEach(f => n.add(f)); return n; });
      const names: Record<string, string> = { reportDate: '日期', platformName: '平台', reportMode: '模式' };
      setDetectMsg(`✨ AI 填入：${filled.map(f => names[f]).join('、')}`);
    } else {
      setDetectMsg('欄位已填妥');
    }
  }

  const handleImagePaste = useCallback(async (file: File) => {
    const dataUrl = URL.createObjectURL(file);
    setPastedImage(dataUrl);
    setDetecting(true);
    setDetectMsg('🤖 Gemini Vision 辨識截圖中…');
    try {
      const mimeType = file.type as 'image/png' | 'image/jpeg' | 'image/webp';
      const base64 = await fileToBase64(file);
      const result = await geminiService.extractFromImage(base64, mimeType);
      if (result.rawText) setForm(prev => ({ ...prev, rawTextContent: result.rawText }));
      applyMeta(result.meta);
      setDetectMsg(
        result.source === 'gemini-vision'
          ? `📋 截圖辨識完成 · 擷取 ${result.rawText.length} 字`
          : '截圖辨識失敗，請手動填寫'
      );
    } catch {
      setDetectMsg('截圖辨識失敗，請確認 API 金鑰');
    } finally {
      setDetecting(false);
    }
  }, []);

  // 全域 paste 事件
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find(i => i.type.startsWith('image/'));
      if (imageItem) {
        const file = imageItem.getAsFile();
        if (file) { e.preventDefault(); handleImagePaste(file); return; }
      }
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [handleImagePaste]);

  // 文字 debounce AI 辨識
  useEffect(() => {
    const text = form.rawTextContent.trim();
    if (text.length < 15) return;
    if (textTimer.current) clearTimeout(textTimer.current);
    textTimer.current = setTimeout(async () => {
      setDetecting(true);
      setDetectMsg('🤖 AI 辨識日期、平台、模式…');
      try {
        const meta = await geminiService.extractReportMeta(text);
        applyMeta(meta);
      } catch {
        setDetectMsg('辨識失敗，請手動填寫');
      } finally {
        setDetecting(false);
      }
    }, 700);
    return () => { if (textTimer.current) clearTimeout(textTimer.current); };
  }, [form.rawTextContent]);

  // 欄位齊全後倒數
  useEffect(() => {
    if (!isValid || loading || success) { cancelCd(); return; }
    if (countdown !== null) return;
    setCountdown(AUTO_SECS);
  }, [isValid, loading, success]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { cancelCd(); submit(); return; }
    cdRef.current = setTimeout(() => setCountdown(c => c !== null ? c - 1 : null), 1000);
    return () => { if (cdRef.current) clearTimeout(cdRef.current); };
  }, [countdown]);

  function cancelCd() {
    if (cdRef.current) clearTimeout(cdRef.current);
    setCountdown(null);
  }

  async function submit() {
    if (!isValid) { setMessage('請確認日期、平台、模式與日報內容已填妥。'); return; }
    cancelCd();
    try {
      setLoading(true);
      setMessage('');
      const report = await reportService.createReport({
        reportDate: form.reportDate,
        platformName: form.platformName as any,
        reportMode: form.reportMode as any,
        rawTextContent: form.rawTextContent,
        noteText: form.noteText,
      });
      setCreatedId(report.id);
      await reportService.runParse(report.id, { forceReparse: false });

      // 讀取後端完整解析結果，轉換為前端 store 格式供 ParseResultPage 使用
      const parseResult = await reportService.getParseResult(report.id);
      useReportStore.getState().setCurrentParseResult({
        date: form.reportDate,
        platform: form.platformName,
        reportType: form.reportMode,
        rawText: form.rawTextContent,
        parsedAt: new Date().toISOString(),
        totals: {
          totalDispatchDeals: parseResult.totals.followupDealsCount ?? 0,
          totalFollowAmount: parseResult.totals.followupAmount ?? 0,
          totalRevenue: parseResult.totals.totalRevenueAmount ?? 0,
          totalActual: parseResult.totals.totalRevenueAmount ?? 0,
          totalCancelReturn: parseResult.totals.cancelledReturnAmount ?? 0,
          employeeCount: parseResult.details.length,
        },
        details: parseResult.details.map((d) => ({
          id: String(d.id),
          employeeName: d.employeeName,
          employeeRole: d.identityTag === '新人' ? '新人' : '一般',
          dispatchDeals: d.followupDealsCount ?? 0,
          followAmount: d.followupAmount ?? 0,
          revenue: d.totalRevenueAmount ?? 0,
          actual: d.totalRevenueAmount ?? 0,
          cancelReturn: d.cancelledReturnAmount ?? 0,
        })),
        autoFixRecords: [],
        conflicts: [],
      });

      setSuccess(true);
      setMessage(`解析完成！報表 #${report.id} · 共 ${parseResult.details.length} 人 · 自動跳往解析結果`);
      onParsed?.({ reportId: report.id, reportDate: form.reportDate });
    } catch (err: any) {
      setMessage(err?.responseMessage || err?.message || '建立或解析失敗，請確認後端是否運行。');
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    cancelCd();
    setForm(initialForm);
    setAutoFilled(new Set());
    setDetectMsg('');
    setMessage('');
    setSuccess(false);
    setCreatedId(null);
    setPastedImage(null);
  }

  const isAF = (k: string) => autoFilled.has(k);

  const progressFields = [
    { key: 'reportDate',    label: '日期', val: form.reportDate },
    { key: 'platformName',  label: '平台', val: form.platformName },
    { key: 'reportMode',    label: '模式', val: form.reportMode },
    { key: 'rawTextContent',label: '內容', val: form.rawTextContent.trim() },
  ];

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100vh', padding: 0, fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ── 頂部標題列 ── */}
      <div style={{
        background: `linear-gradient(135deg, ${EMPEROR_UI.cardBg}, ${EMPEROR_UI.sidebarBg})`,
        borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
        padding: '16px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* 背景財富符號 */}
        <div style={{ position: 'absolute', right: 80, top: '50%', transform: 'translateY(-50%)', fontSize: 40, opacity: 0.04, pointerEvents: 'none', userSelect: 'none' }}>💰📋💎</div>
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <span style={{
              background: `linear-gradient(135deg, ${EMPEROR_UI.brandGold}, ${EMPEROR_UI.brandGlow})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>每日業績樞紐</span>
            <span style={{
              background: TU.void, color: TU.bright, border: `1px solid ${TU.shadow}`,
              borderRadius: 6, padding: '1px 8px', fontSize: 11, fontWeight: 900,
              WebkitTextFillColor: TU.bright,
            }}>V2</span>
          </div>
          <div style={{ fontSize: 11, color: EMPEROR_UI.textMuted, marginTop: 3, letterSpacing: '0.06em' }}>
            貼上截圖或文字 → AI 自動辨識 → 自動解析 → 審計 → 派工
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
          {loading
            ? <StatusBadge label="🤖 AI 解析中…" tone="warn" />
            : success
            ? <StatusBadge label={`✅ #${createdId} 完成`} tone="pass" />
            : detecting
            ? <StatusBadge label="🔍 辨識中…" tone="info" />
            : <StatusBadge label="等待輸入" tone="info" />}
        </div>
      </div>

      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── AI 辨識狀態條 ── */}
        {detectMsg && (
          <div style={{
            padding: '10px 16px', borderRadius: 10,
            background: detecting ? TU.abyss : MU.abyss,
            border: `1px solid ${detecting ? TU.shadow : MU.shadow}`,
            color: detecting ? TU.text : MU.text,
            fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: detecting ? `0 0 12px ${TU.core}22` : `0 0 12px ${MU.core}22`,
          }}>
            {detectMsg}
          </div>
        )}

        {/* ── 倒數自動提交 ── */}
        {countdown !== null && !loading && (
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: HUO.abyss, border: `1px solid ${HUO.shadow}`,
            display: 'flex', alignItems: 'center', gap: 14,
            boxShadow: `0 0 20px ${HUO.core}22`,
          }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: HUO.bright, minWidth: 38, textAlign: 'center', textShadow: `0 0 16px ${HUO.bright}` }}>
              {countdown}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: HUO.text, letterSpacing: '0.04em' }}>
                🔥 欄位齊全 · {countdown} 秒後自動執行 AI 解析
              </div>
              <div style={{ marginTop: 6, height: 4, borderRadius: 4, background: HUO.void, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: `linear-gradient(90deg, ${HUO.core}, ${HUO.bright})`,
                  width: `${((AUTO_SECS - countdown) / AUTO_SECS) * 100}%`,
                  transition: 'width 0.95s linear',
                }} />
              </div>
            </div>
            <button type="button" onClick={cancelCd} style={{
              border: `1px solid ${HUO.shadow}`, borderRadius: 6, background: HUO.void,
              color: HUO.text, fontSize: 12, fontWeight: 800, padding: '5px 14px', cursor: 'pointer',
              letterSpacing: '0.06em',
            }}>暫停</button>
          </div>
        )}

        {/* ── 圖片預覽 ── */}
        {pastedImage && (
          <div style={{
            borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${SHUI.shadow}`, background: SHUI.abyss,
          }}>
            <div style={{
              padding: '8px 16px', background: SHUI.void,
              fontSize: 11, color: SHUI.text, fontWeight: 800,
              borderBottom: `1px solid ${SHUI.shadow}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              letterSpacing: '0.06em',
            }}>
              <span>🖼️ 截圖預覽（Gemini Vision 辨識中）</span>
              <button type="button" onClick={() => setPastedImage(null)} style={{
                background: 'none', border: 'none', color: EMPEROR_UI.textMuted, cursor: 'pointer', fontSize: 16,
              }}>✕</button>
            </div>
            <img src={pastedImage} alt="貼上截圖" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }} />
          </div>
        )}

        {/* ── 原始日報輸入框（核心）── */}
        <div>
          <label style={{ ...fieldLabel, fontSize: 13 }}>
            <span style={{ color: EMPEROR_UI.textSecondary }}>原始日報輸入框</span>
            <span style={{ fontSize: 11, color: EMPEROR_UI.textDim }}>
              · 貼文字或 Ctrl+V 截圖，AI 自動辨識
            </span>
          </label>
          <div
            style={{
              position: 'relative',
              border: `2px dashed ${form.rawTextContent ? TU.shadow : EMPEROR_UI.borderMain}`,
              borderRadius: 12,
              background: form.rawTextContent ? TU.abyss : EMPEROR_UI.sidebarBg,
              transition: 'border-color 0.3s, background 0.3s',
              cursor: 'text',
            }}
            onClick={() => textareaRef.current?.focus()}
          >
            {!form.rawTextContent && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', gap: 10,
              }}>
                <div style={{ fontSize: 40 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: EMPEROR_UI.textMuted, letterSpacing: '0.04em' }}>
                  Ctrl + V 貼上截圖或日報文字
                </div>
                <div style={{ fontSize: 11, color: EMPEROR_UI.textDim, letterSpacing: '0.06em' }}>
                  AI 將自動辨識日期 · 平台 · 模式 · 並啟動派工解析
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  {['💰', '🔥', '💎', '🐲'].map(s => (
                    <span key={s} style={{ fontSize: 18, opacity: 0.25 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={form.rawTextContent}
              onChange={e => set('rawTextContent', e.target.value)}
              placeholder=""
              style={{
                width: '100%', border: 'none', borderRadius: 12,
                padding: '20px', fontSize: 13, outline: 'none',
                background: 'transparent',
                color: EMPEROR_UI.textSecondary,
                minHeight: form.rawTextContent ? 280 : 180,
                resize: 'vertical',
                fontFamily: '"Fira Code", "Consolas", monospace',
                lineHeight: 1.7, boxSizing: 'border-box',
              }}
            />
          </div>
          {form.rawTextContent && (
            <div style={{ fontSize: 11, color: EMPEROR_UI.textDim, marginTop: 4, textAlign: 'right' }}>
              {form.rawTextContent.length} 字元
            </div>
          )}
        </div>

        {/* ── AI 辨識結果欄位 ── */}
        <div style={{
          background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 14, padding: 18,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: EMPEROR_UI.brandGold, marginBottom: 14, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🤖</span> AI 自動辨識結果
            {[form.reportDate, form.platformName, form.reportMode].every(Boolean) && (
              <span style={{ marginLeft: 6, color: MU.bright, fontWeight: 900 }}>✓ 全部就緒 → 準備解析</span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 }}>

            {/* 報表日期 */}
            <div>
              <label style={fieldLabel}>
                報表日期
                {isAF('reportDate') && <span style={{ color: MU.bright, fontSize: 10, fontWeight: 900 }}>AI 填入</span>}
              </label>
              <input
                type="date"
                value={form.reportDate}
                onChange={e => set('reportDate', e.target.value)}
                style={isAF('reportDate') ? inputAutoFill : inputBase}
              />
            </div>

            {/* 平台 */}
            <div>
              <label style={fieldLabel}>
                平台
                {isAF('platformName') && <span style={{ color: MU.bright, fontSize: 10, fontWeight: 900 }}>AI 填入</span>}
              </label>
              <select
                value={form.platformName}
                onChange={e => set('platformName', e.target.value as any)}
                style={isAF('platformName') ? inputAutoFill : inputBase}
              >
                <option value="">請選擇平台</option>
                {平台選項.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 報表模式 */}
            <div>
              <label style={fieldLabel}>
                報表模式
                {isAF('reportMode') && <span style={{ color: MU.bright, fontSize: 10, fontWeight: 900 }}>AI 填入</span>}
              </label>
              <select
                value={form.reportMode}
                onChange={e => set('reportMode', e.target.value as any)}
                style={isAF('reportMode') ? inputAutoFill : inputBase}
              >
                <option value="">請選擇模式</option>
                {報表模式選項.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* 備註 */}
            <div>
              <label style={fieldLabel}>備註</label>
              <input
                value={form.noteText}
                onChange={e => set('noteText', e.target.value)}
                placeholder={`例：${new Date().toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })} 原始`}
                style={inputBase}
              />
            </div>
          </div>
        </div>

        {/* ── 操作列 ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" onClick={reset} style={{
            border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 8, padding: '10px 18px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: EMPEROR_UI.cardBg, color: EMPEROR_UI.textMuted,
            letterSpacing: '0.04em',
          }}>
            清空重填
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading || !isValid}
            style={{
              border: 'none', borderRadius: 8, padding: '11px 28px',
              fontWeight: 900, fontSize: 14, cursor: isValid && !loading ? 'pointer' : 'not-allowed',
              background: loading
                ? TU.void
                : isValid
                ? `linear-gradient(135deg, ${TU.core}, ${HUO.base})`
                : EMPEROR_UI.cardBg,
              color: isValid ? EMPEROR_UI.textPrimary : EMPEROR_UI.textDim,
              boxShadow: isValid && !loading ? `0 4px 20px ${TU.bright}44` : 'none',
              transition: 'all 0.2s',
              letterSpacing: '0.06em',
              textShadow: isValid && !loading ? `0 0 16px ${TU.bright}66` : 'none',
            }}>
            {loading ? '🤖 AI 解析中…' : '💰 立即執行 AI 解析'}
          </button>

          {/* 欄位進度圓點 */}
          <div style={{ display: 'flex', gap: 5, marginLeft: 4 }}>
            {progressFields.map(f => {
              const ok = Boolean(f.val);
              return (
                <span key={f.key} style={{
                  padding: '3px 10px', borderRadius: 20,
                  background: ok ? MU.void : EMPEROR_UI.pageBg,
                  color: ok ? MU.bright : EMPEROR_UI.textDim,
                  fontSize: 10, fontWeight: 800,
                  border: `1px solid ${ok ? MU.shadow : EMPEROR_UI.borderMain}`,
                  letterSpacing: '0.06em',
                }}>
                  {ok ? '✓' : '○'} {f.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* ── 結果訊息 ── */}
        {message && (
          <div style={{
            padding: '14px 20px', borderRadius: 12,
            background: success ? MU.void : HUO.void,
            border: `1px solid ${success ? MU.shadow : HUO.shadow}`,
            color: success ? MU.text : HUO.text,
            fontWeight: 700, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: success ? `0 0 16px ${MU.core}22` : `0 0 16px ${HUO.core}22`,
          }}>
            <span style={{ fontSize: 18 }}>{success ? '✅' : '❌'}</span>
            <span style={{ flex: 1 }}>{message}</span>
            {success && (
              <span style={{
                background: TU.void, color: TU.bright, border: `1px solid ${TU.shadow}`,
                borderRadius: 12, padding: '2px 12px', fontSize: 11, fontWeight: 900,
              }}>
                # {createdId}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
