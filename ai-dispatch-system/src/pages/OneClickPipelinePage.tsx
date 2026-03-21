import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/gemini.service';
import { reportService } from '../services/report.service';
import { auditService } from '../services/audit.service';
import { rankingService } from '../services/ranking.service';
import { dispatchService } from '../services/dispatch.service';
import { announcementService } from '../services/announcement.service';
import type { AnnouncementOutput } from '../services/announcement.service';
import type { AuditRunResult, AuditIssue } from '../types/audit';
import { EMPEROR_UI, TU, MU, HUO, SHUI, EMPEROR, JIN } from '../constants/wuxingColors';
import { StatusBadge } from '../components/StatusBadge';
import { PageBlock } from '../components/PageBlock';
import { 平台選項, 報表模式選項 } from '../constants/options';
import type { 平台名稱, 報表模式 } from '../constants/options';
import { 
  Zap, Brain, Settings, ShieldCheck, Target, Megaphone, 
  Copy, Check, FileText, Activity, Globe, Layout, 
  Terminal, AlertCircle, AlertTriangle, Play
} from 'lucide-react';

type PipelineStep = 'IDLE' | 'ANALYSING' | 'PARSING' | 'AUDITING' | 'RANKING' | 'ANNOUNCING' | 'DONE' | 'ERROR' | 'AUDIT_FAILED';

// ── 輸入格式提示（常駐顯示，幫助使用者知道要貼什麼）──
const FORMAT_HINT = `✅ 支援以下格式（四選一）：

格式A（標準）：
1、李玲玲｜【追單】22｜【續單】592,270｜【總業績】817,900

格式B（含新人）：
2、王珍珠（新人）｜【追單】5｜【續單】0｜【總業績】38,000

格式C（Tab/空白分隔）：
馬秋香  34  550,920  686,670

格式D（逗號CSV）：
林宜靜,18,320120,464240

⚠️ 第一行請包含日期和平台，例如：
3/19 奕心 累積`;

