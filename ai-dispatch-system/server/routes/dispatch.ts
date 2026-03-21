import { Router, Response } from 'express';
import crypto from 'crypto';
import { executeFullAudit, InputReportData, PlatformSummary } from '../services/auditService.js';
import { mergePlatformData, calculateDealRate } from '../services/mergeService.js';
import { rankMembers, groupMembers } from '../services/rankService.js';
import { generateAnnouncement } from '../services/announcementService.js';
import { saveSnapshot, getLatestSnapshot, getSnapshotByVersion, generateAutoVersion, SnapshotData } from '../services/dispatchSnapshotService.js';
import { getDb } from '../db/database.js';

const router = Router();

// SSE 連線池
let clients: Response[] = [];

/**
 * 通用：通知前端版本更新
 */
function notifyClients(version: string) {
  clients.forEach(c => {
    c.write(`data: ${JSON.stringify({ version })}\n\n`);
  });
}

/**
 * GET /api/v1/dispatch/stream
 * SSE (Server-Sent Events) 機制，用於推播最新版號
 */
router.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  // 立即發送當前最新版號
  const latest = getLatestSnapshot();
  if (latest) {
    res.write(`data: ${JSON.stringify({ version: latest.version })}\n\n`);
  }

  req.on('close', () => {
    clients = clients.filter(c => c !== res);
  });
});

/**
 * POST /api/v1/dispatch/rebuild
 * 匯入並重算
 */
router.post('/rebuild', (req, res) => {
  try {
    const input = req.body as InputReportData;

    if (!input || !input.reportDate) {
      return res.status(400).json({ success: false, message: '缺失必要欄位 (reportDate)' });
    }

    let platformsInput = input.platforms;

    // ── 貫穿優化：若無傳入 platforms，自動從 DB 撈取當日審計通過報表 ──
    if (!platformsInput || platformsInput.length === 0) {
      platformsInput = [];
      const db = getDb();
      const reports = db.prepare('SELECT id, platform_name FROM daily_reports WHERE report_date = ? AND audit_status = ?').all(input.reportDate, '審計通過');
      
      if (reports.length === 0) {
        return res.status(400).json({ success: false, message: `無法在系統中找到 [${input.reportDate}] 且審計通過的報表，請先確認報表已匯入。` });
      }

      for (const r of reports as any[]) {
         const total = db.prepare('SELECT * FROM daily_report_totals WHERE report_id = ?').get(r.id) as any;
         const members = db.prepare('SELECT * FROM daily_report_details WHERE report_id = ?').all(r.id) as any[];

         platformsInput.push({
             platformName: r.platform_name,
             summary: {
                 totalCalls: total.total_calls,
                 leadDeals: total.assigned_deals_count,
                 followDeals: total.followup_deals_count,
                 followAmount: total.followup_amount,
                 refundAmount: total.cancelled_return_amount,
                 totalRevenueNet: total.total_revenue_amount
             },
             members: members.map(m => ({
                 name: m.normalized_name, // 用校正後的名稱
                 totalCalls: m.total_calls,
                 leadDeals: m.assigned_deals_count,
                 followDeals: m.followup_deals_count,
                 followAmount: m.followup_amount,
                 refundAmount: m.cancelled_return_amount,
                 totalRevenueNet: m.total_revenue_amount,
                 isNew: m.identity_tag === '新人'
             }))
         });
      }

      // 覆寫回 input 供後續執行
      input.platforms = platformsInput;
    }

    // 1. 計算 Data Hash (MD5)
    const dataHash = crypto.createHash('md5').update(JSON.stringify(input)).digest('hex');

    // 2. 執行天地盤與邏輯盤審計
    const auditRes = executeFullAudit(input);

    let finalAuditRes = auditRes;
    let totalSummary: PlatformSummary = { totalCalls: 0, leadDeals: 0, followDeals: 0, followAmount: 0, refundAmount: 0, totalRevenueNet: 0 };
    let rankedList: any[] = [];
    let groups: any = { A1: [], A2: [], B: [], C: [] };
    let announcement = '';
    let dealRate = 0;

    if (auditRes.auditResult === 'PASS') {
      // 3. 資料整併
      const { mergedMembers, totalSummary: total } = mergePlatformData(input.platforms);
      totalSummary = total;

      // 4. 計算成交率
      dealRate = calculateDealRate(totalSummary);

      // 5. 累積盤驗算
      const accumAudit = executeFullAudit(input, totalSummary);
      finalAuditRes = accumAudit;

      if (accumAudit.auditResult === 'PASS') {
        // 6. 排序與分組
        rankedList = rankMembers(mergedMembers);
        groups = groupMembers(rankedList);

        // 7. 生成公告
        announcement = generateAnnouncement({
          reportDate: input.reportDate,
          auditResult: finalAuditRes,
          totalSummary,
          dealRate,
          rankingList: rankedList,
          dispatchGroups: groups
        });
      }
    }

    // 若最終審計失敗，生成失敗專屬公告 (僅顯示錯誤)
    if (finalAuditRes.auditResult === 'FAIL' && announcement === '') {
        announcement = generateAnnouncement({
          reportDate: input.reportDate,
          auditResult: finalAuditRes,
          totalSummary,
          dealRate: 0,
          rankingList: [],
          dispatchGroups: { A1: [], A2: [], B: [], C: [] }
        });
    }

    // 8. 產生自動版號 (例如 2026-03-18-001)
    const version = generateAutoVersion(input.reportDate);

    // 9. 封裝 Snapshot 存檔
    const snapshot: SnapshotData = {
      version,
      report_date: input.reportDate,
      data_hash: dataHash,
      audit_result: finalAuditRes.auditResult,
      audit_panels: finalAuditRes.auditPanels,
      total_summary: totalSummary,
      ranking_list: rankedList,
      dispatch_groups: groups,
      announcement
    };

    saveSnapshot(snapshot);

    // 10. 如果審計通過，觸發 SSE 通知前端更新
    if (finalAuditRes.auditResult === 'PASS') {
        notifyClients(version);
    }

    return res.json({
      success: true,
      message: finalAuditRes.auditResult === 'PASS' ? '重算定版成功，已通知前端' : '審計驗算失敗，已存入異常快照',
      version,
      dataHash,
      auditResult: finalAuditRes.auditResult,
      auditPanels: finalAuditRes.auditPanels,
      errors: finalAuditRes.errors,
      announcement
    });

  } catch (error: any) {
    return res.status(500).json({ success: false, message: '伺服器內部錯誤', error: error.message });
  }
});

