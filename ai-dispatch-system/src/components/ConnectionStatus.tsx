import { useState } from 'react';
import { useHeartbeat } from '../hooks/useHeartbeat';

export const ConnectionStatus = () => {
  const { status, latency, attempts, triggerManualCheck } = useHeartbeat();
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    if (status === 'disconnected') return '#FF2A3A'; // 烈火紅
    if (status === 'reconnecting') return '#FFB000'; // 黃金
    if (latency > 150) return '#FF9433'; // 橘
    return '#00FF9C'; // 綠色
  };

  const color = getStatusColor();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: expanded ? '250px' : '120px',
        borderRadius: '16px',
        padding: '2px', // 邊框厚度
        background: 'transparent',
        overflow: 'hidden',
        boxShadow: `0 15px 45px rgba(0,0,0,0.9), 0 0 25px ${color}33`,
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)',
        cursor: 'pointer',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* 🔮 跑馬燈流光層 */}
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `conic-gradient(from 0deg, ${color}, transparent 30%, ${color}, transparent 70%, ${color})`,
          animation: 'border-rotate 4s linear infinite',
          zIndex: 0,
        }}
      />

      {/* 🧬 本體內容層 */}
      <div
        style={{
          background: 'rgba(7, 8, 12, 0.95)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '14px',
          padding: expanded ? '16px' : '8px 12px',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          color: '#f7f0dc',
        }}
      >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* 動態心跳 LED */}
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}, 0 0 16px ${color}88`,
            animation: status === 'disconnected' ? 'pulse-fast 0.6s infinite' : 'pulse-slow 2s infinite',
            flexShrink: 0,
          }}
        />
        
        <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.05em' }}>
          {status === 'connected' && latency >= 0 ? `系統已連線` : status === 'reconnecting' ? '重連中...' : '❌ 斷線中'}
        </span>
        
        {status === 'connected' && latency >= 0 && !expanded && (
          <span style={{ fontSize: '10px', color: latency > 100 ? '#FF9433' : '#00FF9C', opacity: 0.85 }}>
            {latency}ms
          </span>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '4px', fontSize: '11px', color: '#cdbf96', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>網絡延遲 (Latency)：</span>
            <span style={{ fontWeight: 800, color: latency > 150 ? '#FF9433' : '#00FF9C' }}>{latency >= 0 ? `${latency} ms` : 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>重連嘗試 (Attempts)：</span>
            <span>{attempts} 次</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>系統狀態：</span>
            <span style={{ color }}>{status === 'connected' ? '穩固' : status === 'reconnecting' ? '復原中' : '中斷'}</span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              triggerManualCheck();
            }}
            style={{
              marginTop: '6px',
              padding: '5px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#f7f0dc',
              fontSize: '10px',
              cursor: 'pointer',
              fontWeight: 800,
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            🛠️ 手動診斷並修復
          </button>
        </div>
      )}

      {/* 內嵌動畫 */}
      <style>{`
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes pulse-fast {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; boxShadow: 0 0 18px #FF2A3A; }
        }
        @keyframes border-rotate {
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </div> {/* 本體內容層 結尾 */}
    </div>
  );
};
