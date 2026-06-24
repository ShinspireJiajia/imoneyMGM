/* ==========================================================
   admin-limits.js - 每月提領上限設定
   功能：上限儲存（持久化）、整數限制、稽核軌跡寫入
   超量處理方式鎖定為「暫存待人工放行（pending_review）」
   ========================================================== */

(function () {
  'use strict';

  function fmt(n) { return Number(n).toLocaleString(); }

  const SETTINGS = {
    amount:        'mgm_risk_limit_amount',
    count:         'mgm_risk_limit_count',
    action:        'mgm_risk_overflow_action', // 永遠寫入 'pending_review'
    followupDays:  'mgm_risk_followup_days',   // 後續案件紅利效期（天）
    noBankDays:    'mgm_risk_no_bank_days',    // 未填寫匯款資料失效期限（天）→ E-NBK
    withdrawDays:  'mgm_risk_withdraw_days',   // 申請提領最長保留天數（天）→ E-WDL
  };

  function loadSettings() {
    try {
      return {
        amount: localStorage.getItem(SETTINGS.amount) || '50000',
        count:  localStorage.getItem(SETTINGS.count)  || '5',
        action: 'pending_review',
      };
    } catch {
      return { amount: '50000', count: '5', action: 'pending_review' };
    }
  }

  function loadExpirySettings() {
    try {
      return {
        followupDays: localStorage.getItem(SETTINGS.followupDays) || '150',
        noBankDays:   localStorage.getItem(SETTINGS.noBankDays)   || '180',
        withdrawDays: localStorage.getItem(SETTINGS.withdrawDays)  || '30',
      };
    } catch {
      return { followupDays: '150', noBankDays: '180', withdrawDays: '30' };
    }
  }

  function setLimitField(inputId, cbId, value, fallback) {
    const input = document.getElementById(inputId);
    const cb = document.getElementById(cbId);
    if (value === 'unlimited') {
      cb.checked = true;
      input.value = fallback;
      input.disabled = true;
    } else {
      cb.checked = false;
      input.value = value;
      input.disabled = false;
    }
  }

  function readLimitField(inputId, cbId) {
    const input = document.getElementById(inputId);
    const cb = document.getElementById(cbId);
    if (cb.checked) return 'unlimited';
    return input.value || '0';
  }

  function fillSettings() {
    const s = loadSettings();
    setLimitField('lim-amount', 'lim-amount-unlimited', s.amount, '50000');
    setLimitField('lim-count', 'lim-count-unlimited', s.count, '5');
    // 確保 localStorage 中的 action 永遠是 pending_review
    try { localStorage.setItem(SETTINGS.action, 'pending_review'); } catch {}
  }

  function fillExpirySettings() {
    const s = loadExpirySettings();
    const followupEl  = document.getElementById('lim-followup-days');
    const noBankEl    = document.getElementById('lim-no-bank-days');
    const withdrawEl  = document.getElementById('lim-withdraw-days');
    if (followupEl)  followupEl.value  = s.followupDays;
    if (noBankEl)    noBankEl.value    = s.noBankDays;
    if (withdrawEl)  withdrawEl.value  = s.withdrawDays;
  }

  function bindUnlimitedToggles() {
    [['lim-amount-unlimited', 'lim-amount'], ['lim-count-unlimited', 'lim-count']].forEach(([cbId, inputId]) => {
      const cb = document.getElementById(cbId);
      if (!cb) return;
      cb.addEventListener('change', () => {
        document.getElementById(inputId).disabled = cb.checked;
      });
    });
    ['lim-amount', 'lim-count', 'lim-followup-days', 'lim-no-bank-days', 'lim-withdraw-days'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('keypress', (e) => {
        if (e.key && /[^\d]/.test(e.key)) e.preventDefault();
      });
      el.addEventListener('input', () => {
        const clean = el.value.replace(/[^\d]/g, '');
        if (clean !== el.value) el.value = clean;
      });
    });
  }

  function bindSaveExpiry() {
    const btn = document.getElementById('btn-save-expiry');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const prev = loadExpirySettings();
      const followupVal  = (document.getElementById('lim-followup-days')?.value  || '').replace(/[^\d]/g, '') || '150';
      const noBankVal    = (document.getElementById('lim-no-bank-days')?.value   || '').replace(/[^\d]/g, '') || '180';
      const withdrawVal  = (document.getElementById('lim-withdraw-days')?.value  || '').replace(/[^\d]/g, '') || '30';

      if (+followupVal < 1 || +noBankVal < 1 || +withdrawVal < 1) {
        toast('天數不可為零，請重新輸入', 'var(--color-error, #ef4444)');
        return;
      }

      try {
        localStorage.setItem(SETTINGS.followupDays, followupVal);
        localStorage.setItem(SETTINGS.noBankDays,   noBankVal);
        localStorage.setItem(SETTINGS.withdrawDays,  withdrawVal);
      } catch (e) {
        alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
        return;
      }

      const diffs = [];
      if (prev.followupDays !== followupVal) diffs.push(`後續案件紅利效期 ${prev.followupDays} 天 → ${followupVal} 天`);
      if (prev.noBankDays   !== noBankVal)   diffs.push(`未填寫匯款資料失效期限 ${prev.noBankDays} 天 → ${noBankVal} 天`);
      if (prev.withdrawDays !== withdrawVal)  diffs.push(`申請提領最長保留天數 ${prev.withdrawDays} 天 → ${withdrawVal} 天`);

      if (diffs.length === 0) {
        toast('無變動，未寫入稽核', 'var(--color-text-muted)');
        return;
      }

      try {
        const key = 'mgm_risk_audit_log';
        const cur = JSON.parse(localStorage.getItem(key) || '[]');
        cur.unshift({
          time:   new Date().toLocaleString('zh-TW'),
          actor:  'Admin User',
          action: '修改時間效期設定',
          target: '時間效期設定',
          note:   diffs.join('；'),
        });
        if (cur.length > 200) cur.length = 200;
        localStorage.setItem(key, JSON.stringify(cur));
      } catch {}

      toast('效期設定已儲存，異動已寫入稽核軌跡', 'var(--color-success)');
      renderAuditLog();
    });
  }

  function fmtLimit(v) {
    return v === 'unlimited' ? '不設上限' : (typeof v === 'string' ? fmt(+v) + ' 元' : v);
  }

  function bindSave() {
    document.getElementById('btn-save-limits').addEventListener('click', () => {
      const prev = loadSettings();
      const next = {
        amount: readLimitField('lim-amount', 'lim-amount-unlimited'),
        count:  readLimitField('lim-count', 'lim-count-unlimited'),
        action: 'pending_review',
      };
      try {
        localStorage.setItem(SETTINGS.amount, next.amount);
        localStorage.setItem(SETTINGS.count,  next.count);
        localStorage.setItem(SETTINGS.action, next.action);
      } catch (e) {
        alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
        return;
      }

      const diffs = [];
      if (prev.amount !== next.amount) diffs.push(`提領上限 ${fmtLimit(prev.amount)} → ${fmtLimit(next.amount)}`);
      if (prev.count  !== next.count)  diffs.push(`件數上限 ${prev.count === 'unlimited' ? '不設上限' : prev.count + ' 件'} → ${next.count === 'unlimited' ? '不設上限' : next.count + ' 件'}`);

      if (diffs.length === 0) {
        toast('無變動，未寫入稽核', 'var(--color-text-muted)');
        return;
      }

      try {
        const key = 'mgm_risk_audit_log';
        const cur = JSON.parse(localStorage.getItem(key) || '[]');
        cur.unshift({
          time: new Date().toLocaleString('zh-TW'),
          actor: 'Admin User',
          action: '修改每月提領上限設定',
          target: '每月上限設定',
          note: diffs.join('；'),
        });
        if (cur.length > 200) cur.length = 200;
        localStorage.setItem(key, JSON.stringify(cur));
      } catch {}

      toast('上限設定已儲存，異動已寫入稽核軌跡', 'var(--color-success)');
      renderAuditLog();
    });

    const link = document.getElementById('link-to-pending');
    if (link) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.parent && window.parent.AdminRouter) {
          window.parent.AdminRouter.go('admin-pending-review');
        } else {
          location.href = 'admin-pending-review.html';
        }
      });
    }
  }

  const LIMITS_AUDIT_ACTIONS = ['修改時間效期設定', '修改每月提領上限設定'];

  const DEMO_AUDIT_ENTRIES = [
    { time: '2026/5/28 下午3:45:12', actor: 'Admin User',         action: '修改時間效期設定',    note: '後續案件紅利效期 180 天 → 150 天' },
    { time: '2026/4/15 上午10:22:05', actor: '財務主管 - Mary',   action: '修改每月提領上限設定', note: '提領上限 30,000 元 → 50,000 元；件數上限 3 件 → 5 件' },
    { time: '2026/3/01 上午9:00:30',  actor: 'Admin User',        action: '修改時間效期設定',    note: '後續案件紅利效期 90 天 → 150 天；未填寫匯款資料失效期限 90 天 → 180 天；申請提領最長保留天數 60 天 → 30 天' },
  ];

  function renderAuditLog() {
    const tbody = document.getElementById('audit-tbody');
    if (!tbody) return;
    let log = [];
    try { log = JSON.parse(localStorage.getItem('mgm_risk_audit_log') || '[]'); } catch {}

    const real = log.filter((e) => LIMITS_AUDIT_ACTIONS.includes(e.action));
    const rows = (real.length ? real : DEMO_AUDIT_ENTRIES).slice(0, 50);

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--color-text-muted);">尚無異動紀錄</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map((e) => {
      const timeParts = (e.time || '').split(' ');
      const dateStr = timeParts[0] || '—';
      const timeStr = timeParts.slice(1).join(' ') || '';

      const isExpiry = e.action === '修改時間效期設定';
      const tagCls  = isExpiry ? 'audit-tag--expiry' : 'audit-tag--limit';
      const tagText = isExpiry ? '效期設定' : '提領上限';

      const noteHtml = (e.note || '').split('；').filter(Boolean).map((part) => {
        const html = part.trim().replace(
          /(.+?)\s*→\s*(.+)/,
          (_, before, after) =>
            `${before}<span class="audit-note-arrow">→</span><span class="audit-note-after">${after}</span>`
        );
        return `<div class="audit-note-line">${html}</div>`;
      }).join('') || '<span style="color:var(--color-text-muted);">—</span>';

      return `
        <tr>
          <td style="white-space:nowrap;">
            <div style="font-weight:600;font-size:12px;">${dateStr}</div>
            <div style="font-size:11px;color:var(--color-text-muted);">${timeStr}</div>
          </td>
          <td style="white-space:nowrap;font-size:13px;">${e.actor || '—'}</td>
          <td><span class="audit-tag ${tagCls}">${tagText}</span></td>
          <td>${noteHtml}</td>
        </tr>`;
    }).join('');
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
    fillSettings();
    fillExpirySettings();
    bindUnlimitedToggles();
    bindSave();
    bindSaveExpiry();
    renderAuditLog();
  });
})();
