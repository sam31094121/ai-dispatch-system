const http = require("http");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { URL } = require("url");

const 埠號 = Number(process.env.PORT || 3000);
const 時區 = "Asia/Taipei";
const 自動執行時間 = { 小時: 9, 分鐘: 0 };
const 巡檢毫秒 = 30000;
const 根目錄 = __dirname;
const 資料目錄 = path.join(根目錄, "資料");
const 企劃書目錄 = path.join(資料目錄, "企劃書");
const 每日資料檔 = path.join(資料目錄, "每日資料.json");
const 系統狀態檔 = path.join(資料目錄, "系統狀態.json");
const 系統日誌檔 = path.join(資料目錄, "系統日誌.log");

const 基準權重 = {
  當日客單價: 100,
  當日實收金額: 250,
  本月業績: 100,
  上月業績: 100,
  整體客單價: 50,
  續單金額: 200,
  追續成交總數: 200
};

function 台灣時間字串(日期 = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: 時區,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(日期);
}

function 今天日期() {
  return 台灣時間字串().slice(0, 10);
}

function 台灣時間拆解(日期 = new Date()) {
  const [日期字, 時間字] = 台灣時間字串(日期).split(" ");
  const [小時, 分鐘, 秒] = 時間字.split(":").map(Number);
  return { 日期: 日期字, 小時, 分鐘, 秒 };
}

function 安全數字(值) {
  const 數字 = Number(值);
  return Number.isFinite(數字) ? 數字 : 0;
}

function 四捨五入(數字, 位數 = 2) {
  const 倍數 = 10 ** 位數;
  return Math.round((Number(數字) || 0) * 倍數) / 倍數;
}

function 百分比變化(目前值, 前值) {
  const 目前 = Number(目前值) || 0;
  const 前一日 = Number(前值) || 0;
  if (前一日 === 0) return 目前 === 0 ? 0 : 100;
  return 四捨五入(((目前 - 前一日) / Math.abs(前一日)) * 100, 2);
}

function 權重總和(權重) {
  return Object.values(權重 || {}).reduce((總和, 值) => 總和 + (Number(值) || 0), 0);
}

function 正規化權重(權重, 目標總和 = 1000) {
  const 總和 = 權重總和(權重);
  if (!總和) return { ...基準權重 };
  const 結果 = {};
  for (const 鍵 of Object.keys(權重)) 結果[鍵] = 四捨五入((權重[鍵] / 總和) * 目標總和, 2);
  const 第一鍵 = Object.keys(結果)[0];
  if (第一鍵) 結果[第一鍵] = 四捨五入(結果[第一鍵] + 目標總和 - 權重總和(結果), 2);
  return 結果;
}

function 權重排序(權重) {
  return Object.entries(權重 || {}).sort((甲, 乙) => 乙[1] - 甲[1]).map(([鍵, 值]) => ({ 鍵, 值 }));
}

function 依日期排序(陣列) {
  return [...(Array.isArray(陣列) ? 陣列 : [])].sort((甲, 乙) => String(甲.日期 || "").localeCompare(String(乙.日期 || "")));
}

function 淨化每日資料(原始 = {}) {
  return {
    日期: 原始.日期 || 今天日期(),
    當日客單價: 安全數字(原始.當日客單價),
    當日實收金額: 安全數字(原始.當日實收金額),
    本月業績: 安全數字(原始.本月業績),
    上月業績: 安全數字(原始.上月業績),
    整體客單價: 安全數字(原始.整體客單價),
    續單金額: 安全數字(原始.續單金額),
    追續成交總數: 安全數字(原始.追續成交總數),
    取消退貨金額: 安全數字(原始.取消退貨金額)
  };
}

async function 檔案存在嗎(檔案路徑) {
  try {
    await fsp.access(檔案路徑);
    return true;
  } catch {
    return false;
  }
}

async function 讀取JSON(檔案路徑, 預設值) {
  try {
    return JSON.parse(await fsp.readFile(檔案路徑, "utf8"));
  } catch {
    return 預設值;
  }
}

async function 寫入JSON(檔案路徑, 資料) {
  await fsp.writeFile(檔案路徑, JSON.stringify(資料, null, 2), "utf8");
}

async function 寫入文字(檔案路徑, 內容) {
  await fsp.writeFile(檔案路徑, 內容, "utf8");
}

async function 追加日誌(內容) {
  await fsp.appendFile(系統日誌檔, `[${台灣時間字串()}] ${內容}\n`, "utf8");
}

async function 確保系統存在() {
  await fsp.mkdir(企劃書目錄, { recursive: true });
  if (!(await 檔案存在嗎(每日資料檔))) await 寫入JSON(每日資料檔, []);
  if (!(await 檔案存在嗎(系統狀態檔))) {
    await 寫入JSON(系統狀態檔, {
      進化次數: 0,
      最後企劃日期: "",
      最後執行時間: "",
      最後資料日期: "",
      最後權重: 基準權重,
      最後巡檢時間: "",
      系統啟動時間: 台灣時間字串()
    });
  }
  if (!(await 檔案存在嗎(系統日誌檔))) await 寫入文字(系統日誌檔, "");
}

