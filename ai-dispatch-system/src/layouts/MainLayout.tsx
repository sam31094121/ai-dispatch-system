import React, { useState, useMemo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 取得保留中心設定 } from '../服務/系統自動維修服務';
import { GROUP_ELEMENT, EMPEROR_UI, EMPEROR } from '../constants/wuxingColors';

const SIDEBAR_WIDTH = 288;

export function MainLayout() {
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupName: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  const activeCenters = useMemo(() => 取得保留中心設定(), []);

  return (
    <div style={{
      display: 'flex', minHeight: '100vh',
      background: EMPEROR_UI.pageBg,
      fontFamily: 'system-ui, -apple-system, "Microsoft JhengHei", "Noto Serif TC", sans-serif',
    }}>

      {/* ════ 左側固定導覽列（帝王黑金底）════ */}
      <aside style={{
        width: SIDEBAR_WIDTH,
        background: `linear-gradient(180deg, ${EMPEROR.obsidian} 0%, ${EMPEROR.obsidianSurf} 55%, ${EMPEROR.warmBlack} 100%)`,
        display: 'flex', flexDirection: 'column',
        boxShadow: `4px 0 40px rgba(0,0,0,0.9), inset -1px 0 0 ${EMPEROR_UI.borderAccent}`,
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, overflowY: 'auto',
      }}>

        {/* ── 品牌標題（帝王濃金）── */}
        <div style={{
          padding: '20px 18px 16px',
          borderBottom: `1px solid ${EMPEROR_UI.borderAccent}`,
          background: `linear-gradient(135deg, ${EMPEROR.obsidian} 0%, ${EMPEROR.warmBlack} 100%)`,
          flexShrink: 0,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* 背景金光暈 */}
          <div style={{
            position: 'absolute', top: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: EMPEROR.imperialGold, opacity: 0.06, filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />
          {/* 發財符號水印 */}
          <div style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            fontSize: 44, opacity: 0.05, pointerEvents: 'none', userSelect: 'none',
          }}>💰</div>

          {/* 品牌名稱 */}
          <div style={{
            fontSize: 17, fontWeight: 900, letterSpacing: '0.05em', position: 'relative',
            background: `linear-gradient(135deg, ${EMPEROR_UI.brandGold} 0%, ${EMPEROR_UI.brandGlow} 50%, ${EMPEROR_UI.brandGold} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            💎 兆櫃 AI 派工系統
          </div>

          {/* 副標題 */}
          <div style={{
            fontSize: 11, marginTop: 6, fontWeight: 600,
            color: EMPEROR_UI.textMuted, letterSpacing: '0.08em',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: EMPEROR_UI.brandGold,
              boxShadow: `0 0 8px ${EMPEROR_UI.brandGold}, 0 0 16px ${EMPEROR_UI.brandGold}44`,
            }} />
            每日業績樞紐 V2
          </div>

          {/* 五行元素標籤 */}
          <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
            {[
              { label: '土', color: EMPEROR.imperialGold },
              { label: '木', color: EMPEROR.imperialGreen },
              { label: '火', color: EMPEROR.flameAmber },
              { label: '金', color: EMPEROR.glazedGold },
              { label: '水', color: EMPEROR.deepGold },
            ].map(({ label, color }) => (
              <span key={label} style={{
                fontSize: 9, padding: '2px 6px', borderRadius: 5,
                background: EMPEROR_UI.cardBg, color: color,
                border: `1px solid ${color}33`, fontWeight: 900,
                letterSpacing: '0.05em', lineHeight: 1.4,
              }}>{label}</span>
            ))}
          </div>
        </div>

          {/* ── 導覽群組 ── */}
          <nav style={{ padding: '12px 10px', flex: 1 }}>
            {/* 固定的導覽群組，取代原本的 NAV_GROUPS */}
            {[
              {
                groupName: '主選單',
                icon: '📊',
                centerKeys: ['老闆總控台', '業績輸入與智能審計中心', '主管派單台', '員工個人頁', 'AI行銷建議'],
              },
              {
                groupName: '高價成交爆發',
                icon: '⚔️',
                centerKeys: ['高價總控台', '高價個人頁', '話術素材庫', '攻單名單', '高價訓練', '團隊喊話'],
              },
              {
                groupName: '女聲智慧播報',
                icon: '🎙️',
                centerKeys: ['播報總控台', '播報稿管理', '播報風格', '播放控制'],
              },
              {
                groupName: 'LINE群組轉傳',
                icon: '💬',
                centerKeys: ['LINE轉傳台', '轉傳規則'],
              },
              {
                groupName: '系統管理',
                icon: '⚙️',
                centerKeys: ['招聘管理', '訓練管理', '系統設定中心'],
              },
            ]
            .map((group) => {
              const activeKeys = new Set(activeCenters.map((c) => c.代碼));
              const validCenterKeys = group.centerKeys.filter((k) => activeKeys.has(k as any));
              if (validCenterKeys.length === 0) return null;

              const el = GROUP_ELEMENT[group.groupName];
              const accent = el?.bright ?? EMPEROR_UI.brandGold;
              const isCollapsed = collapsedGroups[group.groupName] ?? false;
              const modulesInGroup = activeCenters
                .filter((m) => validCenterKeys.includes(m.代碼))
                .sort((a, b) => a.顯示順序 - b.顯示順序);
              const isGroupActive = modulesInGroup.some((m) => location.pathname === m.路徑);

            return (
              <div key={group.groupName} style={{ marginBottom: 4 }}>
                {/* 群組標題按鈕 */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupName)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '7px 12px',
                    borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: isGroupActive
                      ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, transparent)`
                      : 'transparent',
                    color: isGroupActive ? accent : EMPEROR_UI.textMuted,
                    fontWeight: 800, fontSize: 11, letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    transition: 'all 0.2s',
                    borderLeft: isGroupActive ? `2px solid ${accent}` : '2px solid transparent',
                  }}
                  onMouseOver={(e) => {
                    if (!isGroupActive) {
                      e.currentTarget.style.background = el?.void ?? EMPEROR_UI.cardBg;
                      e.currentTarget.style.color = accent;
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isGroupActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = EMPEROR_UI.textMuted;
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15 }}>{group.icon}</span>
                    <span style={{ fontSize: 11 }}>{group.groupName}</span>
                    {el && (
                      <span style={{
                        fontSize: 9, padding: '1px 6px', borderRadius: 5,
                        background: el.void, color: el.bright,
                        border: `1px solid ${el.shadow}`, fontWeight: 900,
                        letterSpacing: '0.05em',
                      }}>
                        {el.element}
                      </span>
                    )}
                  </span>
                  <span style={{
                    fontSize: 10, color: EMPEROR_UI.textMuted,
                    transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s', display: 'inline-block',
                  }}>▾</span>
                </button>

                {/* 群組內導覽連結 */}
                {!isCollapsed && (
                  <div style={{ paddingLeft: 8, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {modulesInGroup.map((mod) => {
                      const isActive = location.pathname === mod.路徑;
                      return (
                        <Link
                          key={mod.代碼}
                          to={mod.路徑}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 8,
                            textDecoration: 'none',
                            color: isActive ? EMPEROR_UI.textPrimary : EMPEROR_UI.textMuted,
                            background: isActive
                              ? `linear-gradient(90deg, ${el?.void ?? EMPEROR_UI.cardBg}, ${el?.shadow ?? EMPEROR_UI.borderMain} 80%, transparent)`
                              : 'transparent',
                            fontWeight: isActive ? 800 : 500, fontSize: 13,
                            transition: 'all 0.15s',
                            borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                            boxShadow: isActive ? `inset 0 0 20px ${el?.core ?? EMPEROR_UI.borderMain}44` : 'none',
                            letterSpacing: '0.02em',
                          }}
                          onMouseOver={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.color = el?.text ?? EMPEROR_UI.textSecondary;
                              e.currentTarget.style.background = el?.void ?? EMPEROR_UI.cardBg;
                              e.currentTarget.style.borderLeft = `3px solid ${el?.core ?? EMPEROR_UI.borderAccent}`;
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.color = EMPEROR_UI.textMuted;
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderLeft = '3px solid transparent';
                            }
                          }}
                        >
                          {/* 指示點 */}
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: isActive ? accent : EMPEROR_UI.borderAccent,
                            boxShadow: isActive ? `0 0 8px ${accent}, 0 0 16px ${accent}44` : 'none',
                            transition: 'all 0.2s',
                          }} />
                          {mod.名稱}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── 頁尾 ── */}
        <div style={{
          padding: '12px 18px',
          borderTop: `1px solid ${EMPEROR_UI.borderAccent}`,
          fontSize: 10, color: EMPEROR_UI.textMuted, textAlign: 'center', flexShrink: 0,
          letterSpacing: '0.08em',
        }}>
          <div>💰 木火土金水 · 五行帝王派工 💰</div>
          <div style={{ color: EMPEROR_UI.textDim, marginTop: 4, fontSize: 9 }}>
            © 2026 兆櫃 AI · 帝王能量聚財系統
          </div>
        </div>
      </aside>

      {/* ════ 右側主內容區 ════ */}
      <main style={{
        flex: 1, marginLeft: SIDEBAR_WIDTH,
        display: 'flex', flexDirection: 'column', minWidth: 0,
        background: EMPEROR_UI.pageBg,
      }}>
        <Outlet />
      </main>
    </div>
  );
}
