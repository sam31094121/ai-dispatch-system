// ==========================================
// 高價成交爆發系統 - Mock 數據
// 話術素材庫 + 客戶攻單機會 + 訓練任務
// ==========================================

export interface ScriptTemplate {
  id: number;
  type: string;      // 話術類型
  title: string;
  clientType: string;
  scenario: string;
  content: string;
  strength: '高' | '中' | '低';
  enabled: boolean;
}

export interface TrainingTemplate {
  weaknessType: string;
  subject: string;
  content: string;
  simulation: string;
  clientType: string;
}

// ─── 話術素材庫（5 類 × 3 條） ───
export const scriptLibrary: ScriptTemplate[] = [
  // 價值型開口
  { id: 1, type: '價值型開口', title: '高價值開口一號', clientType: '高價值客戶', scenario: '第一次高價開口', content: '這不是單純多花錢，而是一次把效果、品質、穩定度直接拉上來。您花同樣的時間，拿到的結果完全不同。', strength: '高', enabled: true },
  { id: 2, type: '價值型開口', title: '高價值開口二號', clientType: '猶豫型客戶', scenario: '客戶嫌貴時', content: '我理解您的考量。但真正的差距不是價格，而是您用了之後三個月的效果差異。便宜的方案要做三次才到位，這個一次就到。', strength: '高', enabled: true },
  { id: 3, type: '價值型開口', title: '新客開口話術', clientType: '新客戶', scenario: '初次接觸', content: '很多客戶一開始也覺得這個方案偏高，但用過之後回購率超過七成，因為效果是看得見的。', strength: '中', enabled: true },

  // 主導型收口
  { id: 4, type: '主導型收口', title: '主導收口一號', clientType: '高價值客戶', scenario: '報價後猶豫', content: '真正差距不是差幾千，而是最後效果能不能一次做到位。我幫您直接鎖定這個方案，今天處理完最省時間。', strength: '高', enabled: true },
  { id: 5, type: '主導型收口', title: '限時收口話術', clientType: '猶豫型客戶', scenario: '客戶要再想想', content: '這個方案目前還有保留名額，但我沒辦法幫您保留太久。如果覺得方向對，今天先確認是最好的時機。', strength: '高', enabled: true },
  { id: 6, type: '主導型收口', title: '穩定收口話術', clientType: '回撥客戶', scenario: '二次回撥', content: '上次跟您聊的方案您考慮得怎麼樣？很多跟您情況類似的客戶後來都選了這個，效果回饋都很好。', strength: '中', enabled: true },

  // 高價值成交
  { id: 7, type: '高價值成交', title: '價值堆疊話術', clientType: '高價值客戶', scenario: '成交前最後推', content: '您選這個方案，等於同時解決了品質、穩定度跟後續維護三個問題。算下來其實是最省的選擇。', strength: '高', enabled: true },
  { id: 8, type: '高價值成交', title: '效果對比話術', clientType: '比價型客戶', scenario: '客戶拿別家比', content: '單看價格確實有差，但您可以問問看用過兩邊的人，效果差距遠遠不是這個價差能比的。', strength: '中', enabled: true },
  { id: 9, type: '高價值成交', title: 'VIP 成交話術', clientType: 'VIP 客戶', scenario: '老客戶升級', content: '以您之前的使用經驗，您應該最清楚效果的差異。升級方案不只是加量，而是整個品質都拉到另一個層次。', strength: '高', enabled: true },

  // 續單放大
  { id: 10, type: '續單放大', title: '續單升級話術', clientType: '續單客戶', scenario: '續單時提升客單價', content: '既然效果您已經確認了，這次直接升級到完整方案，不用分兩次處理，一次到位更划算。', strength: '高', enabled: true },
  { id: 11, type: '續單放大', title: '續單加購話術', clientType: '續單客戶', scenario: '續單時加購', content: '這次續單的同時，我幫您搭一個加購方案，兩個一起走比分開買省將近兩成。', strength: '中', enabled: true },
  { id: 12, type: '續單放大', title: '續單鎖定話術', clientType: '續單客戶', scenario: '續單收口', content: '您上次用的效果很好，這次我直接幫您延續同一個規格，數量我先幫您鎖好。', strength: '中', enabled: true },

  // 追單回收
  { id: 13, type: '追單回收', title: '追單破冰話術', clientType: '流失客戶', scenario: '追回擱置客戶', content: '上次跟您聊到一半沒繼續，我這邊重新整理了一個更適合您的方案，只需要兩分鐘幫您說明。', strength: '中', enabled: true },
  { id: 14, type: '追單回收', title: '追單急迫話術', clientType: '猶豫型客戶', scenario: '多次未成交', content: '這個方案下週就要調價了，如果方向確定的話，今天處理是最好的時機。', strength: '高', enabled: true },
  { id: 15, type: '追單回收', title: '追單溫和話術', clientType: '冷客戶', scenario: '長時間未聯繫', content: '好久沒跟您聯繫了，最近我們有一個新的方案我覺得特別適合您，想簡單跟您分享一下。', strength: '低', enabled: true },
];

