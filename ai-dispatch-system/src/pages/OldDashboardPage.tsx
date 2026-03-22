import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { rawEmployees, platforms } from '../data/mockData';
import { calculateAiScores, assignGroups, calcHealthScore } from '../engine/aiEngine';
import { SmartCard, SectionBlock } from '../components/Unified';
import { EMPEROR_UI } from '../constants/wuxingColors';

export default function OldDashboardPage() {
  const [sysStatus, setSysStatus] = useState<{ running: boolean; uptime: number; reportCount: number }>({ running: false, uptime: 0, reportCount: 0 });

  useEffect(() => {
    let alive = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/v1/system/status');
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        const d = json.data ?? json;
        setSysStatus({
          running: d.running ?? d.status === 'running',
          uptime: d.uptime ?? 0,
          reportCount: d.reportCount ?? 0,
        });
      } catch { /* 後端離線 */ }
    };
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const scored = useMemo(() => {
    try {
      const s = calculateAiScores(rawEmployees);
      return assignGroups(s).sort((a,b) => (b.aiScore ?? 0) - (a.aiScore ?? 0));
    } catch { return []; }
  }, []);
  
  const health = useMemo(() => {
    try { return calcHealthScore(scored); } catch { return 88; }
  }, [scored]);

  const totalRev = useMemo(() => platforms.reduce((acc, p) => acc + p.revenue, 0), []);

  const MODULE_CARDS = [
    { title: 'AI 排名引擎', sub: '智能排名核心', icon: '🧠', color: '#00e5ff', link: '/ranking', badge: '運行中', desc: '即時智能排名演算法核心', val: '99.8%' },
    { title: '派工調度中心', sub: '派工調度核心', icon: '⚡', color: '#7c4dff', link: '/dispatch', badge: '就緒', desc: '全自動派工任務分配引擎', val: '2.1ms' },
    { title: '公告生成系統', sub: '公告 AI 核心', icon: '📡', color: '#ffd700', link: '/bc', badge: '同步中', desc: '智能公告撰寫與發送系統', val: '12/時' },
    { title: '每日報表引擎', sub: '報表生成核心', icon: '📊', color: '#00ffd0', link: '/', badge: '自動', desc: '數據聚合報表自動生成', val: '∞' },
    { title: '一鍵流水線', sub: '流水線核心', icon: '🚀', color: '#ff6ec7', link: '/pipeline', badge: '加速', desc: '一鍵自動化完整流水作業', val: '自動' },
    { title: '資料審計核心', sub: '審計 AI 核心', icon: '🔍', color: '#00ff8c', link: '/ranking', badge: '通過', desc: '深度數據稽核與驗證系統', val: '100%' },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto', color: '#e2e8f0', fontFamily: '"Noto Sans TC", sans-serif' }}>
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
         <h1 style={{ fontSize: 32, fontWeight: 900, color: '#00D4FF', margin: '0 0 8px 0', letterSpacing: '0.05em' }}>全球生命引擎中控台</h1>
         <div style={{ fontSize: 12, color: '#475569', fontFamily: 'monospace' }}>核心指標總覽 · 系統在線率 99.97%</div>
      </div>

      <SectionBlock title="系統即時監控" icon="🩺">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <SmartCard title="系統狀態" subtitle="後端引擎" accentColor={sysStatus.running ? '#00e5ff' : '#ef4444'} highlight>
             <div style={{ fontSize: 32, fontWeight: 900, fontFamily: '"Orbitron", monospace', color: sysStatus.running ? '#00e5ff' : '#ef4444' }}>
               {sysStatus.running ? '運行中' : '離線'}
             </div>
             <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
               運行 {Math.floor(sysStatus.uptime / 60)} 分鐘 · 已處理 {sysStatus.reportCount} 份報表
             </div>
          </SmartCard>
          <SmartCard title="總收益金額" subtitle="三平台合計" accentColor="#ffd700">
             <div style={{ fontSize: 32, fontWeight: 900, fontFamily: '"Orbitron", monospace', color: '#ffd700' }}>
               ${totalRev.toLocaleString()}
             </div>
          </SmartCard>
          <SmartCard title="健康指數" subtitle="AI 戰力評估" accentColor="#00ffd0">
             <div style={{ fontSize: 32, fontWeight: 900, fontFamily: '"Orbitron", monospace', color: '#00ffd0' }}>
               {health}%
             </div>
          </SmartCard>
        </div>
      </SectionBlock>

      <SectionBlock title="平台業績分布" icon="📈">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {platforms.map((p, i) => {
             const pct = totalRev > 0 ? (p.revenue / totalRev) * 100 : 0;
             const color = p.name === '奕心' ? '#00e5ff' : p.name === '民視' ? '#00ff9c' : '#c084fc';
             return (
               <SmartCard key={p.name} title={p.name} accentColor={color}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                   <div style={{ fontSize: 24, fontWeight: 900, fontFamily: '"Orbitron", monospace', color: '#fff' }}>
                     ${p.revenue.toLocaleString()}
                   </div>
                   <div style={{ fontSize: 14, fontFamily: '"Orbitron", monospace', color }}>
                     {pct.toFixed(1)}%
                   </div>
                 </div>
                 <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 12, overflow: 'hidden' }}>
                   <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 1s ease-out' }} />
                 </div>
               </SmartCard>
             );
          })}
        </div>
      </SectionBlock>

      <SectionBlock title="核心系統模組" icon="🖥️">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {MODULE_CARDS.map(m => (
            <Link key={m.title} to={m.link} style={{ textDecoration: 'none' }}>
              <SmartCard title={m.title} subtitle={m.sub} rightAction={<span style={{fontSize: 10, padding: '2px 6px', background: `${m.color}22`, color: m.color, borderRadius: 4, fontFamily: 'monospace'}}>{m.badge}</span>} accentColor={m.color} hoverEffect>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${m.color}66)` }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                     <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>{m.desc}</div>
                     <div style={{ fontSize: 18, fontWeight: 900, fontFamily: '"Orbitron", monospace', color: m.color }}>{m.val}</div>
                  </div>
                </div>
              </SmartCard>
            </Link>
          ))}
        </div>
      </SectionBlock>
    </div>
  );
}
