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
        background: '#ffffff',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
        border: '1px solid #f0e9dd',
        marginBottom: 24,
      }}
    >
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
            fontWeight: 800,
            color: '#2a4365', // 深藍色調，更具質感
            letterSpacing: '-0.02em',
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

      <div style={{ color: '#4a5568', fontSize: 15, lineHeight: 1.6 }}>
        {children}
      </div>
    </section>
  );
}
