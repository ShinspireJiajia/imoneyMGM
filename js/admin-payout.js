/* ==========================================================
   admin-payout.js - 推薦案件獎金核款
   會計人員核准 pending_approval 案件 → 推薦人即可申請提領
   ========================================================== */

(function () {
  'use strict';

  // 獎金規則參照 admin-matrix PROJECT_OPTIONS（CAMP-C-2026Q2）
  // 固定獎金制：house_loan $5000 / car_loan $1500 / credit_loan $3600
  //             pre_negotiation $2000 / rehabilitation $2000
  // 疊加上限（overlapCap）：$20,000
  // ─── 協商案件服務費核款條件 ────────────────────────────────
  const NEG_FEE_THRESHOLD   = 6000; // 累積服務費須達此金額才算啟動
  const NEG_FEE_EXTRA_INSTS = 2;    // 啟動後尚需再繳的期數

  function checkNegotiationFeeCondition(r) {
    if (r.caseType !== 'negotiation') return { ok: true };
    const receipts = Array.isArray(r.receipts) ? r.receipts : [];
    let cumulative = 0;
    let activationIdx = -1;
    for (let i = 0; i < receipts.length; i++) {
      cumulative += (receipts[i].amount || 0);
      if (cumulative >= NEG_FEE_THRESHOLD && activationIdx === -1) activationIdx = i;
    }
    if (activationIdx === -1) {
      return {
        ok: false,
        detail: `協商案件服務費累積未達 $${NEG_FEE_THRESHOLD.toLocaleString()}（目前已收：$${cumulative.toLocaleString()}）`,
      };
    }
    const remainingAfter = receipts.length - 1 - activationIdx;
    if (remainingAfter < NEG_FEE_EXTRA_INSTS) {
      const still = NEG_FEE_EXTRA_INSTS - remainingAfter;
      return {
        ok: false,
        detail: `協商款已啟動（第 ${activationIdx + 1} 期累積達標），尚需再繳 ${still} 期後方可核款（目前共 ${receipts.length} 期）`,
      };
    }
    return { ok: true };
  }

  const CASES = [
    {
      caseId: 'M2026051504',
      agentName: '陳志明', agentRegion: '北區',
      referrerName: '李大華', referrerTag: '員工', referrerCid: 'U240105002',
      refereeName: '張家豪', refereePhone: '0933678111',
      caseType: 'general',
      loanTypes: ['房屋貸款', '汽車貸款'],
      submitAt: '2026/05/15 11:05', payoutAt: '2026/05/16',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'house_loan', label: '房屋貸款', trigger: '付訖服務費',                                      bonus: 5000 },
          { projectKey: 'car_loan',   label: '汽車貸款', trigger: '付訖服務費',                                      bonus: 1500 },
        ],
      },
      amount: 6500,         // 5000 + 1500，未達疊加上限 $20,000
      payoutAmount: 4500000,
      status: 'pending_approval',
      warningCodes: ['E-OLD', 'E-120'],
      customerId: '2605160003',
      referrerListId: '2401050002',
      receipts: [{ suffix: 1, amount: 12000, note: '客戶要求分批入帳，請確認撥款序號' }, { suffix: 2, amount: 8000 }, { suffix: 3, amount: 6000, note: '補件後補登，金額已重新確認' }],
    },
    {
      caseId: 'M2026053002',
      agentName: '張偉傑', agentRegion: '中區',
      referrerName: '葉文群', referrerTag: '會員', referrerCid: 'U230408009',
      refereeName: '陳怡君', refereePhone: '0966123456',
      caseType: 'general',
      loanTypes: ['房屋貸款'],
      submitAt: '2026/05/30 14:30', payoutAt: '2026/05/31',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'house_loan', label: '房屋貸款', trigger: '付訖服務費',                                      bonus: 5000 },
        ],
      },
      amount: 5000,
      payoutAmount: 2800000,
      status: 'pending_approval',
      customerId: '2605300002',
      referrerListId: '2304080009',
      receipts: [{ amount: 15000 }],
    },
    {
      caseId: 'M2026051205',
      agentName: '林美玲', agentRegion: '南區',
      referrerName: '王小毅', referrerTag: '會員', referrerCid: 'U250310001',
      refereeName: '吳雅芳', refereePhone: '0955333222',
      caseType: 'negotiation',
      loanTypes: ['更生方案'],
      submitAt: '2026/05/12 16:30', payoutAt: '2026/05/13',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'rehabilitation', label: '更生方案', trigger: '需繳滿第三期服務費（第一期 ≥ $6,000 起算）', bonus: 2000 },
        ],
      },
      amount: 2000,
      payoutAmount: 1500000,
      status: 'rewardable',
      approvedAt: '2026/05/14 09:20',
      approvedBy: '財務 - Mary',
      approveNote: '已核對撥款單據，金額無誤',
      customerId: '2605130004',
      referrerListId: '2503100001',
      receipts: [{ suffix: 1, amount: 9000, note: '第一期已核對，請查核第二期金額' }, { suffix: 2, amount: 8000 }],
    },
    {
      caseId: 'M2026062401',
      agentName: '陳志明', agentRegion: '北區',
      referrerName: '趙雅琪', referrerTag: '會員', referrerCid: 'U241201008',
      refereeName: '楊志遠', refereePhone: '0912345678',
      caseType: 'general',
      loanTypes: ['房屋貸款', '汽車貸款', '信用貸款'],
      submitAt: '2026/06/24 09:30', payoutAt: '2026/06/24',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'house_loan',   label: '房屋貸款', trigger: '付訖服務費', bonus: 5000 },
          { projectKey: 'car_loan',     label: '汽車貸款', trigger: '付訖服務費', bonus: 1500 },
          { projectKey: 'credit_loan',  label: '信用貸款', trigger: '付訖服務費', bonus: 3600 },
        ],
      },
      amount: 10100,
      payoutAmount: 5200000,
      status: 'pending_approval',
      warningCodes: ['E-OVA', 'E-OVC'],
      customerId: '2606240001',
      referrerListId: '2412010008',
      receipts: [{ amount: 26000 }],
    },
    {
      caseId: 'M2026042016',
      agentName: '陳志明', agentRegion: '北區',
      referrerName: '林副總', referrerTag: '員工', referrerCid: 'U240214003',
      refereeName: '蘇建仁', refereePhone: '0977001122',
      caseType: 'general',
      loanTypes: ['信用貸款'],
      submitAt: '2026/04/20 09:00', payoutAt: '2026/04/22',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'credit_loan', label: '信用貸款', trigger: '付訖服務費',                                     bonus: 3600 },
        ],
      },
      amount: 3600,
      payoutAmount: 500000,
      status: 'rewardable',
      approvedAt: '2026/04/23 14:00',
      approvedBy: '財務 - John',
      approveNote: '',
      customerId: '2604200016',
      referrerListId: '2402140003',
      receipts: [{ amount: 8000 }],
    },
    {
      // 協商案件：累積達 $6,000（第三期啟動），但啟動後尚未再繳 2 期 → E-NEG 阻擋核款
      caseId: 'M2026062403',
      agentName: '李文強', agentRegion: '北區',
      referrerName: '彭俊豪', referrerTag: '會員', referrerCid: 'U240315008',
      refereeName: '鄭佳豪', refereePhone: '0922345678',
      caseType: 'negotiation',
      loanTypes: ['前置協商'],
      submitAt: '2026/06/22 10:15', payoutAt: '2026/06/23',
      campaignId: 'CAMP-C-2026Q2',
      snapshot: {
        campaignId: 'CAMP-C-2026Q2',
        overlapCapEnabled: true,
        overlapCap: 20000,
        items: [
          { projectKey: 'pre_negotiation', label: '前置協商', trigger: '啟動計算後再繳滿 2 期服務費', bonus: 2000 },
        ],
      },
      amount: 2000,
      payoutAmount: 800000,
      status: 'pending_approval',
      warningCodes: ['E-NEG'],
      customerId: '2606220003',
      referrerListId: '2403150008',
      receipts: [
        { suffix: 1, amount: 500  },
        { suffix: 2, amount: 500  },
        { suffix: 3, amount: 5000, note: '第三期，累積達 $6,000，啟動計算；尚需再繳 2 期方可核款' },
        // 啟動於第 3 期，目前僅已繳 3 期，仍需再繳第 4、5 期 → E-NEG
      ],
    },
  ];

  const STATUS_META = {
    pending_approval: { label: '待核款',  cls: 'status-pending_approval' },
    rewardable:       { label: '已核款',  cls: 'status-rewardable' },
    rejected:         { label: '已拒絕',  cls: 'status-invalid' },
  };

  const TAG_BADGE = { '會員': 'badge-purple', '員工': 'badge-green', '離職員工': 'badge-yellow' };

  let WARN_CODES = {};
  let REJECT_REASONS = [];

  function loadExpirySettings() {
    try {
      return {
        followupDays: +(localStorage.getItem('mgm_risk_followup_days') || '150'),
        noBankDays:   +(localStorage.getItem('mgm_risk_no_bank_days')  || '180'),
        withdrawDays: +(localStorage.getItem('mgm_risk_withdraw_days') || '30'),
      };
    } catch {
      return { followupDays: 150, noBankDays: 180, withdrawDays: 30 };
    }
  }

  function initExpiryDependencies() {
    const { followupDays, noBankDays, withdrawDays } = loadExpirySettings();

    let limitAmount, limitCount;
    try {
      limitAmount = localStorage.getItem('mgm_risk_limit_amount') || '50000';
      limitCount  = localStorage.getItem('mgm_risk_limit_count')  || '5';
    } catch {
      limitAmount = '50000';
      limitCount  = '5';
    }
    const ovaLabel = limitAmount === 'unlimited'
      ? '超過每月提領金額上限'
      : `超過每月提領金額上限（本月上限 $${Number(limitAmount).toLocaleString()}）`;
    const ovcLabel = limitCount === 'unlimited'
      ? '超過每月推薦件數上限'
      : `超過每月推薦件數上限（本月上限 ${limitCount} 件）`;

    WARN_CODES = {
      'E-120': { label: `後續案件超過 ${followupDays} 天紅利效期` },
      'E-NBK': { label: `獎金核發後超過 ${noBankDays} 天未填寫匯款資料` },
      'E-WDL': { label: `申請提領後超過 ${withdrawDays} 天仍未完成匯款` },
      'E-OLD': { label: '員工／離職員工推薦了「舊客戶」' },
      'E-BLK': { label: '帳號被列為黑名單' },
      'E-OVA': { label: ovaLabel },
      'E-OVC': { label: ovcLabel },
      'E-NEG': { label: '協商案件服務費未達核款條件（累積未到 $6,000 或啟動後不足兩期）' },
    };
    REJECT_REASONS = [
      { code: 'E-120', label: `後續案件超過 ${followupDays} 天紅利效期` },
      { code: 'E-NBK', label: `獎金核發後超過 ${noBankDays} 天未填寫匯款資料` },
      { code: 'E-WDL', label: `申請提領後超過 ${withdrawDays} 天仍未完成匯款` },
      { code: 'E-OLD', label: '員工／離職員工推薦了「舊客戶」' },
      { code: 'E-BLK', label: '帳號被列為黑名單' },
      { code: 'E-OVA', label: ovaLabel },
      { code: 'E-OVC', label: ovcLabel },
      { code: 'E-NEG', label: '協商案件服務費未達核款條件（累積未到 $6,000 或啟動後不足兩期）' },
      { code: 'OTHER', label: '其他（請輸入原因）' },
    ];
    const e150 = document.getElementById('legend-desc-e150');
    const eNbk = document.getElementById('legend-desc-enbk');
    const eWdl = document.getElementById('legend-desc-ewdl');
    const eOva = document.getElementById('legend-desc-eova');
    const eOvc = document.getElementById('legend-desc-eovc');
    if (e150) e150.textContent = `後續案件超過 ${followupDays} 天紅利效期`;
    if (eNbk) eNbk.textContent = `獎金核發後超過 ${noBankDays} 天未填寫匯款資料`;
    if (eWdl) eWdl.textContent = `申請提領後超過 ${withdrawDays} 天仍未完成匯款`;
    if (eOva) eOva.textContent = ovaLabel;
    if (eOvc) eOvc.textContent = ovcLabel;
  }

  const TYPE_META = {
    general:     { label: '一般貸款案件', cls: 'badge-blue' },
    negotiation: { label: '債務協商案件', cls: 'badge-orange' },
  };

  // 外部系統連結（上線前請替換為實際網址，末尾需可直接附加 ID / 單號）
  const EXT_RECEIPT_BASE_URL = '#receipt?no=';   // 收款單系統：EXT_RECEIPT_BASE_URL + 單號
  const EXT_MEMBER_BASE_URL  = '#member?id=';    // 名單系統：EXT_MEMBER_BASE_URL + yymmddXXXX

  const filters = { referrer: '', caseId: '', type: 'all', status: 'pending_approval', warningCode: 'all', region: 'all' };
  let selected = new Set();
  let currentCaseId = null;
  let rejectTargetId = null;

  // ─── helpers ──────────────────────────────────────────────
  function fmt(n) { return n == null ? '—' : '$' + Number(n).toLocaleString(); }

  function fmtDateYmd(str) {
    if (!str || str === '—') return '—';
    return String(str).split(' ')[0] || '—';
  }

  function receiptNoOf(r) {
    if (r.payoutAmount == null) return '—';
    const datePart = String(r.payoutAt || '').split(' ')[0].replace(/\//g, '');
    if (!/^\d{8}$/.test(datePart)) return '—';
    const seq4 = String(r.customerId || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
    return `I${datePart.slice(2)}${seq4}`;
  }

  function escAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildReceiptListHtml(r) {
    const base = receiptNoOf(r);
    if (base === '—') return '—';
    const items = Array.isArray(r.receipts) && r.receipts.length ? r.receipts : [{ amount: r.amount }];
    return '<div class="receipt-link-list">' + items.map((item) => {
      // 有支號：base-1 / base-2；無支號（單筆）：直接顯示 base
      const no = item.suffix != null ? base + '-' + item.suffix : base;
      const noteIcon = item.note
        ? '<span class="receipt-note-icon" title="備註：' + escAttr(item.note) + '"><i class="fa-solid fa-note-sticky"></i></span>'
        : '';
      return '<div class="receipt-link-item">' +
        '<a class="receipt-link" href="' + EXT_RECEIPT_BASE_URL + no + '" target="_blank" rel="noopener">' +
        '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px;"></i>' + no +
        '</a>' +
        noteIcon +
        '</div>';
    }).join('') + '</div>';
  }

  function renderWarnChips(codes) {
    if (!codes || !codes.length) return '';
    return codes.map((c) => `<span class="warn-chip">${c}</span>`).join('');
  }

  // ─── memo check ───────────────────────────────────────────
  function caseHasMemo(caseId) {
    try {
      const all = JSON.parse(localStorage.getItem('mgm_memos') || '{}');
      return (all['case_' + caseId] || []).length > 0;
    } catch { return false; }
  }

  // ─── filter ───────────────────────────────────────────────
  function getFiltered() {
    return CASES.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.type   !== 'all' && r.caseType !== filters.type)  return false;
      if (filters.region !== 'all' && r.agentRegion !== filters.region) return false;
      if (filters.referrer) {
        const k = filters.referrer.toLowerCase();
        if (!(r.referrerCid + ' ' + r.referrerName).toLowerCase().includes(k)) return false;
      }
      if (filters.caseId) {
        if (!r.caseId.toLowerCase().includes(filters.caseId.toLowerCase())) return false;
      }
      if (filters.warningCode !== 'all') {
        const hasCodes = r.warningCodes && r.warningCodes.length > 0;
        if (filters.warningCode === 'has_warn' && !hasCodes) return false;
        if (filters.warningCode === 'no_warn'  && hasCodes)  return false;
        if (!['has_warn', 'no_warn'].includes(filters.warningCode)) {
          if (!r.warningCodes || !r.warningCodes.includes(filters.warningCode)) return false;
        }
      }
      return true;
    });
  }

  function isBatchSelectable(r) { return r.status === 'pending_approval'; }

  // ─── render ───────────────────────────────────────────────
  function renderLoanTypeChips(r) {
    if (!r.loanTypes || !r.loanTypes.length) return '';
    return '<div class="loan-type-chips">' +
      r.loanTypes.map((t) => '<span class="loan-type-chip">' + t + '</span>').join('') +
      '</div>';
  }

  function renderRow(r) {
    const s = STATUS_META[r.status] || { label: r.status, cls: '' };
    const tagCls = TAG_BADGE[r.referrerTag] || 'badge-gray';
    const canCheck = isBatchSelectable(r);
    const checked = selected.has(r.caseId);
    const warnHtml = renderWarnChips(r.warningCodes);

    return `
      <tr data-id="${r.caseId}"${warnHtml ? ' class="has-warn-code"' : ''}>
        <td>${canCheck ? `<input type="checkbox" class="row-check" data-id="${r.caseId}" ${checked ? 'checked' : ''}>` : ''}</td>
        <td class="mono">${r.caseId}${renderLoanTypeChips(r)}</td>
        <td><strong>${r.referrerName}</strong></td>
        <td class="mono" style="font-size:12px;">${r.referrerCid}</td>
        <td>${r.referrerTag}</td>
        <td>${r.agentName || '—'}</td>
        <td>${r.agentRegion || '—'}</td>
        <td>${r.refereeName || '—'}</td>
        <td><span class="tag-pill ${(TYPE_META[r.caseType] || {}).cls || 'badge-gray'}">${(TYPE_META[r.caseType] || {}).label || '—'}</span></td>
        <td class="num money">${fmt(r.amount)}</td>
        <td>${buildReceiptListHtml(r)}</td>
        <td><span class="status-text ${s.cls}">${s.label}</span></td>
        <td>${warnHtml ? `<div class="warn-chips-row">${warnHtml}</div>` : '<span style="color:var(--color-text-muted);font-size:12px;">—</span>'}</td>
        <td>
          <button type="button" class="action-btn" data-act="view" data-id="${r.caseId}">
            <i class="fa-solid fa-eye"></i>查看
          </button>
          ${canCheck ? `
          <button type="button" class="action-btn approve" data-act="approve" data-id="${r.caseId}">
            <i class="fa-solid fa-circle-check"></i>核准
          </button>
          <button type="button" class="action-btn" style="color:var(--color-danger);" data-act="reject" data-id="${r.caseId}">
            <i class="fa-solid fa-circle-xmark"></i>拒絕
          </button>` : ''}
        </td>
      </tr>`;
  }

  function render() {
    const items = getFiltered();
    const tbody = document.getElementById('payout-tbody');
    tbody.innerHTML = items.length
      ? items.map(renderRow).join('')
      : '<tr><td colspan="14" style="padding:32px;text-align:center;color:var(--color-text-muted);">沒有符合條件的案件</td></tr>';

    const tc = document.getElementById('total-count');
    if (tc) tc.textContent = items.length;
    const pgc = document.getElementById('payout-pg-total');
    if (pgc) pgc.textContent = items.length;

    // KPI
    const pending  = CASES.filter((r) => r.status === 'pending_approval');
    const approved = CASES.filter((r) => r.status === 'rewardable');
    const rejected = CASES.filter((r) => r.status === 'rejected');
    document.getElementById('kpi-pending-count').textContent   = pending.length + ' 筆';
    document.getElementById('kpi-pending-amount').textContent  = '$' + pending.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString();
    document.getElementById('kpi-approved-count').textContent  = approved.length + ' 筆';
    document.getElementById('kpi-approved-amount').textContent = '$' + approved.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString();
    const rejEl = document.getElementById('kpi-rejected-count');
    if (rejEl) rejEl.textContent = rejected.length + ' 筆';

    // 本月已擋下/拒絕金額
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth() + 1;
    const thisMonthRejected = rejected.filter((r) => {
      if (!r.rejectedAt) return false;
      const m = String(r.rejectedAt).match(/^(\d{4})\/(\d{1,2})/);
      return m && +m[1] === curY && +m[2] === curM;
    });
    const rejAmtEl = document.getElementById('kpi-rejected-amount');
    if (rejAmtEl) rejAmtEl.textContent = '$' + thisMonthRejected.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString();

    // 累積待匯款總額（已核款但尚未實際匯出）
    const unpaidEl = document.getElementById('kpi-unpaid-amount');
    if (unpaidEl) unpaidEl.textContent = '$' + approved.reduce((s, r) => s + (r.amount || 0), 0).toLocaleString();

    bindRowActions();
    updateBatchBar();
  }

  // ─── approve ──────────────────────────────────────────────
  function doApprove(caseId, note) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r || r.status !== 'pending_approval') return false;
    const negCheck = checkNegotiationFeeCondition(r);
    if (!negCheck.ok) return false; // 應由呼叫端預先阻擋，此為防禦性判斷
    r.status = 'rewardable';
    r.approvedAt = new Date().toLocaleString('zh-TW');
    r.approvedBy = 'Admin User';
    r.approveNote = note || '';
    return true;
  }

  // ─── reject ───────────────────────────────────────────────
  function doReject(caseId, note) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r || r.status !== 'pending_approval') return;
    r.status = 'rejected';
    r.rejectedAt = new Date().toLocaleString('zh-TW');
    r.rejectedBy = 'Admin User';
    r.rejectNote  = note || '';
    // 寫入 localStorage，admin-pending-review 可讀取以顯示待維護案件
    try {
      const key = 'mgm_payout_rejected';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      const idx = cur.findIndex((x) => x.caseId === caseId);
      const entry = {
        caseId: r.caseId,
        referrerName: r.referrerName,
        referrerTag: r.referrerTag,
        referrerCid: r.referrerCid,
        amount: r.amount,
        rejectNote: note || '',
        rejectedAt: r.rejectedAt,
      };
      if (idx >= 0) cur[idx] = entry; else cur.push(entry);
      localStorage.setItem(key, JSON.stringify(cur));
    } catch {}
  }

  function warnConfirmMsg(r) {
    if (!r.warningCodes || !r.warningCodes.length) return '';
    const lines = r.warningCodes.map((c) => `  ${c}：${(WARN_CODES[c] || {}).label || c}`).join('\n');
    return `\n\n⚠ 系統警示（不建議核發）：\n${lines}\n`;
  }

  // ─── row actions ──────────────────────────────────────────
  function bindRowActions() {
    document.querySelectorAll('[data-act="view"]').forEach((btn) => {
      btn.addEventListener('click', () => openModal(btn.dataset.id));
    });
    document.querySelectorAll('[data-act="approve"]').forEach((btn) => {
      btn.addEventListener('click', () => approveCase(btn.dataset.id));
    });
    document.querySelectorAll('[data-act="reject"]').forEach((btn) => {
      btn.addEventListener('click', () => openRejectModal(btn.dataset.id));
    });
    document.querySelectorAll('.row-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        if (cb.checked) selected.add(cb.dataset.id);
        else selected.delete(cb.dataset.id);
        updateBatchBar();
      });
    });
  }

  // ─── batch ────────────────────────────────────────────────
  function updateBatchBar() {
    const bar = document.getElementById('batch-bar');
    if (selected.size === 0) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const items = [...selected].map((id) => CASES.find((r) => r.caseId === id)).filter(Boolean);
    const sum = items.reduce((s, r) => s + (r.amount || 0), 0);
    document.getElementById('batch-count').textContent = items.length;
    document.getElementById('batch-amount').textContent = '$' + sum.toLocaleString();
  }

  function bindBatchActions() {
    document.getElementById('btn-batch-approve').addEventListener('click', () => {
      if (selected.size === 0) return;
      const note = (document.getElementById('batch-note').value || '').trim();
      const ids = [...selected];

      // 分離 E-NEG 阻擋案件與可核款案件
      const blocked    = ids.filter((id) => { const r = CASES.find((x) => x.caseId === id); return r && !checkNegotiationFeeCondition(r).ok; });
      const approvable = ids.filter((id) => !blocked.includes(id));

      if (blocked.length > 0) {
        const lines = blocked.map((id) => {
          const r = CASES.find((x) => x.caseId === id);
          return `・${id}：${checkNegotiationFeeCondition(r).detail}`;
        }).join('\n');
        alert(`[E-NEG] 以下 ${blocked.length} 筆協商案件不符合核款條件，已跳過：\n${lines}`);
      }
      if (approvable.length === 0) return;
      if (!confirm(`確認批次核准 ${approvable.length} 筆案件獎金？\n核准後推薦人即可申請提領。`)) return;
      approvable.forEach((id) => doApprove(id, note));
      selected.clear();
      document.getElementById('batch-note').value = '';
      render();
      toast(`已批次核准 ${approvable.length} 筆案件，推薦人現可申請提領。`);
    });

    document.getElementById('btn-batch-reject').addEventListener('click', () => {
      if (selected.size === 0) return;
      const note = (document.getElementById('batch-note').value || '').trim();
      if (!note) { alert('請填寫拒絕原因後再執行批次拒絕。'); return; }
      if (!confirm(`確認批次拒絕 ${selected.size} 筆案件？`)) return;
      const ids = [...selected];
      ids.forEach((id) => doReject(id, note));
      selected.clear();
      document.getElementById('batch-note').value = '';
      render();
      toast(`已批次拒絕 ${ids.length} 筆案件。`, 'warning');
    });

    document.getElementById('btn-batch-cancel').addEventListener('click', () => {
      selected.clear();
      render();
    });
  }

  // ─── modal ────────────────────────────────────────────────
  function openModal(caseId) {
    currentCaseId = caseId;
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('pm-caseid',       r.caseId);
    set('pm-referrer',     r.referrerName);
    const refListLink = document.getElementById('pm-referrer-list-link');
    if (refListLink) {
      if (r.referrerListId) {
        refListLink.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px;"></i> ' + r.referrerListId;
        refListLink.href = EXT_MEMBER_BASE_URL + r.referrerListId;
        refListLink.hidden = false;
      } else {
        refListLink.hidden = true;
      }
    }
    set('pm-referrer-cid', r.referrerCid);
    set('pm-tag',          r.referrerTag);
    set('pm-agent-name',   r.agentName ? `${r.agentName}${r.agentRegion ? '（' + r.agentRegion + '）' : ''}` : '—');
    set('pm-case-type',    (TYPE_META[r.caseType] || {}).label || '—');
    set('pm-referee',       r.refereeName);
    set('pm-referee-phone', r.refereePhone || '—');
    set('pm-campaign',      r.campaignId || '—');
    const receiptListEl = document.getElementById('pm-receipt-no-list');
    if (receiptListEl) receiptListEl.innerHTML = buildReceiptListHtml(r);
    set('pm-amount',       fmt(r.amount));

    // 系統警示
    const warnSec = document.getElementById('pm-section-warning');
    const warnEl  = document.getElementById('pm-warning-codes');
    if (warnSec && warnEl) {
      if (r.warningCodes && r.warningCodes.length) {
        warnSec.hidden = false;
        warnEl.innerHTML = r.warningCodes.map((c) => {
          const info = WARN_CODES[c] || { label: c };
          return `<div class="warn-code-row"><span class="warn-chip">${c}</span><span class="warn-code-desc">${info.label}</span></div>`;
        }).join('');
      } else {
        warnSec.hidden = true;
      }
    }

    // 快照參數（matrix 格式：items[{ projectKey, label, trigger, bonus }]）
    const snapSec = document.getElementById('pm-section-snapshot');
    const snapEl  = document.getElementById('pm-snapshot');
    const snap = r.snapshot;
    if (snap && Array.isArray(snap.items) && snap.items.length) {
      snapSec.hidden = false;
      const lines = snap.items.map((x) =>
        `  ${x.label}（${x.trigger}）→ $${Number(x.bonus).toLocaleString()}`
      );
      const capLine = snap.overlapCapEnabled
        ? `多項疊加上限：$${Number(snap.overlapCap || 0).toLocaleString()}（啟用）`
        : '多項疊加上限：未啟用';
      const src = snap.campaignId ? `快照來源：${snap.campaignId}` : '快照來源：當期活動';
      snapEl.textContent = `觸發項目：\n${lines.join('\n')}\n${capLine}\n${src}`;
      snapEl.style.whiteSpace = 'pre-line';
    } else {
      snapSec.hidden = true;
    }

    // 核款紀錄
    const approvedSec = document.getElementById('pm-section-approved');
    if (r.status === 'rewardable' && r.approvedAt) {
      approvedSec.hidden = false;
      set('pm-approved-at',   r.approvedAt);
      set('pm-approved-by',   r.approvedBy || '—');
      set('pm-approve-note',  r.approveNote || '（無備註）');
    } else {
      approvedSec.hidden = true;
    }

    // 拒絕紀錄
    const rejectedSec = document.getElementById('pm-section-rejected');
    if (r.status === 'rejected' && r.rejectedAt) {
      rejectedSec.hidden = false;
      set('pm-rejected-at',  r.rejectedAt);
      set('pm-rejected-by',  r.rejectedBy || '—');
      set('pm-reject-note',  r.rejectNote || '（無備註）');
    } else {
      rejectedSec.hidden = true;
    }

    // 操作按鈕：僅待核款狀態顯示
    const isPending = r.status === 'pending_approval';
    const approveBtn = document.getElementById('btn-modal-approve');
    const rejectBtn  = document.getElementById('btn-modal-reject');
    if (approveBtn) approveBtn.hidden = !isPending;
    if (rejectBtn)  rejectBtn.hidden  = !isPending;

    const memoContainer = document.getElementById('memo-container-payout');
    if (memoContainer && typeof MemoManager !== 'undefined') {
      MemoManager.renderWidget(memoContainer, 'case', caseId, 'Admin User');
    }

    document.getElementById('payout-modal').hidden = false;
  }

  function closeModal() {
    document.getElementById('payout-modal').hidden = true;
    currentCaseId = null;
  }

  function bindModal() {
    const modal = document.getElementById('payout-modal');
    modal.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', closeModal)
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!modal.hidden) closeModal();
        if (!document.getElementById('reject-modal').hidden) closeRejectModal();
        if (!document.getElementById('code-legend-modal').hidden) closeCodeLegend();
      }
    });
    document.getElementById('btn-modal-approve').addEventListener('click', () => {
      if (!currentCaseId) return;
      const id = currentCaseId;
      closeModal();
      approveCase(id);
    });
    document.getElementById('btn-modal-reject').addEventListener('click', () => {
      if (!currentCaseId) return;
      closeModal();
      openRejectModal(currentCaseId);
    });
  }

  // ─── reject modal ─────────────────────────────────────────
  function openRejectModal(caseId) {
    rejectTargetId = caseId;
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r) return;
    document.getElementById('rj-caseid').textContent   = r.caseId;
    document.getElementById('rj-referrer').textContent = r.referrerName;
    document.getElementById('rj-amount').textContent   = fmt(r.amount);

    // 填充下拉選單，若有警示代碼則預選第一個
    const sel = document.getElementById('rj-reason-code');
    sel.innerHTML = '<option value="">-- 請選擇拒絕原因 --</option>';
    REJECT_REASONS.forEach((item) => {
      const opt = document.createElement('option');
      opt.value = item.code;
      opt.textContent = item.code !== 'OTHER' ? `[${item.code}] ${item.label}` : item.label;
      if (r.warningCodes && r.warningCodes.length && r.warningCodes[0] === item.code) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    });
    syncRejectNoteVisibility();

    document.getElementById('rj-note').value = '';
    document.getElementById('reject-modal').hidden = false;
    setTimeout(() => sel.focus(), 80);
  }

  function syncRejectNoteVisibility() {
    const sel = document.getElementById('rj-reason-code');
    const note = document.getElementById('rj-note');
    if (!sel || !note) return;
    note.style.display = sel.value === 'OTHER' ? '' : 'none';
  }

  function closeRejectModal() {
    document.getElementById('reject-modal').hidden = true;
    rejectTargetId = null;
  }

  function bindRejectModal() {
    document.getElementById('btn-reject-modal-close').addEventListener('click', closeRejectModal);
    document.getElementById('btn-reject-cancel').addEventListener('click', closeRejectModal);
    document.getElementById('reject-modal-backdrop').addEventListener('click', closeRejectModal);
    document.getElementById('rj-reason-code').addEventListener('change', syncRejectNoteVisibility);
    document.getElementById('btn-reject-confirm').addEventListener('click', () => {
      const sel = document.getElementById('rj-reason-code');
      const code = sel.value;
      if (!code) { alert('請選擇拒絕原因。'); return; }
      let note;
      if (code === 'OTHER') {
        note = (document.getElementById('rj-note').value || '').trim();
        if (!note) { alert('選擇「其他」時請輸入原因說明（必填）。'); return; }
      } else {
        const found = REJECT_REASONS.find((x) => x.code === code);
        note = `[${code}] ${found ? found.label : code}`;
      }
      if (!rejectTargetId) return;
      doReject(rejectTargetId, note);
      toast(`已拒絕案件 ${rejectTargetId}。`, 'warning');
      closeRejectModal();
      render();
    });
  }

  // ─── approve action（核款通知改由系統排程批次發送，非即時）──
  function approveCase(caseId) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r) return;

    // E-NEG：協商案件服務費未達核款條件，阻擋核款動作
    const negCheck = checkNegotiationFeeCondition(r);
    if (!negCheck.ok) {
      alert(`[E-NEG] 此協商案件目前無法核款\n\n${negCheck.detail}\n\n請等待客戶繳清後再執行核款。`);
      return;
    }

    if (!confirm(`確認核准案件 ${caseId} 的獎金 ${fmt(r.amount)}？${warnConfirmMsg(r)}\n核款通知將由系統排程批次發送給推薦人。`)) return;

    doApprove(caseId, '');
    toast(`已核准 ${caseId}，推薦人現可申請提領（核款通知將由系統排程發送）。`);
    render();
  }

  // ─── code legend modal ────────────────────────────────────
  function openCodeLegend() {
    document.getElementById('code-legend-modal').hidden = false;
  }

  function closeCodeLegend() {
    document.getElementById('code-legend-modal').hidden = true;
  }

  function bindCodeLegend() {
    const btn = document.getElementById('btn-code-legend');
    if (btn) btn.addEventListener('click', openCodeLegend);
    const closeBtn = document.getElementById('btn-code-legend-close');
    if (closeBtn) closeBtn.addEventListener('click', closeCodeLegend);
    const okBtn = document.getElementById('btn-code-legend-ok');
    if (okBtn) okBtn.addEventListener('click', closeCodeLegend);
    const backdrop = document.getElementById('code-legend-backdrop');
    if (backdrop) backdrop.addEventListener('click', closeCodeLegend);
  }

  // ─── filters ──────────────────────────────────────────────
  function bindFilters() {
    document.getElementById('btn-search').addEventListener('click', syncAndRender);
    ['f-type', 'f-status', 'f-warn-code', 'f-region'].forEach((id) =>
      document.getElementById(id).addEventListener('change', syncAndRender)
    );
    ['f-referrer', 'f-case-id'].forEach((id) =>
      document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') syncAndRender();
      })
    );
  }

  function syncAndRender() {
    filters.referrer     = document.getElementById('f-referrer').value.trim();
    filters.caseId       = document.getElementById('f-case-id').value.trim();
    filters.type         = document.getElementById('f-type').value;
    filters.status       = document.getElementById('f-status').value;
    filters.warningCode  = document.getElementById('f-warn-code').value;
    filters.region       = document.getElementById('f-region').value;
    selected.clear();
    render();
  }

  // ─── CSV 匯出 ──────────────────────────────────────────────
  function bindExport() {
    const btn = document.getElementById('btn-export-csv');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const items = getFiltered();
      if (items.length === 0) { alert('目前無資料可匯出'); return; }
      const header = ['案號','推薦人','會員編號','身份','負責業務','業務所屬單位地區','被推薦人','案件類型','計算獎金','狀態','系統警示代碼','核款時間','核款人員','核款備註','拒絕時間','拒絕人員','拒絕原因'];
      const rows = items.map((r) => {
        const s  = STATUS_META[r.status]?.label || r.status;
        const ct = TYPE_META[r.caseType]?.label || r.caseType || '';
        return [r.caseId, r.referrerName, r.referrerCid, r.referrerTag, r.agentName || '', r.agentRegion || '',
          r.refereeName, ct, r.amount ?? '', s,
          (r.warningCodes || []).join(';'),
          r.approvedAt || '', r.approvedBy || '', r.approveNote || '',
          r.rejectedAt || '', r.rejectedBy || '', r.rejectNote || ''];
      });
      const csvEsc = (v) => { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
      const csv = [header, ...rows].map((row) => row.map(csvEsc).join(',')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `payout_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    });
  }

  // ─── toast ────────────────────────────────────────────────
  function toast(msg, type) {
    const bg = type === 'warning' ? '#f59e0b' : '#10b981';
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
        'color:#fff;padding:12px 20px;border-radius:8px;' +
        'font-size:14px;z-index:9999;opacity:0;transition:opacity .2s;max-width:90%;';
      document.body.appendChild(t);
    }
    t.style.background = bg;
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => (t.style.opacity = '0'), 3000);
  }

  // ─── init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initExpiryDependencies();
    bindFilters();
    // 篩選收合 / 清除
    (function () {
      const btnToggle = document.getElementById('btn-toggle-advanced');
      const filterGrid = document.getElementById('filter-grid');
      if (btnToggle && filterGrid) {
        btnToggle.addEventListener('click', () => {
          const collapsed = filterGrid.classList.toggle('collapsed');
          btnToggle.innerHTML = collapsed
            ? '<i class="fa-solid fa-chevron-down"></i>展開篩選'
            : '<i class="fa-solid fa-chevron-up"></i>收合篩選';
        });
      }
      const btnClear = document.getElementById('btn-clear-filter');
      if (btnClear && filterGrid) {
        btnClear.addEventListener('click', () => {
          filterGrid.querySelectorAll('input').forEach((el) => (el.value = ''));
          filterGrid.querySelectorAll('select').forEach((el) => (el.selectedIndex = 0));
          const s = document.getElementById('btn-search');
          if (s) s.click();
        });
      }
    })();
    bindBatchActions();
    bindModal();
    bindRejectModal();
    bindExport();
    bindCodeLegend();
    render();
  });
})();
