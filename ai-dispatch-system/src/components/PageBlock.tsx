import React from 'react';

interface PageBlockProps {
  title: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function PageBlock({
  title,
  rightSlot,
  children,
}: PageBlockProps): React.ReactElement {
  return (
    <section
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, rgba(6,14,30,0.78), rgba(3,8,18,0.88))',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 18,
        padding: 24,
        border: '1px solid rgba(0,212,255,0.10)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        marginBottom: 24,
        overflow: 'hidden',
      }}
    >
      {/* 頂部高光條 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.2) 30%, rgba(125,249,255,0.3) 50%, rgba(0,212,255,0.2) 70%, transparent 95%)',
        pointerEvents: 'none',
      }} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          gap: 16,
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 900,
            color: '#00D4FF',
            letterSpacing: '0.02em',
            textShadow: '0 0 20px rgba(0,212,255,0.3)',
          }}
        >
          {title}
        </h2>
        {rightSlot && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {rightSlot}
          </div>
        )}
      </div>

      <div style={{ color: '#E8F4FF', fontSize: 15, lineHeight: 1.6 }}>
        {children}
      </div>
    </section>
  );
}
