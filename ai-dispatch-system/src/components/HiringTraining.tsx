// ==========================================
// 招聘管理頁 + 訓練管理頁 (合併元件)
// ==========================================
import React, { useState } from 'react';
import { type Employee } from '../data/mockData';
import { EMPEROR_UI, EMPEROR, HUO, JIN, MU, SHUI, TU } from '../constants/wuxingColors';

// ─── CSS 注入 ───
let _htInjected = false;
function injectHtStyles() {
  if (_htInjected || typeof document === 'undefined') return;
  _htInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes htScan  { 0%{left:-60%} 100%{left:110%} }
    @keyframes htBarIn { 0%{width:0} 100%{width:var(--w)} }
    .ht-card:hover { border-color:${JIN.shadow}!important; box-shadow:0 4px 18px ${JIN.core}22!important; }
    .ht-row:hover  { background:${EMPEROR.obsidianMid}!important; }
  `;
  document.head.appendChild(s);
}

// ─── 共用樣式 ───
const PAGE: React.CSSProperties = { display:'flex', flexDirection:'column', gap:10, padding:'8px 12px 12px', background:EMPEROR_UI.pageBg, minHeight:'100%' };
const CARD: React.CSSProperties = { background:EMPEROR.obsidian, border:`1px solid ${EMPEROR_UI.borderMain}`, borderRadius:10, padding:'10px 14px', position:'relative', overflow:'hidden', transition:'all .2s' };
const CARD_SCAN: React.CSSProperties = { position:'absolute', top:0, left:0, width:'50%', height:'100%', background:`linear-gradient(90deg,transparent,${JIN.glow}07,transparent)`, animation:'htScan 5s linear infinite', pointerEvents:'none' };
const BADGE: React.CSSProperties = { display:'inline-block', fontSize:10, padding:'1px 7px', borderRadius:4, fontWeight:700, letterSpacing:'.04em' };
const SECTION_TITLE: React.CSSProperties = { fontSize:15, fontWeight:900, color:EMPEROR_UI.textPrimary, margin:0, letterSpacing:'.04em' };
const SUB: React.CSSProperties = { fontSize:11, color:EMPEROR_UI.textMuted, marginTop:2 };

// ─── 進度條（inline style 版）───
function Bar({ value, palette }: { value: number; palette: typeof JIN }) {
  return (
    <div style={{ height:5, background:EMPEROR.obsidianMid, borderRadius:3, overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${value}%`, background:`linear-gradient(90deg,${palette.core},${palette.bright})`, borderRadius:3, boxShadow:`0 0 6px ${palette.glow}55`, transition:'width .4s ease' }} />
    </div>
  );
}

// ─── 招聘管理頁 ───
type Candidate = {
  id: string; name: string; lang: number; comm: number; react: number;
  learn: number; stable: number; sales: number; m3: number; m6: number;
  rec: string; role: string;
};

const defaultCandidates: Candidate[] = [
  { id:'HC001', name:'張三',  lang:85, comm:90, react:78, learn:88, stable:72, sales:88, m3:180000, m6:420000, rec:'建議錄取',     role:'業務專員' },
  { id:'HC002', name:'李四',  lang:70, comm:65, react:80, learn:60, stable:55, sales:65, m3: 90000, m6:200000, rec:'備取',         role:'行銷助理' },
  { id:'HC003', name:'王五',  lang:92, comm:88, react:95, learn:90, stable:85, sales:92, m3:250000, m6:580000, rec:'強烈建議錄取', role:'業務經理' },
];

function aiEvaluate(c: { lang: number; comm: number; react: number; learn: number; stable: number; sales: number }) {
  const avg = Math.round((c.lang + c.comm + c.react + c.learn + c.stable + c.sales) / 6);
  const m3 = Math.round(avg * 2200);
  const m6 = Math.round(avg * 5500);
  const rec = avg >= 85 ? '強烈建議錄取' : avg >= 70 ? '建議錄取' : '備取';
  return { m3, m6, rec };
}

const SKILL_KEYS: [string, keyof typeof candidates[0], typeof JIN][] = [
  ['語言', 'lang', SHUI],
  ['溝通', 'comm', MU],
  ['反應', 'react', JIN],
  ['學習', 'learn', TU],
  ['穩定', 'stable', HUO],
  ['成交潛力', 'sales', HUO],
];

function recPalette(rec: string): typeof JIN {
  if (rec.includes('強烈')) return TU;
  if (rec === '建議錄取') return MU;
  return SHUI;
}

