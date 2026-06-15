/* ==========================================================
   admin-employees.js - 員工帳號管理
   功能：員工清單、啟/停用、同步推薦人頁標籤
   離職判定：每日排程比對人員主檔，比對不到者自動標記為離職
   ========================================================== */

(function () {
  'use strict';

  // 最後一次排程同步時間（demo）
  const LAST_SYNC_AT = '2026/06/11 02:00:17';

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
      phone: '0945-678-901',
    },
    {
      id: 'E005',
      account: 'mei.wang@mgm.com',
      name: '王○梅',
      status: 'inactive',
      resignedAt: null,
      mgmJoined: false,
      referrerUid: null,
      phone: '0956-789-012',
    },
    {
      id: 'E006',
      account: 'chen.lin@mgm.com',
      name: '林○宸',
      status: 'active',
      resignedAt: null,
      mgmJoined: false,
      referrerUid: null,
      phone: '0967-890-123',
    },
  ];

  // 專屬推薦碼（keyed by referrerUid，僅 mgmJoined=true 員工）
  const EMP_SHARE_LINKS = {
    U240105002: [{ code: 'K3M5N7P', clicks: 318, submits: 36, status: 'active' }],
    U230620004: [{ code: 'X9Y8Z7W', clicks: 142, submits: 18, status: 'active' }],
    U240328006: [{ code: 'P3Q5R7S', clicks: 251, submits: 18, status: 'disabled' }],
  };

  // 對應案件（keyed by referrerUid）
  const EMP_CASES = {
    U240105002: [
      { caseId: 'M2026051504', refereePhone: '0933678111', refereeName: '張俊豪', submitAt: '2026/05/15', status: 'rewardable', refereeTag: '新客戶' },
      { caseId: 'M2026052712', refereePhone: '0941456209', refereeName: '宋雨恩', submitAt: '2026/05/27', status: 'pending_review', refereeTag: '新客戶' },
    ],
    U230620004: [
      { caseId: 'M2026050806', refereePhone: '0911455333', refereeName: '李文仁', submitAt: '2026/05/08', status: 'withdrawn', refereeTag: '新客戶' },
    ],
    U240328006: [],
  };

  const LINK_STATUS_LABEL = { active: '使用中', disabled: '已停用' };

  const CASE_PROGRESS_LABEL = {
    reviewing: '申請中', confirmed: '申請中', pending_review: '人工審核中',
    rewardable: '待提領', withdrawn: '已提領', invalid: '未符合資格',
  };

  const VIEW_PAGE_SIZE = 5;
  const evPagerState = { uid: '', links: 1, cases: 1 };

  function getPagedItems(items, page) {
    const totalPages = Math.max(1, Math.ceil(items.length / VIEW_PAGE_SIZE));
    const safePage = Math.min(Math.max(1, page), totalPages);
    return { pageItems: items.slice((safePage - 1) * VIEW_PAGE_SIZE, safePage * VIEW_PAGE_SIZE), safePage, totalPages };
  }

  function renderInnerPager(kind, totalCount, page) {
    const totalPages = Math.max(1, Math.ceil(totalCount / VIEW_PAGE_SIZE));
    if (totalPages <= 1) return '';
    return `
      <div class="view-inner-pager" data-pager-kind="${kind}">
        <button type="button" class="pg-btn" data-ev-page-kind="${kind}" data-ev-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>«</button>
        <span class="view-inner-pager-meta">第 ${page} / ${totalPages} 頁</span>
        <button type="button" class="pg-btn" data-ev-page-kind="${kind}" data-ev-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>»</button>
      </div>`;
  }

  function bindEvInnerPager(uid) {
    document.querySelectorAll('[data-ev-page-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.evPageKind;
        const page = Number(btn.dataset.evPage);
        if (!kind || !Number.isFinite(page)) return;
        evPagerState[kind] = page;
        if (kind === 'links') renderEvLinksTab(uid);
        if (kind === 'cases') renderEvCasesTab(uid);
      });
    });
  }

  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast('已複製到剪貼簿'));
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
      toast('已複製到剪貼簿');
    }
  }

  function renderEvLinksTab(uid) {
    const wrap = document.getElementById('ev-links-list');
    if (!wrap) return;
    const links = EMP_SHARE_LINKS[uid] || [];
    if (links.length === 0) {
      wrap.innerHTML = '<div class="view-empty">此員工尚無專屬推薦碼</div>';
      return;
    }
    const { pageItems, safePage } = getPagedItems(links, evPagerState.links);
    evPagerState.links = safePage;
    wrap.innerHTML = pageItems.map((l) => {
      const url = `https://yourwebsite.com/loan?ref=${l.code}`;
      return `
        <div class="view-link-row">
          <div class="view-link-main">
            <div class="view-link-code">${l.code}</div>
            <div class="view-link-url">${url}</div>
            <div class="view-link-meta">・ 點擊 ${l.clicks} ・ 成功送單 ${l.submits}</div>
          </div>
          <div class="view-link-aside">
            <span class="status-text status-${l.status === 'active' ? 'active' : 'frozen'}">${LINK_STATUS_LABEL[l.status] || l.status}</span>
            <button type="button" class="action-btn view-link-copy" data-url="${url}">複製連結</button>
          </div>
        </div>`;
    }).join('') + renderInnerPager('links', links.length, safePage);
    wrap.querySelectorAll('.view-link-copy').forEach((btn) =>
      btn.addEventListener('click', () => copyText(btn.dataset.url))
    );
    bindEvInnerPager(uid);
  }

  function renderEvCasesTab(uid) {
    const wrap = document.getElementById('ev-cases-list');
    if (!wrap) return;
    const cases = [...(EMP_CASES[uid] || [])].sort((a, b) =>
      new Date(b.submitAt || '').getTime() - new Date(a.submitAt || '').getTime()
    );
    if (cases.length === 0) {
      wrap.innerHTML = '<div class="view-empty">此員工尚無案件紀錄</div>';
      return;
    }
    const { pageItems, safePage } = getPagedItems(cases, evPagerState.cases);
    evPagerState.cases = safePage;
    const REFEREE_TAG_CLS = { '新客戶': 'badge-blue', '既有客戶': 'badge-gray' };
    wrap.innerHTML = `
      <table class="view-cases-table">
        <thead><tr><th>案號</th><th>被推薦人手機</th><th>被推薦人</th><th>身份</th><th>申請日期</th><th>申請進度</th></tr></thead>
        <tbody>${pageItems.map((c) => {
          const rtCls = REFEREE_TAG_CLS[c.refereeTag] || 'badge-gray';
          const rtBadge = c.refereeTag ? `<span class="tag-pill ${rtCls}" style="font-size:11px;">${c.refereeTag}</span>` : '—';
          return `<tr>
            <td class="mono">${c.caseId}</td>
            <td class="mono">${c.refereePhone || '—'}</td>
            <td>${c.refereeName}</td>
            <td>${rtBadge}</td>
            <td class="mono dim">${c.submitAt}</td>
            <td>${CASE_PROGRESS_LABEL[c.status] || '申請中'}</td>
          </tr>`;
        }).join('')}</tbody>
      </table>
      ${renderInnerPager('cases', cases.length, safePage)}`;
    bindEvInnerPager(uid);
  }

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

    const viewBtn = `<button type="button" class="action-btn" data-action="view" data-id="${emp.id}">檢視</button>`;

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
        <td>${viewBtn} ${toggleBtn}</td>
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
    document.querySelectorAll('[data-action="view"]').forEach((btn) => {
      btn.addEventListener('click', () => openViewModal(btn.dataset.id));
    });

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

  // ── 檢視 Modal ──────────────────────────────────────────
  const STATUS_LABEL_MAP = { active: '啟用', inactive: '停用', resigned: '離職員工' };

  function switchEvTab(tabKey, uid) {
    document.querySelectorAll('.view-tab[data-evtab]').forEach((t) =>
      t.classList.toggle('active', t.dataset.evtab === tabKey)
    );
    document.querySelectorAll('.view-pane[data-evpane]').forEach((p) => {
      p.hidden = p.dataset.evpane !== tabKey;
    });
    if (tabKey === 'links') renderEvLinksTab(uid);
    if (tabKey === 'cases') renderEvCasesTab(uid);
  }

  function openViewModal(id) {
    const emp = EMPLOYEES.find((e) => e.id === id);
    if (!emp) return;

    evPagerState.uid   = emp.referrerUid || '';
    evPagerState.links = 1;
    evPagerState.cases = 1;

    document.getElementById('emp-view-target').textContent = `${emp.name}（${emp.id}）`;
    document.getElementById('ev-id').textContent      = emp.id;
    document.getElementById('ev-account').textContent = emp.account;
    document.getElementById('ev-name').textContent    = emp.name;
    document.getElementById('ev-phone').textContent   = emp.phone || '—';
    document.getElementById('ev-status').textContent  = STATUS_LABEL_MAP[emp.status] || emp.status;

    const isResigned = emp.status === 'resigned';
    document.getElementById('ev-resigned-row').hidden = !isResigned;
    document.getElementById('ev-resigned-at').textContent = emp.resignedAt || '—';

    document.getElementById('ev-mgm-joined').textContent = emp.mgmJoined ? '已加入推薦' : '未加入';
    document.getElementById('ev-uid-row').hidden = !emp.referrerUid;
    document.getElementById('ev-uid').textContent = emp.referrerUid || '—';

    // 未加入 MGM 推薦則隱藏後兩個 tab
    const hasReferrer = !!emp.referrerUid;
    document.getElementById('ev-tab-links').hidden = !hasReferrer;
    document.getElementById('ev-tab-cases').hidden = !hasReferrer;

    // 重設回「基本資訊」tab
    switchEvTab('info', emp.referrerUid || '');

    document.getElementById('emp-view-modal').classList.add('show');
  }

  function initViewModal() {
    document.getElementById('btn-emp-view-close').addEventListener('click', () => {
      document.getElementById('emp-view-modal').classList.remove('show');
    });
    document.getElementById('emp-view-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
    });
    document.querySelectorAll('.view-tab[data-evtab]').forEach((tab) => {
      tab.addEventListener('click', () => switchEvTab(tab.dataset.evtab, evPagerState.uid));
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
    initViewModal();
    const syncEl = document.getElementById('last-sync-time');
    if (syncEl) syncEl.textContent = LAST_SYNC_AT;
  });
})();