/**
 * GET /api/v1/dispatch/latest
 * 取得最新完整結果包
 */
router.get('/latest', (_req, res) => {
  const latest = getLatestSnapshot();
  if (!latest) {
    return res.status(404).json({ success: false, message: '尚無任何派單計算快照' });
  }
  return res.json({
    success: true,
    version: latest.version,
    computedAt: latest.computed_at,
    dataHash: latest.data_hash,
    auditResult: latest.audit_result,
    auditPanels: latest.audit_panels,
    totalSummary: latest.total_summary,
    rankingList: latest.ranking_list,
    dispatchGroups: latest.dispatch_groups,
    announcement: latest.announcement
  });
});

/**
 * GET /api/v1/dispatch/version/:version
 * 取得指定版本之快照
 */
router.get('/version/:version', (req, res) => {
  const snapshot = getSnapshotByVersion(req.params.version);
  if (!snapshot) {
    return res.status(404).json({ success: false, message: `找不到版號為 ${req.params.version} 的快照` });
  }
  return res.json({
    success: true,
    version: snapshot.version,
    computedAt: snapshot.computed_at,
    dataHash: snapshot.data_hash,
    auditResult: snapshot.audit_result,
    auditPanels: snapshot.audit_panels,
    totalSummary: snapshot.total_summary,
    rankingList: snapshot.ranking_list,
    dispatchGroups: snapshot.dispatch_groups,
    announcement: snapshot.announcement
  });
});

export default router;