function 計算今日權重(今日資料, 昨日資料) {
  const 新權重 = { ...基準權重 };
  const 實收變化 = 百分比變化(今日資料.當日實收金額, 昨日資料.當日實收金額);
  const 本月變化 = 百分比變化(今日資料.本月業績, 昨日資料.本月業績);
  const 續單變化 = 百分比變化(今日資料.續單金額, 昨日資料.續單金額);
  const 退貨比率 = 今日資料.當日實收金額 > 0 ? 四捨五入((今日資料.取消退貨金額 / 今日資料.當日實收金額) * 100, 2) : 0;
  if (實收變化 >= 5) {
    新權重.當日實收金額 += 20;
    新權重.當日客單價 += 10;
  } else if (實收變化 <= -5) {
    新權重.續單金額 += 20;
    新權重.追續成交總數 += 15;
  }
  if (本月變化 >= 3) 新權重.本月業績 += 15;
  else if (本月變化 <= -3) 新權重.上月業績 += 15;
  if (續單變化 >= 5) {
    新權重.續單金額 += 15;
    新權重.追續成交總數 += 10;
  } else if (續單變化 <= -5) 新權重.當日實收金額 += 10;
  if (今日資料.當日客單價 > 今日資料.整體客單價) 新權重.當日客單價 += 10;
  else 新權重.整體客單價 += 10;
  if (退貨比率 >= 8) {
    新權重.當日實收金額 -= 15;
    新權重.續單金額 += 10;
    新權重.追續成交總數 += 10;
  }
  for (const 鍵 of Object.keys(新權重)) if (新權重[鍵] < 10) 新權重[鍵] = 10;
  return 正規化權重(新權重, 1000);
}

function 建立企劃內容(今日資料, 昨日資料, 今日權重) {
  const 排序 = 權重排序(今日權重);
  const 退貨比率 = 今日資料.當日實收金額 > 0 ? 四捨五入((今日資料.取消退貨金額 / 今日資料.當日實收金額) * 100, 2) : 0;
  const 摘要 = [
    `今日自動優化完成，主軸改為「${排序.slice(0, 2).map((項目) => 項目.鍵).join("＋")}」雙核心驅動。`,
    `當日實收金額較前一日變化 ${百分比變化(今日資料.當日實收金額, 昨日資料.當日實收金額)}%。`,
    `續單金額較前一日變化 ${百分比變化(今日資料.續單金額, 昨日資料.續單金額)}%。`,
    "系統只做策略優化，不亂改原始結構；總權重固定 1000。"
  ];
  const 今日重點 = [
    { 標題: "主攻核心", 說明: `今日最優先放大「${排序[0]?.鍵 || "當日實收金額"}」，目前權重 ${排序[0]?.值 || 0}。` },
    {
      標題: 今日資料.續單金額 >= 昨日資料.續單金額 ? "續單收割" : "回補續單",
      說明: 今日資料.續單金額 >= 昨日資料.續單金額 ? "續單動能正在上升，今天要強化回撥、追續、舊客回收。" : "續單動能低於前一日，今天要優先補強既有名單回收。"
    },
    {
      標題: 今日資料.當日客單價 >= 今日資料.整體客單價 ? "高單放大" : "穩定成交",
      說明: 今日資料.當日客單價 >= 今日資料.整體客單價 ? "今日客單價高於整體客單價，適合放大高價商品與高單話術。" : "今日客單價低於整體平均，今天先求穩定成交。"
    }
  ];
  if (退貨比率 >= 8) 今日重點.unshift({ 標題: "壓退貨風險", 說明: `取消退貨比率達 ${退貨比率}%，今天必須先處理確認單、售後與話術落差。` });
  const 風險提醒 = [];
  if (退貨比率 >= 8) 風險提醒.push("今日取消退貨比率偏高，必須優先壓退貨與誤賣風險。");
  if (今日資料.當日實收金額 < 昨日資料.當日實收金額) 風險提醒.push("當日實收低於前一日，前段成交力偏弱。");
  if (今日資料.續單金額 < 昨日資料.續單金額) 風險提醒.push("續單金額低於前一日，舊客回收節奏不足。");
  if (今日資料.當日客單價 < 今日資料.整體客單價) 風險提醒.push("當日客單價低於整體客單價，可能有低價成交過多的風險。");
  if (!風險提醒.length) 風險提醒.push("整體無重大風險，今天以放大優勢、穩定轉單為主。");
  const 明日目標 = { ...今日資料 };
  for (const 鍵 of 排序.slice(0, 3).map((項目) => 項目.鍵)) 明日目標[鍵] = 四捨五入(明日目標[鍵] * 1.03, 0);
  明日目標.取消退貨金額 = 四捨五入(今日資料.取消退貨金額 * 0.8, 0);
  const 執行企劃 = [
    { 區塊: "上午執行", 內容: `先鎖定今日前三大核心：「${排序.slice(0, 3).map((項目) => 項目.鍵).join("、")}」。上午主打開局速度、高機率成交與高品質通話。` },
    { 區塊: "下午執行", 內容: "下午主打續單追擊、回撥補單、未成交原因修正，避免流量白白流失。" },
    { 區塊: "晚上結算", 內容: "晚上重新核對實收、續單、追續、退貨風險，再生成明日新版自動優化企劃書。" }
  ];
  return { 排序, 摘要, 今日重點: 今日重點.slice(0, 3), 風險提醒, 明日目標, 執行企劃, 退貨比率 };
}

function 產生企劃書文字(企劃) {
  const 權重段落 = Object.entries(企劃.今日權重).map(([鍵, 值]) => `- ${鍵}：${值}`).join("\n");
  const 重點段落 = 企劃.今日重點.map((項目, 索引) => `${索引 + 1}. ${項目.標題}：${項目.說明}`).join("\n");
  const 風險段落 = 企劃.風險提醒.map((項目, 索引) => `${索引 + 1}. ${項目}`).join("\n");
  const 目標段落 = Object.entries(企劃.明日目標).map(([鍵, 值]) => `- ${鍵}：${值}`).join("\n");
  const 執行段落 = 企劃.執行企劃.map((區塊) => `### ${區塊.區塊}\n${區塊.內容}`).join("\n\n");
  return [
    "# 董事長全端自動戰情室｜每日自動優化執行企劃書",
    "",
    `- 企劃日期：${企劃.企劃日期}`,
    `- 生成時間：${企劃.生成時間}`,
    `- 版本編號：${企劃.版本編號}`,
    `- 參考資料日期：${企劃.資料日期 || "無"}`,
    "",
    "## 一、今日自動優化結果",
    ...企劃.摘要.map((句子) => `- ${句子}`),
    "",
    "## 二、今日自動進化權重",
    權重段落,
    "",
    "## 三、今日最該盯的三個重點",
    重點段落,
    "",
    "## 四、今日執行企劃",
    執行段落,
    "",
    "## 五、風險提醒",
    風險段落,
    "",
    "## 六、明日目標值",
    目標段落,
    ""
  ].join("\n");
}