export function HiringDashboard() {
  injectHtStyles();
  const [candidates, setCandidates] = useState<Candidate[]>(defaultCandidates);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:'', role:'業務專員', lang:70, comm:70, react:70, learn:70, stable:70, sales:70 });

  const handleAdd = () => {
    if (!form.name.trim()) return;
    const ai = aiEvaluate(form);
    const newC: Candidate = {
      id: `HC${String(candidates.length + 1).padStart(3, '0')}`,
      name: form.name.trim(),
      role: form.role,
      lang: form.lang, comm: form.comm, react: form.react,
      learn: form.learn, stable: form.stable, sales: form.sales,
      m3: ai.m3, m6: ai.m6, rec: ai.rec,
    };
    setCandidates(prev => [...prev, newC]);
    setForm({ name:'', role:'業務專員', lang:70, comm:70, react:70, learn:70, stable:70, sales:70 });
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div style={PAGE}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <div>
          <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🎯 招聘智選中心</h2>
          <p style={SUB}>AI 候選人潛力評估 · {candidates.length} 位候選人</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding:'6px 14px', borderRadius:8, border:`1px solid ${MU.shadow}`, background:MU.abyss, color:MU.bright, fontSize:12, fontWeight:700, cursor:'pointer' }}>
          {showForm ? '✕ 取消' : '+ 新增候選人'}
        </button>
      </div>

      {/* 新增候選人表單 */}
      {showForm && (
        <div style={{ ...CARD, padding:'12px 14px', marginBottom:8, border:`1px solid ${MU.shadow}` }}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:12, fontWeight:900, color:MU.bright, marginBottom:10 }}>新增候選人資料</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:10 }}>
            <div>
              <label style={{ fontSize:10, color:EMPEROR_UI.textDim, display:'block', marginBottom:3 }}>姓名 *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name:e.target.value }))}
                placeholder="輸入姓名"
                style={{ width:'100%', padding:'5px 8px', borderRadius:6, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidianMid, color:EMPEROR_UI.textPrimary, fontSize:12, outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:10, color:EMPEROR_UI.textDim, display:'block', marginBottom:3 }}>應徵職位</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role:e.target.value }))}
                style={{ width:'100%', padding:'5px 8px', borderRadius:6, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidianMid, color:EMPEROR_UI.textPrimary, fontSize:12, outline:'none' }}>
                <option>業務專員</option><option>業務經理</option><option>行銷助理</option><option>客服主管</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:10 }}>
            {(['lang','comm','react','learn','stable','sales'] as const).map((k, i) => {
              const labels = ['語言','溝通','反應','學習','穩定','成交潛力'];
              return (
                <div key={k}>
                  <label style={{ fontSize:10, color:EMPEROR_UI.textDim, display:'block', marginBottom:3 }}>{labels[i]} ({form[k]})</label>
                  <input type="range" min={0} max={100} value={form[k]}
                    onChange={e => setForm(f => ({ ...f, [k]: Number(e.target.value) }))}
                    style={{ width:'100%', accentColor:MU.bright }} />
                </div>
              );
            })}
          </div>
          <button onClick={handleAdd} disabled={!form.name.trim()}
            style={{ padding:'7px 18px', borderRadius:8, border:'none', background:form.name.trim() ? MU.gradient : EMPEROR.obsidianMid, color:form.name.trim() ? '#000' : EMPEROR_UI.textDim, fontSize:12, fontWeight:900, cursor:form.name.trim() ? 'pointer' : 'not-allowed', boxShadow: form.name.trim() ? MU.glowShadow : 'none' }}>
            ✓ AI 評估並加入
          </button>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
        {candidates.map(c => {
          const totalScore = Math.round((c.lang + c.comm + c.react + c.learn + c.stable + c.sales) / 6);
          const scorePalette = totalScore >= 80 ? TU : totalScore >= 65 ? MU : SHUI;
          const rp = recPalette(c.rec);
          return (
            <div key={c.id} className="ht-card" style={CARD}>
              <div style={CARD_SCAN} />
              {/* 頭部 */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:JIN.abyss, border:`1px solid ${JIN.shadow}`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:15, color:JIN.bright }}>
                  {c.name[0]}
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:9, color:EMPEROR_UI.textDim, letterSpacing:'.08em' }}>AI 綜合評分</div>
                  <div style={{ fontSize:22, fontWeight:900, color:scorePalette.bright, textShadow:`0 0 10px ${scorePalette.glow}66` }}>{totalScore}</div>
                </div>
              </div>

              <div style={{ fontSize:13, fontWeight:900, color:EMPEROR_UI.textPrimary, marginBottom:1 }}>{c.name}</div>
              <div style={{ fontSize:10, color:MU.bright, fontWeight:600, marginBottom:8 }}>應徵：{c.role}</div>

              {/* 技能條 */}
              <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:8 }}>
                {SKILL_KEYS.map(([label, key, p]) => {
                  const val = c[key] as number;
                  return (
                    <div key={label}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, marginBottom:2 }}>
                        <span style={{ color:EMPEROR_UI.textDim }}>{label}</span>
                        <span style={{ fontWeight:700, color:p.bright }}>{val}</span>
                      </div>
                      <Bar value={val} palette={p} />
                    </div>
                  );
                })}
              </div>

              {/* 預測業績 */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                {([['3個月預測',c.m3,SHUI],['6個月預測',c.m6,JIN]] as const).map(([lbl,val,p]) => (
                  <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:7, padding:'5px 6px', textAlign:'center' }}>
                    <div style={{ fontSize:9, color:p.text }}>{lbl}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:p.bright }}>${(val as number).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              {/* 錄取建議 + 移除 */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ ...BADGE, background:rp.abyss, color:rp.bright, border:`1px solid ${rp.shadow}` }}>{c.rec}</span>
                <button onClick={() => handleRemove(c.id)} style={{ fontSize:9, padding:'2px 8px', borderRadius:4, border:`1px solid ${HUO.shadow}`, background:'transparent', color:HUO.text, cursor:'pointer', opacity:0.6 }} title="移除候選人">✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 訓練管理頁 ───
