import React, { ReactNode, CSSProperties, useState } from 'react';

export interface ActionTextProps {
  children: ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  copyText?: string;
  copy?: string; // 支援舊版相容
  action?: () => void; // 支援舊版相容
  title?: string;
  color?: string;
  bold?: boolean;
  size?: number | string;
  className?: string;
  style?: CSSProperties;
}

export function ActionText({ 
  children, onClick, copyText, copy, action, title = '點擊執行動作', color = '#00D4FF', bold, size, className, style 
}: ActionTextProps) {
  const [flash, setFlash] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick(e);
    if (action) action();
    
    const textToCopy = copyText || copy;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    setFlash(true);
    setTimeout(() => setFlash(false), 500);
  };

  return (
    <span
      className={`action-text ${className || ''}`}
      onClick={handleClick}
      title={(copyText || copy) ? `點擊複製：${title}` : title}
      style={{
        cursor: 'pointer',
        color: flash ? '#ffd700' : color,
        fontWeight: bold ? 900 : 'normal',
        fontSize: size,
        textDecoration: flash ? 'none' : `underline dashed ${(color || '#00D4FF')}55`,
        transition: 'all 0.2s',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        textShadow: flash ? '0 0 10px #ffd700, 0 0 20px #ffd70066' : 'none',
        filter: flash ? 'brightness(1.5)' : 'none',
        userSelect: 'none',
        ...style
      }}
      onMouseEnter={e => { if (!flash) (e.currentTarget as HTMLSpanElement).style.filter = 'brightness(1.4)'; }}
      onMouseLeave={e => { if (!flash) (e.currentTarget as HTMLSpanElement).style.filter = 'none'; }}
    >
      {children}
    </span>
  );
}
