// ════════════════════════════════════════════════════
// 兆櫃AI派單系統 — 深空科技色彩核心 v10.0
// 哲學：量子深黑底座 × 電漿霓虹 × 數據藍金雙軸
// 科技感關鍵：冷冽深藍 + 電漿青綠 + 帝王金點綴
// ════════════════════════════════════════════════════

// ── 深空科技核心原色 ──
export const EMPEROR = {
  // 量子深黑底 — 宇宙黑，比純黑更有深度
  obsidian:     '#03050C',
  obsidianMid:  '#060A14',
  obsidianSurf: '#0C1220',

  // 數據藍 — AI核心電漿色，最主要科技色
  imperialGold:  '#00D4FF',   // 原imperialGold → 電漿青藍（品牌主色）

  // 量子亮藍 — 高光層、數據流
  glazedGold:    '#7DF9FF',   // 原glazedGold → 量子霓虹藍

  // 神經綠 — 系統存活信號、AI神經網路
  imperialGreen: '#00FF9C',   // 原imperialGreen → 神經電漿綠

  // 爆發紫 — 高壓能量爆發、A1派單
  flameAmber:    '#8B5CF6',   // 原flameAmber → 電漿深紫

  // 輔助色
  deepGold:    '#2A4A7F',   // 深空藍（次要文字）
  midGold:     '#3B6BBF',   // 中調藍
  softGold:    '#93C5FD',   // 柔和天藍
  ashGold:     '#1E3A5F',   // 深藍灰
  warmBlack:   '#050A14',   // 極深藍黑
} as const;

// ── AI 自動深淺演算 ──
function makeGoldShades(hex: string) {
  return {
    abyss:  blendWithBlack(hex, 0.04),
    void:   blendWithBlack(hex, 0.10),
    shadow: blendWithBlack(hex, 0.22),
    core:   blendWithBlack(hex, 0.45),
    base:   blendWithBlack(hex, 0.80),
    bright: hex,
    glow:   lighten(hex, 0.25),
    text:   lighten(hex, 0.45),
  };
}

function blendWithBlack(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * ratio);
  const ng = Math.round(g * ratio);
  const nb = Math.round(b * ratio);
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string, ratio: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * ratio));
  const ng = Math.min(255, Math.round(g + (255 - g) * ratio));
  const nb = Math.min(255, Math.round(b + (255 - b) * ratio));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// ── 五行科技色板 interface ──
export interface WuxingPalette {
  element: string;
  name: string;
  description: string;
  abyss: string;
  void: string;
  shadow: string;
  core: string;
  base: string;
  bright: string;
  glow: string;
  text: string;
  gradient: string;
  glowShadow: string;
}

function makePalette(
  element: string,
  name: string,
  desc: string,
  primary: string,
  secondary: string,
): WuxingPalette {
  const s = makeGoldShades(primary);
  return {
    element, name, description: desc,
    ...s,
    gradient: `linear-gradient(135deg, ${EMPEROR.warmBlack} 0%, ${s.void} 40%, ${s.shadow} 80%, ${s.core} 100%)`,
    glowShadow: `0 0 24px ${primary}44, 0 0 60px ${primary}22, inset 0 1px 0 ${secondary}33`,
  };
}

// ── 土：數據藍（AI核心主色 · 電漿青藍）──
export const TU: WuxingPalette = makePalette(
  '土', '數據藍核',
  '量子電漿 · AI核心 · 數據藍聚能',
  '#00D4FF',
  '#7DF9FF',
);

// ── 木：神經電漿綠（系統生命 · 數據流）──
export const MU: WuxingPalette = makePalette(
  '木', '神經綠',
  '神經網路 · 系統生命 · 電漿活化',
  '#00FF9C',
  '#00D4FF',
);

// ── 火：爆發深紫（高壓能量 · 派單引擎）──
export const HUO: WuxingPalette = makePalette(
  '火', '量子紫',
  '爆發高壓 · 量子紫能 · 派單爆衝',
  '#8B5CF6',
  '#C4B5FD',
);

// ── 金：帝王金（業績高光 · 數據勝利）──
export const JIN: WuxingPalette = {
  element: '金', name: '帝王金',
  description: '業績高光 · 數據勝利 · 黃金標誌',
  abyss:  '#0A0900',
  void:   '#141200',
  shadow: '#2A2500',
  core:   '#5A4E00',
  base:   '#B89600',
  bright: '#F2C200',
  glow:   '#FFE066',
  text:   '#FFD700',
  gradient: `linear-gradient(135deg, #0A0900 0%, #141200 40%, #2A2500 80%, #5A4E00 100%)`,
  glowShadow: `0 0 24px #F2C20055, 0 0 60px #B8960022, inset 0 1px 0 #FFE06644`,
};

