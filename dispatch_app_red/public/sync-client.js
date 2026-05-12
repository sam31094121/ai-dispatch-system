/**
 * Zhaogui AI Dispatch — 前端同步客戶端 (Sync Client)
 *
 * 【永久鎖死規則】
 * 1. 前端只讀後端正式結果，不得自行重算
 * 2. 定期向後端回報目前顯示版本號
 * 3. 收到 force_sync 事件時立即重新抓取
 * 4. 版本不一致時自動觸發重新載入
 * 5. 所有螢幕（桌機、手機、會議室）使用同一份客戶端邏輯
 *
 * 使用方式：
 *   const syncClient = new DispatchSyncClient({ type: 'mobile', onForceSync: () => loadData() });
 *   syncClient.start();
 */
(function () {
  'use strict';

  const HEARTBEAT_INTERVAL_MS = 5000;  // 每 5 秒向後端回報 (Professional 版提升同步率)
  const VERSION_CHECK_DELAY_MS = 3000; // 收到 force_sync 後等待 3 秒再驗證
  const MAX_CONSECUTIVE_MISMATCHES = 3; // 連續 N 次版本不一致則強制 reload

  /**
   * 生成唯一客戶端識別碼
   * 格式：{type}_{timestamp}_{random}
   */
  function generateClientKey(type) {
    const stored = sessionStorage.getItem('dispatch_sync_client_key');
    if (stored) return stored;

    const key = `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    try { sessionStorage.setItem('dispatch_sync_client_key', key); } catch { /* ignore */ }
    return key;
  }

  class DispatchSyncClient {
    /**
     * @param {object} options
     * @param {string} options.type - 'desktop' | 'mobile' | 'broadcast'
     * @param {function} options.onForceSync - 強制同步回呼（通常是重新 loadData）
     * @param {function} [options.onStatusChange] - 同步狀態變更回呼
     * @param {function} [options.onVersionUpdate] - 版本號更新回呼
     */
    constructor(options = {}) {
      this.type = options.type || 'desktop';
      this.onForceSync = options.onForceSync || (() => {});
      this.onStatusChange = options.onStatusChange || (() => {});
      this.onVersionUpdate = options.onVersionUpdate || (() => {});

      this.clientKey = generateClientKey(this.type);
      this.currentVersion = '';
      this.currentFingerprint = '';
      this.serverVersion = '';
      this.serverFingerprint = '';
      this.heartbeatTimer = null;
      this.consecutiveMismatches = 0;
      this.syncStatus = 'INIT';
      this.started = false;
    }

    /**
     * 更新前端目前顯示的版本與指紋（每次 render 後由應用程式呼叫）
     */
    setOfficialStatus(version, fingerprint) {
      this.currentVersion = version || '';
      this.currentFingerprint = fingerprint || '';
    }

    /**
     * 啟動同步客戶端
     */
    start() {
      if (this.started) return;
      this.started = true;
      this._hookSSE();
      this._startHeartbeat();
      console.log(`[SyncClient] 已啟動 (${this.type})`);
    }

    _hookSSE() {
      // 監聽全局 SSE 事件（由 RealtimeSyncEngine 廣播）
      window.addEventListener('message', (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'force_sync') {
            console.log('[SyncClient] 收到強制同步命令', data);
            this.onForceSync(data);
          }
        } catch(err) {}
      });
    }

    _startHeartbeat() {
      this._sendHeartbeat();
      this.heartbeatTimer = setInterval(() => this._sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
    }

    async _sendHeartbeat() {
      try {
        const response = await fetch('/api/sync/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            screenId: this.type,
            officialVersion: this.currentVersion,
            officialFingerprint: this.currentFingerprint,
            metadata: { userAgent: navigator.userAgent.slice(0, 50) }
          })
        });

        if (!response.ok) return;
        const result = await response.json();

        if (result.success) {
          this.serverVersion = result.serverVersion;
          this.serverFingerprint = result.serverFingerprint;
          this.syncStatus = result.syncStatus;

          // 自動補救：版本不一致且不是修復中時觸發同步
          if (this.currentVersion !== this.serverVersion && this.syncStatus !== 'REPAIRING') {
            this.consecutiveMismatches++;
            if (this.consecutiveMismatches >= MAX_CONSECUTIVE_MISMATCHES) {
              console.warn('[SyncClient] 版本不一致，觸發自動補救');
              this.onForceSync();
              this.consecutiveMismatches = 0;
            }
          } else {
            this.consecutiveMismatches = 0;
          }

          this.onStatusChange(this.syncStatus);
        }
      } catch (err) {
        console.warn('[SyncClient] 心跳失敗', err.message);
      }
    }

    /**
     * 取得同步狀態摘要
     */
    getStatus() {
      return {
        clientKey: this.clientKey,
        type: this.type,
        currentDataVersion: this.currentDataVersion,
        serverDataVersion: this.serverDataVersion,
        syncStatus: this.syncStatus,
        versionMatch: this.currentDataVersion === this.serverDataVersion,
        consecutiveMismatches: this.consecutiveMismatches
      };
    }
  }

  // 匯出到全域
  window.DispatchSyncClient = DispatchSyncClient;
})();
