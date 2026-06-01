/* ==========================================================
   admin-employees.js - 員工帳號管理
   功能：員工清單、啟/停用、設為離職員工、同步推薦人頁標籤
   ========================================================== */

(function () {
  'use strict';

  // 員工主檔 demo
  // mgmJoined: 是否已透過前台完成身分綁定並出現在推薦人清單
  // referrerUid: 對應推薦人清單中的會員編號（mgmJoined=true 才有）
  const EMPLOYEES = [
    {
      id: 'E001',
      account: 'dahua.li@mgm.com',
      name: '李大華',
      status: 'active',
      resignedAt: null,
      mgmJoined: true,
      referrerUid: 'U240105002',
      phone: '0912-345-678',
    },
    {
      id: 'E002',
      account: 'mentor.chen@mgm.com',
      name: '陳前輩',
      status: 'resigned',
      resignedAt: '2026/04/12',
      mgmJoined: true,
      referrerUid: 'U230620004',
      phone: '0923-456-789',
    },
    {
      id: 'E003',
      account: 'yiying.li@mgm.com',
      name: '李○穎',
      status: 'resigned',
      resignedAt: '2026/03/28',
      mgmJoined: true,
      referrerUid: 'U240328006',
      phone: '0934-567-890',
    },
    {
      id: 'E004',
      account: 'wei.zhang@mgm.com',
      name: '張○偉',
      status: 'active',
      resignedAt: null,
      mgmJoined: false,
      referrerUid: null,
      phone: null,
    },
    {
      id: 'E005',
      account: 'mei.wang@mgm.com',
      name: '王○梅',
      status: 'inactive',
      resignedAt: null,
      mgmJoined: false,
      referrerUid: null,
      phone: null,
    },
    {
      id: 'E006',
      account: 'chen.lin@mgm.com',
      name: '林○宸',
      status: 'active',
      resignedAt: null,
      mgmJoined: false,
      referrerUid: null,
      phone: null,
    },
  ];

  // ── localStorage ──────────────────────────────────────────
  // key: mgm_employees_state
  // value: { [id]: { status, resignedAt, mgmJoined, referrerUid } }
  // 推薦人頁讀此 key 判斷哪些推薦人需改為「離職員工」標籤

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem('mgm_employees_state') || '{}');
      EMPLOYEES.forEach((emp) => {
        if (saved[emp.id]) {
          emp.status      = saved[emp.id].status      ?? emp.status;
          emp.resignedAt  = saved[emp.id].resignedAt  ?? emp.resignedAt;
          emp.mgmJoined   = saved[emp.id].mgmJoined   ?? emp.mgmJoined;
          emp.referrerUid = saved[emp.id].referrerUid ?? emp.referrerUid;
        }
      });
    } catch {}
  }

  function saveState() {
    try {
      const state = {};
      EMPLOYEES.forEach((emp) => {
        state[emp.id] = {
          status:      emp.status,
          resignedAt:  emp.resignedAt || null,
          mgmJoined:   emp.mgmJoined,
          referrerUid: emp.referrerUid || null,
        };
      });
      localStorage.setItem('mgm_employees_state', JSON.stringify(state));
    } catch {}
  }

  // ── 篩選狀態 ────────────────────────────────────────────
  const filterState = { account: '', name: '', status: 'all' };

  function getFiltered() {
    return EMPLOYEES.filter((emp) => {
      if (filterState.account && !emp.account.toLowerCase().includes(filterState.account.toLowerCase())) return false;
      if (filterState.name && !emp.name.includes(filterState.name)) return false;
      if (filterState.status !== 'all' && emp.status !== filterState.status) return false;
      return true;
    });
  }

  // ── 渲染 ────────────────────────────────────────────────
  const STATUS_TEXT = {
    active:   '啟用',
    inactive: '停用',
    resigned: '離職員工',
  };

  function renderRow(emp) {
    const isResigned = emp.status === 'resigned';
    const isActive   = emp.status === 'active';
    const statusCls  = isResigned ? 'status-warning' : isActive ? 'status-active' : 'status-frozen';

    const toggleBtn = isResigned
      ? ''
      : isActive
        ? `<button type="button" class="action-btn" data-action="set-inactive" data-id="${emp.id}">停用</button>`
        : `<button type="button" class="action-btn success" data-action="set-active" data-id="${emp.id}">啟用</button>`;

    const resignBtn = isResigned
      ? ''
      : `<button type="button" class="action-btn danger" data-action="set-resigned"
           data-id="${emp.id}" data-name="${emp.name}">設為離職員工</button>`;

    const mgmBadge = emp.mgmJoined
      ? `<span class="emp-badge emp-badge-joined">已加入推薦</span>`
      : `<span class="emp-badge emp-badge-none">未加入</span>`;

    const phoneCell = emp.phone
      ? `<span class="mono">${emp.phone}</span>`
      : `<span class="dim">—</span>`;

    return `
      <tr class="${isResigned ? 'emp-resigned-row' : ''}">
        <td class="mono">${emp.account}</td>
        <td class="cell-name">${emp.name}</td>
        <td>${phoneCell}</td>
        <td><span class="status-text ${statusCls}">${STATUS_TEXT[emp.status] || emp.status}</span></td>
        <td class="mono dim">${emp.resignedAt || '—'}</td>
        <td>${mgmBadge}</td>
        <td>${toggleBtn}${resignBtn}</td>
      </tr>`;
  }

  function render() {
    const tbody = document.getElementById('employees-tbody');
    const items = getFiltered();
    tbody.innerHTML = items.length
      ? items.map(renderRow).join('')
      : '<tr><td colspan="7" style="padding:30px;text-align:center;color:var(--color-text-muted);">沒有符合條件的員工</td></tr>';
    const pg = document.getElementById('emp-pg-total');
    if (pg) pg.textContent = items.length;
    bindRowActions();
  }

  // ── 操作 ────────────────────────────────────────────────
  function bindRowActions() {
    document.querySelectorAll('[data-action="set-active"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emp = EMPLOYEES.find((e) => e.id === btn.dataset.id);
        if (!emp || emp.status === 'resigned') return;
        emp.status = 'active';
        saveState();
        render();
        toast('帳號已啟用');
      });
    });

    document.querySelectorAll('[data-action="set-inactive"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emp = EMPLOYEES.find((e) => e.id === btn.dataset.id);
        if (!emp || emp.status === 'resigned') return;
        emp.status = 'inactive';
        saveState();
        render();
        toast('帳號已停用', 'var(--color-warning-dark)');
      });
    });

    document.querySelectorAll('[data-action="set-resigned"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const emp = EMPLOYEES.find((e) => e.id === btn.dataset.id);
        if (!emp) return;
        if (
          !confirm(
            `確定要將「${btn.dataset.name}」設為離職員工？\n` +
            `設定後，若該員工已取得推薦資格，其推薦人清單標籤將同步更新為「離職員工」。\n` +
            `此操作無法在本頁還原。`
          )
        ) return;

        const today = new Date();
        const resignedAt = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
        emp.status = 'resigned';
        emp.resignedAt = resignedAt;
        saveState();
        render();

        const hint = emp.mgmJoined
          ? `（推薦人清單中「${btn.dataset.name}」的身分標籤已同步更新）`
          : '（該員工尚未加入 MGM 推薦，待前台完成身分綁定後自動歸入）';
        toast(`已將「${btn.dataset.name}」設為離職員工 ${hint}`);
      });
    });
  }

  // ── 篩選綁定 ────────────────────────────────────────────
  function syncFilter() {
    filterState.account = document.getElementById('f-account').value.trim();
    filterState.name    = document.getElementById('f-name').value.trim();
    filterState.status  = document.getElementById('f-status').value;
  }

  function bindFilters() {
    document.getElementById('btn-search').addEventListener('click', () => {
      syncFilter();
      render();
    });

    document.getElementById('f-status').addEventListener('change', () => {
      syncFilter();
      render();
    });

    ['f-account', 'f-name'].forEach((id) => {
      document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        syncFilter();
        render();
      });
    });
  }

  // ── Toast ────────────────────────────────────────────────
  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;max-width:420px;line-height:1.5;';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3200);
  }

  // ── Init ─────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadState();
    bindFilters();
    render();
  });
})();
