/* ==========================================================
   admin-layout.js - 後台 Master Frame 互動
   功能：sidebar 導頁切換、iframe 載入、麵包屑同步、sub-menu 展開、權限過濾
   ========================================================== */

(function () {
  'use strict';

  const PAGES = {
    'admin-campaigns': {
      title: '活動檔期管理',
      breadcrumb: '行銷設定 / 活動檔期管理',
      file: 'pages/admin-campaigns.html',
    },
    'admin-matrix': {
      title: '活動詳情',
      breadcrumb: '行銷設定 / 活動檔期管理 / 活動詳情',
      file: 'pages/admin-matrix.html',
    },
    'admin-share-rules': {
      title: '分享制度說明維護',
      breadcrumb: '行銷設定 / 分享制度說明維護',
      file: 'pages/admin-share-rules.html',
    },
    'admin-referrers': {
      title: '推薦人管理',
      breadcrumb: '會員管理 / 推薦人管理',
      file: 'pages/admin-referrers.html',
    },
    'admin-referrer-performance': {
      title: '推薦人行銷成效總覽',
      breadcrumb: '會員管理 / 推薦人行銷成效總覽',
      file: 'pages/admin-referrer-performance.html',
    },
    'admin-records': {
      title: '推薦案件管理',
      breadcrumb: '案件管理 / 推薦案件管理',
      file: 'pages/admin-records.html',
    },
    'admin-payout': {
      title: '推薦案件獎金核款',
      breadcrumb: '財務管理 / 推薦案件獎金核款',
      file: 'pages/admin-payout.html',
    },
    'admin-pending-review': {
      title: '超量待審佇列',
      breadcrumb: '財務管理 / 超量待審佇列',
      file: 'pages/admin-pending-review.html',
    },
    'admin-reports': {
      title: '推薦案件報表',
      breadcrumb: '案件管理 / 推薦案件報表',
      file: 'pages/admin-reports.html',
    },
    'admin-payments': {
      title: '提領功能管理',
      breadcrumb: '財務管理 / 提領功能管理',
      file: 'pages/admin-payments.html',
    },
    'admin-cash-payments': {
      title: '提領功能管理(現場提領)',
      breadcrumb: '財務管理 / 提領功能管理(現場提領)',
      file: 'pages/admin-cash-payments.html',
    },
    'admin-plan-switch': {
      title: '全站方案開關',
      breadcrumb: '風控管理 / 全站方案開關',
      file: 'pages/admin-plan-switch.html',
    },
    'admin-limits': {
      title: '每月提領上限設定',
      breadcrumb: '風控管理 / 每月提領上限設定',
      file: 'pages/admin-limits.html',
    },
    'admin-default': {
      title: '活動空窗期獎金設定',
      breadcrumb: '風控管理 / 活動空窗期獎金設定',
      file: 'pages/admin-default.html',
    },
    'admin-blacklist': {
      title: '黑名單管理',
      breadcrumb: '風控管理 / 黑名單管理',
      file: 'pages/admin-blacklist.html',
    },
    'admin-notify': {
      title: '推播通知管理',
      breadcrumb: '推播管理 / 推播通知管理',
      file: 'pages/admin-notify.html',
    },
    // ── 推播管理 獨立子頁 ──
    'notify-send': {
      title: '發送推播',
      breadcrumb: '推播管理 / 發送推播',
      file: 'pages/admin-notify-send.html',
    },
    'notify-schedule': {
      title: '排程推播',
      breadcrumb: '推播管理 / 排程推播',
      file: 'pages/admin-notify-schedule.html',
    },
    'notify-members': {
      title: '人員管理',
      breadcrumb: '推播管理 / 人員管理',
      file: 'pages/admin-notify-members.html',
    },
    'notify-groups': {
      title: '群組管理',
      breadcrumb: '推播管理 / 群組管理',
      file: 'pages/admin-notify-groups.html',
    },
    'notify-tags': {
      title: '標籤管理',
      breadcrumb: '推播管理 / 標籤管理',
      file: 'pages/admin-notify-tags.html',
    },
    'notify-settings': {
      title: '訊息樣板設定',
      breadcrumb: '推播管理 / 訊息樣板設定',
      file: 'pages/admin-notify-settings.html',
    },
    'notify-log': {
      title: '發送紀錄',
      breadcrumb: '推播管理 / 發送紀錄',
      file: 'pages/admin-notify-log.html',
    },
    'admin-faq': {
      title: '常見問答維護',
      breadcrumb: '內容管理 / 常見問答維護',
      file: 'pages/admin-faq.html',
    },
    // ── 系統管理 ──
    'sys-users': {
      title: '使用者管理',
      breadcrumb: '系統管理 / 使用者管理',
      file: 'pages/admin-sys-users.html',
    },
    'sys-roles': {
      title: '角色權限管理',
      breadcrumb: '系統管理 / 角色權限管理',
      file: 'pages/admin-sys-roles.html',
    },
    'sys-logs': {
      title: '操作紀錄查詢',
      breadcrumb: '系統管理 / 操作紀錄查詢',
      file: 'pages/admin-sys-logs.html',
    },
  };

  // ─── 角色與權限 ────────────────────────────────────────────
  const ROLES = {
    admin: { label: '系統管理員', perms: 'all' },
    marketer: {
      label: '行銷管理員',
      perms: ['notify-send', 'notify-schedule', 'notify-members', 'notify-groups', 'notify-tags', 'notify-log'],
    },
    viewer: {
      label: '唯讀',
      perms: ['notify-members', 'notify-log'],
    },
  };

  function getCurrentRole() {
    try { return localStorage.getItem('mgm_admin_role') || 'admin'; } catch { return 'admin'; }
  }

  function hasPermission(pageKey) {
    const role = ROLES[getCurrentRole()] || ROLES.admin;
    if (role.perms === 'all') return true;
    return role.perms.includes(pageKey);
  }

  // ─── 路由 ──────────────────────────────────────────────────
  const iframe   = document.getElementById('admin-iframe');
  const crumbEl  = document.getElementById('admin-breadcrumb');
  const navItems = document.querySelectorAll('.admin-nav-item[data-page]');

  function go(key) {
    const p = PAGES[key];
    if (!p) return;
    if (!hasPermission(key)) {
      alert('您目前的角色無此功能的存取權限。');
      return;
    }
    iframe.src = p.file;
    if (crumbEl) crumbEl.textContent = p.breadcrumb;
    navItems.forEach((it) => it.classList.toggle('active', it.dataset.page === key));
    // open parent sub-menu if the active item is inside a group
    const activeItem = document.querySelector(`.admin-nav-item[data-page="${key}"]`);
    if (activeItem) {
      const parentGroup = activeItem.closest('.admin-nav-group');
      if (parentGroup) setGroupOpen(parentGroup, true);
    }
    history.replaceState(null, '', '#' + key);
  }

  navItems.forEach((it) => {
    const key = it.dataset.page;
    // hide items the current role cannot access
    if (!hasPermission(key)) { it.style.display = 'none'; return; }
    it.addEventListener('click', (e) => { e.preventDefault(); go(key); });
  });

  window.AdminRouter = { go };

  // 初始
  const initial = (location.hash || '#admin-campaigns').slice(1);
  go(PAGES[initial] ? initial : 'admin-campaigns');

  // ─── Sub-menu 展開/收合 ─────────────────────────────────────
  function setGroupOpen(groupEl, open) {
    groupEl.classList.toggle('is-open', open);
    const chevron = groupEl.querySelector('.nav-grp-chevron');
    if (chevron) chevron.style.transform = open ? 'rotate(90deg)' : '';
  }

  document.querySelectorAll('.admin-nav-group-btn').forEach((btn) => {
    const group = btn.closest('.admin-nav-group');
    if (!group) return;
    btn.addEventListener('click', () => setGroupOpen(group, !group.classList.contains('is-open')));
  });

  // ─── Sidebar 收合 ────────────────────────────────────────
  const frame      = document.querySelector('.admin-frame');
  const toggleBtn  = document.getElementById('btn-sidebar-toggle');
  const STORAGE_KEY = 'mgm_admin_sidebar_collapsed';

  function setSidebarCollapsed(collapsed) {
    frame.classList.toggle('sidebar-collapsed', collapsed);
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    toggleBtn.title = collapsed ? '展開選單' : '收合選單';
    const icon = toggleBtn.querySelector('i');
    if (icon) icon.className = collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-left';
    try { localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0'); } catch {}
  }

  if (toggleBtn && frame) {
    toggleBtn.addEventListener('click', () =>
      setSidebarCollapsed(!frame.classList.contains('sidebar-collapsed'))
    );
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setSidebarCollapsed(true);
    } catch {}
  }
})();
