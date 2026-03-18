// ==========================================
// 老闆總控台 (CEO Dashboard)
// 帝王配色 · 全 inline style · 功能意境字
// ==========================================
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { type Employee, type Platform } from '../data/mockData';
import { calcHealthScore, getGroupColor } from '../engine/aiEngine';
import type { TrendAnalysis } from '../engine/trendEngine';
import { EMPEROR_UI, EMPEROR, MU, HUO, SHUI, TU, JIN } from '../constants/wuxingColors';

// ── CSS 注入 ──
let _ceoInjected = false;
function injectCeoStyles() {
  if (_ceoInjected || typeof document === 'undefined') return;
  _ceoInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes ceoFloat  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2px)} }
    @keyframes ceoScan   { 0%{left:-60%} 100%{left:120%} }
    @keyframes ceoPulse  { 0%,100%{opacity:.65} 50%{opacity:1} }
    @keyframes ceoGlow   { 0%,100%{text-shadow:0 0 10px currentColor} 50%{text-shadow:0 0 22px currentColor,0 0 40px currentColor} }
    @keyframes ceoBarIn  { from{width:0;opacity:.4} to{opacity:1} }
    @keyframes ceoRevIn  { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
    @keyframes ceoBeat   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
    @keyframes ceoRowIn  { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    @keyframes ceoHolo   { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes ceoEdge   { 0%,100%{box-shadow:0 0 8px var(--pc,#4ade8066),inset 0 0 8px transparent} 50%{box-shadow:0 0 22px var(--pc,#4ade80aa),inset 0 0 10px var(--pc,#4ade8011)} }
    @keyframes ceoTagPop { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
    @keyframes ceoGridMove { 0%{background-position:0 0} 100%{background-position:40px 40px} }
    .ceo-platform:hover { border-color:var(--pc)!important; box-shadow:0 0 28px var(--pc)44, 0 6px 24px rgba(0,0,0,.6)!important; transform:translateY(-3px) scale(1.01); }
    .ceo-platform { transition: all .22s; cursor:default; }
    .ceo-metric:hover { filter:brightness(1.12); transform:translateY(-1px); }
    .ceo-metric { transition: all .2s; }
    .ceo-tr:hover td { background:rgba(255,255,255,.03)!important; }
    .ceo-insight:hover { filter:brightness(1.08); }
    .ceo-insight { transition: filter .15s; }
    .ceo-holo-title {
      background: linear-gradient(90deg, #4ade80, #60a5fa, #c084fc, #f59e0b, #4ade80);
      background-size: 300% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: ceoHolo 4s linear infinite;
    }
    .ceo-matrix-bg {
      background-image: linear-gradient(rgba(74,222,128,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74,222,128,0.03) 1px, transparent 1px);
      background-size: 20px 20px;
      animation: ceoGridMove 3s linear infinite;
    }
  `;
  document.head.appendChild(s);
}

interface Props {
  employees: Employee[];
  platforms: Platform[];
  trends?: TrendAnalysis[];
}

// ── 平台配色 ──
const PLATFORM_PALETTES = [
  { color: JIN.bright, bg: JIN.abyss, border: JIN.shadow, glow: JIN.glow },
  { color: MU.bright,  bg: MU.abyss,  border: MU.shadow,  glow: MU.glow  },
  { color: TU.bright,  bg: TU.abyss,  border: TU.shadow,  glow: TU.glow  },
];

const CARD: React.CSSProperties = {
  background: EMPEROR.obsidian,
  border: `1px solid ${EMPEROR_UI.borderMain}`,
  borderRadius: 10,
  position: 'relative', overflow: 'hidden',
  transition: 'all .2s',
};
const SCAN: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0, bottom: 0, width: '45%',
  background: `linear-gradient(90deg,transparent,${JIN.bright}06,transparent)`,
  animation: 'ceoScan 5s linear infinite', pointerEvents: 'none',
};

export default function CeoDashboard({ employees, platforms, trends }: Props) {
  injectCeoStyles();

  const totalRevenue = platforms.reduce((s, p) => s + p.revenue, 0);
  const totalEmpRevenue = employees.reduce((s, e) => s + e.total, 0);
  const healthScore = calcHealthScore(employees);
  const activeCount = employees.filter(e => e.followUps > 0).length;
  const top10 = employees.slice(0, 10).map(e => ({ name: e.name, total: e.total, renewals: e.renewals }));
  const groupData = ['A1','A2','B','C'].map(g => ({
    name: g,
    count: employees.filter(e => e.group === g).length,
    revenue: employees.filter(e => e.group === g).reduce((s, e) => s + e.total, 0),
  }));
  const topEmployee = employees[0];
  const riskEmployees = employees.filter(e => e.total < 15000);
  const biggestProblem = riskEmployees.length > 3
    ? `${riskEmployees.length} 名員工業績低於 C 組門檻 $15,000`
    : '目前團隊運作穩定';
  const biggestOpportunity = `${topEmployee?.name} 今日戰力分數 ${topEmployee?.aiScore}，帶動 A1 組產能`;
  const healthPalette = healthScore > 70 ? TU : MU;

  const GROUP_PALETTES: Record<string, typeof JIN> = { A1: HUO, A2: MU, B: TU, C: SHUI };

  return (
    <div style={{ background: EMPEROR_UI.pageBg, minHeight: '100%', padding: '8px 12px 14px', fontFamily: '"Microsoft JhengHei", system-ui, sans-serif' }}>

      {/* ══ 頁首 ══ */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, marginBottom:8,
        padding:'8px 12px', borderRadius:10,
        background:'linear-gradient(135deg,#0a1a12,#030a08)',
        border:`1px solid ${MU.shadow}`, boxShadow:`0 4px 20px rgba(0,0,0,.6), inset 0 1px 0 ${MU.bright}11`,
        animation:'ceoFloat 4s ease-in-out infinite',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, animation:'ceoGlow 3s ease-in-out infinite', color:MU.bright }}>🏢</span>
          <div>
            <div style={{ fontSize:15, fontWeight:900, color:MU.bright, letterSpacing:'.04em', textShadow:`0 0 12px ${MU.bright}88` }}>老闆總控台</div>
            <div style={{ fontSize:10, color:MU.text, marginTop:2, letterSpacing:'.06em' }}>全球大數據引擎 · 三平台整合中樞 · 即時戰力監控</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:5, alignItems:'center' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:MU.bright, boxShadow:`0 0 8px ${MU.bright}`, display:'inline-block', animation:'ceoPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize:10, color:MU.bright, fontWeight:800, letterSpacing:'.1em' }}>LIVE</span>
          <span style={{ fontSize:10, color:EMPEROR_UI.textDim, marginLeft:4 }}>{employees.length} 人</span>
        </div>
      </div>

      {/* ══ 頂部4指標 ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:8 }}>
        {[
          { label:'三平台實收', val:`$${totalRevenue.toLocaleString()}`, sub:'今日整合實收', p:MU },
          { label:'員工總業績', val:`$${totalEmpRevenue.toLocaleString()}`, sub:`${employees.length}人業績合計`, p:JIN },
          { label:'公司健康度', val:`${healthScore}分`, sub:healthScore>70?'運作良好':'需即時介入', p:healthPalette },
          { label:'活躍人數', val:`${activeCount}/${employees.length}`, sub:'有追單人數', p:SHUI },
        ].map(m => (
          <div key={m.label} className="ceo-metric" style={{ ...CARD, padding:'8px 10px', border:`1px solid ${m.p.shadow}`, boxShadow:`0 2px 12px rgba(0,0,0,.5), inset 0 1px 0 ${m.p.bright}11` }}>
            <div style={SCAN} />
            <div style={{ fontSize:9, color:m.p.text, letterSpacing:'.08em', marginBottom:2 }}>{m.label}</div>
            <div style={{ fontSize:18, fontWeight:900, color:m.p.bright, lineHeight:1.1, textShadow:`0 0 10px ${m.p.bright}66` }}>{m.val}</div>
            <div style={{ fontSize:9, color:`${m.p.bright}77`, marginTop:2 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ══ 平台業績卡（REAL-TIME CORE REV MATRIX）══ */}
      <div style={{ marginBottom:8 }}>
        {/* 區塊標題 — 全息流動 */}
        <div style={{
          marginBottom:7, padding:'8px 14px',
          background:'linear-gradient(135deg,rgba(4,10,8,0.95) 0%,rgba(2,8,16,0.92) 50%,rgba(6,4,14,0.95) 100%)',
          border:'1px solid rgba(74,222,128,0.14)',
          borderTop:'1px solid rgba(74,222,128,0.28)',
          borderRadius:8,
          boxShadow:'0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(74,222,128,0.08), 0 0 40px rgba(74,222,128,0.04)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'relative', overflow:'hidden',
        }}>
          {/* 流動背景網格 */}
          <div className="ceo-matrix-bg" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:.6 }} />
          {/* 左側邊光 */}
          <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:'linear-gradient(180deg,transparent,rgba(74,222,128,0.6),transparent)', borderRadius:'2px 0 0 2px' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8, position:'relative' }}>
            <span style={{ fontSize:16, filter:'drop-shadow(0 0 8px #4ade80)' }}>🌐</span>
            <div>
              <div className="ceo-holo-title" style={{ fontSize:12, fontWeight:900, letterSpacing:'.06em', lineHeight:1.1 }}>
                REAL-TIME CORE REV MATRIX
              </div>
              <div style={{ fontSize:8, color:'rgba(74,222,128,0.5)', marginTop:2, letterSpacing:'.12em' }}>即時營收流動網格 · 三平台整合 · 全息矩陣</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:4, alignItems:'center', position:'relative' }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80', display:'inline-block', animation:'ceoPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize:8, color:'#4ade80', fontWeight:900, letterSpacing:'.1em' }}>LIVE</span>
          </div>
        </div>

        {/* 平台角色標籤：依排名自動分配 */}
        {(() => {
          const sorted = [...platforms].sort((a,b) => b.revenue - a.revenue);
          const ROLE: Record<string, { icon:string; label:string; color:string; glowColor:string; tagBg:string }> = {
            [sorted[0]?.name]: { icon:'💡', label:'主力', color:'#fbbf24', glowColor:'#f59e0b', tagBg:'rgba(245,158,11,0.15)' },
            [sorted[1]?.name]: { icon:'🚀', label:'爆發', color:'#60a5fa', glowColor:'#3b82f6', tagBg:'rgba(59,130,246,0.15)' },
            [sorted[2]?.name]: { icon:'🌀', label:'潛力', color:'#a78bfa', glowColor:'#7c3aed', tagBg:'rgba(124,58,237,0.12)' },
          };

          return (
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${platforms.length},1fr)`, gap:7 }}>
              {platforms.map((plat, i) => {
                const pp = PLATFORM_PALETTES[i % PLATFORM_PALETTES.length];
                const pct = totalRevenue > 0 ? Math.round((plat.revenue / totalRevenue) * 100) : 0;
                const role = ROLE[plat.name];
                return (
                  <div
                    key={plat.name}
                    className="ceo-platform"
                    style={{
                      ...CARD,
                      padding:'9px 12px',
                      background:`linear-gradient(160deg, ${pp.bg} 0%, rgba(3,5,10,0.95) 50%, rgba(2,4,8,0.98) 100%)`,
                      border:`1px solid ${pp.border}`,
                      borderTop:`1px solid ${role?.glowColor ? role.glowColor + '44' : pp.border}`,
                      boxShadow:`0 4px 20px rgba(0,0,0,.6), inset 0 1px 0 ${pp.color}11, 0 0 0 1px rgba(0,0,0,0.4)`,
                      ['--pc' as string]: role?.glowColor ?? pp.color,
                      position:'relative', overflow:'hidden',
                    }}
                  >
                    <div style={SCAN} />
                    {/* 全息邊緣光 */}
                    <div style={{
                      position:'absolute', top:0, left:0, right:0, height:1,
                      background:`linear-gradient(90deg, transparent, ${role?.glowColor ?? pp.color}88, transparent)`,
                    }} />
                    <div style={{
                      position:'absolute', top:0, left:0, bottom:0, width:2,
                      background:`linear-gradient(180deg, transparent, ${role?.glowColor ?? pp.color}66, transparent)`,
                      borderRadius:'2px 0 0 2px',
                    }} />

                    {/* 平台名稱 + 角色標籤 */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ fontSize:14, fontWeight:900, color:pp.color, letterSpacing:'.04em', textShadow:`0 0 10px ${pp.color}88, 0 0 20px ${pp.color}44` }}>
                        {plat.name}
                      </div>
                      <div style={{ display:'flex', gap:4, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
                        {role && (
                          <span style={{
                            fontSize:9, padding:'2px 7px', borderRadius:4,
                            background: role.tagBg,
                            color: role.color,
                            border:`1px solid ${role.glowColor}55`,
                            fontWeight:900, letterSpacing:'.04em',
                            boxShadow:`0 0 8px ${role.glowColor}33`,
                            animation:'ceoTagPop 2.5s ease-in-out infinite',
                          }}>
                            {role.icon} {role.label}
                          </span>
                        )}
                        <span style={{ fontSize:8, padding:'1px 6px', borderRadius:3, background:pct>0?pp.bg:EMPEROR.obsidianMid, color:pct>0?pp.color:EMPEROR_UI.textDim, border:`1px solid ${pct>0?pp.border:EMPEROR_UI.borderMain}`, fontWeight:900 }}>
                          {pct > 0 ? `${pct}%` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* 百分比大字 */}
                    <div style={{ display:'flex', alignItems:'flex-end', gap:4, marginBottom:6 }}>
                      <div style={{
                        fontSize:42, fontWeight:900, lineHeight:1, color:pct>0?pp.color:EMPEROR_UI.textDim,
                        textShadow:pct>0?`0 0 20px ${pp.color}88, 0 0 40px ${pp.color}33, 0 0 60px ${pp.color}11`:'none',
                        animation:pct>0?'ceoRevIn .6s ease-out':'none',
                      }}>{pct}</div>
                      <div style={{ fontSize:18, fontWeight:900, color:pct>0?pp.color:EMPEROR_UI.textDim, marginBottom:6, opacity:.8 }}>%</div>
                    </div>

                    {/* 業績金額 */}
                    <div style={{ marginBottom:6 }}>
                      <div style={{
                        fontSize:16, fontWeight:900, color:pct>0?pp.color:EMPEROR_UI.textDim,
                        textShadow:pct>0?`0 0 12px ${pp.color}66`:'none',
                        letterSpacing:'.02em',
                        animation:pct>0?'ceoRevIn .7s ease-out':'none',
                      }}>
                        ${plat.revenue.toLocaleString()}
                      </div>
                      <div style={{ fontSize:9, color:`${pp.color}66`, letterSpacing:'.1em', marginTop:1 }}>REVENUE · 即時實收</div>
                    </div>

                    {/* 貢獻度進度條 — 雙層 */}
                    <div style={{ height:5, borderRadius:4, background:'rgba(255,255,255,0.04)', overflow:'hidden', marginBottom:6, position:'relative' }}>
                      <div style={{
                        height:'100%', borderRadius:4,
                        background:`linear-gradient(90deg, ${pp.border}, ${pp.color}, ${role?.color ?? pp.color})`,
                        width:`${pct}%`,
                        boxShadow:`0 0 10px ${pp.color}88`,
                        transition:'width .8s cubic-bezier(.34,1.56,.64,1)',
                      }} />
                    </div>

                    {/* 底部資料行 */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ fontSize:9, color:EMPEROR_UI.textDim }}>
                        <span style={{ color:`${pp.color}cc`, fontWeight:700 }}>累積業績 </span>
                        <span style={{ color:pp.color, fontWeight:800 }}>${(plat.revenue/10000).toFixed(1)}萬</span>
                      </div>
                      <div style={{ fontSize:8, color: role?.color ?? pp.color, fontWeight:900, letterSpacing:'.04em' }}>
                        {role ? `${role.icon} ${role.label}平台` : '—'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* TOTAL CYCLE 總欄 — 全息升級 */}
        <div style={{
          ...CARD, marginTop:7, padding:'10px 14px',
          border:`1px solid rgba(74,222,128,0.18)`,
          borderTop:`1px solid rgba(74,222,128,0.32)`,
          background:`linear-gradient(90deg, rgba(4,14,10,0.97) 0%, ${JIN.abyss} 30%, ${EMPEROR.obsidian} 70%, rgba(2,6,14,0.97) 100%)`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          boxShadow:`0 4px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(74,222,128,0.10), 0 0 40px rgba(74,222,128,0.03)`,
          position:'relative', overflow:'hidden',
        }}>
          <div style={SCAN} />
          <div className="ceo-matrix-bg" style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:.4 }} />
          {/* 頂部全息線 */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(74,222,128,0.6),rgba(96,165,250,0.4),rgba(192,132,252,0.3),transparent)' }} />
          <div style={{ position:'relative' }}>
            <div className="ceo-holo-title" style={{ fontSize:10, fontWeight:900, letterSpacing:'.12em' }}>TOTAL CYCLE · 三平台整合實收</div>
            <div style={{ fontSize:9, color:EMPEROR_UI.textDim, marginTop:1 }}>🌐 全平台 · 即時結算合計 · 流動網格</div>
          </div>
          <div style={{ textAlign:'right', position:'relative' }}>
            <div style={{
              fontSize:24, fontWeight:900, color:JIN.bright,
              textShadow:`0 0 16px ${JIN.bright}88, 0 0 32px ${JIN.bright}44, 0 0 60px ${JIN.bright}22`,
              letterSpacing:'.03em', animation:'ceoBeat 3s ease-in-out infinite',
            }}>
              ${totalRevenue.toLocaleString()}
            </div>
            <div style={{ fontSize:9, color:`${JIN.bright}77`, letterSpacing:'.1em' }}>USD · REVENUE · 即時流動</div>
          </div>
        </div>
      </div>

      {/* ══ AI 洞察 3 欄 ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:7, marginBottom:8 }}>
        {[
          { icon:'🚨', label:'今日最大問題', text:biggestProblem, p:HUO },
          { icon:'⚡', label:'今日最大機會', text:biggestOpportunity, p:MU },
          { icon:'🛡️', label:'AI 建議策略', text:'優先派續單收割組，加速實收落袋', p:SHUI },
        ].map(c => (
          <div key={c.label} className="ceo-insight" style={{ ...CARD, padding:'9px 12px', border:`1px solid ${c.p.shadow}` }}>
            <div style={SCAN} />
            <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0, marginTop:1 }}>{c.icon}</span>
              <div>
                <div style={{ fontSize:9, fontWeight:900, color:c.p.bright, letterSpacing:'.06em', marginBottom:3, textShadow:`0 0 6px ${c.p.bright}66` }}>{c.label}</div>
                <div style={{ fontSize:11, color:EMPEROR_UI.textSecondary, lineHeight:1.6 }}>{c.text}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ 圖表區：平台圓餅 + TOP10條形 ══ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:7, marginBottom:8 }}>
        {/* 圓餅圖 */}
        <div style={{ ...CARD, padding:'10px 12px' }}>
          <div style={SCAN} />
          <div style={{ fontSize:10, fontWeight:700, color:JIN.text, marginBottom:6, letterSpacing:'.08em' }}>📊 平台業績分布</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={platforms.map(p => ({ name: p.name, value: p.revenue }))}
                cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                paddingAngle={4} dataKey="value"
                label={({ name, percent }) => `${name} ${((percent??0)*100).toFixed(0)}%`}
                labelLine={false}
              >
                {platforms.map((_, i) => (
                  <Cell key={i} fill={PLATFORM_PALETTES[i % PLATFORM_PALETTES.length].color} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background:EMPEROR.obsidian, border:`1px solid ${JIN.shadow}`, borderRadius:8, fontSize:11 }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, '業績']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* TOP10 條形圖 */}
        <div style={{ ...CARD, padding:'10px 12px' }}>
          <div style={SCAN} />
          <div style={{ fontSize:10, fontWeight:700, color:MU.text, marginBottom:6, letterSpacing:'.08em' }}>🏆 TOP 10 員工業績排行</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10} layout="vertical" margin={{ left:10, right:10, top:0, bottom:0 }}>
              <XAxis type="number" tickFormatter={v => `${(Number(v)/10000).toFixed(0)}萬`} tick={{ fontSize:9, fill:EMPEROR_UI.textDim }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={52} tick={{ fontSize:10, fill:EMPEROR_UI.textSecondary }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background:EMPEROR.obsidian, border:`1px solid ${MU.shadow}`, borderRadius:8, fontSize:11 }}
                formatter={(v: unknown) => [`$${Number(v).toLocaleString()}`, '']}
              />
              <Bar dataKey="total" fill={MU.bright} radius={[0,4,4,0]} name="總業績" opacity={0.9} />
              <Bar dataKey="renewals" fill={SHUI.core} radius={[0,4,4,0]} name="續單額" opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══ 分組概況 ══ */}
      <div style={{ ...CARD, padding:'10px 12px', marginBottom:8 }}>
        <div style={SCAN} />
        <div style={{ fontSize:10, fontWeight:700, color:TU.text, marginBottom:8, letterSpacing:'.08em' }}>👥 AI 派單分組概況</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6 }}>
          {groupData.map(g => {
            const gp = GROUP_PALETTES[g.name] ?? SHUI;
            const gc = getGroupColor(g.name);
            return (
              <div key={g.name} style={{
                background:gp.abyss, border:`1px solid ${gp.shadow}`,
                borderRadius:9, padding:'9px 10px',
                boxShadow:`0 2px 10px rgba(0,0,0,.4), inset 0 1px 0 ${gp.bright}11`,
              }}>
                <div style={{ fontSize:9, color:gp.text, fontWeight:700, marginBottom:3 }}>{gc.label}</div>
                <div style={{ fontSize:22, fontWeight:900, color:gp.bright, lineHeight:1, textShadow:`0 0 10px ${gp.bright}66` }}>{g.count}<span style={{ fontSize:11, marginLeft:2 }}>人</span></div>
                <div style={{ fontSize:9, color:`${gp.bright}88`, marginTop:3 }}>組業績 ${g.revenue.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ 趨勢比較 ══ */}
      {trends && trends.length > 0 && (
        <div style={{ ...CARD, padding:'10px 12px' }}>
          <div style={SCAN} />
          <div style={{ fontSize:10, fontWeight:700, color:SHUI.text, marginBottom:8, letterSpacing:'.08em' }}>📈 2月 vs 3月 動能分析（TOP 10）</div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${EMPEROR_UI.borderMain}` }}>
                  {['姓名','2月總額','3月累積','動能比','趨勢'].map((h, i) => (
                    <th key={h} style={{ padding:'5px 8px', textAlign:i===0?'left':'right', fontSize:9, fontWeight:700, color:EMPEROR_UI.textDim, letterSpacing:'.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trends.slice(0, 10).map((t, idx) => {
                  const up = t.momentum >= 1;
                  return (
                    <tr key={t.name} className="ceo-tr" style={{ borderBottom:`1px solid ${EMPEROR_UI.borderMain}22`, animation:`ceoRowIn .3s ease-out ${idx*.025}s both` }}>
                      <td style={{ padding:'6px 8px', fontWeight:700, color:EMPEROR_UI.textPrimary }}>{t.name}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', color:EMPEROR_UI.textMuted }}>${t.febRevenue.toLocaleString()}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:700, color:EMPEROR_UI.textPrimary }}>${t.marRevenue.toLocaleString()}</td>
                      <td style={{ padding:'6px 8px', textAlign:'right', fontWeight:900, color:up?MU.bright:HUO.bright, textShadow:`0 0 6px ${up?MU.bright:HUO.bright}66` }}>
                        {(t.momentum * 100).toFixed(0)}%
                      </td>
                      <td style={{ padding:'6px 8px', textAlign:'right', fontSize:10, color:up?MU.bright:EMPEROR_UI.textDim }}>{t.trendLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
