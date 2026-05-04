const fs = require('fs');

const rankMapCode = `
const PREV_RANK_MAP = {
  '湯玉琦': 1, '馬秋香': 2, '王珍珠': 3, '莉莉（新人）': 4, '廖姿惠': 5,
  '林宜靜': 6, '高如郁': 7, '王梅慧': 8, '周美蓁': 9, '許喬恩': 10,
  '李玲玲': 11, '高美雲': 12, '江麗勉': 13, '鄭珮恩': 14, '梁依萍': 15,
  '陳玲華': 16, '謝啟芳': 17, '江沛林': 18, '林沛昕': 19, '徐華妤': 20,
  '林佩君': 21, '蘇淑玲': 22, '鄭上官': 23, '陳百玲（新人）': 24
};

function getMovement(name, currentRank) {
  const prevRank = PREV_RANK_MAP[name];
  if (!prevRank) return { class: 'flat', arrow: '＝' };
  if (currentRank < prevRank) return { class: 'up', arrow: '↑' };
  if (currentRank > prevRank) return { class: 'down', arrow: '↓' };
  return { class: 'flat', arrow: '＝' };
}
`;

// 修改 app.js
const appPath = 'c:\\Users\\DRAGON\\Desktop\\兆櫃系統\\dispatch_app_red\\public\\app.js';
let appContent = fs.readFileSync(appPath, 'utf-8');
if (!appContent.includes('PREV_RANK_MAP')) {
  appContent = rankMapCode + appContent;
  // 修正 renderRankingTable
  appContent = appContent.replace(
    /const rank = Number\(row.名次 \|\| row.rank \|\| 0\);[\s\S]*?let moveClass = 'flat', moveArrow = '＝';/,
    `const rank = Number(row.名次 || row.rank || 0);
    const move = getMovement(row.姓名 || row.name, rank);
    let moveClass = move.class, moveArrow = move.arrow;`
  );
  fs.writeFileSync(appPath, appContent, 'utf-8');
}

// 修改 mobile.js
const mobilePath = 'c:\\Users\\DRAGON\\Desktop\\兆櫃系統\\dispatch_app_red\\public\\mobile.js';
let mobileContent = fs.readFileSync(mobilePath, 'utf-8');
if (!mobileContent.includes('PREV_RANK_MAP')) {
  mobileContent = rankMapCode + mobileContent;
  // 修正 normalizeReport 中的 movement 計算
  mobileContent = mobileContent.replace(
    /let movement = row.movement \|\| 'flat';[\s\S]*?if \(prevRank > 0\) \{[\s\S]*?\} movement = 'flat';[\s\S]*?\}/,
    `let movement = getMovement(row.name || row.姓名, rank).class;`
  );
  fs.writeFileSync(mobilePath, mobileContent, 'utf-8');
}

console.log('Successfully hardened front-end movement logic via PREV_RANK_MAP');
