/* ==========================================================
   rewards.js - 獎金清單與多筆勾選提領
   ========================================================== */

(function () {
  'use strict';

  // 獎金項目 demo - 新增 4 種提領狀態（依需求十三）
  // rewardable: 可勾選提領
  // transferring: 已申請匯款，財務處理中
  // transferred: 已匯款完成
  // pending_pickup: 已申請現場領取，待用戶到櫃
  // picked_up: 已現場領取完成
  //
  // 共用資料源（MGMCommon.getRewardsDemo）— dashboard 也讀同一份做總覽計算
  const REWARDS = (window.MGMCommon && window.MGMCommon.getRewardsDemo)
    ? window.MGMCommon.getRewardsDemo()
    : [];

  // 狀態元資料（B1：以 MGMCommon.STATUS_MAP 為共用基礎，再補本頁需要的 icon/tone）
  const STATUS_EXTRA = {
    rewardable:     { icon: 'fa-circle-check',    cls: 'badge-green',  tone: 'green' },
    pending_review: { icon: 'fa-lock',            cls: 'badge-yellow', tone: 'yellow' },
    transferring:   { icon: 'fa-hourglass-half',  cls: 'badge-blue',   tone: 'blue' },
    transferred:    { icon: 'fa-circle-check',    cls: 'badge-purple', tone: 'purple' },
    pending_pickup:  { icon: 'fa-store',             cls: 'badge-yellow', tone: 'yellow' },
    picked_up:       { icon: 'fa-handshake',         cls: 'badge-purple', tone: 'purple' },
    transfer_failed: { icon: 'fa-circle-exclamation', cls: 'badge-red',    tone: 'red' },
  };
  function statusMeta(status) {
    const base = (window.MGMCommon && window.MGMCommon.STATUS_MAP && window.MGMCommon.STATUS_MAP[status]) || {};
    const extra = STATUS_EXTRA[status] || {};
    return Object.assign({ label: status, badge: 'badge-gray' }, base, extra);
  }
  const STATUS_META = new Proxy({}, { get: (_, k) => statusMeta(k) });

  // === A5：載入時套用 withdrawal 寫回之狀態升級 ===
  // 已由 MGMCommon.getRewardsDemo() 統一處理（讀 localStorage.mgm_pending_withdraw_apply
  // 並升級狀態），本頁不需再次套用，避免兩次升級不一致。

  // 各狀態下方說明文字（依需求十三）
  function buildStatusHint(r) {
    switch (r.status) {
      case 'rewardable': {
        return '此筆獎金已可提領，請完成資料填寫後送出申請。';
      }
      case 'pending_review':
        return '此筆獎金因帳號被列入控管，需經人工放行後方可提領，請耐心等候。';
      case 'transferring': {
        const payoutPart = r.expectedPayoutAt
          ? `預計撥款日 ${formatDateYmdSlash(r.expectedPayoutAt)}，` : '';
        return `已收到您的申請，${payoutPart}款項將匯入您的指定帳戶：${r.bankName}（末四碼 ${r.bankLast4}）。`;
      }
      case 'transferred':
        return '';
      case 'pending_pickup':
        if (r.appointmentDate) {
          const d = formatDateYmdSlash(r.appointmentDate);
          const hours = r.appointmentHours || '依預約時段';
          return `已預約 ${d}（${hours}）至【${r.branch}】現場簽收，請攜帶身分證件。`;
        }
        return `請攜帶身分證件至【${r.branch}】依預約時段簽收領取。`;
      case 'picked_up':
        return '';
      case 'transfer_failed': {
        const reason = r.failReason ? `（原因：${r.failReason}）` : '';
        return `您的提領帳戶資料有誤${reason}，款項已退回。請點擊下方「重新填寫提領資料」按鈕，更正帳戶資訊後重新送出申請。`;
      }
      default:
        return '';
    }
  }

  // 篩選條件狀態（預設「全部」）
  // filterState = 已套用（驅動清單渲染）；pendingFilterState = popup 內暫存（按下「查詢」才寫回）
  const filterState = {
    status: 'all',        // all | rewardable | applying | paid
    method: 'all',        // all | transfer | cash
    dateFrom: '',         // yyyy-mm-dd
    dateTo: '',           // yyyy-mm-dd
    quick: '',            // '' | '7' | '30' | '90'
  };

  const pendingFilterState = { ...filterState };

  const STATUS_LABEL = {
    all: '全部',
    rewardable: '尚未提領',
    applying: '申請中',
    paid: '已撥款',
  };

  const METHOD_LABEL = {
    all: '全部',
    transfer: '銀行匯款',
    cash: '現場領取',
  };

  function fmt(n) {
    return n.toLocaleString();
  }

  function isFrozen(r) {
    return r.status === 'pending_review';
  }

  function canWithdrawNow(r) {
    if (window.MGMCommon && window.MGMCommon.canRewardBeWithdrawn) {
      return window.MGMCommon.canRewardBeWithdrawn(r);
    }
    return r.status === 'rewardable';
  }

  function isSelectable(r) {
    return canWithdrawNow(r);
  }

  function isCompleted(r) {
    return r.status === 'transferred' || r.status === 'picked_up';
  }

  function syncWithdrawBarOffset() {
    const bar = document.querySelector('.withdraw-bar');
    const rewardsRoot = document.querySelector('.rewards');
    if (!bar || !rewardsRoot) return;
    const height = Math.ceil(bar.getBoundingClientRect().height || 0);
    const reserve = Math.max(120, height + 12);
    rewardsRoot.style.setProperty('--withdraw-bar-offset', reserve + 'px');
  }

  function bindRewardPolicyToggle() {
    const toggleBtn = document.getElementById('btn-reward-policy-toggle');
    const panel = document.getElementById('reward-policy-panel');
    if (!toggleBtn || !panel) return;

    toggleBtn.addEventListener('click', () => {
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
      panel.hidden = isExpanded;
    });
  }

  function isApplying(r) {
    return r.status === 'transferring' || r.status === 'pending_pickup' || r.status === 'transfer_failed';
  }

  function isTransferFailed(r) {
    return r.status === 'transfer_failed';
  }

  const TRANSFER_FEE = 30;

  function getWithdrawalFee(rewards) {
    const first = rewards && rewards[0];
    return (first && first.method === 'transfer') ? TRANSFER_FEE : 0;
  }

  function groupRewardsByWithdrawal(rewards) {
    const groups = {};
    const ungrouped = [];
    rewards.forEach((r) => {
      if (r.withdrawalId) {
        if (!groups[r.withdrawalId]) groups[r.withdrawalId] = [];
        groups[r.withdrawalId].push(r);
      } else {
        ungrouped.push(r);
      }
    });
    return { groups, ungrouped };
  }

  function renderWithdrawalGroup(wdId, rewards) {
    if (!rewards || rewards.length === 0) return '';
    const first = rewards[0];
    const meta = STATUS_META[first.status];
    const fee = getWithdrawalFee(rewards);
    const totalAmount = rewards.reduce((s, r) => s + (r.amount || 0), 0);
    const netAmount = totalAmount - fee;

    const statusBadge = `<span class="badge ${meta.cls}"><i class="fa-solid ${meta.icon}"></i> ${meta.label}</span>`;

    const methodLine = first.method === 'transfer'
      ? (first.bankName ? `匯款 — ${first.bankName}（末四碼 ${first.bankLast4 || '—'}）` : '銀行匯款')
      : (first.branch ? `現場領取 —【${first.branch}】` : '現場領取');

    const itemLines = rewards.map((r) => `
      <div class="wd-group-item">
        <span class="wd-group-item-name">${r.name}</span>
        <span class="wd-group-item-amount">$${fmt(r.amount)}</span>
      </div>`).join('');

    let editBtnHtml = '';
    const canEdit = rewards.some((r) => isApplying(r));
    if (canEdit) {
      if (first.status === 'pending_pickup' && rewards.every((r) => !canModifyPickup(r))) {
        editBtnHtml = `<div class="reward-contact-hint">
          <i class="fa-solid fa-headset"></i>預約日期即將到來，如需變更請聯繫專員協助
        </div>`;
      } else {
        const urgent = rewards.some(isTransferFailed);
        const label = urgent ? '重新填寫提領資料' : '修改提領資料';
        editBtnHtml = `<button type="button" class="reward-edit-btn${urgent ? ' reward-edit-btn-urgent' : ''}" data-edit-id="${first.id}">
          <i class="fa-solid fa-pen-to-square"></i>${label}
        </button>`;
      }
    }

    return `
      <article class="reward-item reward-item-group status-${first.status}" data-wd="${wdId}">
        <div class="wd-group-id"><i class="fa-solid fa-layer-group"></i> ${wdId} ${statusBadge}</div>
        <div class="wd-group-items">${itemLines}</div>
        ${fee > 0 ? `
        <div class="wd-group-fee-row">
          <span>匯款手續費</span><span class="wd-group-fee">-$${fmt(fee)}</span>
        </div>` : ''}
        <div class="wd-group-net-row">
          <span>${fee > 0 ? '實際撥款金額' : '撥款金額'}</span><span class="wd-group-net">$${fmt(netAmount)}</span>
        </div>
        <div class="wd-group-method">${methodLine}</div>
        ${editBtnHtml}
      </article>`;
  }

  // 取得撥款日期（已撥款的紀錄）
  function getPayoutDate(r) {
    if (r.status === 'transferred') return r.transferredAt;
    if (r.status === 'picked_up') return r.pickedUpAt;
    return '';
  }

  // 日期格式統一顯示為 yyyy/mm/dd
  function formatDateYmdSlash(value) {
    if (!value) return '';
    const d = parseDate(value);
    if (!d) return String(value).replace(/-/g, '/');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  // 「yyyy/mm/dd」或「yyyy-mm-dd」→ Date
  function parseDate(s) {
    if (!s) return null;

    if (s instanceof Date) {
      return isNaN(s.getTime()) ? null : new Date(s.getTime());
    }

    if (typeof s === 'number') {
      const fromTs = new Date(s);
      return isNaN(fromTs.getTime()) ? null : fromTs;
    }

    const norm = String(s).replace(/\//g, '-');
    const d = new Date(norm);
    return isNaN(d.getTime()) ? null : d;
  }

  function shiftToBusinessDay(date) {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // 計算今天距離 appointmentDate 還有幾個工作天
  function businessDaysUntil(appointmentDate) {
    const d = parseDate(appointmentDate);
    if (!d) return Infinity;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    if (d <= today) return 0;
    let count = 0;
    const cursor = new Date(today);
    while (cursor < d) {
      cursor.setDate(cursor.getDate() + 1);
      if (cursor.getDay() !== 0 && cursor.getDay() !== 6) count++;
    }
    return count;
  }

  // 現場提領：預約日期超過 3 個工作天才允許用戶自行變更
  function canModifyPickup(r) {
    if (r.status !== 'pending_pickup') return true;
    if (!r.appointmentDate) return true;
    return businessDaysUntil(r.appointmentDate) > 3;
  }

  // 可提領效期規則：案件達成月份次月 25 日核款（遇假日順延），次日起算 180 天內可提領
  function getRewardableValidity(r) {
    if (window.MGMCommon && window.MGMCommon.getRewardableWindow) {
      return window.MGMCommon.getRewardableWindow(r);
    }
    if (!r || r.status !== 'rewardable') return null;
    const caseMonthDate = parseDate(r.payoutAt);
    if (!caseMonthDate) return null;

    const settlementDate = shiftToBusinessDay(
      new Date(caseMonthDate.getFullYear(), caseMonthDate.getMonth() + 1, 25)
    );
    const validFrom = new Date(settlementDate);
    validFrom.setDate(validFrom.getDate() + 1);

    const validTo = new Date(settlementDate);
    validTo.setDate(validTo.getDate() + 180);

    return { settlementDate, validFrom, validTo };
  }

  // 套用篩選後的清單
  function getFilteredRewards() {
    return REWARDS.filter((r) => {
      // 狀態
      if (filterState.status === 'rewardable' && !isSelectable(r)) return false;
      if (filterState.status === 'applying' && !isApplying(r)) return false;
      if (filterState.status === 'paid' && !isCompleted(r)) return false;

      // 撥款方式（僅 applying / paid 有 method）
      if (
        (filterState.status === 'applying' || filterState.status === 'paid') &&
        filterState.method !== 'all'
      ) {
        if (r.method !== filterState.method) return false;
      }

      // 撥款日期（僅 paid）
      if (filterState.status === 'paid') {
        const payDate = parseDate(getPayoutDate(r));
        if (filterState.dateFrom) {
          const from = parseDate(filterState.dateFrom);
          if (payDate && from && payDate < from) return false;
        }
        if (filterState.dateTo) {
          const to = parseDate(filterState.dateTo);
          if (payDate && to) {
            // 加一天讓 to 含當天
            const toEnd = new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1);
            if (payDate > toEnd) return false;
          }
        }
      }

      return true;
    });
  }

  // 取得清單上可選的總金額
  function selectableTotal() {
    return REWARDS.filter(isSelectable).reduce((s, r) => s + r.amount, 0);
  }

  // 渲染卡片（不再提供逐筆勾選；可提領狀態下統一全部提領）
  function renderItem(r) {
    const meta = STATUS_META[r.status];
    const hint = buildStatusHint(r);
    const validity = getRewardableValidity(r);

    const statusBadge = `<span class="badge ${meta.cls}"><i class="fa-solid ${meta.icon}"></i> ${meta.label}</span>`;

    const hintHtml = hint
      ? `<div class="reward-status-hint tone-${meta.tone}">
           <i class="fa-solid fa-circle-info"></i>
           <span>${hint}</span>
         </div>`
      : '';

    // 僅已完成（匯款完成／現場領取完成）才顯示撥款日期
    const payoutDate = getPayoutDate(r);
    const payoutLine = payoutDate
      ? `<div class="reward-item-meta"><span class="meta-label">實際撥款日</span><span class="meta-value">${payoutDate}</span></div>`
      : '';

    const expectedPayoutDate = (r.status === 'transferring' && r.method === 'transfer')
      ? formatDateYmdSlash(r.expectedPayoutAt || r.estimatedPayoutAt || r.payoutAt)
      : '';
    const expectedPayoutLine = expectedPayoutDate
      ? `<div class="reward-item-meta"><span class="meta-label">預計撥款日</span><span class="meta-value">${expectedPayoutDate}</span></div>`
      : '';

    const validityLine = validity
      ? `<div class="reward-item-meta"><span class="meta-label">可提領效期</span><span class="meta-value">${formatDateYmdSlash(validity.validFrom)} ~ ${formatDateYmdSlash(validity.validTo)}</span></div>`
      : '';

    let editBtnHtml = '';
    if (isApplying(r)) {
      if (r.status === 'pending_pickup' && !canModifyPickup(r)) {
        editBtnHtml = `<div class="reward-contact-hint">
          <i class="fa-solid fa-headset"></i>預約日期即將到來，如需變更請聯繫專員協助
        </div>`;
      } else {
        const editBtnLabel = isTransferFailed(r) ? '重新填寫提領資料' : '修改提領資料';
        editBtnHtml = `<button type="button" class="reward-edit-btn${isTransferFailed(r) ? ' reward-edit-btn-urgent' : ''}" data-edit-id="${r.id}">
          <i class="fa-solid fa-pen-to-square"></i>${editBtnLabel}
        </button>`;
      }
    }

    return `
      <article class="reward-item status-${r.status}" data-id="${r.id}">
        <div class="reward-item-body">
          <div class="reward-item-row1">${r.name} ${statusBadge}</div>
          ${validityLine}
          ${expectedPayoutLine}
          ${payoutLine}
          ${hintHtml}
          ${editBtnHtml}
        </div>
        <div class="reward-item-amount">
          $${fmt(r.amount)}
        </div>
      </article>`;
  }

  function render() {
    const list = document.getElementById('reward-list');
    const emptyEl = document.getElementById('reward-empty');
    const filtered = getFilteredRewards();

    const rewardable = filtered.filter(isSelectable);
    const frozen = filtered.filter(isFrozen);
    const failed = filtered.filter(isTransferFailed);
    const processing = filtered.filter((r) => isApplying(r) && !isTransferFailed(r));
    const completed = filtered.filter(isCompleted);

    let html = '';
    if (failed.length) {
      html += '<h4 class="reward-section-heading reward-section-failed"><i class="fa-solid fa-circle-exclamation"></i>提領失敗 — 需要處理</h4>';
      html += failed.map(renderItem).join('');
    }
    if (frozen.length) {
      html += '<h4 class="reward-section-heading reward-section-frozen"><i class="fa-solid fa-lock"></i>待人工放行</h4>';
      html += frozen.map(renderItem).join('');
    }
    if (rewardable.length) {
      html += '<h4 class="reward-section-heading">可提領</h4>';
      html += rewardable.map(renderItem).join('');
    }
    if (processing.length) {
      const pickupUpcoming   = processing.filter((r) => r.status === 'pending_pickup' && !canModifyPickup(r));
      const pickupModifiable = processing.filter((r) => r.status === 'pending_pickup' && canModifyPickup(r));
      const transferring     = processing.filter((r) => r.status === 'transferring');

      const renderGroupedSection = (items) => {
        const { groups, ungrouped } = groupRewardsByWithdrawal(items);
        let s = '';
        Object.entries(groups).forEach(([wdId, rs]) => { s += renderWithdrawalGroup(wdId, rs); });
        ungrouped.forEach((r) => { s += renderItem(r); });
        return s;
      };

      if (pickupUpcoming.length) {
        html += '<h4 class="reward-section-heading reward-section-processing"><i class="fa-solid fa-calendar-check"></i>處理中 — 即將到來的現場預約</h4>';
        html += renderGroupedSection(pickupUpcoming);
      }
      if (pickupModifiable.length) {
        html += '<h4 class="reward-section-heading reward-section-processing"><i class="fa-solid fa-calendar-pen"></i>處理中 — 可以變更的現場預約</h4>';
        html += renderGroupedSection(pickupModifiable);
      }
      if (transferring.length) {
        html += '<h4 class="reward-section-heading reward-section-processing"><i class="fa-solid fa-paper-plane"></i>處理中 — 待匯款</h4>';
        html += renderGroupedSection(transferring);
      }
    }
    if (completed.length) {
      html += '<h4 class="reward-section-heading">已完成</h4>';
      const { groups: cmpGroups, ungrouped: cmpUngrouped } = groupRewardsByWithdrawal(completed);
      Object.entries(cmpGroups).forEach(([wdId, rs]) => { html += renderWithdrawalGroup(wdId, rs); });
      cmpUngrouped.forEach((r) => { html += renderItem(r); });
    }
    list.innerHTML = html;

    // 空狀態切換（依目前篩選條件顯示對應提示）
    const hasResult = filtered.length > 0;
    if (emptyEl) {
      emptyEl.hidden = hasResult;
      list.style.display = hasResult ? '' : 'none';
      if (!hasResult) updateEmptyMessage(emptyEl);
    }

    updateBar();
    updateOverview();
    updateFilterCounts();
    updateMonthProgress();
  }

  // 依 filterState 產生對應的空狀態文案
  function updateEmptyMessage(el) {
    const hasAdvanced =
      filterState.method !== 'all' ||
      filterState.dateFrom ||
      filterState.dateTo;

    const STATUS_EMPTY = {
      all: { title: '目前沒有任何獎金紀錄', desc: '當有親友透過您的連結成功送單，獎金紀錄會出現在這裡。' },
      rewardable: { title: '目前沒有可提領的獎金', desc: '獎金需經會計線下核對並確認獲獎資格後，才會顯示在此分類。' },
      applying: { title: '目前沒有申請中的提領', desc: '尚未送出任何提領申請，可從「尚未提領」清單發起。' },
      paid: { title: '目前沒有已撥款的紀錄', desc: '完成匯款或現場領取後，紀錄會顯示在此分類。' },
    };

    const base = STATUS_EMPTY[filterState.status] || STATUS_EMPTY.all;
    const title = hasAdvanced ? '沒有符合條件的獎金' : base.title;
    const desc = hasAdvanced
      ? '請調整或重設條件後再試一次。'
      : base.desc;

    const titleEl = el.querySelector('.empty-title');
    const descEl = el.querySelector('.empty-desc');
    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;
  }

  // 更新頁籤上的數量
  function updateFilterCounts() {
    const set = (id, n) => {
      const el = document.getElementById(id);
      if (el) el.textContent = n;
    };
    set('cnt-all', REWARDS.length);
    set('cnt-rewardable', REWARDS.filter(isSelectable).length);
    set('cnt-applying', REWARDS.filter(isApplying).length);
    set('cnt-paid', REWARDS.filter(isCompleted).length);
  }

  // 切換進階條件顯示（依 pendingFilterState）
  function refreshAdvancedVisibility() {
    const advanced = document.getElementById('filter-advanced');
    const rowMethod = document.getElementById('row-method');
    const rowDate = document.getElementById('row-date');
    if (!advanced) return;

    const showMethod = pendingFilterState.status === 'applying' || pendingFilterState.status === 'paid';
    const showDate = pendingFilterState.status === 'paid';
    const showAdvanced = showMethod || showDate;

    advanced.hidden = !showAdvanced;
    if (rowMethod) rowMethod.hidden = !showMethod;
    if (rowDate) rowDate.hidden = !showDate;
  }

  // 底部提領條：始終呈現「全部可提領」的筆數與金額
  function updateBar() {
    const rewardable = REWARDS.filter(isSelectable);
    const sum = rewardable.reduce((s, r) => s + r.amount, 0);
    document.getElementById('selected-amount').textContent = '$' + fmt(sum);
    document.getElementById('selected-count').textContent = rewardable.length;
    const btn = document.getElementById('btn-withdraw');
    const hasRewardable = rewardable.length > 0;
    btn.disabled = !hasRewardable;
    btn.title = !hasRewardable ? '目前無可提領獎金' : '';
    requestAnimationFrame(syncWithdrawBarOffset);
  }

  function updateOverview() {
    const total = selectableTotal();
    const completedRewards = REWARDS.filter(isCompleted);
    const { groups: cmpGroups, ungrouped: cmpUngrouped } = groupRewardsByWithdrawal(completedRewards);
    let completedNet = 0;
    Object.values(cmpGroups).forEach((rs) => {
      completedNet += rs.reduce((s, r) => s + r.amount, 0) - getWithdrawalFee(rs);
    });
    cmpUngrouped.forEach((r) => { completedNet += r.amount; });

    // HTML 已含 <span class="cur">$</span>，這裡只給數字
    document.getElementById('ov-available').textContent = fmt(total);
    document.getElementById('ov-pending-count').textContent = REWARDS.filter(
      isSelectable
    ).length;
    document.getElementById('ov-withdrawn').textContent = '$' + fmt(completedNet);
  }

  // C2：本月提領進度（依曆月計算「申請日」落在本月者，以 applying + completed 視為「已申請」）
  function updateMonthProgress() {
    const card = document.getElementById('rw-month-progress');
    if (!card) return;
    const limits = (window.MGMCommon && window.MGMCommon.getMonthlyLimits)
      ? window.MGMCommon.getMonthlyLimits()
      : { amount: 50000, count: 5 };
    const isInMonth = (window.MGMCommon && window.MGMCommon.isInThisMonth) || (() => false);

    let usedAmount = 0, usedCount = 0;
    REWARDS.forEach((r) => {
      if (!r.appliedAt) return;
      if (!isInMonth(r.appliedAt)) return;
      // 申請中或已完成皆計入「本月已申請」
      if (isApplying(r) || isCompleted(r)) {
        usedAmount += r.amount;
        usedCount += 1;
      }
    });

    // 同步寫入 sessionStorage，讓 dashboard 進度條也能讀到
    try {
      sessionStorage.setItem('mgm_monthly_usage', JSON.stringify({ amount: usedAmount, count: usedCount }));
    } catch {}

    const range = window.MGMCommon ? window.MGMCommon.monthRange() : null;
    const pEl = document.getElementById('rw-mpc-period');
    if (pEl && range) pEl.textContent = `${range.yyyymm} 1 日 ~ 月底`;

    const amtPct = limits.amount ? Math.min(100, (usedAmount / limits.amount) * 100) : 0;
    const cntPct = limits.count ? Math.min(100, (usedCount / limits.count) * 100) : 0;
    const pct = Math.max(amtPct, cntPct);

    document.getElementById('rw-mpc-amount').textContent =
      `$${fmt(usedAmount)} / $${fmt(limits.amount)}`;
    document.getElementById('rw-mpc-count').textContent = `${usedCount} / ${limits.count}`;
    const fill = document.getElementById('rw-mpc-bar');
    if (fill) {
      fill.style.width = pct + '%';
      fill.className = pct >= 100 ? 'mpc-bar-fill mpc-bar-over'
        : pct >= 80 ? 'mpc-bar-fill mpc-bar-warn'
        : 'mpc-bar-fill';
    }
    const hint = document.getElementById('rw-mpc-hint');
    if (hint) {
      if (usedAmount >= limits.amount || usedCount >= limits.count) {
        hint.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' +
          ' 本月已達上限，新增送單將進入「<strong>超量待審佇列</strong>」由風控人員審核。';
        hint.classList.add('mpc-hint-over');
      } else {
        hint.classList.remove('mpc-hint-over');
      }
    }
  }

  // ====== 篩選器：事件繫結（操作 pendingFilterState） ======
  function bindFilterEvents() {
    // 狀態頁籤
    document.querySelectorAll('.filter-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingFilterState.status = btn.dataset.status;
        document.querySelectorAll('.filter-tab').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        // 切換狀態時重置進階條件（避免條件殘留造成困惑）
        pendingFilterState.method = 'all';
        pendingFilterState.dateFrom = '';
        pendingFilterState.dateTo = '';
        pendingFilterState.quick = '';
        syncFilterUI();
        refreshAdvancedVisibility();
      });
    });

    // 撥款方式
    document.querySelectorAll('#chips-method .chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingFilterState.method = btn.dataset.method;
        document.querySelectorAll('#chips-method .chip').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    // 日期區間
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    if (dateFrom) {
      dateFrom.addEventListener('change', () => {
        pendingFilterState.dateFrom = dateFrom.value;
        pendingFilterState.quick = '';
        document
          .querySelectorAll('.filter-quick-dates .chip-sm')
          .forEach((b) => b.classList.remove('active'));
      });
    }
    if (dateTo) {
      dateTo.addEventListener('change', () => {
        pendingFilterState.dateTo = dateTo.value;
        pendingFilterState.quick = '';
        document
          .querySelectorAll('.filter-quick-dates .chip-sm')
          .forEach((b) => b.classList.remove('active'));
      });
    }

    // 快速日期
    document.querySelectorAll('.filter-quick-dates .chip-sm').forEach((btn) => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.dataset.quick, 10);
        const today = new Date();
        const from = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
        const toStr = today.toISOString().slice(0, 10);
        const fromStr = from.toISOString().slice(0, 10);
        pendingFilterState.dateFrom = fromStr;
        pendingFilterState.dateTo = toStr;
        pendingFilterState.quick = btn.dataset.quick;
        if (dateFrom) dateFrom.value = fromStr;
        if (dateTo) dateTo.value = toStr;
        document.querySelectorAll('.filter-quick-dates .chip-sm').forEach((b) => {
          b.classList.toggle('active', b === btn);
        });
      });
    });

    // 重設（清空 pendingFilterState，使用者按「查詢」才生效）
    const resetBtn = document.getElementById('filter-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        pendingFilterState.status = 'all';
        pendingFilterState.method = 'all';
        pendingFilterState.dateFrom = '';
        pendingFilterState.dateTo = '';
        pendingFilterState.quick = '';
        syncFilterUI();
        refreshAdvancedVisibility();
      });
    }

    // 查詢：套用 pendingFilterState → filterState，並關閉 popup 重新渲染
    const applyBtn = document.getElementById('filter-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        Object.assign(filterState, pendingFilterState);
        updateFilterSummary();
        closeFilterModal();
        render();
      });
    }
  }

  // 同步 UI 與 pendingFilterState（popup 開啟、重設、切頁籤時用）
  function syncFilterUI() {
    document.querySelectorAll('.filter-tab').forEach((b) => {
      const active = b.dataset.status === pendingFilterState.status;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('#chips-method .chip').forEach((b) => {
      b.classList.toggle('active', b.dataset.method === pendingFilterState.method);
    });
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    if (dateFrom) dateFrom.value = pendingFilterState.dateFrom;
    if (dateTo) dateTo.value = pendingFilterState.dateTo;
    document.querySelectorAll('.filter-quick-dates .chip-sm').forEach((b) => {
      b.classList.toggle('active', b.dataset.quick === pendingFilterState.quick);
    });
  }

  // ====== Popup 開關 ======
  function openFilterModal() {
    // 開啟時把目前已套用的 filterState 帶入 pendingFilterState
    Object.assign(pendingFilterState, filterState);
    syncFilterUI();
    refreshAdvancedVisibility();
    const modal = document.getElementById('filter-modal');
    if (modal) modal.hidden = false;
  }

  function closeFilterModal() {
    const modal = document.getElementById('filter-modal');
    if (modal) modal.hidden = true;
  }

  // ====== 篩選按鈕 summary 文字 ======
  function updateFilterSummary() {
    const el = document.getElementById('filter-summary');
    if (!el) return;
    const parts = [STATUS_LABEL[filterState.status] || '全部'];
    if (
      (filterState.status === 'applying' || filterState.status === 'paid') &&
      filterState.method !== 'all'
    ) {
      parts.push(METHOD_LABEL[filterState.method]);
    }
    if (filterState.status === 'paid' && (filterState.dateFrom || filterState.dateTo)) {
      if (filterState.quick) {
        parts.push(`近 ${filterState.quick} 日`);
      } else {
        parts.push(`${filterState.dateFrom || '…'} ~ ${filterState.dateTo || '…'}`);
      }
    }
    el.textContent = parts.join(' · ');
  }

  // ====== 黑名單會員：顯示凍結通知並更新統計 ======
  function isBlacklisted() {
    return !!(window.MGMCommon && window.MGMCommon.isCurrentUserBlacklisted && window.MGMCommon.isCurrentUserBlacklisted());
  }

  function applyBlacklistState() {
    const notice = document.getElementById('rw-blacklist-notice');
    if (!notice) return false;
    if (!isBlacklisted()) {
      notice.hidden = true;
      return false;
    }
    notice.hidden = false;

    document.querySelectorAll('.rewards > *').forEach((node) => {
      if (node.id === 'rw-blacklist-notice') return;
      node.hidden = true;
    });

    const withdrawBar = document.querySelector('.withdraw-bar');
    if (withdrawBar) withdrawBar.hidden = true;
    return true;
  }

  function applyExPrecheckGate() {
    const check = (window.MGMCommon && window.MGMCommon.getExEmployeePrecheckState)
      ? window.MGMCommon.getExEmployeePrecheckState()
      : { required: false, passed: true, reason: '' };
    if (!check.required || check.passed) return false;

    const notice = document.getElementById('rw-ex-precheck-notice');
    if (notice) notice.hidden = false;

    document.querySelectorAll('.rewards > *').forEach((node) => {
      if (node.id === 'rw-ex-precheck-notice') return;
      node.hidden = true;
    });

    return true;
  }

  // 前往提領頁（取所有可提領項目）
  function gotoWithdraw() {
    const rewardableIds = REWARDS.filter(isSelectable).map((r) => r.id);
    if (rewardableIds.length === 0) return;
    try {
      sessionStorage.setItem('withdraw_items', JSON.stringify(rewardableIds));
    } catch (e) {
      alert('您的瀏覽器封鎖了儲存功能（可能為無痕模式或追蹤防護），無法傳遞提領資料。請改用一般視窗或允許網站儲存。');
      return;
    }
    if (window.MGMCommon && window.MGMCommon.navigate) {
      window.MGMCommon.navigate('withdrawal');
    } else {
      try {
        if (window.parent && window.parent !== window) window.parent.postMessage({ type: 'mgm:navigate', key: 'withdrawal' }, '*');
      } catch {}
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (applyExPrecheckGate()) {
      return;
    }

    if (applyBlacklistState()) {
      return;
    }

    bindRewardPolicyToggle();
    bindFilterEvents();
    updateFilterSummary();
    render();
    document.getElementById('btn-withdraw').addEventListener('click', gotoWithdraw);

    // Popup 開關
    const openBtn = document.getElementById('btn-open-filter');
    if (openBtn) openBtn.addEventListener('click', openFilterModal);

    document.querySelectorAll('#filter-modal [data-close]').forEach((el) => {
      el.addEventListener('click', closeFilterModal);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('filter-modal');
        if (modal && !modal.hidden) closeFilterModal();
      }
    });

    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.MGMCommon && window.MGMCommon.navigate) {
          window.MGMCommon.navigate(el.dataset.go);
        }
      });
    });

    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (e.key === 'mgm_person_profile' || e.key === 'mgm_ex_line_friend' || e.key === 'mgm_ex_form_phone' || e.key === 'mgm_login_phone') {
        if (applyExPrecheckGate()) return;
      }
    });

    // 申請中提領資料修改按鈕 — 導回 withdrawal 頁以原始資料重新編輯
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-edit-id]');
      if (!btn) return;
      const id = btn.dataset.editId;
      if (!REWARDS.find((x) => String(x.id) === String(id))) return;
      try { sessionStorage.setItem('mgm_edit_withdrawal_id', id); } catch {}
      if (window.MGMCommon && window.MGMCommon.navigate) {
        window.MGMCommon.navigate('withdrawal');
      } else {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'mgm:navigate', key: 'withdrawal' }, '*');
          }
        } catch {}
      }
    });

    syncWithdrawBarOffset();
    window.addEventListener('resize', syncWithdrawBarOffset);
    const withdrawBar = document.querySelector('.withdraw-bar');
    if (withdrawBar && typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(syncWithdrawBarOffset);
      observer.observe(withdrawBar);
    }
  });
})();
