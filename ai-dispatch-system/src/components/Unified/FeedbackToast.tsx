interface FeedbackToastProps {
  msg: string | null;
  type?: 'success' | 'error' | 'info';
}

export function FeedbackToast({ msg, type = 'info' }: FeedbackToastProps) {
  if (!msg) return null;

  const isErr = type === 'error' || msg.includes('失敗') || msg.includes('錯誤');

  const baseColor = isErr ? '#ef4444' : '#00d4ff';
  const bgColor = isErr ? 'rgba(20,4,4,0.95)' : 'rgba(2,8,20,0.95)';
  const shadowColor = isErr ? 'rgba(239,68,68,0.25)' : 'rgba(0,212,255,0.25)';
  const icon = isErr ? '⚠️' : '📋';

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: bgColor,
      backdropFilter: 'blur(20px) saturate(180%)',
      border: `1px solid ${baseColor}33`,
      color: isErr ? '#fca5a5' : baseColor,
      fontSize: 11, fontWeight: 700, padding: '8px 20px', borderRadius: 14,
      zIndex: 9999, pointerEvents: 'none',
      boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 20px ${shadowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`,
      whiteSpace: 'nowrap', animation: 'unif-toast-drop 0.3s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <style>{`
        @keyframes unif-toast-drop {
          from { opacity: 0; transform: translateX(-50%) translateY(15px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      {icon} {msg}
    </div>
  );
}
