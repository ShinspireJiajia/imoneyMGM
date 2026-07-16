/* ==========================================================
   share.js - 分享頁互動
   功能：產生 QR Code（使用 Google Chart API）、複製連結、開啟原生分享 / 社群連結
   ========================================================== */

(function () {
  'use strict';

  const REFERRAL = {
    code: 'A1B2C3D',
    // 分享管道一：官網「免費一對一諮詢」表單入口（帶入推薦碼）
    consultBase: 'https://www.imoney.com.tw/free-basic-consultation',
    consultQuery: 'contact-item=credit-loans',
    // 分享管道二：MGM 首頁（邀請好友加入推薦團隊，帶入推薦碼）
    // 正式上線請替換為實際網域
    mgmHomeBase: 'https://yourwebsite.com/index.html',
  };

  function getConsultUrl() {
    return `${REFERRAL.consultBase}?${REFERRAL.consultQuery}&ref=${REFERRAL.code}`;
  }

  function getInviteUrl() {
    return `${REFERRAL.mgmHomeBase}?ref=${REFERRAL.code}`;
  }

  const CONSULT_MSG_TEMPLATE = (url) =>
    `最近發現一個不錯的免費諮詢服務，分享給剛好有資金周轉、理財需求的朋友！\n\n只要點擊下方連結就可以申請「免費一對一諮詢」，會有專業顧問幫你評估最適合的銀行方案。評估過程完全不收費，如果有需要的話可以多加利用，省去自己一家家銀行比較的麻煩喔！\n👉 免費諮詢申請傳送門：${url}`;

  const INVITE_MSG_TEMPLATE = (url) =>
    `想跟你分享一個輕鬆賺獎金的機會！我最近加入了理財通 MGM 推薦計畫，只要分享連結給有資金需求的朋友，成功媒合後就有機會領取分享獎金 🎉\n\n如果你也想一起加入賺獎金，用我的專屬連結申請成為推薦人，不用額外花費，多一份收入來源！\n👉 加入理財通 MGM 傳送門：${url}`;

  // 動態產生 QR Code（使用 qrserver 服務，免額外載入 js library）
  function renderQrInto(imgId, url, alt) {
    const img = document.getElementById(imgId);
    if (!img) return;
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}&color=7C3AED`;
    img.alt = alt;
  }

  function renderQR() {
    renderQrInto('qr-consult-img', getConsultUrl(), '免費諮詢連結 QR Code');
    renderQrInto('qr-invite-img', getInviteUrl(), 'MGM 推薦團隊邀請連結 QR Code');
  }

  function renderLinks() {
    const consultInput = document.getElementById('consult-link-input');
    if (consultInput) consultInput.value = getConsultUrl();
    const inviteInput = document.getElementById('invite-link-input');
    if (inviteInput) inviteInput.value = getInviteUrl();
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

  // ---------- QR Code 放大彈窗 / 複製圖片 ----------
  function copyImageFromUrl(url) {
    if (!(navigator.clipboard && window.ClipboardItem)) {
      toast('此瀏覽器不支援複製圖片，請長按圖片另存');
      return;
    }
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]))
      .then(() => toast('已複製圖片'))
      .catch(() => toast('複製圖片失敗，請長按圖片另存'));
  }

  function initQrModal() {
    const overlay = document.getElementById('qr-modal-overlay');
    const modalImg = document.getElementById('qr-modal-img');
    const modalTitle = document.getElementById('qr-modal-title');
    const closeBtn = document.getElementById('qr-modal-close');
    const copyBtn = document.getElementById('qr-modal-copy-btn');
    if (!overlay || !modalImg) return;

    function open(imgSrc, title) {
      modalImg.src = imgSrc;
      modalTitle.textContent = title || 'QR Code';
      overlay.hidden = false;
    }
    function close() {
      overlay.hidden = true;
    }

    document.querySelectorAll('.channel-qr-wrap').forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const img = trigger.querySelector('img');
        if (img && img.src) open(img.src, trigger.dataset.qrTitle);
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (modalImg.src) copyImageFromUrl(modalImg.src);
      });
    }
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
    renderLinks();
    initQrModal();
    refreshAll();

    document.getElementById('btn-copy-code').addEventListener('click', () => {
      copy(REFERRAL.code, '已複製推薦碼');
    });
    document.getElementById('btn-copy-consult-link').addEventListener('click', () => {
      copy(getConsultUrl(), '已複製免費諮詢連結');
    });
    document.getElementById('btn-copy-consult-msg').addEventListener('click', () => {
      copy(CONSULT_MSG_TEMPLATE(getConsultUrl()), '已複製分享文字');
    });
    document.getElementById('btn-copy-invite-link').addEventListener('click', () => {
      copy(getInviteUrl(), '已複製邀請連結');
    });
    document.getElementById('btn-copy-invite-msg').addEventListener('click', () => {
      copy(INVITE_MSG_TEMPLATE(getInviteUrl()), '已複製分享文字');
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
