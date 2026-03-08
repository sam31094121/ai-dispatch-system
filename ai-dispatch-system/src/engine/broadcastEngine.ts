// ==========================================
// 人工智慧女聲智慧播報系統 - 播報引擎
// 【強化升級版】專業女聲穿透力鎖死
// ==========================================
//
// 【永久鎖死原則】
// 收聽對象 = 女性行銷團隊
// 聲音定位 = 專業型 / 管理型 / 成交型 / 指令型
// 禁止風格 = 過甜/過嗲/撒嬌/稚嫩/飄忽/太軟/太尖/太虛
// 必要特質 = 成熟穩定/專業乾淨/清楚有力/溫和不柔弱/堅定不兇
// ==========================================

// ─── 型別定義 ───

export interface BroadcastStyle {
  id: string;
  name: string;
  scenario: string;
  voiceDesc: string;     // 聲音描述
  rhythmDesc: string;    // 節奏描述
  toneDesc: string;      // 語氣描述（新增）
  rate: number;          // 語速 (0.5~2.0)
  pitch: number;         // 音調 (0~2)
  volume: number;        // 音量 (0~1)
  pauseMs: number;       // 段落停頓（毫秒）
  numberPauseMs: number; // 數字前後停頓（新增）
  namePauseMs: number;   // 姓名前後停頓（新增）
  emphasisStrength: number; // 重點加強度 1~3（新增）
  enabled: boolean;
}

export interface BroadcastScript {
  id: number;
  date: string;
  type: string;
  title: string;
  originalContent: string;
  reformattedContent: string;  // 重排版（閱讀用）
  ttsContent: string;          // TTS 專用版（新增：數字/姓名拆開朗讀用）
  style: BroadcastStyle;
  emphasisSections: string[];
  qualityChecks: QualityCheck[]; // 品質檢查（新增）
}

export interface QualityCheck {
  item: string;
  pass: boolean;
  note: string;
}

export type PlaybackScene = '大聲播放' | '會議室' | '手機播放';

export interface PlaybackSuggestion {
  scene: PlaybackScene;
  volume: string;
  speed: string;
  pauseRule: string;
  mode: string;
  warnings: string[];  // 場景注意事項（新增）
}

// ─── 聲音品質規則（永久鎖死） ───

export const VOICE_RULES = {
  identity: '專業管理型女聲（非可愛/非娛樂/非陪伴）',
  target: '女性行銷團隊長時間收聽',
  required: ['成熟穩定', '專業乾淨', '清楚有力', '溫和不柔弱', '堅定不兇', '有節奏感', '有管理感', '有帶領感', '有收斂度', '高辨識度'],
  forbidden: ['過甜', '過嗲', '撒嬌感', '過度稚嫩', '過度飄忽', '太虛', '太薄', '太尖銳', '太軟弱', '無主導感'],
  penetration: ['咬字清楚', '句尾收音清楚', '重點字加強', '數字朗讀清晰', '姓名辨識度高', '名次穿透力', '金額明確'],
  tone: ['冷靜', '穩定', '清楚', '有掌控感', '有專業感', '結果導向', '有信任感', '有帶領感'],
} as const;

// ─── 5 種播報風格（升級版） ───

export const broadcastStyles: BroadcastStyle[] = [
  {
    id: 'formal', name: '派單公告模式', scenario: '派單公告、名次公告',
    voiceDesc: '沉穩、清晰、有穿透力、高辨識度',
    rhythmDesc: '中速偏穩、名次明確、順序分明、執行規則清楚',
    toneDesc: '冷靜穩定、結果導向、不急不拖',
    rate: 0.92, pitch: 1.0, volume: 1.0,
    pauseMs: 900, numberPauseMs: 500, namePauseMs: 400,
    emphasisStrength: 2, enabled: true,
  },
  {
    id: 'leader', name: '主管開會模式', scenario: '主管開會、團隊激勵',
    voiceDesc: '穩定、有力量、有壓場感、管理感',
    rhythmDesc: '中速、段落分明、重點加強、穿透力更強',
    toneDesc: '掌控全場、有帶領感、有壓迫但不兇',
    rate: 0.88, pitch: 1.02, volume: 1.0,
    pauseMs: 1100, numberPauseMs: 600, namePauseMs: 500,
    emphasisStrength: 3, enabled: true,
  },
  {
    id: 'highvalue', name: '高價成交喊話模式', scenario: '大單喊話、高價激勵',
    voiceDesc: '自信、堅定、有成交氣勢、有收口力量',
    rhythmDesc: '稍快但穩、節奏緊湊、收口用力',
    toneDesc: '主導感強、有信心、不退縮、帶結果',
    rate: 0.95, pitch: 1.05, volume: 1.0,
    pauseMs: 700, numberPauseMs: 400, namePauseMs: 350,
    emphasisStrength: 3, enabled: true,
  },
  {
    id: 'warm', name: '溫暖凝聚模式', scenario: '表揚公告、團隊凝聚',
    voiceDesc: '穩定、有鼓勵感、有支持感、專業不軟弱',
    rhythmDesc: '偏慢但有節奏、停頓充分、收尾清楚',
    toneDesc: '溫暖但專業、支持但不甜、穩定但有力',
    rate: 0.85, pitch: 0.98, volume: 0.95,
    pauseMs: 1200, numberPauseMs: 600, namePauseMs: 500,
    emphasisStrength: 1, enabled: true,
  },
  {
    id: 'training', name: '訓練教學模式', scenario: '話術訓練、技能講解',
    voiceDesc: '清晰、專注感、讓人容易吸收、段落分明',
    rhythmDesc: '中速、每句停頓、重點重複、不趕',
    toneDesc: '像懂帶人的女性訓練長、穩定有條理',
    rate: 0.88, pitch: 1.0, volume: 0.95,
    pauseMs: 1000, numberPauseMs: 500, namePauseMs: 450,
    emphasisStrength: 2, enabled: true,
  },
];

