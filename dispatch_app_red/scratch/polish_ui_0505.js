const fs = require('fs');
const path = require('path');

const STYLE_PATH = path.join(__dirname, '..', 'public', 'style.css');
const APP_PATH = path.join(__dirname, '..', 'public', 'app.js');

function updateStyles() {
    let styleContent = fs.readFileSync(STYLE_PATH, 'utf8');
    
    // Append the new styles
    const newStyles = `
/* 5/5 終極霸氣強化版 */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.summary-card {
    background: linear-gradient(135deg, rgba(30, 40, 60, 0.9), rgba(10, 20, 40, 0.95));
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-left: 5px solid var(--cyan);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
}

.summary-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 229, 255, 0.2);
    border-color: var(--cyan);
}

.summary-card span {
    display: block;
    font-size: 0.9rem;
    color: var(--text-sub);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
}

.summary-card strong {
    display: block;
    font-size: 1.8rem;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

/* 前四名尊榮效果 */
.spotlight-card.rank-1 { box-shadow: 0 0 40px rgba(255, 215, 0, 0.3); border: 2px solid #FFD700; }
.spotlight-card.rank-2 { box-shadow: 0 0 30px rgba(226, 226, 226, 0.2); border: 1.5px solid #E2E2E2; }
.spotlight-card.rank-3 { box-shadow: 0 0 30px rgba(205, 127, 50, 0.2); border: 1.5px solid #CD7F32; }
.spotlight-card.rank-4 { box-shadow: 0 0 30px rgba(165, 180, 252, 0.2); border: 1.5px solid #A5B4FC; }
`;
    fs.writeFileSync(STYLE_PATH, styleContent + newStyles, 'utf8');
    console.log('style.css updated.');
}

function updateAppJs() {
    let appContent = fs.readFileSync(APP_PATH, 'utf8');
    
    // Fix renderSummaryCards to be more robust
    const oldRenderSummary = `function renderSummaryCards(cards) {
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  const items = entries.map(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'summary-card';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = '0';
    card.append(span, strong);
    return { card, value, strong };
  });
  refs.summaryGrid.replaceChildren(...items.map(i => i.card));
  items.forEach(({ strong, value }) => countUp(strong, value, 800));
}`;

    const newRenderSummary = `function renderSummaryCards(cards) {
  // 霸氣強化：強制顯示六大核心指標
  const entries = Array.isArray(cards) ? cards : Object.entries(cards || {});
  
  // 如果資料不足，自動補齊
  const labels = entries.map(e => e[0]);
  const fallback = [
    ["取消退貨", 0],
    ["實收總金額", 0],
    ["追續單金額", 0],
    ["全部總業績", 0],
    ["追續單成交", 0],
    ["累積派單成交", 0]
  ];
  
  const finalEntries = [];
  fallback.forEach(([fLabel, fVal]) => {
    const found = entries.find(e => e[0].includes(fLabel) || fLabel.includes(e[0]));
    finalEntries.push(found || [fLabel, fVal]);
  });

  const items = finalEntries.map(([label, value]) => {
    const card = document.createElement('article');
    card.className = 'summary-card';
    const span = document.createElement('span');
    span.textContent = label;
    const strong = document.createElement('strong');
    strong.textContent = '0';
    card.append(span, strong);
    return { card, value, strong };
  });
  
  if (refs.summaryGrid) {
    refs.summaryGrid.replaceChildren(...items.map(i => i.card));
    items.forEach(({ strong, value }) => countUp(strong, value, 1000));
  }
}`;

    appContent = appContent.replace(oldRenderSummary, newRenderSummary);

    // Fix rankingRows logic in render function
    const oldRankingRows = `const rankingRows = asArray(data?.正式名次 || snapshot?.report?.rankings);`;
    const newRankingRows = `const rankingRows = asArray(data?.正式名次 || snapshot?.rankings || snapshot?.report?.rankings);`;
    
    appContent = appContent.replace(oldRankingRows, newRankingRows);

    fs.writeFileSync(APP_PATH, appContent, 'utf8');
    console.log('app.js updated.');
}

updateStyles();
updateAppJs();
