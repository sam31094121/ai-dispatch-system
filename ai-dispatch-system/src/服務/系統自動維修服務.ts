import {
  核心頁面清單,
  type 自動維修結果,
  type 模組衝突紀錄,
  type 頁面設定,
  type 停用功能紀錄,
} from "../設定/核心系統設定";
import { NAV_GROUPS, type NavGroupConfig } from "../constants/moduleConfig";

function 計算模組總分(頁面: 頁面設定): number {
  const 核心加權 = 頁面.是否核心 ? 30 : 0;
  const 啟用加權 = 頁面.是否啟用 ? 10 : 0;
  const 功能加權 = 頁面.功能清單.length * 3;
  const 別名加權 = 頁面.別名清單.length;
  return 頁面.強度分數 + 頁面.優化分數 + 核心加權 + 啟用加權 + 功能加權 + 別名加權;
}

function 是否名稱近似(甲: 頁面設定, 乙: 頁面設定): boolean {
  if (甲.名稱 === 乙.名稱) return true;
  return 甲.別名清單.some((別名) => 乙.別名清單.includes(別名));
}

function 是否功能重複(甲: 頁面設定, 乙: 頁面設定): boolean {
  const 甲功能 = new Set(甲.功能清單);
  const 乙功能 = new Set(乙.功能清單);
  let 重疊數 = 0;

  for (const 功能 of 甲功能) {
    if (乙功能.has(功能)) 重疊數 += 1;
  }

  return 重疊數 >= 2 || 甲.類別 === 乙.類別;
}

function 合併功能(保留頁面: 頁面設定, 停用頁面: 頁面設定): 頁面設定 {
  return {
    ...保留頁面,
    功能清單: Array.from(new Set([...保留頁面.功能清單, ...停用頁面.功能清單])),
    別名清單: Array.from(new Set([...保留頁面.別名清單, ...停用頁面.別名清單, 停用頁面.名稱])),
  };
}

function 決定保留模組(候選清單: 頁面設定[]): 頁面設定 {
  return [...候選清單].sort((a, b) => {
    const 分數差 = 計算模組總分(b) - 計算模組總分(a);
    if (分數差 !== 0) return 分數差;
    return a.顯示順序 - b.顯示順序;
  })[0];
}

let _快取結果: 自動維修結果 | null = null;

export function 執行系統自動維修(): 自動維修結果 {
  if (_快取結果) return _快取結果;

  const 原始清單 = [...核心頁面清單];
  const 已處理 = new Set<string>();
  const 保留頁面: 頁面設定[] = [];
  const 衝突紀錄: 模組衝突紀錄[] = [];
  const 停用功能紀錄: 停用功能紀錄[] = [];

  for (let i = 0; i < 原始清單.length; i += 1) {
    const 目前頁面 = 原始清單[i];
    if (已處理.has(目前頁面.代碼)) continue;

    const 衝突候選 = 原始清單.filter((頁面) => {
      if (已處理.has(頁面.代碼)) return false;

      const 路徑重複 = 頁面.路徑 === 目前頁面.路徑 && 頁面.代碼 !== 目前頁面.代碼;
      const 名稱近似 = 頁面.代碼 !== 目前頁面.代碼 && 是否名稱近似(頁面, 目前頁面);
      const 功能重複 = 頁面.代碼 !== 目前頁面.代碼 && 是否功能重複(頁面, 目前頁面);

      return 頁面.代碼 === 目前頁面.代碼 || 路徑重複 || 名稱近似 || 功能重複;
    });

    const 保留模組 = 決定保留模組(衝突候選);
    let 最終保留模組 = { ...保留模組 };

    const 停用模組 = 衝突候選.filter((頁面) => 頁面.代碼 !== 保留模組.代碼);

    for (const 停用頁面 of 停用模組) {
      最終保留模組 = 合併功能(最終保留模組, 停用頁面);

      停用功能紀錄.push({
        舊功能名稱: 停用頁面.名稱,
        停用原因: `偵測到與「${保留模組.名稱}」重複或衝突，已自動停用並合併有用功能`,
        保留對象代碼: 保留模組.代碼,
      });
    }

    if (停用模組.length > 0) {
      衝突紀錄.push({
        衝突類型:
          停用模組.some((頁面) => 頁面.路徑 === 目前頁面.路徑)
            ? "路徑重複"
            : 停用模組.some((頁面) => 頁面.類別 === 目前頁面.類別)
            ? "類別衝突"
            : 停用模組.some((頁面) => 是否名稱近似(頁面, 目前頁面))
            ? "名稱近似"
            : "功能重複",
        候選模組代碼: 衝突候選.map((頁面) => 頁面.代碼),
        保留模組代碼: 保留模組.代碼,
        停用模組代碼: 停用模組.map((頁面) => 頁面.代碼),
        原因說明: `系統已自動比較強度分數、優化分數、核心權重、功能完整度，保留較強版本「${保留模組.名稱}」`,
      });
    }

    保留頁面.push(最終保留模組);

    for (const 頁面 of 衝突候選) {
      已處理.add(頁面.代碼);
    }
  }

  const 排序後頁面 = 保留頁面.sort((a, b) => a.顯示順序 - b.顯示順序);

  _快取結果 = {
    保留頁面: 排序後頁面,
    停用功能紀錄,
    衝突紀錄,
    維修摘要: [
      `保留頁面：${排序後頁面.length} 個`,
      `已停用重複或衝突模組：${停用功能紀錄.length} 個`,
      `已處理衝突批次：${衝突紀錄.length} 批`,
      "首頁只顯示最後保留版本",
      "所有被停用模組的有用功能已自動合併進保留中心",
    ],
  };

  return _快取結果;
}

// 輔助函式供 App.tsx 等外部使用
export function 取得原始維修結果(): 自動維修結果 {
  return 執行系統自動維修();
}

export function 取得保留中心設定(): 頁面設定[] {
  return 執行系統自動維修().保留頁面;
}

export function 取得保留頁面代碼(): Set<string> {
  return new Set(執行系統自動維修().保留頁面.map((p) => p.代碼));
}

export function 取得有效導覽群組(): NavGroupConfig[] {
  const activeKeys = 取得保留頁面代碼();
  return NAV_GROUPS
    .map((group) => ({
      ...group,
      centerKeys: group.centerKeys.filter((k) => activeKeys.has(k as string)) as any[],
    }))
    .filter((group) => group.centerKeys.length > 0)
    .sort((a, b) => a.order - b.order);
}
