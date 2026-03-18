// ==========================================
// 高價成交工具頁：話術/攻單/訓練/喊話
// ==========================================
import React, { useState } from 'react';
import { scriptLibrary, mockCustomerOpportunities, trainingTemplates } from '../data/highValueMock';
import type { HighValueProfile } from '../engine/highValueEngine';
import { generateTeamRally } from '../engine/highValueEngine';
import { EMPEROR_UI, EMPEROR, HUO, JIN, MU, SHUI, TU } from '../constants/wuxingColors';

// ─── CSS 注入 ───
let _hvtInjected = false;
function injectHvtStyles() {
  if (_hvtInjected || typeof document === 'undefined') return;
  _hvtInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes hvtScan  { 0%{left:-60%} 100%{left:110%} }
    @keyframes hvtPop   { 0%{transform:scale(.95);opacity:.5} 100%{transform:scale(1);opacity:1} }
    @keyframes hvtPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
    .hvt-card:hover { border-color:${JIN.shadow}!important; box-shadow:0 4px 18px ${JIN.core}22!important; transform:translateY(-1px); }
    .hvt-btn:hover  { filter:brightness(1.15); }
    .hvt-tab-on     { background:${JIN.void}!important; color:${JIN.bright}!important; border-color:${JIN.shadow}!important; }
    .hvt-tab:hover  { border-color:${JIN.shadow}55!important; }
    .hvt-row:hover  { background:${EMPEROR.obsidianMid}!important; }
  `;
  document.head.appendChild(s);
}

// ─── 共用樣式 ───
const PAGE: React.CSSProperties = { display:'flex', flexDirection:'column', gap:10, padding:'8px 12px 12px', background:EMPEROR_UI.pageBg, minHeight:'100%' };
const CARD: React.CSSProperties = { background:EMPEROR.obsidian, border:`1px solid ${EMPEROR_UI.borderMain}`, borderRadius:10, padding:'10px 14px', position:'relative', overflow:'hidden', transition:'all .2s' };
const CARD_SCAN: React.CSSProperties = { position:'absolute', top:0, left:0, width:'50%', height:'100%', background:`linear-gradient(90deg,transparent,${JIN.glow}07,transparent)`, animation:'hvtScan 5s linear infinite', pointerEvents:'none' };
const BADGE: React.CSSProperties = { display:'inline-block', fontSize:10, padding:'1px 7px', borderRadius:4, fontWeight:700, letterSpacing:'.04em' };
const SECTION_TITLE: React.CSSProperties = { fontSize:15, fontWeight:900, color:EMPEROR_UI.textPrimary, margin:0, letterSpacing:'.04em' };
const SUB: React.CSSProperties = { fontSize:11, color:EMPEROR_UI.textMuted, marginTop:2 };

const STRENGTH_COLOR: Record<string, typeof JIN> = { 高: HUO, 中: MU, 低: TU };

// ─── 話術素材頁 ───
export function ScriptLibraryPage() {
  injectHvtStyles();
  const types = [...new Set(scriptLibrary.map(s => s.type))];
  const [activeType, setActiveType] = useState(types[0]);
  const filtered = scriptLibrary.filter(s => s.type === activeType && s.enabled);
  const enabledCount = scriptLibrary.filter(s => s.enabled).length;

  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>📚 高價話術素材庫</h2>
        <p style={SUB}>5 大類型 · {enabledCount} 條啟用中</p>
      </div>

      {/* 類型篩選 */}
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {types.map(t => (
          <button key={t} className={t === activeType ? 'hvt-tab-on' : 'hvt-tab'} onClick={() => setActiveType(t)} style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidian, color:EMPEROR_UI.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {t}
          </button>
        ))}
      </div>

      {/* 話術卡片 */}
      <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
        {filtered.map(s => {
          const sp = STRENGTH_COLOR[s.strength] ?? JIN;
          return (
            <div key={s.id} className="hvt-card" style={CARD}>
              <div style={CARD_SCAN} />
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:6, gap:8 }}>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:EMPEROR_UI.textPrimary, marginBottom:4 }}>{s.title}</div>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    <span style={{ ...BADGE, background:JIN.abyss, color:JIN.bright, border:`1px solid ${JIN.shadow}` }}>{s.clientType}</span>
                    <span style={{ ...BADGE, background:SHUI.abyss, color:SHUI.bright, border:`1px solid ${SHUI.shadow}` }}>{s.scenario}</span>
                    <span style={{ ...BADGE, background:sp.abyss, color:sp.bright, border:`1px solid ${sp.shadow}` }}>強度：{s.strength}</span>
                  </div>
                </div>
              </div>
              <div style={{ background:EMPEROR.obsidianMid, border:`1px solid ${JIN.shadow}33`, borderRadius:7, padding:'7px 10px' }}>
                <p style={{ fontSize:12, color:EMPEROR_UI.textSecondary, lineHeight:1.6, margin:0 }}>「{s.content}」</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 客戶攻單頁 ───
export function CustomerTargetPage() {
  injectHvtStyles();
  const opportunities = mockCustomerOpportunities;
  const bigDealCount = opportunities.filter(o => o.isBigDealChance).length;

  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🎯 高價客戶攻單名單</h2>
        <p style={SUB}>今日爆發大單機會 · <span style={{ color:HUO.bright, fontWeight:700 }}>{bigDealCount} 筆</span>爆發機會</p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {opportunities.map((o, i) => (
          <div key={i} className="hvt-card" style={{ ...CARD, border:`1px solid ${o.isBigDealChance ? HUO.shadow : EMPEROR_UI.borderMain}` }}>
            <div style={CARD_SCAN} />
            {/* 頭部 */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, gap:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:o.isBigDealChance ? HUO.abyss : EMPEROR.obsidianMid, border:`1px solid ${o.isBigDealChance ? HUO.shadow : EMPEROR_UI.borderMain}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900 }}>
                  {o.isBigDealChance ? '💎' : (i + 1)}
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:900, color:EMPEROR_UI.textPrimary }}>{o.clientName}</div>
                  {o.isBigDealChance && <span style={{ ...BADGE, background:HUO.abyss, color:HUO.bright, border:`1px solid ${HUO.shadow}` }}>爆發大單機會</span>}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:15, fontWeight:900, color:JIN.bright }}>${o.predictedOrderValue.toLocaleString()}</div>
                <div style={{ fontSize:9, color:EMPEROR_UI.textDim }}>預測客單價</div>
              </div>
            </div>

            {/* 數據格子 */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, textAlign:'center', marginBottom:7 }}>
              {([
                ['成交機率', `${(o.closeProbability*100).toFixed(0)}%`, TU],
                ['回購機率', `${(o.repurchaseProbability*100).toFixed(0)}%`, SHUI],
                ['最佳對接', o.bestEmployee, JIN],
                ['最佳時段', o.bestTimeSlot, MU],
              ] as const).map(([lbl,val,p]) => (
                <div key={lbl} style={{ background:p.abyss, border:`1px solid ${p.shadow}`, borderRadius:7, padding:'5px 3px' }}>
                  <div style={{ fontSize:9, color:p.text }}>{lbl}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:p.bright, marginTop:1 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* 主攻建議 */}
            <div style={{ background:SHUI.abyss, border:`1px solid ${SHUI.shadow}`, borderRadius:7, padding:'6px 10px', fontSize:11, color:EMPEROR_UI.textSecondary }}>
              <span style={{ fontWeight:700, color:SHUI.bright }}>主攻建議：</span>{o.suggestion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 訓練頁 ───
interface TrainingProps { profiles: HighValueProfile[] }

export function HighValueTrainingPage({ profiles }: TrainingProps) {
  injectHvtStyles();
  const needTraining = profiles.filter(p => p.totalScore < 60);

  return (
    <div style={PAGE}>
      <div style={{ borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>🎓 高價成交訓練中心</h2>
        <p style={SUB}>弱點自動生成訓練任務 · <span style={{ color:needTraining.length>0 ? HUO.bright : TU.bright, fontWeight:700 }}>{needTraining.length} 人</span>待訓練</p>
      </div>

      {needTraining.length === 0 && (
        <div style={{ ...CARD, border:`1px solid ${TU.shadow}`, textAlign:'center', padding:'12px 14px' }}>
          <div style={CARD_SCAN} />
          <div style={{ fontSize:15, fontWeight:900, color:TU.bright }}>全員能力達標 ✅</div>
          <div style={{ fontSize:11, color:TU.text, marginTop:4 }}>目前無人需要緊急訓練</div>
        </div>
      )}

      {needTraining.map(p => {
        const weakItems = Object.entries(p.scores).sort((a, b) => a[1] - b[1]).slice(0, 2);
        return (
          <div key={p.name} style={{ ...CARD, border:`1px solid ${HUO.shadow}` }}>
            <div style={CARD_SCAN} />
            <div style={{ fontSize:12, fontWeight:900, color:HUO.bright, marginBottom:8 }}>{p.name}（總分 {p.totalScore}）</div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {weakItems.map(([key, val]) => {
                const label = key === 'opening' ? '大單開口能力不足' : key === 'closing' ? '收口強度不足' : key === 'courage' ? '高價膽量偏低' : key === 'priceEndure' ? '價格承壓能力不足' : '拒絕處理能力不足';
                const tmpl = trainingTemplates.find(t => t.weaknessType === label) ?? trainingTemplates[0];
                return (
                  <div key={key} style={{ background:EMPEROR.obsidianMid, border:`1px solid ${HUO.shadow}44`, borderRadius:8, padding:'8px 10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                      <div style={{ display:'flex', gap:4 }}>
                        <span style={{ ...BADGE, background:HUO.abyss, color:HUO.bright, border:`1px solid ${HUO.shadow}` }}>{label}</span>
                        <span style={{ fontSize:10, color:EMPEROR_UI.textDim }}>分數：{val}</span>
                      </div>
                      <span style={{ ...BADGE, background:MU.abyss, color:MU.bright, border:`1px solid ${MU.shadow}` }}>待執行</span>
                    </div>
                    <div style={{ fontSize:12, fontWeight:700, color:EMPEROR_UI.textPrimary, marginBottom:4 }}>{tmpl.subject}</div>
                    <div style={{ fontSize:11, color:EMPEROR_UI.textSecondary, marginBottom:5 }}>{tmpl.content}</div>
                    <div style={{ background:HUO.abyss, border:`1px solid ${HUO.shadow}`, borderRadius:6, padding:'5px 8px', fontSize:11, color:EMPEROR_UI.textSecondary }}>
                      🎭 {tmpl.simulation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 全員訓練模板 */}
      <div style={CARD}>
        <div style={CARD_SCAN} />
        <div style={{ fontSize:12, fontWeight:900, color:EMPEROR_UI.textPrimary, marginBottom:8 }}>📋 訓練任務模板庫</div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {trainingTemplates.map((t, i) => (
            <div key={i} style={{ background:EMPEROR.obsidianMid, border:`1px solid ${EMPEROR_UI.borderMain}`, borderRadius:8, padding:'7px 10px' }}>
              <div style={{ display:'flex', gap:4, marginBottom:4, flexWrap:'wrap' }}>
                <span style={{ ...BADGE, background:SHUI.abyss, color:SHUI.bright, border:`1px solid ${SHUI.shadow}` }}>{t.weaknessType}</span>
                <span style={{ ...BADGE, background:JIN.abyss, color:JIN.text, border:`1px solid ${JIN.shadow}` }}>{t.clientType}</span>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:EMPEROR_UI.textPrimary, marginBottom:2 }}>{t.subject}</div>
              <div style={{ fontSize:10, color:EMPEROR_UI.textDim }}>{t.content}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 喊話公告頁 ───
interface RallyProps { profiles: HighValueProfile[] }

export function RallyAnnouncementPage({ profiles }: RallyProps) {
  injectHvtStyles();
  const [version, setVersion] = useState<'主管版' | '精簡版'>('主管版');
  const [copied, setCopied] = useState(false);
  const rally = generateTeamRally(profiles, version);

  const handleCopy = () => {
    navigator.clipboard.writeText(rally);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={PAGE}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8, borderBottom:`1px solid ${EMPEROR_UI.borderAccent}`, paddingBottom:10 }}>
        <div>
          <h2 style={{ ...SECTION_TITLE, fontSize:17 }}>📣 高價成交團隊喊話</h2>
          <p style={SUB}>一鍵生成 · 一鍵複製 · 今日戰力激勵</p>
        </div>
        <button className="hvt-btn" onClick={handleCopy} style={{ padding:'7px 18px', borderRadius:8, border:`1px solid ${copied ? TU.shadow : JIN.shadow}`, background:copied ? TU.abyss : JIN.abyss, color:copied ? TU.bright : JIN.bright, fontSize:12, fontWeight:700, cursor:'pointer', boxShadow:`0 0 10px ${JIN.glow}33` }}>
          {copied ? '✓ 已複製' : '一鍵複製'}
        </button>
      </div>

      {/* 版本切換 */}
      <div style={{ display:'flex', gap:5 }}>
        {(['主管版', '精簡版'] as const).map(v => (
          <button key={v} className={v === version ? 'hvt-tab-on' : 'hvt-tab'} onClick={() => setVersion(v)} style={{ padding:'5px 14px', borderRadius:7, border:`1px solid ${EMPEROR_UI.borderMain}`, background:EMPEROR.obsidian, color:EMPEROR_UI.textMuted, fontSize:12, fontWeight:600, cursor:'pointer', transition:'all .15s' }}>
            {v}
          </button>
        ))}
      </div>

      {/* 喊話內容 */}
      <div style={{ ...CARD, border:`1px solid ${JIN.shadow}` }}>
        <div style={CARD_SCAN} />
        <pre style={{ fontSize:12, color:EMPEROR_UI.textSecondary, whiteSpace:'pre-wrap', lineHeight:1.7, fontFamily:'inherit', margin:0 }}>{rally}</pre>
      </div>
    </div>
  );
}
