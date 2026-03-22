import type { RankedMember } from './rankService.js';

export interface AdviceOutput {
  rank: number;
  name: string;
  advice: string;
}

// ── 輔助函式：轉換金額為萬為單位 ──
function toWan(amount: number): string {
  // 除以 10000，Javascript 會自動依照有沒有小數點顯示
  return (amount / 10000).toString();
}

/**
 * 22 位名次專屬的 AI 大數據點評模板
 * 動態灌入: 續單金額 (萬)、追續成交數、與前後方的業績差距
 */
const adviceTemplates: Record<number, (m: RankedMember, prev?: RankedMember, next?: RankedMember) => string> = {
  1: (m) => `AI 大數據顯示你仍穩居第一，建議把【續單】${toWan(m.merged.followAmount)}萬持續往深處收，優先吃高命中高價值名單；現在整隊最高點就是你，前面沒人擋、後面所有人都在追；你今天再補一筆大單，第一名不只是守住，是直接再把差距拉開。`,
  2: (m) => `AI 大數據判讀你目前是最強追趕型選手之一，建議把【追續】${m.merged.followDeals}和【續單】${toWan(m.merged.followAmount)}萬做成連續落袋；你現在雖然第 2，但第一名差距還在，後面第 3 也咬得很近；你今天只要再爆一筆，前二會更穩，甚至能直接逼近榜首。`,
  3: (m) => `AI 大數據顯示你的續單承載力非常強，建議把【續單】${toWan(m.merged.followAmount)}萬做滿，優先轉成真正【實收】；你現在第 3 不是弱，是正卡在最激烈纏鬥區，一鬆就掉、一衝就升；你今天只要補一筆漂亮大單，第 2 名甚至更前面都能重排。`,
  4: (m) => `AI 大數據判讀你屬於高質量穩定收口型，建議把【續單】${toWan(m.merged.followAmount)}萬加快轉【實收】，不要讓大錢停在名單上；你現在卡在前四核心區，進一步很快，退一步也很快；你今天只要補一筆高客單，前三立刻洗牌。`,
  5: (m) => `AI 大數據顯示你本輪正式上升到前五，建議把【續單】${toWan(m.merged.followAmount)}萬和【追續】${m.merged.followDeals}做出更高兌現率；你現在已經進入主力核心區，這種位置最怕只站上來、沒站穩；你今天再補一筆，前四就會開始感受到你。`,
  6: (m) => `AI 大數據判讀你仍在主力邊緣高壓帶，建議把【續單】${toWan(m.merged.followAmount)}萬守穩，再把【追續】${m.merged.followDeals}集中收口；你現在與前五差距不大，但後面也有人貼近，不能只守不攻；你今天只要補一筆，前五距離會直接縮短。`,
  7: (m) => `AI 大數據顯示你本輪屬於最大跳升型選手之一，建議把【續單】${toWan(m.merged.followAmount)}萬繼續做厚，優先把高機率名單全部變現；你現在已經衝進前段，最怕停住後被反超；你今天再收一筆，前六前五都會開始看到你。`,
  8: (m) => `AI 大數據判讀你目前屬於高量穩收型，建議把【續單】${toWan(m.merged.followAmount)}萬和現有名單整理成連續補收節奏；你現在不是沒量，而是最怕有量沒全收；你今天再補一筆，前七位置會更穩，前段也會更接近。`,
  9: (m) => `AI 大數據顯示你仍然靠公司產品盤撐住前段位置，建議把【續單】${toWan(m.merged.followAmount)}萬守住並再擴大，不要只停在原地；你現在位置有優勢，但若不主動擴張，很容易被後面慢慢貼近；你今天只要再收一筆，前八甚至前七都還有機會。`,
  10: (m) => `AI 大數據判讀你已穩住前十，建議把【追續】${m.merged.followDeals}打密，讓【續單】${toWan(m.merged.followAmount)}萬變成真正成績；你現在不是保十就好，而是要開始往前壓；你今天再補一筆像樣實收，前九前八很快就會碰到。`,
  11: (m) => `AI 大數據顯示你目前在中前段交界區，建議把【追續】${m.merged.followDeals}優先轉成【實收】，把手上節奏做完整；你現在位置看似穩，其實上下都很擠；你今天把這波追單吃乾淨，名次還會再往前頂。`,
  12: (m) => `AI 大數據判讀你屬於穩定補量型，建議把【追續】${m.merged.followDeals}和【續單】${toWan(m.merged.followAmount)}萬做成連續【實收】；你現在最需要的不是單點爆發，而是穩定連線；你今天再收一筆，名次會繼續前推。`,
  13: (m) => `AI 大數據顯示你有明顯上升潛力，建議把【追續】${m.merged.followDeals}和【續單】${toWan(m.merged.followAmount)}萬做成連續落袋，不要只停在單點；你現在不是沒能力，而是要讓節奏變長、讓數據變漂亮；你今天多補一筆，前段就會開始注意到你。`,
  14: (m) => `AI 大數據判讀你目前卡在中段壓力區，建議把【續單】${toWan(m.merged.followAmount)}萬和【追續】${m.merged.followDeals}一起收穩，別讓零散單拖慢節奏；你現在最怕的不是沒單，是節奏一斷就難追；你只要再收一筆，順位還能再往前推。`,
  15: (m) => `AI 大數據顯示你和前一名差距非常小，建議把【追續】${m.merged.followDeals}優先轉【實收】，並把【續單】${toWan(m.merged.followAmount)}萬快速落袋；你現在就差一小段，拖一天就會再卡一天；你今天只要連續收兩筆，順位很可能直接翻。`,
  16: (m) => `AI 大數據判讀你目前最大優勢是量夠，建議把【追續】${m.merged.followDeals}先轉現金，不要讓數字停在紙上；你現在不是缺量，是缺真正兌現；你只要把這波收回來，名次會直接往上跳。`,
  17: (m) => `AI 大數據顯示你目前在中後段守位區，建議先補【追續】${m.merged.followDeals}節奏，再把【續單】${toWan(m.merged.followAmount)}萬轉成更穩定【實收】；你現在最怕停在五萬附近不上不下；你今天只要連續收兩筆，位置就能穩。`,
  18: (m) => `AI 大數據判讀你已開始有可追性，建議把【續單】${toWan(m.merged.followAmount)}萬優先落袋，先求連續【實收】、先破停滯；你現在不是沒機會，而是要先打開；你一開，順位就會往上。`,
  19: (m) => `AI 大數據顯示你這輪已有明顯累積，建議把【續單】${toWan(m.merged.followAmount)}萬追完收完，做出連續【實收】；不追就不會動，不動就只會停在後段；你今天收一筆，順位立刻變。`,
  20: (m) => `AI 大數據判讀你目前屬於培養起步期，建議先把節奏穩住，不要急、不要空轉，先把可收的單收回來；新人現在最重要的不是一次衝太快，而是先破第一筆再建立節奏；你只要開張，後面就會越來越順。`,
  21: (m) => `AI 大數據顯示你已正式進榜，建議先把現有機會名單守住，先求穩定破第二筆、第三筆；新人最怕的是剛開就斷，所以節奏比速度重要；你今天只要再開一筆，整體信心會立刻起來。`,
  22: (m) => `AI 大數據判讀你現在還在尾段停滯區，建議把現有名單重新整理，不要讓數字繼續停住；再不補動作，就只能一直留在尾段；你今天只要收回來一筆，整體節奏就會不同。`
};

