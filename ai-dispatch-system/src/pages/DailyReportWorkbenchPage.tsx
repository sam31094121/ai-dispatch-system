import React, { useState } from 'react';
import { DailyReportInputPage } from './DailyReportInputPage';
import { ParseResultConfirmPage } from './ParseResultConfirmPage';
import { AuditCheckPage } from './AuditCheckPage';
import { RankingDispatchPage } from './RankingDispatchPage';
import { AnnouncementOutputPage } from './AnnouncementOutputPage';
import { EMPEROR_UI, TU, MU, HUO, SHUI, JIN, EMPEROR } from '../constants/wuxingColors';

type StepKey = 'input' | 'parse' | 'audit' | 'simulate' | 'ranking' | 'announcement';

// ── 六大步驟 × 五行對應 ──
const STEPS: {
  key: StepKey;
  num: string;
  label: string;
  element: string;
  palette: typeof TU;
  canGo: (r: number | null, d: string) => boolean;
}[] = [
  { key: 'input',        num: '①', label: '原始輸入', element: '水', palette: SHUI, canGo: ()       => true },
  { key: 'parse',        num: '②', label: '智能解析', element: '水', palette: SHUI, canGo: (r)      => Boolean(r) },
  { key: 'audit',        num: '③', label: '智能審計', element: '木', palette: MU,   canGo: (r)      => Boolean(r) },
  { key: 'simulate',     num: '④', label: '數據模擬', element: '土', palette: TU,   canGo: (_, d)   => Boolean(d) },
  { key: 'ranking',      num: '⑤', label: '軍團派單', element: '火', palette: HUO,  canGo: (_, d)   => Boolean(d) },
  { key: 'announcement', num: '⑥', label: '公告發報', element: '金', palette: JIN,  canGo: (_, d)   => Boolean(d) },
];

export function DailyReportWorkbenchPage(): React.ReactElement {
  const [step, setStep] = useState<StepKey>('input');
  const [reportId, setReportId] = useState<number | null>(null);
  const [reportDate, setReportDate] = useState<string>('');

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
        <div style={{ maxWidth: 1600, margin: '0 auto', padding: '12px 24px' }}>

          {/* 標題行 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
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
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { label: '系統狀態', val: reportId ? `#${reportId} 已建立` : '待建立今日正式報表', ok: Boolean(reportId) },
                { label: '今日結算日', val: reportDate || '尚未指定', ok: Boolean(reportDate) },
              ].map(({ label, val, ok }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: EMPEROR.obsidian,
                  border: `1px solid ${ok ? MU.shadow : EMPEROR_UI.borderMain}`,
                  borderRadius: 10, padding: '6px 14px',
                }}>
                  <span style={{ fontSize: 10, color: EMPEROR_UI.textDim, letterSpacing: '0.08em' }}>{label}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: ok ? MU.bright : EMPEROR_UI.textMuted }}>{val}</span>
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
                      color: isCurrent ? p.text : isDone ? p.shadow : EMPEROR_UI.textDim,
                      fontWeight: isCurrent ? 900 : 600,
                      fontSize: 13,
                      cursor: canNav ? 'pointer' : 'not-allowed',
                      opacity: canNav ? 1 : 0.3,
                      transition: 'all 0.2s',
                      boxShadow: isCurrent ? `0 0 12px ${p.core}44, inset 0 1px 0 ${p.bright}22` : 'none',
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                  >
                    <span style={{ fontFamily: 'serif', fontSize: 15, color: isCurrent ? p.bright : isDone ? p.core : p.shadow, textShadow: isCurrent ? `0 0 8px ${p.glow}66` : 'none' }}>
                      {s.element}
                    </span>
                    <span style={{ fontSize: 11, color: isCurrent ? p.glow : EMPEROR_UI.textDim }}>{s.num}</span>
                    <span>{s.label}</span>
                    {isDone && <span style={{ fontSize: 11, color: p.core }}>✓</span>}
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
            onParsed={({ reportId: id, reportDate: date }) => {
              setReportId(id);
              setReportDate(date);
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
            onPassed={() => setStep('simulate')}
          />
        )}

        {step === 'simulate' && reportDate && (
          <SimulatePlaceholderPage
            reportDate={reportDate}
            onNext={() => setStep('ranking')}
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

// ── 數據模擬佔位頁（後端模組開發中）──
function SimulatePlaceholderPage({ reportDate, onNext }: { reportDate: string; onNext: () => void }) {
  const features = [
    '若取消某筆訂單的整體排名變化模擬',
    '明日預估達標率與人力分配建議',
    '各業務員業績缺口精確計算',
    '衝刺方案 × AI 激勵文案自動生成',
  ];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 860, margin: '0 auto' }}>
      <div style={{
        background: TU.abyss, border: `1px solid ${TU.shadow}`,
        borderLeft: `4px solid ${TU.bright}`,
        borderRadius: 16, padding: 28,
        boxShadow: `0 4px 24px ${TU.core}22`,
      }}>
        {/* 標頭 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <span style={{ fontSize: 36, fontFamily: 'serif', color: TU.bright, textShadow: `0 0 16px ${TU.glow}66`, lineHeight: 1 }}>土</span>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: TU.bright, letterSpacing: '0.04em' }}>④ 數據模擬中心</h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: TU.text }}>結算日：{reportDate} · 審計已通過</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: TU.core, background: TU.void, border: `1px solid ${TU.shadow}`, padding: '4px 12px', borderRadius: 20, fontWeight: 700 }}>
            開發中
          </span>
        </div>

        {/* 功能說明 */}
        <div style={{ background: TU.void, border: `1px solid ${TU.shadow}22`, borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
          <p style={{ margin: '0 0 12px', color: TU.text, fontSize: 13, fontWeight: 700 }}>此模組上線後，將支援：</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {features.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: TU.text, opacity: 0.75 }}>
                <span style={{ color: TU.core, marginTop: 1, flexShrink: 0 }}>◎</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 提示 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: EMPEROR.obsidian, border: `1px solid ${EMPEROR.deepGold}22`, borderRadius: 8, marginBottom: 22, fontSize: 12, color: EMPEROR_UI.textMuted }}>
          <span>🔧</span>
          <span>數據模擬引擎建設中，審計通過後可直接進入軍團派單。</span>
        </div>

        <button
          onClick={onNext}
          style={{
            border: `1px solid ${HUO.core}`, borderRadius: 8,
            background: `linear-gradient(135deg, ${HUO.core}, ${HUO.shadow})`,
            color: HUO.text, padding: '11px 28px',
            fontWeight: 900, fontSize: 14, cursor: 'pointer',
            boxShadow: `0 4px 16px ${HUO.core}44`,
            letterSpacing: '0.04em', transition: 'all 0.2s',
          }}
          onMouseOver={e => e.currentTarget.style.boxShadow = `0 6px 24px ${HUO.bright}55`}
          onMouseOut={e => e.currentTarget.style.boxShadow = `0 4px 16px ${HUO.core}44`}
        >
          火 ⑤ → 進入軍團派單
        </button>
      </div>
    </div>
  );
}
