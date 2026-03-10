import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Employee } from '../data/mockData';
import type { MarketingSuggestion } from '../engine/trendEngine';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'MISSING_API_KEY');

// 預設使用的模型
const MODEL_NAME = 'gemini-2.5-flash';

export const geminiService = {
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
你是一位「人工智慧商業帝國系統」的頂級 AI 督導總監，同時熟悉高單價追單、續單與銷售心理學。
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
