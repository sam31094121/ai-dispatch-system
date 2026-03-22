import { useState, useMemo, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 取得保留中心設定 } from '../服務/系統自動維修服務';
import { GROUP_ELEMENT, EMPEROR_UI, UI } from '../constants/wuxingColors';

const SIDEBAR_WIDTH = 256;

// 核心頁面（固定，不依賴後端設定）
const CORE_LINKS = [
  { icon: '🔮', label: 'AI 派單工作台', path: '/',          color: '#00D4FF' },
  { icon: '🎯', label: '戰力雷達分析',  path: '/ranking',   color: '#c084fc' },
  { icon: '📋', label: 'AI 派單報表',   path: '/report',    color: '#00FF9C' },
  { icon: '📊', label: '老闆視覺總控台', path: '/dashboard', color: '#00FF9C' },
];

const NAV_GROUPS = [
  { groupName: '主選單',      icon: '📊', centerKeys: ['老闆總控台','業績輸入與智能審計中心','主管派單台','員工個人頁','AI行銷建議','療癒金流'] },
  { groupName: '高價成交爆發', icon: '⚔️', centerKeys: ['高價總控台','高價個人頁','話術素材庫','攻單名單','高價訓練','團隊喊話'] },
  { groupName: '女聲智慧播報', icon: '🎙️', centerKeys: ['播報總控台','播報稿管理','播報風格','播放控制'] },
  { groupName: 'LINE群組轉傳', icon: '💬', centerKeys: ['LINE轉傳台','轉傳規則'] },
  { groupName: '系統管理',    icon: '⚙️', centerKeys: ['招聘管理','訓練管理','系統設定中心'] },
];