async function 讀取企劃歷史() {
  await 確保系統存在();
  const 檔案清單 = await fsp.readdir(企劃書目錄);
  const JSON清單 = 檔案清單.filter((檔名) => 檔名.endsWith(".json")).sort().reverse();
  const 結果 = [];
  for (const 檔名 of JSON清單.slice(0, 60)) {
    const 資料 = await 讀取JSON(path.join(企劃書目錄, 檔名), null);
    if (資料) 結果.push(資料);
  }
  return 結果;
}

async function 儲存每日資料(原始資料) {
  await 確保系統存在();
  const 全部資料 = 依日期排序(await 讀取JSON(每日資料檔, []));
  const 資料列 = 淨化每日資料(原始資料);
  const 索引 = 全部資料.findIndex((項目) => 項目.日期 === 資料列.日期);
  if (索引 >= 0) 全部資料[索引] = 資料列;
  else 全部資料.push(資料列);
  await 寫入JSON(每日資料檔, 依日期排序(全部資料));
  await 追加日誌(`每日資料已儲存：${資料列.日期}`);
  return 資料列;
}

async function 依日期讀取企劃書(日期) {
  const 檔案路徑 = path.join(企劃書目錄, `${日期}_企劃書.json`);
  if (!(await 檔案存在嗎(檔案路徑))) return null;
  return await 讀取JSON(檔案路徑, null);
}

async function 執行今日優化(強制重算 = false) {
  await 確保系統存在();
  const 系統狀態 = await 讀取JSON(系統狀態檔, {
    進化次數: 0,
    最後企劃日期: "",
    最後執行時間: "",
    最後資料日期: "",
    最後權重: 基準權重,
    最後巡檢時間: ""
  });
  const 今日日期 = 今天日期();
  const 今日企劃JSON檔 = path.join(企劃書目錄, `${今日日期}_企劃書.json`);
  const 今日企劃文字檔 = path.join(企劃書目錄, `${今日日期}_企劃書.md`);
  if (!強制重算 && 系統狀態.最後企劃日期 === 今日日期 && (await 檔案存在嗎(今日企劃JSON檔))) {
    return await 讀取JSON(今日企劃JSON檔, null);
  }
  const 歷史資料 = 依日期排序(await 讀取JSON(每日資料檔, []));
  const 今日資料 = 歷史資料.length > 0 ? 歷史資料[歷史資料.length - 1] : 淨化每日資料({ 日期: 今日日期 });
  const 昨日資料 = 歷史資料.length > 1 ? 歷史資料[歷史資料.length - 2] : 今日資料;
  const 今日權重 = 計算今日權重(今日資料, 昨日資料);
  const 內容 = 建立企劃內容(今日資料, 昨日資料, 今日權重);
  const 企劃 = {
    企劃日期: 今日日期,
    生成時間: 台灣時間字串(),
    資料日期: 今日資料.日期 || "",
    版本編號: `進化-${String((系統狀態.進化次數 || 0) + 1).padStart(5, "0")}`,
    基準權重,
    今日權重,
    權重排序: 內容.排序,
    摘要: 內容.摘要,
    今日重點: 內容.今日重點,
    風險提醒: 內容.風險提醒,
    明日目標: 內容.明日目標,
    執行企劃: 內容.執行企劃,
    今日資料快照: 今日資料,
    昨日資料快照: 昨日資料,
    核心指標: {
      今日核心一: 內容.排序[0]?.鍵 || "無",
      今日核心二: 內容.排序[1]?.鍵 || "無",
      今日核心三: 內容.排序[2]?.鍵 || "無",
      權重總和: 權重總和(今日權重),
      退貨比率: 內容.退貨比率,
      實收變化率: 百分比變化(今日資料.當日實收金額, 昨日資料.當日實收金額),
      續單變化率: 百分比變化(今日資料.續單金額, 昨日資料.續單金額),
      本月變化率: 百分比變化(今日資料.本月業績, 昨日資料.本月業績)
    }
  };
  await 寫入JSON(今日企劃JSON檔, 企劃);
  await 寫入文字(今日企劃文字檔, 產生企劃書文字(企劃));
  await 寫入JSON(系統狀態檔, {
    ...系統狀態,
    進化次數: (系統狀態.進化次數 || 0) + 1,
    最後企劃日期: 今日日期,
    最後執行時間: 企劃.生成時間,
    最後資料日期: 今日資料.日期 || "",
    最後權重: 今日權重
  });
  await 追加日誌(`今日企劃書已生成：${今日日期}｜${企劃.版本編號}`);
  return 企劃;
}