// ─── 模擬客戶攻單名單 ───
export const mockCustomerOpportunities = [
  { clientName: '陳先生', closeProbability: 0.78, repurchaseProbability: 0.66, predictedOrderValue: 68000, isBigDealChance: true, bestEmployee: '王珍珠', bestTimeSlot: '上午 10:00-11:30', suggestion: '優先打高價值成交，直接報最高方案' },
  { clientName: '林太太', closeProbability: 0.72, repurchaseProbability: 0.81, predictedOrderValue: 45000, isBigDealChance: true, bestEmployee: '王梅慧', bestTimeSlot: '下午 14:00-15:00', suggestion: '續單客戶放大，搭配加購方案' },
  { clientName: '張小姐', closeProbability: 0.65, repurchaseProbability: 0.43, predictedOrderValue: 52000, isBigDealChance: true, bestEmployee: '馬秋香', bestTimeSlot: '上午 09:30-10:30', suggestion: '新客高價開口，價值先講滿' },
  { clientName: '王先生', closeProbability: 0.58, repurchaseProbability: 0.72, predictedOrderValue: 38000, isBigDealChance: false, bestEmployee: '李玲玲', bestTimeSlot: '下午 15:00-16:00', suggestion: '回撥客戶穩定收口' },
  { clientName: '劉太太', closeProbability: 0.82, repurchaseProbability: 0.90, predictedOrderValue: 72000, isBigDealChance: true, bestEmployee: '王珍珠', bestTimeSlot: '上午 11:00-12:00', suggestion: 'VIP 客戶升級方案，直接攻' },
];

// ─── 訓練任務模板 ───
export const trainingTemplates: TrainingTemplate[] = [
  { weaknessType: '大單開口能力不足', subject: '高價開口強化訓練', content: '練習在前 30 秒內報出高價方案，不用先提低價。先報價值再報價格。', simulation: '模擬情境：客戶問「最便宜的方案多少？」你必須先回答價值再回答價格。', clientType: '新客戶' },
  { weaknessType: '收口強度不足', subject: '高價收口強化訓練', content: '報價後停三秒，不要急著補話。讓客戶消化，再用確認句收口。', simulation: '模擬情境：報完價格後客戶沉默，你必須等待不主動降價。', clientType: '猶豫型客戶' },
  { weaknessType: '高價膽量偏低', subject: '膽量突破訓練', content: '今天每通電話都練習至少報一次最高方案。不管結果如何，只練開口。', simulation: '模擬情境：客戶說「太貴了」，你必須用價值回應而不是降價。', clientType: '所有客戶' },
  { weaknessType: '價格承壓能力不足', subject: '承壓對話訓練', content: '客戶殺價時不要直接答應，先問「您覺得什麼價格合理？」再回應。', simulation: '模擬情境：客戶說「別家比你便宜兩千」，你必須用效果差異回應。', clientType: '比價型客戶' },
  { weaknessType: '拒絕處理能力不足', subject: '拒絕轉化訓練', content: '把「不要」轉成「還沒發現需要」。不是被拒絕，是還沒講到對的點。', simulation: '模擬情境：客戶說「不需要」、「目前不考慮」，你必須找到一個切入點繼續。', clientType: '冷客戶' },
];
