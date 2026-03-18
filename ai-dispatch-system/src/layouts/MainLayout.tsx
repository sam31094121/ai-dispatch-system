import { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 取得保留中心設定 } from '../服務/系統自動維修服務';
import { GROUP_ELEMENT, EMPEROR_UI } from '../constants/wuxingColors';

const SIDEBAR_WIDTH = 272;

const NAV_GROUPS = [
  { groupName: '主選單',      icon: '📊', centerKeys: ['老闆總控台','業績輸入與智能審計中心','主管派單台','員工個人頁','AI行銷建議','療癒金流'] },
  { groupName: '高價成交爆發', icon: '⚔️', centerKeys: ['高價總控台','高價個人頁','話術素材庫','攻單名單','高價訓練','團隊喊話'] },
  { groupName: '女聲智慧播報', icon: '🎙️', centerKeys: ['播報總控台','播報稿管理','播報風格','播放控制'] },
  { groupName: 'LINE群組轉傳', icon: '💬', centerKeys: ['LINE轉傳台','轉傳規則'] },
  { groupName: '系統管理',    icon: '⚙️', centerKeys: ['招聘管理','訓練管理','系統設定中心'] },
];

// 每個頂部狀態標籤對應的功能路徑
const STATUS_TAGS = [
  { label: 'AI',  desc: 'AI引擎',  color: '#00D4FF', bg: 'rgba(0,212,255,.12)', path: '/workbench',   pulse: true },
  { label: '即時', desc: '數據流',  color: '#00FF9C', bg: 'rgba(0,255,156,.12)', path: '/workbench',   pulse: false },
  { label: '派單', desc: '排名派單', color: '#8B5CF6', bg: 'rgba(139,92,246,.12)', path: '/ranking',  pulse: false },
  { label: '審計', desc: '智能審計', color: '#FFD700', bg: 'rgba(255,215,0,.12)', path: '/audit',      pulse: false },
  { label: 'LIVE', desc: '直播狀態', color: '#FF4D85', bg: 'rgba(255,77,133,.12)', path: '/dashboard', pulse: true },
];

