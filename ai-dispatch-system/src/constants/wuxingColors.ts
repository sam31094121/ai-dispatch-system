// ════════════════════════════════════════════════════
// 帝王能量聚財色彩系統 — 全球大數據 AI 深淺自動變化
// 核心哲學：黃金本體在發熱，不俗亮，是有權威的財氣爆發
// ════════════════════════════════════════════════════

// ── 帝王能量核心色彩原典 ──
export const EMPEROR = {
  // 黑曜金底 — 所有能量的根基，萬物起源
  obsidian:    '#0A0A0A',
  obsidianMid: '#111111',
  obsidianSurf:'#1A1A1A',

  // 帝王濃金 — 尊貴、聚財、厚重穩定
  imperialGold: '#D4AF37',

  // 琉璃亮金 — 金的高光層次、發光質感
  glazedGold:   '#F8E08E',

  // 帝王綠 — 財氣活化、高級生命力
  imperialGreen: '#0F7A4A',

  // 火焰琥珀橘 — 點燃能量、爆發戰力
  flameAmber:   '#D96C06',

  // 輔助深色層
  deepGold:    '#8B7520',
  midGold:     '#B8941E',
  softGold:    '#EDD97A',
  ashGold:     '#5A4D18',
  warmBlack:   '#181410',
} as const;

// ── AI 自動深淺變化 — 全球大數據色彩計算 ──
// 原理：以黑曜金底為基底，疊加帝王色彩的不同透明度層次
// 深層（bg/容器）→ 中層（邊框/陰影）→ 表層（文字/高光）
function makeGoldShades(hex: string) {
  return {
    // 最深層 — 接近純黑，帶色調記憶
    abyss:  blendWithBlack(hex, 0.04),
    // 容器底色 — 黑曜中透出色調
    void:   blendWithBlack(hex, 0.10),
    // 邊框/分隔 — 約 20% 色彩濃度
    shadow: blendWithBlack(hex, 0.22),
    // 核心基色 — 40% 飽和
    core:   blendWithBlack(hex, 0.45),
    // 主體色 — 原色 80%
    base:   blendWithBlack(hex, 0.80),
    // 亮色 — 原色 + 微白提亮
    bright: hex,
    // 輝光 — 原色 + 更多白
    glow:   lighten(hex, 0.25),
    // 文字色（深底上可讀）
    text:   lighten(hex, 0.45),
  };
}

// ── 工具函式：黑色混合（模擬大數據深淺演算法）──
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

// ── 五行帝王能量色板 ──
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
    // 漸層：從黑曜底 → 色調暗層 → 核心色（三段AI深淺）
    gradient: `linear-gradient(135deg, ${EMPEROR.warmBlack} 0%, ${s.void} 40%, ${s.shadow} 80%, ${s.core} 100%)`,
    glowShadow: `0 0 24px ${primary}44, 0 0 60px ${primary}22, inset 0 1px 0 ${secondary}33`,
  };
}

// ── 土：帝王濃金（首選 · 主體 · 聚財核心）──
export const TU: WuxingPalette = makePalette(
  '土', '帝王濃金',
  '尊貴厚重 · 黃金財庫 · 權威爆發',
  EMPEROR.imperialGold,
  EMPEROR.glazedGold,
);

// ── 木：帝王綠（財氣活化 · 高級生命力）──
export const MU: WuxingPalette = makePalette(
  '木', '帝王綠',
  '財氣活水 · 龍脈生機 · 高端尊貴',
  EMPEROR.imperialGreen,
  EMPEROR.glazedGold,
);

// ── 火：火焰琥珀橘（爆發點燃 · 戰力衝擊）──
export const HUO: WuxingPalette = makePalette(
  '火', '火焰琥珀橘',
  '爆發戰力 · 烈火衝擊 · 財氣點燃',
  EMPEROR.flameAmber,
  EMPEROR.imperialGold,
);

