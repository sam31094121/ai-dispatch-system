import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DailyReportInputPage } from './DailyReportInputPage';
import { ParseResultConfirmPage } from './ParseResultConfirmPage';
import { AuditCheckPage } from './AuditCheckPage';
import { RankingDispatchPage } from './RankingDispatchPage';
import { AnnouncementOutputPage } from './AnnouncementOutputPage';
import { EMPEROR_UI, TU, MU, HUO, SHUI, JIN, EMPEROR } from '../constants/wuxingColors';

type StepKey = 'input' | 'parse' | 'audit' | 'ranking' | 'announcement';

// ══════════════════════════════════════════════════════════
// 意境點擊元件：每個字都有語意＋複製功能＋視覺回饋
// ══════════════════════════════════════════════════════════
function CW({
  children, copy, title, color, bold, size, action,
}: {
  children: React.ReactNode;
  copy?: string;       // 要複製的內容（省略則執行 action）
  title: string;       // tooltip 說明
  color?: string;
  bold?: boolean;
  size?: number;
  action?: () => void; // 點擊動作（可取代複製）
}) {
  const [hover, setHover] = useState(false);
  const [flash, setFlash] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (action) {
      action();
    } else if (copy !== undefined) {
      navigator.clipboard.writeText(copy).catch(() => {});
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 600);
  }

  return (
    <span
      onClick={onClick}
      title={action ? title : `點擊複製：${title}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        color: flash ? '#ffd700' : (color ?? 'inherit'),
        fontWeight: bold ? 900 : undefined,
        fontSize: size,
        borderBottom: hover ? '1px solid currentColor' : '1px dashed transparent',
        transition: 'all 0.15s',
        userSelect: 'none',
        textShadow: flash ? '0 0 10px #ffd700, 0 0 20px #ffd70066' : undefined,
        filter: flash ? 'brightness(1.4)' : undefined,
      }}
    >
      {children}
    </span>
  );
}

// ── 五行元素意境字典 ──
const ELEMENT_MEANING: Record<string, string> = {
  '水': '水：源頭活水，輸入業績，萬物之始',
  '木': 'AI 木：解析生長，辨識人員',
  '土': '土：審計厚實，根基穩固',
  '火': '火：排名燃燒，派單出擊',
  '金': '金：公告收穫，宣告成果',
};

const STEPS: {
  key: StepKey;
  num: string;
  label: string;
  sub: string;
  element: string;
  palette: typeof TU;
  canGo: (r: number | null, d: string) => boolean;
  // 每步的意境說明
  meaning: string;
  copyTpl: (r: number | null, d: string) => string;
}[] = [
  {
    key: 'input', num: '①', label: '輸入業績', sub: '貼入 · 辨識',
    element: '水', palette: SHUI, canGo: () => true,
    meaning: '① 貼入今日業績報表，AI 自動辨識',
    copyTpl: () => '① 輸入業績｜貼入 · 辨識',
  },
  {
    key: 'parse', num: '②', label: 'AI 解析', sub: '辨識人員明細',
    element: '木', palette: MU, canGo: (r) => Boolean(r),
    meaning: '② AI 解析人員明細，抽取追續/續單/業績',
    copyTpl: (r) => `② AI 解析完成｜報表 #${r}`,
  },
  {
    key: 'audit', num: '③', label: '智能審計', sub: '天地盤/邏輯盤',
    element: '土', palette: TU, canGo: (r) => Boolean(r),
    meaning: '③ 天地盤×邏輯盤×累積盤三重校驗',
    copyTpl: () => '③ 智能審計｜天地盤 · 邏輯盤 PASS',
  },
  {
    key: 'ranking', num: '④', label: '排名派單', sub: 'A1/A2/B/C 分組',
    element: '火', palette: HUO, canGo: (_, d) => Boolean(d),
    meaning: '④ 依總業績排名，A1/A2/B/C 自動分組派單',
    copyTpl: (_, d) => `④ 排名派單｜${d} 正式排序`,
  },
  {
    key: 'announcement', num: '⑤', label: '公告生成', sub: 'LINE/播報/完整版',
    element: '金', palette: JIN, canGo: (_, d) => Boolean(d),
    meaning: '⑤ 生成 LINE / 語音播報 / 完整主管版公告',
    copyTpl: (_, d) => `⑤ 公告生成｜${d} 派單公告`,
  },
];

