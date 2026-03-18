import { useEffect, useRef, useState, useCallback } from "react";
import "./SoulCorePage.css";

/* ── 員工節點常數定義（依戰力排佈） ── */
import { rawEmployees, platforms } from "../data/mockData";
import { DataVoidInput } from "../components/SoulCore/DataVoidInput";

const WORLD_NODES = rawEmployees.slice(0, 10).map((e, i) => {
  const coords = [
    { x: 220, y: 180 }, { x: 380, y: 130 }, { x: 490, y: 140 },
    { x: 310, y: 240 }, { x: 450, y: 250 }, { x: 580, y: 180 },
    { x: 140, y: 120 }, { x: 670, y: 130 }, { x: 620, y: 260 }, { x: 740, y: 200 }
  ];
  const c = coords[i] || { x: 100, y: 100 };
  const level = (e as any).total > 400000 ? "A1 王牌" : (e as any).total > 200000 ? "A2 攻堅" : "B1 穩定";
  return { id: `emp-${i}`, label: e.name, x: c.x, y: c.y, region: level };
});

const CONNECTIONS: [string, string][] = [
  ["emp-0", "emp-1"], ["emp-0", "emp-3"], ["emp-1", "emp-2"],
  ["emp-1", "emp-4"], ["emp-2", "emp-5"], ["emp-3", "emp-4"],
  ["emp-4", "emp-5"], ["emp-6", "emp-0"], ["emp-7", "emp-2"],
  ["emp-8", "emp-5"], ["emp-9", "emp-5"]
];

const LOG_EVENTS = [
  "李玲玲 3/16 總業績 $813,920 — A1 王牌主力 No.1 ✅",
  "王珍珠 補入公司盤後站上 No.2，追單 36 筆落袋 🚀",
  "奕心平台 3/16 實收 $3,153,310 審計通過 💵",
  "民視平台 3/16 實收 $1,073,304 校準完畢 🔍",
  "公司平台 3/16 實收 $806,688 整合完成 🏢",
  "【累積盤 FAIL】民視追續通數 44 ≠ 個別加總 40，以個別為準 ⚖️",
  "派單陣列 [A1王牌組] 李玲玲/王珍珠/馬秋香/王梅慧 部署完畢 ⚔️",
  "王梅慧 續單 $337,160，建議優先派高客單 🎯",
  "林沛昕 A2 收割組 No.5，追單深度優化中 🛎️",
  "系統日誌：三平台核對 總盤 $5,033,302 整合完畢 🎉"
];




