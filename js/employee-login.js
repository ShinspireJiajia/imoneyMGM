(function () {
  'use strict';

  const TOKEN_VALID_SECONDS = 180;
  const EMPLOYEES = [
    {
      uid: 'U240105002',
      email: 'amy.lin@mgm-demo.com',
      password: 'Pass@1234',
      name: '林雅雯',
      phone: '0911222333',
      identityNo: 'C123456789',
      firstLogin: true,
    },
    {
      uid: 'U10026',
      email: 'leo.chen@mgm-demo.com',
      password: 'Pass@1234',
      name: '陳立歐',
      phone: '0922333444',
      identityNo: 'D123456789',
      firstLogin: false,
    },
  ];

  let currentEmployee = null;
  let pendingPhone = '';
  let otpTimer = null;

  function findEmployee(email, password) {
    return EMPLOYEES.find((item) => item.email === email && item.password === password) || null;
  }

  function maskPhone(phone) {
    return String(phone || '').replace(/(\d{4})(\d{3})(\d{3})/, '$1 *** $3');
  }

  function showPanel(id) {
    document.querySelectorAll('.ex-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === id);
    });

    const stepMap = { 'panel-1': 1, 'panel-2': 2, 'panel-3': 3 };
    const stepIdx = stepMap[id] || 1;
    document.querySelectorAll('.ex-step').forEach((step, index) => {
      const current = index + 1;
      step.classList.toggle('active', current === stepIdx);
      step.classList.toggle('done', current < stepIdx);
    });
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

  function persistLogin(employee, phone) {
    try {
      const personProfile = {
        personId: employee.identityNo || '',
        identityNo: employee.identityNo || '',
        mobile: phone,
        lineUserId: employee.uid,
        uid: employee.uid,
        name: employee.name,
        source: 'employee-login',
        userRole: 'Employee',
        employeeFlag: 'Y',
        employeeStatus: 'Active',
      };
      if (window.MGMCommon && typeof window.MGMCommon.setPersonProfile === 'function') {
        window.MGMCommon.setPersonProfile(personProfile);
      } else {
        sessionStorage.setItem('mgm_person_profile', JSON.stringify(personProfile));
      }

      sessionStorage.setItem('mgm_login_identity', '員工');
      sessionStorage.setItem('mgm_login_name', employee.name);
      sessionStorage.setItem('mgm_login_uid', employee.uid);
      sessionStorage.setItem('mgm_login_phone', phone);
      sessionStorage.setItem('mgm_login_id_number', employee.identityNo || '');
      sessionStorage.setItem('mgm_login_source', 'employee-login');
      localStorage.setItem('mgm_current_user_plan', 'employee');
      if (window.MGMCommon && window.MGMCommon.setPhoneOtpVerified) {
        window.MGMCommon.setPhoneOtpVerified(employee.uid, true);
      }
    } catch {}
  }

  function completeLogin() {
    if (!currentEmployee) return;
    if (otpTimer) clearInterval(otpTimer);
    persistLogin(currentEmployee, pendingPhone || currentEmployee.phone);
    window.location.replace('index.html#dashboard');
  }

  function bindLogin() {
    const btn = document.getElementById('btn-employee-login');
    const emailEl = document.getElementById('inp-email');
    const passwordEl = document.getElementById('inp-password');
    const phoneEl = document.getElementById('inp-phone');
    if (!btn || !emailEl || !passwordEl || !phoneEl) return;

    btn.addEventListener('click', () => {
      const employee = findEmployee(emailEl.value.trim(), passwordEl.value.trim());
      if (!employee) {
        alert('帳號或密碼不正確，請重新輸入。');
        return;
      }

      currentEmployee = employee;
      pendingPhone = employee.phone;
      phoneEl.value = employee.phone;

      // 來自訪客驗證流程（ex-employee.html）已完成手機 OTP，跳過重複驗證
      try {
        const preauthPhone = sessionStorage.getItem('mgm_ex_preauthd_phone');
        if (preauthPhone && preauthPhone === employee.phone) {
          sessionStorage.removeItem('mgm_ex_preauthd_phone');
          persistLogin(employee, employee.phone);
          window.location.replace('index.html#dashboard');
          return;
        }
      } catch {}

      if (!employee.firstLogin && window.MGMCommon && window.MGMCommon.isPhoneOtpVerified) {
        const verified = window.MGMCommon.isPhoneOtpVerified(employee.uid);
        if (verified) {
          persistLogin(employee, employee.phone);
          window.location.replace('index.html#dashboard');
          return;
        }
      }
      showPanel('panel-2');
    });
  }

  function bindPhoneOtp() {
    const sendBtn = document.getElementById('btn-send-employee-otp');
    const phoneEl = document.getElementById('inp-phone');
    const maskEl = document.getElementById('phone-mask');
    if (!sendBtn || !phoneEl || !maskEl) return;

    sendBtn.addEventListener('click', () => {
      const phone = phoneEl.value.trim();
      if (!/^09\d{8}$/.test(phone)) {
        alert('請輸入正確的手機號碼（09 開頭，共 10 碼）');
        return;
      }
      pendingPhone = phone;
      maskEl.textContent = maskPhone(phone);
      showPanel('panel-3');
      startOtpCountdown();
      const firstInput = document.querySelector('.otp-input');
      if (firstInput) firstInput.focus();
    });
  }

  function bindOtpInputs() {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, 1);
        if (input.value && index < inputs.length - 1) inputs[index + 1].focus();
        const code = Array.from(inputs).map((item) => item.value).join('');
        if (code.length === 6) completeLogin();
      });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
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
      alert('已重新發送 OTP 驗證碼至您的手機');
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

  document.addEventListener('DOMContentLoaded', () => {
    bindLogin();
    bindPhoneOtp();
    bindOtpInputs();
    bindResend();
    bindHelpModal();
  });
})();