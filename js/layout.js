/* ==========================================================
   layout.js - LINE OA Portal Master Frame 互動
   負責：iframe 內容切換、底部導覽 active 同步、Header 標題切換
   +    全站方案暫停攔截（讀 localStorage 'mgm_plan_paused_<plan>'）
   ========================================================== */

(function () {
  'use strict';

  // 各分頁設定（與 bottom nav 對應）
  const PAGES = {
    dashboard: { title: '理財通 MGM', file: 'pages/dashboard.html', showBack: false },
    'dashboard-empty': { title: '歡迎加入', file: 'pages/dashboard-empty.html', showBack: false },
    share: { title: '我要分享', file: 'pages/share.html', showBack: false },
    records: { title: '推廣紀錄', file: 'pages/records.html', showBack: false },
    rewards: { title: '我的獎金', file: 'pages/rewards.html', showBack: false },
    withdrawal: { title: '提領申請', file: 'pages/withdrawal.html', showBack: true },
    'profile-settings': { title: '個人設定', file: 'pages/profile-settings.html', showBack: true },
    'privacy-terms': { title: '個資使用條款', file: 'pages/privacy-terms.html', showBack: true },
    'share-rules': { title: '分享制度說明', file: 'pages/share-rules.html', showBack: true },
    'tax-info': { title: '扣繳憑單說明', file: 'pages/tax-info.html', showBack: true },
    'coming-soon': { title: '敬請期待', file: 'pages/coming-soon.html', showBack: false },
  };

  // 當方案暫停時，仍允許進入這些「已賺得獎金 / 提領」相關頁
  const ALWAYS_ALLOWED = new Set(['rewards', 'withdrawal', 'privacy-terms', 'tax-info', 'coming-soon']);

  // 離職員工前置驗證未完成時，路由層直接攔截這些功能頁
  const EX_PRECHECK_GATED = new Set(['share', 'rewards', 'withdrawal']);

  // 取得目前使用者身分對應之方案
  // 統一以 MGMCommon.resolvePlan() 為單一來源；fallback 仍優先讀 Person Profile。
  function getCurrentUserPlan() {
    if (window.MGMCommon && typeof window.MGMCommon.resolvePlan === 'function') {
      return window.MGMCommon.resolvePlan();
    }
    // fallback：MGMCommon 未載入時的最小化邏輯
    try {
      const raw = sessionStorage.getItem('mgm_person_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile && profile.userRole === 'Employee' && profile.employeeStatus === 'Active') {
          return 'employee';
        }
      }
      const ex = sessionStorage.getItem('mgm_login_identity');
      if (ex === '員工') return 'employee';
      const v = localStorage.getItem('mgm_current_user_plan');
      if (v === 'employee' || v === 'customer') return v;
    } catch {}
    return 'customer';
  }

  function isPlanPaused(plan) {
    try { return localStorage.getItem('mgm_plan_paused_' + plan) === '1'; } catch { return false; }
  }

  function getExPrecheckState() {
    if (window.MGMCommon && typeof window.MGMCommon.getExEmployeePrecheckState === 'function') {
      return window.MGMCommon.getExEmployeePrecheckState();
    }
    return { required: false, passed: true, reason: '' };
  }

  function isBlockedByExPrecheck(key) {
    if (!EX_PRECHECK_GATED.has(key)) return false;
    const check = getExPrecheckState();
    return check.required && !check.passed;
  }

  function isUserBlacklisted() {
    return !!(window.MGMCommon && window.MGMCommon.isCurrentUserBlacklisted && window.MGMCommon.isCurrentUserBlacklisted());
  }

  // 封鎖用戶：非首頁的底部導覽全部禁用
  function applyBlacklistNav() {
    const blocked = isUserBlacklisted();
    navItems.forEach((item) => {
      const isDashboard = item.dataset.page === 'dashboard';
      item.classList.toggle('nav-item--disabled', blocked && !isDashboard);
    });
  }

  function openExEmployeeEntryByPrecheck() {
    const msg = '離職員工需先完成 LINE 好友綁定與表單手機驗證，才可使用分享與提領功能。\n\n即將導向離職員工入口。';
    try { alert(msg); } catch {}
    try { window.location.href = 'ex-employee.html'; } catch {}
  }

  function resolveReferrerUidFallback() {
    // 與 admin-referrers demo 對應：
    // 會員 U10001、員工 U10025、離職員工 U10112、黑名單會員 U10293。
    try {
      const profile = (window.MGMCommon && typeof window.MGMCommon.resolvePersonProfile === 'function')
        ? window.MGMCommon.resolvePersonProfile()
        : null;
      if (profile && profile.uid) return profile.uid;
      const id = (window.MGMCommon && typeof window.MGMCommon.resolveIdentity === 'function')
        ? window.MGMCommon.resolveIdentity()
        : null;
      if (id === '離職員工') return 'U230620004';
      if (id === '員工') return 'U240105002';
      if (sessionStorage.getItem('mgm_blacklisted') === '1') return 'U250115005';
      return 'U250310001';
    } catch {
      return 'U250310001';
    }
  }

  // 更新 header 推薦人編號
  function updateReferrerUid() {
    if (!referrerUidEl) return;
    // 從 MGMCommon 獲取目前登入用戶的 UID
    let uid = null;
    if (window.MGMCommon && typeof window.MGMCommon.getCurrentLoginUid === 'function') {
      uid = window.MGMCommon.getCurrentLoginUid();
    }
    if (!uid) {
      uid = resolveReferrerUidFallback();
      try { sessionStorage.setItem('mgm_login_uid', uid); } catch {}
    }
    referrerUidEl.textContent = uid || '-';
  }

  // DOM 元素
  const iframe = document.getElementById('portal-iframe');
  const headerTitle = document.getElementById('portal-header-title');
  const backBtn = document.getElementById('portal-header-back');
  const referrerUidEl = document.getElementById('portal-header-referrer-uid');
  const navItems = document.querySelectorAll('.nav-item');

  let currentPage = 'dashboard';
  let historyStack = [];

  // 切換頁面
  function switchPage(key, fromNav = false) {
    let page = PAGES[key];
    if (!page) return;

    // === 封鎖帳號攔截：只能停在首頁 ===
    if (isUserBlacklisted() && key !== 'dashboard') {
      switchPage('dashboard');
      return;
    }

    // === 離職員工前置驗證攔截（路由層先擋，避免進入頁面才被擋） ===
    if (isBlockedByExPrecheck(key)) {
      openExEmployeeEntryByPrecheck();
      return;
    }

    // === 全站暫停攔截 ===
    const plan = getCurrentUserPlan();
    const paused = isPlanPaused(plan);
    let displayKey = key;
    if (paused && !ALWAYS_ALLOWED.has(key)) {
      page = PAGES['coming-soon'];
      displayKey = 'coming-soon';
    }

    if (currentPage !== key) {
      historyStack.push(currentPage);
    }
    currentPage = key;

    // 切換 iframe 來源
    iframe.src = page.file;

    // 更新標題
    if (headerTitle) headerTitle.textContent = page.title;

    // 顯示 / 隱藏返回鍵
    backBtn.style.visibility = page.showBack ? 'visible' : 'hidden';

    // 同步 header 推薦人編號
    updateReferrerUid();

    // 同步底部導覽 active 狀態（dashboard 與 dashboard-empty 共用首頁 tab）
    // 攔截到 coming-soon 時，仍保留原本 nav 的 active 狀態（讓使用者知道自己點了什麼）
    const navKey = key === 'dashboard-empty' ? 'dashboard' : key;
    navItems.forEach((item) => {
      item.classList.toggle('active', item.dataset.page === navKey);
    });

    // 寫入 URL hash（仍以使用者要去的 key 為準，方便重整時還原意圖）
    history.replaceState(null, '', '#' + key);
  }

  // 監聽底部導覽
  navItems.forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      switchPage(item.dataset.page, true);
    });
  });

  // 返回鍵
  backBtn.addEventListener('click', () => {
    const prev = historyStack.pop() || 'dashboard';
    switchPage(prev);
  });

  // 開放給 iframe 內頁呼叫（透過 parent.AppRouter.go('xxx')）
  window.AppRouter = {
    go: switchPage,
    pages: PAGES,
    getCurrentUserPlan,
    isPlanPaused,
    // demo: 切換身分後重新渲染目前頁
    setCurrentUserPlan(plan) {
      if (plan !== 'employee' && plan !== 'customer') return;
      try { localStorage.setItem('mgm_current_user_plan', plan); } catch {}
      // 重新觸發目前頁，讓暫停攔截即時反應
      switchPage(currentPage);
    },
  };

  // 監聽 hash 變化（讓 demo switcher 不需 reload 即可切頁）
  window.addEventListener('hashchange', () => {
    const key = (location.hash || '#dashboard').slice(1);
    if (PAGES[key] && key !== currentPage) switchPage(key);
  });

  // 監聽 storage 變化：當另一個分頁（admin）改了暫停狀態，這邊立即反應
  // 加 debounce 避免快速連續變更觸發多次 reload
  let storageDebounce = null;
  window.addEventListener('storage', (e) => {
    if (!e.key) return;
    if (
      e.key.startsWith('mgm_plan_paused_') ||
      e.key === 'mgm_current_user_plan' ||
      e.key === 'mgm_person_profile' ||
      e.key === 'mgm_login_identity' ||
      e.key === 'mgm_frozen_uids' ||
      e.key === 'mgm_ex_line_friend' ||
      e.key === 'mgm_ex_form_phone' ||
      e.key === 'mgm_login_phone'
    ) {
      clearTimeout(storageDebounce);
      storageDebounce = setTimeout(() => { switchPage(currentPage); applyBlacklistNav(); }, 250);
      updateReferrerUid();
    }
    // 推薦人編號變化
    if (e.key === 'mgm_login_uid') {
      updateReferrerUid();
    }
  });

  // 監聽 postMessage：iframe 內頁面在 file:// 協定下無法直接呼叫 parent.AppRouter
  // 改用 postMessage 通知 master frame 切換頁面
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'mgm:navigate' || !e.data.key) return;
    if (PAGES[e.data.key]) switchPage(e.data.key);
  });

  // 初次載入：依 hash 決定起始頁；封鎖用戶強制落在首頁
  const initial = (location.hash || '#dashboard').slice(1);
  switchPage(PAGES[initial] ? initial : 'dashboard');
  applyBlacklistNav();

  // 初始化推薦人編號
  updateReferrerUid();
})();