// ── 金：琉璃亮金（高光層次 · 鏡面精準）──
export const JIN: WuxingPalette = {
  element: '金', name: '琉璃亮金',
  description: '高光層次 · 鏡面精準 · 金屬尊貴',
  abyss:  '#0E0D08',
  void:   '#1C1A0F',
  shadow: '#3A360F',
  core:   '#7A6F20',
  base:   '#C8A830',
  bright: EMPEROR.glazedGold,
  glow:   lighten(EMPEROR.glazedGold, 0.3),
  text:   lighten(EMPEROR.glazedGold, 0.5),
  gradient: `linear-gradient(135deg, ${EMPEROR.warmBlack} 0%, #1C1A0F 40%, #3A360F 80%, #7A6F20 100%)`,
  glowShadow: `0 0 24px ${EMPEROR.glazedGold}55, 0 0 60px ${EMPEROR.imperialGold}22, inset 0 1px 0 ${EMPEROR.glazedGold}44`,
};

// ── 水：黑曜深金（底蘊力量 · 深層積累）──
export const SHUI: WuxingPalette = {
  element: '水', name: '黑曜深金',
  description: '深層積累 · 底蘊爆發 · 暗潮涌動',
  abyss:  '#070706',
  void:   '#0F0E09',
  shadow: '#221F0E',
  core:   '#3D3818',
  base:   '#5A5020',
  bright: '#8A7A30',
  glow:   '#AA9840',
  text:   '#C8B060',
  gradient: `linear-gradient(135deg, #070706 0%, #0F0E09 40%, #221F0E 80%, #3D3818 100%)`,
  glowShadow: `0 0 24px #8A7A3055, 0 0 60px #5A502033, inset 0 1px 0 #8A7A3033`,
};

// ── 中心對應五行 ──
export const CENTER_ELEMENT: Record<string, WuxingPalette> = {
  'workbench':       TU,    // 每日業績樞紐 → 土（帝王濃金·核心聚財）
  'report-center':   SHUI,  // 業績輸入審計 → 水（黑曜深金·底層積累）
  'dispatch-center': HUO,   // 軍團派單中心 → 火（火焰琥珀·爆發作戰）
  'announce-center': JIN,   // 公告播報中心 → 金（琉璃亮金·精準傳達）
  'hv-center':       TU,    // 高價成交中心 → 土（帝王濃金·招財磁場）
  'line-center':     SHUI,  // LINE 轉傳中心 → 水（黑曜深金·流通傳遞）
  'talent-center':   MU,    // 人才管理中心 → 木（帝王綠·培育生長）
  'system-center':   JIN,   // 系統設定中心 → 金（琉璃亮金·結構精密）
};

// ── 群組對應五行 ──
export const GROUP_ELEMENT: Record<string, WuxingPalette> = {
  '每日核心流程': TU,   // 土 — 帝王濃金，聚財核心啟動
  '業務作戰':     HUO,  // 火 — 火焰琥珀橘，爆發衝鋒
  '管理後台':     JIN,  // 金 — 琉璃亮金，精密結構管理
};

// ── 全局帝王能量 UI 常量 ──
export const EMPEROR_UI = {
  // 全局背景 — 黑曜金底
  pageBg:     EMPEROR.obsidianMid,
  sidebarBg:  EMPEROR.obsidian,
  cardBg:     '#161410',
  cardBorder: '#2A2416',

  // 帝王金光流 — 品牌主色
  brandGold:  EMPEROR.imperialGold,
  brandGlow:  EMPEROR.glazedGold,
  brandGreen: EMPEROR.imperialGreen,
  brandFire:  EMPEROR.flameAmber,

  // 文字層次
  textPrimary:   EMPEROR.glazedGold,   // 主標題
  textSecondary: EMPEROR.imperialGold, // 副標題
  textMuted:     EMPEROR.deepGold,     // 輔助說明
  textDim:       EMPEROR.ashGold,      // 最淡

  // 分隔線 / 邊框
  borderMain:    '#2A2416',
  borderAccent:  '#4A3C18',
  borderGold:    `${EMPEROR.imperialGold}55`,
};
