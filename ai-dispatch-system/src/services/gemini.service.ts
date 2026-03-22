import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Employee } from '../data/mockData';
import type { MarketingSuggestion } from '../engine/trendEngine';

export interface ReportMetaDetection {
  reportDate: string;     // YYYY-MM-DD，空字串表示辨識失敗
  platformName: string;   // '奕心' | '民視' | '公司產品' | ''
  reportMode: string;     // '累積報表' | '單日報表' | ''
  dayOfWeek?: string;     // 例如：星期六、禮拜六
  timeRange?: string;     // 例如：17:02到16:30
  confidence: 'high' | 'low';
}

export interface ImageExtractResult {
  rawText: string;        // 從圖片擷取的完整原文
  meta: ReportMetaDetection;
  source: 'gemini-vision' | 'fallback';
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'MISSING_API_KEY');

// 預設使用的模型
const MODEL_NAME = 'gemini-2.5-flash';

// ── 本地 regex 辨識（不消耗 API）──
function localDetectMeta(raw: string): ReportMetaDetection {
  const text = raw;

  // ── 日期辨識（優先：結算日期 > 報表日期 > 完整格式 > 一般日期）──
  let reportDate = '';
  const datePattern = /(\d{1,2})[\/月\-](\d{1,2})[日號]?/g;

  // 策略 1：找「結算」關鍵字附近的日期
  const settleDateMatch = text.match(/(\d{1,2})[\/月\-](\d{1,2})[日號]?\s*結算/);
  const settleDateMatch2 = text.match(/結算[日期：:\s]*(\d{1,2})[\/月\-](\d{1,2})[日號]?/);
  // 策略 2：找「報表日期」格式
  const reportDateMatch = text.match(/報表[日期：:\s]*(\d{1,2})[\/月\-](\d{1,2})[日號]?/);
  // 策略 3：找完整格式 YYYY/MM/DD 或 YYYY-MM-DD
  const fullDateMatch = text.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);

  const bestMatch: RegExpMatchArray | null = settleDateMatch || settleDateMatch2 || reportDateMatch;

  if (bestMatch) {
    const mm = bestMatch[1]?.padStart(2, '0');
    const dd = bestMatch[2]?.padStart(2, '0');
    const y = new Date().getFullYear();
    if (mm && dd) reportDate = `${y}-${mm}-${dd}`;
  } else if (fullDateMatch) {
    // 完整年月日格式
    reportDate = `${fullDateMatch[1]}-${fullDateMatch[2].padStart(2, '0')}-${fullDateMatch[3].padStart(2, '0')}`;
  } else {
    // 回退：取所有日期，選最合理的
    const allDates: { m: string; d: string; idx: number }[] = [];
    let dm: RegExpExecArray | null;
    while ((dm = datePattern.exec(text)) !== null) {
      allDates.push({ m: dm[1], d: dm[2], idx: dm.index });
    }
    const reasonable = allDates.filter(d => {
      const mm = parseInt(d.m), dd = parseInt(d.d);
      return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31 && !(mm === 1 && dd === 1);
    });
    if (reasonable.length > 0) {
      const pick = reasonable[0];
      const y = new Date().getFullYear();
      reportDate = `${y}-${pick.m.padStart(2, '0')}-${pick.d.padStart(2, '0')}`;
    }
  }

  // 提取星期與時間範圍
  let dayOfWeek = '';
  const dayMatch = text.match(/(星期[一二三四五六日]|禮拜[一二三四五六日]|週[一二三四五六日])/);
  if (dayMatch) dayOfWeek = dayMatch[1];

  let timeRange = '';
  const timeMatch = text.match(/(\d{1,2}[:點]\d{1,2}分?(?:[\s~到至\-]*\d{1,2}[:點]\d{1,2}分?)?)/);
  if (timeMatch) timeRange = timeMatch[1];

  // ── 平台辨識（計數法 + 標題權重 + 別名支援）──
  let platformName = '';
  const platformCounts: { name: string; count: number }[] = [
    { name: '奕心', count: (text.match(/奕心/g) || []).length },
    { name: '民視', count: (text.match(/民視/g) || []).length },
    { name: '公司產品', count: (text.match(/公司產品|自有產品/g) || []).length },
  ];
  const headerLines = text.split('\n').slice(0, 5).join(' ');
  for (const p of platformCounts) {
    if (headerLines.includes(p.name)) p.count += 10;
  }
  // 別名加權：「自有產品」= 公司產品
  if (headerLines.includes('自有產品')) {
    platformCounts[2].count += 10;
  }
  const bestPlatform = platformCounts.filter(p => p.count > 0).sort((a, b) => b.count - a.count)[0];
  if (bestPlatform) platformName = bestPlatform.name;

  // ── 模式辨識（增強：標題行優先，支援更多說法）──
  let reportMode = '';
  const headerText = text.split('\n').slice(0, 3).join(' ');
  // 標題行優先判斷
  if (headerText.includes('累積')) reportMode = '累積報表';
  else if (headerText.match(/單日|今日|當日/)) reportMode = '單日報表';
  // 全文回退
  else if (text.includes('累積')) reportMode = '累積報表';
  else if (text.match(/單日|今日|當日/)) reportMode = '單日報表';

  const confidence =
    reportDate && platformName && reportMode ? 'high' : 'low';

  return { reportDate, platformName, reportMode, dayOfWeek, timeRange, confidence };
}

