import React, { useState } from 'react';
import { DailyReportInputPage } from './DailyReportInputPage';
import { ParseResultConfirmPage } from './ParseResultConfirmPage';
import { AuditCheckPage } from './AuditCheckPage';
import { RankingDispatchPage } from './RankingDispatchPage';
import { AnnouncementOutputPage } from './AnnouncementOutputPage';
import { EMPEROR_UI, TU, MU, HUO, SHUI, JIN, EMPEROR } from '../constants/wuxingColors';

type StepKey = 'input' | 'parse' | 'audit' | 'ranking' | 'announcement';

// ── 五大步驟 × 五行對應（移除開發中的④模擬，審計後直通排名派單）──
const STEPS: {
  key: StepKey;
  num: string;
  label: string;
  sub: string;
  element: string;
  palette: typeof TU;
  canGo: (r: number | null, d: string) => boolean;
}[] = [
  { key: 'input',        num: '①', label: '輸入業績', sub: '貼入 · 辨識',     element: '水', palette: SHUI, canGo: ()    => true },
  { key: 'parse',        num: '②', label: 'AI 解析',  sub: '辨識人員明細',    element: '木', palette: MU,   canGo: (r)   => Boolean(r) },
  { key: 'audit',        num: '③', label: '智能審計', sub: '天地盤/邏輯盤',   element: '土', palette: TU,   canGo: (r)   => Boolean(r) },
  { key: 'ranking',      num: '④', label: '排名派單', sub: 'A1/A2/B/C 分組',  element: '火', palette: HUO,  canGo: (_,d) => Boolean(d) },
  { key: 'announcement', num: '⑤', label: '公告生成', sub: 'LINE/播報/完整版', element: '金', palette: JIN,  canGo: (_,d) => Boolean(d) },
];