// CSS 注入 singleton
let _mlInjected = false;
function injectMainStyles() {
  if (_mlInjected || typeof document === 'undefined') return;
  _mlInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes ml-pulse   { 0%,100%{opacity:.6;transform:scale(1)}   50%{opacity:1;transform:scale(1.05)} }
    @keyframes ml-dot     { 0%,100%{box-shadow:0 0 4px #00D4FF,0 0 10px rgba(0,212,255,.5)} 50%{box-shadow:0 0 8px #00D4FF,0 0 20px rgba(0,212,255,.9)} }
    @keyframes ml-scan    { 0%{left:-60%} 100%{left:110%} }
    @keyframes ml-brand   { 0%,100%{text-shadow:0 0 14px rgba(0,229,200,.5),0 0 28px rgba(0,212,255,.3)} 50%{text-shadow:0 0 22px rgba(0,229,200,.85),0 0 44px rgba(0,212,255,.5)} }
    @keyframes ml-live    { 0%,100%{opacity:.85} 50%{opacity:1} }
    @keyframes ml-modcount{ 0%{transform:scale(.7);opacity:0} 100%{transform:scale(1);opacity:1} }
    .ml-tag:hover   { filter:brightness(1.3)!important; transform:translateY(-1px) scale(1.04)!important; }
    .ml-group:hover { background:rgba(0,212,255,.04)!important; }
    .ml-link:hover  { transform:translateX(2px)!important; }
    .ml-gfooter { animation: ml-live 3s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

export function MainLayout() {
  injectMainStyles();
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => new Date());
  const [isAiOptimized, setIsAiOptimized] = useState(false); // 🔱 新增全局優化狀態

  // 每秒更新時間（LIVE 意境）
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function toggleGroup(groupName: string) {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  const activeCenters = useMemo(() => 取得保留中心設定(), []);
  const activeCenterKeys = useMemo(() => new Set(activeCenters.map(c => c.代碼)), [activeCenters]);

  const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', weekday: 'short' });

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: EMPEROR_UI.pageBg,
      fontFamily: 'system-ui, -apple-system, "Microsoft JhengHei", "Noto Serif TC", sans-serif',
    }}>

      {/* ════ 左側固定導覽列 ════ */}
      <aside style={{
        width: isAiOptimized ? 0 : SIDEBAR_WIDTH,
        overflow: isAiOptimized ? 'hidden' : 'auto',
        background: `linear-gradient(180deg, rgba(3,5,12,.82) 0%, rgba(6,10,20,.86) 55%, rgba(4,7,15,.92) 100%)`,
        display: 'flex', flexDirection: 'column',
        boxShadow: isAiOptimized ? 'none' : `20px 0 80px rgba(0,0,0,.85), inset -1px 0 0 rgba(0,212,255,.18)`,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        borderRight: isAiOptimized ? 'none' : '1px solid rgba(0,229,200,.2)',
        transition: 'width 0.3s ease, box-shadow 0.3s ease',
        minWidth: 0,
      }}>

        {/* ── 品牌區 ── */}
        <div style={{
          padding: '12px 16px 10px',
          borderBottom: `1px solid rgba(0,212,255,.16)`,
          background: `linear-gradient(135deg, rgba(3,5,12,.7) 0%, rgba(7,12,24,.5) 100%)`,
          flexShrink: 0, position: 'relative', overflow: 'hidden',
        }}>
          {/* 背景電漿暈 */}
          <div style={{ position:'absolute', top:-28, right:-28, width:120, height:120, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,229,200,.2) 0%, transparent 70%)', filter:'blur(20px)', pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:-20, left:-20, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 70%)', filter:'blur(18px)', pointerEvents:'none' }} />

          {/* 品牌名稱 + 即時時鐘 */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:3 }}>
            <div style={{
              fontSize: 16, fontWeight: 900, letterSpacing: '0.05em',
              animation: 'ml-brand 3s ease-in-out infinite',
              color: '#7DF9FF',
            }}>
              ⚡ 兆櫃AI派單
            </div>
            {/* 即時時鐘 — LIVE 意境功能字 */}
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:900, color:'#00FF9C', fontFamily:'monospace', letterSpacing:'.05em', lineHeight:1 }}>{timeStr}</div>
              <div style={{ fontSize:9, color:'rgba(0,255,156,.55)', letterSpacing:'.06em', marginTop:1 }}>{dateStr}</div>
            </div>
          </div>

          {/* 副標 */}
          <div style={{ fontSize:9, color:'#7DF9FF', letterSpacing:'0.12em', display:'flex', alignItems:'center', gap:5, marginBottom:7 }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#00D4FF', animation:'ml-dot 2s ease-in-out infinite', flexShrink:0 }} />
            全球大數據 AI 派單中樞
          </div>

          {/* 功能狀態標籤 — 每個都可點擊跳轉 */}
          <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
            {STATUS_TAGS.map(({ label, desc, color, bg, path, pulse }) => (
              <Link
                key={label}
                to={path}
                title={desc}
                className="ml-tag"
                style={{
                  fontSize: 9, padding: '3px 7px', borderRadius: 5,
                  background: bg, color: color,
                  border: `1px solid ${color}44`, fontWeight: 900,
                  letterSpacing: '0.08em', lineHeight: 1.5,
                  textShadow: `0 0 8px ${color}88`,
                  textDecoration: 'none', display: 'inline-block',
                  animation: pulse ? 'ml-pulse 2.5s ease-in-out infinite' : 'none',
                  cursor: 'pointer', transition: 'all .15s',
                  transform: 'translateY(0) scale(1)',
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── 導覽群組 ── */}
        <nav style={{ padding: '8px 8px', flex: 1 }}>
          {NAV_GROUPS.map(group => {
            const validCenterKeys = group.centerKeys.filter(k => activeCenterKeys.has(k as any));
            if (validCenterKeys.length === 0) return null;

            const el = GROUP_ELEMENT[group.groupName];
            const accent = el?.bright ?? EMPEROR_UI.brandGold;
            const isCollapsed = collapsedGroups[group.groupName] ?? false;
            const modulesInGroup = activeCenters
              .filter(m => validCenterKeys.includes(m.代碼))
              .sort((a, b) => a.顯示順序 - b.顯示順序);
            const isGroupActive = modulesInGroup.some(m => location.pathname === m.路徑);
            const modCount = modulesInGroup.length;

            return (
              <div key={group.groupName} style={{ marginBottom: 2 }}>
                {/* 群組標題 — 含模組數量徽章 */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupName)}
                  className="ml-group"
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '5px 10px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isGroupActive
                      ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, transparent)`
                      : 'transparent',
                    color: isGroupActive ? accent : EMPEROR_UI.textMuted,
                    fontWeight: 800, fontSize: 11, letterSpacing: '0.08em',
                    transition: 'all 0.2s',
                    borderLeft: isGroupActive ? `2px solid ${accent}` : '2px solid transparent',
                  }}
                  onMouseOver={e => {
                    if (!isGroupActive) {
                      e.currentTarget.style.color = accent;
                      e.currentTarget.style.borderLeft = `2px solid ${accent}66`;
                    }
                  }}
                  onMouseOut={e => {
                    if (!isGroupActive) {
                      e.currentTarget.style.color = EMPEROR_UI.textMuted;
                      e.currentTarget.style.borderLeft = '2px solid transparent';
                    }
                  }}
                >
                  <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {/* 群組圖示 */}
                    <span style={{ fontSize: 13 }}>{group.icon}</span>
                    {/* 群組名稱 */}
                    <span style={{ fontSize: 11 }}>{group.groupName}</span>
                    {/* 五行元素標籤 */}
                    {el && (
                      <span style={{
                        fontSize: 9, padding: '1px 5px', borderRadius: 4,
                        background: el.void, color: el.bright,
                        border: `1px solid ${el.shadow}`, fontWeight: 900,
                        letterSpacing: '0.04em', flexShrink: 0,
                      }}>
                        {el.element}
                      </span>
                    )}
                    {/* 模組數量 — 功能數字 */}
                    <span style={{
                      fontSize: 9, padding: '0 5px', borderRadius: 10,
                      background: isGroupActive ? `${accent}22` : 'rgba(255,255,255,.06)',
                      color: isGroupActive ? accent : EMPEROR_UI.textDim,
                      border: `1px solid ${isGroupActive ? accent + '44' : 'rgba(255,255,255,.08)'}`,
                      fontWeight: 900, fontFamily: 'monospace', flexShrink: 0,
                      lineHeight: '16px', minWidth: 16, textAlign: 'center',
                    }}>
                      {modCount}
                    </span>
                  </span>
                  {/* 展開箭頭 */}
                  <span style={{
                    fontSize: 10, color: EMPEROR_UI.textDim,
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s', display: 'inline-block', flexShrink: 0,
                  }}>▾</span>
                </button>

                {/* 群組內導覽連結 */}
                {!isCollapsed && (
                  <div style={{ paddingLeft: 6, marginTop: 1, display:'flex', flexDirection:'column', gap: 1 }}>
                    {modulesInGroup.map((mod, idx) => {
                      const isActive = location.pathname === mod.路徑;
                      return (
                        <Link
                          key={mod.代碼}
                          to={mod.路徑}
                          className="ml-link"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            padding: '5px 10px', borderRadius: 7,
                            textDecoration: 'none',
                            color: isActive ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted,
                            background: isActive
                              ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, ${el?.shadow ?? EMPEROR_UI.borderMain} 80%, transparent)`
                              : 'transparent',
                            fontWeight: isActive ? 800 : 500, fontSize: 12,
                            transition: 'all 0.15s',
                            borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                            boxShadow: isActive ? `inset 0 0 16px ${el?.core ?? EMPEROR_UI.borderMain}44` : 'none',
                            transform: 'translateX(0)',
                          }}
                          onMouseOver={e => {
                            if (!isActive) {
                              e.currentTarget.style.color = el?.text ?? EMPEROR_UI.textSecondary;
                              e.currentTarget.style.background = el?.void ?? EMPEROR_UI.cardBg;
                              e.currentTarget.style.borderLeft = `3px solid ${el?.core ?? EMPEROR_UI.borderAccent}`;
                            }
                          }}
                          onMouseOut={e => {
                            if (!isActive) {
                              e.currentTarget.style.color = EMPEROR_UI.textMuted;
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderLeft = '3px solid transparent';
                            }
                          }}
                        >
                          {/* 序號 + 狀態點 */}
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
                          }}>
                            <span style={{
                              fontSize: 8, color: isActive ? accent : EMPEROR_UI.textDim,
                              fontFamily: 'monospace', fontWeight: 700, opacity: .7,
                            }}>{String(idx + 1).padStart(2, '0')}</span>
                            <span style={{
                              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
                              background: isActive ? accent : EMPEROR_UI.borderAccent,
                              boxShadow: isActive ? `0 0 6px ${accent}, 0 0 14px ${accent}55` : 'none',
                              transition: 'all 0.2s',
                            }} />
                          </span>
                          {/* 模組名稱 */}
                          <span style={{ flex: 1, fontSize: 12 }}>{mod.名稱}</span>
                          {/* 活躍時顯示 ACTIVE 指示 */}
                          {isActive && (
                            <span style={{
                              fontSize: 8, padding: '1px 5px', borderRadius: 3,
                              background: `${accent}22`, color: accent,
                              border: `1px solid ${accent}44`, fontWeight: 900,
                              letterSpacing: '.05em', flexShrink: 0,
                              animation: 'ml-live 2s ease-in-out infinite',
                            }}>ON</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── 頁尾：系統狀態 ── */}
        <div style={{
          padding: '10px 12px 6px',
          borderTop: `1px solid ${isAiOptimized ? '#00FF9C' : 'rgba(0,212,255,.12)'}`,
          background: isAiOptimized ? 'rgba(0, 255, 156, 0.03)' : 'transparent',
          flexShrink: 0,
          transition: 'all 0.3s'
        }}>
          {/* 🔱 啟動優化核心按鈕 (字體意境+功能) */}
          <button 
            onClick={() => setIsAiOptimized(!isAiOptimized)}
            style={{
              width: '100%', padding: '7px', borderRadius: 8, marginBottom: 8,
              background: isAiOptimized ? 'rgba(0, 255, 156, 0.08)' : 'rgba(0, 212, 255, 0.04)',
              border: `1px solid ${isAiOptimized ? '#00FF9C' : '#00D4FF44'}`,
              color: isAiOptimized ? '#00FF9C' : '#00D4FF',
              fontSize: 11, fontWeight: 900, cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: isAiOptimized ? '0 0 10px rgba(0,255,156,0.3)' : 'none',
              fontFamily: '"Microsoft JhengHei", sans-serif'
            }}
          >
            <span style={{ fontSize: 13 }}>{isAiOptimized ? '🔋' : '⚡'}</span> 
            {isAiOptimized ? 'AI 全域優化已啟動' : '啟動 AI 全域優化'}
          </button>

          {/* 系統狀態列 */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background: isAiOptimized ? '#00FF9C' : '#00FF9C', boxShadow: `0 0 6px ${isAiOptimized ? '#00FF9C' : '#00FF9C'}`, display:'inline-block', animation:'ml-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize:9, color: isAiOptimized ? '#00FF9C' : '#00FF9C', fontWeight:700, letterSpacing:'.06em' }}>系統運行中</span>
            </div>
            <span style={{ fontSize:9, color:EMPEROR_UI.textDim, fontFamily:'monospace' }}>
              {isAiOptimized ? 'MODE: 100vh' : `${activeCenters.length} 模組`}
            </span>
          </div>
          <div className="ml-gfooter" style={{ fontSize:8, color:EMPEROR_UI.textDim, letterSpacing:'.1em', textAlign:'center', textShadow: isAiOptimized ? '0 0 4px #00FF9C44' : 'none' }}>
            {isAiOptimized ? '◈ 空間鎖死概念 0 浪費運作中' : '© 兆櫃AI 數據中樞'}
          </div>
        </div>
      </aside>

      {/* ════ 右側主內容區 ════ */}
      <main style={{
        flex: 1,
        marginLeft: isAiOptimized ? 0 : SIDEBAR_WIDTH,
        display: 'flex', flexDirection: 'column', minWidth: 0,
        background: EMPEROR_UI.pageBg,
        transition: 'margin-left 0.3s ease',
      }}>
        {/* 優化模式：頂部返回欄 */}
        {isAiOptimized && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 16px', flexShrink: 0,
            background: 'rgba(0,255,156,.04)',
            borderBottom: '1px solid rgba(0,255,156,.15)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#00FF9C', boxShadow:'0 0 8px #00FF9C', display:'inline-block', animation:'ml-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:900, color:'#00FF9C', letterSpacing:'.1em', fontFamily:'monospace' }}>◈ 全幅模式 · 空間鎖死 · 零浪費</span>
            </div>
            <button
              onClick={() => setIsAiOptimized(false)}
              style={{ fontSize:10, color:'rgba(0,255,156,.6)', background:'none', border:'1px solid rgba(0,255,156,.2)', borderRadius:5, padding:'2px 10px', cursor:'pointer', fontWeight:700, letterSpacing:'.06em' }}
            >
              ✕ 退出全幅
            </button>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
