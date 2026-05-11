/*
 * Shared browser utilities for the dispatch dashboards.
 * Keep this file syntax-safe: it is loaded by desktop, mobile, and broadcast views.
 */
(function () {
  function hasValue(value) {
    return value !== undefined && value !== null && value !== '';
  }

  function toNumber(value) {
    const parsed = Number(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function pick(source, keys, fallback = '') {
    for (const key of keys) {
      if (hasValue(source?.[key])) return source[key];
      if (hasValue(source?.metrics?.[key])) return source.metrics[key];
    }
    return fallback;
  }

  function normalizeRankingRow(row, index) {
    return {
      ...row,
      rank: toNumber(pick(row, ['rank', '名次', '排名'], index + 1)) || index + 1,
      prevRank: toNumber(pick(row, ['prevRank', '上期排名'], 0)),
      name: pick(row, ['name', '姓名'], '未知人員'),
      group: pick(row, ['group', '組別'], 'C'),
      score: toNumber(pick(row, ['score', 'weightedScore', 'totalScore', '正式權重分數', 'AI分'], 0)),
      advice: pick(row, ['advice', '建議'], ''),
      metrics: {
        actualRevenue: toNumber(pick(row, ['actualRevenue', '實收', '實收總金額'], 0)),
        renewalRevenue: toNumber(pick(row, ['renewalRevenue', '追續單總金額', '追續單金額', '續約業績'], 0)),
        totalRevenue: toNumber(pick(row, ['totalRevenue', '總業績', '本月業績', '全部總業績'], 0)),
        avgRenewal: toNumber(pick(row, ['avgRenewal', '平均續約', '追續平均單價'], 0)),
        renewalDeals: toNumber(pick(row, ['renewalDeals', '追續單成交', '累積追續總成交數'], 0))
      }
    };
  }

  function normalizeReport(payload) {
    const raw = payload?.data || payload || {};
    const standardData = raw.standardData || {};
    const rankingSource =
      raw.ranking ||
      raw.rankings ||
      standardData['正式名次'] ||
      raw.report?.rankings ||
      [];

    const rows = Array.isArray(rankingSource)
      ? rankingSource.map(normalizeRankingRow).sort((a, b) => a.rank - b.rank)
      : [];

    return {
      ...raw,
      rows,
      rankings: rows,
      groups: raw.groups || standardData['分級'] || raw.report?.groups || {},
      summary: raw.summary || standardData['整合總盤'] || raw.report?.summaryBoard || {},
      title: raw.title || standardData['公告標題'] || raw.report?.title || 'AI 派單戰情室'
    };
  }

  class RealtimeSyncEngine {
    constructor(url, onUpdate, options = {}) {
      this.url = url;
      this.onUpdate = onUpdate;
      this.source = null;
      this.reconnectTimer = null;
      this.pollTimer = null;
      this.retryCount = 0;
      this.maxDelay = options.maxDelay || 30000;
      this.pollInterval = options.pollInterval || 300000;
      this.lastVersion = 0;
      this.lastUpdateAt = 0;
      this.minUpdateGap = options.minUpdateGap || 500;
    }

    emitUpdate(data) {
      const version = Number(data?.version || 0);
      const now = Date.now();

      if (version && version <= this.lastVersion) return;
      if (!version && now - this.lastUpdateAt < this.minUpdateGap) return;

      if (version) this.lastVersion = version;
      this.lastUpdateAt = now;
      this.onUpdate?.(data);
    }

    connect() {
      if (!('EventSource' in window)) {
        this.startPolling();
        return;
      }

      this.stop();
      this.source = new EventSource(this.url);

      this.source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'data_updated') {
            this.retryCount = 0;
            this.emitUpdate(data);
            // 同步守衛：將後端 dataVersion 轉發給 sync-client
            if (data.dataVersion && window._dispatchSyncClient) {
              window._dispatchSyncClient.setDataVersion(data.dataVersion);
            }
          }
          // 同步守衛：處理 force_sync 強制同步事件
          if (data.type === 'force_sync') {
            this.emitUpdate(data);
            if (data.dataVersion && window._dispatchSyncClient) {
              window._dispatchSyncClient.setDataVersion(0); // 強制觸發重新抓取
            }
          }
        } catch (error) {
          console.error('[SSE] failed to parse update', error);
        }
      };

      this.source.onopen = () => {
        this.retryCount = 0;
      };

      this.source.onerror = () => {
        this.source?.close();
        this.source = null;
        const delay = Math.min(this.maxDelay, 1000 * Math.pow(2, this.retryCount));
        this.retryCount += 1;
        this.reconnectTimer = window.setTimeout(() => this.connect(), delay);
      };
    }

    startPolling() {
      this.stop();
      this.emitUpdate({ type: 'poll' });
      this.pollTimer = window.setInterval(() => this.emitUpdate({ type: 'poll' }), this.pollInterval);
    }

    stop() {
      this.source?.close();
      this.source = null;
      if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);
      if (this.pollTimer) window.clearInterval(this.pollTimer);
      this.reconnectTimer = null;
      this.pollTimer = null;
    }
  }

  const SCREEN_ALIASES = {
    '/mobile': 'mobile',
    '/m': 'mobile',
    '/broadcast': 'broadcast'
  };

  function detectScreenId() {
    const path = window.location.pathname.toLowerCase();
    const page = new URLSearchParams(window.location.search).get('page') || '';
    if (page.includes('mobile')) return 'mobile';
    if (page.includes('broadcast')) return 'broadcast';
    if (path.endsWith('/mobile.html') || SCREEN_ALIASES[path] === 'mobile') return 'mobile';
    if (path.endsWith('/broadcast.html') || SCREEN_ALIASES[path] === 'broadcast') return 'broadcast';
    return 'desktop';
  }

  const ReportOfficialSync = {
    screenId: detectScreenId(),

    stamp(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') return snapshot;
      return snapshot;
    },

    report(snapshot) {
      const officialVersion = snapshot?.officialVersion || snapshot?.backendMaster?.officialVersion || '';
      const officialFingerprint = snapshot?.officialFingerprint || snapshot?.backendMaster?.officialFingerprint || '';
      if (!officialVersion || !officialFingerprint) return;

      const body = JSON.stringify({
        screenId: this.screenId,
        officialVersion,
        officialFingerprint,
        displayedAt: new Date().toISOString(),
        userAgent: navigator.userAgent
      });

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/sync/report', new Blob([body], { type: 'application/json' }));
          return;
        }
      } catch (_) {
        // fall through to fetch
      }

      fetch('/api/sync/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        cache: 'no-store'
      }).catch(() => {});
    }
  };

  /**
   * 數位解碼動畫：將數字以跳動方式呈現，增加科技感。
   * @param {HTMLElement} el 目標元素
   * @param {number} targetValue 目標數值
   * @param {string} prefix 前綴 (如 $)
   * @param {number} duration 動畫時長 (ms)
   */
  function digitDecoder(el, targetValue, prefix = '', duration = 1000) {
    if (!el) return;
    const startValue = 0;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);
      const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuad);
      
      // 隨動數位噪點
      const noise = progress < 1 ? Math.floor(Math.random() * 99) : '';
      el.textContent = `${prefix}${new Intl.NumberFormat('zh-TW').format(currentValue)}${noise ? '.' + noise : ''}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = `${prefix}${new Intl.NumberFormat('zh-TW').format(targetValue)}`;
      }
    }
    requestAnimationFrame(update);
  }

  window.normalizeReport = normalizeReport;
  window.ReportOfficialSync = ReportOfficialSync;
  window.RealtimeSyncEngine = RealtimeSyncEngine;
  window.digitDecoder = digitDecoder;
})();
