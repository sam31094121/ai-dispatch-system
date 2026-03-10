// ════════════════════════════════════════════════════
// 後端系統自動維修引擎（啟動時自動執行）
// 偵測重複模組 → 計算總分 → 保留最強版本 → 合併功能 → 寫入紀錄
// ════════════════════════════════════════════════════

import { getDb } from '../db/database.js';

// ─── 重新匯出型別（供 route 使用）───
export interface 後端模組設定 {
  模組代碼: string;
  模組名稱: string;
  路由路徑: string;
  類別: string;
  功能清單: string[];
  是否核心: boolean;
  是否啟用: boolean;
  強度分數: number;
  優化分數: number;
}

export interface 後端衝突處理結果 {
  保留模組: 後端模組設定[];
  停用模組: 後端模組設定[];
  衝突說明: string[];
}

export interface 後端維修結果 extends 後端衝突處理結果 {
  維修時間: string;
}

// ─── 維修紀錄（寫入 DB） ───
export interface 維修紀錄 {
  id?: number;
  repair_time: string;
  action: string;
  detail: string;
  kept_count: number;
  disabled_count: number;
}

// ════════════════════════════════════════════════════
// 總分計算（依規則四）
// ════════════════════════════════════════════════════

function 計算後端模組總分(模組: 後端模組設定): number {
  const 核心加權 = 模組.是否核心 ? 30 : 0;
  const 啟用加權 = 模組.是否啟用 ? 10 : 0;
  const 功能加權 = 模組.功能清單.length * 4;
  return 模組.強度分數 + 模組.優化分數 + 核心加權 + 啟用加權 + 功能加權;
}

// ════════════════════════════════════════════════════
// 衝突判斷（規則二：重複、同路徑、同類別、功能重複）
// ════════════════════════════════════════════════════

function 是否後端模組衝突(甲: 後端模組設定, 乙: 後端模組設定): boolean {
  if (甲.模組代碼 === 乙.模組代碼) return true;
  if (甲.路由路徑 === 乙.路由路徑) return true;
  if (甲.類別 === 乙.類別) return true;

  const 甲功能 = new Set(甲.功能清單);
  let 重複數 = 0;
  for (const 功能 of 乙.功能清單) {
    if (甲功能.has(功能)) 重複數 += 1;
  }
  return 重複數 >= 2;
}

// ════════════════════════════════════════════════════
// 功能合併（規則六）
// ════════════════════════════════════════════════════

function 合併後端模組(保留模組: 後端模組設定, 停用模組: 後端模組設定): 後端模組設定 {
  return {
    ...保留模組,
    功能清單: Array.from(new Set([...保留模組.功能清單, ...停用模組.功能清單])),
  };
}

// ════════════════════════════════════════════════════
// 建立維修紀錄表
// ════════════════════════════════════════════════════

function 建立維修紀錄表() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS repair_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      repair_time TEXT NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL,
      kept_count INTEGER DEFAULT 0,
      disabled_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
}

function 寫入紀錄(紀錄: 維修紀錄) {
  const db = getDb();
  db.prepare(`
    INSERT INTO repair_logs (repair_time, action, detail, kept_count, disabled_count)
    VALUES (?, ?, ?, ?, ?)
  `).run(紀錄.repair_time, 紀錄.action, 紀錄.detail, 紀錄.kept_count, 紀錄.disabled_count);
}

// ════════════════════════════════════════════════════
// 預設後端模組清單（對應 server 的 6 大路由組）
// ════════════════════════════════════════════════════

