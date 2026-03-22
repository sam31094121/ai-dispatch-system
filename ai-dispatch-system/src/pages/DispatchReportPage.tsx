/**
 * DispatchReportPage — AI 派單報表主頁
 *
 * 元件樹：
 * DispatchReportPage
 *   ├─ FeedbackToast
 *   ├─ PageHeader (loading/error/success 狀態)
 *   │  └─ AnnouncementHeader + SummaryPanel
 *   ├─ RankingBoard (A1 → A2 → B → C 自動分組)
 *   │   └─ RankingCard × N
 *   ├─ NotePanel (補充說明獨立區)
 *   └─ AckPanel  (最後確認，固定頁尾)
 */
import { useState, useMemo } from 'react';
import { useDispatchReport }       from '../hooks/useDispatchReport';
import { useSortedRankingItems }   from '../hooks/useSortedRankingItems';
import { useCopyText }             from '../hooks/useCopyText';
import { toRankingCardVMs }        from '../formatters/rankingFormatter';
import { toNoteCardVMs }           from '../formatters/noteFormatter';
import { toSummaryCardVMs }        from '../formatters/metricFormatter';
import {
  fmtManagerSummary,
  fmtGroupList, fmtSummaryMetric, fmtAckInstruction,
} from '../formatters/clipboardFormatter';
import { EMPEROR_UI, UI }          from '../constants/wuxingColors';
import type {
  RankingCardVM, NoteCardVM, SummaryCardVM,
  RankingItem, DispatchReportPayload,
} from '../types/dispatchReport';
import { GROUP_COLORS, GROUP_LABELS, GROUP_ORDER } from '../types/dispatchReport';
import { FeedbackToast } from '../components/Unified';

const T = UI;

// ─────────────────────────────────────────────────────────
// SummaryCard
// ─────────────────────────────────────────────────────────
function SummaryCard({ vm, onCopy }: { vm: SummaryCardVM; onCopy: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onCopy} title="點擊複製"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? 'rgba(0,212,255,0.08)' : T.card,
        border: `1px solid ${vm.highlight ? T.cyan + '44' : T.border}`,
        borderRadius: 8, padding: '10px 12px', cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: vm.highlight ? `0 0 12px ${T.cyan}18` : 'none',
      }}
    >
      <div style={{ fontSize: 7, color: T.muted, letterSpacing: '0.5px', marginBottom: 4 }}>{vm.label}</div>
      <div style={{ fontSize: vm.highlight ? 16 : 13, fontWeight: 900, color: vm.highlight ? T.green : '#fff', fontFamily: T.mono, lineHeight: 1 }}>
        {vm.display}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AnnouncementHeader + SummaryPanel
