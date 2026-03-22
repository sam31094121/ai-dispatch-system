import fs from 'fs';
import path from 'path';

const file = 'C:\\Users\\DRAGON\\Desktop\\兆櫃系統\\ai-dispatch-system\\src\\pages\\OldDashboardPage.tsx';

try {
  let content = fs.readFileSync(file, 'utf8');

  // 1. 防禦 Canvas arc 半徑 (包含空格與換行配對)
  // 將 .arc(x, y, r, ... ) 換成 .arc(x, y, Math.max(0.1, r), ... )
  // 匹配： .arc( 任何非逗號, 任何非逗號, 任何非逗號,
  content = content.replace(/\.arc\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^,]+)\s*,/g, (match, x, y, r) => {
    return `.arc(${x.trim()}, ${y.trim()}, Math.max(0.1, ${r.trim()}),`;
  });

  // 2. 防禦 toLocaleString (全域加上可選鏈 ?. )
  // 排除已含有 ?. 的情況
  content = content.replace(/([a-zA-Z0-9_\)\]])\.toLocaleString\s*\(/g, '$1?.toLocaleString(');

  fs.writeFileSync(file, content, 'utf8');
  console.log('✅ [SUCCESS] OldDashboardPage.tsx 全域防禦性清洗完成！');
} catch (err) {
  console.error('❌ [ERROR] 清洗失敗:', err);
}