// ── 水：深空藍（底蘊積累 · 宇宙深層）──
export const SHUI: WuxingPalette = {
  element: '水', name: '深空藍',
  description: '宇宙深層 · 底蘊積累 · 暗藍爆發',
  abyss:  '#020510',
  void:   '#050C20',
  shadow: '#0D1A3A',
  core:   '#1A3570',
  base:   '#2455AA',
  bright: '#3B82F6',
  glow:   '#60A5FA',
  text:   '#93C5FD',
  gradient: `linear-gradient(135deg, #020510 0%, #050C20 40%, #0D1A3A 80%, #1A3570 100%)`,
  glowShadow: `0 0 24px #3B82F655, 0 0 60px #1A357033, inset 0 1px 0 #60A5FA33`,
};

// ── 中心對應五行 ──
export const CENTER_ELEMENT: Record<string, WuxingPalette> = {
  'workbench':       TU,
  'report-center':   SHUI,
  'dispatch-center': HUO,
  'announce-center': JIN,
  'hv-center':       TU,
  'line-center':     SHUI,
  'talent-center':   MU,
  'system-center':   JIN,
};

// ── 群組對應五行 ──
export const GROUP_ELEMENT: Record<string, WuxingPalette> = {
  '主選單':        TU,
  '每日核心流程':  TU,
  '高價成交爆發':  HUO,
  '女聲智慧播報':  JIN,
  'LINE群組轉傳':  SHUI,
  '業務作戰':      HUO,
  '系統管理':      JIN,
  '管理後台':      JIN,
};

// ── 統一設計 Token（所有頁面共用，禁止各頁自定義）──
export const UI = {
  cyan:   '#00d4ff',
  green:  '#00ff9c',
  gold:   '#f2c200',
  purple: '#c084fc',
  amber:  '#f59e0b',
  red:    '#ef4444',
  text:   '#e2e8f0',
  muted:  '#94a3b8',
  dim:    '#475569',
  bg:     '#020617',
  card:   'rgba(3,7,18,0.58)',
  border: 'rgba(0,212,255,0.12)',
  font:   '"Noto Sans TC","Microsoft JhengHei",system-ui,sans-serif' as string,
  mono:   '"Orbitron","Courier New",monospace' as string,
} as const;

// ── 全局深空科技 UI 常量 ──
export const EMPEROR_UI = {
  // 全局背景 — 量子深黑
  pageBg:     '#04070F',
  sidebarBg:  '#03050C',
  cardBg:     '#080D1A',
  cardBorder: '#0F1A30',

  // 品牌主色 — 電漿青藍軸
  brandGold:  '#00D4FF',     // 電漿青藍（品牌主色）
  brandGlow:  '#7DF9FF',     // 量子高光藍
  brandGreen: '#00FF9C',     // 神經電漿綠
  brandFire:  '#8B5CF6',     // 爆發量子紫

  // 文字層次
  textPrimary:   '#E8F4FF',    // 主文字 — 冷白
  textSecondary: '#7DF9FF',    // 副標題 — 量子藍
  textMuted:     '#4A7FA0',    // 輔助 — 深藍灰
  textDim:       '#1E3A5F',    // 最淡 — 深空藍

  // 分隔線 / 邊框
  borderMain:    '#0D1A30',
  borderAccent:  '#0F2A4A',
  borderGold:    'rgba(0,212,255,0.25)',
};

// ═══════════════════════════════════════════
// 3D 深度系統 Token — 全局統一立體語言 v12.0
// ═══════════════════════════════════════════
export const DEPTH = {
  // 卡片玻璃效果
  glass: {
    bg: 'linear-gradient(145deg, rgba(6,14,30,0.78), rgba(3,8,18,0.88))',
    blur: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(0,212,255,0.10)',
    shadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 1px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  // 深層卡片
  glassDeep: {
    bg: 'linear-gradient(145deg, rgba(3,6,16,0.90), rgba(2,4,12,0.95))',
    blur: 'blur(32px) saturate(200%)',
    border: '1px solid rgba(0,212,255,0.06)',
    shadow: '0 16px 48px rgba(0,0,0,0.8), 0 0 2px rgba(0,212,255,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  // 頂部高光條
  topHighlight: 'linear-gradient(90deg, transparent 5%, rgba(0,212,255,0.3) 30%, rgba(125,249,255,0.4) 50%, rgba(0,212,255,0.3) 70%, transparent 95%)',
} as const;