const 後端預設模組清單: 後端模組設定[] = [
  {
    模組代碼: 'auth',
    模組名稱: '認證授權服務',
    路由路徑: '/api/v1/auth',
    類別: 'auth',
    功能清單: ['登入', '登出', '用戶驗證'],
    是否核心: true,
    是否啟用: true,
    強度分數: 95,
    優化分數: 92,
  },
  {
    模組代碼: 'reports',
    模組名稱: '日報管理服務',
    路由路徑: '/api/v1/reports',
    類別: 'report',
    功能清單: ['日報輸入', '解析', '審計', '修正', '歷史查詢'],
    是否核心: true,
    是否啟用: true,
    強度分數: 98,
    優化分數: 96,
  },
  {
    模組代碼: 'ranking',
    模組名稱: '排名計算服務',
    路由路徑: '/api/v1/rankings',
    類別: 'ranking',
    功能清單: ['三平台排名', '總體排名', 'A1A2BC分組'],
    是否核心: true,
    是否啟用: true,
    強度分數: 96,
    優化分數: 95,
  },
  {
    模組代碼: 'dispatch',
    模組名稱: '派單管理服務',
    路由路徑: '/api/v1/dispatch',
    類別: 'dispatch',
    功能清單: ['派單生成', '派單查詢', '分組管理'],
    是否核心: true,
    是否啟用: true,
    強度分數: 94,
    優化分數: 93,
  },
  {
    模組代碼: 'announcement',
    模組名稱: '公告管理服務',
    路由路徑: '/api/v1/announcements',
    類別: 'announcement',
    功能清單: ['公告生成', '公告查詢', '多版本輸出'],
    是否核心: true,
    是否啟用: true,
    強度分數: 93,
    優化分數: 94,
  },
  {
    模組代碼: 'history',
    模組名稱: '歷史紀錄服務',
    路由路徑: '/api/v1/history',
    類別: 'history',
    功能清單: ['報表歷史', '變更紀錄', '版本回溯'],
    是否核心: false,
    是否啟用: true,
    強度分數: 85,
    優化分數: 88,
  },
];

// ════════════════════════════════════════════════════
// 主入口：執行後端系統自動維修
// ════════════════════════════════════════════════════

export function 執行後端系統自動維修(模組清單?: 後端模組設定[]): 後端維修結果 {
  const 來源 = 模組清單 ?? 後端預設模組清單;
  const 已處理 = new Set<string>();
  const 保留模組: 後端模組設定[] = [];
  const 停用模組: 後端模組設定[] = [];
  const 衝突說明: string[] = [];
  const 維修時間 = new Date().toISOString();

  // 建立 DB 表
  建立維修紀錄表();

  for (const 模組 of 來源) {
    if (已處理.has(模組.模組代碼)) continue;

    // 找出所有與此模組衝突的候選
    const 候選清單 = 來源.filter((候選) => {
      if (已處理.has(候選.模組代碼)) return false;
      return 是否後端模組衝突(模組, 候選);
    });

    // 核心優先（規則七）：若有核心衝突，優先保留核心模組
    const 有核心 = 候選清單.filter((m) => m.是否核心);
    const 候選池 = 有核心.length > 0 ? 有核心 : 候選清單;

    // 按總分降序，取第一個（最高分）保留（規則三）
    const 保留 = [...候選池].sort((a, b) => 計算後端模組總分(b) - 計算後端模組總分(a))[0];
    let 合併後保留 = { ...保留 };

    for (const 候選 of 候選清單) {
      已處理.add(候選.模組代碼);

      if (候選.模組代碼 !== 保留.模組代碼) {
        // 規則六：合併有用功能
        合併後保留 = 合併後端模組(合併後保留, 候選);
        停用模組.push({ ...候選, 是否啟用: false });
      }
    }

    if (候選清單.length > 1) {
      衝突說明.push(
        `後端模組衝突：${候選清單.map((項目) => 項目.模組名稱).join('、')}，已保留「${保留.模組名稱}」`
      );
    }

    保留模組.push(合併後保留);
  }

  const 結果: 後端維修結果 = {
    保留模組,
    停用模組,
    衝突說明,
    維修時間,
  };

  // 寫入 DB 紀錄（規則十）
  寫入紀錄({
    repair_time: 維修時間,
    action: '後端自動維修',
    detail: `輸入 ${來源.length} 個模組，保留 ${保留模組.length}，停用 ${停用模組.length}。${衝突說明.join('；')}`,
    kept_count: 保留模組.length,
    disabled_count: 停用模組.length,
  });

  return 結果;
}

// ════════════════════════════════════════════════════
// 查詢維修紀錄
// ════════════════════════════════════════════════════

export function 查詢維修紀錄(最近幾筆 = 50): 維修紀錄[] {
  建立維修紀錄表();
  const db = getDb();
  return db.prepare(`
    SELECT * FROM repair_logs ORDER BY id DESC LIMIT ?
  `).all(最近幾筆) as 維修紀錄[];
}

export function 查詢最新維修(): 維修紀錄 | null {
  建立維修紀錄表();
  const db = getDb();
  const row = db.prepare(`
    SELECT * FROM repair_logs ORDER BY id DESC LIMIT 1
  `).get();
  return (row as 維修紀錄) ?? null;
}
