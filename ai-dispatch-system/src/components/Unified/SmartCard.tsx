import type { ReactNode, CSSProperties } from 'react';

interface SmartCardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  rightAction?: ReactNode;
  onClick?: () => void;
  hoverEffect?: boolean;
  highlight?: boolean;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
}

export function SmartCard({
  children, title, subtitle, rightAction, onClick, hoverEffect, highlight, accentColor = '#00D4FF', className, style
}: SmartCardProps) {
  return (
    <div
      onClick={onClick}
      className={`${hoverEffect ? 'hover-lift' : ''} ${className || ''}`}
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, rgba(6,14,30,0.78), rgba(3,8,18,0.88))',
        backdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${highlight ? accentColor + '44' : 'rgba(0,212,255,0.10)'}`,
        borderRadius: 12,
        padding: '12px 14px',
        boxShadow: highlight
          ? `0 8px 32px rgba(0,0,0,0.6), 0 0 18px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
        overflow: 'hidden',
        ...style
      }}
      onMouseEnter={hoverEffect ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px rgba(0,0,0,0.7), 0 0 24px ${accentColor}18, inset 0 1px 0 rgba(255,255,255,0.06)`;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}33`;
      } : undefined}
      onMouseLeave={hoverEffect ? e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'none';
        (e.currentTarget as HTMLDivElement).style.boxShadow = highlight
          ? `0 8px 32px rgba(0,0,0,0.6), 0 0 18px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.04)`
          : '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)';
        (e.currentTarget as HTMLDivElement).style.borderColor = highlight ? `${accentColor}44` : 'rgba(0,212,255,0.10)';
      } : undefined}
    >
      {/* 頂部高光條 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent 5%, ${accentColor}33 30%, ${accentColor}44 50%, ${accentColor}33 70%, transparent 95%)`,
        pointerEvents: 'none', zIndex: 2,
      }} />

      {(title || rightAction || subtitle) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: children ? 8 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {title && <div style={{ fontSize: 13, fontWeight: 900, color: accentColor, textShadow: `0 0 16px ${accentColor}33` }}>{title}</div>}
            {subtitle && <div style={{ fontSize: 10, color: '#4A7FA0' }}>{subtitle}</div>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