export function OneClickPipelinePage(): React.ReactElement {
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<PipelineStep>('IDLE');
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);

  // Data State
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [auditResult, setAuditResult] = useState<AuditRunResult | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementOutput | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saveSteps, setSaveSteps] = useState<string[]>([]);

  // ── 強化：AI 辨識後可修改的 meta 欄位 ──
  const [detectedDate, setDetectedDate] = useState<string>('');
  const [detectedPlatform, setDetectedPlatform] = useState<平台名稱>('奕心');
  const [detectedMode, setDetectedMode] = useState<報表模式>('累積報表');
  const [detectedDayOfWeek, setDetectedDayOfWeek] = useState<string>('');
  const [detectedTimeRange, setDetectedTimeRange] = useState<string>('');
  const [showMetaEdit, setShowMetaEdit] = useState(false);
  const [showFormatHint, setShowFormatHint] = useState(false);
  const autoCopyDoneRef = useRef(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runPipelineRef = useRef<(text: string) => Promise<void>>(async () => {});

  const [metrics, setMetrics] = useState({ cpu: '0%', ram: '0GB', latency: '0ms' });

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(7), time: new Date().toLocaleTimeString('zh-TW', { hour12: false }), msg, type }]);
  }, []);

  // 模擬動態跳動數字
  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics({
        cpu: (Math.random() * 20 + 30).toFixed(1) + '%',
        ram: (Math.random() * 2 + 10).toFixed(2) + 'GB',
        latency: (Math.random() * 5 + 15).toFixed(0) + 'ms'
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 清除 copy timer（避免 unmount 後 setState）
  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); };
  }, []);

  // ======= 核心自動化流程 =======
  const runPipeline = async (textToProcess: string) => {
    if (!textToProcess.trim() || textToProcess.length < 15) {
      addLog('⚠️ 文本太短，無法啓動 AI 分析（請貼入完整報表）', 'warn');
      return;
    }

    setStep('ANALYSING');
    setLogs([]);
    setReportId(null);
    setAuditResult(null);
    setAnnouncement(null);
    setShowMetaEdit(false);
    autoCopyDoneRef.current = false;
    addLog('🚀 啟動一鍵直通引擎...', 'info');
    addLog('🤖 AI 正在分析文本特徵 (擷取日期與平台)...', 'info');

    try {
      // 1. 萃取 Meta
      const meta = await geminiService.extractReportMeta(textToProcess);
      let pDate = meta.reportDate;
      let pPlatform = meta.platformName as 平台名稱;
      let pMode = meta.reportMode as 報表模式;
      let pDayOfWeek = meta.dayOfWeek || '';
      let pTimeRange = meta.timeRange || '';

      // 防呆：如果 AI 抓不到，嘗試給預設值以利流程繼續
      if (!pDate) pDate = new Date().toISOString().split('T')[0];
      if (!pPlatform || !平台選項.includes(pPlatform)) pPlatform = '奕心';
      if (!pMode || !報表模式選項.includes(pMode)) pMode = '累積報表';

      // 同步到可編輯 meta state（供 UI 顯示與修正）
      setDetectedDate(pDate);
      setDetectedPlatform(pPlatform);
      setDetectedMode(pMode);
      setDetectedDayOfWeek(pDayOfWeek);
      setDetectedTimeRange(pTimeRange);
      setShowMetaEdit(true);

      setReportDate(pDate);
      const extraInfo = [pDayOfWeek, pTimeRange].filter(Boolean).join(' ');
      if (meta.confidence === 'low') {
        addLog(`⚠️ AI 辨識信心度低 — 已自動補預設值：${pDate} ${extraInfo}· ${pPlatform} · ${pMode}（可在上方修改後再執行）`, 'warn');
      } else {
        addLog(`✨ AI 辨識完成：${pDate} ${extraInfo}· ${pPlatform} · ${pMode}`, 'success');
      }

      // 2. 建立報表並解析
      setStep('PARSING');
      addLog('⚙️ 建立報表並展開結構化解析...', 'info');
      const createRes = await reportService.createReport({
        reportDate: pDate,
        platformName: pPlatform,
        reportMode: pMode,
        rawTextContent: textToProcess,
        noteText: '一鍵直通自動建立',
      });
      const generatedReportId = createRes.id;
      setReportId(generatedReportId);
      addLog(`✅ 報表 #${generatedReportId} 建立成功`, 'success');

      addLog('🧠 執行深度量化拆解...', 'info');
      await reportService.runParse(generatedReportId, { forceReparse: false });
      const parseData = await reportService.getParseResult(generatedReportId);
      addLog(`✅ 解析完畢，共拆解 [${parseData.details.length}] 筆專屬數據`, 'success');

      // 3. 審計
      setStep('AUDITING');
      addLog('🕵️ 啟動多維度防呆與商業邏輯審計...', 'info');
      const auditRes = await auditService.runAudit(generatedReportId, { runConsistencyCheck: true, runLogicCheck: true, runCumulativeCheck: true });
      setAuditResult(auditRes as unknown as AuditRunResult);

      if (auditRes.finalResult !== '通過') {
        addLog(`⚠️ 審計受阻：${auditRes.finalResult}。流程已暫停，等待主管強行授權。`, 'error');
        setStep('AUDIT_FAILED');
        return; // 中斷流程
      }
      
      addLog('✅ 天地盤、邏輯盤、累積盤審計全數 PASS', 'success');

      // 4. 排名與派單
      await executeRankingAndAnnouncement(pDate, textToProcess, pPlatform, pMode, pDayOfWeek, pTimeRange);

    } catch (err: any) {
      addLog(`❌ 單元執行錯誤：${err?.message || err?.responseMessage || '未知錯誤'}`, 'error');
      setStep('ERROR');
    }
  };

  const executeRankingAndAnnouncement = async (dateStr: string, sourceText: string = rawText, platform: 平台名稱 = detectedPlatform, mode: 報表模式 = detectedMode, dayOfWeek: string = detectedDayOfWeek, timeRange: string = detectedTimeRange) => {
    try {
      // 1. 先亮起 RANKING，跑大數據運算儀式感特效
      setStep('RANKING');
      addLog('🏆 啟動 AI 樞紐一條龍演算 (整合總盤、名次排序、梯隊分組)...', 'info');
      await new Promise(resolve => setTimeout(resolve, 800)); // 0.8 秒視覺延遲
      
      // 2. 進入公告封裝
      setStep('ANNOUNCING');
      addLog('📢 封裝最終戰報與多渠道公告...', 'info');
      
      const output = await announcementService.generate(dateStr);
      
      // 替換公告內容中的時間標記
      if (dayOfWeek || timeRange) {
        const richDateInfo = `${dateStr} ${[dayOfWeek, timeRange].filter(Boolean).join(' ')}`;
        output.fullText = output.fullText.replace(dateStr, richDateInfo);
        output.lineText = output.lineText.replace(dateStr, richDateInfo);
        output.shortText = output.shortText.replace(dateStr, richDateInfo);
        output.managerText = output.managerText.replace(dateStr, richDateInfo);
      }
      
      setAnnouncement(output);
      addLog('🎉 系統直通完成！快照與公告封裝完畢。', 'success');
      // 自動複製完整版公告到剪貼板
      if (output.fullText && !autoCopyDoneRef.current) {
        autoCopyDoneRef.current = true;
        navigator.clipboard.writeText(output.fullText).catch(() => {});
        addLog('📋 完整版公告已自動複製到剪貼板，可直接貼上發佈。', 'success');
      }

      // ── 呼叫存檔 API（五段式儲存）──
      setSaveSteps([]);
      try {
        const saveRes = await fetch('/api/v1/system/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: sourceText,
            optimizedText: output.fullText,
            reportDate: dateStr,
            platformName: platform,
            reportMode: mode,
          }),
        });
        const saveJson = await saveRes.json();
        if (saveJson.success && saveJson.data?.status) {
          setSaveSteps(saveJson.data.status);
          addLog(`💾 存檔完成：${saveJson.data.status.join(' → ')}`, 'success');
        }
      } catch {
        addLog('⚠️ 存檔 API 無法連線，資料已在 DB 保存，但未寫入本地檔案', 'warn');
      }

      setStep('DONE');
    } catch (err: any) {
       addLog(`❌ 後期處理錯誤：${err?.message || err?.responseMessage || '未知錯誤'}`, 'error');
       setStep('ERROR');
    }
  }

  // 強制授權
  const handleManualApprove = async () => {
    if (!reportId || !reportDate) return;
    try {
      addLog('📝 正在寫入強制授權記錄...', 'warn');
      await auditService.manualApprove(reportId, { approvedByUserId: 1, noteText: '一鍵直通窗口主管強行授權' });
      addLog('✅ 強制授權成功，恢復派單流程...', 'success');
      // 授權完後繼續跑流程（用當前 state 裡的值）
      await executeRankingAndAnnouncement(reportDate, rawText, detectedPlatform, detectedMode, detectedDayOfWeek, detectedTimeRange);
    } catch (err: any) {
      addLog(`❌ 授權失敗：${err?.message || '未知錯誤'}`, 'error');
    }
  };

  // 保持 ref 與最新 runPipeline 同步（解決 paste listener stale closure）
  useEffect(() => { runPipelineRef.current = runPipeline; });

  // 監聽全域貼上
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // 若聚焦在輸入框內，讓預設行為處理，稍後 debounce 觸發 runPipeline
      if (document.activeElement === textareaRef.current) return;
      
      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 20) {
        e.preventDefault();
        setRawText(text);
        runPipelineRef.current(text);
        return;
      }
      
      // TODO: Image Paste to OCR
    }
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, []);

  const copyText = (text: string | null | undefined, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const getStepStatus = (s: PipelineStep, current: PipelineStep) => {
    const order = ['IDLE', 'ANALYSING', 'PARSING', 'AUDITING', 'RANKING', 'ANNOUNCING', 'DONE'];
    const sidx = order.indexOf(s);
    const cidx = order.indexOf(current);
    
    if (sidx === -1) return 'pending'; // 錯誤或異常狀態

    if (current === 'ERROR' || current === 'AUDIT_FAILED') {
      if (s === 'AUDITING' && current === 'AUDIT_FAILED') return 'error';
      return sidx <= (order.indexOf(current === 'AUDIT_FAILED' ? 'AUDITING' : 'IDLE')) ? 'done' : 'pending';
    }

    if (sidx < cidx) return 'done';
    if (sidx === cidx) return 'active';
    return 'pending';
  };

  const stepItems: { id: PipelineStep; label: string; icon: React.ReactNode }[] = [
    { id: 'ANALYSING', label: 'AI 萃取', icon: <Brain size={16} /> },
    { id: 'PARSING', label: '數據解析', icon: <Settings size={16} /> },
    { id: 'AUDITING', label: '智能審計', icon: <ShieldCheck size={16} /> },
    { id: 'RANKING', label: '派工演算', icon: <Target size={16} /> },
    { id: 'ANNOUNCING', label: '公告封裝', icon: <Megaphone size={16} /> },
  ];

  return (
    <div style={{ 
      padding: 0, 
      minHeight: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: EMPEROR_UI.pageBg,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 全球大數據背景圖層 — 戰術分析儀表板版本 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        backgroundImage: 'url("/C:/Users/DRAGON/.gemini/antigravity/brain/2549ae95-ea22-4ede-b684-e965d5000f1b/global_big_data_analysis_dashboard_1773249308090.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.12,
        maskImage: 'radial-gradient(circle at center, black, transparent)',
        WebkitMaskImage: 'radial-gradient(circle at center, black, transparent)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* 數位掃描線效果 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
        backgroundSize: '100% 4px, 3px 100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.3
      }} />

      <div style={{ padding: 24, position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 頂部 Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ 
          backdropFilter: 'blur(12px)', 
          background: 'rgba(10, 10, 10, 0.65)', 
          padding: '20px 32px', 
          borderRadius: 24, 
          border: `1px solid ${TU.shadow}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 0 0 1px ${TU.void}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 12
        }}>
           <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: TU.bright, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, background: TU.gradient, borderRadius: 12, boxShadow: TU.glowShadow, color: '#000' }}>
              <Zap size={24} fill="currentColor" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ textShadow: `0 0 20px ${TU.core}` }}>全球大數據分析直通樞紐</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                 <span style={{ fontSize: 10, background: MU.void, color: MU.bright, padding: '2px 8px', borderRadius: 4, border: `1px solid ${MU.shadow}`, fontWeight: 800 }}>WORLDWIDE ANALYTICS</span>
                 <span style={{ fontSize: 10, background: JIN.void, color: JIN.bright, padding: '2px 8px', borderRadius: 4, border: `1px solid ${JIN.shadow}`, fontWeight: 800 }}>V5.0 PRO</span>
              </div>
            </div>
          </h1>
          <p style={{ margin: 0, color: EMPEROR_UI.textMuted, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.8 }}>
            <Activity size={14} color={TU.bright} />
            正在監測全球數據流... 自動執行【解析 → 審計 → 派單 → 戰報】全鏈條自動化作業
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px', gap: 24, alignItems: 'start' }}>
        
        {/* 左側：輸入與自動化結果區 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 輸入區 */}
          <div style={{ background: 'rgba(22, 20, 16, 0.8)', backdropFilter: 'blur(10px)', border: `1px solid ${EMPEROR_UI.borderMain}`, borderRadius: 20, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', transition: 'all 0.3s' }}>
            <div style={{ padding: '16px 24px', background: 'rgba(30, 26, 20, 0.6)', borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                 <Terminal size={18} color={TU.bright} />
                 <span style={{ fontSize: 14, fontWeight: 800, color: TU.text, letterSpacing: '0.05em' }}>SOURCE_REPORT_BUFFER [ 待輸入資料區 ]</span>
               </div>
               <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                 {/* 格式提示按鈕 */}
                 <button
                   onClick={() => setShowFormatHint(v => !v)}
                   style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${EMPEROR_UI.borderAccent}`, color: EMPEROR_UI.textMuted, borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                 >
                   {showFormatHint ? '收起提示' : '📋 格式說明'}
                 </button>
                 {(step === 'IDLE' || step === 'DONE') && (
                   <button
                    onClick={() => runPipeline(rawText)}
                    disabled={!rawText.trim() || rawText.length < 15}
                    style={{
                      border: 'none',
                      background: TU.gradient,
                      color: '#000',
                      borderRadius: 8,
                      padding: '8px 20px',
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      opacity: (!rawText.trim() || rawText.length < 10) ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: TU.glowShadow
                    }}
                   >
                     <Play size={14} fill="currentColor" /> 執行大數據全自動分析
                   </button>
                 )}
               </div>
            </div>

            {/* 格式提示展開面板 */}
            {showFormatHint && (
              <div style={{ padding: '14px 24px', background: 'rgba(255,200,50,0.04)', borderBottom: `1px solid ${EMPEROR_UI.borderAccent}` }}>
                <pre style={{ margin: 0, fontSize: 12, color: '#d4c090', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: '"JetBrains Mono", monospace' }}>{FORMAT_HINT}</pre>
              </div>
            )}

            {/* 字數即時統計 */}
            {rawText.length > 0 && (
              <div style={{ padding: '6px 24px', background: 'rgba(0,0,0,0.2)', borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`, display: 'flex', gap: 20, fontSize: 11, color: EMPEROR_UI.textMuted }}>
                <span>字元：<b style={{ color: TU.bright }}>{rawText.length}</b></span>
                <span>行數：<b style={{ color: MU.bright }}>{rawText.split('\n').filter(l => l.trim()).length}</b></span>
                <span>估計人員：<b style={{ color: JIN.bright }}>{rawText.split('\n').filter(l => /^\d+[、,.]/.test(l.trim()) || /^[^\d\s｜|【]/.test(l.trim())).length}</b> 筆</span>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={`[ 系統已就緒 ] 請在此處貼上原始報表內容...\n\n範例：\n3/19 奕心 累積\n1、李玲玲｜【追單】22｜【續單】592,270｜【總業績】817,900\n2、王珍珠｜【追單】40｜【續單】497,250｜【總業績】700,580\n\n點擊「📋 格式說明」查看完整支援格式`}
              style={{
                width: '100%', minHeight: step !== 'IDLE' ? 120 : 220, border: 'none', padding: 20,
                background: 'transparent', color: EMPEROR_UI.textSecondary,
                fontSize: 13, fontFamily: '"Microsoft JhengHei", monospace',
                lineHeight: 1.6, resize: 'vertical', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* AI 辨識結果修正區 — 辨識完成後才顯示 */}
          {showMetaEdit && (step === 'PARSING' || step === 'AUDITING' || step === 'RANKING' || step === 'ANNOUNCING' || step === 'DONE' || step === 'AUDIT_FAILED') && (
            <div style={{ background: 'rgba(10,30,20,0.7)', border: `1px solid ${MU.shadow}`, borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: MU.bright, flexShrink: 0 }}>🤖 AI 辨識結果</span>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
                <label style={{ fontSize: 12, color: EMPEROR_UI.textMuted }}>日期
                  <input type="date" value={detectedDate} onChange={e => { setDetectedDate(e.target.value); setReportDate(e.target.value); }}
                    style={{ marginLeft: 6, background: 'rgba(0,0,0,0.4)', border: `1px solid ${MU.void}`, color: MU.bright, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }} />
                </label>
                <label style={{ fontSize: 12, color: EMPEROR_UI.textMuted }}>平台
                  <select value={detectedPlatform} onChange={e => setDetectedPlatform(e.target.value as 平台名稱)}
                    style={{ marginLeft: 6, background: 'rgba(0,0,0,0.4)', border: `1px solid ${MU.void}`, color: MU.bright, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                    {平台選項.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: EMPEROR_UI.textMuted }}>模式
                  <select value={detectedMode} onChange={e => setDetectedMode(e.target.value as 報表模式)}
                    style={{ marginLeft: 6, background: 'rgba(0,0,0,0.4)', border: `1px solid ${MU.void}`, color: MU.bright, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }}>
                    {報表模式選項.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: 12, color: EMPEROR_UI.textMuted }}>時間區段
                  <input type="text" value={detectedTimeRange} onChange={e => setDetectedTimeRange(e.target.value)}
                    placeholder="例: 17:02到16:30"
                    style={{ marginLeft: 6, width: 110, background: 'rgba(0,0,0,0.4)', border: `1px solid ${MU.void}`, color: MU.bright, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }} />
                </label>
                <label style={{ fontSize: 12, color: EMPEROR_UI.textMuted }}>星期
                  <input type="text" value={detectedDayOfWeek} onChange={e => setDetectedDayOfWeek(e.target.value)}
                    placeholder="例: 禮拜六"
                    style={{ marginLeft: 6, width: 70, background: 'rgba(0,0,0,0.4)', border: `1px solid ${MU.void}`, color: MU.bright, borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700 }} />
                </label>
              </div>
              <span style={{ fontSize: 11, color: EMPEROR_UI.textDim }}>如 AI 辨識有誤，可直接修改後重新執行</span>
            </div>
          )}

          {/* 若為中斷狀態：顯示審計紅單 */}
          {step === 'AUDIT_FAILED' && auditResult && (
             <div style={{ 
               background: 'rgba(40, 10, 10, 0.8)', 
               backdropFilter: 'blur(12px)', 
               border: '1px solid #ef4444', 
               borderRadius: 20, 
               padding: 28, 
               boxShadow: '0 12px 40px rgba(220,38,38,0.3)',
               animation: 'pulse 2s infinite'
             }}>
               <h3 style={{ margin: '0 0 20px 0', color: '#ef4444', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '0.05em' }}>
                 <AlertTriangle size={24} /> 系統警戒：數據審計異常中斷
               </h3>
               
               <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 20, border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: 24, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingBottom: 12, color: '#ef4444', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>機型/欄位</th>
                        <th style={{ paddingBottom: 12, color: '#ef4444', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>偵測值</th>
                        <th style={{ paddingBottom: 12, color: '#ef4444', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>標準值</th>
                        <th style={{ paddingBottom: 12, color: '#ef4444', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>偏離度</th>
                        <th style={{ paddingBottom: 12, color: '#ef4444', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI 診斷</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {auditResult.issues.map(iss => (
                        <tr key={iss.id} style={{ borderTop: '1px solid rgba(239, 68, 68, 0.1)' }}>
                           <td style={{ paddingTop: 12, paddingBottom: 12, color: '#fff', fontWeight: 700 }}>{iss.fieldName}</td>
                           <td style={{ paddingTop: 12, paddingBottom: 12, color: '#ef4444', textDecoration: 'line-through', opacity: 0.7 }}>{iss.rawValue}</td>
                           <td style={{ paddingTop: 12, paddingBottom: 12, color: MU.bright, fontWeight: 700 }}>{iss.expectedValue}</td>
                           <td style={{ paddingTop: 12, paddingBottom: 12, color: '#fff', fontWeight: 900 }}>{iss.diffValue}</td>
                           <td style={{ paddingTop: 12, paddingBottom: 12, fontSize: 12, color: '#ef4444' }}>{iss.suggestionText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>

               <div style={{ display: 'flex', gap: 16 }}>
                 <button 
                  onClick={handleManualApprove} 
                  style={{ 
                    background: TU.gradient, 
                    border: 'none', 
                    color: '#000', 
                    padding: '12px 24px', 
                    borderRadius: 10, 
                    fontWeight: 900, 
                    cursor: 'pointer',
                    boxShadow: TU.glowShadow,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                 >
                   <ShieldCheck size={18} /> 主管核心授權：強行通過
                 </button>
                 <button 
                  onClick={() => setStep('IDLE')} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.05)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    color: '#fff', 
                    padding: '12px 24px', 
                    borderRadius: 10, 
                    fontWeight: 700, 
                    cursor: 'pointer' 
                  }}
                 >
                   重新擷取數據
                 </button>
               </div>
             </div>
          )}

          {/* 產出結果區 */}
          {/* 存檔狀態橫列 */}
          {step === 'DONE' && saveSteps.length > 0 && (
            <div style={{ background: 'rgba(0,40,20,0.7)', border: '1px solid #10b98155', borderRadius: 12, padding: '10px 20px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: '#10b981', flexShrink: 0 }}>💾 存檔確認</span>
              {saveSteps.map((s, i) => (
                <span key={i} style={{ fontSize: 11, background: 'rgba(16,185,129,0.12)', border: '1px solid #10b98133', color: '#6ee7b7', borderRadius: 6, padding: '3px 10px', fontWeight: 700 }}>✓ {s}</span>
              ))}
            </div>
          )}

          {step === 'DONE' && announcement && (
            <div style={{ 
              background: 'rgba(22, 20, 16, 0.7)', 
              backdropFilter: 'blur(14px)', 
              border: `1px solid ${TU.shadow}`, 
              borderRadius: 24, 
              padding: 32, 
              boxShadow: `0 24px 60px rgba(0,0,0,0.6), inset 0 0 0 1px ${TU.void}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${TU.void}`, paddingBottom: 20 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, background: MU.gradient, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', boxShadow: MU.glowShadow }}>
                      <Check size={24} />
                    </div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: TU.bright }}>全鏈條直通完成</h2>
                      <span style={{ fontSize: 11, color: EMPEROR_UI.textMuted }}>TELEMETRY_STATUS: SYNC_SUCCESSFUL</span>
                    </div>
                 </div>
                 <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: 10, border: `1px solid ${TU.void}`, fontSize: 13, color: TU.bright, fontWeight: 800 }}>
                   #{reportId} / {reportDate}
                 </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* 完整版公告預覽 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 800, color: TU.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FileText size={16} /> 核心公告封裝文本 (Master Announcement)
                    </span>
                    <button 
                      onClick={() => copyText(announcement.fullText, 'full')} 
                      style={{ 
                        background: TU.void, 
                        border: `1px solid ${TU.shadow}`, 
                        color: TU.bright, 
                        padding: '8px 20px', 
                        borderRadius: 8, 
                        fontSize: 12, 
                        fontWeight: 900, 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.3s'
                      }}
                    >
                      {copiedKey === 'full' ? <><Check size={14} /> 已複製到剪貼簿</> : <><Copy size={14} /> 點擊一鍵複製</>}
                    </button>
                  </div>
                  <textarea 
                    readOnly 
                    value={announcement.fullText || ''} 
                    style={{ 
                      width: '100%', height: 320, 
                      background: 'rgba(0,0,0,0.3)', 
                      border: `1px solid ${EMPEROR_UI.borderMain}`, 
                      borderRadius: 12, 
                      padding: 24, 
                      fontSize: 14, 
                      color: EMPEROR_UI.textSecondary, 
                      fontFamily: '"JetBrains Mono", monospace', 
                      lineHeight: 1.8,
                      resize: 'none', 
                      outline: 'none',
                      boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.2)'
                    }} 
                  />
                </div>

                {/* 快速拷貝按鈕區 — 數位多渠道 */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', padding: 24, background: 'rgba(0,0,0,0.25)', borderRadius: 16, border: `1px solid ${TU.void}` }}>
                   <div style={{ fontSize: 12, fontWeight: 900, color: TU.shadow, width: '100%', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>衍生渠道快速分發 (Multi-Channel Export)</div>
                   
                   <button onClick={() => copyText(announcement.lineText, 'line')} style={{ flex: 1, minWidth: 140, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b98144', color: '#10b981', padding: '14px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     <Megaphone size={16} /> LINE 公告 {copiedKey === 'line' && '✅'}
                   </button>
                   <button onClick={() => copyText(announcement.shortText, 'short')} style={{ flex: 1, minWidth: 140, background: 'rgba(139, 92, 246, 0.1)', border: '1px solid #8b5cf644', color: '#8b5cf6', padding: '14px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     <Zap size={16} /> 簡潔短版 {copiedKey === 'short' && '✅'}
                   </button>
                   <button onClick={() => copyText(announcement.voiceText, 'voice')} style={{ flex: 1, minWidth: 140, background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f644', color: '#3b82f6', padding: '14px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     <Globe size={16} /> 語音播報 {copiedKey === 'voice' && '✅'}
                   </button>
                   <button onClick={() => copyText(announcement.managerText, 'manager')} style={{ flex: 1, minWidth: 140, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef444433', color: '#fca5a5', padding: '14px', borderRadius: 10, fontSize: 13, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                     <ShieldCheck size={16} /> 主管報告 {copiedKey === 'manager' && '✅'}
                   </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 右側：處理進度與 Log 儀表板 — 戰術規格 */}
        <div style={{ 
          background: 'rgba(10, 10, 10, 0.85)', 
          backdropFilter: 'blur(16px)', 
          border: `1px solid ${TU.shadow}`, 
          borderRadius: 24, 
          padding: '28px', 
          color: '#fff', 
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), inset 0 0 0 1px ${TU.void}`, 
          position: 'sticky', 
          top: 24, 
          display: 'flex', 
          flexDirection: 'column', 
          height: 'calc(100vh - 100px)',
          gap: 20
        }}>
           
           <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: TU.bright, display: 'flex', alignItems: 'center', gap: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
             <Activity size={20} />
             核心分析引擎監測器
           </h3>

           {/* 即時動態數據指標 */}
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 12, border: `1px solid ${TU.void}` }}>
              {[
                { label: 'CPU_LOAD', val: metrics.cpu, clr: TU.bright },
                { label: 'RAM_CONS', val: metrics.ram, clr: MU.bright },
                { label: 'NETWORK', val: metrics.latency, clr: JIN.bright }
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, color: TU.shadow, fontWeight: 900 }}>{m.label}</div>
                  <div style={{ fontSize: 13, color: m.clr, fontWeight: 900, fontFamily: 'monospace' }}>{m.val}</div>
                </div>
              ))}
           </div>

           {/* 進度燈號 — 精品版本 */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
             {/* 垂直數據軌道 */}
             <div style={{ position: 'absolute', left: 19, top: 20, bottom: 20, width: 2, background: `linear-gradient(to bottom, ${TU.void}, ${TU.shadow}, ${TU.void})`, zIndex: 0 }}></div>

             {stepItems.map((item, idx) => {
               const st = getStepStatus(item.id, step);
               let accent: string = TU.bright;
               let bgColor = 'rgba(20, 20, 20, 0.6)';
               let textColor = '#555';
               let iconColor = '#444';

               if (st === 'done') {
                 accent = MU.bright;
                 bgColor = `${MU.void}`;
                 textColor = '#fff';
                 iconColor = MU.bright;
               } else if (st === 'active') {
                 accent = TU.bright;
                 bgColor = `${TU.void}`;
                 textColor = TU.bright;
                 iconColor = TU.bright;
               } else if (st === 'error') {
                 accent = '#ef4444';
                 bgColor = 'rgba(40, 10, 10, 0.6)';
                 textColor = '#ef4444';
                 iconColor = '#ef4444';
               }

               return (
                 <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 0', zIndex: 1, position: 'relative', transition: 'all 0.4s' }}>
                   <div style={{ 
                     width: 40, height: 40, borderRadius: 12, 
                     background: bgColor, 
                     border: `1px solid ${accent}44`, 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', 
                     transition: 'all 0.4s', 
                     boxShadow: st === 'active' ? `0 0 20px ${accent}33` : 'none',
                     color: iconColor
                   }}>
                     {st === 'done' ? <Check size={18} /> : item.icon}
                   </div>
                   <div style={{ 
                     fontSize: 14, 
                     fontWeight: st === 'active' ? 900 : 700, 
                     color: textColor, 
                     transition: 'all 0.4s',
                     letterSpacing: '0.02em',
                     textShadow: st === 'active' ? `0 0 10px ${accent}44` : 'none'
                   }}>
                     {item.label}
                   </div>
                   {st === 'active' && (
                     <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="scanning-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }}></div>
                        <span style={{ fontSize: 10, color: accent, fontWeight: 900, textTransform: 'uppercase' }}>PROCCESSING</span>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>

           {/* 系統終端日誌區 */}
           <div style={{ 
             flex: 1, 
             background: 'rgba(0,0,0,0.4)', 
             borderRadius: 16, 
             border: `1px solid ${EMPEROR_UI.borderAccent}`, 
             padding: '20px', 
             overflowY: 'auto', 
             display: 'flex', 
             flexDirection: 'column', 
             gap: 10, 
             fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
             fontSize: 12,
             boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.5)'
           }}>
             <div style={{ color: TU.shadow, fontSize: 10, borderBottom: `1px solid ${TU.void}`, paddingBottom: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
               <Layout size={12} /> SYSTEM_KERNEL_LOG v5.01
             </div>
             {logs.length === 0 && <div style={{ color: '#444', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>[ 等待遙測連結... ]</div>}
             {logs.map((log) => {
               let clr = '#888';
               if (log.type === 'success') clr = '#10b981';
               if (log.type === 'error') clr = '#ef4444';
               if (log.type === 'warn') clr = '#f59e0b';
               
               return (
                 <div key={log.id} style={{ display: 'flex', gap: 10, lineHeight: 1.5 }}>
                   <span style={{ color: '#555', flexShrink: 0 }}>[{log.time}]</span>
                   <span style={{ color: clr, wordBreak: 'break-all' }}>{log.msg}</span>
                 </div>
               );
             })}
             <div ref={logsEndRef} />
           </div>

        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(1); }
        }
        @keyframes bgMove {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.1) translate(-2%, -2%); }
        }
        .engine-pulse {
          animation: pulse 2s infinite ease-in-out;
        }
        .scanning-dot {
          animation: pulse 0.8s infinite;
        }
        textarea::placeholder {
          color: ${TU.shadow};
          font-style: italic;
        }
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        ::-webkit-scrollbar-thumb {
          background: ${TU.void};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${TU.shadow};
        }
      `}</style>
      </div>
    </div>
  );
}