// ─── 數字播報轉換（核心強化） ───
// 把阿拉伯數字金額轉成中文朗讀格式

function numberToChinese(num: number): string {
  if (num === 0) return '零';
  const units = ['', '萬', '億'];
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const positions = ['', '十', '百', '千'];

  let result = '';
  let unitIndex = 0;
  let tempNum = num;

  while (tempNum > 0) {
    const section = tempNum % 10000;
    if (section > 0) {
      let sectionStr = '';
      let s = section;
      for (let i = 0; i < 4 && s > 0; i++) {
        const d = s % 10;
        if (d > 0) {
          sectionStr = digits[d] + positions[i] + sectionStr;
        } else if (sectionStr && !sectionStr.startsWith('零')) {
          sectionStr = '零' + sectionStr;
        }
        s = Math.floor(s / 10);
      }
      result = sectionStr + units[unitIndex] + result;
    }
    tempNum = Math.floor(tempNum / 10000);
    unitIndex++;
  }

  return result + '元';
}

// ─── 播報稿重排器（強化版） ───

export function reformatForBroadcast(raw: string): string {
  let text = raw;

  // 1. ｜ 換成換行
  text = text.replace(/[｜|]/g, '\n');
  // 2. 句號後換行
  text = text.replace(/。/g, '。\n');
  // 3. 【】內容獨立成行
  text = text.replace(/【([^】]+)】/g, '\n▶ $1：');
  // 4. 名次「N. 姓名」前加換行
  text = text.replace(/(\d+)\.\s*/g, '\n第 $1 名：');
  // 5. 數字/金額前後加停頓標記
  text = text.replace(/\$?([\d,]+)/g, ' ── $1 ── ');
  // 6. 清理
  text = text.replace(/\n{3,}/g, '\n\n');

  const lines = text.trim().split('\n').filter(l => l.trim());
  return lines.map(l => l.trim()).join('\n');
}

// ─── TTS 專用重排（數字轉中文、姓名斷句） ───

export function reformatForTTS(raw: string): string {
  let text = raw;

  // 移除 emoji
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');

  // ｜、│ 換成短停頓
  text = text.replace(/[｜|│]/g, '。');

  // 【】轉成語氣停頓
  text = text.replace(/【([^】]+)】/g, '，$1，');

  // 名次格式：「1. 王珍珠」→「第一名。王珍珠。」
  text = text.replace(/(\d+)\.\s*([^\s｜|]+)/g, (_m, num, name) => {
    const cn = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
      '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '二十一'];
    const idx = parseInt(num) - 1;
    return `第${cn[idx] ?? num}名。${name}。`;
  });

  // 金額轉中文：$231,100 → 二十三萬一千一百元
  text = text.replace(/\$?([\d,]+)/g, (_m, numStr) => {
    const num = parseInt(numStr.replace(/,/g, ''));
    if (isNaN(num) || num < 100) return numStr;
    return `，${numberToChinese(num)}，`;
  });

  // 清理多餘標點
  text = text.replace(/[，。]{2,}/g, '。');
  text = text.replace(/^\s*[，。]\s*/gm, '');

  return text;
}

// ─── 風格自動選擇 ───

export function autoSelectStyle(content: string, type: string): BroadcastStyle {
  if (type.includes('派單') || type.includes('名次') || type.includes('公告')) return broadcastStyles[0];
  if (type.includes('喊話') || type.includes('主管') || type.includes('激勵') || type.includes('開會')) return broadcastStyles[1];
  if (type.includes('高價') || type.includes('大單') || type.includes('成交')) return broadcastStyles[2];
  if (type.includes('表揚') || type.includes('凝聚')) return broadcastStyles[3];
  if (type.includes('訓練') || type.includes('話術') || type.includes('教學')) return broadcastStyles[4];

  // 從內容關鍵字
  if (content.includes('派單') || content.includes('名次')) return broadcastStyles[0];
  if (content.includes('喊話') || content.includes('激勵')) return broadcastStyles[1];
  if (content.includes('大單') || content.includes('高價')) return broadcastStyles[2];
  if (content.includes('訓練') || content.includes('話術')) return broadcastStyles[4];

  return broadcastStyles[0];
}

