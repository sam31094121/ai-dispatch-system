import type { ReactNode, CSSProperties } from 'react';

interface SectionBlockProps {
  title?: string | ReactNode;
  icon?: string | ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  rightAction?: ReactNode;
  className?: string;
  style?: CSSProperties;
  bodyStyle?: CSSProperties;
}

export function SectionBlock({ title, icon, badge, children, rightAction, className, style, bodyStyle }: SectionBlockProps) {
  return (
    <section className={className} style={{ marginBottom: 20, ...style }}>
      {(title || icon || badge || rightAction) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            {title && (
              <h2 style={{
                fontSize: 15, fontWeight: 900, color: '#00D4FF', margin: 0,
                letterSpacing: '0.05em',
                textShadow: '0 0 20px rgba(0,212,255,0.25)',
              }}>
                {title}
              </h2>
            )}
            {badge && <div>{badge}</div>}
          </div>
          {rightAction && <div>{rightAction}</div>}
        </div>
      )}
      <div style={bodyStyle}>{children}</div>
    </section>
  );
}