/**
 * 依據名次與數據差生成每人一句建議 (建議 + 壓力 + 激勵)
 */
export function generateAdvice(member: RankedMember, prevMember?: RankedMember, nextMember?: RankedMember): string {
  const template = adviceTemplates[member.rank];
  if (template) {
    return template(member, prevMember, nextMember);
  }

  // ── Fallback 通用備用模板 (用於 22 名以後的長尾人數) ──
  const rank = member.rank;
  const isNew = !!member.isNew;

  if (isNew) {
     return 'AI 大數據顯示您已正式進榜，建議先把現有機會名單守住，先求穩定破第二筆、第三筆；新人最怕的是剛開就斷，所以節奏比速度重要；你今天只要再開一筆，整體信心會立刻起來。';
  }

  if (rank <= 4) {
    return 'AI 大數據判讀您屬於領先梯隊，建議穩定高價值單收口；最怕停滯不前；今日若多補一單，差距將大幅擴大。';
  } else if (rank <= 10) {
    return '進入主力核心圈，續單量能的穩定度是當前的關鍵參數。把合盤數據做好，今天優先達成連續開張，打開晉階走勢！';
  } else if (rank <= 18) {
    return '此時在中段卡位戰中，無回報時間拉長將導致排序下滑；瞄準追續客戶分批收網，讓數據穩定推升名次。';
  } else {
    return '處於修整水位，首要瓶頸在於開張節奏的停滯；不要空轉猶豫，先開出一筆成交通數，把手感做熟！';
  }
}

/**
 * 產生所有人的一句話建議
 */
export function generateAllAdvice(rankedMembers: RankedMember[]): AdviceOutput[] {
  return rankedMembers.map((m, index) => {
    const prev = index > 0 ? rankedMembers[index - 1] : undefined;
    const next = index < rankedMembers.length - 1 ? rankedMembers[index + 1] : undefined;
    return {
      rank: m.rank,
      name: m.name,
      advice: generateAdvice(m, prev, next),
    };
  });
}
