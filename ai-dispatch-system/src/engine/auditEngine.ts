// ==========================================
// LEVEL 3 嚴格審計引擎
// 永久指令：任一條 C1~C6 不通過 → STOP MODE
// ==========================================

// ─── 審計結果型別 ───
export type AuditVerdict = 'PASS' | 'FAIL';

export interface AuditIssue {
  code: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  label: string;
  platform: string;
  date: string;
  name: string;
  field: string;
  detail: string;        // 「所以：…」推論鏈
  fix: string;           // 需要補的內容
}

export interface AuditReport {
  verdict: AuditVerdict;
  issues: AuditIssue[];
  platformChecks: PlatformCheck[];
  timestamp: string;
}

export interface PlatformCheck {
  date: string;
  platform: string;
  reportedTotal: number;   // 報表宣稱的總業績
  sumIndividual: number;   // 個人加總
  diff: number;
  pass: boolean;
}

// ─── 單筆員工原始資料（含平台） ───
export interface RawRecord {
  date: string;
  platform: string;
  name: string;
  calls: number;           // 累積通數
  dispatchClose: number;   // 派單成交
  followupClose: number;   // 追續成交（追單）
  renewalAmount: number;   // 追續單金額（續單）
  revenue: number;         // 總業績
  isCumulative: boolean;   // 是否為累積型
}

export interface PlatformTotal {
  date: string;
  platform: string;
  totalCalls: number;
  totalRevenue: number;
}

// ─── 已知合法人名（鎖死） ───
const VALID_NAMES = [
  '馬秋香','王珍珠','王梅慧','湯玉琦','林沛昕','李玲玲',
  '高如郁','徐華妤','廖姿惠','林宜靜','鄭珮恩','陳玲華',
  '江麗勉','梁依萍','許淑英','董昭蘭','江沛林','林佩君',
  '高美雲','蘇淑玲','吳義豐',
];

// ─── 常見錯名對照 ───
const NAME_FIXES: Record<string, string> = {
  '徐葳好': '徐華妤',
  '徐華好': '徐華妤',
  '馬秋相': '馬秋香',
  '王真珠': '王珍珠',
};

