import React, { useState, useEffect, useRef, useCallback } from 'react';
import { geminiService } from '../services/gemini.service';
import { reportService } from '../services/report.service';
import { auditService } from '../services/audit.service';
import { rankingService } from '../services/ranking.service';
import { dispatchService } from '../services/dispatch.service';
import { announcementService } from '../services/announcement.service';
import type { AnnouncementOutput } from '../services/announcement.service';
import type { AuditRunResult, AuditIssue } from '../types/audit';
import { EMPEROR_UI, TU, MU, HUO, SHUI, EMPEROR } from '../constants/wuxingColors';
import { StatusBadge } from '../components/StatusBadge';
import { PageBlock } from '../components/PageBlock';
import { 平台選項, 報表模式選項 } from '../constants/options';
import type { 平台名稱, 報表模式 } from '../constants/options';

type PipelineStep = 'IDLE' | 'ANALYSING' | 'PARSING' | 'AUDITING' | 'RANKING' | 'ANNOUNCING' | 'DONE' | 'ERROR' | 'AUDIT_FAILED';

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runPipelineRef = useRef<(text: string) => Promise<void>>(async () => {});

  const addLog = useCallback((msg: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(7), time: new Date().toLocaleTimeString('zh-TW', { hour12: false }), msg, type }]);
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
      addLog('文本太短，無法啓動 AI 分析', 'warn');
      return;
    }

    setStep('ANALYSING');
    setLogs([]);
    setReportId(null);
    setAuditResult(null);
    setAnnouncement(null);
    addLog('🚀 啟動一鍵直通引擎...', 'info');
    addLog('🤖 AI 正在分析文本特徵 (擷取日期與平台)...', 'info');

    try {
      // 1. 萃取 Meta
      const meta = await geminiService.extractReportMeta(textToProcess);
      let pDate = meta.reportDate;
      let pPlatform = meta.platformName as 平台名稱;
      let pMode = meta.reportMode as 報表模式;

      // 防呆：如果 AI 抓不到，嘗試給預設值以利流程繼續
      if (!pDate) pDate = new Date().toISOString().split('T')[0];
      if (!pPlatform || !平台選項.includes(pPlatform)) pPlatform = '整合' as 平台名稱;
      if (!pMode || !報表模式選項.includes(pMode)) pMode = '累積' as 報表模式;

      setReportDate(pDate);
      addLog(`✨ AI 辨識完成：${pDate} · ${pPlatform} · ${pMode}`, 'success');

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
      await executeRankingAndAnnouncement(pDate);

    } catch (err: any) {
      addLog(`❌ 單元執行錯誤：${err?.message || err?.responseMessage || '未知錯誤'}`, 'error');
      setStep('ERROR');
    }
  };

  const executeRankingAndAnnouncement = async (dateStr: string) => {
    try {
      setStep('RANKING');
      addLog('🏆 重新演算英雄榜名單...', 'info');
      await rankingService.generate(dateStr);
      addLog('✅ 英雄榜演算完成', 'success');

      addLog('🎯 執行軍團自動派單分發...', 'info');
      await dispatchService.generate(dateStr);
      addLog('✅ 派單陣列部署完畢', 'success');

      // 5. 生成公告
      setStep('ANNOUNCING');
      addLog('📢 封裝最終戰報與多渠道公告...', 'info');
      const output = await announcementService.generate(dateStr);
      setAnnouncement(output);
      addLog('🎉 系統直通完成！公告已就緒，可一鍵取用。', 'success');
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
      // 授權完後繼續跑流程
      await executeRankingAndAnnouncement(reportDate);
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

  const stepItems: { id: PipelineStep; label: string; icon: string }[] = [
    { id: 'ANALYSING', label: 'AI 萃取', icon: '🧠' },
    { id: 'PARSING', label: '數據解析', icon: '⚙️' },
    { id: 'AUDITING', label: '智能審計', icon: '🕵️' },
    { id: 'RANKING', label: '派工演算', icon: '🎯' },
    { id: 'ANNOUNCING', label: '公告封裝', icon: '📢' },
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
      {/* 全球大數據背景圖層 */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '60%',
        height: '400px',
        backgroundImage: 'url("/C:/Users/DRAGON/.gemini/antigravity/brain/2549ae95-ea22-4ede-b684-e965d5000f1b/global_big_data_hero_1773246697072.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.15,
        maskImage: 'linear-gradient(to bottom, black, transparent), linear-gradient(to left, black, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, black, transparent), linear-gradient(to left, black, transparent)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ padding: 24, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* 頂部 Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ 
          backdropFilter: 'blur(8px)', 
          background: 'rgba(255,255,255,0.4)', 
          padding: '16px 24px', 
          borderRadius: 20, 
          border: `1px solid ${EMPEROR_UI.borderMain}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
           <h1 style={{ margin: '0 0 8px 0', fontSize: 26, fontWeight: 900, color: EMPEROR_UI.textPrimary, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚡ 一鍵極速直通樞紐</span>
            <span style={{ fontSize: 11, background: TU.void, color: TU.bright, padding: '3px 10px', borderRadius: 20, border: `1px solid ${TU.shadow}`}}>V2 Alpha</span>
          </h1>
          <p style={{ margin: 0, color: EMPEROR_UI.textMuted, fontSize: 13, fontWeight: 500 }}>
            🌍 全球大數據驅動：無須繁瑣步驟，貼上原始日報，系統將直接在背景完成【解析 → 審計 → 派單 → 公告】全自動作業。
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1fr) 350px', gap: 24, alignItems: 'start' }}>
        
        {/* 左側：輸入與自動化結果區 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* 輸入區 */}
          <div style={{ background: EMPEROR_UI.cardBg, border: `1px solid ${EMPEROR_UI.borderMain}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ padding: '12px 20px', background: EMPEROR_UI.sidebarBg, borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: 14, fontWeight: 800, color: EMPEROR_UI.textSecondary }}>📋 來源日報輸入區</span>
               {(step === 'IDLE' || step === 'DONE') && (
                 <button onClick={() => runPipeline(rawText)} disabled={!rawText.trim() || rawText.length < 15} style={{ border: 'none', background: MU.void, color: MU.text, borderRadius: 6, padding: '6px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', opacity: (!rawText.trim() || rawText.length < 10) ? 0.5 : 1 }}>
                   ▶️ 立即啟動 AI 直通引擎
                 </button>
               )}
            </div>
            <textarea
              ref={textareaRef}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="在此點擊並按 Ctrl + V 貼上文字... 貼上後系統會自動啟動"
              style={{
                width: '100%', minHeight: step !== 'IDLE' ? 120 : 250, border: 'none', padding: 20,
                background: 'transparent', color: EMPEROR_UI.textSecondary,
                fontSize: 13, fontFamily: '"Microsoft JhengHei", monospace',
                lineHeight: 1.6, resize: 'vertical', outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* 若為中斷狀態：顯示審計紅單 */}
          {step === 'AUDIT_FAILED' && auditResult && (
             <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 24, boxShadow: '0 4px 12px rgba(220,38,38,0.1)' }}>
               <h3 style={{ margin: '0 0 16px 0', color: '#991b1b', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                 ❌ 流程自動中斷：審計異常紅單
               </h3>
               
               <div style={{ background: '#fff', borderRadius: 8, padding: 16, border: '1px solid #fecaca', marginBottom: 20 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr>
                        <th style={{ paddingBottom: 10, color: '#991b1b', fontSize: 13 }}>欄位</th>
                        <th style={{ paddingBottom: 10, color: '#991b1b', fontSize: 13 }}>原始值</th>
                        <th style={{ paddingBottom: 10, color: '#991b1b', fontSize: 13 }}>應得值</th>
                        <th style={{ paddingBottom: 10, color: '#991b1b', fontSize: 13 }}>落差</th>
                        <th style={{ paddingBottom: 10, color: '#991b1b', fontSize: 13 }}>說明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.issues.map(iss => (
                        <tr key={iss.id} style={{ borderTop: '1px solid #fee2e2' }}>
                           <td style={{ paddingTop: 10, paddingBottom: 10, fontWeight: 600 }}>{iss.fieldName}</td>
                           <td style={{ paddingTop: 10, paddingBottom: 10, color: '#dc2626', textDecoration: 'line-through' }}>{iss.rawValue}</td>
                           <td style={{ paddingTop: 10, paddingBottom: 10, color: '#059669', fontWeight: 600 }}>{iss.expectedValue}</td>
                           <td style={{ paddingTop: 10, paddingBottom: 10, fontWeight: 700 }}>{iss.diffValue}</td>
                           <td style={{ paddingTop: 10, paddingBottom: 10, fontSize: 12, color: '#7f1d1d' }}>{iss.suggestionText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>

               <div style={{ display: 'flex', gap: 12 }}>
                 <button onClick={handleManualApprove} style={{ background: '#fff', border: '1px solid #fcd34d', color: '#d97706', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                   ⚠️ 忽略異常，強制授權通過
                 </button>
                 <button onClick={() => setStep('IDLE')} style={{ background: 'transparent', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                   重新輸入
                 </button>
               </div>
             </div>
          )}

          {/* 產出結果區 */}
          {step === 'DONE' && announcement && (
            <div style={{ background: EMPEROR_UI.cardBg, border: `2px solid ${TU.shadow}`, borderRadius: 16, padding: 24, boxShadow: `0 8px 30px ${TU.bright}15` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom: 16 }}>
                 <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: TU.bright, display: 'flex', alignItems: 'center', gap: 10 }}>
                   🎉 全自動處理完畢
                 </h2>
                 <StatusBadge label={`報表 ID: ${reportId} · 結算日: ${reportDate}`} tone="pass" />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 完整版公告預覽 */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontWeight: 800, color: EMPEROR_UI.textPrimary }}>📝 完整派單公告</span>
                    <button onClick={() => copyText(announcement.fullText, 'full')} style={{ background: TU.void, border: `1px solid ${TU.shadow}`, color: TU.bright, padding: '6px 16px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {copiedKey === 'full' ? '已複製 ✅' : '點擊複製 📋'}
                    </button>
                  </div>
                  <textarea readOnly value={announcement.fullText || ''} style={{ width: '100%', height: 300, background: EMPEROR_UI.pageBg, border: `1px solid ${EMPEROR_UI.borderMain}`, borderRadius: 8, padding: 16, fontSize: 13, color: EMPEROR_UI.textSecondary, fontFamily: 'monospace', resize: 'vertical', outline: 'none' }} />
                </div>

                {/* 快速拷貝按鈕區 */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px 20px', background: EMPEROR_UI.sidebarBg, borderRadius: 12, border: `1px solid ${EMPEROR_UI.borderAccent}` }}>
                   <span style={{ fontSize: 13, fontWeight: 800, color: EMPEROR_UI.textMuted, width: '100%', marginBottom: 4 }}>其他平台衍生文案一鍵取用：</span>
                   
                   <button onClick={() => copyText(announcement.lineText, 'line')} style={{ flex: 1, minWidth: 120, background: '#fff', border: '1px solid #10b981', color: '#059669', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                     💬 LINE 版 ({copiedKey === 'line' ? '✅' : '複製'})
                   </button>
                   <button onClick={() => copyText(announcement.shortText, 'short')} style={{ flex: 1, minWidth: 120, background: '#fff', border: '1px solid #8b5cf6', color: '#6d28d9', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                     ⚡ 超短版 ({copiedKey === 'short' ? '✅' : '複製'})
                   </button>
                   <button onClick={() => copyText(announcement.voiceText, 'voice')} style={{ flex: 1, minWidth: 120, background: '#fff', border: '1px solid #3b82f6', color: '#1d4ed8', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                     🎤 語音版 ({copiedKey === 'voice' ? '✅' : '複製'})
                   </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 右側：處理進度與 Log 儀表板 */}
        <div style={{ background: EMPEROR.warmBlack, border: '1px solid #000', borderRadius: 16, padding: '20px', color: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
           
           <h3 style={{ margin: '0 0 24px 0', fontSize: 15, fontWeight: 900, color: EMPEROR.imperialGold, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '0.05em' }}>
             <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: (step !== 'IDLE' && step !== 'DONE' && step !== 'ERROR' && step !== 'AUDIT_FAILED') ? HUO.bright : EMPEROR_UI.textMuted, boxShadow: (step !== 'IDLE' && step !== 'DONE' && step !== 'ERROR' && step !== 'AUDIT_FAILED') ? `0 0 10px ${HUO.bright}` : 'none' }}></span>
             核心引擎進度
           </h3>

           {/* 進度燈號 */}
           <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 30, position: 'relative' }}>
             {/* 垂直線 */}
             <div style={{ position: 'absolute', left: 15, top: 15, bottom: 15, width: 2, background: '#333', zIndex: 0 }}></div>

             {stepItems.map((item, idx) => {
               const st = getStepStatus(item.id, step);
               let accent: string = EMPEROR.imperialGold;
               let bgColor = '#111';
               let textColor = '#666';

               if (st === 'done') {
                 accent = EMPEROR.imperialGreen;
                 bgColor = '#0a1a10';
                 textColor = '#fff';
               } else if (st === 'active') {
                 accent = EMPEROR.imperialGold;
                 bgColor = '#2a200a';
                 textColor = '#fff';
               } else if (st === 'error') {
                 accent = '#ef4444';
                 bgColor = '#2a0a0a';
                 textColor = '#ef4444';
               }

               return (
                 <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', zIndex: 1, position: 'relative' }}>
                   <div style={{ width: 32, height: 32, borderRadius: '50%', background: bgColor, border: `2px solid ${accent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s', boxShadow: st === 'active' ? `0 0 15px ${accent}44` : 'none' }}>
                     {st === 'done' ? <span style={{ color: accent, fontSize: 14 }}>✓</span> : <span style={{ fontSize: 14 }}>{item.icon}</span>}
                   </div>
                   <div style={{ fontSize: 14, fontWeight: st === 'active' ? 900 : 600, color: textColor, transition: 'color 0.3s' }}>
                     {item.label}
                   </div>
                   {st === 'active' && (
                     <span style={{ marginLeft: 'auto', fontSize: 11, color: accent, background: `${accent}22`, padding: '2px 8px', borderRadius: 20, animation: 'pulse 1.5s infinite' }}>進行中...</span>
                   )}
                   {st === 'error' && (
                     <span style={{ marginLeft: 'auto', fontSize: 11, color: accent, background: `${accent}22`, padding: '2px 8px', borderRadius: 20 }}>中斷</span>
                   )}
                 </div>
               );
             })}
           </div>

           {/* Log 區 */}
           <div style={{ flex: 1, background: '#0a0a0a', borderRadius: 12, border: '1px solid #222', padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: '"Fira Code", monospace', fontSize: 12 }}>
             {logs.length === 0 && <div style={{ color: '#444', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>等待觸發...</div>}
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
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
      </div>
    </div>
  );
}
