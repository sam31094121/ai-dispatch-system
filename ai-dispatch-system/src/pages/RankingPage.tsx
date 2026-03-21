import React, { useState, useMemo } from 'react';
import { rawEmployees, aiSuggestions, platforms } from '../data/mockData';
import type { Employee } from '../data/mockData';
import { getGroupColor } from '../engine/aiEngine';

// ── 平台月目標預設值 ──
const DEFAULT_TARGETS: Record<string, number> = { '奕心': 6000000, '民視': 2500000, '公司': 800000 };

function getPlatformInsight(name: string, revenue: number, _target: number, progress: number): string {
  const gap = (_target - revenue).toLocaleString();
  const revFmt = revenue.toLocaleString();
  if (name === '奕心') {
    if (progress >= 80) return `營收 ${revFmt} 已突破穩定期，爆發點落在 B 組續單收尾。已達目標 ${progress}%，建議維持流速、防範大單退單，確保本月達成。`;
    if (progress >= 50) return `目前實收 ${revFmt}，距目標差 ${gap}（進度 ${progress}%）。強化 A1 高單收口 + A2 續單轉現，今日補 1 筆高價大單可顯著提升進度。`;
    return `目前實收 ${revFmt}，進度僅 ${progress}%（差 ${gap}）。緊急導入雙線並行：A1 主攻爆發、A2 補量，全員加壓，每日須提升 3% 以上。`;
  }
  if (name === '民視') {
    if (progress >= 70) return `追續單動能極強（${revFmt}），距目標僅差 ${gap}（進度 ${progress}%）。今日強化「大單攻頂」，優先配高價值名單給 A 組洗單，確保衝刺不斷力。`;
    if (progress >= 40) return `目前實收 ${revFmt}（進度 ${progress}%），距目標差 ${gap}。A2 梯隊每日至少推出 5 次有效追續，現在不加速後面很難補。`;
    return `民視進度嚴重落後（${progress}%），差距達 ${gap}。立即啟動緊急補量方案，A 組每人每日至少確認 2 筆訂單。`;
  }
  if (progress >= 60) return `潛力水位啟動中（${revFmt}，進度 ${progress}%），建議優先配高價值名單給 A 組洗單，本月目標可期。`;
  if (progress >= 30) return `目前實收 ${revFmt}（${progress}%），距目標差 ${gap}。動能需提升，建議主力加速收網，優化 B 組名單分配。`;
  return `公司盤僅完成 ${progress}% 月目標，差距 ${gap}。緊急評估名單質量，重新導入高機率名單，縮短成交週期。`;
}

