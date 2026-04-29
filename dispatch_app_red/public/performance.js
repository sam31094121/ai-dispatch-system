(function () {
  const fmt = new Intl.NumberFormat('zh-TW');
  const money = (value) => fmt.format(Number(value || 0));
  const percent = (value) => `${Math.round(Number(value || 0) * 100)}%`;

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function metricCard(label, value, tone = '') {
    return el('article', `perf-metric ${tone}`, `<span>${label}</span><strong>${value}</strong>`);
  }

  function renderSummary(data) {
    const grid = document.getElementById('performance-summary');
    if (!grid) return;
    grid.replaceChildren(
      metricCard('追續單成交', money(data.totals.renewalDeals)),
      metricCard('全部總業績', money(data.totals.totalRevenue), 'hot'),
      metricCard('追續單金額', money(data.totals.renewalRevenue)),
      metricCard('實收總金額', money(data.totals.cashRevenue), 'cash'),
      metricCard('追續單均價', money(data.totals.averageRenewal))
    );
  }

  function renderProductRows(data) {
    const grid = document.getElementById('performance-products');
    if (!grid) return;
    grid.replaceChildren(...data.products.map((item) => el('article', 'perf-product', `
      <div>
        <strong>${item.name}</strong>
        <span>成交 ${money(item.renewalDeals)} / 均價 ${money(item.averageRenewal)}</span>
      </div>
      <div>
        <b>${money(item.totalRevenue)}</b>
        <small>實收 ${money(item.cashRevenue)}</small>
      </div>
    `)));
  }

  function renderFocus(data) {
    const grid = document.getElementById('performance-focus');
    if (!grid) return;
    const groups = [
      ['主力派單', data.focusGroups.mainForce],
      ['公司產品', data.focusGroups.companyProduct],
      ['新人培養', data.focusGroups.cultivation]
    ];
    grid.replaceChildren(...groups.map(([title, rows]) => el('article', 'perf-focus-card', `
      <span>${title}</span>
      <strong>${rows.map((row) => row.name).join('、') || '-'}</strong>
    `)));
  }

  function renderOrder(data) {
    const list = document.getElementById('dispatch-order-list');
    if (!list) return;
    list.replaceChildren(...data.dispatchOrder.map((row) => el('article', 'dispatch-order-row', `
      <div class="dispatch-rank">#${row.rank}</div>
      <div class="dispatch-person">
        <strong>${row.name}</strong>
        <span>${row.tags.join(' / ')}</span>
      </div>
      <div class="dispatch-stats">
        <b>${money(row.totalRevenue)}</b>
        <span>成交 ${money(row.renewalDeals)} | 均價 ${money(row.averageRenewal)} | 實收率 ${percent(row.collectionRate)}</span>
      </div>
    `)));
  }

  async function loadPerformance() {
    const panel = document.getElementById('performance-panel');
    if (!panel) return;

    try {
      const response = await fetch('/api/performance/current');
      const payload = await response.json();
      const data = payload.data;
      if (!response.ok || !data) throw new Error(payload.message || 'load failed');

      document.getElementById('performance-date').textContent =
        `${data.displayDate} 業績 -> ${data.nextDispatchDisplayDate} 正式派單`;
      document.getElementById('performance-recommendation').textContent = data.recommendation;
      renderSummary(data);
      renderProductRows(data);
      renderFocus(data);
      renderOrder(data);
      panel.classList.remove('is-loading');
    } catch (error) {
      panel.classList.add('is-error');
      const recommendation = document.getElementById('performance-recommendation');
      if (recommendation) recommendation.textContent = '業績分析資料載入失敗，請重新整理或檢查後端服務。';
      console.error('[PerformanceAnalysis]', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPerformance);
  } else {
    loadPerformance();
  }
})();