// ── 五步自動貫穿進度條（常駐顯示）──
function AutoPipeline({
  step, reportId, auditPassed, personCount, reportDate, engineRunning,
  onStepClick,
}: {
  step: StepKey;
  reportId: number | null;
  auditPassed: boolean;
  personCount: number | null;
  reportDate: string;
  engineRunning: boolean;
  onStepClick: (key: StepKey) => void;
}) {
  const activeIdx = STEPS.findIndex(s => s.key === step);

  const badges: Record<StepKey, string | null> = {
    input:        reportId ? '✓' : null,
    parse:        personCount !== null ? `${personCount}人` : null,
    audit:        auditPassed ? 'PASS' : null,
    ranking:      auditPassed ? '✓' : null,
    announcement: auditPassed ? '✓' : null,
  };

  return (
    <div style={{
      display: 'flex', gap: 0, alignItems: 'stretch',
      background: EMPEROR.obsidian,
      border: `1px solid ${EMPEROR_UI.borderAccent}`,
      borderRadius: 10, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
    }}>
      {STEPS.map((s, i) => {
        const p = s.palette;
        const isCurrent = step === s.key;
        const isDone = i < activeIdx;
        const canNav = s.canGo(reportId, reportDate);
        const badge = badges[s.key];

        return (
          <React.Fragment key={s.key}>
            <button
              onClick={() => canNav && onStepClick(s.key)}
              disabled={!canNav}
              title={canNav ? s.meaning : '請先完成前面步驟'}
              style={{
                flex: 1, border: 'none', cursor: canNav ? 'pointer' : 'not-allowed',
                background: isCurrent
                  ? `linear-gradient(160deg, ${p.void}, ${p.abyss})`
                  : isDone ? p.abyss + 'aa' : 'transparent',
                borderBottom: `3px solid ${isCurrent ? p.bright : isDone ? p.core + '66' : 'transparent'}`,
                padding: '8px 6px 6px',
                transition: 'all 0.25s',
                opacity: canNav ? 1 : 0.3,
                position: 'relative', overflow: 'hidden',
              }}
            >
              {isCurrent && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${p.bright}, transparent)`,
                  animation: 'dataPulse 1.5s ease-in-out infinite',
                }} />
              )}
              {engineRunning && isCurrent && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: `linear-gradient(90deg, transparent 0%, ${p.bright}08 50%, transparent 100%)`,
                  backgroundSize: '200% 100%',
                  animation: 'autoFlow 1.2s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {/* 五行字：點擊複製意境說明 */}
                <CW
                  copy={ELEMENT_MEANING[s.element] ?? s.element}
                  title={ELEMENT_MEANING[s.element] ?? s.element}
                  color={isCurrent ? p.bright : isDone ? p.core : p.shadow}
                  size={13}
                >
                  <span style={{ fontFamily: 'serif', lineHeight: 1 }}>{s.element}</span>
                </CW>
                {/* 步驟號：點擊複製步驟模板文字 */}
                <CW
                  copy={s.copyTpl(reportId, reportDate)}
                  title={`步驟 ${s.num}：${s.label}`}
                  color={isCurrent ? p.bright : EMPEROR_UI.textDim}
                  size={9}
                >
                  <span style={{ fontFamily: 'monospace', lineHeight: 1 }}>{s.num}</span>
                </CW>
                {/* 步驟名稱：點擊複製步驟說明 */}
                <CW
                  copy={s.meaning}
                  title={s.meaning}
                  color={isCurrent ? p.text : isDone ? p.shadow : EMPEROR_UI.textMuted}
                  bold={isCurrent}
                  size={11}
                >
                  <span style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>{s.label}</span>
                </CW>
                {/* 副標：點擊複製副標文字 */}
                <CW
                  copy={s.sub}
                  title={`${s.label} · ${s.sub}`}
                  color={isCurrent ? p.core : EMPEROR_UI.textDim}
                  size={9}
                >
                  <span style={{ whiteSpace: 'nowrap', lineHeight: 1 }}>{s.sub}</span>
                </CW>
                {/* 徽章：點擊複製徽章值 */}
                {badge && (
                  <CW
                    copy={badge}
                    title={`${s.label} 狀態：${badge}`}
                    color={p.bright}
                    bold
                    size={9}
                  >
                    <span style={{
                      background: p.abyss, padding: '1px 5px', borderRadius: 3,
                      border: `1px solid ${p.shadow}`, fontFamily: 'monospace', marginTop: 2,
                      animation: isCurrent ? 'countUp 0.4s ease-out' : 'none',
                      display: 'inline-block',
                    }}>
                      {badge}
                    </span>
                  </CW>
                )}
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', padding: '0 2px',
                color: i < activeIdx ? EMPEROR_UI.textDim : '#1a1a10',
                fontSize: 16, userSelect: 'none', flexShrink: 0,
                ...(engineRunning && i === activeIdx - 1 ? {
                  color: p.bright, animation: 'arrowPulse 0.8s ease-in-out infinite',
                } : {}),
              }}>›</div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function DailyReportWorkbenchPage(): React.ReactElement {
  const [step, setStep] = useState<StepKey>('input');
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [personCount, setPersonCount] = useState<number | null>(null);
  const [auditPassed, setAuditPassed] = useState(false);
  const [ledStatus, setLedStatus] = useState<Record<string, 'pending' | 'success' | 'fail'>>({
    received: 'pending', parsed: 'pending', audited: 'pending', sorted: 'pending',
    announced: 'pending', broadcast: 'pending', line: 'pending',
    saved: 'pending', backedup: 'pending', logged: 'pending',
  });

  const [autoLog, setAutoLog] = useState<{ time: string; msg: string; ok: boolean }[]>([]);
  const [showLog, setShowLog] = useState(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isRebuilding, setIsRebuilding] = useState(false);

  const [engineRunning, setEngineRunning] = useState(false);

  // 🌍 載入真實引擎狀態
  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/system/status').then(r => r.json());
      if (res.success) {
        setEngineRunning(res.data.engine.running);
      }
    } catch (err) {
      console.error('無法讀取引擎狀態', err);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const t = setInterval(refreshStatus, 5000);
    return () => clearInterval(t);
  }, [refreshStatus]);

  const toggleEngine = async () => {
    const api = engineRunning ? '/api/v1/system/stop' : '/api/v1/system/boot';
    try {
      const res = await fetch(api, { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setEngineRunning(res.data.running);
        addLog(res.data.running ? '✅ AI 全域引擎啟動成功' : '⏹ AI 全域引擎已停止', true);
      }
    } catch (err) {
      addLog('❌ 引擎切換失敗', false);
    }
  };

  const addLog = useCallback((msg: string, ok = true) => {
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    setAutoLog(prev => [...prev.slice(-19), { time, msg, ok }]);
  }, []);

  function go(target: StepKey) {
    const def = STEPS.find(s => s.key === target);
    if (def?.canGo(reportId, reportDate)) setStep(target);
  }

  function handleParsed(payload: { reportId: number; reportDate: string; personCount: number }) {
    setReportId(payload.reportId);
    setReportDate(payload.reportDate);
    setPersonCount(payload.personCount);
    setStep('parse');
    setLedStatus(prev => ({ ...prev, received: 'success', parsed: 'success' }));
    addLog(`②解析完成｜共 ${payload.personCount} 人`, true);
    if (engineRunning) {
      addLog('⚡ 自動跳轉審計…', true);
      autoTimer.current = setTimeout(() => {
        setStep('audit');
        addLog('③ 審計啟動', true);
      }, 800);
    }
  }

  const runFullRebuild = useCallback(async () => {
    if (!reportDate) return;
    setIsRebuilding(true);
    addLog('🧪 呼叫後端 /rebuild 啟動全域整合解算...', true);
    try {
      const res = await fetch('/api/v1/dispatch/rebuild', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportDate }),
      }).then(r => r.json());

      if (res.success && res.auditResult === 'PASS') {
        addLog(`🧱 審計狀態：${res.auditResult} ✓`, true);
        addLog(`💾 歷史業績備份存檔成功 (SQLite)！版號：${res.version}`, true);
        setAuditPassed(true);
        setLedStatus(prev => ({ ...prev, audited: 'success', sorted: 'success', saved: 'success', backedup: 'success', logged: 'success' }));
        setStep('ranking');
      } else {
        // 規則七：審計失敗 → 後續流程全部停止，停在 audit 步驟
        addLog(`❌ 審計失敗：${res.message || '數據異常，流程鎖定'}`, false);
        setLedStatus(prev => ({ ...prev, audited: 'fail' }));
        setAuditPassed(false);
        // 不允許進入 ranking / announcement
      }
    } catch (err: any) {
      addLog(`❌ 系統連線阻斷：${err.message}`, false);
      setStep('ranking');
    } finally {
      setTimeout(() => setIsRebuilding(false), 900);
    }
  }, [reportDate, addLog]);

  function handleAuditPassed() {
    addLog('③ 智能審計 PASS ✓', true);
    runFullRebuild();
  }

  function handleParseConfirmed() {
    setStep('audit');
    addLog('② 解析確認 → 跳至審計', true);
  }

  function handleGoAnnouncement() {
    if (auditPassed) {
      setStep('announcement');
      addLog('④ 排名完成 → 公告生成', true);
    }
  }

  useEffect(() => () => { if (autoTimer.current) clearTimeout(autoTimer.current); }, []);

  // ⚡ 自動連鎖驅動：火 (排名) 點火推進至 金 (公告)
  useEffect(() => {
    if (!engineRunning) return;
    if (step === 'ranking' && auditPassed) {
      addLog('④ 排名計算中，1.5 秒後自動生成公告…', true);
      const t = setTimeout(() => {
        setStep('announcement');
        setLedStatus(prev => ({ ...prev, announced: 'success', broadcast: 'success', line: 'success' }));
        addLog('④ 自動跳轉至公告生成 ✅', true);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [step, auditPassed, engineRunning, addLog]);

  const activeStepDef = STEPS.find(s => s.key === step)!;

  const p = activeStepDef.palette;

  // 標題列：點擊複製當前整體狀態摘要
  const statusSummary = [
    `結算日：${reportDate || '未指定'}`,
    reportId ? `報表：#${reportId}` : '報表：待建立',
    personCount !== null ? `人數：${personCount}人` : '',
    auditPassed ? '審計：PASS' : '',
    `當前步驟：${activeStepDef.label}`,
  ].filter(Boolean).join('｜');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: EMPEROR_UI.pageBg }}>
      <style>{`
        @keyframes dataPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes autoFlow  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes arrowPulse { 0%,100%{opacity:0.4;transform:translateX(0)} 50%{opacity:1;transform:translateX(2px)} }
        @keyframes countUp   { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes logSlide  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        @keyframes scanLine  { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
      `}</style>

      {/* ── Sticky 頂部 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: `linear-gradient(to bottom, ${EMPEROR.obsidian}f8, ${EMPEROR.obsidianMid}f8)`,
        borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '8px 18px' }}>

          {/* 標題列 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: EMPEROR_UI.textPrimary, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* 📋 點擊複製整體狀態摘要 */}
                <CW copy={statusSummary} title="複製今日狀態摘要">
                  <span>📋</span>
                </CW>
                {/* 標題名稱點擊複製 */}
                <CW copy="每日業績核心樞紐｜AI 自動貫穿派單系統" title="複製系統名稱">
                  <span>每日業績核心樞紐</span>
                </CW>
                {/* 工作台標籤：點擊顯示五步流程說明 */}
                <CW
                  copy={STEPS.map(s => `${s.num}${s.label}（${s.sub}）`).join(' → ')}
                  title="複製完整五步流程"
                  color={TU.text}
                >
                  <span style={{ fontSize: 11, background: TU.void, border: `1px solid ${TU.shadow}`, padding: '2px 10px', borderRadius: 4, letterSpacing: '0.1em' }}>工作台</span>
                </CW>
                {/* 核心 AI 引擎實體開關 (取代假 autoMode) */}
                <button
                  onClick={toggleEngine}
                  title={engineRunning ? 'AI 引擎運作中（點擊停止）' : 'AI 引擎已停止（點擊啟動）'}
                  style={{
                    border: `1px solid ${engineRunning ? HUO.shadow : EMPEROR_UI.borderMain}`,
                    borderRadius: 6, padding: '2px 10px', fontSize: 10, fontWeight: 900,
                    cursor: 'pointer',
                    background: engineRunning ? `linear-gradient(135deg, ${HUO.abyss}, ${HUO.void})` : EMPEROR_UI.cardBg,
                    color: engineRunning ? HUO.bright : EMPEROR_UI.textDim,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    boxShadow: engineRunning ? `0 0 8px ${HUO.bright}44` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{ fontSize: 11 }}>{engineRunning ? '⚡' : '⏸'}</span>
                  {engineRunning ? 'AI 全域引擎 ON' : '引擎已停止'}
                </button>
              </h1>
            </div>

            {/* 狀態徽章 + 日誌按鈕 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                {
                  label: '報表',
                  val: reportId ? `#${reportId}${personCount !== null ? ` · ${personCount}人` : ''}` : '待建立',
                  ok: Boolean(reportId),
                  palette: MU,
                  copyVal: reportId ? `報表編號 #${reportId}，共 ${personCount ?? 0} 人` : '尚未建立報表',
                  tipLabel: '報表編號',
                },
                {
                  label: '結算日',
                  val: reportDate || '尚未指定',
                  ok: Boolean(reportDate),
                  palette: SHUI,
                  copyVal: reportDate || '未指定',
                  tipLabel: '結算日期',
                },
                {
                  label: '審計',
                  val: auditPassed ? '✓ PASS' : reportId ? '待審計' : '—',
                  ok: auditPassed,
                  palette: TU,
                  copyVal: auditPassed ? '審計 PASS｜天地盤/邏輯盤/累積盤全通過' : '待審計',
                  tipLabel: '審計狀態',
                },
              ].map(({ label, val, ok, palette: pl, copyVal, tipLabel }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: ok ? pl.abyss : EMPEROR.obsidian,
                  border: `1px solid ${ok ? pl.shadow : EMPEROR_UI.borderMain}`,
                  borderRadius: 10, padding: '5px 12px',
                  boxShadow: ok ? `0 0 8px ${pl.bright}33` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {/* 標籤名稱也可點擊，複製說明 */}
                  <CW copy={tipLabel} title={tipLabel} color={ok ? pl.text : EMPEROR_UI.textDim} size={10}>
                    <span style={{ letterSpacing: '0.08em' }}>{label}</span>
                  </CW>
                  {/* 值：複製有意義的說明文字 */}
                  <CW copy={copyVal} title={`${tipLabel}：${copyVal}`} color={ok ? pl.bright : EMPEROR_UI.textMuted} bold>
                    <span style={{ fontSize: 12 }}>{val}</span>
                  </CW>
                </div>
              ))}

              {/* 日誌按鈕：點擊展開/收起，長按複製全部日誌 */}
              <button
                onClick={() => {
                  setShowLog(v => !v);
                  if (Object.values(ledStatus).every(v => v === 'success')) {
                    setTimeout(() => setLedStatus({ received: 'pending', parsed: 'pending', audited: 'pending', sorted: 'pending', announced: 'pending', broadcast: 'pending', line: 'pending', saved: 'pending', backedup: 'pending', logged: 'pending' }), 3000);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  const all = autoLog.map(l => `[${l.time}] ${l.msg}`).join('\n');
                  navigator.clipboard.writeText(all).catch(() => {});
                }}
                style={{
                  border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 6,
                  padding: '4px 10px', fontSize: 10, cursor: 'pointer',
                  background: showLog ? EMPEROR_UI.cardBg : 'transparent',
                  color: EMPEROR_UI.textDim, fontWeight: 700,
                }}
                title="點擊展開日誌｜右鍵複製全日誌"
              >
                📜 日誌 {autoLog.length > 0 ? `(${autoLog.length})` : ''}
              </button>

              {/* 🔮 7段全自動連鎖 LED 燈排 (開工版核心要求) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.4)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(0,212,255,.15)', boxShadow: 'inset 0 0 10px rgba(0,212,255,0.05)' }}>
                {[
                  { key: 'received',  label: '接收' },
                  { key: 'parsed',    label: '解析' },
                  { key: 'audited',   label: '審計' },
                  { key: 'sorted',    label: '排序' },
                  { key: 'announced', label: '公告' },
                  { key: 'broadcast', label: '播報' },
                  { key: 'line',      label: 'LINE' },
                  { key: 'saved',     label: '存檔' },
                  { key: 'backedup',  label: '備份' },
                  { key: 'logged',    label: '日誌' },
                ].map((led) => {
                  const status = ledStatus[led.key];
                  const isOn = status === 'success';
                  const color = isOn ? '#00FF9C' : '#334155';
                  return (
                    <div key={led.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }} title={`${led.label} 狀態：${status === 'success' ? '正常連鎖' : '等待中'}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: isOn ? `0 0 8px ${color}` : 'none', transition: 'all 0.4s ease-out' }} />
                      <span style={{ fontSize: 9, color: isOn ? '#fff' : '#64748b', fontWeight: 900, fontFamily: 'sans-serif' }}>{led.label}</span>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* 五步自動貫穿進度條 */}
          <AutoPipeline
            step={step}
            reportId={reportId}
            auditPassed={auditPassed}
            personCount={personCount}
            reportDate={reportDate}
            engineRunning={engineRunning}
            onStepClick={go}
          />

          {/* 自動日誌列（展開時）── 每筆日誌可點擊複製 */}
          {showLog && autoLog.length > 0 && (
            <div style={{
              marginTop: 8,
              background: EMPEROR.obsidian,
              border: `1px solid ${EMPEROR_UI.borderAccent}`,
              borderRadius: 8, padding: '6px 10px',
              maxHeight: 100, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 2,
            }}>
              {autoLog.slice().reverse().map((log, i) => (
                <div key={i} style={{
                  fontSize: 10, fontFamily: '"Fira Code", monospace',
                  color: log.ok ? MU.text : HUO.text,
                  display: 'flex', gap: 8,
                  animation: i === 0 ? 'logSlide 0.2s ease-out' : 'none',
                }}>
                  {/* 時間戳：複製時間 */}
                  <CW copy={log.time} title="複製此筆時間" color={EMPEROR_UI.textDim} size={10}>
                    <span style={{ flexShrink: 0 }}>{log.time}</span>
                  </CW>
                  {/* 訊息：複製整行 */}
                  <CW
                    copy={`[${log.time}] ${log.msg}`}
                    title="複製此筆日誌"
                    color={log.ok ? MU.text : HUO.text}
                    size={10}
                  >
                    <span>{log.msg}</span>
                  </CW>
                </div>
              ))}
            </div>
          )}

          {/* 當前步驟提示條 */}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: p.text }}>
            {/* 五行元素字：複製元素意境 */}
            <CW
              copy={ELEMENT_MEANING[activeStepDef.element] ?? activeStepDef.element}
              title={ELEMENT_MEANING[activeStepDef.element] ?? activeStepDef.element}
              color={p.bright}
              size={13}
            >
              <span style={{ fontFamily: 'serif' }}>{activeStepDef.element}</span>
            </CW>
            {/* 步驟號+名稱：複製步驟模板 */}
            <CW
              copy={activeStepDef.copyTpl(reportId, reportDate)}
              title={`複製步驟文字：${activeStepDef.label}`}
              color={p.text}
              bold
              size={11}
            >
              <span>{activeStepDef.num} {activeStepDef.label}</span>
            </CW>
            {/* 副標：複製副標說明 */}
            <CW
              copy={`${activeStepDef.label}｜${activeStepDef.sub}`}
              title={`複製：${activeStepDef.sub}`}
              color={p.core}
              size={11}
            >
              <span>— {activeStepDef.sub}</span>
            </CW>

            {/* 自動貫穿狀態標籤 */}
            {engineRunning && step !== 'announcement' && (
              <CW
                copy="⚡ 引擎連鎖貫穿中｜輸入→解析→審計→排名→公告 全自動串連"
                title="複製自動連鎖說明"
                color={HUO.text}
                size={10}
              >
                <span style={{
                  marginLeft: 'auto', background: HUO.abyss,
                  border: `1px solid ${HUO.shadow}`, borderRadius: 4,
                  padding: '1px 8px', fontWeight: 700,
                }}>
                  ⚡ 自動貫穿啟動中
                </span>
              </CW>
            )}

            {/* 排名完成後「→ 跳公告」捷徑 */}
            {step === 'ranking' && auditPassed && (
              <button
                onClick={handleGoAnnouncement}
                style={{
                  marginLeft: 'auto', border: `1px solid ${JIN.shadow}`,
                  borderRadius: 6, padding: '2px 10px', fontSize: 10,
                  cursor: 'pointer', background: JIN.void, color: JIN.bright, fontWeight: 900,
                }}
              >
                ⑤ → 直跳公告生成
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 主體內容 ── */}
      <div style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%' }}>
        {step === 'input' && <DailyReportInputPage onParsed={handleParsed} />}
        {step === 'parse' && reportId && <ParseResultConfirmPage reportId={reportId} onAudit={handleParseConfirmed} />}
        {step === 'audit' && reportId && <AuditCheckPage reportId={reportId} onPassed={handleAuditPassed} />}
        {step === 'ranking' && <RankingDispatchPage />}
        {step === 'announcement' && <AnnouncementOutputPage />}
      </div>

      {/* 🚀 AI 算力穿梭中樞 全螢幕遮罩 (優化、提醒、意境排出) */}
      {isRebuilding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: `radial-gradient(circle at center, rgba(0,0,0,0.92) 0%, rgba(5,5,10,0.98) 100%)`,
          backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 24, animation: 'countUp 0.3s ease-out',
        }}>
          {/* 光環與掃描線 */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{
              width: '150%', height: '1px', background: `linear-gradient(90deg, transparent, ${HUO.bright}, transparent)`,
              position: 'absolute', top: '40%', left: '-25%', transform: 'rotate(-10deg)',
              animation: 'scanLine 3s linear infinite', opacity: 0.3,
            }} />
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              width: 70, height: 70, borderRadius: '50%',
              border: `3px solid ${EMPEROR_UI.borderAccent}`,
              borderTopColor: MU.bright,
              animation: 'spin 1.2s cubic-bezier(0.53, 0.21, 0.29, 0.83) infinite',
            }} />
            <div style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, color: MU.bright, fontWeight: 900, textShadow: `0 0 10px ${MU.bright}`,
            }}>AI</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.1em', textShadow: '0 0 12px rgba(255,255,255,0.4)' }}>
              🔮 啟動 AI 全域動能貫穿核心
            </div>
            <div style={{ fontSize: 11, color: EMPEROR_UI.textDim, marginTop: 4, letterSpacing: '0.04em' }}>
              數據多線程併發解算 · 每日 Snapshot 自動優化備份
            </div>
          </div>

          {/* 滾動排字 Terminal */}
          <div style={{
            width: '90%', maxWidth: 450, background: '#050508',
            border: `1px solid ${EMPEROR_UI.borderAccent}`, borderRadius: 12,
            padding: '12px 16px', height: 160, overflowY: 'hidden',
            display: 'flex', flexDirection: 'column', gap: 4,
            boxShadow: `0 8px 32px rgba(0,0,0,0.8), inset 0 0 16px rgba(0,0,0,0.9)`,
            position: 'relative',
          }}>
            {autoLog.slice(-5).map((log, i) => (
              <div key={i} style={{
                fontSize: 11, fontFamily: '"Fira Code", monospace',
                color: log.ok ? MU.bright : HUO.text,
                animation: 'logSlide 0.2s ease-out',
                display: 'flex', gap: 6, alignItems: 'center',
              }}>
                <span style={{ color: EMPEROR_UI.textMuted }}>▶</span>
                <span style={{ color: EMPEROR_UI.textDim }}>[{log.time}]</span>
                <span style={{ letterSpacing: '0.02em' }}>{log.msg}</span>
              </div>
            ))}
            <div className="soul-cursor" style={{ fontSize: 11, color: MU.bright, marginLeft: 16 }} />
          </div>

          <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, marginTop: -8 }}>
            © 兆櫃AI 數據中樞 · 系統自動備份儲存中
          </div>
        </div>
      )}
    </div>
  );
}