export const geminiService = {
  /** 用 AI 從日報原文自動辨識日期 / 平台 / 模式 */
  async extractReportMeta(rawText: string): Promise<ReportMetaDetection> {
    // 先跑本地辨識
    const local = localDetectMeta(rawText);

    // 本地高信心（三欄齊全）→ 直接回傳，省 API 額度
    if (local.confidence === 'high') return local;

    // 文字太短 or 無 API Key → 回傳本地結果
    if (rawText.trim().length < 30 || !apiKey) return local;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `
你是一個日報解析助手。從以下文字中擷取結算日期與相關欄位。

重要規則：
1. 日期請找「結算日期」，通常出現在「X/Y 結算」、「結算日期 X/Y」、「X月Y日結算」等位置。
2. 如果文字是一份「公告」或「派單」(含排名、建議、分析)，請從標題或開頭找結算日期，而非內文中隨意出現的日期。
3. 年份用 ${new Date().getFullYear()}。
4. 平台：看標題或內文出現最多的平台名稱，只能是 "奕心"、"民視" 或 "公司產品"。
5. 如果文字裡同時提到「累積」和「單日」，看哪個是主要模式（通常看標題）。

回傳 JSON（不要 markdown codeblock）：
{
  "reportDate": "YYYY-MM-DD",
  "platformName": "奕心" | "民視" | "公司產品" | "",
  "reportMode": "累積報表" | "單日報表" | "",
  "dayOfWeek": "星期X" | "禮拜X" | "",
  "timeRange": "HH:MM" | "HH:MM到HH:MM" | ""
}

原始文字：
${rawText.slice(0, 2000)}

直接輸出 JSON 物件，不要任何其他文字。`;
      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      // 合併策略：API 有值就用 API，沒有就保留 local 已偵測的結果
      return {
        reportDate: parsed.reportDate || local.reportDate,
        platformName: parsed.platformName || local.platformName,
        reportMode: parsed.reportMode || local.reportMode,
        dayOfWeek: parsed.dayOfWeek || local.dayOfWeek || '',
        timeRange: parsed.timeRange || local.timeRange || '',
        confidence: 'high',
      };
    } catch {
      return local;
    }
  },
  /**
   * 從圖片（截圖）中 OCR 辨識日報全文並自動擷取欄位
   * base64Data：純 base64 字串（不含 data:image/... 前綴）
   * mimeType：'image/png' | 'image/jpeg' | 'image/webp'
   */
  async extractFromImage(
    base64Data: string,
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
  ): Promise<ImageExtractResult> {
    const fallback: ImageExtractResult = {
      rawText: '',
      meta: { reportDate: '', platformName: '', reportMode: '', confidence: 'low' },
      source: 'fallback',
    };

    if (!apiKey) return fallback;

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      const prompt = `你是一個業績日報 OCR 助手。請完成以下兩件事：

1. 將圖片中的所有文字完整辨識並轉錄（保留換行與排版）。
2. 從文字中擷取以下欄位：
   - "reportDate"：日期，格式 YYYY-MM-DD，西元年 ${new Date().getFullYear()}，辨識不出填 ""
   - "platformName"：只能是 "奕心"、"民視" 或 "公司產品"，辨識不出填 ""
   - "reportMode"：只能是 "累積報表" 或 "單日報表"，辨識不出填 ""

請以如下 JSON 格式回傳（不要 markdown codeblock）：
{
  "rawText": "完整轉錄文字...",
  "reportDate": "2026-03-10",
  "platformName": "奕心",
  "reportMode": "累積報表"
}`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { mimeType, data: base64Data } },
      ]);

      const text = result.response.text().replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(text);
      const rawText: string = parsed.rawText ?? '';

      // 用 local regex 二次補強：API 漏掉的欄位由 regex 補上
      const localEnrich = rawText.length > 15 ? localDetectMeta(rawText) : null;

      return {
        rawText,
        meta: {
          reportDate: parsed.reportDate || localEnrich?.reportDate || '',
          platformName: parsed.platformName || localEnrich?.platformName || '',
          reportMode: parsed.reportMode || localEnrich?.reportMode || '',
          confidence: rawText.length > 20 ? 'high' : 'low',
        },
        source: 'gemini-vision',
      };
    } catch {
      return fallback;
    }
  },

  /**
   * 批次為員工生成「高價成交」與「行銷」分析與話術建議
   * 為了節省次數，透過將員工名單打包後一次交給 AI 去分析
   */
  async generateTeamSuggestions(employees: Employee[]): Promise<MarketingSuggestion[]> {
    if (!apiKey) {
      console.warn('Gemini API 金鑰未設定，回退至預設建議。');
      return employees.map(emp => ({
        name: emp.name,
        rank: emp.rank || 0,
        group: emp.group || '未分組',
        suggestion: `(模擬) 保持追單節奏，鞏固實收。`,
        pressure: `(模擬) 穩定推進，否則排名會掉。`,
        motivation: `(模擬) 再來一筆大單，排名馬上衝！`,
        improvement: `(模擬) 增加高客單價開口次數。`,
        course: `(模擬) 系統進階高價實戰班`,
        script: `(模擬) 請問您對於我們最新的升級方案有興趣嗎？`
      }));
    }

    try {
      const model = genAI.getGenerativeModel({ model: MODEL_NAME });
      
      const prompt = `
你是一位「兆櫃AI派單系統」的頂級 AI 督導總監，同時熟悉高單價追單、續單與銷售心理學。
現在我有一批當日結算的員工業績資料，我需要你依照每個人的數據表現，自動產生專屬的「行銷與派單督導建議」。
請回傳一個 **嚴格符合 JSON 陣列格式** 的結果，不要加上 markdown codeblock（不用 \`\`\`json 標籤），直接回傳陣列的字串。

**輸入員工資料 (JSON)**:
${JSON.stringify(employees.map(e => ({
  name: e.name, rank: e.rank, total: e.total, actual: e.actual, 
  followUps: e.followUps, renewals: e.renewals, group: e.group, aiScore: e.aiScore
})), null, 2)}

**輸出要求**：
請解析輸入的每個員工，並產生對應的輸出，陣列裡的每個物件需要包含以下屬性 (這幾個屬性必須都有)：
- "name": (字串) 員工姓名
- "rank": (數字) 目前名次
- "group": (字串) 分組 (從輸入讀取)
- "suggestion": (字串) 今日督導重點建議 (約20字，例如：「把續單加速轉實收，鞏固位置。」)
- "pressure": (字串) 給予的一句壓力喊話 (約15字)
- "motivation": (字串) 給予的一句激勵喊話 (約15字)
- "improvement": (字串) 具體行為改善建議 (約20字)
- "course": (字串) 推薦的一堂虛擬課程名稱 (約15字)
- "script": (字串) 提供他今天打電話用的一句實戰話術 (約30字)

請注意：
1. 分析必須準確跟著他們的業績與戰力分數調整。表現好的專注於高價大單，表現差的專注於基本開口或追單量。
2. 輸出的陣列長度必須跟輸入的員工數量完全一致。
3. 請直接輸出 JSON Array，不要包含任何開頭的解釋字語。
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // 嘗試解析 JSON (移除可能的 markdown tag)
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanText) as MarketingSuggestion[];
      
      // 驗證回傳的格式與筆數是否相符
      return parsedData;
      
    } catch (error) {
      console.error('Gemini 產生建議失敗:', error);
      throw error;
    }
  }
};
