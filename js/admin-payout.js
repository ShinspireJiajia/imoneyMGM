/* ==========================================================
   admin-payout.js - 推薦案件獎金核款
   會計人員核准 pending_approval 案件 → 推薦人即可申請提領
   ========================================================== */

(function () {
  'use strict';

  const CASES = [
    {
      caseId: 'M2026051504',
      agentName: '陳志明',
      referrerName: '李大華', referrerTag: '員工', referrerCid: 'U240105002',
      refereeName: '張家豪', refereePhone: '0933678111',
      caseType: 'general',
      loanTypes: ['房屋貸款', '汽車貸款'],
      submitAt: '2026/05/15 11:05', payoutAt: '2026/05/16',
      campaignId: 'CAMP-2026Q2',
      snapshot: {
        mode: 'additive',
        totalCap: 18000,
        items: [
          { projectLabel: '房屋貸款', base: 2000, ratio: 0.1, cap: 15000 },
          { projectLabel: '汽車貸款', base: 1000, ratio: 0.5, cap: 5000 },
        ],
      },
      amount: 18000,
      payoutAmount: 4500000,
      status: 'pending_approval',
      warningCodes: ['E-OLD', 'E-150'],
      customerId: '2605160003',
      referrerListId: '2401050002',
      // 多筆支號：房貸與車貸分別開立收款單
      receipts: [{ suffix: 1, amount: 6000 }, { suffix: 2, amount: 2000 }, { suffix: 3, amount: 10000 }],
    },
    {
      caseId: 'M2026052901',
      agentName: '林美玲',
      referrerName: '王小毅', referrerTag: '會員', referrerCid: 'U250310001',
      refereeName: '方家豪', refereePhone: '0912345789',
      caseType: 'negotiation',
      loanTypes: ['債務協商'],
      submitAt: '2026/05/29 10:00', payoutAt: '2026/05/30',
      campaignId: 'CAMP-2026Q2',
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 },
      amount: 5500,
      payoutAmount: 3500000,
      status: 'pending_approval',
      warningCodes: ['E-PAY'],
      customerId: '2605290001',
      referrerListId: '2503100001',
      // 單筆收款，無支號
      receipts: [{ amount: 5500 }],
    },
    {
      caseId: 'M2026053002',
      agentName: '張偉傑',
      referrerName: '葉文群', referrerTag: '會員', referrerCid: 'U230408009',
      refereeName: '陳怡君', refereePhone: '0966123456',
      caseType: 'general',
      loanTypes: ['房屋貸款'],
      submitAt: '2026/05/30 14:30', payoutAt: '2026/05/31',
      campaignId: 'CAMP-2026Q2',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      amount: 2500,
      payoutAmount: 300000,
      status: 'pending_approval',
      customerId: '2605300002',
      referrerListId: '2304080009',
      // 單筆收款，無支號
      receipts: [{ amount: 2500 }],
    },
    {
      caseId: 'M2026051205',
      agentName: '林美玲',
      referrerName: '王小毅', referrerTag: '會員', referrerCid: 'U250310001',
      refereeName: '吳雅芳', refereePhone: '0955333222',
      caseType: 'negotiation',
      loanTypes: ['債務協商'],
      submitAt: '2026/05/12 16:30', payoutAt: '2026/05/13',
      campaignId: 'CAMP-2026Q2',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      amount: 2500,
      payoutAmount: 300000,
      status: 'rewardable',
      approvedAt: '2026/05/14 09:20',
      approvedBy: '財務 - Mary',
      approveNote: '已核對撥款單據，金額無誤',
      customerId: '2605130004',
      referrerListId: '2503100001',
      // 多筆支號（分兩期收款）
      receipts: [{ suffix: 1, amount: 1500 }, { suffix: 2, amount: 1000 }],
    },
    {
      caseId: 'M2026042016',
      agentName: '陳志明',
      referrerName: '林副總', referrerTag: '員工', referrerCid: 'U240214003',
      refereeName: '蘇建仁', refereePhone: '0977001122',
      caseType: 'general',
      loanTypes: ['信用貸款'],
      submitAt: '2026/04/20 09:00', payoutAt: '2026/04/22',
      campaignId: 'CAMP-2026Q2',
      snapshot: { base: 500, ratio: 0, cap: 500 },
      amount: 500,
      payoutAmount: 200000,
      status: 'rewardable',
      approvedAt: '2026/04/23 14:00',
      approvedBy: '財務 - John',
      approveNote: '',
      customerId: '2604200016',
      referrerListId: '2402140003',
      // 單筆收款，無支號
      receipts: [{ amount: 500 }],
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
        followupDays:  +(localStorage.getItem('mgm_risk_followup_days')  || '150'),
        unclaimedDays: +(localStorage.getItem('mgm_risk_unclaimed_days') || '180'),
      };
    } catch {
      return { followupDays: 150, unclaimedDays: 180 };
    }
  }

  function initExpiryDependencies() {
    const { followupDays, unclaimedDays } = loadExpirySettings();
    WARN_CODES = {
      'E-150': { label: `後續案件超過 ${followupDays} 天紅利效期` },
      'E-180': { label: `獎金核發後超過 ${unclaimedDays} 天未提領` },
      'E-OLD': { label: '員工／離職員工推薦了「舊客戶」' },
      'E-BLK': { label: '帳號被列為黑名單' },
      'E-PAY': { label: '未達成案件生效的基本繳款條件' },
    };
    REJECT_REASONS = [
      { code: 'E-150', label: `後續案件超過 ${followupDays} 天紅利效期` },
      { code: 'E-180', label: `獎金核發後超過 ${unclaimedDays} 天未提領` },
      { code: 'E-OLD', label: '員工／離職員工推薦了「舊客戶」' },
      { code: 'E-BLK', label: '帳號被列為黑名單' },
      { code: 'E-PAY', label: '未達成案件生效的基本繳款條件' },
      { code: 'OTHER', label: '其他（請輸入原因）' },
    ];
    const e150 = document.getElementById('legend-desc-e150');
    const e180 = document.getElementById('legend-desc-e180');
    if (e150) e150.textContent = `後續案件超過 ${followupDays} 天紅利效期`;
    if (e180) e180.textContent = `獎金核發後超過 ${unclaimedDays} 天未提領`;
  }

  const TYPE_META = {
    general:     { label: '一般貸款案件', cls: 'badge-blue' },
    negotiation: { label: '債務協商案件', cls: 'badge-orange' },
  };

  const CLAIM_URL = 'https://mgm.shinda.com.tw/';
  // 外部系統連結（上線前請替換為實際網址，末尾需可直接附加 ID / 單號）
  const EXT_RECEIPT_BASE_URL = '#receipt?no=';   // 收款單系統：EXT_RECEIPT_BASE_URL + 單號
  const EXT_MEMBER_BASE_URL  = '#member?id=';    // 名單系統：EXT_MEMBER_BASE_URL + yymmddXXXX

  const filters = { referrer: '', caseId: '', type: 'all', status: 'pending_approval', warningCode: 'all' };
  let selected = new Set();
  let currentCaseId = null;
  let rejectTargetId = null;
  let notifyCaseId = null;

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

  function buildReceiptListHtml(r) {
    const base = receiptNoOf(r);
    if (base === '—') return '—';
    const items = Array.isArray(r.receipts) && r.receipts.length ? r.receipts : [{ amount: r.amount }];
    return '<div class="receipt-link-list">' + items.map((item) => {
      // 有支號：base-1 / base-2；無支號（單筆）：直接顯示 base
      const no = item.suffix != null ? base + '-' + item.suffix : base;
      return '<div class="receipt-link-item">' +
        '<a class="receipt-link" href="' + EXT_RECEIPT_BASE_URL + no + '" target="_blank" rel="noopener">' +
        '<i class="fa-solid fa-arrow-up-right-from-square" style="font-size:9px;"></i>' + no +
        '</a>' +
        '</div>';
    }).join('') + '</div>';
  }

  function renderWarnChips(codes) {
    if (!codes || !codes.length) return '';
    return codes.map((c) => `<span class="warn-chip">${c}</span>`).join('');
  }

  // ─── filter ───────────────────────────────────────────────
  function getFiltered() {
    return CASES.filter((r) => {
      if (filters.status !== 'all' && r.status !== filters.status) return false;
      if (filters.type   !== 'all' && r.caseType !== filters.type)  return false;
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
      : '<tr><td colspan="12" style="padding:32px;text-align:center;color:var(--color-text-muted);">沒有符合條件的案件</td></tr>';

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

    bindRowActions();
    updateBatchBar();
  }

  // ─── approve ──────────────────────────────────────────────
  function doApprove(caseId, note) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r || r.status !== 'pending_approval') return;
    r.status = 'rewardable';
    r.approvedAt = new Date().toLocaleString('zh-TW');
    r.approvedBy = 'Admin User';
    r.approveNote = note || '';
  }

  // ─── reject ───────────────────────────────────────────────
  function doReject(caseId, note) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r || r.status !== 'pending_approval') return;
    r.status = 'rejected';
    r.rejectedAt = new Date().toLocaleString('zh-TW');
    r.rejectedBy = 'Admin User';
    r.rejectNote  = note || '';
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
      btn.addEventListener('click', () => openNotifyModal(btn.dataset.id));
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
      if (!confirm(`確認批次核准 ${selected.size} 筆案件獎金？\n核准後推薦人即可申請提領。`)) return;
      const ids = [...selected];
      ids.forEach((id) => doApprove(id, note));
      selected.clear();
      document.getElementById('batch-note').value = '';
      render();
      toast(`已批次核准 ${ids.length} 筆案件，推薦人現可申請提領。`);
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
    set('pm-agent-name',   r.agentName || '—');
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

    // 快照參數
    const snapSec = document.getElementById('pm-section-snapshot');
    const snapEl  = document.getElementById('pm-snapshot');
    const snap = r.snapshot;
    if (snap && (Array.isArray(snap.items) || snap.base != null)) {
      snapSec.hidden = false;
      if (Array.isArray(snap.items)) {
        const lines = snap.items.map((x) =>
          `- ${x.projectLabel}：底包 $${x.base.toLocaleString()} ／ 比例 ${x.ratio}% ／ 單筆上限 $${x.cap.toLocaleString()}`
        );
        const capLine = snap.totalCap != null ? `\n組合總上限：$${snap.totalCap.toLocaleString()}` : '';
        snapEl.textContent = `疊加制快照：\n${lines.join('\n')}${capLine}\n快照來源：當期活動`;
      } else {
        snapEl.textContent = `固定底包 $${(snap.base || 0).toLocaleString()} ／ 抽成比例 ${snap.ratio || 0}% ／ 單筆上限 $${(snap.cap || 0).toLocaleString()}\n快照來源：當期活動`;
      }
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
      openNotifyModal(id);
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

  // ─── notify modal ─────────────────────────────────────────
  function buildLineMsg() {
    return `您的推薦獎金已核發！請至：${CLAIM_URL}`;
  }
  function buildSmsMsg(r) {
    return `【理財通MGM】您好，${r.referrerName}，您的推薦案件 ${r.caseId} 獎金 ${fmt(r.amount)} 已核准，請登入系統提領：${CLAIM_URL}`;
  }

  function syncNotifyPanel() {
    const method = document.querySelector('input[name="notify-method"]:checked')?.value || 'sms';
    document.getElementById('notify-panel-sms').hidden  = method !== 'sms';
    document.getElementById('notify-panel-line').hidden = method !== 'line';
    document.getElementById('label-method-sms').classList.toggle('active', method === 'sms');
    document.getElementById('label-method-line').classList.toggle('active', method === 'line');
  }

  function updateLineCounter() {
    const ta = document.getElementById('notify-line-content');
    const counter = document.getElementById('notify-line-counter');
    if (!ta || !counter) return;
    const len = ta.value.length;
    counter.textContent = `${len} / 50`;
    counter.className = 'notify-char-count' + (len > 50 ? ' over' : len >= 45 ? ' warn' : '');
  }

  function openNotifyModal(caseId) {
    const r = CASES.find((x) => x.caseId === caseId);
    if (!r) return;
    notifyCaseId = caseId;

    document.getElementById('notify-caseid').textContent   = r.caseId;
    document.getElementById('notify-referrer').textContent = r.referrerName;
    document.getElementById('notify-amount').textContent   = fmt(r.amount);

    document.getElementById('notify-line-content').value = buildLineMsg();
    document.getElementById('notify-sms-content').value  = buildSmsMsg(r);

    const warnBar  = document.getElementById('notify-warn-bar');
    const warnText = document.getElementById('notify-warn-text');
    if (r.warningCodes && r.warningCodes.length) {
      warnBar.hidden = false;
      warnText.textContent = `此案件含系統警示（${r.warningCodes.join('、')}），請確認核款意願後再發送。`;
    } else {
      warnBar.hidden = true;
    }

    document.querySelector('input[name="notify-method"][value="sms"]').checked = true;
    syncNotifyPanel();
    updateLineCounter();
    document.getElementById('notify-modal').hidden = false;
  }

  function closeNotifyModal() {
    document.getElementById('notify-modal').hidden = true;
    notifyCaseId = null;
  }

  function bindNotifyModal() {
    document.getElementById('btn-notify-close').addEventListener('click', closeNotifyModal);
    document.getElementById('notify-backdrop').addEventListener('click', closeNotifyModal);

    document.querySelectorAll('input[name="notify-method"]').forEach((radio) => {
      radio.addEventListener('change', syncNotifyPanel);
    });
    document.getElementById('notify-line-content').addEventListener('input', updateLineCounter);

    document.getElementById('btn-notify-send').addEventListener('click', () => {
      if (!notifyCaseId) return;
      const method = document.querySelector('input[name="notify-method"]:checked')?.value || 'sms';
      if (method === 'line') {
        const len = document.getElementById('notify-line-content').value.length;
        if (len > 50) { alert('LINE 推播訊息超過 50 字，請縮短後再發送。'); return; }
      }
      const r = CASES.find((x) => x.caseId === notifyCaseId);
      doApprove(notifyCaseId, '');
      const methodLabel = method === 'line' ? 'LINE 推播' : '簡訊';
      toast(`已核款並發送 ${methodLabel} 通知給 ${r ? r.referrerName : notifyCaseId}。`);
      closeNotifyModal();
      render();
    });

    document.getElementById('btn-notify-skip').addEventListener('click', () => {
      if (!notifyCaseId) return;
      doApprove(notifyCaseId, '');
      toast(`已核准 ${notifyCaseId}，推薦人現可申請提領。`);
      closeNotifyModal();
      render();
    });
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
    ['f-type', 'f-status', 'f-warn-code'].forEach((id) =>
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
      const header = ['案號','推薦人','會員編號','身份','負責業務','被推薦人','案件類型','計算獎金','狀態','系統警示代碼','核款時間','核款人員','核款備註','拒絕時間','拒絕人員','拒絕原因'];
      const rows = items.map((r) => {
        const s  = STATUS_META[r.status]?.label || r.status;
        const ct = TYPE_META[r.caseType]?.label || r.caseType || '';
        return [r.caseId, r.referrerName, r.referrerCid, r.referrerTag, r.agentName || '',
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
    bindNotifyModal();
    bindExport();
    bindCodeLegend();
    render();
  });
})();
