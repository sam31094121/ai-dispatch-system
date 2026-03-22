import React, { useEffect, useRef } from 'react';
import type { QualityTier } from './usePerformance';

interface GlobeProps {
  tier: QualityTier;
}

export const CenterGlobe: React.FC<GlobeProps> = ({ tier }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d', { alpha: true })!;

    const resize = () => {
      const parent = cv.parentElement;
      if (parent) {
        cv.width = parent.offsetWidth;
        cv.height = parent.offsetHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    // Dynamic tiers
    const particleCount = tier === 'extreme' ? 180 : tier === 'normal' ? 100 : 40;
    const drawShadows = tier !== 'light';

    // 3D Point Coordinates
    interface Point3D { x: number; y: number; z: number; }
    const points: Point3D[] = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 160 + (Math.random() - 0.5) * 10;
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
      };
    });

    const angleX = 0.003;
    const angleY = 0.005;

    const render = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      const cx = cv.width / 2;
      const cy = cv.height / 2;
      const radius = 160;

      // Draw Orbit Rings
      ctx.save();
      ctx.translate(cx, cy);
      
      const time = performance.now() * 0.001;
      const pulse = Math.sin(time * 2) * 4;

      // Draw wireframes
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(time * (0.2 + i * 0.1));
        ctx.scale(1, 0.3);
        ctx.beginPath();
        ctx.arc(0, 0, radius + pulse + i * 20, 0, Math.PI * 2);
        ctx.strokeStyle = i === 1 ? 'rgba(0, 255, 230, 0.6)' : 'rgba(0, 150, 255, 0.3)';
        ctx.lineWidth = 1.5;
        if (drawShadows) {
          ctx.shadowColor = '#00ffe6';
          ctx.shadowBlur = 10;
        }
        ctx.stroke();
        ctx.restore();
      }

      // Rotate points in 3D
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);

      points.forEach(p => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        p.x = x1; p.y = y2; p.z = z2;

        // Projection
        const fov = 350;
        const scale = fov / (fov + z2);
        const screenX = x1 * scale;
        const screenY = y2 * scale;

        // Depth Cueing (distance fade)
        const alpha = Math.max(0.1, Math.min(1, (z2 + radius) / (radius * 2)));

        ctx.fillStyle = `rgba(0, 255, 208, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.max(1, 2 * scale), 0, Math.PI * 2);
        ctx.fill();

        // High end tier renders connections and text
        if (tier !== 'light' && Math.random() < 0.1 && alpha > 0.6) {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
          ctx.font = `${Math.floor(8 * scale)}px monospace`;
          ctx.fillText(Math.floor(Math.random() * 10).toString(), screenX + 5, screenY);
        }
      });

      ctx.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [tier]);

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
    </div>
  );
};