// CSS singleton
let _mlInjected = false;
function injectMainStyles() {
  if (_mlInjected || typeof document === 'undefined') return;
  _mlInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes ml-pulse  { 0%,100%{opacity:.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
    @keyframes ml-dot    { 0%,100%{box-shadow:0 0 4px #00D4FF,0 0 10px rgba(0,212,255,.5)} 50%{box-shadow:0 0 8px #00D4FF,0 0 20px rgba(0,212,255,.9)} }
    @keyframes ml-brand  { 0%,100%{text-shadow:0 0 14px rgba(0,229,200,.5),0 0 28px rgba(0,212,255,.3)} 50%{text-shadow:0 0 22px rgba(0,229,200,.85),0 0 44px rgba(0,212,255,.5)} }
    @keyframes ml-live   { 0%,100%{opacity:.85} 50%{opacity:1} }
    @keyframes ml-pageIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ml-sideGlow { 0%,100%{box-shadow:inset -1px 0 0 rgba(0,212,255,.18)} 50%{box-shadow:inset -1px 0 0 rgba(0,212,255,.35), 8px 0 30px rgba(0,212,255,.04)} }
    @keyframes ml-linkSlide { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
    .ml-group:hover{ background:rgba(0,212,255,.06)!important; border-left-color:rgba(0,212,255,.3)!important; }
    .ml-link:hover { transform:translateX(3px)!important; background:rgba(0,212,255,.04)!important; }
    .ml-link:active{ transform:translateX(1px) scale(0.98)!important; }
    .ml-gfooter    { animation: ml-live 3s ease-in-out infinite; }
    .ml-page-enter { animation: ml-pageIn 0.3s ease-out both; }
  `;
  document.head.appendChild(s);
}

export function MainLayout() {
  injectMainStyles();
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [now, setNow] = useState(() => new Date());
  const [isAiOptimized, setIsAiOptimized] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  function toggleGroup(groupName: string) {
    setCollapsedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  const activeCenters    = useMemo(() => 取得保留中心設定(), []);
  const activeCenterKeys = useMemo(() => new Set(activeCenters.map(c => c.代碼)), [activeCenters]);

  const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit', weekday: 'short' });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: EMPEROR_UI.pageBg, fontFamily: UI.font }}>

      {/* ════ 左側固定導覽列 ════ */}
      <aside style={{
        width: isAiOptimized ? 0 : SIDEBAR_WIDTH,
        overflow: isAiOptimized ? 'hidden' : 'auto',
        background: `linear-gradient(180deg, rgba(3,5,12,.92) 0%, rgba(4,8,18,.95) 50%, rgba(3,5,12,.97) 100%)`,
        backdropFilter: 'blur(32px) saturate(200%)',
        display: 'flex', flexDirection: 'column',
        boxShadow: isAiOptimized ? 'none' : `20px 0 80px rgba(0,0,0,.9), 4px 0 30px rgba(0,0,0,.5), inset -1px 0 0 rgba(0,212,255,.15)`,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50,
        borderRight: isAiOptimized ? 'none' : '1px solid rgba(0,212,255,.12)',
        transition: 'width 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s ease, opacity 0.3s',
        animation: isAiOptimized ? 'none' : 'ml-sideGlow 6s ease-in-out infinite',
        minWidth: 0,
      }}>

        {/* ── 品牌區 ── */}
        <div style={{
          padding: '14px 14px 12px',
          borderBottom: `1px solid rgba(0,212,255,.12)`,
          background: `linear-gradient(135deg, rgba(0,212,255,0.03) 0%, rgba(3,5,12,.6) 50%, rgba(139,92,246,0.02) 100%)`,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4 }}>
            <div style={{ fontSize:15, fontWeight:900, letterSpacing:'.05em', animation:'ml-brand 3s ease-in-out infinite', color:'#7DF9FF' }}>
              ⚡ 兆櫃AI派單
            </div>
            <div style={{ textAlign:'right', flexShrink:0 }}>
              <div style={{ fontSize:12, fontWeight:900, color:'#00FF9C', fontFamily:'monospace', letterSpacing:'.05em', lineHeight:1 }}>{timeStr}</div>
              <div style={{ fontSize:8, color:'rgba(0,255,156,.5)', letterSpacing:'.06em', marginTop:1 }}>{dateStr}</div>
            </div>
          </div>
          <div style={{ fontSize:8, color:'rgba(0,212,255,.65)', letterSpacing:'.1em', display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'#00D4FF', animation:'ml-dot 2s ease-in-out infinite', flexShrink:0 }} />
            AI 派單中樞 · {activeCenters.length} 模組
          </div>
        </div>

        {/* ── 統一導覽（核心頁面 + 模組群組 合一）── */}
        <nav style={{ padding:'8px', flex:1, overflow:'auto' }}>

          {/* 核心功能 */}
          <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:6 }}>
            {CORE_LINKS.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path} to={link.path} className="ml-link"
                  style={{
                    display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:7,
                    background: isActive ? `linear-gradient(90deg, ${link.color}18, transparent)` : 'transparent',
                    border: isActive ? `1px solid ${link.color}44` : '1px solid transparent',
                    color: isActive ? link.color : EMPEROR_UI.textMuted,
                    textDecoration:'none', fontWeight: isActive ? 900 : 600, fontSize:12,
                    transition:'all .2s',
                    borderLeft: isActive ? `3px solid ${link.color}` : '3px solid transparent',
                    boxShadow: isActive ? `0 0 16px ${link.color}22, inset 0 0 12px ${link.color}08` : 'none',
                  }}
                >
                  <span style={{ fontSize:13 }}>{link.icon}</span>
                  <span style={{ flex:1 }}>{link.label}</span>
                  {isActive && (
                    <span style={{ fontSize:7, padding:'1px 5px', borderRadius:3, background:`${link.color}22`, color:link.color, border:`1px solid ${link.color}44`, fontWeight:900, animation:'ml-live 2s infinite' }}>●</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div style={{ height:1, background:'rgba(0,212,255,.1)', margin:'2px 8px 6px' }} />

          {/* 模組群組 */}
          {(() => {
            const AGGREGATE_GROUPS: Record<string, string> = {
              '高價成交爆發': '/hv',
              '女聲智慧播報': '/bc',
              'LINE群組轉傳': '/line',
            };

            return NAV_GROUPS.map(group => {
              const validCenterKeys = group.centerKeys.filter(k => activeCenterKeys.has(k as any));
              if (!validCenterKeys.length) return null;
              const el          = GROUP_ELEMENT[group.groupName];
              const accent      = el?.bright ?? EMPEROR_UI.brandGold;
              const isCollapsed = collapsedGroups[group.groupName] ?? false;
              const modulesInGroup = activeCenters.filter(m => validCenterKeys.includes(m.代碼)).sort((a, b) => a.顯示順序 - b.顯示順序);
              const aggPath     = AGGREGATE_GROUPS[group.groupName];
              const isGroupActive  = aggPath ? location.pathname === aggPath : modulesInGroup.some(m => location.pathname === m.路徑);
              const modCount       = modulesInGroup.length;

              const style: React.CSSProperties = {
                width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'5px 10px', borderRadius:7, border:'none', cursor:'pointer',
                background: isGroupActive ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, transparent)` : 'transparent',
                color: isGroupActive ? accent : EMPEROR_UI.textMuted,
                fontWeight:800, fontSize:11, letterSpacing:'.06em', transition:'all .2s',
                borderLeft: isGroupActive ? `2px solid ${accent}` : '2px solid transparent',
                textDecoration: 'none',
              };

              const content = (
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ fontSize:12 }}>{group.icon}</span>
                  <span>{group.groupName}</span>
                  {el && (
                    <span style={{ fontSize:8, padding:'1px 5px', borderRadius:4, background:el.void, color:el.bright, border:`1px solid ${el.shadow}`, fontWeight:900, letterSpacing:'.04em' }}>
                      {el.element}
                    </span>
                  )}
                  {!aggPath && (
                    <span style={{ fontSize:8, padding:'0 5px', borderRadius:10, background: isGroupActive ? `${accent}22` : 'rgba(255,255,255,.05)', color: isGroupActive ? accent : EMPEROR_UI.textDim, border:`1px solid ${isGroupActive ? accent + '44' : 'rgba(255,255,255,.08)'}`, fontWeight:900, fontFamily:'monospace', lineHeight:'16px', minWidth:16, textAlign:'center' }}>
                      {modCount}
                    </span>
                  )}
                </span>
              );

              return (
                <div key={group.groupName} style={{ marginBottom:2 }}>
                  {aggPath ? (
                    <Link
                      to={aggPath}
                      className="ml-group"
                      style={style}
                      onMouseOver={e => { if (!isGroupActive) { e.currentTarget.style.color = accent; e.currentTarget.style.borderLeft = `2px solid ${accent}55`; } }}
                      onMouseOut={e => { if (!isGroupActive) { e.currentTarget.style.color = EMPEROR_UI.textMuted; e.currentTarget.style.borderLeft = '2px solid transparent'; } }}
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.groupName)}
                      className="ml-group"
                      style={style}
                      onMouseOver={e => { if (!isGroupActive) { e.currentTarget.style.color = accent; e.currentTarget.style.borderLeft = `2px solid ${accent}55`; } }}
                      onMouseOut={e => { if (!isGroupActive) { e.currentTarget.style.color = EMPEROR_UI.textMuted; e.currentTarget.style.borderLeft = '2px solid transparent'; } }}
                    >
                      {content}
                      <span style={{ fontSize:9, color:EMPEROR_UI.textDim, transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition:'transform .2s', display:'inline-block' }}>▾</span>
                    </button>
                  )}

                  {!aggPath && !isCollapsed && (
                    <div style={{ paddingLeft:6, marginTop:1, display:'flex', flexDirection:'column', gap:1, overflow:'hidden' }}>
                      {modulesInGroup.map((mod, idx) => {
                        const isActive = location.pathname === mod.路徑;
                        return (
                          <Link
                            key={mod.代碼} to={mod.路徑} className="ml-link"
                            style={{
                              animation: `ml-linkSlide 0.2s ease-out ${idx * 0.04}s both`,
                              display:'flex', alignItems:'center', gap:6,
                              padding:'5px 10px', borderRadius:6, textDecoration:'none',
                              color: isActive ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted,
                              background: isActive ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, transparent)` : 'transparent',
                              fontWeight: isActive ? 800 : 500, fontSize:12, transition:'all .15s',
                              borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                              boxShadow: isActive ? `inset 0 0 14px ${el?.core ?? EMPEROR_UI.borderMain}44` : 'none',
                            }}
                            onMouseOver={e => { if (!isActive) { e.currentTarget.style.color = el?.text ?? EMPEROR_UI.textSecondary; e.currentTarget.style.background = el?.void ?? EMPEROR_UI.cardBg; e.currentTarget.style.borderLeft = `3px solid ${el?.core ?? EMPEROR_UI.borderAccent}`; } }}
                            onMouseOut={e => { if (!isActive) { e.currentTarget.style.color = EMPEROR_UI.textMuted; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderLeft = '3px solid transparent'; } }}
                          >
                            <span style={{ display:'flex', alignItems:'center', gap:3, flexShrink:0 }}>
                              <span style={{ fontSize:7, color: isActive ? accent : EMPEROR_UI.textDim, fontFamily:'monospace', fontWeight:700, opacity:.7 }}>{String(idx + 1).padStart(2, '0')}</span>
                              <span style={{ width:5, height:5, borderRadius:'50%', background: isActive ? accent : EMPEROR_UI.borderAccent, boxShadow: isActive ? `0 0 6px ${accent}, 0 0 12px ${accent}55` : 'none', transition:'all .2s', flexShrink:0 }} />
                            </span>
                            <span style={{ flex:1 }}>{mod.名稱}</span>
                            {isActive && (
                              <span style={{ fontSize:7, padding:'1px 5px', borderRadius:3, background:`${accent}22`, color:accent, border:`1px solid ${accent}44`, fontWeight:900, animation:'ml-live 2s ease-in-out infinite', flexShrink:0 }}>●</span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}

        </nav>

        {/* ── 頁尾 ── */}
        <div style={{
          padding:'10px 12px 8px',
          borderTop:`1px solid ${isAiOptimized ? 'rgba(0,255,156,.2)' : 'rgba(0,212,255,.1)'}`,
          background: isAiOptimized ? 'rgba(0,255,156,.03)' : 'transparent',
          flexShrink:0, transition:'all .3s',
        }}>
          <button
            onClick={() => setIsAiOptimized(!isAiOptimized)}
            style={{
              width:'100%', padding:'7px', borderRadius:7, marginBottom:6,
              background: isAiOptimized ? 'rgba(0,255,156,.08)' : 'rgba(0,212,255,.04)',
              border:`1px solid ${isAiOptimized ? '#00FF9C55' : '#00D4FF33'}`,
              color: isAiOptimized ? '#00FF9C' : '#00D4FF',
              fontSize:11, fontWeight:900, cursor:'pointer', transition:'all .2s',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              boxShadow: isAiOptimized ? '0 0 14px rgba(0,255,156,.3), inset 0 0 8px rgba(0,255,156,.08)' : 'none',
              animation: isAiOptimized ? 'ml-pulse 2.5s ease-in-out infinite' : 'none',
            }}
          >
            <span style={{ fontSize:12, transition:'transform .3s', transform: isAiOptimized ? 'rotate(360deg)' : 'none' }}>{isAiOptimized ? '🔋' : '⚡'}</span>
            {isAiOptimized ? '已啟動全幅模式' : '啟動全幅模式'}
          </button>

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:4, alignItems:'center' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#00FF9C', boxShadow:'0 0 6px #00FF9C', display:'inline-block', animation:'ml-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize:8, color:'#00FF9C', fontWeight:700, letterSpacing:'.06em' }}>系統運行中</span>
            </div>
          </div>
          <div className="ml-gfooter" style={{ fontSize:7, color:EMPEROR_UI.textDim, letterSpacing:'.08em', textAlign:'center', marginTop:4 }}>
            © 兆櫃AI 數據中樞
          </div>
        </div>
      </aside>

      {/* ════ 右側主內容區 ════ */}
      <main style={{
        flex:1, marginLeft: isAiOptimized ? 0 : SIDEBAR_WIDTH,
        display:'flex', flexDirection:'column', minWidth:0,
        background:EMPEROR_UI.pageBg, transition:'margin-left .3s ease',
      }}>
        {isAiOptimized && (
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'5px 16px', flexShrink:0,
            background:'rgba(0,255,156,.04)', borderBottom:'1px solid rgba(0,255,156,.14)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#00FF9C', boxShadow:'0 0 8px #00FF9C', display:'inline-block', animation:'ml-dot 2s ease-in-out infinite' }} />
              <span style={{ fontSize:10, fontWeight:900, color:'#00FF9C', letterSpacing:'.08em' }}>全幅模式</span>
            </div>
            <button onClick={() => setIsAiOptimized(false)} style={{ fontSize:10, color:'rgba(0,255,156,.6)', background:'none', border:'1px solid rgba(0,255,156,.2)', borderRadius:5, padding:'2px 10px', cursor:'pointer', fontWeight:700 }}>
              ✕ 退出
            </button>
          </div>
        )}
        <div key={location.pathname} className="ml-page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
