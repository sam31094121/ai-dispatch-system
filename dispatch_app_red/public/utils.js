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
            this.onUpdate?.(data);
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
      this.pollTimer = window.setInterval(() => this.onUpdate?.({ type: 'poll' }), this.pollInterval);
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

  window.normalizeReport = normalizeReport;
  window.RealtimeSyncEngine = RealtimeSyncEngine;
})();
