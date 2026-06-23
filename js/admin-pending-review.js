/* ==========================================================
   admin-pending-review.js - 超量待審佇列
   功能：篩選、批次選取、單筆/批次操作（放行/拒絕/轉黑名單）、CSV 匯出、稽核軌跡
   ========================================================== */

(function () {
  'use strict';

  // ==================== Demo 資料 ====================
  // status: pending | approved | rejected | blacklisted
  // source: 'overrun'（超量送單，預設）| 'blacklist'（黑名單會員之獎金待人工放行）
  let QUEUE = [
    {
      caseId: 'M2026052810', customerId: '2605280010', referrer: '王小毅', uid: 'U250310001', tag: '會員',
      product: '汽車貸款', amount: 3200,
      monthAcc: 51000, monthCap: 50000,
      appliedAt: '2026/05/28 09:42', status: 'pending', source: 'overrun',
    },
    {
      caseId: 'M2026052712', customerId: '2605270012', referrer: '李大華', uid: 'U240105002', tag: '員工',
      product: '房屋貸款', amount: 8500,
      monthAcc: 56500, monthCap: 50000,
      appliedAt: '2026/05/27 16:20', status: 'pending', source: 'overrun',
    },
    {
      caseId: 'M2026052613', customerId: '2605260013', referrer: '張志維', uid: 'U250115005', tag: '會員',
      product: '信用貸款', amount: 500,
      monthAcc: 50500, monthCap: 50000,
      appliedAt: '2026/05/26 11:08', status: 'pending', source: 'overrun',
    },
    {
      caseId: 'M2026052518', customerId: '2605250018', referrer: '林雅妤', tag: '會員',
      product: '汽車貸款', amount: 2200,
      monthAcc: 52200, monthCap: 50000,
      appliedAt: '2026/05/25 14:00', status: 'pending', source: 'overrun',
    },
    {
      caseId: 'M2026052420', customerId: '2605240020', referrer: '陳前輩', uid: 'U230620004', tag: '離職員工',
      product: '信用貸款', amount: 500,
      monthAcc: 50500, monthCap: 50000,
      appliedAt: '2026/05/24 22:30', status: 'pending', source: 'overrun',
    },
    // ---- 黑名單會員獎金待人工放行（張志維 - UID U250115005，與 admin-blacklist demo 對齊） ----
    // 這些案件對應到「我的獎金」中的 reward id，放行後 rewards 頁該筆會恢復為「可提領」
    {
      caseId: 'M2026051504', customerId: '2605160001', referrer: '張志維', tag: '會員', uid: 'U250115005',
      product: '房屋貸款', amount: 6500,
      monthAcc: 6500, monthCap: 50000,
      appliedAt: '2026/05/16 10:30', status: 'pending', source: 'blacklist',
      blacklistReason: '已被列入洗單黑名單；既有獎金需經人工放行',
      rewardId: 'M2026051504',
    },
    {
      caseId: 'M2026051205', customerId: '2605130002', referrer: '張志維', tag: '會員', uid: 'U250115005',
      product: '汽車貸款', amount: 2500,
      monthAcc: 9000, monthCap: 50000,
      appliedAt: '2026/05/13 18:00', status: 'pending', source: 'blacklist',
      blacklistReason: '已被列入洗單黑名單；既有獎金需經人工放行',
      rewardId: 'M2026051205',
    },
    {
      caseId: 'M2026050610', customerId: '2605070003', referrer: '張志維', tag: '會員', uid: 'U250115005',
      product: '汽車貸款', amount: 3000,
      monthAcc: 12000, monthCap: 50000,
      appliedAt: '2026/05/07 12:00', status: 'pending', source: 'blacklist',
      blacklistReason: '已被列入洗單黑名單；既有獎金需經人工放行',
      rewardId: 'M2026050610',
    },
    // 已處理的舊紀錄（demo 統計用）
    {
      caseId: 'M2026052211', customerId: '2605220011', referrer: '王小毅', uid: 'U250310001', tag: '會員',
      product: '汽車貸款', amount: 1500,
      monthAcc: 51500, monthCap: 50000,
      appliedAt: '2026/05/22 10:15', status: 'approved', source: 'overrun',
      handledBy: 'Admin User', handledAt: '2026/05/22 11:00',
    },
    {
      caseId: 'M2026051915', customerId: '2605190015', referrer: '黃俊偉', tag: '會員',
      product: '汽車貸款', amount: 1800,
      monthAcc: 51800, monthCap: 50000,
      appliedAt: '2026/05/19 09:00', status: 'rejected', source: 'overrun',
      handledBy: '財務 - Mary', handledAt: '2026/05/19 14:30',
      rejectReason: '本月已達系統訂定之提領上限',
    },
    {
      caseId: 'M2026051509', customerId: '2605150009', referrer: '李育穎', uid: 'U240328006', tag: '離職員工',
      product: '汽車貸款', amount: 2500,
      monthAcc: 52500, monthCap: 50000,
      appliedAt: '2026/05/15 18:00', status: 'blacklisted', source: 'overrun',
      handledBy: 'Admin User', handledAt: '2026/05/16 09:00',
      rejectReason: '同一裝置出現多組推薦碼，並於 24 小時內密集送單',
    },
  ];

  const STATUS_META = {
    pending: { label: '待審' },
    approved: { label: '已放行' },
    rejected: { label: '已拒絕' },
    blacklisted: { label: '已轉黑名單' },
  };

  // ==================== 篩選狀態 ====================
  let filter = { keyword: '', tag: '', status: 'pending', source: '' };
  let selected = new Set();

  const SOURCE_LABEL = {
    overrun: '超量送單',
    blacklist: '黑名單會員獎金',
    payout_rejected: '核款拒絕待修正',
  };

  // 與推薦人管理頁保持同一份會員編號來源（UID）
  const REFERRER_UID_BY_NAME = {
    '王小毅': 'U250310001',
    '李大華': 'U240105002',
    '陳前輩': 'U230620004',
    '張志維': 'U250115005',
    '李育穎': 'U240328006',
    '王建鴻': 'U250220007',
  };

  // ==================== 工具函式 ====================
  function fmt(n) { return n.toLocaleString(); }

  function fmtDateYmd(dateStr) {
    const m = String(dateStr || '').match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (m) return `${m[1]}/${m[2]}/${m[3]}`;
    return '—';
  }

  function parseYmd(dateStr) {
    const m = String(dateStr || '').match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function withinDays(dateStr, days) {
    if (days === 'all') return true;
    const d = parseYmd(dateStr);
    if (!d) return false;
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - (Number(days) - 1));
    start.setHours(0, 0, 0, 0);
    return d >= start && d <= end;
  }

  function getCustomerId(q) {
    return q.uid || REFERRER_UID_BY_NAME[q.referrer] || q.customerId || '—';
  }

  function getFiltered() {
    return QUEUE.filter((q) => {
      if (filter.status !== 'all' && q.status !== filter.status) return false;
      if (filter.tag && q.tag !== filter.tag) return false;
      if (filter.source && (q.source || 'overrun') !== filter.source) return false;
      if (filter.keyword) {
        const k = filter.keyword.toLowerCase();
        const hay = `${q.caseId} ${getCustomerId(q)} ${q.referrer}`.toLowerCase();
        if (!hay.includes(k)) return false;
      }
      return true;
    });
  }

  // ==================== 渲染 ====================
  function renderRow(q) {
    const s = STATUS_META[q.status];
    const src = q.source || 'overrun';
    const srcLabel = SOURCE_LABEL[src] || SOURCE_LABEL.overrun;
    const isBlacklistSrc = src === 'blacklist';
    const isPending = q.status === 'pending';
    const checked = selected.has(q.caseId);

    const isPayoutRejected = src === 'payout_rejected';
    // 黑名單來源：已是黑名單，操作只剩「放行 / 拒絕」（不再有「轉黑名單」）
    // 核款拒絕來源：只顯示「提交維護人員」
    const actions = isPending
      ? (isPayoutRejected
          ? `<button type="button" class="action-btn note" data-act="submit-maintenance" data-id="${q.caseId}">
               <i class="fa-solid fa-wrench"></i>提交維護人員
             </button>`
          : isBlacklistSrc
          ? `<button type="button" class="action-btn success" data-act="approve" data-id="${q.caseId}">人工放行</button>
             <button type="button" class="action-btn danger" data-act="reject" data-id="${q.caseId}">拒絕</button>`
          : `<button type="button" class="action-btn success" data-act="approve" data-id="${q.caseId}">放行</button>
             <button type="button" class="action-btn danger" data-act="reject" data-id="${q.caseId}">拒絕</button>
             <button type="button" class="action-btn note" data-act="blacklist" data-id="${q.caseId}">轉黑名單</button>`)
      : `<span class="handled-note">
           <i class="fa-regular fa-user"></i>${q.handledBy || '—'}
           <span class="handled-time">${q.handledAt || ''}</span>
         </span>`;

    const rowExtra = isBlacklistSrc ? ' row-blacklist' : isPayoutRejected ? ' row-payout-rejected' : '';

    return `
      <tr class="${isPending ? '' : 'handled'}${rowExtra}">
        <td>${isPending ? `<input type="checkbox" class="row-cb" data-id="${q.caseId}" ${checked ? 'checked' : ''}>` : ''}</td>
        <td>${srcLabel}</td>
        <td class="mono">${q.caseId}</td>
        <td class="cell-name">${q.referrer}</td>
        <td class="mono">${getCustomerId(q)}</td>
        <td>${q.tag}</td>
        <td class="num money">$${fmt(q.amount)}</td>
        <td>
          ${s.label}
          ${q.rejectReason ? `<div class="cell-sub-warn" title="${q.rejectReason}">${q.rejectReason}</div>` : ''}
        </td>
        <td>${actions}</td>
      </tr>`;
  }

  function render() {
    const list = getFiltered();
    const tbody = document.getElementById('pr-tbody');
    tbody.innerHTML = list.map(renderRow).join('') ||
      '<tr><td colspan="9" class="pr-empty">沒有符合條件的紀錄</td></tr>';

    // 統計（筆數）
    document.getElementById('stat-pending').textContent = QUEUE.filter(q => q.status === 'pending').length;
    document.getElementById('stat-approved').textContent = QUEUE.filter(q => q.status === 'approved').length;
    document.getElementById('stat-rejected').textContent = QUEUE.filter(q => q.status === 'rejected').length;

    document.getElementById('pg-total-count').textContent = list.length;

    // sidebar 角標同步（demo：只改本頁面，shell 角標需 parent.AdminRouter）
    bindRowEvents();
    updateBatchBar();
    syncAllCheckbox();
  }

  function bindRowEvents() {
    document.querySelectorAll('.row-cb').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        if (cb.checked) selected.add(id);
        else selected.delete(id);
        updateBatchBar();
        syncAllCheckbox();
      });
    });
    document.querySelectorAll('[data-act]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        const id = btn.dataset.id;
        if (act === 'approve') singleAct(id, 'approve');
        else if (act === 'reject') singleAct(id, 'reject');
        else if (act === 'blacklist') openBlacklist([id]);
        else if (act === 'submit-maintenance') openSubmitMaintenance(id);
      });
    });
  }

  function syncAllCheckbox() {
    const cbAll = document.getElementById('cb-all');
    const visible = getFiltered().filter(q => q.status === 'pending');
    if (visible.length === 0) {
      cbAll.checked = false;
      cbAll.indeterminate = false;
      cbAll.disabled = true;
      return;
    }
    cbAll.disabled = false;
    const allSel = visible.every(q => selected.has(q.caseId));
    const someSel = visible.some(q => selected.has(q.caseId));
    cbAll.checked = allSel;
    cbAll.indeterminate = !allSel && someSel;
  }

  function updateBatchBar() {
    const bar = document.getElementById('batch-bar');
    const count = selected.size;
    if (count === 0) { bar.hidden = true; return; }
    bar.hidden = false;
    const sum = [...selected].reduce((acc, id) => {
      const q = QUEUE.find(x => x.caseId === id);
      return q ? acc + q.amount : acc;
    }, 0);
    document.getElementById('batch-count').textContent = count;
    document.getElementById('batch-amount').textContent = '$' + fmt(sum);
  }

  // ==================== 動作 ====================
  function singleAct(id, action) {
    const q = QUEUE.find(x => x.caseId === id);
    if (!q || q.status !== 'pending') return;
    const labels = { approve: '放行', reject: '拒絕' };
    if (!confirm(`確認將案 ${id} 標記為「${labels[action]}」？`)) return;
    applyAction([id], action);
  }

  function applyAction(ids, action, reason) {
    const now = new Date().toLocaleString('zh-TW');
    ids.forEach((id) => {
      const q = QUEUE.find(x => x.caseId === id);
      if (!q || q.status !== 'pending') return;
      const isBlacklistSrc = (q.source === 'blacklist');
      if (action === 'approve') {
        q.status = 'approved';
        q.handledBy = 'Admin User';
        q.handledAt = now;
        // 黑名單來源 → 放行後，將對應 reward id 寫入「黑名單放行清單」
        // 該筆獎金在前台會恢復為「可提領」，會員即可發起提領
        if (isBlacklistSrc && q.rewardId && window.MGMCommon && window.MGMCommon.releaseBlacklistReward) {
          window.MGMCommon.releaseBlacklistReward(q.rewardId);
        }
      } else if (action === 'reject') {
        q.status = 'rejected';
        q.handledBy = 'Admin User';
        q.handledAt = now;
        q.rejectReason = isBlacklistSrc
          ? '人工審核拒絕：黑名單帳戶獎金不予放行'
          : '人工審核拒絕：本月已達系統訂定之提領上限';
        // 黑名單來源被拒絕：若曾誤放行，需撤回
        if (isBlacklistSrc && q.rewardId && window.MGMCommon && window.MGMCommon.revokeBlacklistReward) {
          window.MGMCommon.revokeBlacklistReward(q.rewardId);
        }
      } else if (action === 'blacklist') {
        q.status = 'blacklisted';
        q.handledBy = 'Admin User';
        q.handledAt = now;
        q.rejectReason = reason || '轉入洗單黑名單';
      }
      writeAudit({
        time: now,
        actor: 'Admin User',
        action: { approve: '放行', reject: '拒絕', blacklist: '轉黑名單' }[action],
        target: `${q.referrer}（${q.caseId}）${isBlacklistSrc ? '[黑名單帳戶]' : ''}`,
        note: reason || '',
      });
    });
    selected.clear();
    render();

    const verbs = { approve: '放行', reject: '拒絕', blacklist: '轉黑名單' };
    toast(`已將 ${ids.length} 筆案件標記為「${verbs[action]}」，並寫入稽核軌跡。`);
  }

  // ==================== 批次 ====================
  function bindBatch() {
    document.getElementById('cb-all').addEventListener('change', (e) => {
      const visible = getFiltered().filter(q => q.status === 'pending');
      if (e.target.checked) visible.forEach(q => selected.add(q.caseId));
      else visible.forEach(q => selected.delete(q.caseId));
      render();
    });

    document.getElementById('btn-batch-approve').addEventListener('click', () => {
      const ids = [...selected];
      if (ids.length === 0) return;
      if (!confirm(`批次放行 ${ids.length} 筆案件？`)) return;
      applyAction(ids, 'approve');
    });

    document.getElementById('btn-batch-reject').addEventListener('click', () => {
      const ids = [...selected];
      if (ids.length === 0) return;
      if (!confirm(`批次拒絕 ${ids.length} 筆案件？\n所有案件將被歸入「未符合資格」。`)) return;
      applyAction(ids, 'reject');
    });

    document.getElementById('btn-batch-blacklist').addEventListener('click', () => {
      const ids = [...selected];
      if (ids.length === 0) return;
      openBlacklist(ids);
    });

    document.getElementById('btn-batch-cancel').addEventListener('click', () => {
      selected.clear();
      render();
    });
  }

  // ==================== 從核款拒絕讀入待維護案件 ====================
  function loadPayoutRejected() {
    try {
      const items = JSON.parse(localStorage.getItem('mgm_payout_rejected') || '[]');
      items.forEach((item) => {
        if (!QUEUE.find((q) => q.caseId === item.caseId)) {
          QUEUE.push({
            caseId: item.caseId,
            customerId: item.referrerCid || '—',
            referrer: item.referrerName || '—',
            uid: item.referrerCid,
            tag: item.referrerTag || '—',
            product: '核款拒絕',
            amount: item.amount || 0,
            monthAcc: item.amount || 0,
            monthCap: 50000,
            appliedAt: item.rejectedAt || '',
            status: 'pending',
            source: 'payout_rejected',
            rejectNote: item.rejectNote || '',
            rejectedAt: item.rejectedAt || '',
          });
        }
      });
    } catch {}
  }

  // ==================== 提交維護人員 Modal ====================
  let maintenanceCaseId = null;

  function openSubmitMaintenance(id) {
    const q = QUEUE.find((x) => x.caseId === id);
    if (!q) return;
    maintenanceCaseId = id;
    const set = (elId, val) => { const el = document.getElementById(elId); if (el) el.textContent = val; };
    set('sm-caseid',      q.caseId);
    set('sm-referrer',    q.referrer + '（' + q.tag + '）');
    set('sm-amount',      '$' + q.amount.toLocaleString());
    set('sm-reject-note', q.rejectNote || '—');
    const modal = document.getElementById('submit-maintenance-modal');
    if (modal) modal.hidden = false;
  }

  function closeSubmitMaintenance() {
    const modal = document.getElementById('submit-maintenance-modal');
    if (modal) modal.hidden = true;
    maintenanceCaseId = null;
  }

  function bindSubmitMaintenanceModal() {
    const modal = document.getElementById('submit-maintenance-modal');
    if (!modal) return;

    document.getElementById('btn-sm-close').addEventListener('click', closeSubmitMaintenance);
    document.getElementById('btn-sm-cancel').addEventListener('click', closeSubmitMaintenance);
    document.getElementById('sm-backdrop').addEventListener('click', closeSubmitMaintenance);

    document.getElementById('btn-sm-confirm').addEventListener('click', () => {
      if (!maintenanceCaseId) return;
      const q = QUEUE.find((x) => x.caseId === maintenanceCaseId);
      if (q && q.status === 'pending') {
        q.status = 'approved';
        q.handledBy = 'Admin User';
        q.handledAt = new Date().toLocaleString('zh-TW');
        // 從 localStorage 移除已提交項目
        try {
          const key = 'mgm_payout_rejected';
          const cur = JSON.parse(localStorage.getItem(key) || '[]');
          localStorage.setItem(key, JSON.stringify(cur.filter((x) => x.caseId !== maintenanceCaseId)));
        } catch {}
        writeAudit({
          time: new Date().toLocaleString('zh-TW'),
          actor: 'Admin User',
          action: '提交維護人員',
          target: `${q.referrer}（${q.caseId}）[核款拒絕]`,
          note: q.rejectNote || '',
        });
      }
      closeSubmitMaintenance();
      render();
      toast('已確認通知維護人員，並寫入稽核軌跡。');
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.hidden) closeSubmitMaintenance();
    });
  }

  // ==================== 轉黑名單 Modal ====================
  let blacklistTargets = [];

  function openBlacklist(ids) {
    blacklistTargets = ids;
    const refs = ids
      .map(id => QUEUE.find(q => q.caseId === id))
      .filter(Boolean)
      .map(q => `${q.referrer}（${q.caseId}）`);
    const desc = ids.length === 1
      ? `將推薦人 ${refs[0]} 轉入黑名單。`
      : `將以下 ${ids.length} 筆案件對應之推薦人全部轉入黑名單：${refs.join('、')}`;
    document.getElementById('bl-target-desc').textContent = desc;
    document.getElementById('bl-reason').value = '';
    document.getElementById('bl-modal').hidden = false;
    setTimeout(() => document.getElementById('bl-reason').focus(), 0);
  }

  function closeBlacklist() {
    document.getElementById('bl-modal').hidden = true;
    blacklistTargets = [];
  }

  function bindBlacklistModal() {
    document.querySelectorAll('#bl-modal [data-close]').forEach(el =>
      el.addEventListener('click', closeBlacklist));
    document.getElementById('bl-confirm').addEventListener('click', () => {
      const reason = document.getElementById('bl-reason').value.trim();
      if (!reason) { alert('請填寫凍結原因（必填，將寫入稽核軌跡）'); return; }
      // demo：把推薦人寫入 localStorage 模擬加入黑名單
      const referrers = [...new Set(
        blacklistTargets.map(id => {
          const q = QUEUE.find(x => x.caseId === id);
          return q ? q.referrer : null;
        }).filter(Boolean)
      )];
      try {
        const key = 'mgm_blacklist_extra';
        const cur = JSON.parse(localStorage.getItem(key) || '[]');
        referrers.forEach(r => {
          if (!cur.find(x => x.name === r)) {
            cur.push({ name: r, reason, time: new Date().toLocaleString('zh-TW'), actor: 'Admin User' });
          }
        });
        localStorage.setItem(key, JSON.stringify(cur));
      } catch {}

      applyAction(blacklistTargets, 'blacklist', reason);
      closeBlacklist();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const m = document.getElementById('bl-modal');
        if (m && !m.hidden) closeBlacklist();
      }
    });
  }

  // ==================== CSV 匯出 ====================
  function exportCsv() {
    const list = getFiltered();
    if (list.length === 0) { alert('目前無資料可匯出'); return; }
    const headers = ['來源','案號','推薦人','會員編號','標籤','金額(NT$)','狀態','處理人','處理時間','備註/原因'];
    const STATUS_TXT = { pending: '待審', approved: '已放行', rejected: '已拒絕', blacklisted: '已轉黑名單' };
    const rows = list.map(q => [
      SOURCE_LABEL[q.source || 'overrun'] || q.source || '',
      q.caseId,
      q.referrer,
      getCustomerId(q),
      q.tag,
      q.amount,
      STATUS_TXT[q.status] || q.status,
      q.handledBy || '',
      q.handledAt || '',
      q.rejectReason || q.blacklistReason || '',
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\r\n');
    // UTF-8 BOM 讓 Excel 正確顯示中文
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fn = `超量待審佇列_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
    a.href = url;
    a.download = fn;
    a.click();
    URL.revokeObjectURL(url);
    toast(`已匯出 ${list.length} 筆紀錄為 ${fn}`);
  }

  // ==================== 篩選綁定 ====================
  function bindFilters() {
    const syncFilter = () => {
      filter.keyword = document.getElementById('f-keyword').value.trim();
      filter.tag = document.getElementById('f-tag').value;
      filter.source = document.getElementById('f-source').value;
      filter.status = document.getElementById('f-status').value;
    };

    const runFilter = () => {
      syncFilter();
      selected.clear();
      render();
    };

    document.getElementById('btn-search').addEventListener('click', runFilter);
    ['f-source', 'f-tag', 'f-status'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', runFilter);
    });
    document.getElementById('f-keyword').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runFilter();
    });

    // 初始化：套用預設篩選（近 30 天 + 待審）
    runFilter();
  }

  // ==================== 稽核軌跡寫入 ====================
  function writeAudit(entry) {
    try {
      const key = 'mgm_risk_audit_log';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      cur.unshift(entry);
      // 保留最近 200 筆
      if (cur.length > 200) cur.length = 200;
      localStorage.setItem(key, JSON.stringify(cur));
    } catch {}
  }

  // ==================== Toast ====================
  function toast(msg) {
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
        'background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;' +
        'font-size:14px;z-index:9999;opacity:0;transition:opacity .2s;max-width:90%;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => (t.style.opacity = '0'), 2600);
  }

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', () => {
    loadPayoutRejected();
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
    bindBatch();
    bindBlacklistModal();
    bindSubmitMaintenanceModal();
    document.getElementById('btn-export-csv').addEventListener('click', exportCsv);
  });
})();
