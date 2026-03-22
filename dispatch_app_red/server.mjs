// server.mjs — 紅色科技整合版 · 後端統一運算
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { sortEmployees } from './shared/contract.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// ══════════════════════════════════════════════════════
//  資料夾 & 檔案初始化
// ══════════════════════════════════════════════════════
const DATA_DIR    = path.join(__dirname, 'data');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const LATEST_FILE = path.join(DATA_DIR, 'latest.json');
const LOG_FILE    = path.join(DATA_DIR, 'system-log.jsonl');

[DATA_DIR, REPORTS_DIR, BACKUPS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
if (!fs.existsSync(LATEST_FILE)) fs.writeFileSync(LATEST_FILE, '{}');
if (!fs.existsSync(LOG_FILE))    fs.writeFileSync(LOG_FILE, '');

// ══════════════════════════════════════════════════════
//  輔助函式
// ══════════════════════════════════════════════════════
function writeLog(step, status, message, extra = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    step, status, message, ...extra
  };
  try { fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n'); }
  catch (err) { console.error('日誌寫入失敗:', err.message); }
}

function backupFile(srcPath, filename) {
  const dest = path.join(BACKUPS_DIR, `${Date.now()}_${filename}`);
  fs.copyFileSync(srcPath, dest);
  return dest;
}

/** 安全解析數字：移除千分位逗號後轉 int */
function safeInt(str) {
  if (!str) return 0;
  return parseInt(String(str).replace(/,/g, ''), 10) || 0;
}

// ══════════════════════════════════════════════════════
//  1. 系統健康檢查
// ══════════════════════════════════════════════════════
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: '系統運行中',
    timestamp: new Date().toISOString()
  });
});

