import { useState, useEffect, useRef } from 'react';

export type QualityTier = 'extreme' | 'normal' | 'light';

export const usePerformance = (targetFps = 45, checkFrames = 150) => {
  const [tier, setTier] = useState<QualityTier>('extreme');
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lowFpsCount = useRef(0);

  useEffect(() => {
    let rafId: number;
    
    const monitor = () => {
      const now = performance.now();
      frameCount.current++;
      
      // Calculate FPS every 1 second
      if (now - lastTime.current >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;

        // Stability Check
        if (currentFps < targetFps) {
          lowFpsCount.current++;
          if (lowFpsCount.current >= 3) { // Below threshold for 3 consecutive seconds
            setTier(current => {
              if (current === 'extreme') return 'normal';
              if (current === 'normal') return 'light';
              return 'light';
            });
            lowFpsCount.current = 0;
          }
        } else {
          lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
        }
      }
      rafId = requestAnimationFrame(monitor);
    };

    rafId = requestAnimationFrame(monitor);
    return () => cancelAnimationFrame(rafId);
  }, [targetFps]);

  const setManualTier = (newTier: QualityTier) => {
    setTier(newTier);
    lowFpsCount.current = 0; // Reset counter
  };

  return { tier, fps, setManualTier };
};
