const fs = require('fs');
const filePath = 'c:\\Users\\DRAGON\\Desktop\\兆櫃系統\\dispatch_app_red\\public\\app.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldCode = `function countUp(el, target, duration = 1200) {
  const numTarget = Number(target || 0);
  if (!numTarget) { el.textContent = numberFormatter.format(0); return; }
  const t0 = performance.now();`;

const newCode = `function countUp(el, target, duration = 1200) {
  const numTarget = typeof target === 'string' ? Number(target.replace(/[^0-9.-]+/g, '')) : Number(target || 0);
  if (isNaN(numTarget) || numTarget === 0) {
    el.textContent = target || '0';
    return;
  }
  const t0 = performance.now();`;

content = content.replace(oldCode, newCode);
fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated app.js via scratch script');