const COURSES = [
  { id:'c1', title:'高單價談判技巧實戰', duration:'2.5 小時', match:'95%', type:'成交速度' },
  { id:'c2', title:'AI 輔助話術進階班',  duration:'1 小時',   match:'88%', type:'追單訓練' },
  { id:'c3', title:'抗拒處理與情緒穩定', duration:'1.5 小時', match:'82%', type:'抗拒處理' },
  { id:'c4', title:'續單收口黃金話術',   duration:'2 小時',   match:'91%', type:'續單訓練' },
];

export function TrainingDashboard({ employees }: { employees: Employee[] }) {
  injectHtStyles();
  const weak = [...employees]
    .sort((a, b) => (a.renewalRate ?? 0) - (b.renewalRate ?? 0))
    .slice(0, 5);

  const GROUP_COLOR: Record<string, typeof JIN> = { C: TU, B: MU, A: HUO };

  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🎓 培訓與賦能中心</h2>
        <p style={SUB}>AI 精準弱點分析 · {COURSES.length} 門推薦課程</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
        {/* 弱點分析 */}
        <div style={CARD}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:12, fontWeight:900, color:HUO.bright, marginBottom:8 }}>需加強人員（續單最低 5 名）</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {weak.map(w => {
              const gp = GROUP_COLOR[w.group] ?? SHUI;
              return (
                <div key={w.name} className="ht-row" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 8px', borderRadius:7, background:EMPEROR.obsidianMid, transition:'background .15s' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:EMPEROR_UI.textPrimary }}>{w.name}</div>
                    <div style={{ fontSize:10, color:EMPEROR_UI.textDim }}>續單率 {w.renewalRate ?? 0}% · 戰力 {w.aiScore}</div>
                  </div>
                  <span style={{ ...BADGE, background:gp.abyss, color:gp.bright, border:`1px solid ${gp.shadow}` }}>{w.group}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 推薦課程 */}
        <div style={CARD}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:12, fontWeight:900, color:MU.bright, marginBottom:8 }}>AI 推薦訓練課程</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {COURSES.map(c => (
              <div key={c.id} className="ht-row" style={{ display:'flex', gap:8, padding:'7px 8px', borderRadius:7, background:EMPEROR.obsidianMid, alignItems:'center', transition:'background .15s' }}>
                <div style={{ width:34, height:34, borderRadius:8, background:MU.abyss, border:`1px solid ${MU.shadow}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>▶</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:4 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:EMPEROR_UI.textPrimary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</div>
                    <span style={{ ...BADGE, background:TU.abyss, color:TU.bright, border:`1px solid ${TU.shadow}`, flexShrink:0 }}>匹配 {c.match}</span>
                  </div>
                  <div style={{ fontSize:10, color:EMPEROR_UI.textDim, marginTop:1 }}>{c.type} · {c.duration}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