// ─── 主審計函數 ───
export function runLevel3Audit(
  records: RawRecord[],
  platformTotals: PlatformTotal[],
  previousRecords?: RawRecord[],  // 前一天數據（C6 倒退檢查）
): AuditReport {
  const issues: AuditIssue[] = [];

  // ========== C5: 名字衝突 ==========
  const uniqueNames = new Set(records.map(r => r.name));
  for (const name of uniqueNames) {
    if (NAME_FIXES[name]) {
      issues.push({
        code: 'C5', label: '名字衝突',
        platform: '全平台', date: records[0]?.date ?? '', name,
        field: '姓名',
        detail: `所以：「${name}」不在合法名單中，應為「${NAME_FIXES[name]}」的錯字。`,
        fix: `請將「${name}」更正為「${NAME_FIXES[name]}」`,
      });
    } else if (!VALID_NAMES.includes(name)) {
      issues.push({
        code: 'C5', label: '名字衝突',
        platform: '全平台', date: records[0]?.date ?? '', name,
        field: '姓名',
        detail: `所以：「${name}」不在已知 21 人名單中，可能為錯字或新人。`,
        fix: `請確認「${name}」是否為正確姓名`,
      });
    }
  }

  // ========== C1: 天地盤（按日期+平台） ==========
  const platformChecks: PlatformCheck[] = [];
  for (const pt of platformTotals) {
    const matching = records.filter(r => r.date === pt.date && r.platform === pt.platform);
    const sumRev = matching.reduce((s, r) => s + r.revenue, 0);
    const diff = pt.totalRevenue - sumRev;
    const pass = diff === 0;
    platformChecks.push({
      date: pt.date, platform: pt.platform,
      reportedTotal: pt.totalRevenue, sumIndividual: sumRev,
      diff, pass,
    });
    if (!pass) {
      issues.push({
        code: 'C1', label: '天地盤不合',
        platform: pt.platform, date: pt.date, name: '全員',
        field: '總業績',
        detail: `所以：${pt.platform} ${pt.date} 報表總業績 ${pt.totalRevenue.toLocaleString()} ≠ 個人加總 ${sumRev.toLocaleString()}，差額 ${diff.toLocaleString()}。天地盤不合，數據不可信。`,
        fix: `請核對 ${pt.platform} ${pt.date} 每位員工的業績數字`,
      });
    }
  }

  // ========== C2: 有成交卻沒金額 ==========
  for (const r of records) {
    if (r.dispatchClose > 0 && r.revenue === 0) {
      issues.push({
        code: 'C2', label: '成交卻沒金額',
        platform: r.platform, date: r.date, name: r.name,
        field: '派單成交 vs 總業績',
        detail: `所以：${r.name} 在 ${r.platform} ${r.date} 派單成交=${r.dispatchClose}，但總業績=0。有成交怎麼會沒有金額？必定漏填或未入帳。`,
        fix: `請補上 ${r.name} 在 ${r.platform} ${r.date} 的總業績數字`,
      });
    }
  }

  // ========== C3: 有追單/續單卻沒金額 ==========
  for (const r of records) {
    if ((r.followupClose > 0 || r.renewalAmount > 0) && r.revenue === 0) {
      // 排除已被 C2 捕獲的
      if (r.dispatchClose > 0) continue;
      issues.push({
        code: 'C3', label: '追單/續單卻沒金額',
        platform: r.platform, date: r.date, name: r.name,
        field: '追續成交/續單金額 vs 總業績',
        detail: `所以：${r.name} 在 ${r.platform} ${r.date} 追續成交=${r.followupClose}、續單金額=${r.renewalAmount.toLocaleString()}，但總業績=0。有追/有續卻沒業績，需確認是退貨回沖還是漏填。`,
        fix: `請確認 ${r.name} 在 ${r.platform} ${r.date} 的業績是否正確為 0（若為退貨請註明）`,
      });
    }
  }

  // ========== C4: 位數不合理（基本檢查） ==========
  for (const r of records) {
    // 單筆業績超過 200 萬 → 可疑
    if (r.revenue > 2000000) {
      issues.push({
        code: 'C4', label: '位數不合理',
        platform: r.platform, date: r.date, name: r.name,
        field: '總業績',
        detail: `所以：${r.name} 在 ${r.platform} ${r.date} 總業績=${r.revenue.toLocaleString()}，超過 200 萬，疑似多打一個 0。`,
        fix: `請確認 ${r.name} 的業績 ${r.revenue.toLocaleString()} 是否正確`,
      });
    }
    // 續單金額大於總業績 → 可疑
    if (r.renewalAmount > r.revenue && r.revenue > 0) {
      issues.push({
        code: 'C4', label: '位數不合理',
        platform: r.platform, date: r.date, name: r.name,
        field: '續單 vs 總業績',
        detail: `所以：${r.name} 在 ${r.platform} ${r.date} 續單金額=${r.renewalAmount.toLocaleString()} > 總業績=${r.revenue.toLocaleString()}。續單不可能大於總業績。`,
        fix: `請核對 ${r.name} 的續單金額與總業績數字`,
      });
    }
  }

  // ========== C6: 累積型倒退檢查 ==========
  if (previousRecords && previousRecords.length > 0) {
    for (const curr of records.filter(r => r.isCumulative)) {
      const prev = previousRecords.find(
        p => p.name === curr.name && p.platform === curr.platform && p.isCumulative
      );
      if (!prev) continue;

      // 累積通數倒退
      if (curr.calls < prev.calls && prev.calls > 0) {
        issues.push({
          code: 'C6', label: '累積數字倒退',
          platform: curr.platform, date: curr.date, name: curr.name,
          field: '累積通數',
          detail: `所以：這是累積型數字，理論上只能增加不可能倒退；${curr.name} 累積通數從 ${prev.calls}（${prev.date}）跌到 ${curr.calls}（${curr.date}）→ 必定資料漏填/改口徑/退貨回沖未註明。`,
          fix: `請確認 ${curr.name} 在 ${curr.platform} ${curr.date} 累積通數是否正確`,
        });
      }

      // 累積業績倒退
      if (curr.revenue < prev.revenue && prev.revenue > 0) {
        issues.push({
          code: 'C6', label: '累積數字倒退',
          platform: curr.platform, date: curr.date, name: curr.name,
          field: '累積業績',
          detail: `所以：這是累積型數字，理論上只能增加不可能倒退；${curr.name} 業績從 ${prev.revenue.toLocaleString()}（${prev.date}）跌到 ${curr.revenue.toLocaleString()}（${curr.date}）→ 必定資料漏填/改口徑/退貨回沖未註明。`,
          fix: `請確認 ${curr.name} 在 ${curr.platform} ${curr.date} 業績是否正確`,
        });
      }

      // 累積值突然歸零
      if (curr.revenue === 0 && prev.revenue > 0) {
        issues.push({
          code: 'C6', label: '累積數字歸零',
          platform: curr.platform, date: curr.date, name: curr.name,
          field: '累積業績',
          detail: `所以：這是累積型數字，${curr.name} 業績從 ${prev.revenue.toLocaleString()}（${prev.date}）突然歸 0（${curr.date}），且未註明重置/換月/退貨調整。`,
          fix: `請確認 ${curr.name} 在 ${curr.platform} ${curr.date} 業績歸零的原因`,
        });
      }
    }
  }

  // ─── 最終判決 ───
  const verdict: AuditVerdict = issues.length === 0 ? 'PASS' : 'FAIL';

  return {
    verdict,
    issues,
    platformChecks,
    timestamp: new Date().toISOString(),
  };
}

// ─── 生成 STOP MODE 文字報告 ───
export function formatAuditReport(report: AuditReport): string {
  if (report.verdict === 'PASS') {
    return '【審計結論】= PASS\n天地盤差額=0，C1~C6 全部未觸發。資料可作為派單依據。';
  }

  const lines: string[] = [];
  lines.push('════════════════════════════');
  lines.push('【審計結論】= FAIL');
  lines.push('【🚨 STOP MODE：禁止派單 🚨】');
  lines.push('════════════════════════════');
  lines.push('');
  lines.push(`【觸發原因（共 ${report.issues.length} 筆）】`);

  // 按 code 分組
  const grouped = new Map<string, AuditIssue[]>();
  for (const issue of report.issues) {
    const arr = grouped.get(issue.code) || [];
    arr.push(issue);
    grouped.set(issue.code, arr);
  }

  for (const [code, issues] of grouped) {
    lines.push(`\n── ${code}: ${issues[0].label} ──`);
    for (const iss of issues) {
      lines.push(`• ${iss.platform}/${iss.date}/${iss.name}/${iss.field}`);
      lines.push(`  ${iss.detail}`);
      lines.push(`  → 【需要補：${iss.fix}】`);
    }
  }

  lines.push('');
  lines.push('════════════════════════════');
  lines.push('以上問題全部修正後，再次提交資料進行審計。');
  lines.push('在 STOP MODE 期間，禁止輸出名次/派單/推測。');

  return lines.join('\n');
}
