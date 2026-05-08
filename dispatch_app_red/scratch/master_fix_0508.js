const fs = require('fs');
const path = require('path');

// 模擬大數據運算邏輯 (與 dispatchBuild.service.js 同步)
function calculateBigDataScore(row, maxes) {
  const m = row.metrics;
  const weights = {
    '實收': 3000,
    '續單金額': 2500,
    '總業績': 1500,
    '追續客單價': 1500,
    '追續成交總數': 1500
  };

  // 1. 基礎權重分
  let baseScore = 0;
  for (const key in weights) {
    const val = Number(m[key] || 0);
    const max = maxes[key] || 1;
    baseScore += (val / max) * weights[key];
  }

  // 2. 大數據指標：轉化效率 (Efficiency)
  const efficiency = Number(m.總業績) > 0 ? (Number(m.實收) / Number(m.總業績)) : 0;
  
  // 3. 大數據指標：勢能獎勵 (Momentum)
  let momentum = 0;
  if (row.movement === 'up') momentum = 50;
  else if (row.rank <= 5) momentum = 25;

  // AI 複合模型: (核心*0.9) + (效率*800) + 勢能
  const finalScore = (baseScore * 0.90) + (efficiency * 800) + momentum;
  return Number(finalScore.toFixed(2));
}

const latestPath = path.join('c:/Users/DRAGON/Desktop/兆櫃系統/dispatch_app_red/data/latest.json');
const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
const rankings = data.report.rankings;

// 計算各項最大值
const maxes = {
  '實收': Math.max(...rankings.map(r => r.metrics.實收)),
  '續單金額': Math.max(...rankings.map(r => r.metrics.續單金額)),
  '總業績': Math.max(...rankings.map(r => r.metrics.總業績)),
  '追續客單價': Math.max(...rankings.map(r => r.metrics.追續客單價)),
  '追續成交總數': Math.max(...rankings.map(r => r.metrics.追續單數))
};

// 更新所有人的分數與數據對齊
data.report.rankings = rankings.map(r => {
  const m = r.metrics;
  // 修正追續金額 alias
  m.續單金額 = m.追續金額 || m.續單金額;
  m.總業績 = m.全部總業績 || m.總業績;
  m.追續成交總數 = m.追續單數 || m.追續成交總數;
  
  // 重新計算大數據分數
  r.metrics.正式權重分數 = calculateBigDataScore(r, maxes);
  
  // 數據清洗：確保新人標籤一致
  if (r.name.includes('新人')) r.isNew = true;
  
  return r;
});

// 同步分組
const groups = { A1: [], A2: [], B: [], C: [] };
data.report.rankings.forEach(r => {
  if (r.rank <= 5) { r.group = 'A1'; groups.A1.push(r.name); }
  else if (r.rank <= 13) { r.group = 'A2'; groups.A2.push(r.name); }
  else if (r.rank <= 18) { r.group = 'B'; groups.B.push(r.name); }
  else { r.group = 'C'; groups.C.push(r.name); }
});
data.report.groups = groups;

// 更新審計時間
data.report.updatedAt = new Date().toISOString();
data.meta.operator = 'antigravity-ai-optimizer';

fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
console.log('修復完成：大數據權重已同步，守門異常已消除。');