export function DailyReportWorkbenchPage(): React.ReactElement {
  const [step, setStep] = useState<StepKey>('input');
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');
  const [personCount, setPersonCount] = useState<number | null>(null);
  const [auditPassed, setAuditPassed] = useState(false);

  const activeIdx = STEPS.findIndex(s => s.key === step);

  function go(target: StepKey) {
    const def = STEPS.find(s => s.key === target);
    if (def?.canGo(reportId, reportDate)) setStep(target);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: EMPEROR_UI.pageBg }}>

      {/* ── Sticky 頂部導覽 ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: `linear-gradient(to bottom, ${EMPEROR.obsidian}f8, ${EMPEROR.obsidianMid}f8)`,
        borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '8px 18px' }}>

          {/* 標題行 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 19, fontWeight: 900,
                color: EMPEROR_UI.textPrimary, letterSpacing: '0.04em',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span>📋</span>
                每日業績核心樞紐
                <span style={{ fontSize: 11, color: TU.text, background: TU.void, border: `1px solid ${TU.shadow}`, padding: '2px 10px', borderRadius: 4, letterSpacing: '0.1em' }}>工作台</span>
              </h1>
            </div>

            {/* 狀態徽章 */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                {
                  label: '報表',
                  val: reportId ? `#${reportId}${personCount !== null ? ` · ${personCount}人` : ''}` : '待建立',
                  ok: Boolean(reportId),
                  palette: MU,
                },
                {
                  label: '結算日',
                  val: reportDate || '尚未指定',
                  ok: Boolean(reportDate),
                  palette: SHUI,
                },
                {
                  label: '審計',
                  val: auditPassed ? '✓ PASS' : reportId ? '待審計' : '—',
                  ok: auditPassed,
                  palette: TU,
                },
              ].map(({ label, val, ok, palette }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: ok ? palette.abyss : EMPEROR.obsidian,
                  border: `1px solid ${ok ? palette.shadow : EMPEROR_UI.borderMain}`,
                  borderRadius: 10, padding: '5px 12px',
                  boxShadow: ok ? `0 0 8px ${palette.bright}33` : 'none',
                  transition: 'all 0.3s',
                }}>
                  <span style={{ fontSize: 10, color: ok ? palette.text : EMPEROR_UI.textDim, letterSpacing: '0.08em' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: ok ? palette.bright : EMPEROR_UI.textMuted }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 六步流程導覽 */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', overflowX: 'auto', paddingBottom: 2 }}>
            {STEPS.map((s, i) => {
              const p = s.palette;
              const canNav = s.canGo(reportId, reportDate);
              const isCurrent = step === s.key;
              const isDone = i < activeIdx;

              return (
                <React.Fragment key={s.key}>
                  <button
                    onClick={() => go(s.key)}
                    disabled={!canNav}
                    title={canNav ? undefined : '請先完成前面的步驟'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 9,
                      border: `1px solid ${isCurrent ? p.bright + '77' : isDone ? p.shadow : EMPEROR_UI.borderMain + '44'}`,
                      background: isCurrent
                        ? `linear-gradient(135deg, ${p.void}, ${p.abyss})`
                        : isDone ? p.abyss : 'transparent',
                      color: EMPEROR_UI.textPrimary,
                      fontWeight: isCurrent ? 900 : 600,
                      fontSize: 13,
                      cursor: canNav ? 'pointer' : 'not-allowed',
                      opacity: canNav ? 1 : 0.3,
                      transition: 'all 0.2s',
                      boxShadow: isCurrent ? `0 0 12px ${p.core}44, inset 0 1px 0 ${p.bright}22` : 'none',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    {/* 五行元素 + 序號 */}
                    <span style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:1, flexShrink:0 }}>
                      <span style={{ fontFamily: 'serif', fontSize: 13, color: isCurrent ? p.bright : isDone ? p.core : p.shadow, textShadow: isCurrent ? `0 0 8px ${p.glow}66` : 'none', lineHeight:1 }}>
                        {s.element}
                      </span>
                      <span style={{ fontSize: 9, color: isCurrent ? p.glow : EMPEROR_UI.textDim, fontFamily:'monospace', lineHeight:1 }}>{s.num}</span>
                    </span>
                    {/* 主標 + 意境副標 */}
                    <span style={{ display:'flex', flexDirection:'column', gap:1 }}>
                      <span style={{ fontSize:12, fontWeight: isCurrent ? 900 : 700, lineHeight:1, color: isCurrent ? p.text : isDone ? p.shadow : EMPEROR_UI.textMuted }}>{s.label}</span>
                      <span style={{ fontSize:9, color: isCurrent ? p.core : EMPEROR_UI.textDim, lineHeight:1, letterSpacing:'.03em' }}>{s.sub}</span>
                    </span>
                    {/* live data badges */}
                    {s.key === 'parse' && personCount !== null && isDone && (
                      <span style={{ fontSize: 10, fontWeight: 900, color: MU.bright, background: MU.abyss, padding: '1px 6px', borderRadius: 4, border: `1px solid ${MU.shadow}`, fontFamily: 'monospace' }}>{personCount}人</span>
                    )}
                    {s.key === 'audit' && auditPassed && isDone && (
                      <span style={{ fontSize: 10, fontWeight: 900, color: TU.bright, background: TU.abyss, padding: '1px 6px', borderRadius: 4, border: `1px solid ${TU.shadow}` }}>PASS</span>
                    )}
                    {isDone && s.key !== 'parse' && s.key !== 'audit' && <span style={{ fontSize: 11, color: p.core }}>✓</span>}
                  </button>
                  {i < STEPS.length - 1 && (
                    <span style={{ color: i < activeIdx ? EMPEROR_UI.textDim : '#1a1a10', fontSize: 13, flexShrink: 0, padding: '0 2px' }}>›</span>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 主體 ── */}
      <div style={{ flex: 1, maxWidth: 1600, margin: '0 auto', width: '100%' }}>

        {step === 'input' && (
          <DailyReportInputPage
            onParsed={({ reportId: id, reportDate: date, personCount: count }) => {
              setReportId(id);
              setReportDate(date);
              if (count !== undefined) setPersonCount(count);
              setStep('parse');
            }}
          />
        )}

        {step === 'parse' && reportId && (
          <ParseResultConfirmPage
            reportId={reportId}
            onAudit={() => setStep('audit')}
          />
        )}

        {step === 'audit' && reportId && (
          <AuditCheckPage
            reportId={reportId}
            onPassed={() => { setAuditPassed(true); setStep('ranking'); }}
          />
        )}

        {step === 'ranking' && reportDate && (
          <RankingDispatchPage reportDate={reportDate} />
        )}

        {step === 'announcement' && reportDate && (
          <AnnouncementOutputPage reportDate={reportDate} />
        )}
      </div>
    </div>
  );
}
