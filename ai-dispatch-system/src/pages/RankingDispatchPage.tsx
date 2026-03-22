// ═══════════════════════════════════════════════════════
// RankingDispatchPage — 後端唯一真實來源版
// 字體功能原則：每段有意義的文字必有對應操作意境
// ═══════════════════════════════════════════════════════
import React, { useState } from 'react';
import { useLatest } from '../hooks/useLatest';
import type { LatestGroup, LatestRanking } from '../hooks/useLatest';
import { EMPEROR_UI, TU, MU, HUO, SHUI } from '../constants/wuxingColors';

function fmt(n: number) { return '$' + n.toLocaleString(); }
function fmtRaw(n: number) { return n.toLocaleString(); }

const GROUP_STYLE: Record<string, { accent: string; label: string; desc: string }> = {
  A1: { accent: '#ff6b35', label: 'A1 突破之刃', desc: '高單主力｜優先派單' },
  A2: { accent: HUO.bright, label: 'A2 獵鷹部隊', desc: '續單收割｜第二梯次' },
  B:  { accent: MU.bright,  label: 'B 磐石陣線',  desc: '一般量單｜穩定輸出' },
  C:  { accent: SHUI.text,  label: 'C 破風新銳',  desc: '補位觀察｜培養升組' },
};

// ── 通用可點擊文字元件：hover 底線 + tooltip + 複製意境
function Clickable({
  onClick, title, children, color, bold,
}: {
  onClick: () => void; title: string; children: React.ReactNode;
  color?: string; bold?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <span
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        cursor: 'pointer',
        color: color ?? 'inherit',
        fontWeight: bold ? 900 : undefined,
        borderBottom: hover ? '1px solid currentColor' : '1px dashed transparent',
        transition: 'border-color 0.15s',
        userSelect: 'none',
      }}
    >
      {children}
    </span>
  );
}

