const fs = require('fs');

const path = 'public/style.css';
let text = fs.readFileSync(path).toString('latin1');

text = text.replace('content: ";', 'content: "";');

const mobileRatioLock = `

/* Mobile top-five ratio lock: keep first-screen cards proportional on phones. */
@media (max-width: 760px) {
  .oil-announcement .performance-panel {
    padding: 14px 10px !important;
    overflow: visible;
  }

  .oil-announcement .spotlight-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 12px !important;
    width: 100%;
  }

  .oil-announcement .spotlight-card,
  .oil-announcement .spotlight-item {
    grid-column: 1 / -1 !important;
    min-height: auto !important;
    height: auto !important;
    aspect-ratio: auto !important;
    padding: 14px !important;
    border-width: 1px !important;
    transform: none !important;
    contain: layout paint;
  }

  .oil-announcement .spotlight-card.rank-1,
  .oil-announcement .spotlight-item.rank-1 {
    min-height: clamp(230px, 62vw, 300px) !important;
    border-width: 2px !important;
  }

  .oil-announcement .spotlight-card.rank-2,
  .oil-announcement .spotlight-card.rank-3,
  .oil-announcement .spotlight-item.rank-2,
  .oil-announcement .spotlight-item.rank-3 {
    min-height: clamp(190px, 54vw, 250px) !important;
  }

  .oil-announcement .spotlight-card.rank-4,
  .oil-announcement .spotlight-card.rank-5,
  .oil-announcement .spotlight-item.rank-4,
  .oil-announcement .spotlight-item.rank-5 {
    min-height: clamp(170px, 48vw, 220px) !important;
  }

  .oil-announcement .spotlight-title,
  .oil-announcement .spotlight-name,
  .oil-announcement .spotlight-score,
  .oil-announcement .spotlight-metrics,
  .oil-announcement .treasure-badge {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  .oil-announcement .spotlight-name {
    font-size: clamp(22px, 7vw, 32px) !important;
    line-height: 1.12 !important;
  }

  .oil-announcement .spotlight-title {
    font-size: clamp(12px, 3.8vw, 15px) !important;
  }

  .oil-announcement .spotlight-metrics {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
  }

  .oil-announcement .money-canvas-container,
  .oil-announcement .audio-visualizer {
    opacity: 0.28 !important;
  }
}
`;

if (!text.includes('Mobile top-five ratio lock')) {
  text += mobileRatioLock;
}

fs.writeFileSync(path, Buffer.from(text, 'latin1'));