// ─── 品質檢查 ───

function runQualityChecks(ttsText: string, style: BroadcastStyle): QualityCheck[] {
  const checks: QualityCheck[] = [];

  // 數字斷句
  const hasRawNumbers = /\d{4,}/.test(ttsText);
  checks.push({ item: '數字朗讀清晰度', pass: !hasRawNumbers, note: hasRawNumbers ? '仍有未轉換的長數字' : '數字已轉中文朗讀' });

  // 姓名辨識
  const namePattern = /第.名。.+。/;
  checks.push({ item: '姓名辨識度', pass: namePattern.test(ttsText) || !ttsText.includes('第'), note: namePattern.test(ttsText) ? '姓名前有名次停頓' : '姓名格式正確' });

  // 語速範圍
  checks.push({ item: '語速適合度', pass: style.rate >= 0.8 && style.rate <= 1.05, note: `語速 ${style.rate}（建議 0.8~1.05）` });

  // 穿透力
  checks.push({ item: '穿透力設定', pass: style.volume >= 0.9, note: `音量 ${style.volume}（專業播報需 ≥ 0.9）` });

  // 段落停頓
  checks.push({ item: '段落停頓充分', pass: style.pauseMs >= 700, note: `停頓 ${style.pauseMs}ms（建議 ≥ 700ms）` });

  // 重點加強
  checks.push({ item: '重點加強度', pass: style.emphasisStrength >= 2, note: `強度 ${style.emphasisStrength}/3` });

  return checks;
}

// ─── 生成播報稿 ───

let scriptIdCounter = 1;

export function generateBroadcastScript(
  rawContent: string, type: string, title: string, date?: string,
): BroadcastScript {
  const style = autoSelectStyle(rawContent, type);
  const reformatted = reformatForBroadcast(rawContent);
  const ttsContent = reformatForTTS(rawContent);

  const emphasisSections = reformatted
    .split('\n')
    .filter(l => l.trim().startsWith('▶'))
    .map(l => l.replace('▶ ', ''));

  const qualityChecks = runQualityChecks(ttsContent, style);

  return {
    id: scriptIdCounter++,
    date: date ?? new Date().toLocaleDateString('zh-TW'),
    type, title,
    originalContent: rawContent,
    reformattedContent: reformatted,
    ttsContent,
    style,
    emphasisSections,
    qualityChecks,
  };
}

// ─── 播放建議（強化版） ───

export function getPlaybackSuggestion(script: BroadcastScript, scene: PlaybackScene): PlaybackSuggestion {
  switch (scene) {
    case '大聲播放':
      return {
        scene, volume: '最大（不破音）', speed: '中速偏穩',
        pauseRule: '段落間長停頓（1.1 秒）、數字前後各停 0.5 秒',
        mode: '全場廣播版（穿透力最強）',
        warnings: ['確認喇叭不會破音', '重點句音量保持穩定', '前後段落落差不能過大'],
      };
    case '會議室':
      return {
        scene, volume: '高（清晰穩定）', speed: '中速',
        pauseRule: '段落間中停頓（0.9 秒）、姓名前停 0.4 秒',
        mode: '會議室清晰版（管理感）',
        warnings: ['確保後排也聽得清楚', '數字和金額要更慢'],
      };
    case '手機播放':
      return {
        scene, volume: '中（字字清楚）', speed: '中速偏慢',
        pauseRule: '段落間短停頓（0.7 秒）、不黏字',
        mode: '手機耳機版（專注吸收）',
        warnings: ['每個字必須分開', '不能黏字'],
      };
  }
}

// ─── 瀏覽器 TTS 播放（專業女聲） ───

export function speakText(
  text: string,
  style: BroadcastStyle,
  onEnd?: () => void,
): SpeechSynthesisUtterance | null {
  if (!('speechSynthesis' in window)) return null;
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // 選擇中文女聲（優先專業型）
  const voices = window.speechSynthesis.getVoices();
  // 優先：Microsoft 系列中文女聲（較成熟穩定）
  const preferredNames = ['Xiaoxiao', 'Yunxi', 'HsiaoChen', 'HsiaoYu', 'Mei-Jia', 'Hanhan'];
  let selectedVoice = voices.find(v =>
    (v.lang.startsWith('zh') || v.lang.startsWith('cmn')) &&
    preferredNames.some(n => v.name.includes(n))
  );
  if (!selectedVoice) {
    selectedVoice = voices.find(v =>
      (v.lang.startsWith('zh-TW') || v.lang === 'zh_TW') &&
      (v.name.includes('Female') || v.name.includes('女'))
    );
  }
  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('zh') || v.lang.startsWith('cmn'));
  }
  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.lang = 'zh-TW';
  utterance.rate = style.rate;
  utterance.pitch = style.pitch;
  utterance.volume = style.volume;

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}
