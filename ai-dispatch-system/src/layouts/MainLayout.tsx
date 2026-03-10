import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { NAV_GROUPS, MODULE_CONFIGS } from '../constants/moduleConfig';

const SIDEBAR_WIDTH = 280;

// ── 色彩對照（行內樣式用，不依賴 Tailwind） ──
const GROUP_ACCENT: Record<string, string> = {
  '每日業績核心樞紐': '#38bdf8',
  '高價成交爆發':     '#fbbf24',
  '女聲智慧播報':     '#a78bfa',
  'LINE 群組轉傳':    '#34d399',
  '系統管理':         '#94a3b8',
};

export function MainLayout() {
  const location = useLocation();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  function toggleGroup(groupName: string) {
    setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  }

  const sortedGroups = [...NAV_GROUPS].sort((a, b) => a.order - b.order);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ════ 左側固定導覽列 ════ */}
      <aside
        style={{
          width: SIDEBAR_WIDTH,
          background: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          overflowY: 'auto',
        }}
      >
        {/* 品牌標題 */}
        <div
          style={{
            padding: '22px 20px',
            borderBottom: '1px solid #1e293b',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 18,
              color: '#38bdf8',
              letterSpacing: '0.04em',
              fontWeight: 900,
            }}
          >
            兆櫃 AI 派工系統
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontWeight: 600 }}>
            每日業績樞紐 V2
          </div>
        </div>

        {/* 導覽群組 */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {sortedGroups.map((group) => {
            const isCollapsed = collapsedGroups[group.groupName] ?? false;
            const accent = GROUP_ACCENT[group.groupName] ?? '#94a3b8';
            const modulesInGroup = MODULE_CONFIGS
              .filter((m) => group.moduleKeys.includes(m.key))
              .sort((a, b) => a.order - b.order);

            const isGroupActive = modulesInGroup.some((m) => location.pathname === m.path);

            return (
              <div key={group.groupName} style={{ marginBottom: 8 }}>
                {/* 群組標題列（可收合） */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.groupName)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isGroupActive ? '#1e293b' : 'transparent',
                    color: isGroupActive ? accent : '#64748b',
                    fontWeight: 700,
                    fontSize: 13,
                    letterSpacing: '0.02em',
                    transition: 'all 0.15s',
                  }}
                  onMouseOver={(e) => {
                    if (!isGroupActive) e.currentTarget.style.background = '#1e293b';
                  }}
                  onMouseOut={(e) => {
                    if (!isGroupActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15 }}>{group.icon}</span>
                    {group.groupName}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#475569',
                      transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      display: 'inline-block',
                    }}
                  >
                    ▾
                  </span>
                </button>

                {/* 群組內頁面列表 */}
                {!isCollapsed && (
                  <div style={{ paddingLeft: 10, marginTop: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {modulesInGroup.map((mod) => {
                      const isActive = location.pathname === mod.path;
                      return (
                        <Link
                          key={mod.key}
                          to={mod.path}
                          style={{
                            display: 'block',
                            padding: '9px 12px',
                            borderRadius: 8,
                            textDecoration: 'none',
                            color: isActive ? '#ffffff' : '#94a3b8',
                            background: isActive ? '#1e293b' : 'transparent',
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 14,
                            transition: 'all 0.15s',
                            boxShadow: isActive ? `inset 3px 0 0 ${accent}` : 'none',
                            borderLeft: isActive ? `3px solid ${accent}` : '3px solid transparent',
                          }}
                          onMouseOver={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.color = '#e2e8f0';
                              e.currentTarget.style.background = '#1e293b';
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.color = '#94a3b8';
                              e.currentTarget.style.background = 'transparent';
                            }
                          }}
                        >
                          {mod.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 頁尾 */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #1e293b',
            fontSize: 11,
            color: '#334155',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          © 2026 兆櫃 AI 派工系統
        </div>
      </aside>

      {/* ════ 右側主內容區 ════ */}
      <main
        style={{
          flex: 1,
          marginLeft: SIDEBAR_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