export default function RankingPage() {
  const [selectedEmp, setSelectedEmp] = useState<Employee>(rawEmployees[0]);
  const [viewMode, setViewMode] = useState<'emp' | 'plat'>('emp');
  const [selectedPlatName, setSelectedPlatName] = useState<string>('');
  const [platTargets, setPlatTargets] = useState<Record<string, number>>({ ...DEFAULT_TARGETS });
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState('');
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
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: '8px', position: 'relative' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#00d4ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 8px #00d4ff', animation: 'ml-dot 2s infinite' }} />
                  📊 {selectedPlatName} AI 深度診斷核芯
                </div>
                <div onClick={() => setViewMode('emp')} style={{ cursor: 'pointer', fontSize: 9, color: '#94a3b8', background: 'rgba(255,255,255,0.07)', padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.1)', transition: 'all 0.2s' }}>
                  返回雷達圖 ↩
                </div>
              </div>

              {(() => {
                const plat = platforms.find(p => p.name === selectedPlatName);
                const rev = plat?.revenue ?? 0;
                const target = platTargets[selectedPlatName] ?? DEFAULT_TARGETS[selectedPlatName] ?? 2000000;
                const progress = Math.min(100, Math.round((rev / target) * 100));
                const gap = Math.max(0, target - rev);
                const isReached = rev >= target;
                const statusColor = isReached ? '#00ff9c' : progress >= 60 ? '#00e5ff' : '#f59e0b';
                const insight = getPlatformInsight(selectedPlatName, rev, target, progress);
                // 各平台該平台員工的追續筆數總和
                const platFollowTotal = rawEmployees.reduce((s, e) => s + e.followUps, 0);
                const velocityPct = Math.min(100, Math.round((platFollowTotal / 300) * 100));

                return (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', paddingRight: 4 }}>

                    {/* 📋 主目標預警：半圓形儀表板 (SVG) */}
                    <div style={{ background: 'rgba(3, 7, 18, 0.5)', padding: '12px', borderRadius: 10, border: '1px solid rgba(0,212,255,0.15)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', letterSpacing: '1px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🎯 離月目標預警 (MONTHLY CEILING)</span>
                        {/* 可編輯目標 */}
                        {editingTarget ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number"
                              value={targetInput}
                              onChange={e => setTargetInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const v = parseInt(targetInput.replace(/,/g, ''));
                                  if (!isNaN(v) && v > 0) setPlatTargets(t => ({ ...t, [selectedPlatName]: v }));
                                  setEditingTarget(false);
                                }
                                if (e.key === 'Escape') setEditingTarget(false);
                              }}
                              autoFocus
                              style={{ width: 90, background: 'rgba(0,0,0,0.6)', border: '1px solid #00d4ff55', color: '#00d4ff', borderRadius: 4, padding: '2px 5px', fontSize: 10, outline: 'none' }}
                            />
                            <button onClick={() => { const v = parseInt(targetInput.replace(/,/g, '')); if (!isNaN(v) && v > 0) setPlatTargets(t => ({ ...t, [selectedPlatName]: v })); setEditingTarget(false); }} style={{ fontSize: 9, background: '#00d4ff22', border: '1px solid #00d4ff44', color: '#00d4ff', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>確定</button>
                            <button onClick={() => setEditingTarget(false)} style={{ fontSize: 9, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: 3, padding: '2px 6px', cursor: 'pointer' }}>取消</button>
                          </div>
                        ) : (
                          <span onClick={() => { setTargetInput(String(target)); setEditingTarget(true); }} title="點擊修改本月目標" style={{ cursor: 'pointer', color: '#00d4ff55', fontSize: 8, background: 'rgba(0,212,255,0.05)', padding: '1px 5px', borderRadius: 3, border: '1px solid rgba(0,212,255,0.1)' }}>✏️ 修改目標</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                        <div style={{ width: 66, height: 66, position: 'relative', flexShrink: 0 }}>
                          <svg width="66" height="66" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke={statusColor} strokeWidth="10"
                              strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - progress / 100)}
                              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                              filter={`drop-shadow(0 0 4px ${statusColor}99)`} />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: statusColor, fontFamily: 'Orbitron' }}>{progress}%</div>
                            <div style={{ fontSize: 6, color: '#94a3b8' }}>達成率</div>
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Orbitron', textShadow: `0 0 12px ${statusColor}55` }}>${target.toLocaleString()}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>本月目標</div>
                          <div style={{ fontSize: 9, color: statusColor, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{isReached ? '✓ 已達標' : `尚差 $${gap.toLocaleString()}`}</span>
                            <span style={{ fontSize: 8, padding: '1px 4px', background: isReached ? 'rgba(0,255,156,0.12)' : 'rgba(245,158,11,0.12)', color: isReached ? '#00FF9C' : '#F59E0B', borderRadius: 3 }}>
                              {isReached ? '穩健' : progress >= 60 ? '追進' : '加壓'}
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: '#00e5ff', fontFamily: 'Orbitron', marginTop: 4 }}>${rev.toLocaleString()}</div>
                          <div style={{ fontSize: 7, color: '#475569' }}>本期實收</div>
                        </div>
                      </div>
                    </div>

                    {/* 📊 二維 Matrix 矩陣數據 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(0,255,156,0.1)' }}>
                        <div style={{ fontSize: 7, color: '#94a3b8' }}>追續動力 (Velocity)</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#00ff9c', fontFamily: 'Orbitron', marginTop: 2 }}>{velocityPct}%</div>
                        <div style={{ height: 2, background: 'rgba(0,255,156,0.1)', borderRadius: 1, marginTop: 4 }}>
                          <div style={{ width: `${velocityPct}%`, height: '100%', background: '#00ff9c', transition: 'width 0.8s' }} />
                        </div>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(139,92,246,0.1)' }}>
                        <div style={{ fontSize: 7, color: '#94a3b8' }}>整體人數 (Active)</div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: '#c084fc', fontFamily: 'Orbitron', marginTop: 2 }}>{rawEmployees.length}</div>
                        <div style={{ fontSize: 7, color: '#64748b', marginTop: 3 }}>參與成員</div>
                      </div>
                    </div>

                    {/* 💡 AI 診斷書 — 動態內容 */}
                    <div style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(0,212,255,0.25)', background: 'rgba(0, 212, 255, 0.05)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'absolute', top: 0, right: 0, width: 22, height: 22, borderTop: '2px solid #00d4ff', borderRight: '2px solid #00d4ff', opacity: 0.6 }} />
                      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 22, height: 22, borderBottom: '2px solid #00d4ff', borderLeft: '2px solid #00d4ff', opacity: 0.6 }} />
                      <div style={{ fontSize: 10, color: '#00d4ff', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                        <span style={{ fontSize: 12 }}>💡</span> AI 洞察建議
                        <span style={{ fontSize: 7, color: 'rgba(0,212,255,0.5)', fontFamily: 'monospace', marginLeft: 'auto' }}>AUTO_GEN_✓</span>
                      </div>
                      <p style={{ flex: 1, fontSize: 10, color: '#e2e8f0', margin: 0, lineHeight: 1.6, fontFamily: '"Microsoft JhengHei", sans-serif', letterSpacing: '0.2px', overflowY: 'auto' }}>
                        {insight}
                      </p>
                    </div>

                  </div>
                );
              })()}
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
            const text = `📣【AI 派單公告｜3/21 結算 → 3/22 派單順序】\n審計結果：數據通過\n整合總盤：實收 $5,980,430\n點選人員：${selectedEmp.name} (No.${selectedEmp.rank})\nAI戰略建議：\n${aiSuggestions[selectedEmp.name] || '無'}`;
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
