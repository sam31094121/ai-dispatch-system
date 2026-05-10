(function () {
  const fmt = new Intl.NumberFormat('zh-TW');
  const money = (v) => fmt.format(Number(v || 0));
  const percent = (v) => `${Math.round(Number(v || 0) * 100)}%`;
  const esc = (v) => String(v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const TIERS = [
    { key: 'A1', label: 'A1｜高優先主力', color: '#9d1f1f' },
    { key: 'A2', label: 'A2｜次主力追進', color: '#c96a1b' },
    { key: 'B',  label: 'B 組｜一般量單', color: '#eab308' },
    { key: 'C',  label: 'C 組｜補位觀察', color: '#277a4a' }
  ];
  const TIER_COLOR = Object.fromEntries(TIERS.map((t) => [t.key, t.color]));

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function tierTag(tier) {
    const color = TIER_COLOR[tier] || '#888';
    return `<span class="dispatch-tier-tag" style="background:${color}">${esc(tier)}</span>`;
  }

  /* ── 整合總盤數字 ── */
  function renderSummary(data) {
    const grid = document.getElementById('performance-summary');
    if (!grid) return;
    const t = data.totals;
    const cashRate = t.totalRevenue > 0 ? Math.round(t.cashRevenue / t.totalRevenue * 100) : 0;
    const cards = [
      ['追續單成交', fmt.format(t.renewalDeals) + ' 單', ''],
      ['全部總業績', money(t.totalRevenue), 'hot'],
      ['追續單金額', money(t.renewalRevenue), ''],
      ['實收總金額', money(t.cashRevenue), 'cash'],
      ['追續均單價', money(t.averageRenewal), ''],
      ['實收率',     cashRate + '%', '']
    ];
    grid.replaceChildren(...cards.map(([label, value, tone]) =>
      el('article', `perf-metric ${tone}`, `<span>${label}</span><strong>${value}</strong>`)
    ));
  }

  /* ── 三平台產品 ── */
  function renderProductRows(data) {
    const grid = document.getElementById('performance-products');
    if (!grid) return;
    grid.replaceChildren(...data.products.map((item) => el('article', 'perf-product', `
      <div>
        <strong>${esc(item.name)}</strong>
        <span>成交 ${fmt.format(item.renewalDeals)} 單 ／ 均價 ${money(item.renewalRevenue && item.renewalDeals ? Math.round(item.renewalRevenue / item.renewalDeals) : 0)}</span>
      </div>
      <div>
        <b>${money(item.totalRevenue)}</b>
        <small>追續 ${money(item.renewalRevenue)}</small>
        <small>實收 ${money(item.cashRevenue)}</small>
      </div>
    `)));
  }

  /* ── 正式派單順位（完整 24 人）── */
  function renderOrder(data) {
    const list = document.getElementById('dispatch-order-list');
    if (!list) return;
    list.replaceChildren(...data.dispatchOrder.map((row) => el('article', 'dispatch-order-row', `
      <div class="dispatch-rank">#${row.rank}</div>
      <div class="dispatch-person">
        <strong>${esc(row.name)}</strong>
        <span>${tierTag(row.tier)} ${esc(row.tags.join(' / '))}</span>
      </div>
      <div class="dispatch-stats">
        <b>${money(row.totalRevenue)}</b>
        <span>
          AI <strong class="dispatch-score">${Number(row.weightedScore).toFixed(2)}</strong>
          ｜成交 ${row.renewalDeals} 單｜均價 ${money(row.averageRenewal)}｜實收率 ${percent(row.collectionRate)}
        </span>
      </div>
    `)));
  }

  /* ── A1 / A2 / B / C 分級卡 ── */
  function renderGroups(data) {
    const grid = document.getElementById('performance-groups');
    if (!grid) return;
    grid.replaceChildren(...TIERS.map(({ key, label, color }) => {
      const members = data.groups[key] || [];
      return el('article', 'perf-group-card', `
        <span class="perf-group-label" style="color:${color}">${esc(label)}</span>
        <div class="perf-group-names">
          ${members.map((p) => `
            <span class="perf-group-name">
              <span class="perf-group-rank">#${p.rank}</span>${esc(p.name)}
            </span>`).join('')}
        </div>
      `);
    }));
  }

  /* ── 每人一句建議 ── */
  function renderAdvice(data) {
    const list = document.getElementById('performance-advice');
    if (!list) return;
    list.replaceChildren(...data.dispatchOrder.map((row) => el('div', 'perf-advice-row', `
      <span class="perf-advice-rank">#${row.rank}</span>
      <span class="perf-advice-name">${tierTag(row.tier)}${esc(row.name)}</span>
      <span class="perf-advice-text">${esc(row.advice || '-')}</span>
    `)));
  }

  /* ── 審計列示（離職）── */
  function renderRetired(data) {
    const box = document.getElementById('performance-retired');
    if (!box) return;
    if (!data.retired || !data.retired.length) {
      box.innerHTML = '<span class="perf-retired-none">本輪無已離職人員列示</span>';
      return;
    }
    box.replaceChildren(...data.retired.map((name) =>
      el('span', 'perf-retired-tag', `${esc(name)}（已離職）只列審計，不入正式派單`)
    ));
  }

  /* ── 正式前五名（油畫主角席）── */
  function renderSpotlight(data) {
    const grid = document.getElementById('spotlight-grid');
    if (!grid) return;
    const top5 = data.dispatchOrder.slice(0, 5);
    
    grid.replaceChildren(...top5.map((row) => {
      const isTopTwo = row.rank <= 2;
      const rankClass = isTopTwo ? `hero-card-${row.rank}` : `spotlight-card rank-${row.rank}`;
      const vfxCanvas = isTopTwo ? `<div class="money-canvas-container"><canvas id="hero-${row.rank}-canvas"></canvas></div>` : '';
      const iconClass = row.rank === 2 ? 'gold-icon' : '';

      const card = el('article', `spotlight-item ${rankClass}`, `
        ${vfxCanvas}
        <div class="hero-content-wrap">
          <div class="spotlight-rank ${iconClass}">#${row.rank}</div>
          <div class="spotlight-name">${esc(row.name)}</div>
          <div class="spotlight-score">AI ${Number(row.weightedScore).toFixed(2)}</div>
          <div class="spotlight-metrics">
            <div><span>實收</span><strong>${money(row.actualRevenue)}</strong></div>
            <div><span>續單</span><strong>${money(row.renewalRevenue)}</strong></div>
          </div>
        </div>
      `);
      return card;
    }));

    // 啟動 3D 特效
    if (typeof window.initMoneyEffects === 'function') {
        setTimeout(window.initMoneyEffects, 100);
    }
  }

  /* ── 主載入 ── */
  async function loadPerformance() {
    const panel = document.getElementById('performance-panel');
    if (!panel) return;

    try {
      const response = await fetch('/api/performance/current');
      const payload = await response.json();
      const data = payload.data;
      if (!response.ok || !data) throw new Error(payload.message || 'load failed');

      const titleEl = document.getElementById('performance-title');
      if (titleEl) {
        titleEl.textContent = `${data.displayDate} 結算 → ${data.nextDispatchDisplayDate} 正式派單順序`;
      }

      const dateEl = document.getElementById('performance-date');
      if (dateEl) {
        dateEl.textContent = `${data.displayDate} 結算 → ${data.nextDispatchDisplayDate} 正式派單`;
        dateEl.className = 'badge badge-pass';
      }

      const orderTitleEl = document.getElementById('dispatch-order-title');
      if (orderTitleEl) {
        orderTitleEl.textContent = `今日（${data.nextDispatchDisplayDate}）正式派單順位 · 完整 ${data.dispatchOrder.length} 人`;
      }

      const recEl = document.getElementById('performance-recommendation');
      if (recEl) recEl.textContent = data.recommendation;

      renderSpotlight(data);
      renderSummary(data);
      renderProductRows(data);
      renderOrder(data);
      renderGroups(data);
      renderAdvice(data);
      renderRetired(data);

      panel.classList.remove('is-loading');
    } catch (error) {
      panel.classList.add('is-error');
      const recEl = document.getElementById('performance-recommendation');
      if (recEl) recEl.textContent = '業績分析資料載入失敗，請重新整理或檢查後端服務。';
      console.error('[PerformanceAnalysis]', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPerformance);
  } else {
    loadPerformance();
  }
})();