const 首頁樣式 = `
*{box-sizing:border-box}
:root{--底:#050911;--面:#0d1728;--面二:#111d31;--框:rgba(255,255,255,.11);--框強:rgba(70,220,255,.34);--字:#f4f8ff;--副:#aab8d0;--淡:#6f7d96;--青:#46dcff;--金:#f7c95f;--綠:#5ff0a6;--橙:#ffb65f;--紅:#ff687d;--陰影:0 18px 46px rgba(0,0,0,.42);--半徑:8px}
html,body{margin:0;min-height:100%}
body{font-family:"Microsoft JhengHei","Noto Sans TC","PingFang TC",sans-serif;color:var(--字);background:linear-gradient(180deg,rgba(5,9,17,.98),rgba(8,16,28,.98)),linear-gradient(90deg,rgba(70,220,255,.06),rgba(247,201,95,.05));min-height:100vh}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;opacity:.18;mask-image:linear-gradient(180deg,rgba(0,0,0,.95),rgba(0,0,0,.45))}
body:after{content:"";position:fixed;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 0%,rgba(70,220,255,.08) 44%,transparent 58%);opacity:.42}
button,input{font:inherit}
button{min-height:42px;max-width:100%;border:0;border-radius:var(--半徑);padding:10px 14px;cursor:pointer;font-weight:800;color:#061019;background:linear-gradient(135deg,var(--金),#ffe7a0);box-shadow:0 10px 24px rgba(247,201,95,.18)}
button.次{color:var(--字);border:1px solid var(--框);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.035));box-shadow:none}
button:disabled{opacity:.55;cursor:not-allowed}
input{width:100%;min-width:0;padding:12px 13px;border-radius:var(--半徑);border:1px solid rgba(255,255,255,.12);color:var(--字);background:#09111e;outline:none}
input:focus{border-color:var(--框強);box-shadow:0 0 0 3px rgba(70,220,255,.08)}
.頁面{position:relative;z-index:1;width:min(1740px,96vw);margin:0 auto;padding:18px 0 36px}
.頂列{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:14px;color:var(--副)}
.品牌{display:flex;align-items:center;gap:10px;min-width:0}.標記{width:10px;height:10px;border-radius:50%;background:var(--綠);box-shadow:0 0 18px var(--綠)}.品牌 strong{color:var(--字);font-size:15px}.品牌 span,.時間列{font-size:12px;color:var(--副)}
.總控{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(360px,.75fr);gap:14px;margin-bottom:14px}
.面板{border:1px solid var(--框);border-radius:var(--半徑);background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018)),rgba(10,18,32,.92);box-shadow:var(--陰影);overflow:hidden}
.主視覺{padding:22px;position:relative;min-height:292px}
.主視覺:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(70,220,255,.10),transparent 36%),repeating-linear-gradient(90deg,transparent 0 32px,rgba(255,255,255,.025) 32px 33px);pointer-events:none}
.主內容{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:center}
.小標{display:inline-flex;width:max-content;max-width:100%;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--半徑);border:1px solid rgba(255,255,255,.12);color:var(--金);font-size:12px;font-weight:800;background:rgba(255,255,255,.04)}
h1{margin:14px 0 12px;font-size:48px;line-height:1.12}.副說明{margin:0;max-width:780px;color:var(--副);font-size:15px;line-height:1.85}.按鈕列{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
.雷達{position:relative;height:250px;border:1px solid rgba(70,220,255,.18);border-radius:var(--半徑);background:linear-gradient(180deg,rgba(70,220,255,.07),rgba(255,255,255,.02)),repeating-linear-gradient(0deg,transparent 0 18px,rgba(255,255,255,.028) 18px 19px)}
.雷達:before{content:"";position:absolute;inset:34px;border:1px solid rgba(247,201,95,.28);border-radius:50%;box-shadow:inset 0 0 38px rgba(70,220,255,.10),0 0 34px rgba(70,220,255,.10);animation:呼吸 4s ease-in-out infinite}
.雷達:after{content:"";position:absolute;inset:72px;border:1px solid rgba(70,220,255,.25);border-radius:50%}.掃描線{position:absolute;left:50%;top:50%;width:2px;height:110px;transform-origin:50% 0;background:linear-gradient(180deg,var(--青),transparent);animation:掃描 5.5s linear infinite}
.核心字{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:28px}.核心字 strong{display:block;font-size:18px;line-height:1.45;color:var(--金)}.核心字 span{display:block;margin-top:10px;color:var(--副);font-size:12px;line-height:1.6}
.狀態組{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:14px}.狀態格{min-height:132px;border:1px solid var(--框);border-radius:var(--半徑);padding:14px;background:rgba(255,255,255,.035)}
.狀態格 span,.資訊標,.目標{display:block;color:var(--副);font-size:12px;margin-bottom:8px}.狀態格 strong,.資訊值,.目值{display:block;color:var(--字);font-size:24px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}.狀態格 small,.資訊補{display:block;margin-top:8px;color:var(--淡);font-size:12px;line-height:1.5}
.資訊排{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:14px}.資訊卡{min-height:120px;padding:16px;border:1px solid var(--框);border-radius:var(--半徑);background:linear-gradient(180deg,rgba(17,29,49,.96),rgba(9,17,30,.96));box-shadow:var(--陰影)}.資訊值{font-size:26px}
.主區{display:grid;grid-template-columns:380px minmax(0,1fr) 390px;gap:14px;margin-bottom:14px}.直欄{display:grid;gap:14px;align-content:start}.卡{padding:16px}
.標題列{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.標題列 h2{margin:0;font-size:20px;line-height:1.25}.小字{color:var(--副);font-size:12px;line-height:1.55;text-align:right}
.表單{display:grid;grid-template-columns:1fr 1fr;gap:10px}label{display:flex;flex-direction:column;gap:7px;font-size:13px;color:#d8e3f4}.滿{grid-column:1/-1}.操作列{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}.訊息{min-height:22px;margin-top:12px;font-size:13px;color:var(--綠);font-weight:800}
.清單{display:grid;gap:10px}.項,.條,.目項{border:1px solid rgba(255,255,255,.09);border-radius:var(--半徑);background:rgba(255,255,255,.035)}.項{padding:14px}.項標{font-size:15px;font-weight:900;margin-bottom:7px;color:var(--金)}.項文{color:var(--副);font-size:14px;line-height:1.8}
.摘要清單{margin:0;padding-left:20px;color:var(--副);line-height:1.9;font-size:14px}.雙欄{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(300px,.95fr);gap:14px}.條列{display:grid;gap:10px}.條{padding:12px}.條頭{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:9px;font-size:13px;font-weight:900}.條底{width:100%;height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.條內{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--青),var(--金));box-shadow:0 0 18px rgba(70,220,255,.28)}
.目標格{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.目項{padding:12px;min-width:0}.目值{font-size:18px}.戰情帶{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.戰情格{padding:13px;border:1px solid var(--框);border-radius:var(--半徑);background:rgba(255,255,255,.03)}.戰情格 strong{display:block;font-size:16px;margin-bottom:6px;color:var(--字)}.戰情格 span{color:var(--副);font-size:13px;line-height:1.7}
.歷史清單{max-height:560px;overflow:auto;padding-right:2px}.空{color:var(--副);font-size:14px}.正{color:var(--綠)}.警{color:var(--橙)}.危{color:var(--紅)}
@keyframes 掃描{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes 呼吸{0%,100%{opacity:.75}50%{opacity:1}}
@media (max-width:1400px){.總控,.主內容,.雙欄{grid-template-columns:1fr}.主區{grid-template-columns:1fr 1fr}.右欄{grid-column:1/-1}.資訊排{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:900px){h1{font-size:34px}.主區,.資訊排,.狀態組,.戰情帶,.目標格,.表單{grid-template-columns:1fr}.頁面{width:min(100% - 22px,1740px);padding-top:12px}.頂列{align-items:flex-start;flex-direction:column}.小字{text-align:left}.主視覺{padding:16px}}
`;

