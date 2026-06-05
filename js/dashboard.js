/* ==========================================================
   dashboard.js - 推薦人儀表板互動
   功能：複製推薦連結、推薦碼倒數計時、快速入口導頁
   ========================================================== */

(function () {
  'use strict';

  // 推薦人資料（demo 用，正式環境改由 API 取得）
  // 每位推薦人擁有一組固定推薦碼，可長期使用、無需更換
  const REFERRER = {
    name: '王小毅',
    tag: '會員',
    code: 'A1B2C3D',
    siteBase: 'https://yourwebsite.com/loan',
  };

  // 解析目前登入身分（員工 / 離職員工 / 會員）— 統一委派給 MGMCommon
  function resolveIdentity() {
    if (window.MGMCommon && window.MGMCommon.resolveIdentity) return window.MGMCommon.resolveIdentity();
    try {
      const raw = sessionStorage.getItem('mgm_person_profile');
      if (raw) {
        const profile = JSON.parse(raw);
        if (profile && profile.userRole === 'Employee' && profile.employeeStatus === 'Active') return '員工';
        if (profile && profile.employeeFlag === 'Y' && profile.employeeStatus === 'Resigned') return '離職員工';
      }
      const ex = sessionStorage.getItem('mgm_login_identity');
      if (ex === '員工' || ex === '離職員工' || ex === '會員') return ex;
      const plan = localStorage.getItem('mgm_current_user_plan');
      if (plan === 'employee') return '員工';
    } catch {}
    return '會員';
  }
  function resolveDisplayName() {
    if (window.MGMCommon && window.MGMCommon.resolveDisplayName) return window.MGMCommon.resolveDisplayName(REFERRER.name);
    try {
      const explicit = sessionStorage.getItem('mgm_login_name');
      if (explicit) return explicit;
    } catch {}
    return REFERRER.name;
  }
  function tagCls(tag) {
    if (tag === '員工') return 'tag-employee';
    if (tag === '離職員工') return 'tag-ex-employee';
    return 'tag-customer';
  }

  function isBlacklisted() {
    return !!(window.MGMCommon && window.MGMCommon.isCurrentUserBlacklisted && window.MGMCommon.isCurrentUserBlacklisted());
  }

  function getCurrentUid() {
    try {
      return sessionStorage.getItem('mgm_login_uid') || '';
    } catch {
      return '';
    }
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 10) return '—';
    return phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 *** $3');
  }

  // 顯示「當期活動名稱」（點擊跳轉至分享頁）
  // 已移除原本的活動結束日倒數，僅保留檔期 eyebrow 文字
  function updateCampaignLabel() {
    const meta = document.getElementById('code-campaign-name');
    if (!meta) return;
    const camp = window.MGMCommon && window.MGMCommon.getActiveCampaign
      ? window.MGMCommon.getActiveCampaign()
      : { name: '2026 Q2 初夏推薦大賞' };
    meta.textContent = camp.name;
  }

  // 獎金總覽（與 /rewards 頁面同一資料源）
  function updateRewardsSummary() {
    if (!(window.MGMCommon && window.MGMCommon.getRewardsOverview)) return;
    const { available, pendingCount, withdrawn } = window.MGMCommon.getRewardsOverview();
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('rs-available', available.toLocaleString());
    set('rs-pending-count', pendingCount);
    set('rs-withdrawn', withdrawn.toLocaleString());
  }

  function getFullUrl() {
    return `${REFERRER.siteBase}?ref=${REFERRER.code}`;
  }

  // 複製推薦連結
  function copyLink() {
    const url = getFullUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('已複製推薦連結，可貼到 LINE / FB 分享'))
      .catch(() => prompt('請手動複製此連結：', url));
  }

  // 簡易 Toast
  function showToast(msg) {
    let t = document.getElementById('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
        'background:#1f2937;color:#fff;padding:10px 18px;border-radius:24px;' +
        'font-size: 14px;z-index:9999;opacity:0;transition:opacity .2s;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => (t.style.opacity = '0'), 1800);
  }

  // 導向父框架的其他頁面（支援 http:// 與 file:// 雙環境）
  function goPage(key) {
    if (window.MGMCommon && window.MGMCommon.navigate) {
      window.MGMCommon.navigate(key);
      return;
    }
    // fallback
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'mgm:navigate', key: key }, '*');
        return;
      }
    } catch {}
    location.href = key + '.html';
  }

  function applyIdentity() {
    const tag = resolveIdentity();
    const name = resolveDisplayName();
    const blocked = isBlacklisted();
    const nameEl = document.getElementById('referrer-name');
    const tagEl = document.getElementById('referrer-tag');
    if (nameEl) nameEl.textContent = name;
    if (tagEl) {
      tagEl.textContent = blocked ? '會員 ‧ 已凍結' : tag;
      const wrap = tagEl.closest('.profile-tag');
      if (wrap) {
        wrap.classList.remove('tag-customer', 'tag-employee', 'tag-ex-employee', 'tag-blacklisted');
        wrap.classList.add(blocked ? 'tag-blacklisted' : tagCls(tag));
      }
    }

    // 黑名單會員：與離職員工互斥，黑名單優先
    const codeCard = document.getElementById('code-card');
    const blNotice = document.getElementById('bl-notice-card');
    const rewardsSummary = document.getElementById('rewards-summary');
    const quickSection = document.getElementById('quick-section');

    if (blocked) {
      if (codeCard) codeCard.hidden = true;
      if (blNotice) blNotice.hidden = false;
      if (rewardsSummary) rewardsSummary.hidden = true;
      if (quickSection) quickSection.hidden = true;
      updateBlacklistStats();
    } else {
      if (codeCard) codeCard.hidden = false;
      if (blNotice) blNotice.hidden = true;
      if (rewardsSummary) rewardsSummary.hidden = false;
      if (quickSection) quickSection.hidden = false;
    }
  }

  // 黑名單會員：顯示已放行 / 待放行統計
  function updateBlacklistStats() {
    if (!(window.MGMCommon && window.MGMCommon.getRewardsDemo)) return;
    const list = window.MGMCommon.getRewardsDemo();
    let releasedCnt = 0, releasedAmt = 0, frozenCnt = 0, frozenAmt = 0;
    list.forEach((r) => {
      if (r.blacklistFrozen) {
        frozenCnt++; frozenAmt += r.amount;
      } else if (r.status === 'rewardable') {
        releasedCnt++; releasedAmt += r.amount;
      }
    });
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('bnc-released-count', releasedCnt);
    set('bnc-released-amount', '$' + releasedAmt.toLocaleString());
    set('bnc-frozen-count', frozenCnt);
    set('bnc-frozen-amount', '$' + frozenAmt.toLocaleString());
  }

  // ---------- C2：本月提領上限進度條 ----------
  // 從 rewards.js 用 sessionStorage 寫入之「本月累計」讀取，無資料則用 demo 數字
  function updateMonthlyProgress() {
    const card = document.getElementById('month-progress-card');
    if (!card) return;
    const limits = (window.MGMCommon && window.MGMCommon.getMonthlyLimits)
      ? window.MGMCommon.getMonthlyLimits()
      : { amount: 50000, count: 5 };
    // 已申請金額 / 件數（rewards 寫入；fallback 用 demo）
    let usedAmount = 0, usedCount = 0;
    try {
      const cached = JSON.parse(sessionStorage.getItem('mgm_monthly_usage') || '{}');
      if (typeof cached.amount === 'number') usedAmount = cached.amount;
      if (typeof cached.count === 'number') usedCount = cached.count;
    } catch {}
    // demo fallback：若 session 無，使用一個有意義的數字
    if (usedAmount === 0 && usedCount === 0) {
      usedAmount = 9000;
      usedCount = 1;
    }

    const range = window.MGMCommon ? window.MGMCommon.monthRange() : null;
    const pEl = document.getElementById('mpc-period');
    if (pEl && range) {
      pEl.textContent = `${range.yyyymm} 1 日 ~ 月底`;
    }

    const amtPct = limits.amount ? Math.min(100, (usedAmount / limits.amount) * 100) : 0;
    const cntPct = limits.count ? Math.min(100, (usedCount / limits.count) * 100) : 0;
    const pct = Math.max(amtPct, cntPct);

    document.getElementById('mpc-amount-text').textContent =
      `$${usedAmount.toLocaleString()} / $${limits.amount.toLocaleString()}`;
    document.getElementById('mpc-count-text').textContent =
      `${usedCount} / ${limits.count}`;
    const fill = document.getElementById('mpc-bar-fill');
    if (fill) {
      fill.style.width = pct + '%';
      fill.className = pct >= 100 ? 'mpc-bar-fill mpc-bar-over'
        : pct >= 80 ? 'mpc-bar-fill mpc-bar-warn'
        : 'mpc-bar-fill';
    }
    // 超額提示
    const hint = document.getElementById('mpc-hint');
    if (hint) {
      if (usedAmount >= limits.amount || usedCount >= limits.count) {
        hint.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>' +
          ' 本月已達上限，新增送單將進入「<strong>超量待審佇列</strong>」由風控人員審核。';
        hint.classList.add('mpc-hint-over');
      } else {
        hint.classList.remove('mpc-hint-over');
      }
    }
  }

  // ============================================================
  // 常見問答 FAQ
  // ============================================================
  const FAQ_KEY = 'mgm_faq_items';

  const DEFAULT_FAQ = [
    {
      id: 'faq-1',
      question: '如何取得我的推薦連結？',
      answer: '<p>請在首頁點選「複製連結」按鈕，系統即會將您的專屬推薦連結複製至剪貼簿，您可以直接貼到 LINE、FB 等社群平台分享給親友。</p>',
      enabled: true,
    },
    {
      id: 'faq-2',
      question: '推薦獎金何時可以提領？',
      answer: '<p>當您推薦的親友成功送出申請並通過審核後，獎金會顯示為「可提領」狀態。請前往「我的獎金」頁面選擇提領方式（現場領取或匯款入帳）。</p>',
      enabled: true,
    },
    {
      id: 'faq-3',
      question: '一組推薦碼可以無限次分享嗎？',
      answer: '<p>是的，您的推薦碼為<strong>固定碼</strong>，可長期、無限次使用。每位親友的歸屬以首次送單時使用的推薦碼為準，同一親友重複送單不會重複計算獎金。</p>',
      enabled: true,
    },
    {
      id: 'faq-4',
      question: '如何確認推薦是否成功登錄？',
      answer: '<p>您可前往底部「紀錄」頁面查看所有透過您連結送出的案件，包含「審核中」、「已核款」及「未通過」等狀態，並可查看對應獎金明細。</p>',
      enabled: true,
    },
    {
      id: 'faq-5',
      question: '獎金需要申報稅務嗎？',
      answer: '<p>推薦獎金將計入年度「執行業務所得／其他所得」申報。超過免稅門檻時，平台將於每年二月提供所得資料協助申報，請留意相關通知。</p>',
      enabled: true,
    },
  ];

  function loadFaq() {
    try {
      const stored = localStorage.getItem(FAQ_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_FAQ;
  }

  function renderFaq() {
    const container = document.getElementById('faq-list');
    if (!container) return;
    const items = loadFaq().filter(function (f) { return f.enabled !== false; });
    if (!items.length) {
      container.innerHTML = '<p class="faq-empty">暫無問答資料</p>';
      return;
    }
    container.innerHTML = items.map(function (f) {
      return (
        '<div class="faq-item" data-faq-id="' + f.id + '" role="listitem">' +
          '<div class="faq-q" role="button" tabindex="0" aria-expanded="false">' +
            '<span class="faq-q-text">' + f.question + '</span>' +
            '<span class="faq-q-icon" aria-hidden="true"><i class="fa-solid fa-chevron-down"></i></span>' +
          '</div>' +
          '<div class="faq-a">' + f.answer + '</div>' +
        '</div>'
      );
    }).join('');

    container.querySelectorAll('.faq-q').forEach(function (q) {
      q.addEventListener('click', function () { toggleFaq(q.closest('.faq-item')); });
      q.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFaq(q.closest('.faq-item')); }
      });
    });
  }

  function toggleFaq(item) {
    const isOpen = item.classList.contains('faq-open');
    item.classList.toggle('faq-open', !isOpen);
    const q = item.querySelector('.faq-q');
    if (q) q.setAttribute('aria-expanded', String(!isOpen));
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    applyIdentity();
    updateCampaignLabel();
    updateRewardsSummary();
    renderFaq();

    // 本月提領上限進度條已依需求移除（用戶端不顯示）

    document.getElementById('btn-copy-link').addEventListener('click', copyLink);

    document.querySelectorAll('[data-go]').forEach((el) => {
      // 元素本身若為錨點（a），preventDefault 避免 hash 跳轉造成雙重切換
      el.addEventListener('click', (e) => {
        if (el.tagName === 'A') e.preventDefault();
        goPage(el.dataset.go);
      });
    });

    // 獎金總覽現已內嵌至 profile-card 為 <a> 元素，Enter 鍵由 [data-go] 通用 handler 處理
    // 跨頁同步：另一視窗變更登入身分時即時更新
    window.addEventListener('storage', (e) => {
      if (e.key === 'mgm_current_user_plan' || e.key === 'mgm_login_identity' || e.key === 'mgm_person_profile') {
        applyIdentity();
        updateCampaignLabel();
      }
      if (e.key === 'mgm_monthly_amount_limit' || e.key === 'mgm_monthly_count_limit') {
        updateMonthlyProgress();
      }
      // 提領申請狀態變動時，更新獎金總覽
      if (e.key === 'mgm_pending_withdraw_apply') {
        updateRewardsSummary();
      }
      // 黑名單放行清單更新時，刷新封鎖卡片統計
      if (e.key === 'mgm_blacklist_released_ids' || e.key === 'mgm_frozen_uids') {
        applyIdentity();
        updateRewardsSummary();
      }
      // 後台更新 FAQ 時，同步刷新前台
      if (e.key === FAQ_KEY) {
        renderFaq();
      }
    });
  });
})();
