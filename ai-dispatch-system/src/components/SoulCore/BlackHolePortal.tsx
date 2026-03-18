type Tier = 'ultra' | 'high' | 'low' | 'minimal';

export const BlackHolePortal = ({ tier }: { tier: Tier }) => {
  const heavy = tier === 'ultra' || tier === 'high';
  const CX = 200, CY = 200, EH = 65; // Radius of event horizon

  return (
    <div style={{
      position: 'relative',
      width: 'clamp(200px, 28vw, 360px)',
      height: 'clamp(200px, 28vw, 360px)',
      filter: 'drop-shadow(0 0 60px rgba(80,0,255,0.45)) drop-shadow(0 0 120px rgba(0,60,200,0.22))',
      transform: 'perspective(800px) rotateX(10deg)',
      transformStyle: 'preserve-3d',
    }}>
      <svg viewBox="0 0 400 400" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        <defs>
          <filter id="bhG" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="bhC" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="15" />
          </filter>
          <filter id="bhS" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="bhSp" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="20%" stopColor="#010005" />
            <stop offset="50%" stopColor="#030010" />
            <stop offset="85%" stopColor="#010008" />
            <stop offset="100%" stopColor="#00040a" />
          </radialGradient>
          <radialGradient id="dkI" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="42%" stopColor="transparent" />
            <stop offset="50%" stopColor="rgba(255,235,120,0.6)" />
            <stop offset="58%" stopColor="rgba(255,160,30,0.4)" />
            <stop offset="68%" stopColor="rgba(0,229,200,0.22)" />
            <stop offset="78%" stopColor="rgba(124,77,255,0.12)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="phR" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="78%" stopColor="transparent" />
            <stop offset="85%" stopColor="rgba(255,200,80,0.55)" />
            <stop offset="90%" stopColor="rgba(255,245,190,0.92)" />
            <stop offset="95%" stopColor="rgba(255,170,40,0.55)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* deep space core background */}
        <circle cx={CX} cy={CY} r="195" fill="url(#bhSp)" />

        {/* Space-time distortion arcs */}
        {[185, 172, 160, 150].map((r, i) => (
          <circle key={i} cx={CX} cy={CY} r={r} fill="none"
            stroke={i % 2 === 0 ? 'rgba(0,229,200,0.04)' : 'rgba(124,77,255,0.03)'}
            strokeWidth={0.6}
            style={{ animation: `quantArc ${3 + i * 0.6}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }} />
        ))}

        {/* relativistic jet lines */}
        <line x1={CX} y1={CY - EH - 2} x2={CX - 5} y2={CY - 190} stroke="rgba(0,229,200,0.2)" strokeWidth="2" strokeDasharray="5 12" style={{ animation: 'jetPulse 2s ease-in-out infinite' }} />
        <line x1={CX} y1={CY + EH + 2} x2={CX + 5} y2={CY + 190} stroke="rgba(124,77,255,0.15)" strokeWidth="1.5" strokeDasharray="5 12" style={{ animation: 'jetPulse 2.5s ease-in-out infinite', animationDelay: '0.4s' }} />

        {/* Inner intense gas accretion disk */}
        <g style={{ transformOrigin: `${CX}px ${CY}px`, animation: 'bhSpin 10s linear infinite' }}>
          <ellipse cx={CX} cy={CY} rx="140" ry="40" fill="url(#dkI)" opacity="0.9" filter="url(#bhS)" />
        </g>

        {/* Photon sphere edge light */}
        <circle cx={CX} cy={CY} r={EH + 4} fill="none" stroke="url(#phR)" filter="url(#bhG)" style={{ animation: 'photon 2.4s ease-in-out infinite' }} />

        {/* Black hole body shadowing */}
        <ellipse cx={CX} cy={CY + 15} rx={EH + 8} ry={18} fill="rgba(0,0,0,0.85)" />
        <circle cx={CX} cy={CY} r={EH} fill="black" />
        <circle cx={CX} cy={CY} r={EH - 2} fill="none" stroke="rgba(70,0,160,0.7)" strokeWidth="5" filter="url(#bhC)" />

        {/* Hawking radiation sparks */}
        {heavy && Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <circle key={i} cx={CX + Math.cos(a) * (EH + 6)} cy={CY + Math.sin(a) * (EH + 6) * 0.35} r="1" fill="rgba(255,255,255,0.85)" style={{ animation: `bhFlicker ${0.6 + i * 0.12}s ease-in-out infinite`, animationDelay: `${i * 0.04}s` }} />
          );
        })}

        {/* Gravity captured fast moving photons */}
        {heavy && Array.from({ length: 8 }, (_, i) => (
          <circle key={i} r="1.5" cx={CX + 95 + i * 15} cy={CY} fill={['#00e5ff', '#7c4dff', '#ffd700', '#ff6ec7', '#00ffd0', '#ff8c00'][i % 6]} opacity="0.8" style={{ animation: `bhSpin ${3.5 + i * 0.4}s linear infinite`, transformOrigin: `${CX}px ${CY}px`, animationDelay: `${i * 0.45}s` }} />
        ))}
      </svg>
    </div>
  );
};
