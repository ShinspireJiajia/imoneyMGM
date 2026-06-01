/* ==========================================================
   share.js - 分享頁互動
   功能：產生 QR Code（使用 Google Chart API）、複製連結、開啟原生分享 / 社群連結
   ========================================================== */

(function () {
  'use strict';

  const REFERRAL = {
    code: 'A1B2C3D',
    siteBase: 'https://yourwebsite.com/loan',
  };

  function getFullUrl() {
    return `${REFERRAL.siteBase}?ref=${REFERRAL.code}`;
  }

  // 動態產生 QR Code（使用 quickchart 服務，免額外載入 js library）
  function renderQR() {
    const url = encodeURIComponent(getFullUrl());
    const img = document.getElementById('qr-img');
    if (img) {
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${url}&color=7C3AED`;
      img.alt = `推薦碼 ${REFERRAL.code} QR Code`;
    }
  }

  // 複製連結
  function copy(text, successMsg) {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(text)
        .then(() => toast(successMsg || '已複製'))
        .catch(() => fallbackCopy(text, successMsg));
    } else {
      fallbackCopy(text, successMsg);
    }
  }

  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      toast(msg || '已複製');
    } catch {
      prompt('請手動複製：', text);
    }
    document.body.removeChild(ta);
  }

  // Toast 提示
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

  // ---------- 載入分享頁活動文案 ----------
  // 目前需求改為單一版本文案，不再依登入身分切換會員版 / 員工版。
  const DEFAULT_CAMPAIGN_CONTENT = `
    <h2>分享就有機會獲得推薦獎金</h2>
    <p>將您的專屬連結分享給有資金需求的親友，當對方完成指定流程並符合資格，系統即會依活動辦法提供分享獎金回饋。</p>
  `.trim();

  function loadCampaignContent() {
    return DEFAULT_CAMPAIGN_CONTENT;
  }

  function renderCampaignContent() {
    const el = document.getElementById('campaign-content');
    if (el) el.innerHTML = loadCampaignContent();
  }

  function refreshAll() {
    renderCampaignContent();
  }

  // 凍結會員：帳戶被凍結時，分享功能停用
  function applyFrozenLock() {
    const frozen = !!(window.MGMCommon && window.MGMCommon.isCurrentUserBlacklisted && window.MGMCommon.isCurrentUserBlacklisted());
    const wrap = document.getElementById('share-main-wrap');
    const frozenCard = document.getElementById('frozen-locked-card');
    if (wrap && frozen) wrap.hidden = true;
    if (frozenCard) frozenCard.hidden = !frozen;
    return frozen;
  }

  // 離職員工前置驗證未完成：禁止進入分享主功能
  function applyExPrecheckGate() {
    const check = (window.MGMCommon && window.MGMCommon.getExEmployeePrecheckState)
      ? window.MGMCommon.getExEmployeePrecheckState()
      : { required: false, passed: true, reason: '' };
    if (!check.required || check.passed) return false;

    const wrap = document.getElementById('share-main-wrap');
    const gate = document.getElementById('ex-precheck-card');
    if (wrap) wrap.hidden = true;
    if (gate) gate.hidden = false;
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 離職員工前置驗證守門
    if (applyExPrecheckGate()) {
      return;
    }

    // 凍結會員檢查
    const frozen = applyFrozenLock();
    if (frozen) {
      document.querySelectorAll('[data-go]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.MGMCommon && window.MGMCommon.navigate) {
            window.MGMCommon.navigate(el.dataset.go);
          }
        });
      });
      return;
    }

    renderQR();
    refreshAll();

    document.getElementById('btn-copy-url').addEventListener('click', () => {
      copy(getFullUrl(), '已複製推薦連結');
    });

    // 跨頁同步：身分切換或活動變更時即時更新
    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (e.key === 'mgm_frozen_uids' || e.key === 'mgm_blacklisted') {
        if (applyFrozenLock()) return;
      }
      if (e.key === 'mgm_person_profile' || e.key === 'mgm_ex_line_friend' || e.key === 'mgm_ex_form_phone' || e.key === 'mgm_login_phone') {
        if (applyExPrecheckGate()) return;
      }
      if (e.key === 'mgm_campaign_content') {
        if (applyExPrecheckGate()) return;
        if (applyFrozenLock()) return;
        refreshAll();
      }
    });
  });
})();
