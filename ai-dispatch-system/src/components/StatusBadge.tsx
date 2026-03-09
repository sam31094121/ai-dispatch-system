import React from 'react';
import { 狀態顏色對照 } from '../constants/dictionaries';

type BadgeTone = 'pass' | 'warn' | 'fail' | 'info';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
}

const toneStyleMap: Record<BadgeTone, React.CSSProperties> = {
  pass: {
    background: '#e8f5eb',
    color: 狀態顏色對照.pass,
    border: `1px solid ${狀態顏色對照.pass}`,
  },
  warn: {
    background: '#fff4e5',
    color: 狀態顏色對照.warn,
    border: `1px solid ${狀態顏色對照.warn}`,
  },
  fail: {
    background: '#fdecec',
    color: 狀態顏色對照.fail,
    border: `1px solid ${狀態顏色對照.fail}`,
  },
  info: {
    background: '#edf4fb',
    color: 狀態顏色對照.info,
    border: `1px solid ${狀態顏色對照.info}`,
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
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 700,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