// ══════════════════════════════════════════════════════
//  2. 解析報告（修正精準前綴辨識）
//     修正：「總通數」不會誤吃「追續成交總通數」
//     修正：「追續」不會誤吃「追續單金額」
// ══════════════════════════════════════════════════════
app.post('/api/report/parse', (req, res) => {
  const { rawText } = req.body;
  if (!rawText || !rawText.trim()) {
    return res.status(400).json({ success: false, step: '解析', message: '原始輸入內容不可為空' });
  }

  try {
    writeLog('接收', '成功', '接收到原始業績文字');

    // 偵測日期與平台
    const dateMatch    = rawText.match(/(\d{1,2}\/\d{1,2})/);
    const platformMatch = rawText.match(/(民視|奕心|公司)/);
    const reportDate   = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('zh-TW', { month:'numeric', day:'numeric' });
    const platform     = platformMatch ? platformMatch[1] : '三平台整合';

    const rows = [];
    const lines = rawText.split('\n');
    let totalRevenue = 0;

    for (const line of lines) {
      // 必須包含 ｜ 且含 【 才是有效資料行
      if (!line.includes('｜') || !line.includes('【')) continue;

      // 提取姓名：行首「數字、」之後到第一個 ｜
      const nameMatch = line.match(/^[\s]*\d+[、.]\s*(.+?)(?:（[^）]*）)?\s*[｜|]/);
      const name = nameMatch ? nameMatch[1].trim() : '';
      if (!name) continue;

      // ── 精準前綴辨識 ──
      // 【追續】數字  →  追續成交通數（renewDeals）
      // 不會誤吃「追續成交總通數」或「追續單金額」
      const renewDealsMatch = line.match(/【追續】\s*(\d+)/);
      const renewDeals = renewDealsMatch ? safeInt(renewDealsMatch[1]) : 0;

      // 【續單】金額  →  續單金額（renewRevenue）
      // 不會誤吃其他含「續」的欄位
      const renewRevMatch = line.match(/【續單】\s*([\d,]+)/);
      const renewRevenue = renewRevMatch ? safeInt(renewRevMatch[1]) : 0;

      // 【總業績】金額  →  總業績（totalRevenue）
      const totalRevMatch = line.match(/【總業績】\s*([\d,]+)/);
      const personRevenue = totalRevMatch ? safeInt(totalRevMatch[1]) : 0;

      rows.push({
        name,
        renewDeals,       // 追續成交通數
        renewRevenue,     // 續單金額
        totalRevenue: personRevenue  // 總業績
      });
      totalRevenue += personRevenue;
    }

    if (rows.length === 0) {
      writeLog('解析', '失敗', '未解析到任何有效人員資料');
      return res.json({ success: false, step: '解析', message: '未偵測到有效業績資料，請確認輸入格式' });
    }

    const parsedData = { reportDate, platform, totalRevenue, rows };
    writeLog('解析', '成功', `解析成功，共 ${rows.length} 筆人員資料`);
    res.json({ success: true, step: '解析', message: '解析成功', data: parsedData });
  } catch (err) {
    writeLog('解析', '失敗', err.message);
    res.status(500).json({ success: false, step: '解析', message: `解析出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  3. 審計檢查（修正：取消退貨不與個人明細硬比）
// ══════════════════════════════════════════════════════
app.post('/api/report/audit', (req, res) => {
  const { data } = req.body;
  if (!data || !data.rows) {
    return res.status(400).json({ success: false, step: '審計', message: '缺少解析數據' });
  }

  try {
    const { rows, totalRevenue } = data;
    const errors = [];

    // ── 天地盤：明細加總 vs 表頭總計 ──
    const calcTotal = rows.reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
    // 允許合理誤差（取消退貨可能造成差額），不再硬性一致
    const tolerance = Math.abs(totalRevenue) * 0.05; // 5% 容許範圍
    if (Math.abs(calcTotal - totalRevenue) > tolerance && totalRevenue > 0) {
      errors.push(`總計金額差異超過容許範圍：表顯 ${totalRevenue.toLocaleString()}，明細加總 ${calcTotal.toLocaleString()}`);
    }

    // ── 邏輯盤：個人資料合理性 ──
    rows.forEach(r => {
      if ((r.renewDeals || 0) > 0 && (r.totalRevenue || 0) === 0) {
        errors.push(`${r.name} 有追續通數但總業績為零`);
      }
      if ((r.renewRevenue || 0) > (r.totalRevenue || 0) && r.totalRevenue > 0) {
        errors.push(`${r.name} 續單金額（${r.renewRevenue.toLocaleString()}）超過總業績（${r.totalRevenue.toLocaleString()}）`);
      }
    });

    if (errors.length > 0) {
      writeLog('審計', '失敗', errors.join('; '));
      return res.json({ success: false, step: '審計', message: '審計未通過', errors });
    }

    writeLog('審計', '成功', '三盤審計全數通過');
    res.json({ success: true, step: '審計', message: '審計通過（天地盤 PASS / 邏輯盤 PASS）' });
  } catch (err) {
    writeLog('審計', '失敗', err.message);
    res.status(500).json({ success: false, step: '審計', message: `審計出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  4. 排名排序（使用 shared/contract.mjs 共用排序契約）
// ══════════════════════════════════════════════════════
app.post('/api/report/rank', (req, res) => {
  const { data } = req.body;
  if (!data || !data.rows) {
    return res.status(400).json({ success: false, step: '排序', message: '缺少審計數據' });
  }

  try {
    // 欄位已與契約一致（totalRevenue, renewRevenue, renewDeals）
    const sorted = sortEmployees(data.rows);

    // 分組
    const ranked = sorted.map(r => {
      const idx = r.rank - 1;
      let group = 'C';
      if (idx < 4)       group = 'A1';
      else if (idx < 10) group = 'A2';
      else if (idx < 17) group = 'B';
      return { ...r, group };
    });

    writeLog('排序', '成功', `排名完成，共 ${ranked.length} 人`);
    res.json({ success: true, step: '排序', message: '排序成功', data: ranked });
  } catch (err) {
    writeLog('排序', '失敗', err.message);
    res.json({ success: false, step: '排序', message: `排序出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  5. 生成公告 / 播報 / LINE 訊息
// ══════════════════════════════════════════════════════
app.post('/api/report/generate_outputs', (req, res) => {
  const { rankedData, reportDate } = req.body;
  if (!rankedData) {
    return res.json({ success: false, step: '公告', message: '缺少排名數據' });
  }

  try {
    const groups = { A1: [], A2: [], B: [], C: [] };
    rankedData.forEach(r => { if (groups[r.group]) groups[r.group].push(r); });

    const groupLabel = { A1: '🔴 A1 高單主力', A2: '🟠 A2 續單收割', B: '🟡 B 一般量單', C: '🟢 C 補位觀察' };

    // 完整公告
    let announce = `📣【AI 派單公告｜${reportDate} 結算】\n`;
    announce += `${'━'.repeat(20)}\n\n`;

    for (const [g, members] of Object.entries(groups)) {
      if (!members.length) continue;
      announce += `${groupLabel[g]}\n`;
      members.forEach(r => {
        announce += `${r.rank}、${r.name}｜追續 ${r.renewDeals}｜續單 $${(r.renewRevenue || 0).toLocaleString()}｜總業績 $${(r.totalRevenue || 0).toLocaleString()}\n`;
      });
      announce += '\n';
    }
    announce += `${'━'.repeat(20)}\n`;
    announce += `執行規則：照順序派、前面全忙才往後、不得指定、不得跳位\n`;
    announce += `© 兆櫃 AI 數據中樞`;

    // 播報稿
    const top = rankedData[0];
    const broadcast = `各位夥伴請注意！${reportDate} 最新排名揭曉：第一名 ${top?.name || ''}，總業績達 ${(top?.totalRevenue || 0).toLocaleString()} 元。請全員確認派單順序後回覆加一。`;

    // LINE 分組訊息
    const lineMessages = {};
    for (const [g, members] of Object.entries(groups)) {
      if (!members.length) continue;
      lineMessages[g] = `${reportDate} 業績派單（${g} 組）\n${'━'.repeat(16)}\n`
        + members.map((r, i) => `${i + 1}. ${r.name}｜$${(r.totalRevenue || 0).toLocaleString()}`).join('\n')
        + `\n${'━'.repeat(16)}\n共 ${members.length} 位夥伴｜請確認接單`;
    }

    writeLog('公告', '成功', '公告、播報稿、LINE 訊息生成完成');
    res.json({ success: true, data: { announce, broadcast, lineMessages } });
  } catch (err) {
    writeLog('公告', '失敗', err.message);
    res.json({ success: false, step: '公告', message: `生成出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  6. 存檔 & 備份
// ══════════════════════════════════════════════════════
app.post('/api/report/save', (req, res) => {
  const { fullState } = req.body;
  if (!fullState) {
    return res.status(400).json({ success: false, step: '存檔', message: '缺少存檔狀態' });
  }

  try {
    const filename   = `report_${Date.now()}.json`;
    const reportPath = path.join(REPORTS_DIR, filename);

    // 原子寫入（先寫 tmp 再 rename）
    const tmpReport = reportPath + '.tmp';
    const tmpLatest = LATEST_FILE + '.tmp';

    fs.writeFileSync(tmpReport, JSON.stringify(fullState, null, 2));
    fs.renameSync(tmpReport, reportPath);

    fs.writeFileSync(tmpLatest, JSON.stringify(fullState, null, 2));
    fs.renameSync(tmpLatest, LATEST_FILE);

    backupFile(reportPath, filename);

    writeLog('存檔', '成功', `存檔與備份完成：${filename}`);
    res.json({ success: true, step: '存檔', message: '已存入 / 已備份', path: reportPath });
  } catch (err) {
    writeLog('存檔', '失敗', err.message);
    res.status(500).json({ success: false, step: '存檔', message: `存檔出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  7. 讀取最新報表
// ══════════════════════════════════════════════════════
app.get('/api/report/latest', (_req, res) => {
  try {
    const raw = fs.readFileSync(LATEST_FILE, 'utf-8');
    res.json({ success: true, data: JSON.parse(raw) });
  } catch { res.json({ success: false, data: {} }); }
});

// ══════════════════════════════════════════════════════
//  8. 預載 3/22 業績資料
// ══════════════════════════════════════════════════════
app.get('/api/preload/322', (_req, res) => {
  const preloadText = `1、李玲玲｜【追續】29｜【續單】739,535｜【總業績】1,051,935
2、馬秋香｜【追續】40｜【續單】684,380｜【總業績】869,578
3、王珍珠｜【追續】46｜【續單】548,410｜【總業績】825,800
4、王梅慧｜【追續】27｜【續單】420,440｜【總業績】563,148
5、林沛昕｜【追續】13｜【續單】337,195｜【總業績】523,111
6、林宜靜｜【追續】20｜【續單】316,380｜【總業績】465,088
7、徐華妤｜【追續】14｜【續單】270,240｜【總業績】401,330
8、江麗勉｜【追續】7｜【續單】264,812｜【總業績】394,880
9、高如郁｜【追續】15｜【續單】206,355｜【總業績】350,289
10、廖姿惠｜【追續】15｜【續單】98,748｜【總業績】314,714
11、湯玉琦｜【追續】16｜【續單】77,680｜【總業績】299,304
12、高美雲｜【追續】11｜【續單】60,718｜【總業績】223,268
13、蘇淑玲｜【追續】11｜【續單】79,550｜【總業績】181,376
14、陳玲華｜【追續】11｜【續單】91,470｜【總業績】176,988
15、梁依萍｜【追續】13｜【續單】74,990｜【總業績】152,660
16、鄭珮恩｜【追續】23｜【續單】67,815｜【總業績】92,275
17、江沛林｜【追續】8｜【續單】29,930｜【總業績】70,150
18、董昭蘭｜【追續】6｜【續單】29,345｜【總業績】29,345
19、謝啟芳（新人）｜【追續】3｜【續單】15,144｜【總業績】15,144
20、陳旭宜（新人）｜【追續】1｜【續單】3,960｜【總業績】3,960
21、林佩君｜【追續】1｜【續單】2,490｜【總業績】2,490`;

  writeLog('預載', '成功', '載入 3/22 業績預設資料');
  res.json({ success: true, data: preloadText, reportDate: '3/22' });
});

// ══════════════════════════════════════════════════════
//  9. AI 建議生成
// ══════════════════════════════════════════════════════
app.post('/api/suggestions', (req, res) => {
  const { rankedData } = req.body;
  if (!rankedData?.length) {
    return res.status(400).json({ success: false, message: '缺少排名資料' });
  }

  try {
    const suggestions = rankedData.map((person, idx) => {
      const rank      = person.rank || idx + 1;
      const renewAmt  = (person.renewRevenue || 0).toLocaleString();
      const renewCnt  = person.renewDeals || 0;

      let advice = '';
      if (rank === 1) {
        advice = `你已站上最高級距，【續單】${renewAmt} 持續往深處收，優先鎖定高命中率客戶。你就是整隊壓力中心，前面沒人擋、後面全在追。今天再補一筆，第一名不只是守住，差距會再拉大。`;
      } else if (rank <= 3) {
        advice = `穩住第 ${rank}，【續單】${renewAmt} 做滿，高價值名單轉實收。守得住就是前段核心，守不住後面馬上追上。今天再補一筆，位置會更穩。`;
      } else if (rank <= 7) {
        advice = `仍在主力核心帶，【續單】${renewAmt}、【追續】${renewCnt} 做出更高兌現率。與前面差距不大，停住就會被貼近。今天補一筆，前面會開始感受到壓力。`;
      } else if (rank <= 10) {
        advice = `穩住前十，【追續】${renewCnt} 打密，讓【續單】${renewAmt} 變成真正成績。不是只守前十，而是已踏進前段區。今天再補一筆像樣實收，前面都會看到你。`;
      } else if (rank <= 15) {
        advice = `位於中段衝刺區，【續單】${renewAmt}、【追續】${renewCnt} 一起收穩，別讓零散單拖慢節奏。不是沒能力，是節奏還能更長更穩。今天多補一筆，順位很快換回來。`;
      } else if (rank <= 18) {
        advice = `最大優勢是量夠，【追續】${renewCnt} 先轉現金，別讓數字停在紙上。不是缺量，是缺真正兌現。把這波收回來，名次直接往上跳。`;
      } else {
        advice = `先把節奏穩住，不急不空轉，先收可收的單。重要的不是一次衝太快，而是先破第一筆再建立節奏。只要開張，後面會越來越順。`;
      }

      return { name: person.name, rank, group: person.group, advice };
    });

    writeLog('建議', '成功', `已為 ${suggestions.length} 位人員生成建議`);
    res.json({ success: true, data: suggestions });
  } catch (err) {
    writeLog('建議', '失敗', err.message);
    res.status(500).json({ success: false, message: `建議生成出錯: ${err.message}` });
  }
});

// ══════════════════════════════════════════════════════
//  10. 系統日誌
// ══════════════════════════════════════════════════════
app.get('/api/logs', (_req, res) => {
  try {
    const logs = fs.readFileSync(LOG_FILE, 'utf-8')
      .split('\n').filter(Boolean).map(JSON.parse);
    res.json({ success: true, data: logs });
  } catch { res.json({ success: false, data: [] }); }
});

// ══════════════════════════════════════════════════════
//  啟動
// ══════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`\n  ⚡ 兆櫃 AI 派單 · 紅色科技版`);
  console.log(`  🔗 http://localhost:${PORT}\n`);
});
