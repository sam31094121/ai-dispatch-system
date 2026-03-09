import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 塞入基礎的全域重置與字體設定 (保留原本邏輯，但也加上 index.css)
const style = document.createElement('style');
style.textContent = `
  body, html {
    margin: 0;
    padding: 0;
    height: 100%;
    font-family: "Inter", "Noto Sans TC", system-ui, -apple-system, sans-serif;
    background-color: #f8fafc;
    color: #334155;
    -webkit-font-smoothing: antialiased;
  }
  * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('未找到 #root 元素，請檢查 index.html');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  console.error('React 掛載出錯:', error);
  // 若掛載失敗，顯示簡單錯誤訊息以免白畫面
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 40px; color: red;"><h3>系統載入錯誤 (React Mount Error)</h3><pre>${error}</pre></div>`;
  }
}
