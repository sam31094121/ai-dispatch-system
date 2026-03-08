// ==========================================
// 人工智慧 LINE 群組轉傳系統 - 格式轉換引擎
// 任何系統內容 → 5 版 LINE 可貼格式
// ==========================================
//
// 【永久鎖死】
// 所有輸出 → 可直接複製貼到 LINE 公司群組
// 結尾固定 → 看完請回 +1。
// 格式 → 分段清楚/重點前置/數字獨立/名單分行
// 語氣 → 專業/清楚/直接/有管理感/有執行感
// ==========================================

// ─── 型別定義 ───

export type LineVersion = 'full' | 'concise' | 'ultra' | 'manager' | 'broadcast';

export interface LineFormatResult {
  version: LineVersion;
  label: string;
  desc: string;
  content: string;
}

export interface LineConvertInput {
  title: string;
  type: string;        // 派單公告/主管喊話/業績排名/訓練通知/高價成交...
  rawContent: string;
}

// ─── 結尾模板（永久鎖死） ───

const ENDINGS = {
  full: '以上為今日統一執行內容，請全員確認。\n看完請回 +1。',
  concise: '今天照此執行。\n看完請回 +1。',
  ultra: '看完請回 +1。',
  manager: '今日起照表執行，不得跳位，不得自行更改。\n看完請回 +1。',
  broadcast: '以上為今日正式執行內容。\n請全員確認。\n看完請回，加一。',
};

// ─── 內容萃取（從雜亂原文取出結構） ───

function extractStructure(raw: string): {
  headline: string;
  keyPoints: string[];
  rankings: string[];
  rules: string[];
  numbers: string[];
} {
  const lines = raw.split(/[\n｜|]/).map(l => l.trim()).filter(Boolean);

  const headline = lines[0] || '';
  const keyPoints: string[] = [];
  const rankings: string[] = [];
  const rules: string[] = [];
  const numbers: string[] = [];

  for (const line of lines) {
    // 名次行
    if (/^\d+[\.\、]/.test(line) || /^第\s*\d/.test(line)) {
      rankings.push(line);
      continue;
    }
    // 規則/指令行
    if (line.includes('必須') || line.includes('不得') || line.includes('規則') ||
        line.includes('禁止') || line.includes('執行') || line.includes('不可') ||
        line.includes('照表') || line.includes('統一')) {
      rules.push(line);
      continue;
    }
    // 含數字金額
    if (/[\$\d,]{4,}/.test(line) || /萬|千|百/.test(line)) {
      numbers.push(line);
      continue;
    }
    // 其他作為重點
    if (line.length > 3 && line !== headline) {
      keyPoints.push(line);
    }
  }

  return { headline, keyPoints, rankings, rules, numbers };
}

// ─── 清理格式 ───

function cleanForLine(text: string): string {
  let t = text;
  // 移除 emoji 過多的情況（保留第一個）
  t = t.replace(/【([^】]+)】/g, '$1');
  // 移除多餘空行
  t = t.replace(/\n{3,}/g, '\n\n');
  // 移除行首空白
  t = t.replace(/^\s+/gm, '');
  return t.trim();
}

// ─── 格式化名單（分行清楚） ───

function formatRankings(rankings: string[]): string {
  return rankings.map(r => {
    // 統一格式：序號. 姓名 ｜ 指標
    let clean = r.replace(/【/g, '').replace(/】/g, '');
    return clean;
  }).join('\n');
}

// ═══════════════════════════════════════
// 五版格式生成
// ═══════════════════════════════════════

function generateFull(input: LineConvertInput, struct: ReturnType<typeof extractStructure>): string {
  const parts: string[] = [];

  parts.push(`【${input.title}】`);
  parts.push('');

  // 重點結論（取前 2 句）
  if (struct.keyPoints.length > 0) {
    parts.push(struct.keyPoints.slice(0, 2).join('\n'));
    parts.push('');
  }

  // 數據
  if (struct.numbers.length > 0) {
    parts.push('📊 重點數據：');
    struct.numbers.forEach(n => parts.push(n));
    parts.push('');
  }

  // 名單
  if (struct.rankings.length > 0) {
    parts.push('📋 名單／順序：');
    parts.push(formatRankings(struct.rankings));
    parts.push('');
  }

  // 執行規則
  if (struct.rules.length > 0) {
    parts.push('⚡ 執行規則：');
    struct.rules.forEach((r, i) => parts.push(`${i + 1}. ${r}`));
    parts.push('');
  }

  // 其他重點
  if (struct.keyPoints.length > 2) {
    parts.push('📌 補充說明：');
    struct.keyPoints.slice(2, 6).forEach(p => parts.push(`• ${p}`));
    parts.push('');
  }

  parts.push('───────────────');
  parts.push(ENDINGS.full);

  return cleanForLine(parts.join('\n'));
}