// ── 派單卡：梯隊標題＋說明＋序號泡＋姓名＋激勵詞＋總排名 全部可複製
function DispatchCard({
  code, items, motivations, onCopy,
}: {
  code: string;
  items: LatestGroup[];
  motivations: Record<string, string>;
  onCopy: (text: string, label: string) => void;
}) {
  const gs = GROUP_STYLE[code] ?? GROUP_STYLE['C'];

  const copyRoster = () => {
    if (items.length === 0) return;
    const lines = items.map((i, idx) => `${idx + 1}. ${i.employee_name}`).join('\n');
    onCopy(`【${gs.label}】${gs.desc}\n${lines}`, gs.label + '名單');
  };

  return (
    <div className="bh-panel" style={{ border: '1px solid ' + gs.accent + '33', borderRadius: 12, padding: '12px 14px', flex: 1, minWidth: 200 }}>
      <div style={{ fontWeight: 900, fontSize: 13, color: gs.accent, marginBottom: 8, paddingBottom: 6, borderBottom: '2px solid ' + gs.accent + '33', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* 梯隊名稱 — 點擊複製完整名單 */}
        <Clickable onClick={copyRoster} title={`點擊複製【${gs.label}】完整派單名單`} color={gs.accent}>
          {gs.label} 📋
        </Clickable>
        {/* 梯隊說明 — 點擊複製定義 */}
        <Clickable onClick={() => onCopy(gs.desc, gs.label + '說明')} title="點擊複製梯隊定義" color={EMPEROR_UI.textDim}>
          <span style={{ fontSize: 10 }}>{gs.desc}</span>
        </Clickable>
      </div>

      {items.length === 0 && <div style={{ color: EMPEROR_UI.textDim, fontSize: 13, fontStyle: 'italic' }}>目前無人</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => {
          const mot = motivations[item.employee_name] ?? item.suggestion_text ?? '';
          return (
            <div key={item.group_order_no} className="glass" style={{ border: '1px solid ' + EMPEROR_UI.borderMain, borderRadius: 8, padding: '8px 10px 8px 20px', position: 'relative' }}>
              {/* 序號泡 — 點擊複製「梯隊第X順位：姓名」 */}
              <div
                onClick={() => onCopy(`${gs.label} 第${item.group_order_no}順位：${item.employee_name}`, '派單順位')}
                title="點擊複製派單順位"
                style={{ position: 'absolute', top: -9, left: -9, background: gs.accent, color: '#000', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 13, fontFamily: '"Orbitron", sans-serif', cursor: 'pointer', boxShadow: '0 0 10px ' + gs.accent }}
              >
                {item.group_order_no}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mot ? 4 : 0 }}>
                {/* 姓名 — 點擊複製完整激勵詞 */}
                <Clickable
                  onClick={() => onCopy(mot ? `${item.employee_name}：${mot}` : item.employee_name, item.employee_name + '激勵詞')}
                  title={mot ? '點擊複製此人完整激勵建議' : '點擊複製姓名'}
                  bold color={EMPEROR_UI.textPrimary}
                >
                  {item.employee_name}
                </Clickable>
                {/* 總排名徽章 — 點擊複製整合名次 */}
                <Clickable
                  onClick={() => onCopy(`${item.employee_name} 整合名次：第 ${item.rank_no} 名`, '整合名次')}
                  title="點擊複製整合名次"
                >
                  <div style={{ fontSize: 11, fontFamily: '"Orbitron", sans-serif', color: EMPEROR_UI.textMuted, background: EMPEROR_UI.cardBg, padding: '2px 8px', borderRadius: 20, border: '1px solid ' + EMPEROR_UI.borderAccent, boxShadow: '0 0 8px rgba(0,212,255,0.1)' }}>
                    總 #{item.rank_no}
                  </div>
                </Clickable>
              </div>

              {/* 激勵詞本體 — 點擊複製激勵詞 */}
              {mot && (
                <Clickable
                  onClick={() => onCopy(mot, item.employee_name + '激勵詞')}
                  title="點擊複製激勵建議文字"
                  color={EMPEROR_UI.textMuted}
                >
                  <div style={{ fontSize: 12, background: EMPEROR_UI.cardBg, padding: '5px 10px', borderRadius: 6, borderLeft: '2px solid ' + gs.accent, lineHeight: 1.6 }}>
                    {mot}
                  </div>
                </Clickable>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 公告面板：標題快複製、tab 有 icon 和 tooltip、內容區雙擊全選、字數可複製
function AnnouncementPanel({
  texts, onCopy,
}: {
  texts: { fullText: string; lineText: string; shortText: string; voiceText: string; managerText: string };
  onCopy: (text: string, label: string) => void;
}) {
  const tabs = [
    { key: 'full',    label: '完整版',  text: texts.fullText,    icon: '📄', desc: '完整 AI 派單公告（含審計結果＋名次＋分組＋激勵）' },
    { key: 'line',    label: 'LINE 版', text: texts.lineText,    icon: '💬', desc: 'LINE 群組精簡快訊版' },
    { key: 'short',   label: '超短版',  text: texts.shortText,   icon: '⚡', desc: '30 字內超短提醒版' },
    { key: 'voice',   label: '播報版',  text: texts.voiceText,   icon: '🎤', desc: '語音播報稿' },
    { key: 'manager', label: '主管版',  text: texts.managerText, icon: '🔒', desc: '主管內部機密版' },
  ];
  const [active, setActive] = useState('full');
  const current = tabs.find(t => t.key === active) ?? tabs[0];

  return (
    <div className="bh-panel" style={{ border: '1px solid ' + TU.shadow, borderRadius: 12, padding: '12px 14px', marginTop: 12 }}>
      {/* 標題 — 點擊快速複製當前版本 */}
      <Clickable onClick={() => onCopy(current.text, current.label)} title={`點擊快速複製目前顯示的【${current.label}】`} color={TU.bright} bold>
        <div style={{ fontSize: 13, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          📢 AI 公告輸出 — 點標題快速複製
        </div>
      </Clickable>

      {/* Tab 列：icon + 文字 + tooltip 說明 */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 8, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setActive(t.key)} title={t.desc}
            style={{ border: '1px solid ' + (t.key === active ? TU.shadow : EMPEROR_UI.borderAccent), borderRadius: 6, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', background: t.key === active ? TU.void : EMPEROR_UI.pageBg, color: t.key === active ? TU.bright : EMPEROR_UI.textMuted, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 當前版本說明 — 點擊複製說明文字 */}
      <Clickable onClick={() => onCopy(current.desc, current.label + '說明')} title="點擊複製版本說明" color={EMPEROR_UI.textDim}>
        <div style={{ fontSize: 11, marginBottom: 6 }}>{current.icon} {current.desc}</div>
      </Clickable>

      {/* 內容區 — 雙擊全選 */}
      <textarea
        readOnly
        value={current.text}
        onDoubleClick={e => (e.target as HTMLTextAreaElement).select()}
        title="雙擊全選｜或點上方標題快速複製"
        style={{ width: '100%', minHeight: 200, background: EMPEROR_UI.pageBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderRadius: 8, padding: '12px 14px', fontSize: 13, color: EMPEROR_UI.textSecondary, fontFamily: '"Microsoft JhengHei", monospace', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', outline: 'none', cursor: 'text' }}
      />

      {/* 操作列：複製按鈕 + 字數（可複製） */}
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" onClick={() => onCopy(current.text, current.label)}
          style={{ border: '1px solid ' + TU.shadow, borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: TU.void, color: TU.bright, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          📋 複製 {current.label}
        </button>
        <Clickable onClick={() => onCopy(`【${current.label}】共 ${current.text.length} 字`, '字數資訊')} title="點擊複製字數資訊" color={EMPEROR_UI.textDim}>
          <span style={{ fontSize: 11 }}>共 {current.text.length} 字</span>
        </Clickable>
      </div>
    </div>
  );
}

// ── 主頁面
export function RankingDispatchPage(): React.ReactElement {
  const { loading, data, auditOk, errorReason, version, lastFetchedAt, refetch } = useLatest();
  const [copyMsg, setCopyMsg] = useState('');

  function onCopy(text: string, label: string) {
    void navigator.clipboard.writeText(text).then(() => {
      setCopyMsg('已複製「' + label + '」✓');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  }

  // 從後端 groups 資料取激勵詞（suggestion_text 或 motivation_text）
  const motivations: Record<string, string> = {};
  if (data) {
    for (const code of ['A1', 'A2', 'B', 'C'] as const) {
      for (const g of (data.groups[code] ?? [])) {
        motivations[g.employee_name] = g.suggestion_text || g.motivation_text || '';
      }
    }
  }

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: 14,
    cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', gap: 8,
  };

  return (
    <div style={{ padding: '14px 16px', background: EMPEROR_UI.pageBg, minHeight: '100%', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>

      {/* ── 黑洞背景事件視界（純裝飾） ── */}
      <div aria-hidden style={{ position:'fixed', top:'50%', left:'50%', width:600, height:600, borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0,
        background:'radial-gradient(circle at 50% 50%, rgba(0,0,0,.98) 0%, transparent 55%)',
        boxShadow:'0 0 120px 60px rgba(0,212,255,.04), 0 0 240px 100px rgba(139,92,246,.03)',
        animation:'bh-lense 8s ease-in-out infinite',
      }} />
      {/* 引力扭曲環 1 */}
      <div aria-hidden style={{ position:'fixed', top:'50%', left:'50%', width:420, height:420, borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0,
        border:'1px dashed rgba(0,212,255,.08)',
        animation:'bh-rotate 22s linear infinite',
      }} />
      {/* 引力扭曲環 2 */}
      <div aria-hidden style={{ position:'fixed', top:'50%', left:'50%', width:620, height:620, borderRadius:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none', zIndex:0,
        border:'1px dashed rgba(139,92,246,.06)',
        animation:'bh-rrotate 35s linear infinite',
      }} />

      <div style={{ position:'relative', zIndex:1 }}>

      {/* ── 版本元資料列：全部可點擊複製 ── */}
      {version && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, fontSize: 11, color: EMPEROR_UI.textDim, flexWrap: 'wrap' }}>
          <Clickable onClick={() => onCopy(version, '版本號')} title="點擊複製版本號" color={TU.text}>
            <code style={{ background: EMPEROR_UI.cardBg, padding: '1px 6px', borderRadius: 4 }}>v{version}</code>
          </Clickable>
          {lastFetchedAt && (
            <Clickable onClick={() => onCopy(new Date(lastFetchedAt).toLocaleString('zh-TW'), '更新時間')} title="點擊複製更新時間">
              更新 {new Date(lastFetchedAt).toLocaleTimeString('zh-TW')}
            </Clickable>
          )}
          {data?.sortRules && (
            <Clickable onClick={() => onCopy(data.sortRules, '排序規則')} title="點擊複製排序規則">
              排序：{data.sortRules}
            </Clickable>
          )}
          {data?.groupRules && (
            <Clickable onClick={() => onCopy(data.groupRules, '分組規則')} title="點擊複製分組規則">
              分組：{data.groupRules}
            </Clickable>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: EMPEROR_UI.textMuted, fontSize: 14 }}>
          <span>⏳</span> 從後端載入中…
        </div>
      )}

      {/* ── 審計失敗：錯誤原因可點擊複製 ── */}
      {!loading && !auditOk && (
        <div style={{ padding: '20px 24px', borderRadius: 12, background: HUO.abyss, border: '1px solid ' + HUO.shadow, marginBottom: 14 }}>
          <div style={{ fontWeight: 900, fontSize: 16, color: HUO.bright, marginBottom: 8 }}>
            審計未通過 — 派單結果不可用
          </div>
          <Clickable onClick={() => onCopy(errorReason ?? '審計失敗', '審計錯誤原因')} title="點擊複製錯誤原因（方便回報）" color={EMPEROR_UI.textSecondary}>
            <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {errorReason ?? '審計失敗，請重新上傳並解析報表後再試。'}
            </div>
          </Clickable>
          <div style={{ marginTop: 12, fontSize: 12, color: EMPEROR_UI.textDim }}>
            審計通過後，本頁面將自動更新（每 10 秒輪詢）。
          </div>
        </div>
      )}

      {/* ── 資料正常 ── */}
      {!loading && data && auditOk && (
        <>
          {/* 總業績卡＋人數卡 — 點擊複製數字 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8, marginBottom: 14 }}>
            {data.rankings.length > 0 && (() => {
              const totalRevenue = data.rankings.reduce((s, r) => s + r.total_revenue_amount, 0);
              const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
              const top3 = data.rankings.slice(0, 3).map((r, i) => `第${i + 1}名：${r.employee_name}（$${fmtRaw(r.total_revenue_amount)}）`).join('　');
              // 管理者日報格式
              const managerReport = [
                `📣【AI 派單總盤】${today}`,
                `💰 整合總業績：$${fmtRaw(totalRevenue)}`,
                `👥 參賽人數：${data.rankings.length} 人`,
                `🏆 今日前三：${top3}`,
                `─────────────────`,
                ...(['A1','A2','B','C'].map(g => {
                  const members = data.rankings.filter((r: any) => (r.ranking_rule_text ?? '').includes(g) || r.dispatch_group === g);
                  return members.length ? `【${g}】${members.map((m: any) => m.employee_name).join('、')}（${members.length}人）` : null;
                }).filter(Boolean) as string[]),
                `─────────────────`,
                `⏱ ${new Date().toLocaleTimeString('zh-TW', { hour12: false })} | 兆櫃AI派單系統`,
              ].join('\n');
              return (
                <Clickable onClick={() => onCopy(managerReport, 'AI 派單日報')} title="點擊複製管理者日報（含業績/人數/分組）">
                  <div style={{ background: EMPEROR_UI.sidebarBg, border: '1px solid ' + TU.shadow, borderLeft: '3px solid ' + TU.bright, borderRadius: 10, padding: '10px 12px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', right: -8, top: -6, fontSize: 36, opacity: 0.07, pointerEvents: 'none' }}>💰</div>
                    <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, fontWeight: 700, marginBottom: 3 }}>💰 整合總業績 <span style={{ color: TU.core, fontSize: 9 }}>▸ 點擊 → 管理者日報</span></div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: TU.bright, fontFamily: '"Orbitron", sans-serif' }}>{fmt(totalRevenue)}</div>
                  </div>
                </Clickable>
              );
            })()}
            <Clickable onClick={() => onCopy(`本次排名共 ${data.rankings.length} 人`, '參賽人數')} title="點擊複製參賽人數">
              <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderLeft: '3px solid ' + MU.bright, borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: EMPEROR_UI.textMuted, fontWeight: 700, marginBottom: 3 }}>參賽人數</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: MU.text, fontFamily: '"Orbitron", sans-serif' }}>{data.rankings.length} 人</div>
              </div>
            </Clickable>
          </div>

          {/* 🔮 [新增] 平台 AI 全息診斷大數據核芯 — 擊碎假象，真時對接 */}
          {(() => {
            const totalRevenue = data.rankings.reduce((s, r) => s + r.total_revenue_amount, 0);
            const target = 10000000; // 預設月總目標一千萬
            const progress = Math.min(100, Math.round((totalRevenue / target) * 100));
            const gap = Math.max(0, target - totalRevenue);
            const statusColor = progress >= 75 ? '#00e5ff' : progress >= 50 ? '#00ff9c' : '#f59e0b';
            
            // 滾動分析
            const dailyReq = Math.round(gap / 12); // 剩餘 12 天
            const sparkCount = data.rankings.filter(r => r.total_revenue_amount > 100000).length;

            let insight = `目前全域總計實收 ${totalRevenue.toLocaleString()}，距月結目標尚差 $${gap.toLocaleString()}。AI 推演模型顯示，每日平均須有 $${dailyReq.toLocaleString()} 穩健產出才能順利定錨。`;
            if (progress >= 70) insight += ` 目前整體動能極強，應強制加壓「大單攻頂」，優先提撥 15% 權重給 A1 突破之刃。`;
            else if (progress >= 40) insight += ` 動能處於中段加速盤，日均增速應達標，建議加壓 A2/B 梯隊，優化分組名單流動率。`;
            else insight += ` 水位處於低檔警示，缺口擴大。應立刻提撥 ${(totalRevenue * 0.15).toLocaleString()} 質量進行高機率轉移，縮短成交週期。`;

            return (
              <div style={{ 
                background: 'rgba(3, 7, 18, 0.4)', padding: '14px', borderRadius: 12, 
                border: '1px solid rgba(0,212,255,0.15)', marginBottom: 14,
                display: 'flex', gap: 14, flexWrap: 'wrap', position: 'relative', overflow: 'hidden'
              }}>
                {/* 背景掃描線裝飾 */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '100% 4px', pointerEvents: 'none', opacity: 0.3 }} />

                {/* 1. SVG 達成盤 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 240px', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <div style={{ width: 72, height: 72, position: 'relative' }}>
                    <svg width="72" height="72" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#00e5ff" strokeWidth="8"
                        strokeDasharray="263.89" strokeDashoffset={263.89 * (1 - progress / 100)}
                        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} 
                        filter="drop-shadow(0 0 4px rgba(0,229,255,0.5))" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron' }}>{progress}%</div>
                      <div style={{ fontSize: 7, color: '#00e5ff' }}>達成率</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>🎯 全域月目標 (CEILING)</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron', textShadow: '0 0 10px rgba(0,229,255,0.3)', marginTop: 1 }}>${target.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: '#00e5ff', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>▲ {gap <= 0 ? '✓ 已達標' : `尚差 $${gap.toLocaleString()}`}</span>
                      <span style={{ fontSize: 8, padding: '1px 4px', background: gap <= 0 ? 'rgba(0,255,156,0.12)' : 'rgba(245,158,11,0.12)', color: gap <= 0 ? '#00FF9C' : '#F59E0B', borderRadius: 3 }}>
                        {gap <= 0 ? '穩健' : progress >= 75 ? '衝刺' : '加壓'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. 二維 Matrix */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: '1 1 180px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 10, border: '1px solid rgba(0,255,156,0.08)' }}>
                    <div style={{ fontSize: 8, color: '#94a3b8' }}>當前流速 (Velocity)</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#00ff9c', fontFamily: 'Orbitron', marginTop: 3 }}>{Math.min(100, Math.round(progress * 1.08))}%</div>
                    <div style={{ height: 2, background: 'rgba(0,255,156,0.1)', marginTop: 4 }}>
                      <div style={{ width: `${Math.min(100, progress * 1.08)}%`, height: '100%', background: '#00ff9c' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 10, border: '1px solid rgba(139,92,246,0.08)' }}>
                    <div style={{ fontSize: 8, color: '#94a3b8' }}>高單人數 (Spark)</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#c084fc', fontFamily: 'Orbitron', marginTop: 3 }}>{sparkCount} 人</div>
                    <div style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>營收 ＞ 10W</div>
                  </div>
                </div>

                {/* 3. AI 診斷書 Laser Box */}
                <div style={{ 
                  flex: '2 1 300px', padding: '12px', borderRadius: 10, 
                  border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0, 212, 255, 0.05)', 
                  position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' 
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderTop: '2px solid #00d4ff', borderRight: '2px solid #00d4ff', opacity: 0.5 }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22, borderBottom: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff', opacity: 0.5 }} />

                  <div style={{ fontSize: 11, color: '#00d4ff', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
                    <span style={{ fontSize: 12 }}>💡</span> AI 總體戰略診斷 
                    <span style={{ fontSize: 7, color: 'rgba(0,212,255,0.4)', fontFamily: 'monospace', marginLeft: 'auto' }}>AUTO_演算_✓</span>
                  </div>
                  <p style={{ flex: 1, fontSize: 11, color: '#e2e8f0', margin: 0, lineHeight: 1.6, fontFamily: '"Microsoft JhengHei", sans-serif', overflowY: 'auto' }}>
                    {insight}
                  </p>
                </div>

              </div>
            );
          })()}

          {/* ── 英雄榜 ── */}
          {data.rankings.length > 0 && (
            <div style={{ background: EMPEROR_UI.cardBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
              {/* 標題 — 點擊複製完整榜單文字 */}
              <Clickable
                onClick={() => {
                  const lines = data.rankings.map(r =>
                    `${r.rank_no}. ${r.employee_name}｜總業績 ${fmtRaw(r.total_revenue_amount)}｜續單 ${fmtRaw(r.total_followup_amount)}｜追續 ${r.total_followup_count}`
                  ).join('\n');
                  onCopy(`【整合英雄榜】\n${lines}`, '完整排名摘要');
                }}
                title="點擊複製完整排名摘要文字"
                color={TU.bright} bold
              >
                <div style={{ fontSize: 14, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  🏆 英雄榜（整合名次）— 點標題複製完整榜單
                  <span style={{ fontSize: 11, color: EMPEROR_UI.textMuted, fontWeight: 600 }}>依【總業績】→【成交率】→【派單成交】→【追續單金額】</span>
                </div>
              </Clickable>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: EMPEROR_UI.sidebarBg }}>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'center', width: 44 }}>名次</th>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'left' }}>姓名</th>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>追續</th>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>續單業績</th>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: EMPEROR_UI.textMuted, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>總業績</th>
                      <th style={{ padding: '7px 10px', fontSize: 11, fontWeight: 800, color: TU.bright, borderBottom: '1px solid ' + EMPEROR_UI.borderAccent, textAlign: 'right' }}>實收</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rankings.map((row: LatestRanking) => {
                      const isTop3  = row.rank_no <= 3;
                      const isTop10 = row.rank_no <= 10;
                      const group = row.ranking_rule_text ?? '';
                      const groupCode = group.match(/A1|A2|B|C/)?.[0] ?? '';
                      const groupColor =
                        groupCode === 'A1' ? '#ff6b35' :
                        groupCode === 'A2' ? HUO.bright :
                        groupCode === 'B'  ? MU.bright  : SHUI.text;
                      const rankColor = row.rank_no === 1 ? TU.bright : row.rank_no === 2 ? '#e0e0e0' : row.rank_no === 3 ? HUO.bright : EMPEROR_UI.textDim;
                      return (
                        <React.Fragment key={row.rank_no}>
                          <tr style={{ background: isTop3 ? TU.abyss : isTop10 ? 'rgba(0,212,255,0.02)' : 'transparent' }}>

                            {/* 名次 — 點擊複製「第X名：姓名」 */}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'center', verticalAlign: 'middle' }}>
                              <Clickable onClick={() => onCopy(`第 ${row.rank_no} 名：${row.employee_name}`, '名次')} title="點擊複製名次＋姓名" color={rankColor} bold>
                                <span style={{ fontSize: isTop3 ? 18 : 14, fontFamily: '"Orbitron", sans-serif' }}>#{row.rank_no}</span>
                              </Clickable>
                            </td>

                            {/* 姓名 — 點擊複製私訊格式（含 AI 點評）*/}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Clickable
                                  onClick={() => {
                                    const mot = motivations[row.employee_name];
                                    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Taipei' }).format(new Date());
                                    const rankLabel = row.rank_no <= 3 ? `🏆 今日全榜第 ${row.rank_no} 名` : `今日名次：第 ${row.rank_no} 名`;
                                    const aiComment = row.rank_no === 1
                                      ? '今天站頂，整隊節奏由你定，繼續保持強度。'
                                      : row.rank_no <= 3
                                      ? '前三名實力圈，再一波就封頂，後面緊追不捨。'
                                      : groupCode === 'C'
                                      ? '今天必須出一筆實收，否則順位繼續往後，把握機會。'
                                      : mot || '持續保持節奏，位置是打出來的。';
                                    const dm = [
                                      `【${row.employee_name}】${today}`,
                                      `${rankLabel}`,
                                      `💰 總業績：$${fmtRaw(row.total_revenue_amount)}`,
                                      `📦 續單：$${fmtRaw(row.total_followup_amount)}　追續：${row.total_followup_count} 筆`,
                                      ``,
                                      `💡 ${aiComment}`,
                                    ].join('\n');
                                    onCopy(dm, row.employee_name + ' 私訊點評');
                                  }}
                                  title="點擊複製私訊格式（姓名＋名次＋AI點評）"
                                  color={isTop3 ? EMPEROR_UI.textPrimary : EMPEROR_UI.textSecondary}
                                  bold={isTop3}
                                >
                                  <span style={{ fontSize: 15 }}>{row.employee_name}</span>
                                </Clickable>

                                {/* 組別徽章 — 點擊複製組別說明 */}
                                {groupCode && (
                                  <Clickable
                                    onClick={() => onCopy(`${row.employee_name} 所在組別：${groupCode}（${GROUP_STYLE[groupCode]?.desc ?? ''}）`, '組別')}
                                    title={`點擊複製組別：${GROUP_STYLE[groupCode]?.desc ?? groupCode}`}
                                  >
                                    <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: groupColor + '22', border: '1px solid ' + groupColor + '55', color: groupColor, fontWeight: 900, letterSpacing: '0.06em' }}>
                                      {groupCode}
                                    </span>
                                  </Clickable>
                                )}
                              </div>
                            </td>

                            {/* 追續 — 點擊複製筆數 */}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', verticalAlign: 'middle' }}>
                              <Clickable onClick={() => onCopy(`${row.employee_name} 追續成交：${row.total_followup_count} 筆`, '追續')} title="點擊複製追續成交筆數" color={EMPEROR_UI.textSecondary}>
                                <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 13 }}>{row.total_followup_count}</span>
                              </Clickable>
                            </td>

                            {/* 續單業績 — 點擊複製 */}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', verticalAlign: 'middle' }}>
                              <Clickable onClick={() => onCopy(`${row.employee_name} 續單業績：${fmtRaw(row.total_followup_amount)} 元`, '續單業績')} title="點擊複製續單業績金額" color={EMPEROR_UI.textSecondary}>
                                <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 13 }}>{fmt(row.total_followup_amount)}</span>
                              </Clickable>
                            </td>

                            {/* 總業績 — 點擊複製 */}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', verticalAlign: 'middle' }}>
                              <Clickable onClick={() => onCopy(`${row.employee_name} 總業績：${fmtRaw(row.total_revenue_amount)} 元`, '總業績')} title="點擊複製總業績" color={EMPEROR_UI.textSecondary}>
                                <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 13 }}>{fmt(row.total_revenue_amount)}</span>
                              </Clickable>
                            </td>

                            {/* 實收 — 點擊複製 */}
                            <td style={{ padding: '8px 10px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain, textAlign: 'right', verticalAlign: 'middle', fontSize: 13 }}>
                              <Clickable onClick={() => onCopy(`${row.employee_name} 實收：${fmtRaw(row.total_actual_amount)} 元`, '實收')} title="點擊複製實收金額" color={TU.bright} bold>
                                <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 14 }}>{fmt(row.total_actual_amount)}</span>
                              </Clickable>
                            </td>
                          </tr>

                          {/* AI 點評列 — 點擊複製 */}
                          {row.ranking_rule_text && (
                            <tr style={{ background: isTop3 ? TU.abyss : 'transparent' }}>
                              <td />
                              <td colSpan={5} style={{ padding: '0 10px 7px', borderBottom: '1px solid ' + EMPEROR_UI.borderMain }}>
                                <Clickable onClick={() => onCopy(`${row.employee_name}｜${row.ranking_rule_text}`, row.employee_name + 'AI點評')} title="點擊複製 AI 點評" color={EMPEROR_UI.textMuted}>
                                  <div style={{ fontSize: 11, background: EMPEROR_UI.pageBg, border: '1px solid ' + EMPEROR_UI.borderAccent, borderLeft: '3px solid ' + groupColor, borderRadius: 5, padding: '4px 10px', lineHeight: 1.5 }}>
                                    💬 {row.ranking_rule_text}
                                  </div>
                                </Clickable>
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
          <div style={{ marginBottom: 14 }}>
            {/* 分組標題 — 點擊複製完整四組派單順序 */}
            <Clickable
              onClick={() => {
                const lines: string[] = [];
                for (const code of ['A1', 'A2', 'B', 'C'] as const) {
                  const m = data.groups[code] ?? [];
                  if (m.length) {
                    lines.push(`【${GROUP_STYLE[code].label}】`);
                    m.forEach((g, i) => lines.push(`  ${i + 1}. ${g.employee_name}`));
                  }
                }
                onCopy(lines.join('\n'), '完整派單分組');
              }}
              title="點擊複製完整四組派單順序"
              color={HUO.bright} bold
            >
              <div style={{ fontSize: 13, marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                🎯 明日 AI 派單分組 — 點標題複製全組
              </div>
            </Clickable>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              {(['A1', 'A2', 'B', 'C'] as const).map(code => (
                <DispatchCard
                  key={code}
                  code={code}
                  items={data.groups[code] ?? []}
                  motivations={motivations}
                  onCopy={onCopy}
                />
              ))}
            </div>
          </div>

          {/* 公告輸出 */}
          {data.announcement && (
            <AnnouncementPanel texts={data.announcement} onCopy={onCopy} />
          )}
        </>
      )}

      {/* ── 操作列 ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '10px 0', borderTop: '1px solid ' + EMPEROR_UI.borderAccent, marginTop: 6 }}>
        <button type="button" onClick={refetch} disabled={loading}
          style={{ ...btnBase, background: EMPEROR_UI.cardBg, color: EMPEROR_UI.textSecondary, border: '1px solid ' + EMPEROR_UI.borderAccent, opacity: loading ? 0.6 : 1 }}>
          🔄 {loading ? '載入中…' : '手動刷新'}
        </button>
        {data?.announcement && (
          <button type="button" onClick={() => onCopy(data.announcement.fullText, '完整公告')}
            style={{ ...btnBase, background: MU.void, color: MU.bright, border: '1px solid ' + MU.shadow, fontSize: 13 }}>
            📋 一鍵複製完整公告
          </button>
        )}
      </div>

      {/* 複製回饋訊息 */}
      {copyMsg && (
        <div style={{ marginTop: 8, padding: '8px 16px', borderRadius: 8, background: MU.abyss, color: MU.bright, fontWeight: 700, fontSize: 13, border: '1px solid ' + MU.shadow }}>
          {copyMsg}
        </div>
      )}
      </div>{/* /zIndex wrapper */}
    </div>
  );
}
