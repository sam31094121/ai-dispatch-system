// ==========================================
// 共用 UI 元件 — 深空科技統一 v12.0
// ==========================================
import React from 'react';
import { cn } from '../lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("rounded-xl overflow-hidden relative", className)} style={{
    background: 'linear-gradient(145deg, rgba(6,14,30,0.78), rgba(3,8,18,0.88))',
    border: '1px solid rgba(0,212,255,0.10)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
    backdropFilter: 'blur(24px) saturate(180%)',
  }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 1,
      background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.2) 30%, rgba(125,249,255,0.3) 50%, rgba(0,212,255,0.2) 70%, transparent 95%)',
      pointerEvents: 'none', zIndex: 2,
    }} />
    {children}
  </div>
);

export const CardHeader = ({ title, icon: Icon, action, className }: {
  title: string; icon?: any; action?: React.ReactNode; className?: string;
}) => (
  <div className={cn("px-5 py-3.5 flex justify-between items-center", className)} style={{
    borderBottom: '1px solid rgba(0,212,255,0.08)',
    background: 'linear-gradient(180deg, rgba(0,212,255,0.04), transparent)',
  }}>
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-4.5 h-4.5" style={{ color: '#00D4FF' }} />}
      <h3 className="font-semibold text-sm" style={{ color: '#E8F4FF' }}>{title}</h3>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-5", className)}>{children}</div>
);

export const Badge = ({ text, color = 'indigo' }: { text: string; color?: string }) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    indigo:  { bg: 'rgba(139,92,246,0.12)', text: '#c4b5fd', border: 'rgba(139,92,246,0.25)' },
    red:     { bg: 'rgba(239,68,68,0.12)',  text: '#fca5a5', border: 'rgba(239,68,68,0.25)' },
    orange:  { bg: 'rgba(245,158,11,0.12)', text: '#fcd34d', border: 'rgba(245,158,11,0.25)' },
    yellow:  { bg: 'rgba(242,194,0,0.12)',  text: '#ffd700', border: 'rgba(242,194,0,0.25)' },
    green:   { bg: 'rgba(0,255,156,0.10)',  text: '#00ff9c', border: 'rgba(0,255,156,0.25)' },
    emerald: { bg: 'rgba(16,185,129,0.12)', text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    slate:   { bg: 'rgba(100,116,139,0.12)',text: '#94a3b8', border: 'rgba(100,116,139,0.25)' },
    cyan:    { bg: 'rgba(0,212,255,0.10)',  text: '#7df9ff', border: 'rgba(0,212,255,0.25)' },
  };
  const c = colors[color] || colors.indigo;
  return (
    <span style={{
      fontSize: 12, fontWeight: 700,
      padding: '3px 10px', borderRadius: 999,
      background: c.bg, color: c.text,
      border: `1px solid ${c.border}`,
      display: 'inline-flex', alignItems: 'center',
    }}>
      {text}
    </span>
  );
};

export const MetricCard = ({ label, value, sub, icon: Icon, color = 'cyan' }: {
  label: string; value: string | number; sub?: string; icon?: any; color?: string;
}) => {
  const accents: Record<string, { main: string; glow: string }> = {
    indigo:  { main: '#8B5CF6', glow: 'rgba(139,92,246,0.18)' },
    emerald: { main: '#00FF9C', glow: 'rgba(0,255,156,0.18)' },
    orange:  { main: '#F59E0B', glow: 'rgba(245,158,11,0.18)' },
    red:     { main: '#EF4444', glow: 'rgba(239,68,68,0.18)' },
    purple:  { main: '#8B5CF6', glow: 'rgba(139,92,246,0.18)' },
    blue:    { main: '#3B82F6', glow: 'rgba(59,130,246,0.18)' },
    cyan:    { main: '#00D4FF', glow: 'rgba(0,212,255,0.18)' },
    gold:    { main: '#F2C200', glow: 'rgba(242,194,0,0.18)' },
  };
  const a = accents[color] || accents.cyan;

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: `linear-gradient(135deg, ${a.glow}, rgba(0,0,0,0.3))`,
          border: `1px solid ${a.main}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 20px ${a.glow}, inset 0 0 12px ${a.glow}`,
          color: a.main,
        }}>
          {Icon && <Icon style={{ width: 22, height: 22 }} />}
        </div>
        <div className="min-w-0">
          <p style={{ fontSize: 11, fontWeight: 700, color: '#4A7FA0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
          <h4 style={{ fontSize: 22, fontWeight: 900, color: '#E8F4FF', letterSpacing: '-0.02em' }} className="truncate">{value}</h4>
          {sub && <p style={{ fontSize: 11, fontWeight: 700, color: '#00FF9C', marginTop: 2 }}>{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

export const ProgressBar = ({ value, max = 100, color = '#00D4FF' }: {
  value: number; max?: number; color?: string;
}) => (
  <div style={{
    width: '100%', height: 6, borderRadius: 6,
    background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
  }}>
    <div style={{
      width: `${Math.min((value / max) * 100, 100)}%`,
      height: '100%', borderRadius: 6,
      background: `linear-gradient(90deg, ${color}, ${color}cc)`,
      boxShadow: `0 0 8px ${color}66, inset 0 0 2px rgba(255,255,255,0.15)`,
      transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
    }} />
  </div>
);
