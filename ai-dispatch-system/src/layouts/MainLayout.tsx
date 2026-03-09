import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const sidebarWidth = 260;

export function MainLayout() {
  const location = useLocation();

  const menuItems = [
    { path: '/', label: '⚒️ AI 派單工作台' },
    { path: '/history', label: '🗂️ 歷史報表查詢' },
    { path: '/settings', label: '⚙️ 系統常數設定' },
    { path: '/old', label: '🔙 回到舊版網頁' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <aside
        style={{
          width: sidebarWidth,
          background: '#0f172a', /* 深藍黑質感側邊欄 */
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 24px rgba(0,0,0,0.1)',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
          <h2 style={{ margin: 0, fontSize: 20, color: '#38bdf8', letterSpacing: '0.05em', fontWeight: 900 }}>AI DISPATCH</h2>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, fontWeight: 600 }}>兆櫃·每日業績樞紐 V1</div>
        </div>

        <nav style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive ? '#1e293b' : 'transparent',
                  fontWeight: isActive ? 700 : 600,
                  fontSize: 15,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? 'inset 4px 0 0 #38bdf8' : 'none',
                }}
                onMouseOver={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#e2e8f0';
                }}
                onMouseOut={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#94a3b8';
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '24px 20px', borderTop: '1px solid #1e293b', fontSize: 12, color: '#475569', textAlign: 'center' }}>
          &copy; 2026 AI Dispatch
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          marginLeft: sidebarWidth,
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
