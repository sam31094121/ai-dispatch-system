import { UI } from '../../constants/wuxingColors';

export function MiniBar({ val, color = UI.cyan, h = 4, delay = 0 }: {
  val: number; color?: string; h?: number; delay?: number;
}) {
  return (
    <div style={{
      height: h, background: 'rgba(255,255,255,0.04)', borderRadius: h,
      overflow: 'hidden', marginTop: 4,
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        width: `${Math.min(100, val)}%`, height: '100%',
        background: `linear-gradient(90deg, ${color}cc, ${color})`,
        borderRadius: h,
        boxShadow: `0 0 8px ${color}55, 0 0 2px ${color}88, inset 0 0 2px rgba(255,255,255,0.2)`,
        transition: `width 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
      }} />
    </div>
  );
}