const 首頁腳本 = `
const 取 = (id) => document.getElementById(id);
const 介面 = {
  頁首時間:取("頁首時間"),版本編號:取("版本編號"),資料日期:取("資料日期"),最後執行:取("最後執行"),進化次數:取("進化次數"),
  今日主軸:取("今日主軸"),核心副標:取("核心副標"),卡實收:取("卡實收"),卡實收補:取("卡實收補"),卡續單:取("卡續單"),卡續單補:取("卡續單補"),
  卡本月:取("卡本月"),卡本月補:取("卡本月補"),卡追續:取("卡追續"),卡退貨率:取("卡退貨率"),卡退貨補:取("卡退貨補"),
  日期:取("日期"),當日客單價:取("當日客單價"),當日實收金額:取("當日實收金額"),本月業績:取("本月業績"),上月業績:取("上月業績"),
  整體客單價:取("整體客單價"),續單金額:取("續單金額"),追續成交總數:取("追續成交總數"),取消退貨金額:取("取消退貨金額"),
  查詢日期:取("查詢日期"),訊息區:取("訊息區"),戰情帶:取("戰情帶"),重點清單:取("重點清單"),執行企劃區:取("執行企劃區"),
  風險區:取("風險區"),權重列:取("權重列"),目標格:取("目標格"),摘要清單:取("摘要清單"),歷史清單:取("歷史清單"),快照格:取("快照格"),
  重整按鈕:取("重整按鈕"),重算按鈕:取("重算按鈕"),儲存按鈕:取("儲存按鈕"),儲存重算按鈕:取("儲存重算按鈕"),查詢按鈕:取("查詢按鈕"),回今日按鈕:取("回今日按鈕")
};
function 節點(標籤, 類別, 文字){const 元素=document.createElement(標籤);if(類別)元素.className=類別;if(文字!==undefined)元素.textContent=文字;return 元素}
function 清空(目標, 子節點){目標.replaceChildren.apply(目標, 子節點)}
function 今日日期字串(){return new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}
function 格式化數字(值){return Number(值||0).toLocaleString("zh-TW")}
function 差異字(值){const 數字=Number(值||0);if(數字>0)return "上升 "+數字+"%";if(數字<0)return "下降 "+Math.abs(數字)+"%";return "持平 0%"}
function 設定訊息(文字, 狀態){介面.訊息區.textContent=文字||"";介面.訊息區.className="訊息 "+(狀態||"正")}
function 填入表單(資料){資料=資料||{};介面.日期.value=資料.日期||今日日期字串();介面.查詢日期.value=今日日期字串();["當日客單價","當日實收金額","本月業績","上月業績","整體客單價","續單金額","追續成交總數","取消退貨金額"].forEach(function(鍵){介面[鍵].value=資料[鍵]??""})}
function 讀取表單(){return {日期:介面.日期.value||今日日期字串(),當日客單價:Number(介面.當日客單價.value||0),當日實收金額:Number(介面.當日實收金額.value||0),本月業績:Number(介面.本月業績.value||0),上月業績:Number(介面.上月業績.value||0),整體客單價:Number(介面.整體客單價.value||0),續單金額:Number(介面.續單金額.value||0),追續成交總數:Number(介面.追續成交總數.value||0),取消退貨金額:Number(介面.取消退貨金額.value||0)}}
function 建項目(標題, 說明){const 外=節點("div","項");外.append(節點("div","項標",標題||"--"),節點("div","項文",說明||""));return 外}
function 渲染重點(企劃){const 列=(企劃?.今日重點||[]).map(function(項目){return 建項目(項目.標題,項目.說明)});清空(介面.重點清單,列.length?列:[節點("div","空","目前沒有資料")])}
function 渲染摘要(企劃){const 列=(企劃?.摘要||[]).map(function(文字){return 節點("li","",文字)});清空(介面.摘要清單,列.length?列:[節點("li","","目前沒有資料")])}
function 渲染執行企劃(企劃){const 執行=(企劃?.執行企劃||[]).map(function(區塊){return 建項目(區塊.區塊,區塊.內容)});清空(介面.執行企劃區,執行.length?執行:[節點("div","空","目前沒有資料")]);const 風險=(企劃?.風險提醒||[]).map(function(句子){return 建項目("風險提醒",句子)});清空(介面.風險區,風險.length?風險:[節點("div","空","目前沒有資料")])}
function 渲染權重(企劃){const 權重=企劃?.今日權重||{};const 列=Object.entries(權重).sort(function(a,b){return b[1]-a[1]}).map(function(項){const 外=節點("div","條");const 頭=節點("div","條頭");頭.append(節點("span","",項[0]),節點("strong","",String(項[1])));const 底=節點("div","條底");const 內=節點("div","條內");內.style.width=Math.max(0,Math.min(100,Number(項[1])/3))+"%";底.append(內);外.append(頭,底);return 外});清空(介面.權重列,列.length?列:[節點("div","空","目前沒有資料")])}
function 渲染目標(企劃){const 列=Object.entries(企劃?.明日目標||{}).map(function(項){const 外=節點("div","目項");外.append(節點("div","目標",項[0]),節點("div","目值",格式化數字(項[1])));return 外});清空(介面.目標格,列.length?列:[節點("div","空","目前沒有資料")])}
function 渲染快照(企劃){const 列=Object.entries(企劃?.今日資料快照||{}).map(function(項){const 外=節點("div","目項");外.append(節點("div","目標",項[0]),節點("div","目值",typeof 項[1]==="number"?格式化數字(項[1]):String(項[1]||"")));return 外});清空(介面.快照格,列.length?列:[節點("div","空","目前沒有資料")])}
function 渲染歷史(歷史){const 列=(歷史||[]).slice(0,30).map(function(企劃){return 建項目((企劃.企劃日期||"--")+"｜"+(企劃.版本編號||"--"),"資料日期："+(企劃.資料日期||"--"))});清空(介面.歷史清單,列.length?列:[節點("div","空","目前沒有紀錄")])}
function 渲染主軸(企劃){const 核心=企劃?.核心指標||{};介面.今日主軸.textContent=(核心.今日核心一||"待分析")+" ＋ "+(核心.今日核心二||"待分析");介面.核心副標.textContent="實收 "+(核心.實收變化率??"--")+"%｜續單 "+(核心.續單變化率??"--")+"%｜退貨 "+(核心.退貨比率??"--")+"%"}
function 渲染戰情帶(企劃){const 核心=企劃?.核心指標||{};const 權重總和=核心.權重總和||0;const 資料=[["權重鎖定",String(權重總和),權重總和===1000?"總和 1000，排序可用":"權重需確認"],["核心三軸",核心.今日核心三||"待分析","前三大權重自動鎖定"],["退貨控管",(核心.退貨比率??0)+"%",Number(核心.退貨比率||0)>=8?"高風險，先壓退貨":"風險正常"]].map(function(項){const 外=節點("div","戰情格");外.append(節點("strong","",項[0]+"｜"+項[1]),節點("span","",項[2]));return 外});清空(介面.戰情帶,資料)}
function 渲染總覽(資料){const 企劃=資料.最新企劃||null;const 最新資料=資料.最新資料||{};const 核心=企劃?.核心指標||{};介面.頁首時間.textContent=資料.系統時間||"--";介面.版本編號.textContent=企劃?.版本編號||"--";介面.資料日期.textContent=企劃?.資料日期||"--";介面.最後執行.textContent=資料.系統狀態?.最後執行時間||"--";介面.進化次數.textContent=資料.系統狀態?.進化次數??0;介面.卡實收.textContent=格式化數字(最新資料.當日實收金額);介面.卡實收補.textContent="較前日 "+差異字(核心.實收變化率);介面.卡續單.textContent=格式化數字(最新資料.續單金額);介面.卡續單補.textContent="較前日 "+差異字(核心.續單變化率);介面.卡本月.textContent=格式化數字(最新資料.本月業績);介面.卡本月補.textContent="較前日 "+差異字(核心.本月變化率);介面.卡追續.textContent=格式化數字(最新資料.追續成交總數);介面.卡退貨率.textContent=(核心.退貨比率??0)+"%";介面.卡退貨補.textContent=Number(核心.退貨比率||0)>=8?"高風險，今日優先控退貨":"風險正常";介面.卡退貨補.className=Number(核心.退貨比率||0)>=8?"資訊補 危":"資訊補 正";填入表單(最新資料);渲染主軸(企劃);渲染戰情帶(企劃);渲染重點(企劃);渲染摘要(企劃);渲染執行企劃(企劃);渲染權重(企劃);渲染目標(企劃);渲染快照(企劃);渲染歷史(資料.企劃歷史)}
async function 讀取戰情室(){const 回應=await fetch("/系統資料");const 資料=await 回應.json();渲染總覽(資料)}
async function 查詢企劃書(){const 日期=介面.查詢日期.value||今日日期字串();設定訊息("查詢中...","警");const 回應=await fetch("/查詢企劃書?日期="+encodeURIComponent(日期));const 資料=await 回應.json();if(!資料.成功||!資料.企劃){設定訊息("查無該日企劃書","危");return}渲染主軸(資料.企劃);渲染戰情帶(資料.企劃);渲染重點(資料.企劃);渲染摘要(資料.企劃);渲染執行企劃(資料.企劃);渲染權重(資料.企劃);渲染目標(資料.企劃);渲染快照(資料.企劃);介面.版本編號.textContent=資料.企劃.版本編號||"--";介面.資料日期.textContent=資料.企劃.資料日期||"--";設定訊息("查詢完成","正")}
async function 儲存資料(儲存後重算){設定訊息("資料儲存中...","警");const 回應=await fetch("/儲存資料",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(讀取表單())});const 結果=await 回應.json();if(!結果.成功){設定訊息("儲存失敗","危");return}設定訊息("資料已儲存完成","正");if(儲存後重算)await 重算企劃書();else await 讀取戰情室()}
async function 重算企劃書(){設定訊息("今日企劃書重算中...","警");const 回應=await fetch("/重算企劃書",{method:"POST"});const 結果=await 回應.json();if(!結果.成功){設定訊息("重算失敗","危");return}設定訊息("今日企劃書已更新","正");await 讀取戰情室()}
介面.重整按鈕.addEventListener("click",讀取戰情室);介面.重算按鈕.addEventListener("click",重算企劃書);介面.儲存按鈕.addEventListener("click",function(){儲存資料(false)});介面.儲存重算按鈕.addEventListener("click",function(){儲存資料(true)});介面.查詢按鈕.addEventListener("click",查詢企劃書);介面.回今日按鈕.addEventListener("click",讀取戰情室);
讀取戰情室();setInterval(讀取戰情室,30000);
`;

