/* ==========================================================
   admin-campaigns.js - 活動檔期管理（單一規則列表式）
   ========================================================== */

(function () {
  'use strict';

  // ---------- 預設文案（可後台覆寫） ----------
  const DEFAULT_CONTENT = {
    'CAMP-2026Q2': `
      <h2>2026 初夏推薦大賞</h2>
      <p>把財通的好，告訴身邊有資金需求的家人朋友。每一份分享，都是<strong>支持與信任</strong>。</p>
      <p>本檔期推薦最高可獲 <strong style="color:#7c3aed;">NT$ 15,000</strong> 獎金回饋。</p>
      <ul>
        <li>房屋貸款 — 最高 $15,000</li>
        <li>汽車貸款 — 最高 $5,000</li>
        <li>信用貸款 — 固定 $500</li>
      </ul>
      <p style="color:#252629;font-size:13px;">※ 活動期間 2026/04/01 — 2026/06/30。實際金額依訪客送單當下之規則計算。</p>
    `.trim(),
    'CAMP-2026Q3': `
      <h2>2026 秋季推薦衝刺</h2>
      <p>把握下一檔活動，提早讓親友認識財通。秋季檔期將於 7/1 開跑。</p>
    `.trim(),
    'CAMP-2026Q1': `
      <h2>2026 新春推薦贏家（已結束）</h2>
      <p>感謝大家的熱情參與，本檔期已結束發放。請期待下一檔活動。</p>
    `.trim(),
  };

  function loadContent(id) {
    try {
      const stored = localStorage.getItem('mgm_campaign_content_' + id);
      if (stored !== null) return stored;
    } catch {}
    return DEFAULT_CONTENT[id] || '';
  }

  function saveContent(id, html) {
    try {
      localStorage.setItem('mgm_campaign_content_' + id, html);
      return true;
    } catch (e) {
      alert('儲存失敗：' + (e && e.message ? e.message : '不明原因') +
        '\n\n若包含大量圖片可能超過瀏覽器儲存上限。');
      return false;
    }
  }

  // ---------- Demo 資料（in-memory，單一規則） ----------
  const CAMPAIGNS = [
    { id: 'CAMP-2026Q2', name: '2026 Q2 推薦獎勵活動', start: '2026/04/01 00:00', end: '2026/06/30 23:59', status: 'active',   cases: 128, snapshots: 89, payout: 182500, matrixCount: 3 },
    { id: 'CAMP-2026Q3', name: '2026 Q3 推薦衝刺活動', start: '2026/07/01 00:00', end: '2026/09/30 23:59', status: 'upcoming', cases: 0,   snapshots: 0,  payout: 0,      matrixCount: 3 },
    { id: 'CAMP-2026Q1', name: '2026 Q1 新春推薦活動', start: '2026/01/01 00:00', end: '2026/03/31 23:59', status: 'ended',    cases: 96,  snapshots: 96, payout: 135000, matrixCount: 3 },
  ];

  const STATUS_META = {
    active:   { label: '進行中', cls: 'badge-green',  icon: 'fa-circle-play' },
    upcoming: { label: '未開始', cls: 'badge-purple', icon: 'fa-clock' },
    ended:    { label: '已結束', cls: 'badge-gray',   icon: 'fa-circle-stop' },
  };

  function fmt(n) { return n.toLocaleString(); }

  // ---------- 時間重疊判斷（同期間單一進行中規則） ----------
  function toDate(s) {
    return new Date(String(s).replace(/\//g, '-').replace(' ', 'T'));
  }
  function isTimeOverlap(a, b) {
    const aS = toDate(a.start), aE = toDate(a.end);
    const bS = toDate(b.start), bE = toDate(b.end);
    if (isNaN(aS) || isNaN(aE) || isNaN(bS) || isNaN(bE)) return false;
    return aS <= bE && bS <= aE;
  }
  function findActiveOverlap(candidate, excludeId) {
    return CAMPAIGNS.find(c =>
      c.id !== excludeId &&
      c.status === 'active' &&
      isTimeOverlap(candidate, c)
    );
  }

  // 同期間 active 快取，供詳情頁透過 sessionStorage 驗證
  function refreshActiveSnapshot() {
    try {
      const all = CAMPAIGNS
        .filter(c => c.status === 'active')
        .map(c => ({ id: c.id, start: c.start, end: c.end, name: c.name }));
      sessionStorage.setItem('mgm_active_campaigns', JSON.stringify({ all }));
    } catch {}
  }
  refreshActiveSnapshot();

  // ==================== 列表渲染 ====================
  function renderRow(c) {
    const meta = STATUS_META[c.status];
    const rowCls = c.status === 'active' ? 'row-active' : '';

    const deleteLocked = c.status === 'active' && c.cases > 0;
    let deleteBtn = '';
    if (c.status !== 'ended') {
      if (deleteLocked) {
        deleteBtn = `<button type="button" class="action-btn danger" data-action="delete-locked" data-id="${c.id}" data-name="${c.name}" data-cases="${c.cases}" title="進行中活動已有 ${c.cases} 筆案件，無法刪除" aria-disabled="true"><i class="fa-solid fa-lock"></i></button>`;
      } else {
        deleteBtn = `<button type="button" class="action-btn danger" data-action="delete" data-id="${c.id}"><i class="fa-solid fa-trash"></i></button>`;
      }
    }

    return `
      <tr class="${rowCls}">
        <td style="font-size:13px;color:var(--color-text-muted);font-weight:400;font-family:'Courier New',monospace;white-space:nowrap;">${c.id}</td>
        <td>${c.name}</td>
        <td class="period-cell">
          <div class="row1">${c.start}</div>
          <div class="row2">至 ${c.end}</div>
        </td>
        <td><span class="badge ${meta.cls}"><i class="fa-solid ${meta.icon}"></i> ${meta.label}</span></td>
        <td class="stat-cell">${c.cases}<small>累積案件</small></td>
        <td class="stat-cell">$${fmt(c.payout)}<small>已發放</small></td>
        <td>
          <button type="button" class="action-btn" data-action="edit-detail" data-id="${c.id}" data-name="${c.name}">
            <i class="fa-solid fa-pen-to-square"></i>編輯
          </button>
          <button type="button" class="action-btn" data-action="copy" data-id="${c.id}" data-name="${c.name}">
            <i class="fa-solid fa-copy"></i>複製
          </button>
          ${deleteBtn}
        </td>
      </tr>`;
  }

  function render() {
    // B4：若 admin-payments 有寫入聚合快取，覆寫 cases / payout 以保持對齊
    try {
      const agg = JSON.parse(sessionStorage.getItem('mgm_campaign_agg') || '{}');
      CAMPAIGNS.forEach((c) => {
        if (agg[c.id]) {
          c.cases = agg[c.id].cases;
          c.payout = agg[c.id].payout;
        }
      });
    } catch {}
    const tbody = document.getElementById('campaign-tbody');
    tbody.innerHTML = CAMPAIGNS.map((c) => renderRow(c)).join('');

    const totalEl = document.getElementById('pg-total-count');
    if (totalEl) totalEl.textContent = CAMPAIGNS.length;

    bindRowActions();
  }

  function bindRowActions() {
    document.querySelectorAll('[data-action="edit-detail"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = CAMPAIGNS.find((x) => x.id === btn.dataset.id);
        sessionStorage.setItem(
          'edit_campaign',
          JSON.stringify({
            id: btn.dataset.id,
            name: btn.dataset.name,
            plan: 'all',
            start: c ? c.start : '',
            end: c ? c.end : '',
            status: c ? c.status : 'upcoming',
          })
        );
        if (window.parent && window.parent.AdminRouter) {
          window.parent.AdminRouter.go('admin-matrix');
        } else {
          location.href = 'admin-matrix.html';
        }
      });
    });

    document.querySelectorAll('[data-action="copy"]').forEach((btn) => {
      btn.addEventListener('click', () => copyCampaign(btn.dataset.id, btn.dataset.name));
    });

    document.querySelectorAll('[data-action="delete"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = CAMPAIGNS.find((c) => c.id === btn.dataset.id);
        if (!target) return;
        if (target.status === 'active' && target.cases > 0) {
          alert(
            `無法刪除「${target.name}」\n\n` +
            `此活動為「進行中」且已累積 ${target.cases} 筆案件。\n` +
            `為避免影響進行中的紀錄與獎金計算，請先結束本檔期再刪除。`
          );
          render();
          return;
        }
        if (!confirm(`確定要刪除「${target.name}」？\n此操作無法復原。`)) return;
        const idx = CAMPAIGNS.findIndex((c) => c.id === btn.dataset.id);
        if (idx >= 0) CAMPAIGNS.splice(idx, 1);
        refreshActiveSnapshot();
        render();
        toast('已刪除活動。');
      });
    });

    document.querySelectorAll('[data-action="delete-locked"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.name || '此活動';
        const cases = btn.dataset.cases || '若干';
        alert(
          `無法刪除「${name}」\n\n` +
          `此活動為「進行中」且已累積 ${cases} 筆案件。\n` +
          `為避免影響進行中的紀錄與獎金計算，請先結束本檔期再刪除。`
        );
      });
    });
  }

  // ==================== 複製活動（含文案） ====================
  function copyCampaign(srcId, srcName) {
    const src = CAMPAIGNS.find((c) => c.id === srcId);
    if (!src) return;

    const newName = prompt('請輸入新活動名稱：', srcName + ' (複製)');
    if (newName === null) return;
    if (!newName.trim()) { alert('活動名稱不可空白'); return; }

    const newId = srcId + '-COPY-' + Date.now().toString(36).toUpperCase().slice(-4);

    const srcContent = loadContent(srcId);
    saveContent(newId, srcContent);

    const newCampaign = {
      ...src,
      id: newId,
      name: newName.trim(),
      status: 'upcoming',
      cases: 0,
      snapshots: 0,
      payout: 0,
    };

    const conflict = findActiveOverlap(newCampaign, null);
    if (conflict) {
      const ok = confirm(
        `提示：複製之時間（${src.start.slice(0,10)} ～ ${src.end.slice(0,10)}）與目前進行中之活動「${conflict.name}」重疊。\n\n新活動會以「未開始」狀態建立，啟用前請先調整時間或結束既有活動，否則無法切換為「進行中」。\n\n仍要繼續嗎？`
      );
      if (!ok) return;
    }

    CAMPAIGNS.unshift(newCampaign);

    try {
      const matrixKey = (id) => 'mgm_campaign_matrix_' + id;
      const srcMatrix = localStorage.getItem(matrixKey(srcId));
      if (srcMatrix) localStorage.setItem(matrixKey(newId), srcMatrix);
    } catch {}

    refreshActiveSnapshot();
    render();
    toast('已複製活動，文案與級距已一併帶入新檔期。可點「編輯」進入詳情頁確認。');
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
    t._tid = setTimeout(() => (t.style.opacity = '0'), 2400);
  }

  // A3：依現行檔期推算「下一檔期建議起迄」
  function suggestNextPeriod() {
    const active = CAMPAIGNS.find(c => c.status === 'active');
    let startDate;
    if (active) {
      const end = toDate(active.end);
      if (end) startDate = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 0, 0, 0, 0);
    }
    if (!startDate) startDate = new Date();
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 0);
    const fmtYMD = (d) => `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    return {
      start: fmtYMD(startDate) + ' 00:00',
      end:   fmtYMD(endDate)   + ' 23:59',
    };
  }

  function bindNewCampaign() {
    document.getElementById('btn-new-campaign').addEventListener('click', () => {
      const period = suggestNextPeriod();
      const today = new Date();
      const newName = `${today.getFullYear()} Q${Math.floor(today.getMonth() / 3) + 2} 推薦活動`;
      const newId = `CAMP-NEW-${Date.now().toString(36).toUpperCase().slice(-4)}`;
      sessionStorage.setItem(
        'edit_campaign',
        JSON.stringify({
          id: newId,
          name: newName,
          plan: 'all',
          start: period.start,
          end: period.end,
          status: 'upcoming',
          isNew: true,
        })
      );
      if (window.parent && window.parent.AdminRouter) {
        window.parent.AdminRouter.go('admin-matrix');
      } else {
        location.href = 'admin-matrix.html';
      }
    });
  }

  function bindFilterControls() {
    const toggle = document.getElementById('btn-toggle-advanced');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const grid = document.getElementById('filter-grid');
        if (!grid) return;
        const collapsed = grid.classList.toggle('collapsed');
        toggle.innerHTML = collapsed
          ? '<i class="fa-solid fa-sliders"></i>進階篩選'
          : '<i class="fa-solid fa-chevron-up"></i>收合篩選';
      });
    }

    const search = document.getElementById('btn-search');
    if (search) {
      search.addEventListener('click', () => {
        render();
        toast('已套用篩選條件。');
      });
    }

    const clear = document.getElementById('btn-clear-filter');
    if (clear) {
      clear.addEventListener('click', () => {
        ['f-keyword', 'f-status', 'f-date-from', 'f-date-to'].forEach((id) => {
          const el = document.getElementById(id);
          if (!el) return;
          if (el.tagName === 'SELECT') el.selectedIndex = 0;
          else el.value = '';
        });
        render();
        toast('已清除所有篩選條件。');
      });
    }
  }

  function bindDefaults() {
    document.querySelectorAll('[data-go-admin]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const key = el.dataset.goAdmin;
        if (window.parent && window.parent.AdminRouter) {
          window.parent.AdminRouter.go(key);
        } else {
          location.href = key + '.html';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindNewCampaign();
    bindFilterControls();
    bindDefaults();
    render();
  });
})();
