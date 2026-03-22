/**
 * AnnouncementStructuredView
 * 把 StructuredAnnouncement 資料自動渲染成卡片式公告版面
 * 無論資料多少人，自動排序、自動分區、自動顯示
 */
import { useState } from 'react';
import type {
  StructuredAnnouncement, RankingItem, NoteItem,
} from '../types/announcement';
import { GROUP_COLORS, GROUP_LABELS } from '../types/announcement';
import { EMPEROR_UI, UI } from '../constants/wuxingColors';
import { FeedbackToast } from './Unified';

const T = UI;

// ─────────────────────────────────────────────
// AnnouncementHeader
// ─────────────────────────────────────────────
function AnnouncementHeader({ meta, onCopy }: {
  meta: StructuredAnnouncement['reportMeta'];
  onCopy: () => void;
}) {
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(3,5,12,0.9), rgba(7,12,24,0.7))`,
      border: `1px solid ${T.cyan}22`, borderRadius: 12, padding: '16px 20px',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: T.cyan, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 8px ${T.cyan}`, animation: 'sv-dot 2s infinite', display: 'inline-block' }} />
            📣 {meta.title}
          </div>
          <div style={{ fontSize: 9, color: T.muted, marginTop: 4, letterSpacing: '0.5px', display: 'flex', gap: 10 }}>
            <span>{meta.dateLabel} 結算 → {meta.nextDate} 派單</span>
            <span style={{ color: T.dim }}>|</span>
            <span>{meta.theme}</span>
            <span style={{ color: T.dim }}>|</span>
            <span>共 {meta.totalCount} 人</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(0,255,156,0.08)', border: `1px solid rgba(0,255,156,0.2)`, borderRadius: 6, padding: '4px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 8, color: T.muted }}>整合總盤</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: T.green, fontFamily: T.mono }}>${meta.totalRevenue.toLocaleString()}</div>
          </div>
          <button
            onClick={onCopy}
            style={{
              fontSize: 10, fontWeight: 900, padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
              background: 'rgba(0,212,255,0.07)', border: `1px solid ${T.cyan}44`, color: T.cyan,
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,212,255,0.07)'; }}
          >
            📋 複製公告標題
          </button>
        </div>
      </div>
      {meta.requireAck && (
        <div style={{ marginTop: 10, fontSize: 9, color: T.amber, background: 'rgba(245,158,11,0.07)', border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 6, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
          ⚠️ 本公告需全員確認，請看完後回覆「+1」
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MetricTagGroup — 指標標籤列
// ─────────────────────────────────────────────
function MetricTagGroup({ metrics, tags, group }: { metrics: string[]; tags: string[]; group: string }) {
  const accent = GROUP_COLORS[group] ?? T.cyan;
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6 }}>
      {tags.map(t => (
        <span key={t} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: `${accent}18`, color: accent, border: `1px solid ${accent}33`, fontWeight: 800, letterSpacing: '0.04em' }}>{t}</span>
      ))}
      {metrics.map(m => (
        <span key={m} style={{ fontSize: 8, padding: '2px 7px', borderRadius: 10, background: 'rgba(0,212,255,0.06)', color: T.muted, border: `1px solid rgba(0,212,255,0.12)`, fontFamily: 'monospace' }}>{m}</span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RankingCard — 單人排名卡
// ─────────────────────────────────────────────
function RankingCard({ item, onCopy }: { item: RankingItem; onCopy: (item: RankingItem) => void }) {
  const [expanded, setExpanded] = useState(false);
  const accent = GROUP_COLORS[item.group] ?? T.cyan;
  const rankColors: Record<number, string> = { 1: T.gold, 2: '#c0c0c0', 3: '#cd7f32' };
  const rankColor = rankColors[item.rank] ?? T.muted;
  const isTop3 = item.rank <= 3;

  return (
    <div style={{
      background: T.card,
      border: `1px solid ${isTop3 ? accent + '44' : T.border}`,
      borderRadius: 10, padding: '12px 14px', marginBottom: 8,
      boxShadow: isTop3 ? `0 0 16px ${accent}18` : 'none',
      transition: 'box-shadow 0.2s',
    }}>
      {/* Row 1: 名次 + 姓名 + 梯隊 + 操作 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {/* 名次 */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, background: `${rankColor}18`,
          border: `1px solid ${rankColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 900, color: rankColor, fontFamily: T.mono }}>{item.rank}</span>
        </div>

        {/* 姓名 + 新人標記 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{item.name}</span>
            {item.isNewcomer && (
              <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 10, background: 'rgba(139,92,246,0.15)', color: '#c084fc', border: '1px solid rgba(139,92,246,0.25)', fontWeight: 900 }}>新人</span>
            )}
            <span style={{ fontSize: 8, padding: '1px 6px', borderRadius: 4, background: `${accent}14`, color: accent, border: `1px solid ${accent}33`, fontWeight: 800 }}>{item.group}</span>
          </div>
          <div style={{ fontSize: 8, color: T.muted, marginTop: 1 }}>{item.summaryTitle}</div>
        </div>

        {/* 總業績 */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: T.green, fontFamily: T.mono }}>${item.totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: 7, color: T.dim }}>總業績</div>
        </div>

        {/* 複製 + 展開 */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => onCopy(item)}
            style={{ fontSize: 9, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', background: 'rgba(0,212,255,0.07)', border: `1px solid ${T.cyan}33`, color: T.cyan, fontWeight: 700 }}
          >📋</button>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ fontSize: 9, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: T.muted, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}
          >▾</button>
        </div>
      </div>

      {/* Row 2: AI 主判讀（常駐） */}
      <div style={{ fontSize: 10, color: T.text, lineHeight: 1.6, fontFamily: T.font, background: 'rgba(0,212,255,0.03)', borderRadius: 6, padding: '6px 8px' }}>
        {item.aiAnalysis || item.actionMessage}
      </div>

      {/* 指標標籤（常駐） */}
      <MetricTagGroup metrics={item.focusMetrics} tags={item.tags} group={item.group} />

      {/* 展開：建議 + 壓力句 + 行動句 */}
      {expanded && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {item.suggestion && (
            <div style={{ fontSize: 9, color: T.muted, padding: '5px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 5, borderLeft: `2px solid ${T.cyan}44` }}>
              <span style={{ color: T.cyan, fontWeight: 700, fontSize: 8 }}>建議 </span>{item.suggestion}
            </div>
          )}
          {item.pressureMessage && (
            <div style={{ fontSize: 9, color: T.amber, padding: '5px 8px', background: 'rgba(245,158,11,0.05)', borderRadius: 5, borderLeft: `2px solid ${T.amber}66` }}>
              <span style={{ fontWeight: 700, fontSize: 8 }}>壓力 </span>{item.pressureMessage}
            </div>
          )}
          {item.actionMessage && item.actionMessage !== item.aiAnalysis && (
            <div style={{ fontSize: 9, color: T.green, padding: '5px 8px', background: 'rgba(0,255,156,0.04)', borderRadius: 5, borderLeft: `2px solid ${T.green}55` }}>
              <span style={{ fontWeight: 700, fontSize: 8 }}>行動 </span>{item.actionMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// RankingBoard — 自動分組 + 排序渲染
// ─────────────────────────────────────────────
function RankingBoard({ items, onCopyItem }: { items: RankingItem[]; onCopyItem: (item: RankingItem) => void }) {
  const sorted = [...items].filter(i => i.active).sort((a, b) => a.displayOrder - b.displayOrder);
  const groups = ['A1', 'A2', 'B', 'C'] as const;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.cyan, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.cyan, boxShadow: `0 0 5px ${T.cyan}`, display: 'inline-block' }} />
        派單順序 · 全員排名
      </div>

      {groups.map(g => {
        const gItems = sorted.filter(i => i.group === g);
        if (!gItems.length) return null;
        const color = GROUP_COLORS[g];
        return (
          <div key={g} style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 9, fontWeight: 900, color, padding: '3px 8px',
              background: `${color}10`, borderRadius: 4, marginBottom: 5,
              letterSpacing: '0.06em', display: 'inline-block',
            }}>
              {GROUP_LABELS[g]}
            </div>
            {gItems.map(item => (
              <RankingCard key={item.name} item={item} onCopy={onCopyItem} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// NotePanel — 補充說明（獨立區，不混入排名）
// ─────────────────────────────────────────────
function NotePanel({ notes }: { notes: NoteItem[] }) {
  if (!notes.length) return null;
  const sorted = [...notes].sort((a, b) => a.displayOrder - b.displayOrder);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.amber, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.amber, display: 'inline-block' }} />
        補充說明
      </div>
      {sorted.map((n, i) => (
        <div key={i} style={{
          background: 'rgba(245,158,11,0.04)', border: `1px solid rgba(245,158,11,0.18)`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 6,
        }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: T.amber, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
            ⚠️ {n.title}
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {n.affectsReport && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: 'rgba(245,158,11,0.12)', color: T.amber, border: '1px solid rgba(245,158,11,0.2)' }}>影響報表</span>}
              {!n.affectsDispatch && <span style={{ fontSize: 7, padding: '1px 5px', borderRadius: 3, background: 'rgba(0,255,156,0.08)', color: T.green, border: '1px solid rgba(0,255,156,0.2)' }}>不占派單順位</span>}
            </span>
          </div>
          <p style={{ fontSize: 9, color: T.text, margin: 0, lineHeight: 1.65, fontFamily: T.font }}>{n.content}</p>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// AckPanel — 最後確認區
// ─────────────────────────────────────────────
function AckPanel({ action, onCopy }: { action: StructuredAnnouncement['footerAction']; onCopy: () => void }) {
  return (
    <div style={{
      background: 'rgba(0,212,255,0.04)', border: `1px solid ${T.cyan}33`,
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: T.cyan, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        ✅ {action.title}
      </div>
      <p style={{ fontSize: 10, color: T.text, lineHeight: 1.65, margin: '0 0 10px', fontFamily: T.font }}>{action.instruction}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          fontSize: 16, fontWeight: 900, color: T.green, background: 'rgba(0,255,156,0.08)',
          border: `1px solid rgba(0,255,156,0.25)`, borderRadius: 8, padding: '8px 20px',
          fontFamily: T.mono, letterSpacing: '0.1em',
        }}>
          {action.fallbackText}
        </div>
        <button
          onClick={onCopy}
          style={{
            fontSize: 10, fontWeight: 900, padding: '8px 16px', borderRadius: 7, cursor: 'pointer',
            background: 'rgba(0,255,156,0.07)', border: `1px solid rgba(0,255,156,0.25)`, color: T.green,
          }}
        >
          📋 複製確認指示
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
interface Props {
  data:     StructuredAnnouncement;
  onClose?: () => void;
}

export function AnnouncementStructuredView({ data, onClose }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast(label);
      setTimeout(() => setToast(null), 2000);
    });
  };

  const copyItem = (item: RankingItem) => {
    const txt = [
      `【${item.name}】第 ${item.rank} 名 · ${item.group}`,
      item.aiAnalysis || item.actionMessage,
      item.suggestion ? `建議：${item.suggestion}` : '',
      item.pressureMessage ? `${item.pressureMessage}` : '',
      item.actionMessage  ? `${item.actionMessage}`  : '',
    ].filter(Boolean).join('\n');
    copy(txt, `已複製 ${item.name} AI 點評`);
  };

  const copyHeaderText = () => {
    const m = data.reportMeta;
    copy(`📣【AI 派單公告｜${m.dateLabel} 結算 → ${m.nextDate} 派單順序】\n整合總盤：$${m.totalRevenue.toLocaleString()}`, '已複製公告標題');
  };

  const copyAck = () => copy(data.footerAction.instruction + '\n' + data.footerAction.fallbackText, '已複製確認指示');

  return (
    <div style={{
      background: EMPEROR_UI.pageBg, minHeight: '100%',
      fontFamily: T.font, padding: '16px 20px',
    }}>
      <style>{`
        @keyframes sv-dot   { 0%,100%{box-shadow:0 0 4px #00D4FF,0 0 10px rgba(0,212,255,.5)} 50%{box-shadow:0 0 8px #00D4FF,0 0 20px rgba(0,212,255,.9)} }
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(0,212,255,.2);border-radius:3px}
      `}</style>

      <FeedbackToast msg={toast} />

      {/* 頂部工具列 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: T.cyan, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13 }}>📊</span> 結構化公告視圖
          <span style={{ fontSize: 8, color: T.muted, fontFamily: 'monospace', marginLeft: 4 }}>AUTO_RENDER</span>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ fontSize: 9, color: T.muted, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 10px', cursor: 'pointer' }}>
            ✕ 關閉
          </button>
        )}
      </div>

      {/* A. 標題區 */}
      <AnnouncementHeader meta={data.reportMeta} onCopy={copyHeaderText} />

      {/* B. 排名主列表（自動按 group + displayOrder 排序） */}
      <RankingBoard items={data.rankingItems} onCopyItem={copyItem} />

      {/* C. 補充說明（不混入排名） */}
      <NotePanel notes={data.notes} />

      {/* D. 最後確認（固定最下方） */}
      <AckPanel action={data.footerAction} onCopy={copyAck} />
    </div>
  );
}
