const fs = require('fs');
const path = require('path');

const STYLE_PATH = path.join(__dirname, '..', 'public', 'style.css');

function updateStyles() {
    let styleContent = fs.readFileSync(STYLE_PATH, 'utf8');
    
    const newStyles = `
/* 排行榜指標堆疊 */
.leader-metrics-stack {
    display: flex;
    gap: 15px;
    align-items: center;
}

.leader-metrics-stack .m-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.leader-metrics-stack .m-item span {
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
}

.leader-metrics-stack .m-item strong {
    font-size: 14px;
    color: var(--text);
}

.leader-metrics-stack .m-score {
    padding-left: 10px;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.leader-metrics-stack .m-score span {
    font-size: 10px;
    color: var(--cyan);
}

.leader-metrics-stack .m-score strong {
    font-size: 16px;
    color: var(--cyan);
    text-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
}

/* 聚光燈指標強化 */
.spotlight-stats div span {
    color: var(--text-dim);
    font-size: 11px;
}

.spotlight-stats div strong {
    color: var(--text);
    font-size: 15px;
}
`;
    fs.writeFileSync(STYLE_PATH, styleContent + newStyles, 'utf8');
    console.log('style.css updated for metrics stack.');
}

updateStyles();
