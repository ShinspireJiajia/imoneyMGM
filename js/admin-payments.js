/* ==========================================================
   admin-payments.js - 分潤帳務（財務功能）
   功能：列表、批次標記、異動歷程、Append-only 稽核
   ========================================================== */

(function () {
  'use strict';

  // 款項 demo
  // status: pending（待撥款）/ transferred（已匯款）
  //        / pickup（待現場領取）/ completed（已領取）/ failed（撥款回退）
  const PAYMENTS = [
    {
      id: 'PAY-26052201',
      caseId: 'M2026051504',
      memberId: 'U240105002',
      referrer: '李大華',
      tag: '員工',
      product: '房屋貸款',
      amount: 6500,
      method: 'transfer',
      bank: '玉山銀行',
      bankLast4: '1234',
      appliedAt: '2026/05/22 10:30',
      status: 'pending',
      campaignId: 'CAMP-E-2026Q2',
    },
    {
      id: 'PAY-26052202',
      caseId: 'M2026051205',
      memberId: 'U250310001',
      referrer: '王小毅',
      tag: '會員',
      product: '汽車貸款',
      amount: 2500,
      method: 'transfer',
      bank: '中信銀行',
      bankLast4: '5678',
      appliedAt: '2026/05/22 14:15',
      status: 'pending',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26052203',
      caseId: 'M2026050610',
      memberId: 'U250310001',
      referrer: '王小毅',
      tag: '會員',
      product: '汽車貸款',
      amount: 3000,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/05',
      appliedAt: '2026/05/22 16:00',
      status: 'pickup',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26052105',
      caseId: 'M2026050806',
      memberId: 'U230620004',
      referrer: '陳前輩',
      tag: '離職員工',
      product: '信用貸款',
      amount: 500,
      method: 'transfer',
      bank: '玉山銀行',
      bankLast4: '4567',
      appliedAt: '2026/05/22 09:00',
      status: 'pending',
      campaignId: 'CAMP-E-2026Q2',
    },
    {
      id: 'PAY-26052006',
      caseId: 'M2026050415',
      memberId: 'U240310010',
      referrer: '黃俊偉',
      tag: '會員',
      product: '汽車貸款',
      amount: 1800,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/05',
      appliedAt: '2026/05/20 11:20',
      status: 'pickup',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26043007',
      caseId: 'M2026042214',
      memberId: 'U241020011',
      referrer: '何若蓁',
      tag: '會員',
      product: '房屋貸款',
      amount: 5500,
      method: 'transfer',
      bank: '玉山銀行',
      bankLast4: '1234',
      appliedAt: '2026/04/26 09:00',
      transferredAt: '2026/04/30 14:30',
      status: 'transferred',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26032808',
      caseId: 'M2026031816',
      memberId: 'U240815012',
      referrer: '高志仁',
      tag: '會員',
      product: '信用貸款',
      amount: 500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/03/28',
      appliedAt: '2026/03/25 14:00',
      pickedUpAt: '2026/03/28 11:30',
      status: 'completed',
      campaignId: 'CAMP-C-2026Q1',
    },
    {
      id: 'PAY-26060301',
      caseId: 'M2026052801',
      memberId: 'U250601011',
      referrer: '陳小玲',
      tag: '會員',
      product: '房屋貸款',
      amount: 3200,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/03',
      appliedAt: '2026/06/01 09:30',
      status: 'pickup',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26060302',
      caseId: 'M2026052802',
      memberId: 'U250601012',
      referrer: '蔡明芳',
      tag: '會員',
      product: '信用貸款',
      amount: 2200,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/05',
      appliedAt: '2026/06/01 14:00',
      status: 'pending',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26060303',
      caseId: 'M2026052803',
      memberId: 'U250601013',
      referrer: '林正豪',
      tag: '員工',
      product: '房屋貸款',
      amount: 4500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/06',
      appliedAt: '2026/06/02 10:15',
      status: 'pending',
      campaignId: 'CAMP-E-2026Q2',
    },
    {
      id: 'PAY-26060304',
      caseId: 'M2026052804',
      memberId: 'U250601014',
      referrer: '謝佳慧',
      tag: '會員',
      product: '汽車貸款',
      amount: 1500,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/07',
      appliedAt: '2026/06/02 15:30',
      status: 'pending',
      campaignId: 'CAMP-C-2026Q2',
    },
    {
      id: 'PAY-26060305',
      caseId: 'M2026052805',
      memberId: 'U250601015',
      referrer: '吳志遠',
      tag: '離職員工',
      product: '房屋貸款',
      amount: 3800,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/07',
      appliedAt: '2026/06/02 16:45',
      status: 'pending',
      campaignId: 'CAMP-E-2026Q2',
    },
    {
      id: 'PAY-26050309',
      caseId: 'M2026042920',
      memberId: 'U241105013',
      referrer: '林雅妤',
      tag: '會員',
      product: '信用貸款',
      amount: 500,
      method: 'transfer',
      bank: '玉山銀行',
      bankLast4: '9999',
      appliedAt: '2026/05/03 10:00',
      transferredAt: '2026/05/05 13:00',
      status: 'failed',
      failReason: '帳號錯誤，銀行退匯',
      campaignId: 'CAMP-C-2026Q2',
    },
  ];

  function buildRewardSourceMap() {
    const getter = window.MGMCommon && window.MGMCommon.getRewardsDemo;
    if (!getter) return new Map();
    const rewards = getter();
    return new Map(rewards.map((r) => [r.id, r]));
  }

  function rewardProductLabel(r) {
    if (!r) return '—';
    if (Array.isArray(r.snapshot && r.snapshot.items) && r.snapshot.items.length) {
      return r.snapshot.items
        .map((x) => x.projectLabel || x.projectKey || '未命名專案')
        .filter(Boolean)
        .join(' + ');
    }
    return r.product || '—';
  }

  function syncPaymentsWithRewardSource() {
    const rewardMap = buildRewardSourceMap();
    if (rewardMap.size === 0) return;
    PAYMENTS.forEach((p) => {
      const r = rewardMap.get(p.caseId);
      if (!r) return;
      if (typeof r.amount === 'number' && !isNaN(r.amount)) p.amount = r.amount;
      p.product = rewardProductLabel(r);
      if (r.campaignId) p.campaignId = r.campaignId;
    });
  }

  syncPaymentsWithRewardSource();

  // 異動歷程（key 為 paymentId，Append-only）
  const HISTORY = {
    'PAY-26052201': [
      { time: '2026/05/22 10:30', actor: '推薦人 - 李大華', action: '建立提領申請', desc: '勾選 1 筆，方式：匯款（玉山 *1234）', cls: 'done' },
      { time: '2026/05/22 11:45', actor: '系統', action: '財務待審佇列', desc: '案件 M2026051504 進入財務待撥款佇列', cls: 'done' },
    ],
    'PAY-26052105': [
      { time: '2026/05/22 09:00', actor: '推薦人 - 陳前輩', action: '建立提領申請', desc: '勾選 1 筆，方式：匯款（玉山 *4567）', cls: 'done' },
      { time: '2026/05/22 11:30', actor: '財務 - Mary', action: '通過初步審核', desc: '已核對推薦人稅務資料，準備執行匯款', cls: 'done' },
      { time: '2026/05/22 15:20', actor: '財務 - Mary', action: '更新處理備註', desc: '已產出付款指示單，待人工後續作業', cls: '' },
    ],
    'PAY-26043007': [
      { time: '2026/04/24 09:00', actor: '系統', action: '案件撥款完成', desc: '貸款主案 M2026042214 撥款 NT$3,500,000', cls: 'done' },
      { time: '2026/04/24 09:00', actor: '系統', action: '快照計算分潤', desc: '依快照（底包 $2,000 + 0.10% × 撥款額）= $5,500', cls: 'done' },
      { time: '2026/04/26 09:00', actor: '推薦人 - 何若蓁', action: '建立提領申請', desc: '匯款方式：玉山 *1234', cls: 'done' },
      { time: '2026/04/28 14:00', actor: '財務 - Mary', action: '通過審核', desc: '稅務資料完整', cls: 'done' },
      { time: '2026/04/30 14:30', actor: '財務 - Mary', action: '完成匯款', desc: '匯出指示已送出，已通知推薦人', cls: 'done' },
      { time: '2026/04/30 15:00', actor: '系統', action: '自動通知推薦人', desc: '已發送 LINE OA 推播：匯款日期 2026/04/30', cls: 'done' },
    ],
    'PAY-26050309': [
      { time: '2026/05/03 10:00', actor: '推薦人 - 林雅妤', action: '建立提領申請', desc: '匯款方式：玉山 *9999', cls: 'done' },
      { time: '2026/05/04 11:00', actor: '財務 - John', action: '完成匯款', desc: '匯出指示已送出', cls: 'done' },
      { time: '2026/05/05 13:00', actor: '系統', action: '銀行回退', desc: '銀行系統回報：帳號錯誤，原款項已退回', cls: 'failed' },
      { time: '2026/05/05 14:00', actor: '客服 - John', action: '已聯繫推薦人補正帳號', desc: '推薦人 LINE 已回覆，下批次重匯', cls: '' },
    ],
  };

  const STATUS_META = {
    pending: { label: '待撥款', cls: 'pending', icon: 'fa-hourglass-half' },
    transferred: { label: '已匯款', cls: 'transferred', icon: 'fa-circle-check' },
    pickup: { label: '待現場領取', cls: 'pickup', icon: 'fa-store' },
    completed: { label: '已領取', cls: 'completed', icon: 'fa-handshake' },
    failed: { label: '銀行退匯', cls: 'failed', icon: 'fa-circle-exclamation' },
  };

  const TAG_META = {
    會員: 'badge-purple',
    員工: 'badge-green',
    離職員工: 'badge-yellow',
  };

  function getTaxInfoByTag(tag) {
    if (tag === '員工') return '執行業務所得';
    if (tag === '會員' || tag === '離職員工') return '其他所得';
    return '其他所得';
  }

  let selected = new Set();
  const filters = {
    keyword: '',
    status: 'all',
    method: 'all',
    dateFrom: '',
    dateTo: '',
  };
  // 分頁狀態
  let pgPage = 1;
  let pgSize = 20;

  // ---------- 編輯匯款資訊權限（demo：localStorage 持久化） ----------
  // 實際部署時應由 RBAC / 帳號權限管理系統決定
  const PERM_KEY = 'mgm_perm_edit_payment';
  function canEditPayment() {
    try { return localStorage.getItem(PERM_KEY) === '1'; } catch { return false; }
  }
  function setCanEditPayment(v) {
    try { localStorage.setItem(PERM_KEY, v ? '1' : '0'); } catch {}
  }

  function fmt(n) {
    return n.toLocaleString();
  }

  function fmtMethod(p) {
    if (p.method === 'transfer') return '匯款';
    if (p.method === 'cash') return '現場';
    return '—';
  }

  function hasWithdrawDemand(p) {
    return !!p.appliedAt;
  }

  function isBatchSelectable(p) {
    return hasWithdrawDemand(p) && (p.status === 'pending' || p.status === 'pickup');
  }

  function normalizeSelected() {
    selected = new Set(
      [...selected].filter((id) => {
        const p = PAYMENTS.find((x) => x.id === id);
        return p && isBatchSelectable(p);
      })
    );
  }

  function renderRow(p) {
    const s = STATUS_META[p.status];
    const tagCls = TAG_META[p.tag] || 'badge-gray';
    const rowCls = p.status === 'failed' ? 'row-failed' : '';
    const checked = selected.has(p.id);
    const canCheck = isBatchSelectable(p);

    const methodCell = p.method === 'cash'
      ? `現場${p.expectedPickupDate
          ? `<div style="margin-top:4px;display:inline-flex;align-items:center;gap:4px;background:var(--color-warning-light);color:var(--color-warning-dark);padding:2px 8px;border-radius:var(--radius-pill);font-size:11px;font-weight:600;"><i class="fa-regular fa-calendar" style="font-size:10px;"></i>預計 ${p.expectedPickupDate}</div>`
          : '<div style="margin-top:4px;font-size:11px;color:var(--color-text-muted);">未設定預計日</div>'}`
      : fmtMethod(p);

    return `
      <tr class="${rowCls}">
        <td>
          ${canCheck
            ? `<input type="checkbox" class="row-check" data-id="${p.id}" ${checked ? 'checked' : ''}>`
            : ''}
        </td>
        <td class="cell-mono"><span class="mono-strong">${p.id}</span></td>
        <td class="cell-mono">${p.caseId}</td>
        <td class="cell-mono">${p.memberId || '—'}</td>
        <td><strong>${p.referrer}</strong></td>
        <td><span class="tag-pill ${tagCls}">${p.tag}</span></td>
        <td class="cell-tax">${getTaxInfoByTag(p.tag)}</td>
        <td class="cell-amount">$${fmt(p.amount)}</td>
        <td class="cell-method">${methodCell}</td>
        <td class="cell-applied">${p.appliedAt}</td>
        <td>
          <span class="pay-status ${s.cls}">
            <i class="fa-solid ${s.icon}"></i>${s.label}
          </span>
        </td>
        <td>
          <button type="button" class="action-btn" data-action="history" data-id="${p.id}">
            <i class="fa-solid fa-clock-rotate-left"></i>歷程
          </button>
          <button type="button" class="action-btn note" data-action="note-pay" data-id="${p.id}" title="${p.note ? '已有備註：' + p.note : '新增備註'}">
            <i class="fa-regular fa-note-sticky"></i>${p.note ? '備註•' : '備註'}
          </button>
          ${canEditPayment() ? `<button type="button" class="action-btn" data-action="edit-pay" data-id="${p.id}">
            <i class="fa-solid fa-pen-to-square"></i>編輯
          </button>` : ''}
        </td>
      </tr>`;
  }

  function parseAppliedDate(appliedAt) {
    const m = String(appliedAt || '').match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function parseFilterDate(value, isEnd) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    if (isEnd) d.setHours(23, 59, 59, 999);
    else d.setHours(0, 0, 0, 0);
    return d;
  }

  function isInDateRange(p, dateFrom, dateTo) {
    const appliedDate = parseAppliedDate(p.appliedAt);
    if (!appliedDate) return false;
    const from = parseFilterDate(dateFrom, false);
    const to = parseFilterDate(dateTo, true);
    if (from && appliedDate < from) return false;
    if (to && appliedDate > to) return false;
    return true;
  }

  function getFiltered() {
    const kw = filters.keyword.trim().toLowerCase();
    const result = PAYMENTS.filter((p) => {
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.method !== 'all' && p.method !== filters.method) return false;
      if (!isInDateRange(p, filters.dateFrom, filters.dateTo)) return false;
      if (!kw) return true;

      const haystack = [p.id, p.caseId, p.memberId, p.referrer, p.tag, p.product]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(kw);
    });
    // 申請日期近到遠（新到舊）
    return result.sort((a, b) => {
      const ta = String(a.appliedAt || '').replace(/\//g, '-');
      const tb = String(b.appliedAt || '').replace(/\//g, '-');
      return tb.localeCompare(ta);
    });
  }

  function render() {
    normalizeSelected();
    const filtered = getFiltered();
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / pgSize));
    if (pgPage > maxPage) pgPage = maxPage;
    const start = (pgPage - 1) * pgSize;
    const pageRows = filtered.slice(start, start + pgSize);

    const tbody = document.getElementById('payments-tbody');
    tbody.innerHTML = pageRows.length
      ? pageRows.map(renderRow).join('')
      : `<tr><td colspan="12" style="padding:32px;text-align:center;color:var(--color-text-muted);">此分類目前沒有資料</td></tr>`;

    // KPI：待匯款（transfer+pending）、現場領取（cash 待領或待匯）、本月已撥款
    const transferPending = PAYMENTS.filter((p) => p.method === 'transfer' && p.status === 'pending');
    const cashPending     = PAYMENTS.filter((p) => p.method === 'cash' && (p.status === 'pending' || p.status === 'pickup'));
    const done            = PAYMENTS.filter((p) => p.status === 'transferred' || p.status === 'completed');

    document.getElementById('kpi-transfer-amount').textContent = '$' + fmt(transferPending.reduce((s, p) => s + p.amount, 0));
    document.getElementById('kpi-transfer-count').textContent  = transferPending.length + ' 筆';
    document.getElementById('kpi-cash-amount').textContent     = '$' + fmt(cashPending.reduce((s, p) => s + p.amount, 0));
    document.getElementById('kpi-cash-count').textContent      = cashPending.length + ' 筆';
    document.getElementById('kpi-done-amount').textContent     = '$' + fmt(done.reduce((s, p) => s + p.amount, 0));
    document.getElementById('kpi-done-count').textContent      = done.length + ' 筆';

    // 分頁元件
    renderPagination(total, maxPage);

    bindRowActions();
    updateBatchBar();
  }

  function renderPagination(total, maxPage) {
    const totalEl = document.getElementById('pay-pg-total');
    const curEl = document.getElementById('pay-pg-cur');
    const maxEl = document.getElementById('pay-pg-max');
    if (totalEl) totalEl.textContent = total;
    if (curEl) curEl.textContent = pgPage;
    if (maxEl) maxEl.textContent = maxPage;

    const wrap = document.getElementById('pay-pagination');
    if (!wrap) return;

    const btns = [];
    btns.push(`<button class="pg-btn" data-pg="prev" ${pgPage <= 1 ? 'disabled' : ''}>«</button>`);

    // 顯示頁碼：當前 ±2，總是顯示 1 與最後一頁
    const pages = new Set([1, maxPage]);
    for (let i = Math.max(1, pgPage - 2); i <= Math.min(maxPage, pgPage + 2); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    let prev = 0;
    sorted.forEach((n) => {
      if (n - prev > 1) btns.push(`<span class="pg-ellipsis">…</span>`);
      btns.push(`<button class="pg-btn ${n === pgPage ? 'pg-active' : ''}" data-pg="${n}">${n}</button>`);
      prev = n;
    });

    btns.push(`<button class="pg-btn" data-pg="next" ${pgPage >= maxPage ? 'disabled' : ''}>»</button>`);
    wrap.innerHTML = btns.join('');

    wrap.querySelectorAll('.pg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.dataset.pg;
        if (v === 'prev') pgPage = Math.max(1, pgPage - 1);
        else if (v === 'next') pgPage = Math.min(maxPage, pgPage + 1);
        else pgPage = parseInt(v, 10) || 1;
        render();
      });
    });
  }

  function bindRowActions() {
    document.querySelectorAll('.row-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        const p = PAYMENTS.find((x) => x.id === id);
        if (!p || !isBatchSelectable(p)) {
          cb.checked = false;
          selected.delete(id);
        } else if (cb.checked) {
          selected.add(id);
        } else {
          selected.delete(id);
        }
        updateBatchBar();
      });
    });
    document.querySelectorAll('[data-action="history"]').forEach((b) =>
      b.addEventListener('click', () => openHistory(b.dataset.id))
    );
    document.querySelectorAll('[data-action="edit-pay"]').forEach((b) =>
      b.addEventListener('click', () => openEditPay(b.dataset.id))
    );
    document.querySelectorAll('[data-action="note-pay"]').forEach((b) =>
      b.addEventListener('click', () => openNotePay(b.dataset.id))
    );
  }

  function updateBatchBar() {
    normalizeSelected();
    const bar = document.getElementById('batch-bar');
    if (selected.size === 0) {
      bar.classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    const items = [...selected].map((id) => PAYMENTS.find((p) => p.id === id)).filter(Boolean);
    const sum = items.reduce((s, p) => s + p.amount, 0);
    document.getElementById('batch-count').textContent = items.length;
    document.getElementById('batch-amount').textContent = '$' + fmt(sum);
  }

  function applyBatchNote(action, label, newStatus) {
    normalizeSelected();
    const note = (document.getElementById('batch-note').value || '').trim();
    const ids = [...selected];
    if (ids.length === 0) {
      toast('目前無可批次更新的提領申請', '#f59e0b');
      return;
    }
    const now = new Date().toLocaleString('zh-TW');
    ids.forEach((id) => {
      const p = PAYMENTS.find(x => x.id === id);
      if (!p || !isBatchSelectable(p)) return;
      if (newStatus) p.status = newStatus;
      if (note) p.note = note;
      // 寫入歷程
      if (!HISTORY[id]) HISTORY[id] = [];
      HISTORY[id].unshift({
        time: now,
        actor: 'Admin User',
        action: `批次標記為「${label}」` + (note ? ` ・ 備註：${note}` : ''),
        desc: note || '（無備註）',
        cls: 'done',
      });
    });
    document.getElementById('batch-note').value = '';
    selected.clear();
    render();
    toast(`已批次更新 ${ids.length} 筆${note ? '（含備註）' : ''}`);
  }

  function bindBatchActions() {
    document.getElementById('btn-batch-transferred').addEventListener('click', () => {
      if (selected.size === 0) return;
      if (confirm(`將 ${selected.size} 筆款項標記為「已撥款」？\n備註內容也會一併寫入。`)) {
        applyBatchNote('transferred', '已撥款', 'transferred');
      }
    });

    document.getElementById('btn-batch-completed').addEventListener('click', () => {
      if (selected.size === 0) return;
      if (confirm(`將 ${selected.size} 筆款項標記為「已領取」？`)) {
        applyBatchNote('completed', '已領取', 'completed');
      }
    });

    document.getElementById('btn-batch-cancel').addEventListener('click', () => {
      selected.clear();
      render();
    });

  }

  function applyFiltersFromUI() {
    const keywordEl = document.getElementById('filter-keyword');
    const statusEl = document.getElementById('filter-status');
    const methodEl = document.getElementById('filter-method');
    const dateFromEl = document.getElementById('filter-date-from');
    const dateToEl = document.getElementById('filter-date-to');

    filters.keyword = keywordEl ? keywordEl.value : '';
    filters.status = statusEl ? statusEl.value : 'all';
    filters.method = methodEl ? methodEl.value : 'all';
    filters.dateFrom = dateFromEl ? dateFromEl.value : '';
    filters.dateTo = dateToEl ? dateToEl.value : '';

    pgPage = 1;
    selected.clear();
    render();
  }

  function bindFilters() {
    const keywordEl = document.getElementById('filter-keyword');
    const statusEl = document.getElementById('filter-status');
    const methodEl = document.getElementById('filter-method');
    const dateFromEl = document.getElementById('filter-date-from');
    const dateToEl = document.getElementById('filter-date-to');
    const btnSearch = document.getElementById('btn-filter-search');

    if (btnSearch) btnSearch.addEventListener('click', applyFiltersFromUI);
    if (keywordEl) {
      keywordEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') applyFiltersFromUI();
      });
    }

    // 狀態改變常用於快速查看，保留即時篩選
    if (statusEl) statusEl.addEventListener('change', applyFiltersFromUI);
    if (methodEl) methodEl.addEventListener('change', applyFiltersFromUI);
    if (dateFromEl) dateFromEl.addEventListener('change', applyFiltersFromUI);
    if (dateToEl) dateToEl.addEventListener('change', applyFiltersFromUI);
  }

  function setDefaultDateRangeLast30Days() {
    const dateFromEl = document.getElementById('filter-date-from');
    const dateToEl = document.getElementById('filter-date-to');
    if (!dateFromEl || !dateToEl) return;

    const now = new Date();
    const from = new Date(now);
    from.setDate(now.getDate() - 29);

    const toYmd = now.toISOString().slice(0, 10);
    const fromYmd = from.toISOString().slice(0, 10);
    dateFromEl.value = fromYmd;
    dateToEl.value = toYmd;
  }

  function bindPageSize() {
    const sel = document.getElementById('pay-page-size');
    if (!sel) return;
    pgSize = parseInt(sel.value, 10) || 20;
    sel.addEventListener('change', () => {
      pgSize = parseInt(sel.value, 10) || 20;
      pgPage = 1;
      render();
    });
  }

  // ==================== 匯出對帳檔（CSV） ====================
  // 加 UTF-8 BOM 讓 Excel 開啟不亂碼
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
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  function bindExportRecon() {
    const btn = document.getElementById('btn-export-recon');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const rows = getFiltered();
      if (rows.length === 0) { alert('目前無資料可匯出，請調整篩選條件。'); return; }
      const header = ['款項編號','案號','會員編號','推薦人','標籤','稅務資訊','產品','金額(NT$)','撥款方式','銀行/門市','申請日期','撥款時間','領取時間','狀態','備註'];
      const data = rows.map((p) => {
        const methodDetail = p.method === 'transfer' ? `${p.bank || ''} *${p.bankLast4 || ''}` : (p.branch || '');
        return [
          p.id, p.caseId, p.memberId || '', p.referrer, p.tag, getTaxInfoByTag(p.tag), p.product,
          p.amount, (p.method === 'transfer' ? '匯款' : '現場領取'),
          methodDetail, p.appliedAt,
          p.transferredAt || '', p.pickedUpAt || '',
          STATUS_META[p.status]?.label || p.status,
          p.note || (p.failReason || ''),
        ];
      });
      const stamp = new Date().toISOString().slice(0,10).replace(/-/g,'');
      downloadCsv(`reconciliation_${stamp}.csv`, [header, ...data]);
      toast(`已匯出 ${rows.length} 筆對帳資料`);
    });
  }

  // ==================== 月結報表 ====================
  function getMonthKey(d) {
    // YYYY-MM
    return d.toISOString().slice(0, 7);
  }
  function parseAppliedMonth(p) {
    // p.appliedAt 格式 '2026/05/22 10:30' → '2026-05'
    const m = String(p.appliedAt).match(/^(\d{4})\/(\d{2})/);
    return m ? `${m[1]}-${m[2]}` : '';
  }

  function calcMonthly(yyyymm) {
    const inMonth = PAYMENTS.filter((p) => parseAppliedMonth(p) === yyyymm);
    const total = inMonth.length;
    const sumAmount = inMonth.reduce((s, p) => s + p.amount, 0);
    const byStatus = {};
    inMonth.forEach((p) => {
      const k = STATUS_META[p.status]?.label || p.status;
      if (!byStatus[k]) byStatus[k] = { count: 0, amount: 0 };
      byStatus[k].count++; byStatus[k].amount += p.amount;
    });
    const byMethod = {};
    inMonth.forEach((p) => {
      const k = p.method === 'transfer' ? '匯款' : '現場領取';
      if (!byMethod[k]) byMethod[k] = { count: 0, amount: 0 };
      byMethod[k].count++; byMethod[k].amount += p.amount;
    });
    const byProduct = {};
    inMonth.forEach((p) => {
      const k = p.product;
      if (!byProduct[k]) byProduct[k] = { count: 0, amount: 0 };
      byProduct[k].count++; byProduct[k].amount += p.amount;
    });
    return { yyyymm, total, sumAmount, byStatus, byMethod, byProduct, rows: inMonth };
  }

  function renderMonthly(data) {
    const wrap = document.getElementById('monthly-summary');
    if (!wrap) return;
    if (data.total === 0) {
      wrap.innerHTML = `<div class="monthly-empty"><i class="fa-regular fa-folder-open"></i>本月（${data.yyyymm}）尚無款項資料</div>`;
      return;
    }
    const breakdown = (title, obj) => {
      const items = Object.entries(obj)
        .map(([k, v]) => `<tr><td>${k}</td><td class="num">${v.count}</td><td class="num">$${fmt(v.amount)}</td></tr>`)
        .join('');
      return `
        <section class="monthly-block">
          <h4>${title}</h4>
          <table class="monthly-table">
            <thead><tr><th>分類</th><th class="num">筆數</th><th class="num">金額</th></tr></thead>
            <tbody>${items}</tbody>
          </table>
        </section>`;
    };
    wrap.innerHTML = `
      <div class="monthly-kpi-row">
        <div class="monthly-kpi"><span class="lbl">${data.yyyymm} 總筆數</span><strong>${data.total}</strong></div>
        <div class="monthly-kpi"><span class="lbl">合計金額</span><strong>$${fmt(data.sumAmount)}</strong></div>
      </div>
      ${breakdown('依狀態', data.byStatus)}
      ${breakdown('依撥款方式', data.byMethod)}
      ${breakdown('依產品', data.byProduct)}`;
  }

  function bindMonthlyReport() {
    const btnOpen = document.getElementById('btn-monthly-report');
    const btnClose = document.getElementById('btn-monthly-close');
    const btnRefresh = document.getElementById('btn-monthly-refresh');
    const btnDl = document.getElementById('btn-monthly-download');
    const monthInput = document.getElementById('monthly-month');
    const modal = document.getElementById('monthly-modal');
    if (!btnOpen || !modal) return;

    // 預設為目前月份
    const now = new Date();
    monthInput.value = getMonthKey(now);

    function refresh() {
      const data = calcMonthly(monthInput.value);
      modal.dataset.data = JSON.stringify({ yyyymm: data.yyyymm });
      renderMonthly(data);
    }

    btnOpen.addEventListener('click', () => {
      modal.classList.add('show');
      refresh();
    });
    btnClose.addEventListener('click', () => modal.classList.remove('show'));
    btnRefresh.addEventListener('click', refresh);
    monthInput.addEventListener('change', refresh);

    btnDl.addEventListener('click', () => {
      const data = calcMonthly(monthInput.value);
      if (data.total === 0) { alert('本月份無資料可下載'); return; }
      // 多工作表概念以多區塊輸出（CSV 不支援工作表，採分區段）
      const rows = [
        [`月結報表 ${data.yyyymm}`],
        ['總筆數', data.total, '合計金額(NT$)', data.sumAmount],
        [],
        ['【依狀態】'], ['狀態','筆數','金額(NT$)'],
        ...Object.entries(data.byStatus).map(([k,v]) => [k, v.count, v.amount]),
        [],
        ['【依撥款方式】'], ['方式','筆數','金額(NT$)'],
        ...Object.entries(data.byMethod).map(([k,v]) => [k, v.count, v.amount]),
        [],
        ['【依產品】'], ['產品','筆數','金額(NT$)'],
        ...Object.entries(data.byProduct).map(([k,v]) => [k, v.count, v.amount]),
        [],
        ['【明細】'],
        ['款項編號','案號','會員編號','推薦人','標籤','稅務資訊','產品','金額','方式','申請日期','狀態'],
        ...data.rows.map((p) => [
          p.id, p.caseId, p.memberId || '', p.referrer, p.tag, getTaxInfoByTag(p.tag), p.product,
          p.amount, p.method === 'transfer' ? '匯款' : '現場領取',
          p.appliedAt, STATUS_META[p.status]?.label || p.status,
        ]),
      ];
      downloadCsv(`monthly_report_${data.yyyymm.replace('-','')}.csv`, rows);
      toast(`已下載 ${data.yyyymm} 月結報表`);
    });
  }

  // 異動歷程
  function openHistory(payId) {
    const p = PAYMENTS.find((x) => x.id === payId);
    if (!p) return;
    document.getElementById('history-payid').textContent = p.id;
    document.getElementById('history-ref').textContent = p.referrer + ' / ' + p.tag;
    document.getElementById('history-tax').textContent = getTaxInfoByTag(p.tag);
    document.getElementById('history-amount').textContent = '$' + fmt(p.amount);
    document.getElementById('history-method').textContent = fmtMethod(p);
    document.getElementById('history-status').innerHTML =
      `<span class="pay-status ${STATUS_META[p.status].cls}">${STATUS_META[p.status].label}</span>`;

    const list = HISTORY[payId] || [];
    const wrap = document.getElementById('history-timeline');
    if (list.length === 0) {
      wrap.innerHTML = `<div style="text-align:center;padding:30px;color:var(--color-text-muted);">尚無歷程紀錄</div>`;
    } else {
      wrap.innerHTML = list
        .map(
          (h) => `
        <div class="timeline-entry ${h.cls}">
          <div class="timeline-time">${h.time}</div>
          <div class="timeline-title">${h.action}</div>
          <div class="timeline-desc">${h.desc}</div>
          <div class="timeline-actor"><i class="fa-regular fa-user"></i> ${h.actor}</div>
        </div>`
        )
        .join('');
    }

    document.getElementById('history-modal').classList.add('show');
  }

  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  // ==================== 編輯匯款資訊 ====================
  function openEditPay(payId) {
    const p = PAYMENTS.find((x) => x.id === payId);
    if (!p) return;
    if (!canEditPayment()) {
      alert('您沒有「編輯匯款資訊」權限，請聯繫管理員開啟。');
      return;
    }

    document.getElementById('edit-pay-id').textContent = p.id;
    document.getElementById('edit-pay-ref').value = `${p.referrer} (${p.tag})`;
    document.getElementById('edit-pay-method').value = p.method || 'transfer';
    document.getElementById('edit-pay-status').value = p.status || 'pending';
    document.getElementById('edit-pay-bank').value = p.bank || '';
    document.getElementById('edit-pay-last4').value = p.bankLast4 || '';
    document.getElementById('edit-pay-branch').value = p.branch || '';
    document.getElementById('edit-pay-expected-pickup').value = p.expectedPickupDate || '';
    document.getElementById('edit-pay-reason').value = '';
    toggleEditFields(p.method || 'transfer');

    document.getElementById('edit-pay-modal').classList.add('show');
    document.getElementById('edit-pay-modal').dataset.editing = payId;
  }

  function toggleEditFields(method) {
    document.querySelectorAll('.edit-pay-transfer-fields').forEach((el) => {
      el.hidden = (method !== 'transfer');
    });
    document.querySelectorAll('.edit-pay-cash-fields').forEach((el) => {
      el.hidden = (method !== 'cash');
    });
  }

  function saveEditPay() {
    const modal = document.getElementById('edit-pay-modal');
    const id = modal.dataset.editing;
    const p = PAYMENTS.find((x) => x.id === id);
    if (!p) return;

    const method = document.getElementById('edit-pay-method').value;
    const nextStatus = document.getElementById('edit-pay-status').value;
    const reason = document.getElementById('edit-pay-reason').value.trim();
    if (!reason) { alert('請填寫變更原因（必填，將寫入異動歷程）'); return; }

    const oldMethod = p.method;
    const oldStatus = p.status;

    if (method === 'transfer') {
      const bank = document.getElementById('edit-pay-bank').value.trim();
      const last4 = document.getElementById('edit-pay-last4').value.trim();
      if (!bank || !/^\d{4}$/.test(last4)) {
        alert('請填寫銀行名稱與帳號末四碼（4 位數字）');
        return;
      }
      p.method = 'transfer';
      p.bank = bank;
      p.bankLast4 = last4;
      delete p.branch;
    } else if (method === 'cash') {
      const branch = document.getElementById('edit-pay-branch').value.trim();
      if (!branch) { alert('請填寫領取門市'); return; }
      p.method = 'cash';
      p.branch = branch;
      p.expectedPickupDate = document.getElementById('edit-pay-expected-pickup').value || '';
      delete p.bank;
      delete p.bankLast4;
    }

    p.status = nextStatus;

    const nowText = new Date().toLocaleString('zh-TW');
    if (nextStatus === 'transferred') {
      p.transferredAt = nowText;
      delete p.pickedUpAt;
    } else if (nextStatus === 'completed') {
      p.pickedUpAt = nowText;
    }
    if (nextStatus === 'failed') {
      p.failReason = reason;
    } else if (p.failReason) {
      delete p.failReason;
    }

    // Append-only：寫入歷程
    if (!HISTORY[p.id]) HISTORY[p.id] = [];
    const statusDiff = oldStatus !== nextStatus
      ? `狀態：${STATUS_META[oldStatus]?.label || oldStatus} -> ${STATUS_META[nextStatus]?.label || nextStatus}`
      : `狀態：${STATUS_META[nextStatus]?.label || nextStatus}`;
    const methodDiff = oldMethod !== p.method
      ? `方式：${oldMethod === 'cash' ? '現場' : '匯款'} -> ${fmtMethod(p)}`
      : `方式：${fmtMethod(p)}`;
    HISTORY[p.id].push({
      time: nowText,
      actor: '財務後台 - 編輯權限使用',
      action: '修改匯款資訊',
      desc: `${statusDiff}；${methodDiff}；原因：${reason}`,
      cls: '',
    });

    closeEditPay();
    render();
    toast('已更新匯款資訊，異動已寫入歷程');
  }

  function closeEditPay() {
    document.getElementById('edit-pay-modal').classList.remove('show');
  }

  function bindEditPay() {
    document.getElementById('btn-edit-pay-close').addEventListener('click', closeEditPay);
    document.getElementById('btn-edit-pay-cancel').addEventListener('click', closeEditPay);
    document.getElementById('btn-edit-pay-save').addEventListener('click', saveEditPay);
    document.getElementById('edit-pay-method').addEventListener('change', (e) => {
      toggleEditFields(e.target.value);
    });
  }

  // ==================== 編輯備註（單筆） ====================
  let notePayId = null;
  function openNotePay(id) {
    const p = PAYMENTS.find(x => x.id === id);
    if (!p) return;
    notePayId = id;
    document.getElementById('note-pay-id').textContent = id;
    document.getElementById('note-pay-text').value = p.note || '';
    document.getElementById('note-pay-modal').classList.add('show');
  }
  function closeNotePay() {
    document.getElementById('note-pay-modal').classList.remove('show');
    notePayId = null;
  }
  function saveNotePay() {
    if (!notePayId) return;
    const p = PAYMENTS.find(x => x.id === notePayId);
    if (!p) return;
    const note = document.getElementById('note-pay-text').value.trim();
    p.note = note;
    if (!HISTORY[p.id]) HISTORY[p.id] = [];
    HISTORY[p.id].unshift({
      time: new Date().toLocaleString('zh-TW'),
      actor: 'Admin User',
      action: '更新備註',
      desc: note || '（清除備註）',
      cls: '',
    });
    closeNotePay();
    render();
    toast('已儲存備註');
  }
  function bindNotePay() {
    document.getElementById('btn-note-pay-close').addEventListener('click', closeNotePay);
    document.getElementById('btn-note-pay-cancel').addEventListener('click', closeNotePay);
    document.getElementById('btn-note-pay-save').addEventListener('click', saveNotePay);
  }

  // ==================== 權限 toggle ====================
  function bindPermToggle() {
    const cb = document.getElementById('perm-edit-payment');
    if (!cb) return;
    cb.checked = canEditPayment();
    cb.addEventListener('change', () => {
      setCanEditPayment(cb.checked);
      render(); // 重新繪製，控制「編輯」按鈕顯示
      toast(cb.checked ? '已開啟「編輯匯款資訊」權限' : '已關閉「編輯匯款資訊」權限');
    });
  }

  // ==================== B4：把活動 → 案件/已發放 聚合寫入 sessionStorage ====================
  // admin-campaigns 載入時可讀取此快取，把列表中的 cases / payout 與帳務對齊
  function publishCampaignAgg() {
    const agg = {};
    PAYMENTS.forEach((p) => {
      if (!p.campaignId) return;
      if (!agg[p.campaignId]) agg[p.campaignId] = { cases: 0, payout: 0 };
      agg[p.campaignId].cases += 1;
      // payout 統計：已完成（transferred / completed）才計入「已發放金額」
      if (p.status === 'transferred' || p.status === 'completed') {
        agg[p.campaignId].payout += p.amount;
      }
    });
    try { sessionStorage.setItem('mgm_campaign_agg', JSON.stringify(agg)); } catch {}
  }
  publishCampaignAgg();

  document.addEventListener('DOMContentLoaded', () => {
    bindPermToggle();
    bindPageSize();
    setDefaultDateRangeLast30Days();
    filters.method = 'transfer';
    bindFilters();
    applyFiltersFromUI();
    bindBatchActions();
    bindEditPay();
    bindNotePay();
    bindExportRecon();
    bindMonthlyReport();
    document
      .getElementById('btn-history-close')
      .addEventListener('click', () =>
        document.getElementById('history-modal').classList.remove('show')
      );
  });
})();
