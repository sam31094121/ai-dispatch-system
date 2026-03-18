import React, { useState, useMemo } from 'react';
import { rawEmployees, aiSuggestions, platforms } from '../data/mockData';
import type { Employee } from '../data/mockData';
import { getGroupColor } from '../engine/aiEngine';

export default function RankingPage() {
  const [selectedEmp, setSelectedEmp] = useState<Employee>(rawEmployees[0]);
  const [viewMode, setViewMode] = useState<'emp' | 'plat'>('emp');
  const [selectedPlatName, setSelectedPlatName] = useState<string>('');
  const totalRev = useMemo(() => platforms.reduce((sum, p) => sum + p.revenue, 0), []);

  // 雷達圖配置
  const SIZE = 280;
  const CENTER = SIZE / 2;
  const RAD = SIZE * 0.42; // 最大半徑
  const LABELS = ['開口', '膽量', '收口', '價值', '承壓'];
  const KEYS = ['open', 'brave', 'close', 'value', 'stress'] as const;

  // 五角形頂點坐標計算 (角度 72度 / 0.4 * Math.PI)
  const angleSlice = (Math.PI * 2) / 5;

  const radarPoints = useMemo(() => {
    if (!selectedEmp.stats) return [];
    return KEYS.map((key, i) => {
      const val = selectedEmp.stats![key] || 0;
      const r = (val / 100) * RAD;
      const angle = angleSlice * i - Math.PI / 2; // 從頂部開始
      return {
        x: CENTER + r * Math.cos(angle),
        y: CENTER + r * Math.sin(angle),
      };
    });
  }, [selectedEmp, RAD, CENTER, angleSlice, KEYS]);

  const radarPolygon = radarPoints.map(p => `${p.x},${p.y}`).join(' ');

  // 背景網格線
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0].map((lvl) => {
    const r = RAD * lvl;
    return Array.from({ length: 5 }, (_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      return `${CENTER + r * Math.cos(angle)},${CENTER + r * Math.sin(angle)}`;
    }).join(' ');
  });

  return (
    <div style={{
      display: 'grid', 
      gridTemplateColumns: '240px 380px 1fr', // 🧭 全景三欄式 (左名單、中雷達、右數據)
      height: '100vh', 
      background: '#020617', 
      color: '#e2e8f0',
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      overflow: 'hidden'
    }}>
      
      {/* ── 1. 左側：人員清單 (戰力排名) 📊 ── */}
      <div style={{
        borderRight: '1px solid rgba(0, 212, 255, 0.08)',
        display: 'flex', flexDirection: 'column', 
        background: 'rgba(3, 7, 18, 0.4)',
        backdropFilter: 'blur(10px)', 
        height: '100vh',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '12px 14px', borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
          background: 'linear-gradient(90deg, rgba(0,212,255,0.03), transparent)'
        }}>
          <h2 style={{ fontSize: 13, fontWeight: 900, color: '#00d4ff', margin: 0, letterSpacing: '1px', display:'flex', alignItems:'center', gap:5 }}>
            <span style={{width:5, height:5, borderRadius:'50%', background:'#00D4FF', boxShadow:'0 0 6px #00D4FF'}} />
            AI 戰力大數據中心
          </h2>
          <div style={{ fontSize: 8, color: 'rgba(0, 212, 255, 0.4)', marginTop: 2, fontFamily: 'monospace' }}>DATA_CORE v4.3</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {[
            { tag: 'A1', label: '🔴 A2｜高單主力' , color: '#EF4444' }, // 依據使用者 A1-C
            { tag: 'A2', label: '🟠 A2｜續單收割', color: '#F59E0B' },
            { tag: 'B',  label: '🟡 B 組｜一般量單', color: '#FBBF24' },
            { tag: 'C',  label: '🟢 C 組｜觀察培養', color: '#10B981' }
          ].map(grp => {
            const emps = rawEmployees.filter(e => (e as any).group === grp.tag);
            if (emps.length === 0) return null;
            return (
              <div key={grp.tag} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: grp.color, padding: '3px 6px', letterSpacing: '1px', background: `${grp.color}11`, borderRadius: 4, marginBottom: 3 }}>
                  {grp.label}
                </div>
                {emps.map((m) => {
                  const isActive = selectedEmp.name === m.name;
                  return (
                    <div
                      key={m.name}
                      onClick={() => setSelectedEmp(m)}
                      style={{
                        padding: '6px 10px', borderRadius: 6, marginBottom: 2, cursor: 'pointer',
                        background: isActive ? 'rgba(0, 212, 255, 0.06)' : 'transparent',
                        border: isActive ? '1px solid rgba(0, 212, 255, 0.2)' : '1px solid transparent',
                        transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontSize: 9, fontFamily: 'monospace', color: isActive ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                          width: 16
                        }}>
                          {String(m.rank).padStart(2, '0')}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: isActive ? 800 : 500, color: isActive ? '#fff' : '#94a3b8' }}>
                          {m.name}
                        </span>
                      </div>
                      {m.stats && (
                        <span style={{
                          fontSize: 9, fontWeight: 900, color: '#00ff9c', fontFamily: 'monospace',
                          background: 'rgba(0, 255, 156, 0.08)', padding: '1px 3px', borderRadius: 2
                        }}>
                          {m.stats.total}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 2. 中側：3D 雷達圖 Hub 🔮 ── */}
      <div style={{
        padding: '16px', borderRight: '1px solid rgba(0, 212, 255, 0.08)',
        display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.4), rgba(15, 23, 42, 0.1))',
        position: 'relative', height: '100vh', overflow: 'hidden'
      }}>
        
        {/* 🔱 平台業績分布 (最後優化看板) 🔱 */}
        <div className="glass metalCard" style={{ padding: '12px', borderRadius: 12, border: '1px solid rgba(0, 212, 255, 0.15)', background: 'rgba(3, 7, 18, 0.4)' }}>
          <div style={{ fontSize: 9, color: '#00d4ff', letterSpacing: '1.5px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, background: '#00D4FF', borderRadius: '50%', boxShadow: '0 0 4px #00d4ff' }} />
            🌐 REAL-TIME CORE REV MATRIX
          </div>
          <div style={{ fontSize: 11, color: '#fff', fontWeight: 800, marginTop: 4 }}>即時營收流動網格</div>
          <div style={{ fontSize: 7, color: 'rgba(0, 212, 255, 0.6)', letterSpacing: '0.5px', marginBottom: 2 }}>平台權重與金流動態分析</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', marginTop: 10, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
            <div>
              <div style={{ fontSize: 8, color: '#94a3b8' }}>TOTAL ROLLING REV</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textShadow: '0 0 10px rgba(0,212,255,0.3)', fontFamily: '"Orbitron", sans-serif' }}>${totalRev.toLocaleString()}</div>
            </div>
            <div style={{ fontSize: 9, color: '#00d4ff', background: 'rgba(0,212,255,0.08)', padding: '2px 6px', borderRadius: 4, fontWeight: 900 }}>3 PLATFORMS</div>
          </div>

          {/* 三平台 Matrix 矩陣 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
            {platforms.map(p => {
              const rate = totalRev > 0 ? Math.round((p.revenue / totalRev) * 100) : 0;
              const active = p.revenue > 0;
              const color = p.name === '奕心' ? '#00ff9c' : p.name === '民視' ? '#00e5ff' : '#c084fc';
              const analysis = p.name === '奕心' ? '主力' : p.name === '民視' ? '🚀爆發' : '潛力';
              const glow = active ? `0 0 10px ${color}22` : 'none';
              const points = p.name === '奕心' ? "0,15 10,8 20,13 30,5 40,12 50,2" : p.name === '民視' ? "0,15 10,12 20,5 30,8 40,3 50,0" : "0,18 10,14 20,16 30,12 40,15 50,10";
              const isSelected = viewMode === 'plat' && selectedPlatName === p.name;
              return (
                <div key={p.name} 
                  onClick={() => { 
                    console.log('DEBUG: Platform clicked', p.name);
                    setViewMode('plat'); 
                    setSelectedPlatName(p.name); 
                  }}
                  style={{ 
                    background: isSelected ? 'rgba(0, 212, 255, 0.08)' : active ? 'rgba(0, 212, 255, 0.03)' : 'rgba(255,255,255,0.01)', 
                    padding: '8px', borderRadius: 8, 
                    border: `1px solid ${isSelected ? color : active ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255,255,255,0.03)'}`, 
                    textAlign: 'center', position: 'relative', cursor: 'pointer',
                    boxShadow: isSelected ? `0 0 15px ${color}44` : glow,
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.02)' : 'none',
                    zIndex: 10 // 確保點擊最高權
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 900, color: active ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                    {p.name} <span style={{ fontSize: 7, color: color, fontWeight: 800 }}>({analysis})</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: color, fontFamily: 'Orbitron', margin: '2px 0' }}>{rate}%</div>
                  <div style={{ fontSize: 9, color: active ? '#fff' : '#475569', fontWeight: 700 }}>${p.revenue.toLocaleString()}</div>
                  <div style={{ height: 10, marginTop: 4 }}>
                    <svg width="100%" height="100%" viewBox="0 0 50 20" preserveAspectRatio="none">
                      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 9, color: '#94a3b8' }}>TOTAL CYCLE <span style={{ color: '#fff', fontWeight: 900, fontFamily: 'Orbitron', marginLeft: 4 }}>${totalRev.toLocaleString()}</span></div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span>◈</span> 模組已安全降級
            </div>
          </div>
        </div>

        {/* 🔮 雷達圖 / 平台診斷 雙模切換 */}
        <div className="glass metalCard" style={{
          flex: 1, padding: '12px', borderRadius: 12,
          background: 'rgba(3, 7, 18, 0.2)', border: '1px solid rgba(0, 212, 255, 0.08)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'
        }}>
          {viewMode === 'emp' ? (
            <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>
              {gridLevels.map((g, i) => (
                <polygon key={i} points={g} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                return (
                  <line
                    key={i}
                    x1={CENTER} y1={CENTER}
                    x2={CENTER + RAD * Math.cos(angle)} y2={CENTER + RAD * Math.sin(angle)}
                    stroke="rgba(0, 212, 255, 0.08)" strokeWidth="1"
                  />
                );
              })}
              {selectedEmp.stats ? (
                <polygon
                  points={radarPolygon}
                  fill="rgba(0, 212, 255, 0.12)"
                  stroke="#00d4ff"
                  strokeWidth="1.5"
                  style={{ filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.4))' }}
                />
              ) : null}
              {radarPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#00d4ff" />
              ))}
              {Array.from({ length: 5 }).map((_, i) => {
                const angle = angleSlice * i - Math.PI / 2;
                const x = CENTER + (RAD + 14) * Math.cos(angle);
                const y = CENTER + (RAD + 12) * Math.sin(angle);
                const anchor = Math.abs(x - CENTER) < 10 ? 'middle' : x < CENTER ? 'end' : 'start';
                return (
                  <text
                    key={i} x={x} y={y + 3} fill="rgba(255,255,255,0.4)" fontSize="8" fontWeight="800" textAnchor={anchor} fontFamily="sans-serif"
                  >
                    {LABELS[i]}
                  </text>
                );
              })}
            </svg>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '8px' }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#00d4ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>📊 {selectedPlatName} AI 深度診斷板</div>
                <div onClick={() => setViewMode('emp')} style={{ cursor: 'pointer', fontSize: 8, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>返回雷達圖 ↩</div>
              </div>
              <div style={{ flex: 1, marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* 離目標差距 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: 6, border: '1px solid rgba(0,212,255,0.05)' }}>
                  <div style={{ fontSize: 8, color: '#64748b' }}>🎯 離月目標預警</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron' }}>$2,000,000</div>
                    <div style={{ fontSize: 8, color: '#94a3b8' }}>/ 目標</div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#00e5ff', width: '65%', transition: 'width 0.5s' }} />
                  </div>
                </div>
                {/* AI 診斷書 */}
                <div style={{ background: 'rgba(0, 212, 255, 0.03)', padding: '8px', borderRadius: 6, border: '1px solid rgba(0,212,255,0.1)' }}>
                  <div style={{ fontSize: 8, color: '#00d4ff', fontWeight: 900 }}>💡 AI 洞察建議</div>
                  <p style={{ fontSize: 9, color: '#e2e8f0', margin: '4px 0 0', lineHeight: 1.5 }}>
                    {selectedPlatName === '民視' 
                      ? '目前【追續單】動能極強，離預定門檻僅差 35%。今日應強制加壓「大單攻頂」策略，提撥 10% 預算投射於馬秋香、王珍珠之核心名單。'
                      : selectedPlatName === '奕心'
                      ? '營收已突破穩定期，爆發點落在 B 組續單收尾。目前健康度評分 92，建議維持當前流速，防範大單退單風險。'
                      : '潛力水位正在啟動，名次中段班適配性高。建議導入 AI 輔助媒合，優先將高價值開口名單配給 A 組人員進行洗單。'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. 右側：戰力分析數據 📊 ── */}
      <div style={{
        padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px',
        overflowY: 'auto', height: '100vh', background: 'rgba(2, 6, 23, 0.1)'
      }}>
        
        {/* 名稱與總分 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#fff', textShadow: '0 0 15px rgba(0,212,255,0.3)' }}>
              {selectedEmp.name}
            </h1>
            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, letterSpacing: '0.3px' }}>
              戰力核定：{selectedEmp.name === '李玲玲' || selectedEmp.name === '馬秋香' ? '爆發大單主攻手' : selectedEmp.stats && selectedEmp.stats.total > 70 ? '高價穩定手' : '潛力培養中'}
            </div>
          </div>
          {selectedEmp.stats && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 8, color: '#00d4ff', letterSpacing: '1px', fontWeight: 900 }}>OVERALL SCORE</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#00e5ff', lineHeight: 1, textShadow: '0 0 15px #00e5ff66', fontFamily: 'Orbitron' }}>
                {selectedEmp.stats.total}
              </div>
            </div>
          )}
        </div>

        {/* 各項數值 Bar */}
        <div className="glass metalCard" style={{ padding: '14px', borderRadius: 12 }}>
          <h3 style={{ fontSize: 11, color: '#94a3b8', marginTop: 0, marginBottom: 10, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{width:3, height:3, borderRadius:'50%', background:'#00D4FF', boxShadow:'0 0 6px #00D4FF'}} />
            隱性指標六維度 (Metrics)
          </h3>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&display=swap');
            .font-cyber { font-family: 'Orbitron', 'Microsoft JhengHei', sans-serif; }
            .glow-text-btn:hover { text-shadow: 0 0 8px rgba(0,212,255,0.8); background: rgba(0, 212, 255, 0.1) !important; }
            .metric-label:hover { color: #00FF9C !important; text-shadow: 0 0 6px rgba(0,255,156,0.5); transform: translateX(2px); cursor: help; }
          `}</style>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {selectedEmp.stats ? KEYS.map((key, i) => {
              const val = selectedEmp.stats![key] || 0;
              const tooltips: Record<string, string> = {
                open: '開口破冰率：客戶在通話第 1 分鐘的對談意願、破冰話術精準度。',
                brave: '膽量承現度：主動提出爆發單、引爆高價意向的膽識與勇氣。',
                close: '收口轉單率：將話術總結推向成交、簽單、收款的終結能力。',
                value: '價值貢獻度：客單價含金量、創造單筆利潤的階層貢獻。',
                stress: '承壓穩定值：面對挫折、連續高壓作業下的耐力和情緒管控能力。'
              };
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 4 }}>
                    <span 
                      className="metric-label"
                      title={tooltips[key]} 
                      style={{ color: '#fff', fontWeight: 700, transition: 'all 0.15s', display:'flex', alignItems:'center', gap:4 }}
                    >
                      <span>▫️</span> {LABELS[i]}
                    </span>
                    <span className="font-cyber" style={{ color: '#00d4ff', fontWeight: 900, textShadow: '0 0 6px rgba(0,212,255,0.2)' }}>{val}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{
                      width: `${val}%`, height: '100%', background: 'linear-gradient(90deg, #00d4ff, #00ff9c)',
                      borderRadius: 1, boxShadow: '0 0 4px rgba(0,212,255,0.4)',
                      transition: 'width 0.4s ease-out'
                    }} />
                  </div>
                </div>
              );
            }) : null}
          </div>
        </div>

        {/* AI 個人建議 */}
        {aiSuggestions[selectedEmp.name] ? (
          <div className="glass metalCard" style={{
            padding: '12px', borderRadius: 10, border: '1px solid rgba(0, 255, 156, 0.15)',
            background: 'rgba(0, 255, 156, 0.01)', position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 900, color: '#00ff9c', marginBottom: 5 }}>
              <span>💡</span> AI 戰略指導建議
            </div>
            <p style={{ fontSize: 10, color: '#e2e8f0', lineHeight: 1.5, margin: 0, letterSpacing: '0.2px', fontFamily: '"Microsoft JhengHei", sans-serif' }}>
              {aiSuggestions[selectedEmp.name].split(/(【[^】]+】)/g).map((p, i) => 
                p.startsWith('【') && p.endsWith('】') 
                  ? <span key={i} style={{ color: '#00ff9c', fontWeight: 900, textShadow: '0 0 4px rgba(0,255,156,0.2)' }}>{p}</span>
                  : p
              )}
            </p>
          </div>
        ) : null}

        {/* 📋 一鍵複製功能按鈕 */}
        <button 
          onClick={() => {
            const text = `📣【AI 派單公告｜3/17 結算 → 3/18 派單順序】\n審計結果：數據通過\n整合總盤：實收 $5,476,572\n點選人員：${selectedEmp.name} (No.${selectedEmp.rank})\nAI戰略建議：\n${aiSuggestions[selectedEmp.name] || '無'}`;
            navigator.clipboard.writeText(text);
            alert('📋 戰力數據已複製！');
          }}
          className="glow-text-btn"
          style={{
            marginTop: 'auto', width: '100%', padding: '8px', borderRadius: 10, border: '1px solid rgba(0, 212, 255, 0.2)',
            background: 'rgba(0, 212, 255, 0.04)', color: '#00d4ff', fontSize: 10, fontWeight: 900,
            cursor: 'pointer', transition: 'all 0.1s', letterSpacing: '1px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}
        >
          <span>📋</span> 複製 3/17 派單數據公告板
        </button>

      </div>
    </div>
  );
}
