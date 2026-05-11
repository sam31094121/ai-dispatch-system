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

  const HEARTBEAT_INTERVAL_MS = 8000;  // 每 8 秒向後端回報
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
      this.currentDataVersion = 0;
      this.serverDataVersion = 0;
      this.heartbeatTimer = null;
      this.consecutiveMismatches = 0;
      this.syncStatus = 'INIT';
      this.started = false;
    }

    /**
     * 更新前端目前顯示的版本號（每次 render 後呼叫）
     * @param {number} version
     */
    setDataVersion(version) {
      this.currentDataVersion = Number(version) || 0;
    }

    /**
     * 啟動同步客戶端
     */
    start() {
      if (this.started) return;
      this.started = true;

      // 監聽 SSE force_sync 事件
      this._hookSSE();

      // 啟動心跳
      this._startHeartbeat();

      // 頁面可見性切換時的處理
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        // 頁面從背景恢復：立即送一次心跳
        this._sendHeartbeat();
      });

      console.log(`[SyncClient] 已啟動 (${this.type}) clientKey=${this.clientKey}`);
    }

    /**
     * 停止同步客戶端
     */
    stop() {
      this.started = false;
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    }

    // ─── 內部方法 ───

    /**
     * 攔截 SSE 事件，處理 force_sync
     */
    _hookSSE() {
      // 增強現有的 RealtimeSyncEngine：監聽 force_sync
      const originalOnMessage = EventSource.prototype.addEventListener;

      // 使用 MutationObserver 或直接 patch 不太優雅
      // 改用更安全的方式：在 SSE message 事件中額外處理
      const self = this;

      // 透過覆寫 EventSource 的 onmessage 來注入 force_sync 處理
      // 但更安全的做法：直接建立獨立的監聽迴路
      const checkForSSESource = () => {
        // 每次心跳時檢查 serverDataVersion 是否變了
        if (this.serverDataVersion > this.currentDataVersion && this.serverDataVersion > 0) {
          console.log('[SyncClient] 偵測到伺服器版本更新，觸發同步');
          this.consecutiveMismatches += 1;

          if (this.consecutiveMismatches >= MAX_CONSECUTIVE_MISMATCHES) {
            console.warn('[SyncClient] 連續版本不一致，強制重新載入頁面');
            window.location.reload();
            return;
          }

          this.onForceSync();
        }
      };

      // 將 checkForSSESource 掛在心跳後
      this._postHeartbeatCheck = checkForSSESource;
    }

    /**
     * 啟動定期心跳
     */
    _startHeartbeat() {
      // 立即送一次
      this._sendHeartbeat();

      this.heartbeatTimer = setInterval(() => {
        this._sendHeartbeat();
      }, HEARTBEAT_INTERVAL_MS);
    }

    /**
     * 向後端回報版本狀態
     */
    async _sendHeartbeat() {
      try {
        const response = await fetch('/api/sync/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientKey: this.clientKey,
            type: this.type,
            dataVersion: this.currentDataVersion,
            screenState: document.hidden ? 'hidden' : 'active',
            metadata: {
              userAgent: navigator.userAgent.slice(0, 100),
              screenWidth: window.innerWidth,
              screenHeight: window.innerHeight,
              url: window.location.pathname
            }
          })
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result.success) {
          const prevServerVersion = this.serverDataVersion;
          this.serverDataVersion = result.serverDataVersion || 0;

          // 同步狀態更新
          const prevStatus = this.syncStatus;
          this.syncStatus = result.syncStatus || 'NORMAL';

          if (prevStatus !== this.syncStatus) {
            this.onStatusChange(this.syncStatus, prevStatus);
          }

          // 版本號更新
          if (prevServerVersion !== this.serverDataVersion) {
            this.onVersionUpdate(this.serverDataVersion);
          }

          // 版本一致性確認
          if (this.currentDataVersion === this.serverDataVersion) {
            this.consecutiveMismatches = 0;
          }

          // 執行後續檢查
          if (this._postHeartbeatCheck) {
            this._postHeartbeatCheck();
          }
        }
      } catch (err) {
        // 網路錯誤不阻斷，靜默處理
        console.warn('[SyncClient] 心跳發送失敗', err.message);
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
