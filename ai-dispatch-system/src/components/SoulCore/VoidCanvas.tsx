import { useEffect, useRef } from 'react';

type Tier = 'ultra' | 'high' | 'low' | 'minimal';

export const VoidCanvas = ({ tier }: { tier: Tier }) => {
  const cvs = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const canvas = cvs.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;

    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const W = () => canvas.width;
    const H = () => canvas.height;

    const n = tier === 'ultra' ? 180 : tier === 'high' ? 90 : tier === 'low' ? 30 : 0;
    if (n === 0) { return () => { ro.disconnect(); cancelAnimationFrame(raf.current); }; }

    const VCOLS = ['#00e5ff', '#7c4dff', '#ff6ec7', '#ffd700', '#00ffd0', '#ff8c00'];
    const MATTERS = ['💰', '📈', '📊', '🌐', '🧬', '🤖', '🔋', '💎', '💡', '⚖️', '🌍', '📊', '👑'];
    
    const pts = Array.from({ length: n }, () => {
      const isMatter = Math.random() > 0.65;
      return {
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 320 + 90,
        speed: (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1),
        sr: Math.random() * 0.45 + 0.18,
        color: VCOLS[Math.floor(Math.random() * VCOLS.length)],
        sz: Math.random() * 2.4 + 0.6,
        isMatter,
        matter: isMatter ? MATTERS[Math.floor(Math.random() * MATTERS.length)] : '',
      };
    });

    let t = 0;
    const draw = () => {
      const w = W(), h = H(); const cx = w / 2, cy = h / 2;
      ctx.fillStyle = 'rgba(0, 3, 12, 0.18)'; ctx.fillRect(0, 0, w, h);
      t += 0.008;

      // Accretion disk layers
      for (let lyr = 0; lyr < 4; lyr++) {
        const R = 90 + lyr * 30;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * (0.06 + lyr * 0.03)); ctx.scale(1, 0.28);
        const g = ctx.createRadialGradient(0, 0, R - 15, 0, 0, R + 18);
        const c0 = ['rgba(255,180,50,0.15)', 'rgba(0,210,240,0.1)', 'rgba(100,60,220,0.08)', 'rgba(0,140,240,0.06)'][lyr];
        const c1 = ['rgba(255,100,20,0.1)', 'rgba(0,140,180,0.06)', 'rgba(60,20,160,0.04)', 'transparent'][lyr];
        g.addColorStop(0, 'transparent'); g.addColorStop(0.35, c0); g.addColorStop(0.65, c1); g.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore();
      }

      // Gravitational Lensing Rings
      for (let i = 0; i < 6; i++) {
        ctx.beginPath(); ctx.arc(cx, cy, 160 + i * 16, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${i % 2 === 0 ? '0,229,200' : '124,77,255'}, ${Math.max(0.005, 0.05 - i * 0.007).toFixed(3)})`;
        ctx.lineWidth = 0.6; ctx.stroke();
      }

      // Photon Ring (Inner hot glow)
      const pg = ctx.createRadialGradient(cx, cy, 65, cx, cy, 85);
      pg.addColorStop(0, 'transparent'); pg.addColorStop(0.3, 'rgba(255,190,40,0.3)'); pg.addColorStop(0.6, 'rgba(255,230,140,0.6)'); pg.addColorStop(0.8, 'rgba(255,160,30,0.2)'); pg.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, 75, 0, Math.PI * 2); ctx.fillStyle = pg; ctx.fill();

      // Singularity core blackout
      const eg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 68);
      eg.addColorStop(0, '#000'); eg.addColorStop(0.9, '#000'); eg.addColorStop(1, 'rgba(15,0,40,0.6)');
      ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2); ctx.fillStyle = eg; ctx.fill();

      // Spiraling particles
      for (const p of pts) {
        p.angle += p.speed; p.radius -= p.sr;
        if (p.radius < 70) { 
          p.angle = Math.random() * Math.PI * 2; 
          p.radius = Math.random() * 300 + 140; 
          p.speed = (Math.random() * 0.012 + 0.004) * (Math.random() > 0.5 ? 1 : -1); 
          p.sr = Math.random() * 0.45 + 0.18; 
          p.isMatter = Math.random() > 0.65;
          p.matter = p.isMatter ? MATTERS[Math.floor(Math.random() * MATTERS.length)] : '';
        }
        const px = cx + Math.cos(p.angle) * p.radius;
        const py = cy + Math.sin(p.angle) * p.radius * 0.28;
        const alpha = Math.min(1, (p.radius - 70) / 100) * 0.68;
        
        if (p.isMatter) {
          ctx.font = `${p.sz * 4 * alpha}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
          ctx.globalAlpha = alpha * 0.85;
          ctx.fillText(p.matter, px, py);
        } else {
          ctx.beginPath(); ctx.arc(px, py, p.sz * alpha, 0, Math.PI * 2);
          ctx.fillStyle = p.color; ctx.globalAlpha = alpha; ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      raf.current = requestAnimationFrame(draw);
    };

    raf.current = requestAnimationFrame(draw);
    return () => { ro.disconnect(); cancelAnimationFrame(raf.current); };
  }, [tier]);

  if (tier === 'minimal') return null;
  return <canvas ref={cvs} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};
