const fs = require('fs');
const path = require('path');

const dispatchEnginePath = path.join(__dirname, 'shared', 'dispatch-engine.js');
let dispatchEngine = fs.readFileSync(dispatchEnginePath, 'utf8');

// fix SYSTEM.version logic
dispatchEngine = dispatchEngine.replace(
  /version: '網頁版-[^']+'/,
  `get version() { const d = new Date(); return \`網頁版-\${d.getFullYear()}-\${String(d.getMonth()+1).padStart(2,'0')}-\${String(d.getDate()).padStart(2,'0')}\`; }`
);

// format execution ID directly in the snapshot building strings or UI payloads.
// Wait, actually, let's just make executionId itself a formatted string!
// To fix the sorting issue, we can change loadSnapshotHistory to sort properly even if it's a string,
// or we can just replace Date.now() with a number that is exactly YYYYMMDDHHmmss.
// Let's do the Number(YYYYMMDDHHmmss) method! It's bulletproof.

dispatchEngine = dispatchEngine.replace(/Date\.now\(\)/g, `Number(new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/\\D/g, ''))`);

fs.writeFileSync(dispatchEnginePath, dispatchEngine, 'utf8');


const serverPath = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverPath, 'utf8');
// To make it formatted on server output:
// add a helper:
const helper = `
function formatExecutionId(id) {
  if (!id) return '-';
  const str = String(id);
  if (str.length >= 13 && str.startsWith('177')) { // old timestamp
    const d = new Date(Number(id));
    return d.toLocaleString('zh-TW', { hour12: false });
  }
  if (str.length === 14) {
    return str.replace(/(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})/, '$1-$2-$3 $4:$5:$6');
  }
  return str;
}
`;
if (!serverJs.includes('formatExecutionId')) {
  serverJs = serverJs.replace('const path = require(\'path\');', 'const path = require(\'path\');\n' + helper);
}

serverJs = serverJs.replace(/snapshot\?\.executionId/g, 'formatExecutionId(snapshot?.executionId)');
serverJs = serverJs.replace(/current\.executionId/g, 'formatExecutionId(current.executionId)');

fs.writeFileSync(serverPath, serverJs, 'utf8');


const appPath = path.join(__dirname, 'public', 'app.js');
let appJs = fs.readFileSync(appPath, 'utf8');

if (!appJs.includes('formatExecutionId')) {
  appJs = `
function formatExecutionId(id) {
  if (!id) return '-';
  const str = String(id);
  if (str.length >= 13 && str.startsWith('177')) { return new Date(Number(id)).toLocaleString('zh-TW', { hour12: false }); }
  if (str.length === 14) { return str.replace(/(\\d{4})(\\d{2})(\\d{2})(\\d{2})(\\d{2})(\\d{2})/, '$1-$2-$3 $4:$5:$6'); }
  return str;
}\n` + appJs;
}

appJs = appJs.replace(/snapshot\?\.executionId/g, 'formatExecutionId(snapshot?.executionId)');
appJs = appJs.replace(/item\.executionId/g, 'formatExecutionId(item.executionId)');

fs.writeFileSync(appPath, appJs, 'utf8');

console.log('Fixed dates and execution IDs.');
