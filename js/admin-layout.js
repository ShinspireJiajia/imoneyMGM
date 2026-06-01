/* ==========================================================
   admin-layout.js - 後台 Master Frame 互動
   功能：sidebar 導頁切換、iframe 載入、麵包屑同步
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
    'admin-employees': {
      title: '員工帳號管理',
      breadcrumb: '會員管理 / 員工帳號管理',
      file: 'pages/admin-employees.html',
    },
    'admin-referrers': {
      title: '推薦人管理',
      breadcrumb: '會員管理 / 推薦人管理',
      file: 'pages/admin-referrers.html',
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
  };

  const iframe = document.getElementById('admin-iframe');
  const titleEl = document.getElementById('admin-page-title');     // 已移除，留 null 守護
  const crumbEl = document.getElementById('admin-breadcrumb');     // 同上
  const navItems = document.querySelectorAll('.admin-nav-item[data-page]');

  function go(key) {
    const p = PAGES[key];
    if (!p) return;
    iframe.src = p.file;
    if (titleEl) titleEl.textContent = p.title;
    if (crumbEl) crumbEl.textContent = p.breadcrumb;
    navItems.forEach((it) => it.classList.toggle('active', it.dataset.page === key));
    history.replaceState(null, '', '#' + key);
  }

  navItems.forEach((it) =>
    it.addEventListener('click', (e) => {
      e.preventDefault();
      go(it.dataset.page);
    })
  );

  window.AdminRouter = { go };

  // 初始
  const initial = (location.hash || '#admin-campaigns').slice(1);
  go(PAGES[initial] ? initial : 'admin-campaigns');
})();