// ─────────────────────────────────────────────────────────
function AnnouncementHeader({ payload, onCopyHeader, onCopySummary }:{
  payload: DispatchReportPayload;
  onCopyHeader: () => void;
  onCopySummary: (vm: SummaryCardVM) => void;
}) {
  const { reportMeta } = payload;
  const metrics = useMemo(() => toSummaryCardVMs(payload.summaryMetrics ?? []), [payload.summaryMetrics]);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Title row */}
      <div style={{
        background: 'linear-gradient(135deg,rgba(3,5,12,0.9),rgba(7,12,24,0.7))',
        border: `1px solid ${T.cyan}22`, borderRadius: 12, padding: '14px 18px',
        marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 900, color: T.cyan, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 8px ${T.cyan}`, animation: 'dr-dot 2s infinite', display: 'inline-block' }} />
              📣 {reportMeta.title}
              {reportMeta.version && <span style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace', fontWeight: 400 }}>{reportMeta.version}</span>}
            </div>
            <div style={{ fontSize: 8, color: T.muted, marginTop: 4, display: 'flex', gap: 8 }}>
              <span>{reportMeta.dateLabel} 結算 → {reportMeta.nextDate} 派單</span>
              <span style={{ color: T.dim }}>|</span>
              <span>{reportMeta.theme}</span>
              {reportMeta.subtitle && <><span style={{ color: T.dim }}>|</span><span>{reportMeta.subtitle}</span></>}
            </div>
          </div>
          <button onClick={onCopyHeader} style={{ fontSize: 9, padding: '5px 12px', borderRadius: 6, cursor: 'pointer', background: 'rgba(0,212,255,0.07)', border: `1px solid ${T.cyan}33`, color: T.cyan, fontWeight: 700, whiteSpace: 'nowrap' }}>
            📋 複製標題
          </button>
        </div>
        {reportMeta.requireAck && (
          <div style={{ marginTop: 8, fontSize: 8, color: T.amber, background: 'rgba(245,158,11,0.07)', border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 5, padding: '4px 10px' }}>
            ⚠️ 本公告需全員回覆確認
          </div>
        )}
      </div>

      {/* Summary metrics */}
      {metrics.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)`,
          gap: 8,
        }}>
          {metrics.map(vm => (
            <SummaryCard key={vm.key} vm={vm} onCopy={() => onCopySummary(vm)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MetricTagGroup
// ─────────────────────────────────────────────────────────
function MetricTagGroup({ tags, metrics, accent }: { tags: string[]; metrics: string[]; accent: string }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {tags.map(t => (
        <span key={t} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: `${accent}18`, color: accent, border: `1px solid ${accent}33`, fontWeight: 800 }}>{t}</span>
      ))}
      {metrics.map(m => (
        <span key={m} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,212,255,0.06)', color: T.muted, border: `1px solid rgba(0,212,255,0.12)`, fontFamily: 'monospace' }}>{m}</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RankingCard
// ─────────────────────────────────────────────────────────
function RankingCard({ vm, onCopyPerson, onCopyManager }: {
  vm:            RankingCardVM;
  onCopyPerson:  () => void;
  onCopyManager: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const accent     = vm.groupColor;
  const isTop3     = vm.rank <= 3;
  const rankColors: Record<number, string> = { 1: T.gold, 2: '#c0c0c0', 3: '#cd7f32' };
  const rankColor  = rankColors[vm.rank] ?? T.muted;

  return (
    <div style={{
      background: T.card, borderRadius: 10, padding: '12px 14px', marginBottom: 8,
      border: `1px solid ${isTop3 ? accent + '44' : T.border}`,
      boxShadow: isTop3 ? `0 0 14px ${accent}18` : 'none',
      animation: `dr-fadeUp 0.35s ease-out ${vm.rank * 0.06}s both`,
      transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
        {/* Rank badge */}
        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${rankColor}18`, border: `1px solid ${rankColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: rankColor, fontFamily: T.mono }}>{vm.rank}</span>
        </div>
        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            {/* Name — click to copy personal assessment */}
            <span
              onClick={onCopyPerson} title={`點擊複製 ${vm.name} AI 點評`}
              style={{ fontSize: 14, fontWeight: 900, color: '#fff', cursor: 'pointer', textDecoration: 'underline dashed rgba(0,212,255,0.3)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLSpanElement).style.color = T.cyan; }}
              onMouseLeave={e => { (e.currentTarget as HTMLSpanElement).style.color = '#fff'; }}
            >
              {vm.name}
            </span>
            {vm.isNewcomer && <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 10, background: 'rgba(139,92,246,0.14)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.25)', fontWeight: 900 }}>新人</span>}
            <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: `${accent}14`, color: accent, border: `1px solid ${accent}33`, fontWeight: 800 }}>{vm.group}</span>
          </div>
          <div style={{ fontSize: 7, color: T.muted, marginTop: 1 }}>{vm.summaryTitle}</div>
        </div>
        {/* Revenue */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: T.green, fontFamily: T.mono }}>${vm.totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 7, color: T.dim }}>總業績</div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          <button onClick={onCopyManager} title="複製主管摘要" style={{ fontSize: 9, padding: '3px 7px', borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: T.muted, fontWeight: 700 }}>📋</button>
          <button onClick={() => setExpanded(v => !v)} style={{ fontSize: 9, padding: '3px 7px', borderRadius: 4, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: T.muted, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</button>
        </div>
      </div>

      {/* AI Analysis (always visible) */}
      <div style={{ fontSize: 10, color: T.text, lineHeight: 1.65, background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: '7px 9px', fontFamily: T.font }}>
        {vm.aiAnalysis || vm.actionMessage}
      </div>

      {/* Tags (always visible) */}
      <MetricTagGroup tags={vm.tags} metrics={vm.focusMetrics} accent={accent} />

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5, animation: 'dr-expand 0.3s ease-out', overflow: 'hidden' }}>
          {vm.suggestion && (
            <div style={{ fontSize: 9, color: T.muted, padding: '5px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 5, borderLeft: `2px solid ${T.cyan}44` }}>
              <strong style={{ color: T.cyan, fontSize: 8 }}>建議 </strong>{vm.suggestion}
            </div>
          )}
          {vm.pressureMessage && (
            <div style={{ fontSize: 9, color: T.amber, padding: '5px 8px', background: 'rgba(245,158,11,0.04)', borderRadius: 5, borderLeft: `2px solid ${T.amber}66` }}>
              <strong style={{ fontSize: 8 }}>壓力 </strong>{vm.pressureMessage}
            </div>
          )}
          {vm.actionMessage && vm.actionMessage !== vm.aiAnalysis && (
            <div style={{ fontSize: 9, color: T.green, padding: '5px 8px', background: 'rgba(0,255,156,0.03)', borderRadius: 5, borderLeft: `2px solid ${T.green}55` }}>
              <strong style={{ fontSize: 8 }}>行動 </strong>{vm.actionMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RankingBoard — 依梯隊分組自動渲染
// ─────────────────────────────────────────────────────────
function RankingBoard({ items, onCopyPerson, onCopyManager, onCopyGroup }: {
  items:         RankingCardVM[];
  onCopyPerson:  (vm: RankingCardVM) => void;
  onCopyManager: (vm: RankingCardVM) => void;
  onCopyGroup:   (group: string, label: string) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.cyan, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, letterSpacing: '0.08em' }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 5px ${T.cyan}`, display: 'inline-block' }} />
        派單順序 · 全員排名
        <span style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace', fontWeight: 400, marginLeft: 4 }}>{items.length} 人</span>
      </div>

      {GROUP_ORDER.map(g => {
        const gItems = items.filter(i => i.group === g);
        if (!gItems.length) return null;
        const color = GROUP_COLORS[g];
        return (
          <div key={g} style={{ marginBottom: 14, animation: 'dr-fadeUp 0.35s ease-out, dr-groupGlow 5s ease-in-out infinite', borderRadius: 8, padding: '2px 0' }}>
            {/* Group label — click to copy group list */}
            <div
              onClick={() => onCopyGroup(g, GROUP_LABELS[g])}
              title={`點擊複製 ${GROUP_LABELS[g]} 全組名單`}
              style={{ fontSize: 9, fontWeight: 900, color, padding: '4px 10px', background: `${color}10`, border: `1px solid ${color}22`, borderRadius: 5, marginBottom: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, letterSpacing: '0.06em', transition: 'background 0.15s, transform 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = `${color}20`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = `${color}10`; }}
            >
              {GROUP_LABELS[g]}
            </div>
            {gItems.map(vm => (
              <RankingCard
                key={vm.name}
                vm={vm}
                onCopyPerson={() => onCopyPerson(vm)}
                onCopyManager={() => onCopyManager(vm)}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// NotePanel
// ─────────────────────────────────────────────────────────
function NotePanel({ notes }: { notes: NoteCardVM[] }) {
  if (!notes.length) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.amber, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, letterSpacing: '0.06em' }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.amber, display: 'inline-block' }} />
        補充說明
      </div>
      {notes.map((n, i) => (
        <div key={i} style={{ background: 'rgba(245,158,11,0.04)', border: `1px solid ${n.badgeColor}25`, borderRadius: 8, padding: '10px 12px', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: n.badgeColor, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            ⚠️ {n.title}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {n.affectsReport    && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: `${T.amber}12`, color: T.amber, border: `1px solid ${T.amber}22` }}>影響報表</span>}
              {!n.affectsDispatch && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: `rgba(0,255,156,0.08)`, color: T.green, border: '1px solid rgba(0,255,156,0.2)' }}>不占派單順位</span>}
            </span>
          </div>
          <p style={{ fontSize: 9, color: T.text, margin: 0, lineHeight: 1.7, fontFamily: T.font }}>{n.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// AckPanel
// ─────────────────────────────────────────────────────────
function AckPanel({ action, onCopy }: { action: DispatchReportPayload['footerAction']; onCopy: () => void }) {
  return (
    <div style={{ background: 'rgba(0,212,255,0.04)', border: `1px solid ${T.cyan}33`, borderRadius: 10, padding: '14px 16px', animation: 'dr-scaleIn 0.35s ease-out', boxShadow: '0 0 1px rgba(0,212,255,0.1)' }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.cyan, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        ✅ {action.title}
      </div>
      <p style={{ fontSize: 10, color: T.text, lineHeight: 1.7, margin: '0 0 10px', fontFamily: T.font }}>{action.instruction}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: T.green, background: 'rgba(0,255,156,0.08)', border: '1px solid rgba(0,255,156,0.22)', borderRadius: 8, padding: '8px 20px', fontFamily: T.mono, letterSpacing: '0.1em' }}>
          {action.fallbackText}
        </div>
        <button onClick={onCopy} style={{ fontSize: 10, fontWeight: 900, padding: '8px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(0,255,156,0.07)', border: '1px solid rgba(0,255,156,0.22)', color: T.green, fontFamily: T.font }}>
          📋 複製確認指示
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Page states
// ─────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 16, color: T.muted }}>
      <div style={{ position: 'relative', width: 48, height: 48 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.cyan}`, animation: 'dr-spin 0.9s linear infinite', boxShadow: `0 0 12px ${T.cyan}33` }} />
        <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: `2px solid ${T.border}`, borderBottom: `2px solid ${T.green}`, animation: 'dr-spin 1.4s linear infinite reverse', boxShadow: `0 0 8px rgba(0,255,156,0.2)` }} />
      </div>
      <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.08em', animation: 'dr-pulse 1.5s ease-in-out infinite' }}>載入資料中…</span>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div style={{ margin: '20px', padding: '16px 20px', borderRadius: 10, background: '#1a0000', border: '1px solid #7f1d1d', color: '#fca5a5', fontWeight: 700, fontSize: 12 }}>
      ❌ {message}
      <button onClick={onRetry} style={{ marginLeft: 12, fontSize: 10, padding: '4px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', cursor: 'pointer', fontWeight: 700 }}>重試</button>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ margin: '20px', padding: '16px 20px', borderRadius: 10, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>
      ⏳ 尚未生成派單排名，請先完成每日業績輸入 → 審計 → 排名流程。
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main page export
// ─────────────────────────────────────────────────────────
export function DispatchReportPage() {
  const { state, refetch, lastFetchedAt } = useDispatchReport();
  const { copy, toastMsg }                = useCopyText();

  const payload    = state.status === 'success' ? state.data : null;
  const rawItems   = payload?.rankingItems ?? [];
  const { all: sortedItems } = useSortedRankingItems(rawItems);

  const cardVMs    = useMemo(() => toRankingCardVMs(sortedItems), [sortedItems]);
  const noteVMs    = useMemo(() => toNoteCardVMs(payload?.notes ?? []), [payload]);

  const handleCopyPerson  = (vm: RankingCardVM) => copy(vm.copyText, `${vm.name} AI 點評`);
  const handleCopyManager = (vm: RankingCardVM) => copy(fmtManagerSummary({ ...vm, suggestion: '', pressureMessage: '', actionMessage: vm.actionMessage, aiAnalysis: vm.aiAnalysis, followupAmount: 0, followupCount: 0, isNewcomer: vm.isNewcomer, focusMetrics: vm.focusMetrics, tags: vm.tags, status: 'active', active: true, groupLabel: vm.group } as RankingItem), `${vm.name} 主管摘要`);
  const handleCopyGroup   = (group: string, label: string) => copy(fmtGroupList(group, label, rawItems), `${label} 名單`);
  const handleCopyHeader  = () => { if (payload) copy(fmtSummaryMetric(payload.reportMeta, payload.summaryMetrics), '公告標題'); };
  const handleCopySummary = (vm: SummaryCardVM) => copy(vm.copyText, vm.label);
  const handleCopyAck     = () => { if (payload) copy(fmtAckInstruction(payload.footerAction), '確認指示'); };

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100vh', fontFamily: T.font }}>
      <style>{`
        @keyframes dr-dot   { 0%,100%{box-shadow:0 0 4px #00D4FF,0 0 10px rgba(0,212,255,.5)} 50%{box-shadow:0 0 8px #00D4FF,0 0 20px rgba(0,212,255,.9)} }
        @keyframes dr-spin  { to{transform:rotate(360deg)} }
        @keyframes dr-fadeUp { from{opacity:0;transform:translateY(14px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes dr-scaleIn { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        @keyframes dr-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes dr-expand { from{opacity:0;max-height:0;transform:translateY(-4px)} to{opacity:1;max-height:300px;transform:translateY(0)} }
        @keyframes dr-groupGlow { 0%,100%{box-shadow:0 0 0 transparent} 50%{box-shadow:0 0 12px rgba(0,212,255,0.08)} }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(0,212,255,.18);border-radius:3px}
      `}</style>

      <FeedbackToast msg={toastMsg} />

      {/* ── Top bar ── */}
      <div style={{ padding: '10px 20px', borderBottom: `1px solid ${T.border}`, background: 'linear-gradient(135deg,rgba(3,5,12,0.88),rgba(7,12,24,0.65))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, position: 'sticky', top: 0, zIndex: 20, backdropFilter: 'blur(14px)', boxShadow: '0 2px 20px rgba(0,0,0,0.4), 0 0 1px rgba(0,212,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>📊</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: T.cyan, letterSpacing: '0.05em' }}>AI 派單報表</span>
          {state.status === 'success' && (
            <span style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, display: 'inline-block', animation: 'dr-pulse 2s infinite' }} />
              DISPATCH_REPORT · {state.data.reportMeta.date}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {lastFetchedAt && <span style={{ fontSize: 8, color: T.dim }}>更新：{new Date(lastFetchedAt).toLocaleTimeString('zh-TW')}</span>}
          <button onClick={refetch} style={{ fontSize: 10, padding: '5px 14px', borderRadius: 6, cursor: 'pointer', background: 'rgba(0,212,255,0.07)', border: `1px solid ${T.cyan}33`, color: T.cyan, fontWeight: 700, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.07)'; }}
          >
            🔄 刷新
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '16px 20px 32px', maxWidth: 960, margin: '0 auto' }}>
        {state.status === 'loading' && <LoadingState />}
        {state.status === 'error'   && <ErrorState message={state.message} onRetry={refetch} />}
        {state.status === 'empty'   && <EmptyState />}

        {state.status === 'success' && payload && (
          <>
            {/* A. Header + Summary */}
            <AnnouncementHeader
              payload={payload}
              onCopyHeader={handleCopyHeader}
              onCopySummary={handleCopySummary}
            />

            {/* B. Ranking board */}
            <RankingBoard
              items={cardVMs}
              onCopyPerson={handleCopyPerson}
              onCopyManager={handleCopyManager}
              onCopyGroup={handleCopyGroup}
            />

            {/* C. Notes (independent section) */}
            <NotePanel notes={noteVMs} />

            {/* D. Ack (always last) */}
            {payload.footerAction && <AckPanel action={payload.footerAction} onCopy={handleCopyAck} />}
          </>
        )}
      </div>
    </div>
  );
}
