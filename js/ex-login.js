/* ==========================================================
  ex-login.js - 離職員工 / 一般訪客驗證流程
  離職 / 會員：LINE 好友 -> OTP 驗證 -> 身分證字號比對
========================================================== */

(function () {
  'use strict';

  const INCIDENT_MAP_KEY = 'mgm_blacklist_incident_by_uid';
  const TOKEN_VALID_SECONDS = 180;

  const ROSTER_CASES = [
    {
      uid: 'U250310001',
      phone: '0935566777',
      identityNo: 'A123456789',
      name: '王小毅',
      sourceSystem: '名冊系統',
      lineFriendLinked: true,
    },
    {
      uid: 'U10031',
      phone: '0928456123',
      identityNo: '',
      name: '陳怡庭',
      sourceSystem: '名冊系統',
      lineFriendLinked: true,
    },
    {
      uid: 'U240214003',
      phone: '0944333222',
      identityNo: 'F123456789',
      name: '高士鈞',
      sourceSystem: '名冊系統',
      lineFriendLinked: true,
    },
  ];

  const EMPLOYEE_SYSTEM_CASES = [
    {
      uid: 'U240105002',
      phone: '0911222333',
      identityNo: 'C123456789',
      name: '林雅雯',
      employeeStatus: 'Active',
      sourceSystem: '員工系統',
      lineFriendLinked: true,
    },
    {
      uid: 'U230620004',
      phone: '0912345678',
      identityNo: '',
      name: '陳前輩',
      employeeStatus: 'Resigned',
      resignDate: '2026/05/20',
      sourceSystem: '員工系統',
      lineFriendLinked: true,
    },
    {
      uid: 'U240328006',
      phone: '0955222222',
      identityNo: 'B123456789',
      name: '李○穎',
      employeeStatus: 'Resigned',
      resignDate: '2026/04/30',
      sourceSystem: '員工系統',
      lineFriendLinked: true,
    },
  ];

  let lineFriendConfirmed = false;
  let currentProfile = null;
  let pendingPhone = '';
  let otpTimer = null;

  function maskPhone(phone) {
    return String(phone || '').replace(/(\d{4})(\d{3})(\d{3})/, '$1 *** $3');
  }

  function normalizeIdNumber(idNumber) {
    return String(idNumber || '').trim().toUpperCase();
  }

  function findRosterCaseByPhone(phone) {
    return ROSTER_CASES.find((item) => item.phone === phone) || null;
  }

  function findEmployeeCaseByPhone(phone) {
    return EMPLOYEE_SYSTEM_CASES.find((item) => item.phone === phone) || null;
  }

  function buildPersonProfile(profile) {
    if (!profile) return null;
    return {
      personId: profile.idNumber || '',
      identityNo: profile.idNumber || '',
      mobile: profile.phone || '',
      lineUserId: profile.uid || '',
      uid: profile.uid || '',
      name: profile.name || '',
      source: profile.source || 'external',
      resignDate: profile.resignDate || '',
      userRole: profile.userRole || 'Visitor',
      employeeFlag: profile.employeeFlag || 'N',
      employeeStatus: profile.employeeStatus || null,
    };
  }

  function isUidBlacklisted(uid) {
    if (window.MGMCommon && window.MGMCommon.isUidBlacklisted) {
      return window.MGMCommon.isUidBlacklisted(uid);
    }
    try {
      const arr = JSON.parse(localStorage.getItem('mgm_frozen_uids') || '[]');
      return arr.includes(uid);
    } catch {
      return false;
    }
  }

  function writeBlockedAudit(exEmployee) {
    try {
      const key = 'mgm_risk_audit_log';
      const cur = JSON.parse(localStorage.getItem(key) || '[]');
      cur.unshift({
        time: new Date().toLocaleString('zh-TW'),
        actor: '系統（外部驗證入口攔截）',
        action: `拒絕 ${exEmployee.uid}（${exEmployee.name}）之登入`,
        target: '離職員工 / 一般訪客驗證頁',
        note: '該 UID 為已凍結之黑名單，已阻斷登入',
      });
      if (cur.length > 200) cur.length = 200;
      localStorage.setItem(key, JSON.stringify(cur));
    } catch {}
  }

  function makeIncidentId() {
    const now = new Date();
    const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `BL-${ymd}-${rand}`;
  }

  function getIncidentMap() {
    try {
      const raw = JSON.parse(localStorage.getItem(INCIDENT_MAP_KEY) || '{}');
      return raw && typeof raw === 'object' ? raw : {};
    } catch {
      return {};
    }
  }

  function getOrCreateIncidentIdByUid(uid) {
    const map = getIncidentMap();
    if (!map[uid]) {
      map[uid] = makeIncidentId();
      try {
        localStorage.setItem(INCIDENT_MAP_KEY, JSON.stringify(map));
      } catch {}
    }
    return map[uid];
  }

  function showPanel(id) {
    document.querySelectorAll('.ex-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === id);
    });

    if (id === 'panel-blocked') {
      document.querySelectorAll('.ex-step').forEach((step, index) => {
        step.classList.toggle('active', index === 0);
        step.classList.remove('done');
      });
      return;
    }

    const stepMap = { 'panel-1': 1, 'panel-2': 2, 'panel-3': 2, 'panel-4': 3 };
    const currentStep = stepMap[id] || 1;
    document.querySelectorAll('.ex-step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.toggle('active', stepNum === currentStep);
      step.classList.toggle('done', stepNum < currentStep);
    });
  }

  function renderFlowCopy() {
    const lineCopy = document.getElementById('line-flow-copy');
    const demoTip = document.getElementById('role-demo-tip');
    const formTitle = document.getElementById('form-panel-title');
    const formSubtitle = document.getElementById('form-panel-subtitle');
    const phoneHint = document.getElementById('form-phone-hint');
    const submitBtn = document.getElementById('btn-send-otp');
    if (lineCopy) lineCopy.textContent = '完成好友加入後，請填寫手機號碼並完成 OTP 驗證，再輸入身分證字號。系統會先比對名冊，名冊無資料時再比對員工系統。';
    if (demoTip) demoTip.innerHTML = '<strong>Demo 測試資料</strong><p>名冊符合：0935566777 / A123456789、0928456123。名冊不符合：0944333222（請輸入非 F123456789）。在職員工：0911222333 / C123456789。離職員工：0912345678。黑名單離職員工：0955222222 / B123456789。一般往來客：0911666888。</p>';
    if (formTitle) formTitle.textContent = '手機驗證';
    if (formSubtitle) formSubtitle.textContent = '請先輸入手機號碼並完成 OTP 驗證。驗證成功後，還需輸入身分證字號進行資料比對。';
    if (phoneHint) phoneHint.textContent = '請輸入完整 10 碼，OTP 驗證完成後還需輸入身分證字號';
    if (submitBtn) submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>發送 OTP 驗證碼';
  }

  function resetOtpInputs() {
    document.querySelectorAll('.otp-input').forEach((input) => {
      input.value = '';
    });
  }

  function resetResultCard() {
    const result = document.getElementById('match-result');
    const actions = document.getElementById('match-actions');
    const confirmBtn = document.getElementById('btn-confirm-match');
    if (result) {
      result.hidden = true;
      result.className = 'result-card';
      result.innerHTML = '';
    }
    if (actions) actions.hidden = true;
    if (confirmBtn) confirmBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i>進入平台';
  }

  function resetFormFields() {
    const phoneEl = document.getElementById('inp-phone');
    const idEl = document.getElementById('inp-id-verify');
    if (phoneEl) phoneEl.value = '';
    if (idEl) idEl.value = '';
    resetResultCard();
  }

  function showIdentityCompareStep() {
    const idForm = document.getElementById('id-compare-form');
    const idPhoneMask = document.getElementById('id-compare-phone-mask');
    const idInput = document.getElementById('inp-id-verify');
    resetResultCard();
    if (idForm) idForm.hidden = false;
    if (idPhoneMask) idPhoneMask.textContent = maskPhone(pendingPhone);
    if (idInput) {
      idInput.value = '';
      idInput.focus();
    }
    showPanel('panel-4');
  }

  function updateLineFriendStatus() {
    const statusEl = document.getElementById('line-friend-status');
    const btn = document.getElementById('btn-line-friend-check');
    const nextBtn = document.getElementById('btn-go-form');
    if (!statusEl || !btn || !nextBtn) return;

    if (lineFriendConfirmed) {
      statusEl.textContent = '已完成 LINE 好友加入';
      statusEl.style.color = '#047857';
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-check"></i>已完成 LINE 好友加入';
      nextBtn.disabled = false;
      return;
    }

    statusEl.textContent = '尚未完成 LINE 好友加入';
    statusEl.style.color = '';
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-brands fa-line"></i>我已完成 LINE 好友加入';
    nextBtn.disabled = true;
  }

  function showComparePanel(kind, title, html, mode) {
    const idForm = document.getElementById('id-compare-form');
    const actions = document.getElementById('match-actions');
    const confirmBtn = document.getElementById('btn-confirm-match');
    renderResult(kind, title, html);
    if (idForm) idForm.hidden = true;
    if (actions) actions.hidden = mode === 'blocked';
    if (confirmBtn) {
      confirmBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>進入平台';
    }
    showPanel('panel-4');
  }

  function renderResult(kind, title, html) {
    const result = document.getElementById('match-result');
    if (!result) return;
    result.hidden = false;
    result.className = `result-card result-${kind}`;
    result.innerHTML = `<h3>${title}</h3><div>${html}</div>`;
  }

  function showBlockedPanel(exEmployee) {
    writeBlockedAudit(exEmployee);
    const idEl = document.getElementById('blocked-incident-id');
    if (idEl) idEl.textContent = getOrCreateIncidentIdByUid(exEmployee.uid);
    showPanel('panel-blocked');
  }

  function startOtpCountdown() {
    let left = TOKEN_VALID_SECONDS;
    const timerEl = document.getElementById('otp-timer');
    const resendBtn = document.getElementById('btn-resend');
    if (!timerEl || !resendBtn) return;
    if (otpTimer) clearInterval(otpTimer);
    timerEl.textContent = '03:00';
    resendBtn.disabled = true;
    otpTimer = setInterval(() => {
      left -= 1;
      const mm = String(Math.floor(left / 60)).padStart(2, '0');
      const ss = String(left % 60).padStart(2, '0');
      timerEl.textContent = left > 0 ? `${mm}:${ss}` : '已過期';
      if (left <= 0) {
        clearInterval(otpTimer);
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  function focusFirstOtp() {
    const first = document.querySelector('.otp-input');
    if (first) first.focus();
  }

  function beginOtp(profile) {
    currentProfile = profile;
    const phoneMask = document.getElementById('phone-mask');
    if (phoneMask) phoneMask.textContent = maskPhone(profile.phone);
    resetOtpInputs();
    showPanel('panel-3');
    startOtpCountdown();
    focusFirstOtp();
  }

  function handlePhoneSubmit() {
    const phoneEl = document.getElementById('inp-phone');
    if (!phoneEl) return;

    const phone = phoneEl.value.trim();
    if (!lineFriendConfirmed) {
      alert('請先完成 LINE 好友加入，再進行表單驗證。');
      showPanel('panel-1');
      return;
    }
    if (!/^09\d{8}$/.test(phone)) {
      alert('請輸入正確的手機號碼（09 開頭，共 10 碼）');
      return;
    }

    pendingPhone = phone;
    const phoneMask = document.getElementById('phone-mask');
    if (phoneMask) phoneMask.textContent = maskPhone(phone);
    resetResultCard();
    resetOtpInputs();
    showPanel('panel-3');
    startOtpCountdown();
    focusFirstOtp();
  }

  function handlePostOtpMatch(idNumber) {
    const normalizedIdNumber = normalizeIdNumber(idNumber);
    const phone = pendingPhone;
    const rosterProfile = findRosterCaseByPhone(phone);
    const employeeProfile = findEmployeeCaseByPhone(phone);

    resetResultCard();

    if (rosterProfile) {
      if (!rosterProfile.lineFriendLinked) {
        showComparePanel('warn', '尚未完成 LINE 好友綁定', '<p>系統查無 LINE 好友關係，請先加入官方帳號後再重新驗證。</p>', 'blocked');
        return;
      }

      const rosterIdentityNo = normalizeIdNumber(rosterProfile.identityNo);
      if (rosterIdentityNo && rosterIdentityNo !== normalizedIdNumber) {
        currentProfile = null;
        showComparePanel('error', '名冊資料不符合', `<p>系統已於名冊系統找到資料：<strong>${rosterProfile.name}</strong>。</p><p>但留存的身分證字號與您輸入內容不一致，已標記為異常資料，請轉人工協助處理。</p>`, 'blocked');
        return;
      }

      currentProfile = {
        identity: '會員',
        uid: rosterProfile.uid,
        name: rosterProfile.name,
        phone: rosterProfile.phone,
        idNumber: normalizedIdNumber,
        source: 'roster',
        userRole: 'Visitor',
        employeeFlag: 'N',
        employeeStatus: null,
      };

      if (!rosterIdentityNo) {
        showComparePanel('info', '名冊比對成功', `<p>系統已於名冊系統找到資料：<strong>${rosterProfile.name}</strong>。</p><p>名冊未留存身分證字號，已以手機 OTP 與您輸入的證號完成綁定。</p><p>將以一般往來客流程進入平台。</p>`, 'continue');
        return;
      }

      showComparePanel('info', '名冊比對成功', `<p>系統已於名冊系統找到資料：<strong>${rosterProfile.name}</strong>。</p><p>手機號碼與身分證字號均比對一致，將以一般往來客流程進入平台。</p>`, 'continue');
      return;
    }

    if (employeeProfile) {
      if (!employeeProfile.lineFriendLinked) {
        showComparePanel('warn', '尚未完成 LINE 好友綁定', '<p>系統查無 LINE 好友關係，請先加入官方帳號後再重新驗證。</p>', 'blocked');
        return;
      }

      const employeeIdentityNo = normalizeIdNumber(employeeProfile.identityNo);
      if (employeeIdentityNo && employeeIdentityNo !== normalizedIdNumber) {
        currentProfile = null;
        showComparePanel('error', '員工資料不符合', `<p>系統已於員工系統找到資料：<strong>${employeeProfile.name}</strong>。</p><p>但留存的身分證字號與您輸入內容不一致，請聯繫人資或專員協助處理。</p>`, 'blocked');
        return;
      }

      if (employeeProfile.employeeStatus === 'Active') {
        currentProfile = {
          redirectTo: 'employee-login.html',
          redirectLabel: '前往員工登入入口',
        };
        showComparePanel('info', '查得在職員工身份', `<p>系統已於員工系統找到在職員工：<strong>${employeeProfile.name}</strong>。</p><p>依規則將優先導向員工登入入口，不進入往來客流程。</p>`, 'continue');
        const confirmBtn = document.getElementById('btn-confirm-match');
        if (confirmBtn) confirmBtn.innerHTML = '<i class="fa-solid fa-arrow-right"></i>前往員工登入入口';
        return;
      }

      currentProfile = {
        identity: '離職員工',
        uid: employeeProfile.uid,
        name: employeeProfile.name,
        phone: employeeProfile.phone,
        idNumber: normalizedIdNumber,
        resignDate: employeeProfile.resignDate || '',
        source: 'employee-system',
        userRole: 'Visitor',
        employeeFlag: 'Y',
        employeeStatus: 'Resigned',
      };

      if (isUidBlacklisted(employeeProfile.uid)) {
        showBlockedPanel(employeeProfile);
        return;
      }

      if (!employeeIdentityNo) {
        showComparePanel('info', '查得離職員工身份', `<p>系統已於員工系統找到離職員工：<strong>${employeeProfile.name}</strong>。</p><p>員工系統未留存身分證字號，已以手機 OTP 與您輸入的證號完成綁定。</p><p>將以往來客入口進入平台，並保留員工資格。</p>`, 'continue');
        return;
      }

      showComparePanel('info', '查得離職員工身份', `<p>系統已於員工系統找到離職員工：<strong>${employeeProfile.name}</strong>。</p><p>手機號碼與身分證字號均比對一致，將以往來客入口進入平台，並保留員工資格。</p>`, 'continue');
      return;
    }

    currentProfile = {
      identity: '會員',
      uid: `V${phone.slice(-6)}`,
      name: '一般訪客',
      phone,
      idNumber: normalizedIdNumber,
      source: 'visitor',
      userRole: 'Visitor',
      employeeFlag: 'N',
      employeeStatus: null,
    };
    showComparePanel('info', '一般往來客', '<p>系統未於名冊系統與員工系統查得資料。</p><p>將以一般往來客流程建立 Person 並進入平台。</p>', 'continue');
  }

  function handleIdCompareSubmit() {
    const idEl = document.getElementById('inp-id-verify');
    if (!idEl) return;
    const idNumber = normalizeIdNumber(idEl.value);
    if (!/^[A-Z][12]\d{8}$/.test(idNumber)) {
      alert('請輸入正確的身分證字號格式，共 10 碼。');
      idEl.focus();
      return;
    }
    handlePostOtpMatch(idNumber);
  }

  function verifyOtp() {
    if (otpTimer) clearInterval(otpTimer);
    showIdentityCompareStep();
  }

  function proceedToSuccess() {
    if (!currentProfile) return;
    if (otpTimer) clearInterval(otpTimer);

    if (currentProfile.redirectTo) {
      // 訪客驗證已完成手機 OTP，傳遞預驗證旗標，讓員工入口跳過重複驗證
      try { sessionStorage.setItem('mgm_ex_preauthd_phone', pendingPhone); } catch {}
      window.location.replace(currentProfile.redirectTo);
      return;
    }

    try {
      const personProfile = buildPersonProfile(currentProfile);
      if (window.MGMCommon && typeof window.MGMCommon.setPersonProfile === 'function') {
        window.MGMCommon.setPersonProfile(personProfile);
      } else {
        sessionStorage.setItem('mgm_person_profile', JSON.stringify(personProfile));
      }

      sessionStorage.setItem('mgm_login_identity', currentProfile.identity);
      sessionStorage.setItem('mgm_login_name', currentProfile.name);
      sessionStorage.setItem('mgm_login_uid', currentProfile.uid);
      sessionStorage.setItem('mgm_login_phone', currentProfile.phone);
      sessionStorage.setItem('mgm_login_id_number', currentProfile.idNumber || '');
      sessionStorage.setItem('mgm_login_source', currentProfile.source || 'external');

      if (currentProfile.identity === '離職員工') {
        localStorage.setItem('mgm_current_user_plan', 'customer');
        sessionStorage.setItem('mgm_ex_resign_date', currentProfile.resignDate || '');
        sessionStorage.setItem('mgm_ex_line_friend', '1');
        sessionStorage.setItem('mgm_ex_form_phone', currentProfile.phone);
      } else {
        localStorage.setItem('mgm_current_user_plan', 'customer');
        sessionStorage.removeItem('mgm_ex_resign_date');
        sessionStorage.removeItem('mgm_ex_line_friend');
        sessionStorage.removeItem('mgm_ex_form_phone');
      }
    } catch {
      alert('您的瀏覽器處於無痕模式或封鎖儲存，登入後可能無法保留身分，請改用一般視窗開啟。');
    }

    window.location.replace('index.html#dashboard');
  }

  function bindLineFriendGate() {
    const btn = document.getElementById('btn-line-friend-check');
    const goFormBtn = document.getElementById('btn-go-form');
    if (!btn || !goFormBtn) return;
    btn.addEventListener('click', () => {
      lineFriendConfirmed = true;
      updateLineFriendStatus();
      alert('已記錄 LINE 好友加入，請前往資料表單繼續驗證。');
    });
    goFormBtn.addEventListener('click', () => {
      if (!lineFriendConfirmed) {
        alert('請先完成 LINE 好友加入。');
        return;
      }
      resetFormFields();
      showPanel('panel-2');
    });
    updateLineFriendStatus();
  }

  function bindFormActions() {
    const submitBtn = document.getElementById('btn-send-otp');
    const backBtn = document.getElementById('btn-back-step1');
    const confirmBtn = document.getElementById('btn-confirm-match');
    const idSubmitBtn = document.getElementById('btn-submit-id-match');
    const idInput = document.getElementById('inp-id-verify');
    const backHomeBtn = document.getElementById('btn-back-home');
    if (submitBtn) submitBtn.addEventListener('click', handlePhoneSubmit);
    if (idSubmitBtn) idSubmitBtn.addEventListener('click', handleIdCompareSubmit);
    if (idInput) {
      idInput.addEventListener('input', () => {
        idInput.value = normalizeIdNumber(idInput.value).replace(/[^A-Z0-9]/g, '').slice(0, 10);
      });
      idInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleIdCompareSubmit();
        }
      });
    }
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        resetFormFields();
        showPanel('panel-1');
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!currentProfile) return;
        proceedToSuccess();
      });
    }
    if (backHomeBtn) {
      backHomeBtn.addEventListener('click', () => {
        currentProfile = null;
        pendingPhone = '';
        lineFriendConfirmed = false;
        resetOtpInputs();
        resetFormFields();
        updateLineFriendStatus();
        showPanel('panel-1');
      });
    }
  }

  function bindOtpInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && index < inputs.length - 1) inputs[index + 1].focus();
        const code = Array.from(inputs).map((item) => item.value).join('');
        if (code.length === 6) verifyOtp(code);
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
      input.addEventListener('paste', (event) => {
        const text = (event.clipboardData || window.clipboardData).getData('text');
        const digits = text.replace(/\D/g, '').slice(0, 6);
        if (digits.length === 6) {
          event.preventDefault();
          digits.split('').forEach((digit, idx) => {
            inputs[idx].value = digit;
          });
          verifyOtp(digits);
        }
      });
    });
  }

  function bindResend() {
    const resendBtn = document.getElementById('btn-resend');
    if (!resendBtn) return;
    resendBtn.addEventListener('click', () => {
      if (!pendingPhone) return;
      startOtpCountdown();
      alert('已重新發送簡訊驗證碼至您的手機');
    });
  }

  function bindHelpModal() {
    const modal = document.getElementById('help-modal');
    const opener = document.getElementById('btn-open-help');
    if (!modal || !opener) return;
    const open = function (event) {
      if (event) event.preventDefault();
      modal.hidden = false;
    };
    const close = function () {
      modal.hidden = true;
    };
    opener.addEventListener('click', open);
    modal.querySelectorAll('[data-close]').forEach((item) => item.addEventListener('click', close));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) close();
    });
  }

  function bindBackToLogin() {
    const btn = document.getElementById('btn-back-to-login');
    if (!btn) return;
    btn.addEventListener('click', () => {
      currentProfile = null;
      pendingPhone = '';
      lineFriendConfirmed = false;
      resetOtpInputs();
      resetFormFields();
      updateLineFriendStatus();
      showPanel('panel-1');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindLineFriendGate();
    bindFormActions();
    bindOtpInputs();
    bindResend();
    bindHelpModal();
    bindBackToLogin();
    renderFlowCopy();
    updateLineFriendStatus();
  });
})();