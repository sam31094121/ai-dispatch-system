import React from 'react';

type BadgeTone = 'pass' | 'warn' | 'fail' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneStyleMap: Record<BadgeTone, React.CSSProperties> = {
  pass: {
    background: 'rgba(0,255,156,0.10)',
    color: '#00ff9c',
    border: '1px solid rgba(0,255,156,0.25)',
    boxShadow: '0 0 12px rgba(0,255,156,0.10)',
  },
  warn: {
    background: 'rgba(245,158,11,0.10)',
    color: '#fcd34d',
    border: '1px solid rgba(245,158,11,0.25)',
    boxShadow: '0 0 12px rgba(245,158,11,0.10)',
  },
  fail: {
    background: 'rgba(239,68,68,0.10)',
    color: '#fca5a5',
    border: '1px solid rgba(239,68,68,0.25)',
    boxShadow: '0 0 12px rgba(239,68,68,0.10)',
  },
  info: {
    background: 'rgba(0,212,255,0.10)',
    color: '#7df9ff',
    border: '1px solid rgba(0,212,255,0.25)',
    boxShadow: '0 0 12px rgba(0,212,255,0.10)',
  },
};

export function StatusBadge({
  label,
  tone = 'info',
}: StatusBadgeProps): React.ReactElement {
  return (
    <span
      style={{
        ...toneStyleMap[tone],
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        borderRadius: 999,
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </span>
  );
}