function generateConcise(input: LineConvertInput, struct: ReturnType<typeof extractStructure>): string {
  const parts: string[] = [];

  parts.push(`【${input.title}】`);
  parts.push('');

  // 一句結論
  if (struct.keyPoints.length > 0) {
    parts.push(struct.keyPoints[0]);
    parts.push('');
  }

  // 名單（前 5 名）
  if (struct.rankings.length > 0) {
    parts.push(formatRankings(struct.rankings.slice(0, 5)));
    parts.push('');
  }

  // 數字（前 3 筆）
  if (struct.numbers.length > 0) {
    struct.numbers.slice(0, 3).forEach(n => parts.push(n));
    parts.push('');
  }

  // 規則（前 3 條）
  if (struct.rules.length > 0) {
    struct.rules.slice(0, 3).forEach((r, i) => parts.push(`${i + 1}. ${r}`));
    parts.push('');
  }

  parts.push(ENDINGS.concise);

  return cleanForLine(parts.join('\n'));
}

function generateUltra(input: LineConvertInput, struct: ReturnType<typeof extractStructure>): string {
  const parts: string[] = [];

  parts.push(`【${input.title}】`);
  parts.push('');
  parts.push('今天重點如下：');

  // 萃取最重要的 3 點
  const topItems = [
    ...struct.rankings.slice(0, 2),
    ...struct.keyPoints.slice(0, 1),
    ...struct.numbers.slice(0, 1),
    ...struct.rules.slice(0, 1),
  ].slice(0, 3);

  topItems.forEach((item, i) => parts.push(`${['一', '二', '三'][i]}、${item}`));

  parts.push('');
  parts.push(ENDINGS.ultra);

  return cleanForLine(parts.join('\n'));
}

function generateManager(input: LineConvertInput, struct: ReturnType<typeof extractStructure>): string {
  const parts: string[] = [];

  parts.push(`【${input.title}】`);
  parts.push('');
  parts.push('今天這份內容為正式執行版本。');
  parts.push('請依照順序、規則、內容直接執行。');
  parts.push('');

  parts.push('重點如下：');

  // 名單
  if (struct.rankings.length > 0) {
    parts.push(formatRankings(struct.rankings.slice(0, 5)));
    parts.push('');
  }

  // 數據
  if (struct.numbers.length > 0) {
    struct.numbers.slice(0, 3).forEach(n => parts.push(n));
    parts.push('');
  }

  // 執行規則
  if (struct.rules.length > 0) {
    struct.rules.forEach((r, i) => parts.push(`${i + 1}. ${r}`));
    parts.push('');
  }

  // 加強壓力
  if (struct.keyPoints.length > 0) {
    parts.push(struct.keyPoints[0]);
    parts.push('');
  }

  parts.push(ENDINGS.manager);

  return cleanForLine(parts.join('\n'));
}

function generateBroadcast(input: LineConvertInput, struct: ReturnType<typeof extractStructure>): string {
  const parts: string[] = [];
  const nums = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

  parts.push(`【${input.title}】`);
  parts.push('');
  parts.push('今天重點公告如下。');
  parts.push('');

  // 所有重要內容拆成段落
  const allItems = [
    ...struct.keyPoints.slice(0, 2),
    ...struct.rankings.slice(0, 3).map(r => `名單：${r}`),
    ...struct.numbers.slice(0, 2),
    ...struct.rules.slice(0, 2),
  ].slice(0, 5);

  allItems.forEach((item, i) => {
    parts.push(`第${nums[i]}，`);
    parts.push(`${item}。`);
    parts.push('');
  });

  parts.push(ENDINGS.broadcast);

  return cleanForLine(parts.join('\n'));
}

// ═══════════════════════════════════════
// 主要轉換函式
// ═══════════════════════════════════════

export function convertToLineFormats(input: LineConvertInput): LineFormatResult[] {
  const struct = extractStructure(input.rawContent);

  return [
    { version: 'full', label: '📋 完整版', desc: '完整公告，主管正式轉傳', content: generateFull(input, struct) },
    { version: 'concise', label: '💬 群組精簡版', desc: 'LINE 群組快速閱讀', content: generateConcise(input, struct) },
    { version: 'ultra', label: '⚡ 超短版', desc: '20 秒內看完', content: generateUltra(input, struct) },
    { version: 'manager', label: '👊 主管威壓版', desc: '主管轉傳，加強執行力', content: generateManager(input, struct) },
    { version: 'broadcast', label: '🎙️ 朗讀播放版', desc: '直接拿去大聲朗讀', content: generateBroadcast(input, struct) },
  ];
}

// ─── 預設場景範本 ───

export const lineScenarios = [
  '派單公告', '業績排名', '主管開會通知', '主管壓力喊話',
  '溫暖凝聚喊話', '訓練通知', '高價成交提醒', '每人一句建議',
  '超短公告', '可朗讀公告',
] as const;
