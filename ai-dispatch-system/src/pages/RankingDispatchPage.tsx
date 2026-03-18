// ═══════════════════════════════════════════════════════
// RankingDispatchPage — 真實後端排名 + 派單 + 公告生成
// 帝王能量配色系統（非假資料版）
// ═══════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { rankingService } from '../services/ranking.service';
import type { RankingResult, RankingRow } from '../services/ranking.service';
import { dispatchService } from '../services/dispatch.service';
import type { DispatchResult, DispatchItem } from '../services/dispatch.service';
import { announcementService } from '../services/announcement.service';
import type { AnnouncementOutput } from '../services/announcement.service';
import { EMPEROR_UI, TU, MU, HUO, SHUI } from '../constants/wuxingColors';

interface RankingDispatchPageProps {
  reportDate: string;
}

function fmt(n: number) { return '$' + n.toLocaleString(); }

const GROUP_STYLE: Record<string, { accent: string; label: string }> = {
  A1: { accent: TU.bright,  label: 'A1 突破之刃' },
  A2: { accent: HUO.bright, label: 'A2 獵鷹部隊' },
  B:  { accent: MU.bright,  label: 'B 磐石陣線'  },
  C:  { accent: SHUI.text,  label: 'C 破風新銳'  },
};

function DispatchCard({ code, items }: { code: string; items: DispatchItem[] }) {
  const gs = GROUP_STYLE[code] ?? GROUP_STYLE['C'];
  return (
    <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + gs.accent + '44', borderRadius: 12, padding: '12px 14px', flex: 1, minWidth: 200 }}>
      <div style={{ fontWeight: 900, fontSize: 13, color: gs.accent, marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid ' + gs.accent + '33', display: 'flex', justifyContent: 'space-between' }}>
        <span>{gs.label}</span>
        <span style={{ fontSize: 11, color: EMPEROR_UI.textMuted }}>{items.length} 人</span>
      </div>
      {items.length === 0 && <div style={{ color: EMPEROR_UI.textDim, fontSize: 13, fontStyle: 'italic' }}>目前無人</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div key={item.groupOrderNo} style={{ background: EMPEROR_UI.pageBg, border: '1px solid ' + EMPEROR_UI.borderMain, borderRadius: 8, padding: '8px 10px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -9, left: -9, background: gs.accent, color: '#000', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 11 }}>{item.groupOrderNo}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: EMPEROR_UI.textPrimary, paddingLeft: 8 }}>{item.employeeName}</div>
              <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, background: EMPEROR_UI.cardBg, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + EMPEROR_UI.borderAccent }}>總 #{item.rankNo}</div>
            </div>
            {item.suggestionText && (
              <div style={{ fontSize: 12, color: EMPEROR_UI.textMuted, background: EMPEROR_UI.cardBg, padding: '5px 10px', borderRadius: 6, borderLeft: '2px solid ' + gs.accent }}>{item.suggestionText}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementPanel({ output, onCopy }: { output: AnnouncementOutput; onCopy: (text: string, label: string) => void }) {
  const tabs = [
    { key: 'full',    label: '完整版',  text: output.fullText },
    { key: 'line',    label: 'LINE 版', text: output.lineText },
    { key: 'short',   label: '超短版',  text: output.shortText },
    { key: 'voice',   label: '播報版',  text: output.voiceText },
    { key: 'manager', label: '主管版',  text: output.managerText },
  ];
  const [active, setActive] = useState('full');
  const current = tabs.find(t => t.key === active) ?? tabs[0];
  return (
    <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + TU.shadow, borderRadius: 12, padding: '12px 14px', marginTop: 12 }}>
      <div style={{ fontWeight: 900, fontSize: 13, color: TU.bright, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        📢 AI 公告輸出
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setActive(t.key)}
            style={{ border: '1px solid ' + (t.key === active ? TU.shadow : EMPEROR_UI.borderAccent), borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.key === active ? TU.void : EMPEROR_UI.pageBg, color: t.key === active ? TU.bright : EMPEROR_UI.textMuted }}>
            {t.label}
          </button>
        ))}
      </div>
      <textarea readOnly value={current.text}
        style={{ width: '100%', minHeight: 200, background: EMPEROR_UI.pageBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: EMPEROR_UI.textSecondary, fontFamily: '"Microsoft JhengHei", monospace', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
      />
      <div style={{ marginTop: 8 }}>
        <button type="button" onClick={() => onCopy(current.text, current.label)}
          style={{ border: '1px solid ' + TU.shadow, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: TU.void, color: TU.bright, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          📋 複製 {current.label}
        </button>
      </div>
    </div>
  );
}

export function RankingDispatchPage({ reportDate }: RankingDispatchPageProps): React.ReactElement {
  const [ranking, setRanking] = useState<RankingResult | null>(null);
  const [dispatch, setDispatch] = useState<DispatchResult | null>(null);
  const [announcement, setAnnouncement] = useState<AnnouncementOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [annLoading, setAnnLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copyMsg, setCopyMsg] = useState('');

  async function loadData() {
    try {
      setLoading(true);
      setMessage('');
      const rankData = await rankingService.generate(reportDate);
      setRanking(rankData);
      const dispData = await dispatchService.generate(reportDate);
      setDispatch(dispData);
    } catch (err: unknown) {
      const e = err as { responseMessage?: string; message?: string };
      setMessage(e?.responseMessage || e?.message || '生成排名失敗 ❌ 請確認已完成業績輸入與審計');
    } finally {
      setLoading(false);
    }
  }

  async function generateAnnouncement() {
    try {
      setAnnLoading(true);
      setMessage('');
      const output = await announcementService.generate(reportDate);
      setAnnouncement(output);
    } catch (err: unknown) {
      const e = err as { responseMessage?: string; message?: string };
      setMessage(e?.responseMessage || e?.message || '生成公告失敗 ❌');
    } finally {
      setAnnLoading(false);
    }
  }

  function copyText(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('已複製「' + label + '」✓');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  }

  useEffect(() => { void loadData(); }, [reportDate]);

  const btnBase: React.CSSProperties = { border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8 };

  return (
    <div style={{ padding: '14px 16px', background: EMPEROR_UI.pageBg, minHeight: '100%', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ── 摘要卡片 ── */}
      {ranking && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 14 }}>
          {Object.entries(ranking.summary.platformBreakdown).map(([platform, revenue]) => (
            <div key={platform} style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderLeft: '3px solid ' + TU.bright, borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, fontWeight: 700, marginBottom: 3 }}>{platform}</div>
              <div style={{ fontSize: 19, fontWeight: 900, color: TU.text }}>{fmt(revenue)}</div>
            </div>
          ))}
          <div style={{ background: EMPEROR_UI.sidebarBg, border: '1px solid ' + TU.shadow, borderLeft: '3px solid ' + TU.bright, borderRadius: 10, padding: '10px 12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -8, top: -6, fontSize: 36, opacity: 0.07, pointerEvents: 'none' }}>💰</div>
            <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, fontWeight: 700, marginBottom: 3 }}>💰 整合總業績</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: TU.bright }}>{fmt(ranking.summary.totalRevenue)}</div>
          </div>
          <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderLeft: '3px solid ' + MU.bright, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, fontWeight: 700, marginBottom: 3 }}>參賽人數</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: MU.text }}>{ranking.rankings.length} 人</div>
          </div>
        </div>
      )}

      {/* ── 英雄榜 ── */}
      {ranking && ranking.rankings.length > 0 && (
        <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 14, color: TU.bright, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏆 英雄榜（整合名次）
            <span style={{ fontSize: 11, color: EMPEROR_UI.textMuted, fontWeight: 600 }}>依【總業績】→【續單】→【追單】</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: EMPEROR_UI.sidebarBg }}>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'center', width: 44 }}>名次</th>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'left' }}>姓名</th>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>追單</th>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>續單業績</th>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>總業績</th>
                  <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: TU.bright, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>實收</th>
                </tr>
              </thead>
              <tbody>
                {ranking.rankings.map((row: RankingRow) => {
                  const isTop3 = row.rankNo <= 3;
                  const isTop10 = row.rankNo <= 10;
                  const group = row.rankingRuleText ?? '';
                  const groupColor =
                    group.includes('A1') ? '#ff6b35' :
                    group.includes('A2') ? HUO.bright :
                    group.includes('B')  ? MU.bright  : SHUI.text;
                  const rankColor = row.rankNo === 1 ? TU.bright : row.rankNo === 2 ? '#e0e0e0' : row.rankNo === 3 ? HUO.bright : EMPEROR_UI.textDim;
                  return (
                    <React.Fragment key={row.rankNo}>
                      <tr style={{ background: isTop3 ? TU.abyss : isTop10 ? 'rgba(0,212,255,0.02)' : 'transparent', transition: 'background 0.15s' }}>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'center', fontWeight: 900, fontSize: isTop3 ? 17 : 13, color: rankColor, verticalAlign: 'middle' }}>#{row.rankNo}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontWeight: isTop3 ? 900 : 700, fontSize: 15, color: isTop3 ? EMPEROR_UI.textPrimary : EMPEROR_UI.textSecondary }}>{row.employeeName}</span>
                            {group && (
                              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: groupColor + '22', border: '1px solid ' + groupColor + '55', color: groupColor, fontWeight: 900, letterSpacing: '0.06em' }}>
                                {group.match(/A1|A2|B組|C組/)?.[0] ?? group.slice(0,2)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', color: EMPEROR_UI.textSecondary, verticalAlign: 'middle' }}>{row.totalFollowupCount}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', color: EMPEROR_UI.textSecondary, verticalAlign: 'middle' }}>{fmt(row.totalFollowupAmount)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', color: EMPEROR_UI.textSecondary, verticalAlign: 'middle' }}>{fmt(row.totalRevenueAmount)}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', fontWeight: 800, color: TU.bright, verticalAlign: 'middle', fontSize: 13 }}>{fmt(row.totalActualAmount)}</td>
                      </tr>
                      {row.rankingRuleText && (
                        <tr style={{ background: isTop3 ? TU.abyss : 'transparent' }}>
                          <td />
                          <td colSpan={5} style={{ padding: '0 10px 7px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain }}>
                            <div style={{ fontSize: 11, color: EMPEROR_UI.textMuted, background: EMPEROR_UI.pageBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderLeft: '3px solid ' + groupColor, borderRadius: 5, padding: '4px 10px', lineHeight: 1.5 }}>
                              💬 {row.rankingRuleText}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 派單分組 ── */}
      {dispatch && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 13, color: HUO.bright, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            🎯 明日 AI 派單分組
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            {(['A1', 'A2', 'B', 'C'] as const).map(code => (
              <DispatchCard key={code} code={code} items={dispatch.groups[code] ?? []} />
            ))}
          </div>
        </div>
      )}

      {/* ── 公告輸出 ── */}
      {announcement && <AnnouncementPanel output={announcement} onCopy={copyText} />}

      {/* ── 操作按鈕列 ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid ' + EMPEROR_UI.borderAccent, marginTop: 6 }}>
        <button type="button" onClick={loadData} disabled={loading}
          style={{ ...btnBase, background: EMPEROR_UI.cardBg, color: EMPEROR_UI.textSecondary, border: '1px solid ' + EMPEROR_UI.borderAccent, opacity: loading ? 0.6 : 1 }}>
          🔄 {loading ? '計算中…' : '重新生成排名與派單'}
        </button>
        <button type="button" onClick={generateAnnouncement} disabled={annLoading || !ranking}
          style={{ ...btnBase, background: TU.void, color: TU.bright, border: '1px solid ' + TU.shadow, opacity: (annLoading || !ranking) ? 0.6 : 1 }}>
          📢 {annLoading ? '生成中…' : '生成公告文稿'}
        </button>
        {announcement && (
          <button type="button" onClick={() => copyText(announcement.fullText, '完整版')}
            style={{ ...btnBase, background: MU.void, color: MU.bright, border: '1px solid ' + MU.shadow, fontSize: 13 }}>
            📋 一鍵複製完整公告
          </button>
        )}
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 8, background: HUO.abyss, color: HUO.bright, fontWeight: 700, fontSize: 14, border: '1px solid ' + HUO.shadow }}>
          {message}
        </div>
      )}
      {copyMsg && (
        <div style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: MU.abyss, color: MU.bright, fontWeight: 700, fontSize: 13, border: '1px solid ' + MU.shadow }}>
          {copyMsg}
        </div>
      )}
    </div>
  );
}
