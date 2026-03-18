// ════════════════════════════════════════════════════
// 每日業績樞紐 V2 — 貼文字 or 貼截圖，AI 全自動解析
// 帝王能量聚財配色系統
// ════════════════════════════════════════════════════
import React, { useCallback, useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { 平台選項, 報表模式選項 } from '../constants/dictionaries';
import type { DailyReportInputForm } from '../types/forms';
import { reportService } from '../services/report.service';
import { geminiService } from '../services/gemini.service';
import { useReportStore } from '../data/reportStore';
import { StatusBadge } from '../components/StatusBadge';
import { EMPEROR_UI, TU, MU, HUO, SHUI, JIN, EMPEROR } from '../constants/wuxingColors';

interface DailyReportInputPageProps {
  onParsed?: (payload: { reportId: number; reportDate: string; personCount: number }) => void;
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
  const [personCount, setPersonCount] = useState<number | null>(null);

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

      setPersonCount(parseResult.details.length);
      setSuccess(true);
      setMessage(`解析完成！報表 #${report.id} · 共 ${parseResult.details.length} 人 · 自動跳往解析結果`);
      onParsed?.({ reportId: report.id, reportDate: form.reportDate, personCount: parseResult.details.length });
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
    setPersonCount(null);
  }

  // ── 靈魂注入：即時時鐘 + 系統生命脈搏 ──
  const [liveTime, setLiveTime] = useState(() =>
    new Date().toLocaleTimeString('zh-TW', { hour12: false })
  );
  const [uptime, setUptime] = useState(0);
  const [dataNodes, setDataNodes] = useState(Math.floor(Math.random() * 200 + 847));
  const clockRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uptimeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    clockRef.current = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('zh-TW', { hour12: false }));
    }, 1000);
    uptimeRef.current = setInterval(() => {
      setUptime(u => u + 1);
      setDataNodes(n => n + Math.floor(Math.random() * 3 + 1));
    }, 1000);
    return () => {
      if (clockRef.current) clearInterval(clockRef.current);
      if (uptimeRef.current) clearInterval(uptimeRef.current);
    };
  }, []);

  const uptimeStr = `${String(Math.floor(uptime / 3600)).padStart(2, '0')}:${String(Math.floor((uptime % 3600) / 60)).padStart(2, '0')}:${String(uptime % 60).padStart(2, '0')}`;

  const isAF = (k: string) => autoFilled.has(k);

  const progressFields = [
    { key: 'reportDate',    label: '日期', val: form.reportDate },
    { key: 'platformName',  label: '平台', val: form.platformName },
    { key: 'reportMode',    label: '模式', val: form.reportMode },
    { key: 'rawTextContent',label: '內容', val: form.rawTextContent.trim() },
  ];


  return (
    <Fragment>
    <style>{`
      @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes dataPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      @keyframes scanLine {
        0%{background-position:0 0} 100%{background-position:0 100%}
      }
      @keyframes nodeCount { from{transform:scale(1)} to{transform:scale(1.06)} }
      @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes fieldGlow { 0%,100%{box-shadow:0 0 4px ${MU.bright}44} 50%{box-shadow:0 0 10px ${MU.bright}99} }
      @keyframes checkPop { 0%{transform:scale(0.4);opacity:0} 60%{transform:scale(1.3)} 100%{transform:scale(1);opacity:1} }
      @keyframes loadRing { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      @keyframes countUp { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
      @keyframes streamDot { 0%,100%{opacity:0.2} 50%{opacity:1} }
      @keyframes charBarGlow { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.3)} }
      @keyframes stepActivate { 0%{transform:scale(0.96);opacity:0.7} 100%{transform:scale(1);opacity:1} }
      @keyframes badgePulse { 0%,100%{box-shadow:0 0 4px ${MU.bright}44,inset 0 0 4px transparent} 50%{box-shadow:0 0 14px ${MU.bright}cc,inset 0 0 6px ${MU.bright}22} }
      .soul-cursor::after {
        content:'█'; color:${SHUI.bright}; animation:cursorBlink 1s step-end infinite;
      }
      .soul-node { animation:dataPulse 2s ease-in-out infinite; }
      .soul-detect-spin { display:inline-block; animation:spin 1s linear infinite; }
      .field-check { animation:checkPop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      .step-activate { animation:stepActivate 0.3s ease-out forwards; }
      .stream-dot1 { animation:streamDot 1.2s ease-in-out 0s infinite; }
      .stream-dot2 { animation:streamDot 1.2s ease-in-out 0.3s infinite; }
      .stream-dot3 { animation:streamDot 1.2s ease-in-out 0.6s infinite; }
      .badge-active { animation:badgePulse 2s ease-in-out infinite; }
      .char-bar-fill { animation:charBarGlow 2s ease-in-out infinite; }
    `}</style>
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100vh', padding: 0, fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ── 頂部標題列 ── */}
      <div style={{
        background: `linear-gradient(135deg, ${EMPEROR_UI.cardBg}, ${EMPEROR_UI.sidebarBg})`,
        borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
        padding: '9px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'serif', fontSize: 18, color: SHUI.bright }}>水</span>
            <span style={{ color: EMPEROR_UI.textPrimary }}>① 每日業績輸入中心</span>
            <span style={{ background: TU.void, color: TU.bright, border: `1px solid ${TU.shadow}`, borderRadius: 5, padding: '1px 8px', fontSize: 11 }}>V2</span>
          </div>
          <div style={{ fontSize: 10, color: EMPEROR_UI.textDim, marginTop: 2 }}>
            貼上截圖或文字 → 辨識 → 解析 → 審計 → 派工
          </div>
        </div>
        {/* 右側生命脈搏儀表板 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 即時時鐘 */}
          <div style={{
            background: SHUI.void, border: `1px solid ${SHUI.shadow}`,
            borderRadius: 8, padding: '4px 12px',
            fontFamily: '"Fira Code", monospace', fontSize: 13, fontWeight: 900,
            color: SHUI.bright, letterSpacing: '0.08em',
            textShadow: `0 0 8px ${SHUI.bright}88`,
          }}>
            {liveTime}
          </div>
          {/* 系統在線 */}
          <div style={{
            background: MU.void, border: `1px solid ${MU.shadow}`,
            borderRadius: 8, padding: '4px 12px',
            fontSize: 11, color: MU.text, letterSpacing: '0.06em',
          }}>
            <span style={{ color: MU.core }}>在線</span> {uptimeStr}
          </div>
          {/* 數據節點計數 */}
          <div className="soul-node" style={{
            background: TU.void, border: `1px solid ${TU.shadow}`,
            borderRadius: 8, padding: '4px 12px',
            fontSize: 11, color: TU.text, letterSpacing: '0.06em',
          }}>
            <span style={{ color: TU.core }}>節點</span> {dataNodes.toLocaleString()}
          </div>
          {/* 狀態徽章 */}
          {loading
            ? <StatusBadge label="🤖 AI 解析中…" tone="warn" />
            : success
            ? <StatusBadge label={`✅ #${createdId} 完成`} tone="pass" />
            : detecting
            ? <StatusBadge label="🔍 辨識中…" tone="info" />
            : <StatusBadge label="等待輸入" tone="info" />}
        </div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

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
            {detecting && <span className="soul-detect-spin" style={{ fontSize: 14, color: TU.bright }}>⚙</span>}
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

        {/* ══ 核心輸入區：全版超大貼上框 ══ */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 8, flexWrap: 'wrap', gap: 6,
          }}>
            <label style={{ ...fieldLabel, fontSize: 14, margin: 0 }}>
              <span style={{ fontSize: 20 }}>📋</span>
              <span style={{ color: EMPEROR_UI.textPrimary, fontWeight: 900 }}>貼上業績日報</span>
              <span style={{ fontSize: 11, color: EMPEROR_UI.textDim }}>
                → AI 自動解析 → 排名 → 派單 → 公告
              </span>
            </label>
            {form.rawTextContent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 4, width: 80, borderRadius: 4, background: EMPEROR_UI.borderMain, overflow: 'hidden' }}>
                  <div className="char-bar-fill" style={{
                    height: '100%', borderRadius: 4,
                    background: form.rawTextContent.length > 500 ? `linear-gradient(90deg,${SHUI.core},${MU.bright})` : SHUI.shadow,
                    width: `${Math.min(100, (form.rawTextContent.length / 2000) * 100)}%`,
                    transition: 'width 0.3s',
                  }} />
                </div>
                <span style={{ fontSize: 11, color: form.rawTextContent.length > 100 ? SHUI.bright : EMPEROR_UI.textDim, fontFamily: '"Fira Code", monospace', fontWeight: 700 }}>
                  {form.rawTextContent.length} 字
                </span>
              </div>
            )}
          </div>
          <div
            style={{
              position: 'relative',
              border: form.rawTextContent
                ? `2px solid ${TU.shadow}`
                : `2px dashed ${SHUI.shadow}`,
              borderRadius: 14,
              background: form.rawTextContent
                ? `linear-gradient(180deg, ${TU.abyss}, ${EMPEROR_UI.sidebarBg})`
                : EMPEROR_UI.sidebarBg,
              transition: 'border-color 0.3s, background 0.3s',
              cursor: 'text',
              boxShadow: form.rawTextContent
                ? `0 0 0 1px ${TU.core}22, 0 4px 24px rgba(0,0,0,0.4)`
                : `0 2px 12px rgba(0,0,0,0.3)`,
            }}
            onClick={() => textareaRef.current?.focus()}
          >
            {/* 空白時的大引導文字 */}
            {!form.rawTextContent && (
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', gap: 12,
              }}>
                {/* 主要 CTA */}
                <div style={{
                  fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900,
                  color: SHUI.core, letterSpacing: '-0.01em', lineHeight: 1.1,
                  textAlign: 'center',
                }}>
                  Ctrl + V
                </div>
                <div style={{
                  fontSize: 'clamp(14px, 1.8vw, 18px)', fontWeight: 800,
                  color: EMPEROR_UI.textMuted, letterSpacing: '0.04em', textAlign: 'center',
                }}>
                  貼上業績日報文字或截圖
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
                  {['AI 自動辨識日期', '自動識別平台', '自動排名', '自動生成派單', '自動生成公告'].map(tag => (
                    <span key={tag} style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20,
                      background: SHUI.abyss, border: `1px solid ${SHUI.shadow}`,
                      color: SHUI.text, letterSpacing: '0.04em',
                    }}>{tag}</span>
                  ))}
                </div>
                <div style={{
                  fontFamily: '"Fira Code", monospace', fontSize: 11,
                  color: SHUI.bright, letterSpacing: '0.1em', opacity: 0.5,
                  display: 'flex', alignItems: 'center', gap: 6, marginTop: 4,
                }}>
                  <span>SYS://AWAITING_INPUT</span>
                  <span className="soul-cursor" />
                </div>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={form.rawTextContent}
              onChange={e => set('rawTextContent', e.target.value)}
              placeholder=""
              style={{
                width: '100%', border: 'none', borderRadius: 14,
                padding: '16px', fontSize: 13, outline: 'none',
                background: 'transparent',
                color: EMPEROR_UI.textSecondary,
                minHeight: form.rawTextContent ? 260 : 200,
                resize: 'vertical',
                fontFamily: '"Fira Code", "Consolas", monospace',
                lineHeight: 1.8, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* ── AI 辨識結果欄位 ── */}
        <div style={{
          background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: EMPEROR_UI.brandGold, marginBottom: 10, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>{detecting ? <span className="soul-detect-spin" style={{ display: 'inline-block', fontSize: 14 }}>🤖</span> : '🤖'}</span>
            <span>AI 自動辨識結果</span>
            {detecting && (
              <span style={{ display: 'flex', gap: 3, alignItems: 'center', marginLeft: 4 }}>
                <span className="stream-dot1" style={{ width: 5, height: 5, borderRadius: '50%', background: TU.bright, display: 'inline-block' }} />
                <span className="stream-dot2" style={{ width: 5, height: 5, borderRadius: '50%', background: TU.bright, display: 'inline-block' }} />
                <span className="stream-dot3" style={{ width: 5, height: 5, borderRadius: '50%', background: TU.bright, display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: TU.text, marginLeft: 4, letterSpacing: '0.06em' }}>辨識中…</span>
              </span>
            )}
            {!detecting && [form.reportDate, form.platformName, form.reportMode].every(Boolean) && (
              <span className="badge-active" style={{ marginLeft: 4, color: MU.bright, fontWeight: 900, background: MU.abyss, padding: '2px 10px', borderRadius: 6, border: `1px solid ${MU.shadow}`, fontSize: 11 }}>
                ✓ 全部就緒 → 準備解析
              </span>
            )}
            {!detecting && ![form.reportDate, form.platformName, form.reportMode].every(Boolean) && form.rawTextContent.length > 10 && (
              <span style={{ marginLeft: 4, color: EMPEROR_UI.textDim, fontWeight: 700, fontSize: 10, display: 'flex', gap: 6 }}>
                {!form.reportDate && <span style={{ color: HUO.text, background: HUO.abyss, padding: '1px 7px', borderRadius: 4, border: `1px solid ${HUO.shadow}` }}>○ 日期待填</span>}
                {!form.platformName && <span style={{ color: HUO.text, background: HUO.abyss, padding: '1px 7px', borderRadius: 4, border: `1px solid ${HUO.shadow}` }}>○ 平台待填</span>}
                {!form.reportMode && <span style={{ color: HUO.text, background: HUO.abyss, padding: '1px 7px', borderRadius: 4, border: `1px solid ${HUO.shadow}` }}>○ 模式待填</span>}
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8 }}>

            {/* 報表日期 */}
            <div>
              <label style={fieldLabel}>
                <span style={{ color: form.reportDate ? MU.bright : EMPEROR_UI.textDim, fontSize: 13, transition: 'color 0.2s' }} className={form.reportDate ? 'field-check' : ''}>
                  {form.reportDate ? '✓' : '○'}
                </span>
                <span style={{ color: form.reportDate ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted, transition: 'color 0.2s' }}>報表日期</span>
                {isAF('reportDate') && <span style={{ marginLeft: 4, color: MU.bright, fontSize: 10, fontWeight: 900, background: MU.abyss, padding: '1px 6px', borderRadius: 4, border: `1px solid ${MU.shadow}` }}>AI 填入</span>}
                {form.reportDate && !isAF('reportDate') && <span style={{ marginLeft: 4, fontSize: 10, color: SHUI.bright, letterSpacing: '0.04em' }}>手動</span>}
              </label>
              <input
                type="date"
                value={form.reportDate}
                onChange={e => set('reportDate', e.target.value)}
                style={isAF('reportDate') ? inputAutoFill : form.reportDate ? { ...inputBase, border: `1.5px solid ${SHUI.shadow}`, background: SHUI.abyss } : inputBase}
              />
            </div>

            {/* 平台 */}
            <div>
              <label style={fieldLabel}>
                <span style={{ color: form.platformName ? MU.bright : EMPEROR_UI.textDim, fontSize: 13, transition: 'color 0.2s' }} className={form.platformName ? 'field-check' : ''}>
                  {form.platformName ? '✓' : '○'}
                </span>
                <span style={{ color: form.platformName ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted, transition: 'color 0.2s' }}>平台</span>
                {isAF('platformName') && <span style={{ marginLeft: 4, color: MU.bright, fontSize: 10, fontWeight: 900, background: MU.abyss, padding: '1px 6px', borderRadius: 4, border: `1px solid ${MU.shadow}` }}>AI 填入</span>}
                {form.platformName && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: TU.bright }}>{form.platformName}</span>}
              </label>
              <select
                value={form.platformName}
                onChange={e => set('platformName', e.target.value as any)}
                style={isAF('platformName') ? inputAutoFill : form.platformName ? { ...inputBase, border: `1.5px solid ${SHUI.shadow}`, background: SHUI.abyss } : inputBase}
              >
                <option value="">請選擇平台</option>
                {平台選項.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* 報表模式 */}
            <div>
              <label style={fieldLabel}>
                <span style={{ color: form.reportMode ? MU.bright : EMPEROR_UI.textDim, fontSize: 13, transition: 'color 0.2s' }} className={form.reportMode ? 'field-check' : ''}>
                  {form.reportMode ? '✓' : '○'}
                </span>
                <span style={{ color: form.reportMode ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted, transition: 'color 0.2s' }}>報表模式</span>
                {isAF('reportMode') && <span style={{ marginLeft: 4, color: MU.bright, fontSize: 10, fontWeight: 900, background: MU.abyss, padding: '1px 6px', borderRadius: 4, border: `1px solid ${MU.shadow}` }}>AI 填入</span>}
                {form.reportMode && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 900, color: HUO.bright }}>{form.reportMode}</span>}
              </label>
              <select
                value={form.reportMode}
                onChange={e => set('reportMode', e.target.value as any)}
                style={isAF('reportMode') ? inputAutoFill : form.reportMode ? { ...inputBase, border: `1.5px solid ${SHUI.shadow}`, background: SHUI.abyss } : inputBase}
              >
                <option value="">請選擇模式</option>
                {報表模式選項.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* 備註 */}
            <div>
              <label style={fieldLabel}>
                <span style={{ color: form.noteText ? SHUI.bright : EMPEROR_UI.textDim, fontSize: 13 }}>{form.noteText ? '✓' : '○'}</span>
                <span style={{ color: EMPEROR_UI.textMuted }}>備註</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: EMPEROR_UI.textDim }}>選填</span>
              </label>
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
            border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 7, padding: '8px 14px',
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            background: EMPEROR_UI.cardBg, color: EMPEROR_UI.textMuted,
            letterSpacing: '0.04em',
          }}>
            清空重填
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={loading || !isValid || success}
            style={{
              position: 'relative', overflow: 'hidden',
              border: success ? `1.5px solid ${MU.bright}` : 'none',
              borderRadius: 8, padding: '11px 28px',
              fontWeight: 900, fontSize: 14,
              cursor: isValid && !loading && !success ? 'pointer' : 'not-allowed',
              background: success
                ? `linear-gradient(135deg, ${MU.abyss}, ${MU.void})`
                : loading
                ? TU.void
                : isValid
                ? `linear-gradient(135deg, ${TU.core}, ${HUO.base})`
                : EMPEROR_UI.cardBg,
              color: isValid || success ? EMPEROR_UI.textPrimary : EMPEROR_UI.textDim,
              boxShadow: success
                ? `0 0 18px ${MU.bright}66`
                : isValid && !loading ? `0 4px 20px ${TU.bright}44` : 'none',
              transition: 'all 0.3s',
              letterSpacing: '0.06em',
              textShadow: success ? `0 0 12px ${MU.bright}` : isValid && !loading ? `0 0 16px ${TU.bright}66` : 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
            {loading && (
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${TU.shadow}`,
                borderTopColor: TU.bright,
                display: 'inline-block',
                animation: 'loadRing 0.8s linear infinite',
                flexShrink: 0,
              }} />
            )}
            <span>
              {success
                ? `✅ 完成 #${createdId}${personCount !== null ? ` · ${personCount} 人` : ''}`
                : loading ? 'AI 解析中…' : '💰 立即執行 AI 解析'}
            </span>
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
            padding: '9px 14px', borderRadius: 9,
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
              <span style={{ background: TU.void, color: TU.bright, border: `1px solid ${TU.shadow}`, borderRadius: 12, padding: '2px 12px', fontSize: 11, fontWeight: 900 }}>
                # {createdId}
              </span>
            )}
          </div>
        )}

        {/* ── AI 派單流程進度（提交前：可點擊各步驟說明；提交後：即時狀態追蹤）── */}
        <div style={{
          background: EMPEROR.obsidian,
          border: `1px solid ${EMPEROR_UI.borderAccent}`,
          borderRadius: 10, padding: '10px 14px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
        }}>
          {([
            {
              step: '①', label: '貼上業績',
              desc: form.rawTextContent ? `${form.rawTextContent.length} 字` : '文字或截圖',
              color: SHUI,
              active: Boolean(form.rawTextContent),
              done: Boolean(form.rawTextContent),
              spinning: false,
              badge: form.rawTextContent ? `${form.rawTextContent.length}字` : null,
            },
            {
              step: '②', label: 'AI 解析',
              desc: loading ? '解析中…' : personCount !== null ? `辨識 ${personCount} 人` : '辨識人員明細',
              color: SHUI,
              active: loading || success,
              done: success,
              spinning: loading,
              badge: personCount !== null ? `${personCount}人` : loading ? '…' : null,
            },
            {
              step: '③', label: '智能審計',
              desc: success ? '天地盤/邏輯盤 ✓' : '天地盤/邏輯盤',
              color: MU,
              active: success,
              done: success,
              spinning: false,
              badge: success ? 'PASS' : null,
            },
            {
              step: '④', label: '排名派單',
              desc: success ? 'A1/A2/B/C分組 →' : 'A1/A2/B/C分組',
              color: HUO,
              active: success,
              done: success,
              spinning: false,
              badge: success && createdId ? `#${createdId}` : null,
            },
            {
              step: '⑤', label: '公告生成',
              desc: success ? 'LINE/播報/完整版 →' : 'LINE/播報/完整版',
              color: JIN,
              active: success,
              done: success,
              spinning: false,
              badge: null,
            },
          ] as const).map((s, i) => (
            <div key={i} className={s.active ? 'step-activate' : ''} style={{
              display: 'flex', flexDirection: 'column', gap: 6,
              padding: '12px 14px', borderRadius: 10,
              background: s.active ? s.color.void : s.color.abyss,
              border: `1px solid ${s.active ? s.color.shadow : s.color.abyss}`,
              borderBottom: `3px solid ${s.active ? s.color.bright : s.color.shadow}`,
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}>
              {s.active && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${s.color.bright}, transparent)`, animation: 'dataPulse 1.5s ease-in-out infinite' }} />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {s.spinning
                  ? <span style={{ width: 11, height: 11, borderRadius: '50%', border: `1.5px solid ${s.color.shadow}`, borderTopColor: s.color.bright, display: 'inline-block', animation: 'loadRing 0.8s linear infinite', flexShrink: 0 }} />
                  : <span style={{ fontSize: 11, color: s.active ? s.color.bright : s.color.core, fontWeight: 900, fontFamily: 'monospace' }}>{s.step}</span>
                }
                <span style={{ fontSize: 13, fontWeight: 900, color: s.active ? s.color.text : s.color.shadow }}>{s.label}</span>
                {s.badge && (
                  <span className="countUp" style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 900,
                    color: s.color.bright, background: s.color.abyss,
                    padding: '1px 6px', borderRadius: 4,
                    border: `1px solid ${s.color.shadow}`,
                    fontFamily: '"Fira Code", monospace',
                    animation: 'countUp 0.4s ease-out',
                  }}>{s.badge}</span>
                )}
                {s.done && !s.badge && <span style={{ marginLeft: 'auto', fontSize: 10, color: s.color.bright }}>✓</span>}
              </div>
              <div style={{ fontSize: 10, color: s.active ? s.color.text : EMPEROR_UI.textDim, opacity: 0.75, letterSpacing: '0.04em' }}>{s.desc}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
    </Fragment>
  );
}
