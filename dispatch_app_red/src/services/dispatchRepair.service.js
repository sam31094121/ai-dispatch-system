const {
  GROUP_KEYS,
  AUDIT_METRICS
} = require('../constants/dispatchRules');
const { 
  buildExpectedGroups, 
  buildGroupShortText,
  toLegacyStandardData 
} = require('./dispatchBuild.service');
const { compareRankingRows } = require('./dispatchValidate.service');
const { applyAutoFix, cleanText } = require('../utils/name.util');
const { extractDatesFromTitle } = require('../utils/date.util');

/**
 * 智慧修復引擎 2.0
 * 接收一個 Report 物件，並嘗試進行主動修復以消除矛盾。
 */
function repairReport(report) {
  const fixes = [];
  const addFix = (field, action, detail) => {
    console.log(`[Repair] ${field}: ${action} - ${detail}`);
    fixes.push({ field, action, detail });
  };

  function applyAutoFix(value) {
    let text = cleanText(value);
    if (!text) return '';

    // 1. 基於 BANNED_NAME_PATTERNS 的自動修正 (更精確的正名邏輯)
    // 將「徐華(非妤的字)」替換為「徐華妤」
    if (/徐華(?!妤)/u.test(text)) {
      text = text.replace(/徐華./gu, '徐華妤'); // 直接替換掉錯字
    }

    // 2. 其他常見格式清理
    text = text.replace(/\uff0c/g, ',').replace(/\uff1a/g, ':');
    
    return text;
  }

  // 1. 名稱正名自動修正
  let nameFixedCount = 0;
  const fixName = (name) => {
    const fixed = applyAutoFix(name);
    if (fixed !== name) nameFixedCount++;
    return fixed;
  };

  report.rankings.forEach(row => row.name = fixName(row.name));
  GROUP_KEYS.forEach(key => {
    report.groups[key] = report.groups[key].map(fixName);
  });
  report.adviceList.forEach(item => item.name = fixName(item.name));
  report.audit.excludedEmployees.forEach(item => item.name = fixName(item.name));

  if (nameFixedCount > 0) {
    addFix('name', '自動正名', `已修正 ${nameFixedCount} 筆人名（如：將「徐華*」修正為「徐華妤」）`);
  }

  // 2. 日期同步
  if (report.title) {
    const extracted = extractDatesFromTitle(report.title);
    if (extracted.settlementDate && extracted.settlementDate !== report.settlementDate) {
      const old = report.settlementDate;
      report.settlementDate = extracted.settlementDate;
      addFix('settlementDate', '日期同步', `依標題將結算日從 "${old}" 修正為 "${report.settlementDate}"`);
    }
    if (extracted.dispatchDate && extracted.dispatchDate !== report.dispatchDate) {
      const old = report.dispatchDate;
      report.dispatchDate = extracted.dispatchDate;
      addFix('dispatchDate', '日期同步', `依標題將派單日從 "${old}" 修正為 "${report.dispatchDate}"`);
    }
  }

  // 3. 排序與名次連號校正
  const originalOrderStr = JSON.stringify(report.rankings.map(r => r.name));
  report.rankings.sort(compareRankingRows);
  const newOrderStr = JSON.stringify(report.rankings.map(r => r.name));

  let rankReordered = false;
  report.rankings.forEach((row, index) => {
    const expectedRank = index + 1;
    if (row.rank !== expectedRank) {
      row.rank = expectedRank;
      rankReordered = true;
    }
  });

  if (originalOrderStr !== newOrderStr) {
    addFix('rankings', '重新排序', '依「總業績 → 續單金額 → 追續成交 → 派單成交」權重邏輯重新排列名次');
  } else if (rankReordered) {
    addFix('rankings', '名次連號', '修正名次編號為 1 ~ N 連續整數');
  }

  // 4. 分組與人員清單校正
  const expectedGroups = buildExpectedGroups(report.rankings);
  let groupsModified = false;
  GROUP_KEYS.forEach(key => {
    if (JSON.stringify(report.groups[key]) !== JSON.stringify(expectedGroups[key])) {
      report.groups[key] = [...expectedGroups[key]];
      groupsModified = true;
    }
  });

  if (groupsModified) {
    addFix('groups', '分組同步', '依據最新排序結果，強制更新 A1/A2/B/C 人員名單');
  }

  // 5. 總盤數據配平
  if (report.audit.platforms.length > 0) {
    const aggregate = Object.fromEntries(AUDIT_METRICS.map(m => [m, 0]));
    report.audit.platforms.forEach(p => {
      AUDIT_METRICS.forEach(m => aggregate[m] += Number(p.metrics?.[m] || 0));
    });

    let boardModified = false;
    AUDIT_METRICS.forEach(m => {
      const aggVal = aggregate[m];
      if (Number(report.summaryBoard?.[m] || 0) !== aggVal) {
        report.summaryBoard[m] = aggVal;
        boardModified = true;
      }
    });

    // - [x] **Phase 5: 驗證與交付**
    // - [x] 使用故意毀損的資料進行測試
    // - [x] 確保 status 最終變為 PASS
    // - [x] 建立 Walkthrough 文件

    if (boardModified) {
      addFix('summaryBoard', '總盤配平', `整合總盤數據已依 ${report.audit.platforms.length} 平台加總值自動校正`);
    }
  }

  // 6. 建議名單同步
  let adviceFixedCount = 0;
  report.adviceList.forEach(item => {
    const rankRow = report.rankings.find(r => r.name === item.name);
    if (rankRow) {
      if (item.rank !== rankRow.rank || item.group !== rankRow.group) {
        item.rank = rankRow.rank;
        item.group = rankRow.group;
        adviceFixedCount++;
      }
    }
  });

  if (adviceFixedCount > 0) {
    addFix('adviceList', '建議同步', `已同步 ${adviceFixedCount} 位人員的名次與分級標籤`);
  }

  // 7. 移除已離職人員於正式名次中 (如果有)
  const excludedSet = new Set(report.audit.excludedEmployees.map(e => e.name));
  const beforeLen = report.rankings.length;
  report.rankings = report.rankings.filter(r => !excludedSet.has(r.name));
  if (report.rankings.length !== beforeLen) {
    addFix('rankings', '離職移除', `已從正式名次中移除 ${beforeLen - report.rankings.length} 名離職人員`);
    // 移除後需要再次校正名次編號
    report.rankings.forEach((r, i) => r.rank = i + 1);
  }

  // 8. 重建精簡版公告
  report.groupShortText = buildGroupShortText(report);
  addFix('groupShortText', '公告重建', '群組超精簡版已依修復後的數據重新生成');

  // 9. 最後確認：確保審計結果字串同步
  // 這會在路由層透過再次驗證來更新，但這裡先做初步同步
  if (fixes.length > 0) {
    console.log(`[SmartRepair] 已套用 ${fixes.length} 項修復`);
  }

  return { report, fixes };
}

module.exports = {
  repairReport
};
