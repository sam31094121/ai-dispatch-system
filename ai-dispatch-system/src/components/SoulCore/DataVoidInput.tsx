import { useState, useCallback, useEffect } from 'react';
import { VoidCanvas } from './VoidCanvas';
import { BlackHolePortal } from './BlackHolePortal';

type Tier = 'ultra' | 'high' | 'low' | 'minimal';

interface ParsedRow { name: string; amount: number; rank: number; }

function voidSuggest(rank: number, total: number, pct: string): string {
  if (rank === 1) return `👑 王牌主力 — 佔比 ${pct}%，建議即刻追加高客單資源，效益最大`;
  if (rank <= 3) return `⚔️ 攻堅精銳 — 建議本週優先派攻堅單，轉換率高`;
  if (rank <= Math.ceil(total * 0.4)) return `🎯 成長潛力 — 強化高客單品項可提升排名`;
  return `📈 穩定培育 — 調整話術聚焦收口環節可提升轉換`;
}

interface DataVoidInputProps {
  tier: Tier;
  onUpdate?: (rows: ParsedRow[]) => void;
  onClose?: () => void;
}

export const DataVoidInput = ({ tier, onUpdate, onClose }: DataVoidInputProps) => {
  const [rawInput, setRawInput] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [phase, setPhase] = useState<'idle' | 'parsing' | 'done' | 'sent'>('idle');
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('voidRankings');
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d?.rows?.length > 0) { setRows(d.rows); setPhase('done'); }
      } catch { }
    }
    // Check local backend health
    fetch('http://localhost:3001/api/v1/health')
      .then(r => setApiOk(r.ok))
      .catch(() => setApiOk(false));
  }, []);

  const parseRank = useCallback(() => {
    if (!rawInput.trim()) return;
    setPhase('parsing'); setShowSuggest(false);
    const parsed: ParsedRow[] = [];
    
    for (const line of rawInput.split('\n')) {
      const l = line.trim(); if (!l) continue;
      const m = l.match(/^(.+?)[\s,，：:]+\$?([\d,]+)\s*$/) || l.match(/^(.+?)\s+\$?([\d,.]+)\s*$/);
      if (m) {
        const amt = parseInt(m[2].replace(/,/g, ''), 10);
        if (m[1].trim() && !isNaN(amt) && amt > 0) parsed.push({ name: m[1].trim(), amount: amt, rank: 0 });
      }
    }
    
    parsed.sort((a, b) => b.amount - a.amount).forEach((row, i) => { row.rank = i + 1; });
    
    setTimeout(() => {
      setRows(parsed);
      setPhase('done');
      if (onUpdate) onUpdate(parsed);
      
      // Save for persistence across widgets
      localStorage.setItem('voidRankings', JSON.stringify({ rows: parsed, updatedAt: Date.now() }));
    }, 620);
  }, [rawInput, onUpdate]);

  const sendBackend = useCallback(async () => {
    if (!rows.length) return; setApiOk(null);
    try {
      const resp = await fetch('http://localhost:3001/api/v1/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: rows.map(row => ({ name: row.name, total: row.amount, rank: row.rank })), timestamp: new Date().toISOString() })
      });
      setApiOk(resp.ok); if (resp.ok) setPhase('sent');
    } catch { setApiOk(false); }
  }, [rows]);

  const maxAmt = rows.length > 0 ? rows[0].amount : 1;
  const totalAmt = rows.reduce((s, row) => s + row.amount, 0);
  const RC = ['#ffd700', '#c0c0c0', '#cd7f32', '#00e5ff', '#7c4dff', '#00ffd0', '#ff6ec7', '#00ff8c'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0, 2, 8, 0.88)',
      backdropFilter: 'blur(24px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <VoidCanvas tier={tier} />
      </div>

      <div style={{
        position: 'relative', zIndex: 10,
        width: 'calc(100% - 40px)', maxWidth: '1100px',
        background: 'rgba(0, 4, 16, 0.75)',
        border: '1px solid rgba(0, 229, 200, 0.18)',
        borderRadius: 24, boxShadow: '0 30px 90px rgba(0,0,0,0.8), 0 0 50px rgba(0, 229, 200, 0.08)',
        padding: 'clamp(24px, 4.5vh, 48px)',
        overflow: 'hidden',
        animation: 'voidWin 5s ease-in-out infinite'
      }}>
        {/* Close Button */}
        {onClose && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 20, right: 24,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
            width: 32, height: 32, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, transition: 'all 0.2s'
          }} onMouseOver={e => e.currentTarget.style.borderColor = '#00ffd0'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
            ×
          </button>
        )}

        <div style={{ textAlign: 'center', marginBottom: 'clamp(18px, 3vh, 32px)' }}>
          <div style={{ fontSize: '8.5px', letterSpacing: '6px', color: 'rgba(0, 229, 200, 0.45)', marginBottom: 6, fontFamily: 'var(--font-label)' }}>
            VOID CORE · DATA INGESTION · v9.2
          </div>
          <h2 className="shimmerTxt" style={{ fontSize: 'clamp(20px, 2.5vw, 36px)', fontWeight: 900, margin: '0 0 6px' }}>
            績效黑洞輸入終端
          </h2>
          <div style={{ fontSize: '9px', color: 'rgba(0, 229, 200, 0.35)', letterSpacing: '2.5px', fontFamily: 'var(--font-mono)' }}>
            INPUT → BLACK HOLE AI → SYNC RANKINGS → ALL LAYERS
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'clamp(20px, 4vw, 40px)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Left: 3D Black Hole Portal */}
          <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BlackHolePortal tier={tier} />
          </div>

          {/* Right: Interface Form & Display */}
          <div style={{ flex: '1 1 340px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,229,200,0.08)', borderRadius: 16, padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: apiOk === true ? '#00ffd0' : apiOk === false ? '#ff5050' : '#ffd700', boxShadow: `0 0 8px ${apiOk === true ? '#00ffd0' : apiOk === false ? '#ff5050' : '#ffd700'}`, animation: 'breathe 2.5s ease-in-out infinite' }} />
                <span style={{ fontSize: '8px', letterSpacing: '2px', color: 'rgba(0,229,200,0.5)', fontFamily: 'var(--font-mono)' }}>
                  {apiOk === true ? 'BACKEND LINK LIVE' : apiOk === false ? 'BACKEND OFFLINE' : 'CONNECTING...'}
                </span>
                {rows.length > 0 && <span style={{ marginLeft: 'auto', fontSize: '8px', color: 'rgba(0,229,200,0.4)', fontFamily: 'var(--font-mono)' }}>{`RANKED ${rows.length}`}</span>}
              </div>

              <textarea
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder={'格式：姓名 業績（每行一筆）\n李玲玲 546690\n馬秋香 320000\n\n支援：空格/逗號/冒號分隔，及千分位數字'}
                style={{ width: '100%', minHeight: 'clamp(100px, 14vh, 150px)', background: 'rgba(0, 2, 8, 0.85)', border: '1px solid rgba(0, 229, 200, 0.12)', borderRadius: 12, padding: '12px 14px', color: '#e0f8ff', fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.8, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={parseRank} disabled={!rawInput.trim() || phase === 'parsing'} style={{ flex: '1', padding: '10px 0', borderRadius: 10, border: '1px solid rgba(0, 229, 200, 0.22)', cursor: rawInput.trim() ? 'pointer' : 'not-allowed', background: rawInput.trim() ? 'linear-gradient(135deg,rgba(0,229,200,0.18),rgba(124,77,255,0.18))' : 'rgba(255,255,255,0.03)', color: rawInput.trim() ? '#00ffd0' : 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-label)', fontSize: '10px', letterSpacing: '2px', fontWeight: 700, transition: 'all 0.2s', animation: phase === 'parsing' ? 'parseFlash 0.3s ease-in-out infinite' : 'none' }}>
                  {phase === 'parsing' ? 'PROCESSING...' : '⚡ AI PARSE & ABSORB'}
                </button>
              </div>
            </div>

            {/* Ingested Results */}
            {rows.length > 0 && (
              <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(0,229,200,0.05)', borderRadius: 16, padding: '16px', maxHeight: '220px', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(0,229,200,0.4)', fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                  <span>RANKED ENTRIES</span>
                  <span>TOTAL: ${totalAmt.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {rows.slice(0, 4).map((row, i) => {
                    const pct = ((row.amount / totalAmt) * 100).toFixed(1);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, animation: 'rankSlide 0.3s ease-out both', animationDelay: `${i * 0.05}s` }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${RC[i % 8]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 900, color: RC[i % 8], textShadow: `0 0 10px ${RC[i % 8]}` }}>{row.rank}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px', color: i < 3 ? RC[i % 8] : '#e0f8ff' }}>{row.name}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 700, color: 'white' }}>${row.amount.toLocaleString()}</span>
                          </div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 1.5, marginTop: 4 }}>
                            <div style={{ height: '100%', width: `${(row.amount / maxAmt) * 100}%`, background: RC[i % 8], boxShadow: `0 0 6px ${RC[i % 8]}` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {rows.length > 4 && <div style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(0,229,200,0.4)' }}>+ {rows.length - 4} more nodes...</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
