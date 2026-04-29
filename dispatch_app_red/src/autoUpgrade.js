const fs = require('fs');
const path = require('path');

// 讀取 package.json
const pkgPath = path.resolve(__dirname, '..', 'package.json');
let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error('讀取 package.json 失敗:', e.message);
  process.exit(1);
}

// 解析版本號，預設為 x.y.z
const versionParts = pkg.version.split('.').map(Number);
if (versionParts.length !== 3 || versionParts.some(isNaN)) {
  console.error('版本號格式不正確:', pkg.version);
  process.exit(1);
}

// 自動升級：僅提升 patch (z) 版號
versionParts[2] += 1;
const newVersion = versionParts.join('.');
pkg.version = newVersion;

// 寫回 package.json
try {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`自動升級完成，版本更新為 ${newVersion}`);
} catch (e) {
  console.error('寫入 package.json 失敗:', e.message);
  process.exit(1);
}

// 完成後退出，讓上層 npm script 再次啟動開發伺服器
process.exit(0);
