// ==========================================
// 員工個人頁 (My Dashboard) — 帝王配色 · 功能意境字
// ==========================================
import React from 'react';
import { type Employee } from '../data/mockData';
import { getGroupColor } from '../engine/aiEngine';
import { EMPEROR_UI, EMPEROR, MU, HUO, SHUI, TU, JIN } from '../constants/wuxingColors';

// ── CSS 注入 ──
let _myInjected = false;
function injectMyStyles() {
  if (_myInjected || typeof document === 'undefined') return;
  _myInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes myFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
    @keyframes myScan   { 0%{left:-60%} 100%{left:120%} }
    @keyframes myPulse  { 0%,100%{opacity:.65} 50%{opacity:1} }
    @keyframes myGlow   { 0%,100%{filter:drop-shadow(0 0 4px currentColor)} 50%{filter:drop-shadow(0 0 12px currentColor)} }
    @keyframes myBarIn  { from{width:0} to{width:var(--w)} }
    @keyframes myRevIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
    .my-cell:hover { transform:perspective(200px) translateZ(6px) scale(1.04)!important; z-index:2; }
    .my-cell { transition: transform .18s; }
    .my-card:hover { border-color:var(--bc)!important; box-shadow:0 4px 20px rgba(0,0,0,.5)!important; }
    .my-card { transition: all .2s; }
  `;
  document.head.appendChild(s);
}

const CARD: React.CSSProperties = {
  background: EMPEROR.obsidian, border: `1px solid ${EMPEROR_UI.borderMain}`,
  borderRadius: 10, position: 'relative', overflow: 'hidden',
};
const SCAN: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, bottom: 0, width: '45%',
  background: `linear-gradient(90deg,transparent,${TU.bright}06,transparent)`,
  animation: 'myScan 5s linear infinite', pointerEvents: 'none',
};
const BADGE: React.CSSProperties = {
  display: 'inline-block', fontSize: 10, padding: '2px 8px',
  borderRadius: 4, fontWeight: 900, letterSpacing: '.04em',
};

// 能力維度配色
const ABILITY_PALETTES: Record<string, typeof MU> = {
  '成交能力': HUO, '續單能力': MU, '追單能力': TU,
  '客單價': JIN, '穩定度': SHUI, '戰力總分': JIN,
};
const ABILITY_DESC: Record<string, string> = {
  '成交能力': '一擊即中', '續單能力': '留客鎖單', '追單能力': '緊追不放',
  '客單價': '高價成交', '穩定度': '持續輸出', '戰力總分': '綜合戰力',
};

interface Props { employees: Employee[] }

export default function MyDashboard({ employees }: Props) {
  injectMyStyles();
  const me = employees[0];
  if (!me) return <div style={{ color: EMPEROR_UI.textDim, padding: 20 }}>無資料</div>;

  const avgTotal = employees.reduce((s, e) => s + e.total, 0) / employees.length;
  const goalProgress = Math.min(Math.round((me.total / avgTotal) * 100), 150);
  const goalPalette = goalProgress >= 100 ? MU : goalProgress >= 70 ? TU : HUO;

  const GROUP_PALETTE: Record<string, typeof MU> = { A1: HUO, A2: MU, B: TU, C: SHUI };
  const gp = GROUP_PALETTE[me.group] ?? SHUI;

  const abilities = [
    { label: '成交能力', value: me.closeRate ?? 0,     max: 100   },
    { label: '續單能力', value: me.renewalRate ?? 0,   max: 100   },
    { label: '追單能力', value: me.followUpRate ?? 0,  max: 100   },
    { label: '客單價',   value: me.avgOrderValue ?? 0, max: 50000, display: `$${(me.avgOrderValue ?? 0).toLocaleString()}` },
    { label: '穩定度',   value: me.stability ?? 0,     max: 100   },
    { label: '戰力總分', value: me.aiScore ?? 0,       max: 100   },
  ];

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100%', padding: '8px 12px 14px', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ── 頁首 ── */}
      <div style={{ ...CARD, padding: '10px 14px', marginBottom: 8, border: `1px solid ${gp.shadow}`, animation: 'myFloat 4s ease-in-out infinite', boxShadow: `0 4px 20px rgba(0,0,0,.6)` }}>
        <div style={SCAN} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: gp.abyss, border: `1px solid ${gp.shadow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: gp.bright, boxShadow: `0 0 10px ${gp.bright}44` }}>
              {me.name[0]}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: gp.bright, letterSpacing: '.04em', textShadow: `0 0 10px ${gp.bright}66` }}>
                💼 {me.name} 的工作區
              </div>
              <div style={{ fontSize: 10, color: EMPEROR_UI.textDim, marginTop: 2, letterSpacing: '.06em' }}>今日即時業績 · AI 個人建議 · 目標進度</div>
            </div>
          </div>
          <span style={{ ...BADGE, background: gp.abyss, color: gp.bright, border: `1px solid ${gp.shadow}`, boxShadow: `0 0 8px ${gp.bright}33` }}>
            {getGroupColor(me.group).label}
          </span>
        </div>
      </div>

      {/* ── 4 指標 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8 }}>
        {[
          { label: '目前名次', val: `第 ${me.rank} 名`, sub: `共 ${employees.length} 人`, icon: '🏆', p: JIN },
          { label: '追單數', val: `${me.followUps}`, sub: '今日追單筆數', icon: '🎯', p: HUO },
          { label: '續單額', val: `$${me.renewals.toLocaleString()}`, sub: '本期續單收入', icon: '♻️', p: MU },
          { label: '總業績', val: `$${me.total.toLocaleString()}`, sub: '今日整合業績', icon: '💰', p: SHUI },
        ].map(m => (
          <div key={m.label} className="my-card" style={{ ...CARD, padding: '8px 10px', border: `1px solid ${m.p.shadow}`, ['--bc' as string]: m.p.bright }}>
            <div style={SCAN} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 14 }}>{m.icon}</span>
              <span style={{ fontSize: 9, color: m.p.text, letterSpacing: '.08em' }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: m.p.bright, lineHeight: 1.1, textShadow: `0 0 10px ${m.p.bright}66`, animation: 'myRevIn .5s ease-out' }}>{m.val}</div>
            <div style={{ fontSize: 9, color: `${m.p.bright}77`, marginTop: 2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 目標進度 ── */}
      <div style={{ ...CARD, padding: '10px 14px', marginBottom: 8, border: `1px solid ${goalPalette.shadow}` }}>
        <div style={SCAN} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 900, color: goalPalette.bright, letterSpacing: '.08em' }}>📈 今日目標進度</div>
            <div style={{ fontSize: 9, color: EMPEROR_UI.textDim, marginTop: 1 }}>
              對標均值 ${Math.round(avgTotal).toLocaleString()} · {goalProgress >= 100 ? '✓ 已超標' : `差距 ${Math.round(avgTotal - me.total).toLocaleString()}`}
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: goalPalette.bright, textShadow: `0 0 14px ${goalPalette.bright}66`, animation: 'myRevIn .5s ease-out' }}>{goalProgress}%</div>
        </div>
        <div style={{ height: 8, borderRadius: 6, background: EMPEROR.obsidianMid, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 6,
            background: `linear-gradient(90deg,${goalPalette.core},${goalPalette.bright})`,
            width: `${Math.min(goalProgress, 100)}%`,
            boxShadow: `0 0 10px ${goalPalette.bright}88`,
            transition: 'width .8s cubic-bezier(.34,1.56,.64,1)',
          }} />
        </div>
      </div>

      {/* ── AI 戰力分析 6 格 ── */}
      <div style={{ ...CARD, padding: '10px 12px', marginBottom: 8 }}>
        <div style={SCAN} />
        <div style={{ fontSize: 10, fontWeight: 900, color: JIN.text, marginBottom: 8, letterSpacing: '.08em' }}>⚡ AI 戰力分析 — 六維能力核定</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
          {abilities.map(ab => {
            const p2 = ABILITY_PALETTES[ab.label] ?? TU;
            const ratio = ab.value / ab.max;
            const c = ratio > 0.7 ? p2.bright : ratio > 0.4 ? TU.bright : HUO.bright;
            const pct = Math.round(ratio * 100);
            return (
              <div key={ab.label} className="my-cell" style={{
                background: `linear-gradient(160deg,${EMPEROR.obsidian},${p2.abyss})`,
                border: `1px solid ${p2.shadow}`,
                borderRadius: 9, padding: '9px 8px',
                textAlign: 'center', cursor: 'default',
              }}>
                {/* 維度名 + 意境 */}
                <div style={{ fontSize: 9, color: p2.text, fontWeight: 700, letterSpacing: '.04em' }}>{ab.label}</div>
                <div style={{ fontSize: 8, color: `${p2.text}88`, marginBottom: 5 }}>{ABILITY_DESC[ab.label]}</div>
                {/* 數值大字 */}
                <div style={{ fontSize: 22, fontWeight: 900, color: c, lineHeight: 1, textShadow: `0 0 10px ${c}88` }}>
                  {ab.display ?? ab.value}
                </div>
                {/* 百分比條 */}
                <div style={{ margin: '5px 0 3px', height: 4, borderRadius: 3, background: EMPEROR.obsidianMid, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg,${p2.core},${c})`, width: `${pct}%`, boxShadow: `0 0 6px ${c}88`, transition: 'width .6s cubic-bezier(.34,1.56,.64,1)' }} />
                </div>
                <div style={{ fontSize: 8, color: c, fontWeight: 900, fontFamily: 'monospace' }}>{pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI 個人建議 ── */}
      <div style={{ ...CARD, padding: '10px 14px', border: `1px solid ${SHUI.shadow}` }}>
        <div style={SCAN} />
        <div style={{ fontSize: 10, fontWeight: 900, color: SHUI.bright, marginBottom: 6, letterSpacing: '.08em', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ animation: 'myGlow 3s ease-in-out infinite', color: SHUI.bright }}>🤖</span>
          AI 個人建議
        </div>
        <div style={{ fontSize: 12, color: EMPEROR_UI.textSecondary, lineHeight: 1.75 }}>{me.suggestion}</div>
      </div>
    </div>
  );
}
