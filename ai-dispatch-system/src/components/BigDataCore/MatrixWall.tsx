import React, { useEffect, useRef } from 'react';
import type { QualityTier } from './usePerformance';

interface MatrixWallProps {
  tier: QualityTier;
}

export const MatrixWall: React.FC<MatrixWallProps> = ({ tier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d')!;

    const resize = () => {
      cv.width = cv.parentElement?.offsetWidth || window.innerWidth;
      cv.height = cv.parentElement?.offsetHeight || window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const fontSize = 12;
    let columns = Math.floor(cv.width / fontSize);
    let drops: number[] = Array(columns).fill(1);

    const drawShadows = tier !== 'light';
    const speed = tier === 'extreme' ? 1.5 : 1.0;
    
    // Adjust density based on tier
    const particleThreshold = tier === 'extreme' ? 0.975 : tier === 'normal' ? 0.98 : 0.99;

    const render = () => {
      // Semi-transparent background for trails
      ctx.fillStyle = 'rgba(5, 8, 15, 0.15)';
      ctx.fillRect(0, 0, cv.width, cv.height);

      ctx.fillStyle = 'rgba(0, 240, 255, 0.35)'; // Cyan matrix text
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random 0-9
        const text = Math.floor(Math.random() * 10).toString();
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        // Highlight head drop
        if (drawShadows && Math.random() < 0.1) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#0cf';
          ctx.shadowBlur = 8;
          ctx.fillText(text, x, y);
          ctx.restore();
        }

        // Loop resets
        if (y > cv.height && Math.random() > particleThreshold) {
          drops[i] = 0;
        }

        drops[i] += speed;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [tier]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />
  );
};
