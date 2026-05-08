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
          AI <strong class="dispatch-score">${Number(row.weightedScore || 0).toFixed(2)}</strong>
          ｜成交 ${row.renewalDeals} 單｜均價 ${money(row.averageRenewal)}｜實收率 ${percent(row.collectionRate)}
        </span>
      </div>
    `)));
  }

  function renderGroups(data) {
    const grid = document.getElementById('performance-groups');
    if (!grid) return;
    grid.replaceChildren(...TIERS.map(({ key, label, color }) => {
      const members = data.groups[key] || [];
      return el('article', 'perf-group-card', `
        <span class="perf-group-label" style="color:${color}">${esc(label)}</span>
        <div class="perf-group-names">
          ${members.map((name) => {
            const p = data.dispatchOrder.find(d => d.name === name) || { rank: '?' };
            return `<span class="perf-group-name"><span class="perf-group-rank">#${p.rank}</span>${esc(name)}</span>`;
          }).join('')}
        </div>
      `);
    }));
  }

  function renderAdvice(data) {
    const list = document.getElementById('performance-advice');
    if (!list) return;
    list.replaceChildren(...data.dispatchOrder.map((row) => el('div', 'perf-advice-row', `
      <span class="perf-advice-rank">#${row.rank}</span>
      <span class="perf-advice-name">${tierTag(row.tier)}${esc(row.name)}</span>
      <span class="perf-advice-text">${esc(row.advice || '-')}</span>
    `)));
  }

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

  async function loadPerformance() {
    const panel = document.getElementById('performance-panel');
    if (!panel) return;

    const tryFetch = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    };

    try {
      let data;
      try {
        const payload = await tryFetch('/api/performance/current');
        data = payload.data;
      } catch (apiErr) {
        console.warn('[Performance] API failed, using fallback:', apiErr);
        const latest = await tryFetch('/data/latest.json');
        const report = latest.report;
        data = {
          displayDate: report.settlementDate,
          nextDispatchDisplayDate: report.dispatchDate,
          recommendation: report.notes ? report.notes[0] : '數據已更新，請參考正式公告。',
          totals: {
            renewalDeals: report.summaryBoard.追續單成交,
            totalRevenue: report.summaryBoard.全部總業績,
            renewalRevenue: report.summaryBoard.追續單金額,
            cashRevenue: report.summaryBoard.實收總金額,
            averageRenewal: report.summaryBoard.追續單金額 / (report.summaryBoard.追續單成交 || 1)
          },
          products: report.audit.platforms.map(p => ({
            name: p.platformName,
            renewalDeals: p.metrics.追續單成交,
            totalRevenue: p.metrics.全部總業績,
            renewalRevenue: p.metrics.追續單金額,
            cashRevenue: p.metrics.實收總金額
          })),
          dispatchOrder: report.rankings.map(r => ({
            rank: r.rank,
            name: r.name,
            tier: r.group,
            tags: [r.group],
            weightedScore: r.metrics.正式權重分數,
            renewalDeals: r.metrics.追續單數,
            averageRenewal: r.metrics.追續客單價,
            totalRevenue: r.metrics.全部總業績,
            collectionRate: r.metrics.實收 / (r.metrics.全部總業績 || 1),
            advice: r.advice
          })),
          groups: report.groups,
          retired: report.audit.excludedEmployees || []
        };
      }

      if (!data) throw new Error('No data');

      const titleEl = document.getElementById('performance-title');
      if (titleEl) titleEl.textContent = `${data.displayDate} 結算 → ${data.nextDispatchDisplayDate} 正式派單順序`;

      const dateEl = document.getElementById('performance-date');
      if (dateEl) {
        dateEl.textContent = '數據已更新';
        dateEl.className = 'badge badge-pass';
      }

      const orderTitleEl = document.getElementById('dispatch-order-title');
      if (orderTitleEl) orderTitleEl.textContent = `今日（${data.nextDispatchDisplayDate}）正式派單順位`;

      const recEl = document.getElementById('performance-recommendation');
      if (recEl) {
        recEl.textContent = data.recommendation;
        recEl.hidden = false;
      }

      renderSummary(data);
      renderProductRows(data);
      renderOrder(data);
      renderGroups(data);
      renderAdvice(data);
      renderRetired(data);

      panel.classList.remove('is-loading');
    } catch (error) {
      panel.classList.remove('is-loading');
      panel.classList.add('is-error');
      console.error('[Performance]', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadPerformance);
  } else {
    loadPerformance();
  }
})();