function 首頁HTML() {
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>董事長全端自動戰情室｜大數據總控台</title>
  <style>${首頁樣式}</style>
</head>
<body>
  <div class="頁面">
    <header class="頂列">
      <div class="品牌"><span class="標記"></span><strong>董事長戰情室</strong><span>單檔全端系統｜本機資料保存｜每日 09:00 自動優化</span></div>
      <div class="時間列">台灣時間 <span id="頁首時間">--</span></div>
    </header>
    <section class="總控">
      <div class="面板 主視覺"><div class="主內容"><div><div class="小標">BOARD COMMAND CENTER｜BIG DATA CONTROL</div><h1>董事長全端自動戰情室<br>大數據總控台</h1><p class="副說明">一支程式完成前端、後端、每日資料、權重優化、企劃書、歷史查詢與巡檢。畫面先看總盤，再看風險，再看明日目標；數字不散，決策不亂。</p><div class="按鈕列"><button id="重算按鈕">立即重算今日企劃書</button><button id="重整按鈕" class="次">重新同步戰情室</button></div></div><div class="雷達"><div class="掃描線"></div><div class="核心字"><div><strong id="今日主軸">分析中</strong><span id="核心副標">等待系統同步資料</span></div></div></div></div></div>
      <div class="面板 狀態組"><div class="狀態格"><span>系統狀態</span><strong class="正">在線</strong><small>自動巡檢運行中</small></div><div class="狀態格"><span>進化次數</span><strong id="進化次數">0</strong><small>累積企劃書版本</small></div><div class="狀態格"><span>版本編號</span><strong id="版本編號">--</strong><small>每日自動進化</small></div><div class="狀態格"><span>最後執行</span><strong id="最後執行">--</strong><small>企劃書生成時間</small></div></div>
    </section>
    <section class="資訊排"><div class="資訊卡"><div class="資訊標">資料日期</div><div class="資訊值" id="資料日期">--</div><div class="資訊補">最後同步日</div></div><div class="資訊卡"><div class="資訊標">當日實收</div><div class="資訊值" id="卡實收">0</div><div class="資訊補" id="卡實收補">較前日 --</div></div><div class="資訊卡"><div class="資訊標">續單金額</div><div class="資訊值" id="卡續單">0</div><div class="資訊補" id="卡續單補">較前日 --</div></div><div class="資訊卡"><div class="資訊標">本月業績</div><div class="資訊值" id="卡本月">0</div><div class="資訊補" id="卡本月補">較前日 --</div></div><div class="資訊卡"><div class="資訊標">追續成交</div><div class="資訊值" id="卡追續">0</div><div class="資訊補">成交總數</div></div><div class="資訊卡"><div class="資訊標">退貨比率</div><div class="資訊值" id="卡退貨率">0%</div><div class="資訊補" id="卡退貨補">風險正常</div></div></section>
    <section class="主區">
      <div class="直欄"><div class="面板 卡"><div class="標題列"><h2>每日資料輸入中心</h2><div class="小字">輸入一次，自動生成企劃書</div></div><div class="表單"><label class="滿">日期<input id="日期" type="date"></label><label>當日客單價<input id="當日客單價" type="number"></label><label>當日實收金額<input id="當日實收金額" type="number"></label><label>本月業績<input id="本月業績" type="number"></label><label>上月業績<input id="上月業績" type="number"></label><label>整體客單價<input id="整體客單價" type="number"></label><label>續單金額<input id="續單金額" type="number"></label><label>追續成交總數<input id="追續成交總數" type="number"></label><label>取消退貨金額<input id="取消退貨金額" type="number"></label></div><div class="操作列"><button id="儲存重算按鈕">儲存並重算</button><button id="儲存按鈕" class="次">只儲存資料</button></div><div class="訊息" id="訊息區"></div></div><div class="面板 卡"><div class="標題列"><h2>指定日期查詢</h2><div class="小字">查歷史企劃書</div></div><div class="表單"><label class="滿">企劃日期<input id="查詢日期" type="date"></label></div><div class="操作列"><button id="查詢按鈕">查詢該日企劃書</button><button id="回今日按鈕" class="次">回到今日</button></div></div></div>
      <div class="直欄"><div class="面板 卡"><div class="標題列"><h2>董事長決策主盤</h2><div class="小字">重點、企劃、風險一次看</div></div><div class="戰情帶" id="戰情帶"></div><div style="height:14px"></div><div class="雙欄"><div><div class="標題列"><h2>今日最該盯的三個重點</h2><div class="小字">優先順序</div></div><div id="重點清單" class="清單"></div></div><div><div class="標題列"><h2>風險提醒</h2><div class="小字">先壓風險</div></div><div id="風險區" class="清單"></div></div></div></div><div class="面板 卡"><div class="標題列"><h2>今日執行企劃</h2><div class="小字">上午、下午、晚上</div></div><div id="執行企劃區" class="清單"></div></div><div class="面板 卡"><div class="標題列"><h2>進化權重總覽</h2><div class="小字">基準鎖死｜總和固定 1000</div></div><div class="雙欄"><div id="權重列" class="條列"></div><div><div class="標題列"><h2>明日目標值</h2><div class="小字">自動生成</div></div><div id="目標格" class="目標格"></div></div></div></div></div>
      <div class="直欄 右欄"><div class="面板 卡"><div class="標題列"><h2>自動優化摘要</h2><div class="小字">今日判讀</div></div><ul id="摘要清單" class="摘要清單"></ul></div><div class="面板 卡"><div class="標題列"><h2>核心數據快照</h2><div class="小字">原始資料</div></div><div id="快照格" class="目標格"></div></div><div class="面板 卡"><div class="標題列"><h2>最近企劃紀錄</h2><div class="小字">最近三十筆</div></div><div id="歷史清單" class="清單 歷史清單"></div></div></div>
    </section>
  </div>
  <script>${首頁腳本}</script>
</body>
</html>`;
}

function 回傳JSON(回應, 狀態碼, 資料) {
  回應.writeHead(狀態碼, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  回應.end(JSON.stringify(資料, null, 2));
}

function 回傳HTML(回應, 內容) {
  回應.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  回應.end(內容);
}

function 讀取請求內容(請求) {
  return new Promise((解析, 拒絕) => {
    let 內容 = "";
    請求.on("data", (區塊) => {
      內容 += 區塊;
      if (內容.length > 10 * 1024 * 1024) 拒絕(new Error("資料過大"));
    });
    請求.on("end", () => {
      try {
        解析(內容 ? JSON.parse(內容) : {});
      } catch {
        解析({});
      }
    });
    請求.on("error", 拒絕);
  });
}

async function 處理請求(請求, 回應) {
  const 網址 = new URL(請求.url, "http://localhost:" + 埠號);
  const 路徑 = decodeURIComponent(網址.pathname);

  if (請求.method === "OPTIONS") {
    回應.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    回應.end();
    return;
  }

  try {
    if (請求.method === "GET" && 路徑 === "/") {
      回傳HTML(回應, 首頁HTML());
      return;
    }

    if (請求.method === "GET" && 路徑 === "/系統資料") {
      await 確保系統存在();
      const 系統狀態 = await 讀取JSON(系統狀態檔, {});
      const 全部資料 = 依日期排序(await 讀取JSON(每日資料檔, []));
      const 企劃歷史 = await 讀取企劃歷史();
      回傳JSON(回應, 200, {
        成功: true,
        系統時間: 台灣時間字串(),
        系統狀態,
        最新資料: 全部資料.length ? 全部資料[全部資料.length - 1] : null,
        最新企劃: 企劃歷史.length ? 企劃歷史[0] : null,
        企劃歷史
      });
      return;
    }

    if (請求.method === "GET" && 路徑 === "/查詢企劃書") {
      const 日期 = 網址.searchParams.get("日期") || "";
      if (!日期) {
        回傳JSON(回應, 400, { 成功: false, 訊息: "缺少日期" });
        return;
      }
      回傳JSON(回應, 200, { 成功: true, 企劃: await 依日期讀取企劃書(日期) });
      return;
    }

    if (請求.method === "POST" && 路徑 === "/儲存資料") {
      const 資料列 = await 儲存每日資料(await 讀取請求內容(請求));
      回傳JSON(回應, 200, { 成功: true, 訊息: "資料已儲存", 資料: 資料列 });
      return;
    }

    if (請求.method === "POST" && 路徑 === "/重算企劃書") {
      回傳JSON(回應, 200, { 成功: true, 訊息: "今日企劃書已完成重算", 企劃: await 執行今日優化(true) });
      return;
    }

    if (請求.method === "GET" && 路徑 === "/今日企劃書") {
      回傳JSON(回應, 200, { 成功: true, 企劃: await 執行今日優化(false) });
      return;
    }

    回傳JSON(回應, 404, { 成功: false, 訊息: "找不到對應路徑" });
  } catch (錯誤) {
    await 追加日誌(`錯誤：${錯誤.message}`);
    回傳JSON(回應, 500, { 成功: false, 訊息: "系統發生錯誤", 錯誤: 錯誤.message });
  }
}

async function 巡檢系統() {
  await 確保系統存在();
  const 狀態 = await 讀取JSON(系統狀態檔, {});
  狀態.最後巡檢時間 = 台灣時間字串();
  await 寫入JSON(系統狀態檔, 狀態);
}

async function 啟動排程() {
  await 確保系統存在();
  await 執行今日優化(false);
  await 巡檢系統();
  setInterval(async () => {
    try {
      await 巡檢系統();
      const 現在 = 台灣時間拆解();
      const 狀態 = await 讀取JSON(系統狀態檔, { 最後企劃日期: "" });
      if (
        現在.小時 === 自動執行時間.小時 &&
        現在.分鐘 === 自動執行時間.分鐘 &&
        狀態.最後企劃日期 !== 現在.日期
      ) {
        await 執行今日優化(false);
      }
    } catch (錯誤) {
      await 追加日誌(`巡檢失敗：${錯誤.message}`);
    }
  }, 巡檢毫秒);
}

async function 啟動系統() {
  await 確保系統存在();
  await 啟動排程();
  const 伺服器 = http.createServer(處理請求);
  伺服器.listen(埠號, async () => {
    console.log("董事長全端自動戰情室已啟動");
    console.log("開啟網址：http://localhost:" + 埠號);
    console.log("台灣時間：" + 台灣時間字串());
    console.log("每日自動優化時間：" + String(自動執行時間.小時).padStart(2, "0") + ":" + String(自動執行時間.分鐘).padStart(2, "0"));
    await 追加日誌("系統啟動完成");
  });
}

啟動系統();
