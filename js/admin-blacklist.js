/* ==========================================================
   admin-blacklist.js - 黑名單管理
   功能：列表渲染（含分頁）、查看詳情、標記/解除凍結、稽核軌跡寫入
   注意：每月提領上限設定已搬至 admin-limits 獨立頁
   ========================================================== */

(function () {
  'use strict';

  const INCIDENT_MAP_KEY = 'mgm_blacklist_incident_by_uid';

  const DEFAULT_INCIDENTS = {
    U250115005: 'BL-20260518-H5K8Q',
    U240328006: 'BL-20260430-J2P7M',
    U250220007: 'BL-20260524-T9R4C',
  };

  const BLACKLIST = [
    {
      uid: 'U250115005', name: '張志維', tag: '會員',
      frozen: true, warning: false,
      warnedAt: '2026/05/15 09:08',
      blacklistedAt: '2026/05/18 14:22',
      flaggedBy: 'Admin User',
      reason: '單日送單 12 筆，被推薦人 IP 多為境外 VPN，疑似職業洗單',
      caseCount: 24, affectedAmount: 18000,
    },
    {
      uid: 'U240328006', name: '李育穎', tag: '離職員工',
      frozen: true, warning: false,
      warnedAt: '2026/04/25 16:30',
      blacklistedAt: '2026/04/30 10:15',
      flaggedBy: '客服 - Mary',
      reason: '同一裝置 ID 出現多組推薦碼，且來源論壇連結被識別',
      caseCount: 18, affectedAmount: 12500,
    },
    {
      uid: 'U250220007', name: '王建鴻', tag: '會員',
      frozen: false, warning: true,
      warnedAt: '2026/05/24 22:05',
      blacklistedAt: null,
      flaggedBy: '—',
      reason: '系統自動警示：近 7 天送單 9 件（觸及月上限 5 件）',
      caseCount: 9, affectedAmount: 0,
    },
  ];

  function fmt(n) { return n.toLocaleString(); }

  function getIncidentMap() {
    try {
      const raw = JSON.parse(localStorage.getItem(INCIDENT_MAP_KEY) || '{}');
      return (raw && typeof raw === 'object') ? raw : {};
    } catch {
      return {};
    }
  }

  function setIncidentMap(map) {
    try {
      localStorage.setItem(INCIDENT_MAP_KEY, JSON.stringify(map));
    } catch {}
  }

  function getIncidentId(uid) {
    const map = getIncidentMap();
    return map[uid] || DEFAULT_INCIDENTS[uid] || '—';
  }

  function initIncidentSync() {
    const map = getIncidentMap();
    let changed = false;
    BLACKLIST.forEach((b) => {
      if (!map[b.uid] && DEFAULT_INCIDENTS[b.uid]) {
        map[b.uid] = DEFAULT_INCIDENTS[b.uid];
        changed = true;
      }
    });
    if (changed) setIncidentMap(map);
  }

  function statusText(b) {
    if (b.frozen) return '已凍結';
    if (b.warning) return '系統警示';
    return '正常';
  }

  function latestNote(b) {
    if (b.frozen) return b.reason || '已凍結（無備註）';
    if (b.warning) return b.reason || '系統警示中';
    return '—';
  }

  // 分頁狀態
  let pgPage = 1;
  let pgSize = 20;

  function renderBlacklist() {
    const tbody = document.getElementById('blacklist-tbody');
    const total = BLACKLIST.length;
    const maxPage = Math.max(1, Math.ceil(total / pgSize));
    if (pgPage > maxPage) pgPage = maxPage;
    const start = (pgPage - 1) * pgSize;
    const page = BLACKLIST.slice(start, start + pgSize);

    tbody.innerHTML = page.length
      ? page.map((b) => {
          const rowCls = b.frozen ? 'frozen' : b.warning ? 'warning' : '';
          return `
            <tr class="${rowCls}">
              <td><span class="uid-cell">${getIncidentId(b.uid)}</span></td>
              <td class="user-cell">
                <strong>${b.name}</strong>
              </td>
              <td class="tag-cell">${b.tag}</td>
              <td class="status-text status-${b.frozen ? 'frozen' : b.warning ? 'warning' : 'normal'}">${statusText(b)}</td>
              <td class="reason-cell">${latestNote(b)}</td>
              <td>
                <button type="button" class="action-btn" data-action="view" data-uid="${b.uid}">
                  <i class="fa-solid fa-eye"></i>查看
                </button>
              </td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="6" style="padding:32px;text-align:center;color:var(--color-text-muted);">目前沒有資料</td></tr>`;

    // 分頁元件
    const totalEl = document.getElementById('bl-pg-total');
    if (totalEl) totalEl.textContent = total;
    renderPagination(total, maxPage);

    bindRowActions();
  }

  function renderPagination(total, maxPage) {
    const wrap = document.getElementById('bl-pagination');
    if (!wrap) return;

    const btns = [];
    btns.push(`<button class="pg-btn" data-pg="prev" ${pgPage <= 1 ? 'disabled' : ''}>«</button>`);
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
        renderBlacklist();
      });
    });
  }

  function bindPageSize() {
    const sel = document.getElementById('bl-page-size');
    if (!sel) return;
    pgSize = parseInt(sel.value, 10) || 20;
    sel.addEventListener('change', () => {
      pgSize = parseInt(sel.value, 10) || 20;
      pgPage = 1;
      renderBlacklist();
    });
  }

  function bindRowActions() {
    document.querySelectorAll('[data-action="view"]').forEach((btn) =>
      btn.addEventListener('click', () => openViewModal(btn.dataset.uid))
    );
  }

  // ---------- 查看 Modal ----------
  let viewingUid = null;
  function openViewModal(uid) {
    const b = BLACKLIST.find(x => x.uid === uid);
    if (!b) return;
    viewingUid = uid;
    document.getElementById('view-incident-id').textContent = getIncidentId(b.uid);
    document.getElementById('view-name').textContent = b.name;
    document.getElementById('view-tag').textContent = b.tag;
    document.getElementById('view-status').textContent = statusText(b);
    document.getElementById('view-warned-at').textContent = b.warnedAt || '—';
    document.getElementById('view-blacklisted-at').textContent = b.blacklistedAt || '—';
    document.getElementById('view-flagged-by').textContent = b.flaggedBy || '—';
    document.getElementById('view-reason').textContent = b.reason || '—';

    const btnUnfreeze = document.getElementById('view-btn-unfreeze');
    const btnFlag = document.getElementById('view-btn-flag');
    const warn = document.getElementById('view-action-warn');
    btnUnfreeze.hidden = !b.frozen;
    btnFlag.hidden = b.frozen;
    warn.hidden = false;

    document.getElementById('view-modal').classList.add('show');
  }

  function closeViewModal() {
    document.getElementById('view-modal').classList.remove('show');
    viewingUid = null;
  }

  function writeAudit(action, target, note) {
    try {
      const key = 'mgm_risk_audit_log';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      cur.unshift({
        time: new Date().toLocaleString('zh-TW'),
        actor: 'Admin User',
        action, target, note,
      });
      if (cur.length > 200) cur.length = 200;
      localStorage.setItem(key, JSON.stringify(cur));
    } catch {}
  }

  // B5：同步「凍結 UID 清單」至 localStorage，讓「推薦人管理」即時反映
  function pushFrozenUid(uid, frozen) {
    try {
      const arr = JSON.parse(localStorage.getItem('mgm_frozen_uids') || '[]');
      const set = new Set(arr);
      if (frozen) set.add(uid); else set.delete(uid);
      localStorage.setItem('mgm_frozen_uids', JSON.stringify([...set]));
    } catch {}
  }

  // 初始化時以 BLACKLIST demo 資料為唯一真相來源，完整覆寫共用清單。
  // replace（非 add）確保舊 demo session 遺留的凍結狀態不殘留。
  (function initFrozenSync() {
    try {
      const frozen = new Set(BLACKLIST.filter(function (b) { return b.frozen; }).map(function (b) { return b.uid; }));
      localStorage.setItem('mgm_frozen_uids', JSON.stringify([...frozen]));
    } catch {}
  })();

  function bindViewModal() {
    document.getElementById('btn-view-close').addEventListener('click', closeViewModal);

    document.getElementById('view-btn-unfreeze').addEventListener('click', () => {
      if (!viewingUid) return;
      if (!confirm('確定解除此帳號之凍結？解除後其連結將恢復有效。')) return;
      const b = BLACKLIST.find(x => x.uid === viewingUid);
      if (b) {
        b.frozen = false;
        b.warning = false;
        pushFrozenUid(b.uid, false); // B5：同步推薦人管理
        writeAudit(`解除 ${b.uid} (${b.name}) 之凍結`, '黑名單', '經查無事證，恢復啟用');
      }
      closeViewModal();
      renderBlacklist();
      toast('已解除凍結並寫入稽核軌跡（已同步推薦人管理）', 'var(--color-success)');
    });

    document.getElementById('view-btn-flag').addEventListener('click', () => {
      if (!viewingUid) return;
      const b = BLACKLIST.find(x => x.uid === viewingUid);
      if (!b) return;
      closeViewModal();
      openFlagModal(b.uid, b.name);
    });
  }

  // ---------- 標記為黑名單 Modal ----------
  function openFlagModal(uid, name) {
    const modal = document.getElementById('flag-modal');
    document.getElementById('flag-incident-id').textContent = getIncidentId(uid);
    document.getElementById('flag-name').textContent = name;
    if (modal) {
      modal.dataset.uid = uid;
      modal.classList.add('show');
    }
  }

  function closeFlagModal() {
    const modal = document.getElementById('flag-modal');
    if (modal) {
      modal.classList.remove('show');
      delete modal.dataset.uid;
    }
    document.getElementById('flag-reason').value = '';
  }

  function bindModal() {
    document.getElementById('btn-flag-cancel').addEventListener('click', closeFlagModal);
    document.getElementById('btn-flag-confirm').addEventListener('click', () => {
      const reason = document.getElementById('flag-reason').value.trim();
      if (!reason) {
        alert('請填寫凍結原因（稽核必要）');
        return;
      }
      const uid = document.getElementById('flag-modal')?.dataset.uid || '';
      if (!uid) return;
      const b = BLACKLIST.find(x => x.uid === uid);
      if (b) {
        b.frozen = true;
        b.warning = false;
        b.blacklistedAt = new Date().toLocaleString('zh-TW');
        b.flaggedBy = 'Admin User';
        b.reason = reason;
        pushFrozenUid(b.uid, true); // B5：同步推薦人管理
        writeAudit(`標記 ${b.uid} (${b.name}) 為黑名單`, '黑名單', reason);
      }
      closeFlagModal();
      renderBlacklist();
      toast('已將該帳號標記為黑名單，連結即時失效（已同步推薦人管理）', 'var(--color-danger)');
    });
  }

  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;' +
      'box-shadow:0 8px 20px rgba(0,0,0,0.15);';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2500);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initIncidentSync();
    bindPageSize();
    renderBlacklist();
    bindModal();
    bindViewModal();

    // B5：另一頁（推薦人管理）變更凍結狀態時即時同步本頁
    window.addEventListener('storage', (e) => {
      if (e.key === 'mgm_frozen_uids') {
        try {
          const set = new Set(JSON.parse(e.newValue || '[]'));
          BLACKLIST.forEach((b) => {
            // 只同步「解除」方向（推薦人管理目前無「加入黑名單」入口）
            if (b.frozen && !set.has(b.uid)) { b.frozen = false; b.warning = false; }
          });
          renderBlacklist();
        } catch {}
      }
    });
  });
})();
