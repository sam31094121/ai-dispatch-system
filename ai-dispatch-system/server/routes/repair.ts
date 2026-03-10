import { Router, Request, Response } from 'express';
import {
  執行後端系統自動維修,
  查詢維修紀錄,
  查詢最新維修,
  type 後端模組設定,
} from '../services/serverRepairEngine.js';

const 路由 = Router();

// ────────────────────────────────────────────────────
// POST /api/v1/repair/run — 傳入模組清單，執行自動維修
// ────────────────────────────────────────────────────
路由.post('/run', (請求: Request, 回應: Response) => {
  const 模組清單 = (請求.body?.模組清單 || []) as 後端模組設定[];

  if (!Array.isArray(模組清單) || 模組清單.length === 0) {
    return 回應.status(400).json({
      成功: false,
      訊息: '未提供後端模組清單',
      資料: null,
    });
  }

  try {
    const 維修結果 = 執行後端系統自動維修(模組清單);

    return 回應.json({
      成功: true,
      訊息: '後端自動維修完成',
      資料: 維修結果,
    });
  } catch (err: any) {
    return 回應.status(500).json({
      成功: false,
      訊息: err.message ?? '維修引擎發生未知錯誤',
      資料: null,
    });
  }
});

// ────────────────────────────────────────────────────
// GET /api/v1/repair/logs — 查詢歷史維修紀錄
// ────────────────────────────────────────────────────
路由.get('/logs', (_請求: Request, 回應: Response) => {
  try {
    const 紀錄 = 查詢維修紀錄(50);
    return 回應.json({
      成功: true,
      訊息: '查詢成功',
      資料: 紀錄,
    });
  } catch (err: any) {
    return 回應.status(500).json({
      成功: false,
      訊息: err.message ?? '查詢紀錄失敗',
      資料: null,
    });
  }
});

// ────────────────────────────────────────────────────
// GET /api/v1/repair/latest — 查詢最新維修結果
// ────────────────────────────────────────────────────
路由.get('/latest', (_請求: Request, 回應: Response) => {
  try {
    const 最新 = 查詢最新維修();
    return 回應.json({
      成功: true,
      訊息: 最新 ? '查到最新紀錄' : '尚無維修紀錄',
      資料: 最新,
    });
  } catch (err: any) {
    return 回應.status(500).json({
      成功: false,
      訊息: err.message ?? '查詢失敗',
      資料: null,
    });
  }
});

export default 路由;
