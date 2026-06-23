/* ==========================================================
   admin-reports.js - 推薦案件報表
     功能：年/月/方案 篩選 → KPI、月度趨勢、金額趨勢、漏斗、
       Top 推薦人、月份明細表；可匯出資料 / 列印
   ========================================================== */

(function () {
  'use strict';

  // ============ Demo 資料：每月聚合，依方案 / 產品拆分 ============
  // 真實情境應由後端聚合 API 提供；此處以靜態 demo 模擬 12 個月資料
  // 結構：MONTHLY[year][month][plan][product] = { newCases, deal, fail, payout, withdrawn }
  const PRODUCTS = ['房屋貸款', '汽車貸款', '信用貸款'];
  const PLANS = ['customer', 'employee'];

  // 內建一個合理的 demo 資料：2025、2026 各 12 個月
  function genDemo() {
    const data = {};
    const seed = (y, m, p, prod) => {
      // 簡單 hash 讓資料看似真實但可重現
      let h = (y * 131 + m * 17 + p.length * 7 + prod.charCodeAt(0)) >>> 0;
      const rand = (max) => { h = (h * 1103515245 + 12345) & 0x7fffffff; return h % max; };
      const base = {
        '房屋貸款': { n: 6, d: 0.45, pay: 6000 },
        '汽車貸款': { n: 10, d: 0.55, pay: 2200 },
        '信用貸款': { n: 14, d: 0.60, pay: 500 },
      }[prod];
      const planFactor = p === 'employee' ? 0.45 : 1;
      const seasonal = 1 + Math.sin((m - 1) / 12 * Math.PI * 2) * 0.25;
      const newCases = Math.max(0, Math.round(base.n * planFactor * seasonal) + rand(4) - 2);
      const deal = Math.min(newCases, Math.round(newCases * (base.d + (rand(20) - 10) / 100)));
      const fail = Math.min(newCases - deal, rand(3));
      const payout = deal * (base.pay + rand(800) - 400);
      const withdrawn = Math.round(payout * (0.55 + rand(35) / 100));
      return { newCases, deal, fail, payout: Math.max(0, payout), withdrawn };
    };
    [2025, 2026].forEach((y) => {
      data[y] = {};
      for (let m = 1; m <= 12; m++) {
        data[y][m] = {};
        PLANS.forEach((p) => {
          data[y][m][p] = {};
          PRODUCTS.forEach((prod) => {
            data[y][m][p][prod] = seed(y, m, p, prod);
          });
        });
      }
    });
    return data;
  }
  const MONTHLY = genDemo();

  // 「目前」：以實際系統時間為準
  const _now = new Date();
  const TODAY = { year: _now.getFullYear(), month: _now.getMonth() + 1 };

  function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function fmtDateInput(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function fmtDateYmd(d) {
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }
  function parseDateInput(v) {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  function daysInclusive(from, to) {
    return Math.floor((toDateOnly(to) - toDateOnly(from)) / 86400000) + 1;
  }
  function monthDays(year, month) {
    return new Date(year, month, 0).getDate();
  }
  function getMonthOverlapRatio(year, month, from, to) {
    const mFrom = new Date(year, month - 1, 1);
    const mTo = new Date(year, month - 1, monthDays(year, month));
    const start = toDateOnly(from) > mFrom ? toDateOnly(from) : mFrom;
    const end = toDateOnly(to) < mTo ? toDateOnly(to) : mTo;
    if (end < start) return 0;
    return daysInclusive(start, end) / monthDays(year, month);
  }
  function getDefaultChartRange() {
    const to = toDateOnly(new Date());
    const from = new Date(to);
    from.setDate(from.getDate() - 29);
    return { from, to };
  }

  // ============ 篩選狀態 ============
  const state = {
    year: TODAY.year,
    month: 'all',     // 'all' or 1..12
    plan: 'all',      // 'all' | 'customer' | 'employee'
  };

  const chartState = getDefaultChartRange();

  // ============ 聚合工具 ============
  function aggregate(year, month, plan) {
    let n = 0, d = 0, f = 0, pay = 0, wd = 0;
    const monthlyOf = MONTHLY[year];
    if (!monthlyOf) return { n, d, f, pay, wd };
    const months = month === 'all' ? [...Array(12).keys()].map((i) => i + 1) : [month];
    months.forEach((m) => {
      const planMap = monthlyOf[m] || {};
      const plans = plan === 'all' ? PLANS : [plan];
      plans.forEach((p) => {
        const prodMap = planMap[p] || {};
        PRODUCTS.forEach((prod) => {
          const cell = prodMap[prod];
          if (!cell) return;
          n += cell.newCases;
          d += cell.deal;
          f += cell.fail;
          pay += cell.payout;
          wd += cell.withdrawn;
        });
      });
    });
    return { n, d, f, pay, wd };
  }

  function aggMonth(year, month) {
    return aggregate(year, month, state.plan);
  }

  function aggCumThrough(year, endMonth) {
    // 從本年 1 月累計到 endMonth
    let total = 0;
    for (let m = 1; m <= endMonth; m++) {
      total += aggMonth(year, m).pay;
    }
    return total;
  }

  function getChartMonthRows() {
    const from = toDateOnly(chartState.from);
    const to = toDateOnly(chartState.to);
    if (from > to) return [];

    const rows = [];
    for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
      for (let m = 1; m <= 12; m++) {
        if (!MONTHLY[y]?.[m]) continue;
        const ratio = getMonthOverlapRatio(y, m, from, to);
        if (ratio <= 0) continue;
        const base = aggregate(y, m, 'all');
        rows.push({
          year: y,
          month: m,
          ratio,
          n: Math.round(base.n * ratio),
          d: Math.round(base.d * ratio),
          f: Math.round(base.f * ratio),
          pay: Math.round(base.pay * ratio),
          wd: Math.round(base.wd * ratio),
        });
      }
    }
    return rows;
  }

  function getChartDayRows() {
    const from = toDateOnly(chartState.from);
    const to = toDateOnly(chartState.to);
    if (from > to) return [];

    const totalDays = Math.max(1, daysInclusive(from, to));
    const noiseByDate = (d) => {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const day = d.getDate();
      // deterministic pseudo-random in [0, 1)
      let h = (y * 10000 + m * 100 + day) >>> 0;
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };

    const rows = [];
    let idx = 0;
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1), idx++) {
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const base = MONTHLY[y]?.[m] ? aggregate(y, m, 'all') : null;
      const basePerDay = base ? (base.pay / monthDays(y, m)) : 0;

      const position = totalDays <= 1 ? 0 : idx / (totalDays - 1);
      const trendFactor = 0.78 + position * 0.44;

      const dow = d.getDay();
      const weekdayFactor = dow === 0 || dow === 6 ? 0.74 : (dow === 1 ? 1.08 : 1.0);

      const noise = 0.82 + noiseByDate(d) * 0.42;
      const pulse = 1 + Math.sin(idx / 3.2) * 0.08;

      const perDay = Math.max(0, Math.round(basePerDay * trendFactor * weekdayFactor * noise * pulse));
      rows.push({
        date: new Date(d),
        pay: perDay,
      });
    }
    return rows;
  }

  function fmt(n) { return Number(n).toLocaleString(); }
  function pct(num, denom) {
    if (!denom) return 0;
    return Math.round((num / denom) * 100);
  }
  function fmtDelta(cur, prev, isMoney) {
    const diff = cur - prev;
    if (diff === 0) return `<span class="delta-flat">持平 vs 上月</span>`;
    const up = diff > 0;
    const arrow = up ? '▲' : '▼';
    const cls = up ? 'delta-up' : 'delta-down';
    const v = isMoney ? `NT$ ${fmt(Math.abs(diff))}` : `${Math.abs(diff)} 筆`;
    return `<span class="${cls}">${arrow} ${v} vs 上月</span>`;
  }

  // ============ KPI ============
  function renderKpi() {
    // 「當月」依篩選結果：
    //   若 month=all → 取最近一個有資料的月份（取年底或 TODAY.month）
    //   否則為指定月份
    const refMonth = state.month === 'all'
      ? (state.year === TODAY.year ? TODAY.month : 12)
      : state.month;
    const cur = aggMonth(state.year, refMonth);
    const prevMonth = refMonth === 1 ? null : aggMonth(state.year, refMonth - 1);

    document.getElementById('kpi-new').textContent = `${cur.n} 筆`;
    document.getElementById('kpi-new-delta').innerHTML = prevMonth ? fmtDelta(cur.n, prevMonth.n, false) : '<span class="delta-flat">本年首月</span>';

    document.getElementById('kpi-deal').textContent = `${cur.d} 筆`;
    document.getElementById('kpi-deal-delta').innerHTML = prevMonth ? fmtDelta(cur.d, prevMonth.d, false) : '';
    document.getElementById('kpi-deal-rate').textContent = `成交率 ${pct(cur.d, cur.n)}%`;

    document.getElementById('kpi-payout').textContent = `NT$ ${fmt(cur.pay)}`;
    document.getElementById('kpi-payout-delta').innerHTML = prevMonth ? fmtDelta(cur.pay, prevMonth.pay, true) : '';

    const cum = aggCumThrough(state.year, refMonth);
    document.getElementById('kpi-total').textContent = `NT$ ${fmt(cum)}`;
    document.getElementById('kpi-total-thru').textContent = `截至 ${state.year}/${String(refMonth).padStart(2, '0')}`;


  }

  // 「近 6 個月案件趨勢」面板已移除

  // ============ 獎金發放金額趨勢（柱+折線：累計） ============
  function yAxisTicks(maxVal) {
    if (maxVal <= 0) return { ticks: [0], niceMax: 1 };
    const steps = [200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const step = steps.find((s) => maxVal / s <= 4) || 100000;
    const niceMax = Math.ceil(maxVal / step) * step;
    const ticks = [];
    for (let v = 0; v <= niceMax; v += step) ticks.push(v);
    return { ticks, niceMax };
  }

  function fmtYTick(v) {
    if (v === 0) return '0';
    if (v >= 1000) return `${v / 1000}K`;
    return String(v);
  }

  function renderPayout() {
    const wrap = document.getElementById('payout-chart');
    const payoutHint = document.getElementById('payout-period-hint');
    if (payoutHint) {
      payoutHint.textContent = `計算區間：${fmtDateYmd(chartState.from)} 00:00 ~ ${fmtDateYmd(chartState.to)} 23:59`;
    }
    const rows = getChartDayRows();
    if (!rows.length || rows.every((r) => r.pay === 0)) {
      wrap.innerHTML = '<div class="top-empty">所選日期區間無資料</div>';
      return;
    }

    let cum = 0;
    const lineRows = rows.map((r) => {
      cum += r.pay;
      return { ...r, cum };
    });
    const maxPay = Math.max(1, ...lineRows.map((r) => r.pay));
    const maxCum = Math.max(1, ...lineRows.map((r) => r.cum));
    const { ticks, niceMax } = yAxisTicks(maxPay);
    const colCount = lineRows.length;
    const chartWidth = Math.max(320, colCount * 42);

    const bars = lineRows.map((r, i) => {
      const day = r.date;
      const isFuture = toDateOnly(day) > toDateOnly(new Date());
      const label = `${String(day.getMonth() + 1).padStart(2, '0')}/${String(day.getDate()).padStart(2, '0')}`;
      const barH = (r.pay / niceMax * 100).toFixed(1);
      const valLabel = r.pay > 0 ? fmt(r.pay) : '';
      return `
        <div class="bcs-col ${isFuture ? 'col-future' : ''}">
          <div class="bcs-bar-area">
            ${valLabel ? `<span class="bcs-val">${valLabel}</span>` : ''}
            <div class="bcs-bar" style="height:${barH}%;" title="${fmtDateYmd(day)} 單日發放 NT$ ${fmt(r.pay)}"></div>
          </div>
          <div class="bcs-label">${label}</div>
        </div>`;
    }).join('');

    const pts = lineRows.map((r, i) => {
      const x = (i + 0.5) / colCount * 100;
      const y = 100 - (r.cum / maxCum * 100);
      return `${x},${y}`;
    }).join(' ');

    const gridLines = ticks.map((v) => {
      const top = ((niceMax - v) / niceMax * 100).toFixed(1);
      return `<div class="bcs-grid-line" style="top:${top}%;"></div>`;
    }).join('');

    const yaxisHtml = [...ticks].reverse().map((v) =>
      `<div class="bcs-ytick">${fmtYTick(v)}</div>`
    ).join('');

    wrap.innerHTML = `
      <div class="bcs-with-axis">
        <div class="bcs-yaxis">${yaxisHtml}</div>
        <div class="bcs-scroll-area">
          <div class="bcs-scroll-inner" style="width:${chartWidth}px;">
            <div class="bcs-grid">${gridLines}</div>
            <div class="bcs-bars">${bars}</div>
            <svg class="bcs-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points="${pts}" fill="none" stroke="#7C3AED" stroke-width="0.8" />
              ${lineRows.map((r, i) => {
                const x = (i + 0.5) / colCount * 100;
                const y = 100 - (r.cum / maxCum * 100);
                return `<circle cx="${x}" cy="${y}" r="0.9" fill="#7C3AED" />`;
              }).join('')}
            </svg>
          </div>
        </div>
      </div>`;
  }

  // ============ 案件結果分布：符合 / 不符合 ============
  // 不符合原因分布占比（demo 模擬規則，加總 = 1）
  const INVALID_REASON_WEIGHTS = [
    { key: 'E-OLD', label: '員工／離職員工推薦舊客戶',  weight: 0.28, color: '#252629' },
    { key: 'E-PAY', label: '未達成基本繳款條件',         weight: 0.24, color: '#A78BFA' },
    { key: 'E-120', label: '超過 150 天紅利效期',        weight: 0.18, color: '#F59E0B' },
    { key: 'E-180', label: '超過 180 天未提領',          weight: 0.14, color: '#EF4444' },
    { key: 'E-BLK', label: '帳號被列為黑名單',           weight: 0.08, color: '#252629' },
    { key: 'OTHER', label: '其他',                        weight: 0.08, color: '#CBD5E1' },
  ];

  function renderFunnel() {
    const totals = getChartMonthRows().reduce((acc, r) => {
      acc.n += r.n;
      acc.d += r.d;
      acc.f += r.f;
      acc.pay += r.pay;
      acc.wd += r.wd;
      return acc;
    }, { n: 0, d: 0, f: 0, pay: 0, wd: 0 });

    // 符合 = 成交筆數；不符合 = 中止筆數
    const eligible = totals.d;
    const invalid  = totals.f;

    // 符合內部拆分：已撥款（依 withdrawn/payout 比例）與 待撥款
    const paidCount = totals.pay > 0
      ? Math.min(eligible, Math.round(eligible * (totals.wd / totals.pay)))
      : Math.round(eligible * 0.6);
    const pendingCount = Math.max(0, eligible - paidCount);

    // 不符合內部拆分：依固定權重，最後一項補齊差額避免四捨五入誤差
    const reasons = INVALID_REASON_WEIGHTS.map((r) => ({ ...r, count: Math.round(invalid * r.weight) }));
    const reasonSum = reasons.reduce((s, r) => s + r.count, 0);
    if (reasons.length > 0) reasons[reasons.length - 1].count += (invalid - reasonSum);

    const total = eligible + invalid;

    const wrap = document.getElementById('case-breakdown');
    wrap.innerHTML = `
      <!-- 符合 -->
      <div class="cb-bucket cb-bucket-eligible">
        <div class="cb-bucket-head">
          <span class="cb-bucket-icon"><i class="fa-solid fa-circle-check"></i></span>
          <div class="cb-bucket-title">符合</div>
          <div class="cb-bucket-count">${eligible} <small>筆</small></div>
          <div class="cb-bucket-pct">${pct(eligible, total)}%</div>
        </div>
        <div class="cb-sub-list">
          ${renderSubRow('已撥款', paidCount, eligible, '#059669')}
          ${renderSubRow('待撥款', pendingCount, eligible, '#10B981')}
        </div>
      </div>

      <!-- 不符合 -->
      <div class="cb-bucket cb-bucket-invalid">
        <div class="cb-bucket-head">
          <span class="cb-bucket-icon invalid"><i class="fa-solid fa-circle-xmark"></i></span>
          <div class="cb-bucket-title">不符合</div>
          <div class="cb-bucket-count">${invalid} <small>筆</small></div>
          <div class="cb-bucket-pct">${pct(invalid, total)}%</div>
        </div>
        <div class="cb-sub-list">
          ${reasons.map((r) => renderSubRow(r.label, r.count, invalid, r.color, r.key)).join('')}
        </div>
      </div>

      <div class="cb-foot">
        合計案件 <strong>${total}</strong> 筆（不含新增送單未結案部分）
      </div>
    `;
  }

  function renderSubRow(label, count, denom, color, code) {
    const w = denom > 0 ? (count / denom * 100).toFixed(1) : 0;
    if (code) {
      return `
        <div class="cb-sub-row cb-sub-row--invalid">
          <div class="cb-sub-label cb-sub-label--invalid">
            <span class="warn-chip">${code}</span>${label}
          </div>
          <div class="cb-sub-track">
            <div class="cb-sub-fill" style="width:${w}%;background:${color};"></div>
          </div>
          <div class="cb-sub-count">${count} 筆</div>
        </div>`;
    }
    return `
      <div class="cb-sub-row">
        <div class="cb-sub-label">${label}</div>
        <div class="cb-sub-track">
          <div class="cb-sub-fill" style="width:${w}%;background:${color};"></div>
        </div>
        <div class="cb-sub-count">${count} 筆</div>
      </div>`;
  }

  // ============ Top 推薦人（依身份分組之 demo 排行） ============
  // 每個身份各 5 名，提供獨立排名
  const TOP_REFERRERS_DEMO = {
    '會員': [
      { name: '王小毅', cases: 15, payout: 36000 },
      { name: '何Ｏ蓁', cases: 9,  payout: 22000 },
      { name: '黃Ｏ偉', cases: 7,  payout: 17500 },
      { name: '張Ｏ豪', cases: 6,  payout: 14200 },
      { name: '林Ｏ妤', cases: 5,  payout:  9800 },
    ],
    '員工': [
      { name: '李大華', cases: 18, payout: 42500 },
      { name: '張主任', cases: 14, payout: 33000 },
      { name: '蔡專員', cases: 11, payout: 25500 },
      { name: '周經理', cases: 8,  payout: 19000 },
      { name: '吳助理', cases: 5,  payout: 11500 },
    ],
    '離職員工': [
      { name: '陳前輩', cases: 12, payout: 28500 },
      { name: '林前輩', cases: 8,  payout: 18000 },
      { name: '黃前輩', cases: 6,  payout: 13500 },
      { name: '高前輩', cases: 4,  payout:  9000 },
      { name: '葉前輩', cases: 2,  payout:  4500 },
    ],
  };

  // 目前選中的身份頁籤
  let topTag = '會員';

  function renderTopReferrers() {
    syncTopTabsActive();

    const raw = scaleTopRowsByChartRange(TOP_REFERRERS_DEMO[topTag] || []);
    renderTopRankList('top-referrers-payout', raw, 'payout');
    renderTopRankList('top-referrers-cases', raw, 'cases');
  }

  function scaleTopRowsByChartRange(rows) {
    const spanDays = Math.max(1, daysInclusive(chartState.from, chartState.to));
    const factor = Math.max(0.1, Math.min(1.2, spanDays / 30));
    return rows.map((r) => ({
      name: r.name,
      cases: Math.max(1, Math.round(r.cases * factor)),
      payout: Math.max(500, Math.round(r.payout * factor)),
    }));
  }

  function renderTopRankList(wrapId, rows, sortKey) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const list = rows.slice().sort((a, b) => b[sortKey] - a[sortKey]);
    if (list.length === 0) {
      wrap.innerHTML = '<div class="top-empty">本期此身份尚無推薦人資料</div>';
      return;
    }

    const max = Math.max(1, ...list.map((r) => r[sortKey]));
    wrap.innerHTML = list.map((r, i) => {
      const isPayout = sortKey === 'payout';
      const primary = isPayout ? `NT$ ${fmt(r.payout)}` : `${r.cases} 件`;
      const secondary = isPayout ? `${r.cases} 件` : `NT$ ${fmt(r.payout)}`;
      return `
        <div class="top-row">
          <div class="top-rank rank-${i + 1}">${i + 1}</div>
          <div class="top-info">
            <div class="top-name">${r.name} <span class="top-tag tag-${tagCls(topTag)}">${topTag}</span></div>
          </div>
          <div class="top-stat">
            <div class="top-stat-amt">${primary}</div>
            <div class="top-stat-cases">${secondary}</div>
          </div>
        </div>`;
    }).join('');
  }

  function tagCls(tag) {
    if (tag === '員工') return 'employee';
    if (tag === '離職員工') return 'ex-employee';
    return 'customer';
  }

  function syncTopTabsActive() {
    const tabs = document.querySelectorAll('.top-tab');
    let firstTag = null;
    tabs.forEach((tab) => {
      if (!firstTag) firstTag = tab.dataset.tag;
    });
    if (![...tabs].some((tab) => tab.dataset.tag === topTag) && firstTag) {
      topTag = firstTag;
    }
    tabs.forEach((tab) => {
      const active = tab.dataset.tag === topTag;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function bindTopTabs() {
    document.querySelectorAll('.top-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        topTag = tab.dataset.tag;
        renderTopReferrers();
      });
    });
  }

  // ============ 月份明細表 ============
  function renderDetail() {
    const tbody = document.getElementById('detail-tbody');
    const tfoot = document.getElementById('detail-tfoot');
    const hint = document.getElementById('detail-period-hint');

    const rows = getChartMonthRows();
    hint.textContent = `計算區間：${fmtDateYmd(chartState.from)} 00:00 ~ ${fmtDateYmd(chartState.to)} 23:59`;

    if (rows.length === 0 || rows.every((r) => r.n === 0)) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--color-text-muted);">本期間無資料</td></tr>`;
      tfoot.innerHTML = '';
      return;
    }

    tbody.innerHTML = rows
      // 由新到舊
      .slice().sort((a, b) => (b.year - a.year) || (b.month - a.month))
      .map((r) => {
        const pending = Math.max(0, r.pay - r.wd);
        const monthCell = `<div class="cell-month">${r.year} 年 ${r.month} 月</div>`;
        return `
          <tr>
            <td>${monthCell}</td>
            <td class="num">${r.n}</td>
            <td class="num"><strong>${r.d}</strong></td>
            <td class="num">${r.f}</td>
            <td class="num">NT$ ${fmt(r.pay)}</td>
            <td class="num">NT$ ${fmt(r.wd)}</td>
            <td class="num pending">NT$ ${fmt(pending)}</td>
          </tr>`;
      })
      .join('');

    const tot = rows.reduce((a, r) => {
      a.n += r.n; a.d += r.d; a.f += r.f; a.pay += r.pay; a.wd += r.wd;
      return a;
    }, { n: 0, d: 0, f: 0, pay: 0, wd: 0 });
    tfoot.innerHTML = `
      <tr class="row-total">
        <td>合計</td>
        <td class="num">${tot.n}</td>
        <td class="num"><strong>${tot.d}</strong></td>
        <td class="num">${tot.f}</td>
        <td class="num">NT$ ${fmt(tot.pay)}</td>
        <td class="num">NT$ ${fmt(tot.wd)}</td>
        <td class="num pending">NT$ ${fmt(Math.max(0, tot.pay - tot.wd))}</td>
      </tr>`;
  }

  function renderKpiBoard() {
    renderKpi();
  }

  function renderChartBoard() {
    renderPayout();
    renderFunnel();
    renderTopReferrers();
    renderDetail();
  }

  // ============ 篩選綁定 ============
  function bindFilters() {
    const yearSel = document.getElementById('rpt-year');
    Object.keys(MONTHLY).map(Number).sort((a, b) => b - a).forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === state.year) opt.selected = true;
      yearSel.appendChild(opt);
    });

    document.getElementById('btn-rpt-query').addEventListener('click', () => {
      state.year = parseInt(yearSel.value, 10);
      state.month = document.getElementById('rpt-month').value === 'all' ? 'all' : parseInt(document.getElementById('rpt-month').value, 10);
      state.plan = document.getElementById('rpt-plan').value;
      renderKpiBoard();
    });

    document.getElementById('btn-rpt-reset').addEventListener('click', () => {
      yearSel.value = TODAY.year;
      document.getElementById('rpt-month').value = 'all';
      document.getElementById('rpt-plan').value = 'all';
      state.year = TODAY.year; state.month = 'all'; state.plan = 'all';
      renderKpiBoard();
    });
  }

  function bindChartFilters() {
    const fromInput = document.getElementById('rpt-chart-from');
    const toInput = document.getElementById('rpt-chart-to');

    const syncInputFromState = () => {
      fromInput.value = fmtDateInput(chartState.from);
      toInput.value = fmtDateInput(chartState.to);
    };

    const applyRangeFromInput = () => {
      const from = parseDateInput(fromInput.value);
      const to = parseDateInput(toInput.value);
      if (!from || !to) {
        alert('請輸入完整的起訖日期');
        return false;
      }
      if (from > to) {
        alert('起日不可晚於迄日');
        return false;
      }
      const todayDate = toDateOnly(new Date());
      chartState.from = from > todayDate ? todayDate : from;
      chartState.to = to > todayDate ? todayDate : to;
      syncInputFromState();
      return true;
    };

    syncInputFromState();

    document.getElementById('btn-chart-query').addEventListener('click', () => {
      if (!applyRangeFromInput()) return;
      renderChartBoard();
    });

    document.getElementById('btn-chart-reset').addEventListener('click', () => {
      const d = getDefaultChartRange();
      chartState.from = d.from;
      chartState.to = d.to;
      syncInputFromState();
      renderChartBoard();
    });
  }

  // ============ 匯出 / 列印 ============
  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function downloadCsv(filename, rows) {
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  function bindExport() {
    document.getElementById('btn-rpt-export').addEventListener('click', () => {
      const monthRows = getChartMonthRows();
      const rows = [
        ['推薦案件報表'],
        [
          '圖表區間', `${fmtDateYmd(chartState.from)} ~ ${fmtDateYmd(chartState.to)}`,
          '匯出時間', new Date().toLocaleString('zh-TW'),
        ],
        [],
        ['月份','新增案件','成交案件','中止案件','獎金發放(NT$)','已提領(NT$)','待提領(NT$)'],
      ];
      monthRows.forEach((r) => {
        const pending = Math.max(0, r.pay - r.wd);
        rows.push([
          `${r.year}/${String(r.month).padStart(2, '0')}`,
          r.n, r.d, r.f,
          r.pay, r.wd, pending,
        ]);
      });
      // 合計
      const tot = monthRows.reduce((a, r) => {
        a.n += r.n; a.d += r.d; a.f += r.f; a.pay += r.pay; a.wd += r.wd;
        return a;
      }, { n: 0, d: 0, f: 0, pay: 0, wd: 0 });
      rows.push([
        '合計', tot.n, tot.d, tot.f,
        tot.pay, tot.wd, Math.max(0, tot.pay - tot.wd),
      ]);
      const stamp = fmtDateInput(chartState.from).replace(/-/g, '') + '_' + fmtDateInput(chartState.to).replace(/-/g, '');
      downloadCsv(`report_${stamp}.csv`, rows);
    });

    document.getElementById('btn-rpt-print').addEventListener('click', () => {
      window.print();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindFilters();
    bindChartFilters();
    bindExport();
    bindTopTabs();
    renderKpiBoard();
    renderChartBoard();
  });
})();
