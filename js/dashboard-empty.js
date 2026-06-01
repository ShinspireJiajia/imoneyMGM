/* ==========================================================
   dashboard-empty.js - 新會員首頁互動
   功能：複製連結、跳轉至分享頁、教學步驟引導
   ========================================================== */

(function () {
  'use strict';

  const REFERRER = {
    name: '陳新人',
    tag: '會員',
    code: 'NEW2026Q2',
    siteBase: 'https://yourwebsite.com/loan',
  };

  function getFullUrl() {
    return `${REFERRER.siteBase}?ref=${REFERRER.code}`;
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

  // 複製
  function copy(text, msg) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast(msg || '已複製'));
    } else {
      prompt('請手動複製：', text);
    }
  }

  function toast(msg) {
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

  // 跳轉（支援 http:// 與 file:// 雙環境）
  function goPage(key) {
    if (window.MGMCommon && window.MGMCommon.navigate) {
      window.MGMCommon.navigate(key);
      return;
    }
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'mgm:navigate', key: key }, '*');
        return;
      }
    } catch {}
    location.href = key + '.html';
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('referrer-name').textContent = REFERRER.name;
    document.getElementById('referrer-tag').textContent = REFERRER.tag;

    updateCampaignLabel();

    document.getElementById('btn-copy-link').addEventListener('click', () => {
      copy(getFullUrl(), '已複製推薦連結，可貼到 LINE / FB 分享');
    });

    document.getElementById('btn-welcome-share').addEventListener('click', () => goPage('share'));

    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (el.tagName === 'A') e.preventDefault();
        goPage(el.dataset.go);
      });
    });
  });
})();
