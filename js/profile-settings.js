/* ==========================================================
   profile-settings.js - 個人設定頁互動
   手機號碼維護（OTP）+ 常用提領資料（匯款 / 現場）
   資料讀寫：MGMCommon.getUserSettings / saveUserSettings
   ========================================================== */
(function () {
  'use strict';

  var OTP_SECONDS = 180;
  var otpTimer = null;
  var pendingPhone = '';

  /* ── 工具：取得目前 UID ── */
  function getCurrentUid() {
    try {
      var profile = window.MGMCommon && window.MGMCommon.resolvePersonProfile
        ? window.MGMCommon.resolvePersonProfile()
        : JSON.parse(sessionStorage.getItem('mgm_person_profile') || 'null');
      if (profile) return profile.uid || profile.lineUserId || '';
    } catch (e) {}
    try { return sessionStorage.getItem('mgm_login_uid') || ''; } catch (e) { return ''; }
  }

  function getSettings() {
    if (window.MGMCommon && window.MGMCommon.getUserSettings) return window.MGMCommon.getUserSettings();
    try {
      var uid = getCurrentUid();
      if (!uid) return {};
      var all = JSON.parse(localStorage.getItem('mgm_user_settings') || '{}');
      return all[uid] || {};
    } catch (e) { return {}; }
  }

  function patchSettings(patch) {
    var uid = getCurrentUid();
    if (!uid) return;
    if (window.MGMCommon && window.MGMCommon.saveUserSettings) {
      window.MGMCommon.saveUserSettings(uid, patch);
    } else {
      try {
        var all = JSON.parse(localStorage.getItem('mgm_user_settings') || '{}');
        all[uid] = Object.assign(all[uid] || {}, patch);
        localStorage.setItem('mgm_user_settings', JSON.stringify(all));
      } catch (e) {}
    }
  }

  /* ── 遮碼工具 ── */
  function maskPhone(phone) {
    if (!phone || phone.length < 10) return phone || '—';
    return phone.slice(0, 4) + ' *** ' + phone.slice(-3);
  }

  function maskAccountNo(no) {
    if (!no) return '—';
    var s = String(no).replace(/\D/g, '');
    if (!s) return '—';
    return s.length > 4 ? '•••• •••• ' + s.slice(-4) : s;
  }

  function maskAccountName(name) {
    if (!name) return '—';
    if (name.length <= 1) return name + '○○';
    return name[0] + '○'.repeat(Math.min(name.length - 1, 2));
  }

  function maskIdNumber(id) {
    if (!id || id.length < 6) return id || '—';
    return id.slice(0, 3) + '****' + id.slice(-3);
  }

  /* ── 渲染顯示（遮碼） ── */
  function renderPhone() {
    var el = document.getElementById('phone-display');
    if (!el) return;
    var settings = getSettings();
    var phone = settings.phone || '';
    try { phone = phone || sessionStorage.getItem('mgm_login_phone') || ''; } catch (e) {}
    el.textContent = phone ? maskPhone(phone) : '—';
  }

  function renderBank() {
    var settings = getSettings();
    var bank = (settings.withdrawal && settings.withdrawal.bank) || {};
    function set(id, txt, hasData) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = txt;
      el.classList.toggle('ps-empty', !hasData);
    }
    if (bank.bankCode || bank.bankName) {
      var bankDisplay = bank.bankCode
        ? (bank.bankCode + (bank.bankBranch ? ' / ' + bank.bankBranch : ''))
        : bank.bankName;
      set('bank-name-display',      bankDisplay,                      true);
      set('bank-acct-no-display',   maskAccountNo(bank.accountNo),    true);
      set('bank-acct-name-display', maskAccountName(bank.accountName), true);
    } else {
      set('bank-name-display',      '尚未設定', false);
      set('bank-acct-no-display',   '—',        false);
      set('bank-acct-name-display', '—',        false);
    }
  }

  function renderIdentity() {
    var settings = getSettings();
    var identity = settings.identity || {};
    function set(id, txt, hasData) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = txt;
      el.classList.toggle('ps-empty', !hasData);
    }
    if (identity.realName) {
      set('identity-name-display', maskAccountName(identity.realName), true);
      set('identity-id-display', identity.idNumber ? maskIdNumber(identity.idNumber) : '—', !!identity.idNumber);
      set('identity-address-display', identity.address || '—', !!identity.address);
    } else {
      set('identity-name-display', '尚未設定', false);
      set('identity-id-display', '—', false);
      set('identity-address-display', '—', false);
    }
  }

  /* ── OTP 計時器 ── */
  function startOtpTimer() {
    var left = OTP_SECONDS;
    var timerEl = document.getElementById('phone-otp-timer');
    var resendBtn = document.getElementById('btn-resend-otp');
    if (otpTimer) clearInterval(otpTimer);
    if (resendBtn) resendBtn.disabled = true;
    otpTimer = setInterval(function () {
      left--;
      var mm = String(Math.floor(left / 60)).padStart(2, '0');
      var ss = String(left % 60).padStart(2, '0');
      if (timerEl) timerEl.textContent = left > 0 ? mm + ':' + ss : '已過期';
      if (left <= 0) {
        clearInterval(otpTimer);
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  }

  function resetOtpInputs() {
    document.querySelectorAll('#ps-otp-row .otp-input').forEach(function (i) { i.value = ''; });
  }

  /* ── 手機 OTP 驗證完成 ── */
  function commitPhoneChange() {
    if (otpTimer) clearInterval(otpTimer);
    // 儲存至 sessionStorage + localStorage + settings
    try { sessionStorage.setItem('mgm_login_phone', pendingPhone); } catch (e) {}
    var uid = getCurrentUid();
    if (uid) {
      try {
        var map = JSON.parse(localStorage.getItem('mgm_phone_by_uid') || '{}');
        map[uid] = pendingPhone;
        localStorage.setItem('mgm_phone_by_uid', JSON.stringify(map));
      } catch (e) {}
    }
    patchSettings({ phone: pendingPhone });
    // 更新顯示
    var phoneDisplayEl = document.getElementById('phone-display');
    if (phoneDisplayEl) phoneDisplayEl.textContent = maskPhone(pendingPhone);
    // 重置 UI
    closePhonePanel();
    showToast('手機號碼已更新');
  }

  function closePhonePanel() {
    var panel = document.getElementById('phone-edit-panel');
    var editBtn = document.getElementById('btn-edit-phone');
    var otpStep = document.getElementById('phone-otp-step');
    var sendBtn = document.getElementById('btn-send-phone-otp');
    var inpPhone = document.getElementById('inp-new-phone');
    if (panel) panel.hidden = true;
    if (editBtn) editBtn.hidden = false;
    if (otpStep) otpStep.hidden = true;
    if (sendBtn) sendBtn.hidden = false;
    if (inpPhone) inpPhone.value = '';
    resetOtpInputs();
    if (otpTimer) clearInterval(otpTimer);
  }

  /* ── 手機編輯綁定 ── */
  function bindPhoneEdit() {
    var editBtn = document.getElementById('btn-edit-phone');
    var panel = document.getElementById('phone-edit-panel');
    var cancelBtn = document.getElementById('btn-cancel-phone');
    var sendBtn = document.getElementById('btn-send-phone-otp');
    var otpStep = document.getElementById('phone-otp-step');
    var otpTargetEl = document.getElementById('phone-otp-target');
    var inpPhone = document.getElementById('inp-new-phone');
    var resendBtn = document.getElementById('btn-resend-otp');

    if (!editBtn || !panel) return;

    editBtn.addEventListener('click', function () {
      panel.hidden = false;
      editBtn.hidden = true;
      if (inpPhone) inpPhone.focus();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', closePhonePanel);

    function doSend() {
      var phone = inpPhone ? inpPhone.value.trim() : '';
      if (!/^09\d{8}$/.test(phone)) {
        alert('請輸入正確的手機號碼（09 開頭，共 10 碼）');
        return;
      }
      pendingPhone = phone;
      if (otpTargetEl) otpTargetEl.textContent = maskPhone(phone);
      if (otpStep) otpStep.hidden = false;
      if (sendBtn) sendBtn.hidden = true;
      resetOtpInputs();
      startOtpTimer();
      var firstOtp = document.querySelector('#ps-otp-row .otp-input');
      if (firstOtp) firstOtp.focus();
    }

    if (sendBtn) sendBtn.addEventListener('click', doSend);
    if (resendBtn) {
      resendBtn.addEventListener('click', function () {
        resetOtpInputs();
        startOtpTimer();
        var firstOtp = document.querySelector('#ps-otp-row .otp-input');
        if (firstOtp) firstOtp.focus();
        showToast('已重新發送驗證碼');
      });
    }

    // OTP 輸入框
    var otpInputs = document.querySelectorAll('#ps-otp-row .otp-input');
    otpInputs.forEach(function (input, idx) {
      input.addEventListener('input', function () {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
        var code = Array.from(otpInputs).map(function (i) { return i.value; }).join('');
        if (code.length === 6) commitPhoneChange();
      });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Backspace' && !input.value && idx > 0) otpInputs[idx - 1].focus();
      });
      input.addEventListener('paste', function (e) {
        var text = (e.clipboardData || window.clipboardData).getData('text');
        var digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          e.preventDefault();
          digits.split('').forEach(function (d, i) { otpInputs[i].value = d; });
          commitPhoneChange();
        }
      });
    });
  }

  /* ── 匯款資料編輯綁定 ── */
  function bindBankEdit() {
    var editBtn = document.getElementById('btn-edit-bank');
    var panel = document.getElementById('bank-edit-panel');
    var cancelBtn = document.getElementById('btn-cancel-bank');
    var saveBtn = document.getElementById('btn-save-bank');
    var inpCode = document.getElementById('inp-bank-code');
    var inpBranch = document.getElementById('inp-bank-branch');
    var inpAccount = document.getElementById('inp-bank-account');
    var inpHolder = document.getElementById('inp-bank-holder');

    if (!editBtn || !panel) return;

    editBtn.addEventListener('click', function () {
      var settings = getSettings();
      var bank = (settings.withdrawal && settings.withdrawal.bank) || {};
      if (inpCode) inpCode.value = bank.bankCode || '';
      if (inpBranch) inpBranch.value = bank.bankBranch || '';
      if (inpAccount) inpAccount.value = bank.accountNo || '';
      if (inpHolder) inpHolder.value = bank.accountName || '';
      panel.hidden = false;
      editBtn.hidden = true;
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        panel.hidden = true;
        editBtn.hidden = false;
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var bankCode = inpCode ? inpCode.value.trim() : '';
        var bankBranch = inpBranch ? inpBranch.value.trim() : '';
        var accountNo = inpAccount ? inpAccount.value.trim() : '';
        var accountName = inpHolder ? inpHolder.value.trim() : '';
        if (!bankCode || bankCode.length !== 3) {
          alert('請填寫 3 碼銀行代碼（如 808）');
          return;
        }
        if (!bankBranch || bankBranch.length !== 4) {
          alert('請填寫 4 碼分行代號');
          return;
        }
        if (!accountNo) { alert('請填寫收款人帳號'); return; }
        if (/[\s\-]/.test(accountNo)) { alert('帳號請勿包含空格或連字號（-）'); return; }
        if (!accountName) { alert('請填寫收款人戶名'); return; }
        var settings = getSettings();
        var withdrawal = settings.withdrawal || {};
        withdrawal.bank = { bankCode: bankCode, bankBranch: bankBranch, accountNo: accountNo, accountName: accountName };
        patchSettings({ withdrawal: withdrawal });
        panel.hidden = true;
        editBtn.hidden = false;
        renderBank();
        showToast('匯款資料已儲存');
      });
    }
  }

  /* ── 身分資料編輯綁定 ── */
  function bindIdentityEdit() {
    var editBtn = document.getElementById('btn-edit-identity');
    var panel = document.getElementById('identity-edit-panel');
    var cancelBtn = document.getElementById('btn-cancel-identity');
    var saveBtn = document.getElementById('btn-save-identity');
    var inpName = document.getElementById('inp-identity-name');
    var inpId = document.getElementById('inp-identity-id');
    var inpAddress = document.getElementById('inp-identity-address');

    if (!editBtn || !panel) return;

    editBtn.addEventListener('click', function () {
      var settings = getSettings();
      var identity = settings.identity || {};
      if (inpName) inpName.value = identity.realName || '';
      if (inpId) inpId.value = identity.idNumber || '';
      if (inpAddress) inpAddress.value = identity.address || '';
      panel.hidden = false;
      editBtn.hidden = true;
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', function () {
        panel.hidden = true;
        editBtn.hidden = false;
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var realName = inpName ? inpName.value.trim() : '';
        var idNumber = inpId ? inpId.value.trim() : '';
        var address = inpAddress ? inpAddress.value.trim() : '';
        if (!realName || !idNumber || !address) {
          alert('請填寫所有必填欄位');
          return;
        }
        patchSettings({ identity: { realName: realName, idNumber: idNumber, address: address } });
        panel.hidden = true;
        editBtn.hidden = false;
        renderIdentity();
        showToast('身分資料已儲存');
      });
    }
  }

  /* ── Toast ── */
  function showToast(msg) {
    var t = document.getElementById('ps-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'ps-toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:30px;transform:translateX(-50%);' +
        'background:#1f2937;color:#fff;padding:10px 18px;border-radius:24px;' +
        'font-size:14px;z-index:9999;opacity:0;transition:opacity .2s;pointer-events:none;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.style.opacity = '0'; }, 2200);
  }

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', function () {
    renderPhone();
    renderBank();
    renderIdentity();
    bindPhoneEdit();
    bindBankEdit();
    bindIdentityEdit();
    // 共用上傳功能（浮水印預覽）— 實作在 common.js
    if (window.MGMCommon && window.MGMCommon.bindUpload) {
      window.MGMCommon.bindUpload();
    }
  });

})();
