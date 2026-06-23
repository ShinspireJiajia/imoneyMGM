/* ==========================================================
   memo.js — 備註模組（跨頁面共用）
   entity: 'case'        → admin-records & admin-payout 共用
   entity: 'withdrawal'  → admin-payments
   entity: 'cashpayment' → admin-cash-payments
   ========================================================== */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'mgm_memos';

  // ── Storage helpers ──────────────────────────────────────
  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
  }
  function saveAll(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }

  function getMemos(entityType, entityId) {
    return loadAll()[entityType + '_' + entityId] || [];
  }

  function addMemo(entityType, entityId, content, author) {
    const key = entityType + '_' + entityId;
    const all = loadAll();
    if (!all[key]) all[key] = [];
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`;
    all[key].push({ content, author: author || 'Admin User', date: dateStr, ts: now.getTime() });
    saveAll(all);
    return all[key];
  }

  // ── Widget render ────────────────────────────────────────
  function renderWidget(container, entityType, entityId, currentUser) {
    if (!container) return;
    const user = currentUser || 'Admin User';
    const uid  = entityType + '-' + entityId.replace(/[^a-zA-Z0-9]/g, '_');
    container.innerHTML = `
      <div class="memo-widget">
        <div class="memo-list" id="ml-${uid}"></div>
        <div class="memo-compose">
          <textarea class="memo-textarea field-input" id="mta-${uid}" rows="2"
            placeholder="輸入備註內容…"></textarea>
          <div class="memo-compose-foot">
            <span class="memo-hint"><i class="fa-solid fa-lock"></i>備註寫入後不可刪除</span>
            <button type="button" class="btn btn-primary memo-save-btn" style="font-size:13px;padding:6px 14px;">
              <i class="fa-solid fa-check"></i>新增備註
            </button>
          </div>
        </div>
      </div>`;

    renderList(container, entityType, entityId, uid);

    container.querySelector('.memo-save-btn').addEventListener('click', () => {
      const ta   = container.querySelector('#mta-' + uid);
      const text = (ta.value || '').trim();
      if (!text) {
        ta.classList.add('memo-field-error');
        setTimeout(() => ta.classList.remove('memo-field-error'), 1200);
        return;
      }
      addMemo(entityType, entityId, text, user);
      ta.value = '';
      renderList(container, entityType, entityId, uid);
      memoToast('備註已儲存');
    });
  }

  function renderList(container, entityType, entityId, uid) {
    const el = container.querySelector('#ml-' + uid);
    if (!el) return;
    const memos = getMemos(entityType, entityId);
    if (!memos.length) {
      el.innerHTML = '<div class="memo-empty">尚無備註</div>';
      return;
    }
    el.innerHTML = memos.slice().reverse().map((m) => `
      <div class="memo-item">
        <div class="memo-meta">
          <span class="memo-author"><i class="fa-solid fa-circle-user"></i>${esc(m.author)}</span>
          <span class="memo-date">${esc(m.date)}</span>
        </div>
        <div class="memo-content">${esc(m.content)}</div>
      </div>`).join('');
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function memoToast(msg) {
    const t = document.createElement('div');
    t.style.cssText =
      'position:fixed;top:80px;right:24px;background:#10b981;color:#fff;' +
      'padding:11px 18px;border-radius:10px;font-size:14px;z-index:99999;' +
      'box-shadow:0 8px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;';
    t.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  // ── Export ───────────────────────────────────────────────
  global.MemoManager = { getMemos, addMemo, renderWidget };

}(window));