export default function SoulCorePage() {
  /* ── 節點健康狀態 State ── */
  const [statuses, setStatuses] = useState<string[]>(
    Array.from({ length: 96 }, (_, i) =>
      i === 17 || i === 53 ? "warn" : i === 38 ? "crit" : "ok"
    )
  );
  const [isRepairing, setIsRepairing] = useState(false);
  const [healthScore, setHealthScore] = useState(88);

  const counterRef = useRef<HTMLSpanElement>(null);
  const throughput = useRef(8_432_156);
  
  function fakeTs(offsetMs: number) {
    const d = new Date(Date.now() - offsetMs);
    return d.toTimeString().slice(0, 8);
  }

  const [log, setLog] = useState<{ ts: string; msg: string }[]>(
    LOG_EVENTS.slice(0, 6).map((msg, i) => ({
      ts: fakeTs(i * 2400),
      msg,
    }))
  );
  
  /* ── 黑洞虛空終端 State ── */
  const [showVoid, setShowVoid] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(5033302);

  /* ── 系統自動維修函式 ── */
  const startAutoRepair = useCallback(() => {
    if(isRepairing) return;
    setIsRepairing(true);
    setLog(prev => [
      { ts: fakeTs(0), msg: "🚨 [AI修復中樞] 啟動自動診斷與網格校準循環..." },
      ...prev
    ]);

    let count = 0;
    const timer = setInterval(() => {
      setStatuses(prevStat => {
        const next = [...prevStat];
        const badIdx = next.findIndex(s => s !== 'ok');
        if (badIdx !== -1) {
          const oldType = next[badIdx] === 'crit' ? '嚴重危急' : '警告';
          next[badIdx] = 'ok';
          setLog(prevLog => [
            { ts: fakeTs(0), msg: `🔧 [自動修復] 節點 #${badIdx} (${oldType}) 矯正成功，狀態恢復 OK ✅` },
            ...prevLog.slice(0, 10)
          ]);
          setHealthScore(prev => Math.min(100, prev + 4));
          return next;
        } else {
          clearInterval(timer);
          setIsRepairing(false);
          setHealthScore(100);
          setLog(prevLog => [
            { ts: fakeTs(0), msg: "🎉 [維護完成] 系統全網格節點自動校準至 100% 穩定" },
            ...prevLog.slice(0, 10)
          ]);
          return next;
        }
      });
      if(count++ > 100) clearInterval(timer);
    }, 900);
  }, [isRepairing]);

  /* ── 即時吞吐量計數 ── */
  useEffect(() => {
    const t = setInterval(() => {
      throughput.current += Math.floor(Math.random() * 3800 + 600);
      if (counterRef.current) {
        counterRef.current.textContent = throughput.current.toLocaleString();
      }
    }, 60);
    return () => clearInterval(t);
  }, []);

  /* ── 滾動事件日誌 ── */
  useEffect(() => {
    let i = 6;
    const t = setInterval(() => {
      setLog((prev) => [
        { ts: fakeTs(0), msg: LOG_EVENTS[i % LOG_EVENTS.length] },
        ...prev.slice(0, 10),
      ]);
      i++;
    }, 2600);
    return () => clearInterval(t);
  }, []);

  /* ── 數字動態跳動 ── */
  useEffect(() => {
    const DIGITS = "0123456789";
    const timers: ReturnType<typeof setInterval>[] = [];

    function slotTo(el: HTMLElement, finalVal: string, steps = 5, stepMs = 36) {
      let s = 0;
      const iv = setInterval(() => {
        if (s++ >= steps) { el.textContent = finalVal; clearInterval(iv); return; }
        el.textContent = finalVal.split("").map((ch) =>
          /[0-9]/.test(ch) ? DIGITS[Math.floor(Math.random() * 10)] : ch
        ).join("");
      }, stepMs);
    }

    function animNum(id: string, min: number, max: number, suffix = "", fixed = 0, ms = 700) {
      const el = document.getElementById(id);
      if (!el) return;
      const run = () => slotTo(el, (min + Math.random() * (max - min)).toFixed(fixed) + suffix);
      run();
      timers.push(setInterval(run, ms + Math.random() * 200));
    }

    function animPipe(textId: string, barId: string, min: number, max: number) {
      const el = document.getElementById(textId);
      const bar = document.getElementById(barId) as HTMLElement | null;
      if (!el || !bar) return;
      const run = () => {
        const v = min + Math.random() * (max - min);
        slotTo(el, v.toFixed(0) + "%");
        bar.style.width = v.toFixed(1) + "%";
      };
      run();
      timers.push(setInterval(run, 480 + Math.random() * 220));
    }

    function animCust(id: string, values: string[], ms = 600) {
      const el = document.getElementById(id);
      if (!el) return;
      const run = () => slotTo(el, values[Math.floor(Math.random() * values.length)]);
      run();
      timers.push(setInterval(run, ms + Math.random() * 200));
    }

    /* 狀態欄 */
    animCust("sbNodes",   [`${rawEmployees.length} 人`], 2000);
    animCust("sbLatency", ["98.2%", "98.5%", "98.8%"], 1500);
    animCust("sbUptime",  ["88.5%", "89.1%", "88.8%"], 1400);
    animCust("sbRegions", [`${platforms.length} / 3`], 2500);

    /* 管道 */
    animPipe("pipeIngText", "pipeIngBar", 93, 97);
    animPipe("pipeProcText", "pipeProcBar", 88, 93);
    animPipe("pipeAnaText", "pipeAnaBar", 91, 95);
    animPipe("pipeOutText", "pipeOutBar", 94, 98);

    /* 底部指標 */
    animCust("metErrRate",  ["0.003%","0.004%","0.002%"], 1200);
    animCust("metQueue",    ["229 追單","245 追單","238 追單"],   800);
    animCust("metP99",      ["12.4s","14.1s","13.8s"],    980);

    return () => timers.forEach(clearInterval);
  }, []);

  function nodePos(id: string) {
    return WORLD_NODES.find((n) => n.id === id) ?? { x: 0, y: 0 };
  }

  return (
    <div className="bd-page">

      {/* ── 頂部狀態欄 ── */}
      <div className="bd-statusbar">
        <div className="sb-brand">
          <span className="sb-live-dot" />
          <span className="sb-name">AI 靈魂核心運算陣列 (AI SOUL CORE)</span>
          <span className="sb-ver">兆櫃 v5.0 Master</span>
        </div>
        <div className="sb-stats">
          {[
            { k: "EMPLOYEES",   id: "sbNodes",   init: `${rawEmployees.length} 人` },
            { k: "AI ACCURACY", id: "sbLatency", init: "98.2%" },
            { k: "TARGET RATE",  id: "sbUptime",  init: `${healthScore}%`, hi: true },
            { k: "PLATFORMS", id: "sbRegions", init: `${platforms.length} / 3` },
          ].map((m) => (
            <div className="sb-stat" key={m.k}>
              <span className="sb-stat-k">{m.k}</span>
              <span className={`sb-stat-v${m.hi ? " hi" : ""}`} id={m.id}>{m.init}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bd-hero">

        {/* ════ 左側：全球拓撲 + 指標 ════ */}
        <section className="bd-panel bd-left">

          <div className="bd-panel-header">
            <div className="bdph-title" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-dot" /> AI Neural Connection Array
              </div>
              <button onClick={() => setShowVoid(true)} style={{ padding: '4px 10px', background: 'rgba(0,229,200,0.12)', border: '1px solid rgba(0,229,200,0.3)', color: '#00ffd0', borderRadius: 6, fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-label)', letterSpacing: '1px', backdropFilter: 'blur(4px)', transition: 'all 0.2s' }}>
                ⚡ RECORD INGEST
              </button>
            </div>
            <div className="bdph-sub">Real-time dynamic flow · 員工戰力矩陣 · Live Dispatch Matrix</div>
          </div>

          {/* 世界網路拓撲圖 => 升級為 全世界地球數據核心 */}
          <div className="world-map-wrap">
            <svg className="world-svg" viewBox="0 0 900 420" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                
                <linearGradient id="connGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--皇家藍)" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="var(--深紫晶)" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="var(--紅寶石)" stopOpacity="0.6" />
                </linearGradient>

                <linearGradient id="earthGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(25, 87, 210, 0.08)" />
                  <stop offset="100%" stopColor="rgba(3, 3, 3, 0.45)" />
                </linearGradient>
              </defs>

              {/* ── 地球基底背景（Worldwide Earth Grid） ── */}
              <g className="earth-sphere-bg">
                {/* 地球外輪廓 */}
                <circle cx="450" cy="210" r="190" fill="url(#earthGrad)" stroke="var(--金框-暗)" strokeWidth="1" strokeDasharray="6 6" opacity="0.45" />
                <circle cx="450" cy="210" r="140" fill="none" stroke="rgba(25, 87, 210, 0.12)" strokeWidth="1" />
                
                {/* 球體經緯格線 */}
                <ellipse cx="450" cy="210" rx="190" ry="70" fill="none" stroke="rgba(25, 87, 210, 0.18)" strokeWidth="0.8" />
                <ellipse cx="450" cy="210" rx="190" ry="130" fill="none" stroke="rgba(25, 87, 210, 0.15)" strokeWidth="0.8" />
                <ellipse cx="450" cy="210" rx="70" ry="190" fill="none" stroke="rgba(25, 87, 210, 0.18)" strokeWidth="0.8" />
                
                {/* 中心強光核心 (數據引擎眼) */}
                <circle cx="450" cy="210" r="32" fill="none" stroke="var(--金框-亮)" strokeWidth="1.2" strokeDasharray="4 2" />
                <circle cx="450" cy="210" r="24" fill="var(--紅寶石)" filter="url(#nodeGlow)" opacity="0.65" />
                <circle cx="450" cy="210" r="8" fill="var(--黃寶石)" />
              </g>

              {/* 背景格線網 */}
              {Array.from({ length: 11 }, (_, i) => (
                <line key={`v${i}`} x1={i * 90} y1="0" x2={i * 90} y2="420"
                  stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              ))}

              {/* 連線（流線弧形優化 ─ 使用 Bezier 弧度顯得更立體立體球感） */}
              {CONNECTIONS.map(([a, b], idx) => {
                const pa = nodePos(a), pb = nodePos(b);
                const midX = (pa.x + pb.x) / 2;
                const midY = (pa.y + pb.y) / 2 - 25; // 稍微向上弧形
                const dPath = `M ${pa.x} ${pa.y} Q ${midX} ${midY} ${pb.x} ${pb.y}`;
                return (
                  <path key={`base-${idx}`}
                    d={dPath}
                    fill="none"
                    stroke="rgba(25, 87, 210, 0.15)" strokeWidth="1.2" />
                );
              })}

              {/* 連線（流動封包動畫 ─ Gemstone 流光體） */}
              {CONNECTIONS.map(([a, b], idx) => {
                const pa = nodePos(a), pb = nodePos(b);
                const midX = (pa.x + pb.x) / 2;
                const midY = (pa.y + pb.y) / 2 - 25;
                const dPath = `M ${pa.x} ${pa.y} Q ${midX} ${midY} ${pb.x} ${pb.y}`;
                return (
                  <path key={`flow-${idx}`}
                    d={dPath}
                    fill="none"
                    stroke="url(#connGrad)" strokeWidth="1.8" strokeOpacity="0.85"
                    strokeDasharray="8 26"
                    className="conn-flow"
                    style={{
                      animationDuration: `${1.8 + (idx % 4) * 0.45}s`,
                      animationDelay: `${-(idx * 0.42)}s`,
                    }}
                  />
                );
              })}

              {/* 節點 ─ 外觀強化、文字背景遮罩 fix Readability 強化一眼看清 */}
              {WORLD_NODES.map((node) => {
                // 特殊標記核心
                const isCoreNode = node.region.includes("A1");
                const nodeColor = isCoreNode ? "var(--黃寶石)" : "var(--祖母綠)";
                const glowColor = isCoreNode ? "var(--黃光)" : "var(--綠光)";

                return (
                  <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                    {/* 外暈圈 */}
                    <circle cx="0" cy="0" r="18"
                      fill="none" stroke={nodeColor} strokeWidth="0.8" strokeOpacity="0.32"
                      className="node-pulse-ring" />
                    <circle cx="0" cy="0" r="14"
                      fill="rgba(0,0,0,0.6)" stroke={nodeColor} strokeWidth="1" opacity="0.65" />
                      
                    {/* 節點核心點 */}
                    <circle cx="0" cy="0" r="5"
                      fill={nodeColor} filter="url(#nodeGlow)" />
                    <circle cx="0" cy="0" r="2" fill="#ffffff" />
                    
                    {/* 標籤背景 (一眼看清 fix: 襯底深黑防文字疊加) */}
                    <g transform="translate(0, -22)">
                      <rect x="-35" y="-12" width="70" height="15" rx="3" fill="var(--背景-面板)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />
                      <text x="0" y="0"
                        textAnchor="middle"
                        fill="var(--主文字)" fontSize="9.5" fontWeight="700"
                        fontFamily="var(--font-label)" letterSpacing="1">
                        {node.label}
                      </text>
                    </g>

                    <g transform="translate(0, -8)">
                      <text x="0" y="0"
                        textAnchor="middle"
                        fill="var(--次文字)" fontSize="8"
                        fontFamily="var(--font-mono)" opacity="0.85">
                        {node.region}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* 吞吐量波形 */}
          <div className="ecg-section">
            <div className="ecg-header">
              <span className="status-dot dot-green dot-sm" />
              <span className="ecg-label">THROUGHPUT WAVEFORM</span>
              <span className="ecg-val" style={{ color: '#ffd700' }}><span id="metThroughput">${totalRevenue.toLocaleString()}</span></span>
            </div>
            <svg className="ecg-svg" viewBox="0 0 1200 72" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ecgG" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="var(--皇家藍)" stopOpacity="0" />
                  <stop offset="15%"  stopColor="var(--皇家藍)" stopOpacity="1" />
                  <stop offset="85%"  stopColor="var(--紅寶石)" stopOpacity="1" />
                  <stop offset="100%" stopColor="var(--紅寶石)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="0" y1="36" x2="1200" y2="36" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
              <path className="ecg-line" stroke="url(#ecgG)"
                d="M0 36 L55 36 L82 36 L108 34 L122 36 L152 36 L196 36
                   L222 30 L236 36 L264 36 L296 36 L312 22 L326 8 L340 62 L358 16 L378 36
                   L436 36 L488 36 L512 33 L526 36 L560 36 L596 36 L620 28 L635 36
                   L664 36 L700 36 L718 20 L732 6 L748 66 L768 14 L790 36
                   L848 36 L898 36 L920 34 L934 36 L966 36 L1000 36 L1022 28 L1036 36
                   L1064 36 L1100 36 L1118 22 L1132 7 L1148 65 L1168 15 L1190 36 L1200 36"
              />
            </svg>
          </div>

          {/* 底部指標列 */}
          <div className="metrics-row">
            <div className="metric-card">
              <div className="mc-label">ERROR RATE</div>
              <div className="mc-value warn" id="metErrRate">0.003%</div>
            </div>
            <div className="metric-card">
              <div className="mc-label">QUEUE DEPTH</div>
              <div className="mc-value" id="metQueue">2.1K</div>
            </div>
            <div className="metric-card">
              <div className="mc-label">P99 LATENCY</div>
              <div className="mc-value" id="metP99">18ms</div>
            </div>
            <div className="metric-card mc-live">
              <div className="mc-label">LIVE PACKETS/S</div>
              <div className="mc-value hi">
                <span ref={counterRef}>8,432,156</span>
              </div>
            </div>
          </div>

        </section>

        {/* ════ 右側：管道 + 節點格 + 日誌 ════ */}
        <section className="bd-panel bd-right">

          {/* ── AI 自動化維修控制台 (加強功能) ── */}
          <div className="rs-block glass metalCard depthCard" style={{
            background: 'linear-gradient(145deg, rgba(0,229,200,0.06), rgba(124,77,255,0.03))',
            border: '1px solid rgba(0,229,200,0.22)',
            boxShadow: '0 12px 40px rgba(0,0,0,.6)',
            padding: '16px', borderRadius: 16, marginBottom: 16,
            transformStyle: 'preserve-3d', transition: 'all .3s ease-out'
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
              <div style={{display:'flex', alignItems:'center', gap:8, fontSize:'14px', fontWeight:900, color:'#00ffd0', letterSpacing:'1.5px', textShadow:'0 0 10px rgba(0,229,200,.4)'}}>
                <span style={{width:8, height:8, borderRadius:'50%', background: isRepairing ? '#ff9800' : '#00e5ff', animation: isRepairing ? 'sentient-pulse 1s ease-in-out infinite' : 'none', boxShadow: `0 0 10px ${isRepairing?'#ff9800':'#00e5ff'}`}} />
                AI 自動維護中樞 (AUTO-REPAIR)
              </div>
              <span style={{fontSize:'12px', color:'#ffd700', fontWeight:900, textShadow:'0 0 8px rgba(255,215,0,.3)'}}>健康度: {healthScore}%</span>
            </div>
            <button 
              onClick={startAutoRepair}
              disabled={isRepairing}
              className="glass"
              style={{
                width: '100%', padding: '12px 18px', borderRadius: 10, border: isRepairing ? '1px solid rgba(255,152,0,0.3)' : '1px solid rgba(0,229,200,0.4)',
                background: isRepairing ? 'rgba(255,152,0,0.15)' : 'rgba(0,229,200,0.15)',
                color: isRepairing ? '#ffb74d' : '#ffffff', fontSize: '13px', fontWeight: 900,
                letterSpacing: '2px', cursor: isRepairing ? 'not-allowed' : 'pointer',
                boxShadow: isRepairing ? 'none' : '0 0 24px rgba(0,229,200,0.25)',
                transition: 'all 0.2s', textShadow: '0 0 8px rgba(0,0,0,.8)'
              }}
            >
              {isRepairing ? "🔧 AUTO-REPAIR IN PROGRESS..." : "⚡ 啟動 AI 自動修護"}
            </button>
          </div>


          {/* 資料管道狀態 */}
          <div className="rs-block">
            <div className="rs-title"><span className="status-dot" /> DATA PIPELINE STATUS</div>
            <div className="pipeline-list">
              {[
                { label: "業績解析層 (Ingestion)",       textId: "pipeIngText",  barId: "pipeIngBar",  init: "94%" },
                { label: "智能審計引擎 (Audit Core)",     textId: "pipeProcText", barId: "pipeProcBar", init: "87%" },
                { label: "派單演算核心 (Dispatch AI)",        textId: "pipeAnaText",  barId: "pipeAnaBar",  init: "91%" },
                { label: "公告封裝群發 (Distribution)", textId: "pipeOutText",  barId: "pipeOutBar",  init: "96%" },
              ].map((p) => (
                <div className="pipe-row" key={p.barId}>
                  <div className="pipe-label">{p.label}</div>
                  <div className="pipe-track-wrap">
                    <div className="pipe-track">
                      <div className="pipe-fill" id={p.barId} style={{ width: p.init }} />
                    </div>
                    <span className="pipe-pct" id={p.textId}>{p.init}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 節點健康格 */}
          <div className="rs-block">
            <div className="rs-title">
              <span className="status-dot dot-green" /> NODE HEALTH GRID
              <span className="rs-badge">2,847 active</span>
            </div>
            <div className="node-grid">
              {statuses.map((s, i) => (
                <div key={i} className={`ng-cell ng-${s}`} />
              ))}
            </div>
            <div className="ng-legend">
              <span><span className="leg-dot ok" />  Online</span>
              <span><span className="leg-dot warn" /> Warning</span>
              <span><span className="leg-dot crit" /> Critical</span>
            </div>
          </div>

          {/* 系統事件日誌 */}
          <div className="rs-block rs-grow">
            <div className="rs-title"><span className="status-dot dot-amber" /> SYSTEM EVENT LOG</div>
            <div className="event-log">
              {log.map((entry, i) => (
                <div key={i} className={`log-row${i === 0 ? " log-new" : ""}`}>
                  <span className="log-ts">{entry.ts}</span>
                  <span className="log-msg">{entry.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>

      {/* 虛空記錄導入終端 */}
      {showVoid && (
        <DataVoidInput 
          tier="high" 
          onClose={() => setShowVoid(false)} 
          onUpdate={(rows) => {
            const sum = rows.reduce((s, r) => s + r.amount, 0);
            setTotalRevenue(p => p + sum);
            setLog(prev => [
              { ts: new Date().toLocaleTimeString('zh-TW',{hour12:false}), msg: `虛空導入：${rows.length} 筆節點業績，合計 $${sum.toLocaleString()} 同步至數據心臟 ✅` },
              ...prev.slice(0, 10)
            ]);
            setTimeout(() => setShowVoid(false), 2400);
          }}
        />
      )}
    </div>
  );
}
