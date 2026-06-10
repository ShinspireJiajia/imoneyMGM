/* ==========================================================
   withdrawal.js - 提領申請流程
   功能：方式選擇、首次/沿用判斷、表單驗證、檔案上傳顯示
   ========================================================== */

(function () {
  'use strict';

  // 門市資訊
  const BRANCH_INFO = {
    '台北': { name: '板橋分公司', address: '新北市板橋區中山路一段141號8樓' },
    '台中': { name: '中部總公司', address: '台中市西區大隆路20號B棟13樓之1' },
  };

  // 偽資料：本系統中該帳號是否已建立過稅務資料（首次提領為 false）
  const HAS_TAX_PROFILE = false;

  // 銀行代碼對照表（常用台灣金融機構）
  const BANK_LOOKUP = {
    '004': '臺灣銀行', '005': '土地銀行', '006': '合庫銀行', '007': '第一銀行',
    '008': '華南銀行', '009': '彰化銀行', '011': '上海商銀', '012': '台北富邦',
    '013': '國泰世華', '017': '兆豐銀行', '021': '花旗銀行', '050': '台灣企銀',
    '053': '台中銀行', '081': '匯豐銀行', '083': '渣打銀行',
    '808': '玉山銀行', '812': '台新銀行', '822': '中信銀行', '824': '永豐銀行',
    '826': '遠東銀行', '837': '台灣中小企銀',
  };

  function composeBankName(code, branch) {
    const name = BANK_LOOKUP[String(code || '')] || ('代碼 ' + (code || ''));
    return branch ? `${name}（分行 ${branch}）` : name;
  }

  // 偽資料：歷史稅務資料（二次以上沿用）
  const HISTORY_TAX = {
    realName: '王小毅',
    idNumber: 'A1234****89',
    address: '台北市信義區松仁路 100 號 5 樓',
    bankCode: '808',
    bankBranch: '0001',
    bankAccount: '011897912345678',
    bankHolder: '王小毅',
    bankName: '玉山銀行',
  };

  // 從 localStorage 取得最近一次提領的填寫資料（用於「帶入上次資料」功能）
  function getLastSubmissionData() {
    try {
      const list = JSON.parse(localStorage.getItem('mgm_pending_withdraw_apply') || '[]');
      for (let i = list.length - 1; i >= 0; i--) {
        const entry = list[i];
        if (entry.realName || entry.bankCode || entry.bankName) return entry;
      }
    } catch {}
    return null;
  }

  // 從 rewards 頁面帶過來的勾選項目
  function ensureDefaultWithdrawItems() {
    try {
      const existing = JSON.parse(sessionStorage.getItem('withdraw_items') || '[]');
      if (Array.isArray(existing) && existing.length > 0) return existing;

      const sharedList = (window.MGMCommon && window.MGMCommon.getRewardsDemo)
        ? window.MGMCommon.getRewardsDemo()
        : [];
      const canWithdraw = (reward) => {
        if (window.MGMCommon && window.MGMCommon.canRewardBeWithdrawn) {
          return window.MGMCommon.canRewardBeWithdrawn(reward);
        }
        return reward && reward.status === 'rewardable';
      };
      const rewardableIds = Array.isArray(sharedList)
        ? sharedList.filter((r) => canWithdraw(r)).map((r) => r.id)
        : [];

      if (rewardableIds.length > 0) {
        sessionStorage.setItem('withdraw_items', JSON.stringify(rewardableIds));
        return rewardableIds;
      }

      return [];
    } catch {
      return [];
    }
  }

  function getSelectedItems() {
    try {
      const ids = JSON.parse(sessionStorage.getItem('withdraw_items') || '[]');
      if (!Array.isArray(ids) || ids.length === 0) return [];

      // 優先走共用資料源，確保 rewards / withdrawal 顯示一致
      const sharedList = (window.MGMCommon && window.MGMCommon.getRewardsDemo)
        ? window.MGMCommon.getRewardsDemo()
        : [];
      if (Array.isArray(sharedList) && sharedList.length) {
        const canWithdraw = (reward) => {
          if (window.MGMCommon && window.MGMCommon.canRewardBeWithdrawn) {
            return window.MGMCommon.canRewardBeWithdrawn(reward);
          }
          return reward && reward.status === 'rewardable';
        };
        const byId = new Map(sharedList.map((r) => [r.id, r]));
        return ids
          .map((id) => {
            const row = byId.get(id);
            if (!row || !canWithdraw(row)) return null;
            return {
              id,
              name: row.name,
              product: row.product,
              amount: Number(row.amount) || 0,
            };
          })
          .filter((x) => x && x.name);
      }

      // 後備資料（避免共用資料異常時整頁空白）
      const fallbackMap = {
        M2026051504: { name: '張Ｏ豪', product: '房屋貸款', amount: 6500 },
        M2026051205: { name: '吳Ｏ芳', product: '汽車貸款', amount: 2500 },
        M2026050610: { name: '葉Ｏ群', product: '汽車貸款', amount: 3000 },
        M2026052711: { name: '陳Ｏ澤', product: '房屋貸款', amount: 4800 },
      };
      return ids.map((id) => ({ id, ...fallbackMap[id] })).filter((x) => x.name);
    } catch {
      return [];
    }
  }

  function fmt(n) {
    return n.toLocaleString();
  }

  let state = {
    step: 1, // 1: 摘要+方式 / 2: 稅務資料 / 3: 完成
    method: null, // 'cash' or 'transfer'
    useHistory: HAS_TAX_PROFILE,
    cashDate: '',
    cashDateLabel: '',
    cashTime: '',         // 'morning' | 'afternoon'
    cashBranch: '',       // 'taipei' | 'taichung'
    editMode: false,      // 從獎金頁「修改提領資料」進入
    editTargetId: null,   // 對應 mgm_pending_withdraw_apply 中的 id
    editTargetAmount: 0,  // 退件重填時保留原始金額供顯示
  };

  // 依申請日計算預計撥款日
  // 規則：15 日（含）前申請 → 當月 25 日；超過 15 日 → 次月 25 日
  function calcExpectedPayoutDate() {
    const today = new Date();
    const day = today.getDate();
    let year = today.getFullYear();
    let month = today.getMonth(); // 0-based
    if (day > 15) {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
    }
    return fmtDateYmd(new Date(year, month, 25));
  }

  function toDateOnly(d) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function fmtDateYmd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function fmtDateLabelZh(date) {
    const weekdayMap = ['日', '一', '二', '三', '四', '五', '六'];
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(
      date.getDate()
    ).padStart(2, '0')}（週${weekdayMap[date.getDay()]}）`;
  }

  function getNextThreeWeeksMonWed() {
    const today = toDateOnly(new Date());
    const day = today.getDay();
    // 下一個週一（若今天是週一則跳到下週一）
    const daysUntilNextMonday = ((8 - day) % 7) || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilNextMonday);

    const dates = [];
    for (let week = 0; week < 3; week += 1) {
      const baseMonday = new Date(nextMonday);
      baseMonday.setDate(nextMonday.getDate() + week * 7);

      const monday = new Date(baseMonday);
      const wednesday = new Date(baseMonday);
      wednesday.setDate(baseMonday.getDate() + 2);

      dates.push(monday, wednesday);
    }

    return dates.filter((d) => d >= today);
  }

  function getCashTimeLabel(timeVal) {
    if (timeVal === 'morning')   return '上午 10:00-12:00';
    if (timeVal === 'afternoon') return '下午 14:00-16:00';
    return '';
  }

  function renderCashDateOptions() {
    const select = document.getElementById('inp-cash-date');
    if (!select) return;

    const options = getNextThreeWeeksMonWed();
    select.innerHTML = '<option value="">請先選擇日期</option>';
    options.forEach((d) => {
      const value = fmtDateYmd(d);
      const text = fmtDateLabelZh(d);
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      select.appendChild(opt);
    });
  }

  function updateCashSummaryCard() {
    const row = document.getElementById('summary-appointment');
    const value = document.getElementById('summary-appointment-value');
    if (!row || !value) return;

    if (state.method === 'cash') {
      row.style.display = 'flex';
      if (state.cashDateLabel && state.cashTime) {
        value.textContent = `${state.cashDateLabel} ${getCashTimeLabel(state.cashTime)}`;
      } else if (state.cashDateLabel) {
        value.textContent = `${state.cashDateLabel} 尚未選擇時段`;
      } else {
        value.textContent = '尚未選擇';
      }
      return;
    }

    row.style.display = 'none';
  }

  function bindCashDatePicker() {
    const select = document.getElementById('inp-cash-date');
    if (!select) return;

    select.addEventListener('change', () => {
      state.cashDate = select.value || '';
      if (!state.cashDate) {
        state.cashDateLabel = '';
        updateCashSummaryCard();
        return;
      }

      const chosen = new Date(state.cashDate);
      state.cashDateLabel = isNaN(chosen.getTime()) ? '' : fmtDateLabelZh(chosen);
      updateCashSummaryCard();
    });
  }

  function bindCashTimePicker() {
    const select = document.getElementById('inp-cash-time');
    if (!select) return;

    select.addEventListener('change', () => {
      state.cashTime = select.value || '';
      updateCashSummaryCard();
    });
  }

  function toggleCashAppointmentCard() {
    const card = document.getElementById('cash-appointment-card');
    if (!card) return;
    card.style.display = state.method === 'cash' ? 'block' : 'none';
  }

  function toggleTransferSection() {
    const section = document.getElementById('transfer-section');
    if (!section) return;
    section.style.display = state.method === 'cash' ? 'none' : '';
  }

  function updateStep2Label() {
    const labelEl = document.getElementById('step2-label');
    if (!labelEl) return;
    labelEl.innerHTML = state.method === 'cash' ? '稅務與<br />預約資料' : '稅務與<br />匯款資料';
  }

  function updateNextBtnText() {
    const btn = document.getElementById('btn-next-1');
    if (!btn) return;
    if (state.method === 'cash') {
      btn.innerHTML = '下一步：選擇門市與日期<i class="fa-solid fa-arrow-right"></i>';
    } else {
      btn.innerHTML = '下一步：填寫匯款資料<i class="fa-solid fa-arrow-right"></i>';
    }
  }

  function selectBranch(branchKey) {
    state.cashBranch = branchKey;
    document.querySelectorAll('.branch-btn').forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.branch === branchKey);
    });
    const addrEl = document.getElementById('branch-address');
    if (addrEl) {
      const info = BRANCH_INFO[branchKey];
      if (info) {
        addrEl.textContent = info.address;
        addrEl.hidden = false;
      } else {
        addrEl.hidden = true;
      }
    }
  }

  function branchKeyFromName(name) {
    for (const [key, info] of Object.entries(BRANCH_INFO)) {
      if (info.name === name) return key;
    }
    return '';
  }

  function renderSummary() {
    const items = getSelectedItems();
    const total = items.length > 0
      ? items.reduce((s, r) => s + r.amount, 0)
      : (state.editTargetAmount || 0);
    const totalEl = document.getElementById('summary-total');
    const listEl = document.getElementById('summary-list');

    if (totalEl) totalEl.textContent = '$' + fmt(total);
    if (listEl)
      listEl.innerHTML = items
      .map(
        (r) => `
        <div class="row">
          <span>${r.name}・${r.id}</span>
          <strong>$${fmt(r.amount)}</strong>
        </div>`
      )
      .join('');
  }

  function showStep(n) {
    state.step = n;
    document.querySelectorAll('.step-panel').forEach((p) => {
      p.classList.toggle('active', Number(p.dataset.step) === n);
    });
    document.querySelectorAll('.bottom-actions').forEach((bar) => {
      bar.style.display = Number(bar.dataset.step) === n ? 'flex' : 'none';
    });
    document.querySelectorAll('.step').forEach((s) => {
      const idx = Number(s.dataset.step);
      s.classList.toggle('active', idx === n);
      s.classList.toggle('done', idx < n);
    });
    window.scrollTo(0, 0);
  }

  // 方式選擇
  function selectMethod(method) {
    state.method = method;
    if (method !== 'cash') {
      state.cashDate = '';
      state.cashDateLabel = '';
      state.cashTime = '';
      state.cashBranch = '';
      const dateSelect = document.getElementById('inp-cash-date');
      if (dateSelect) dateSelect.value = '';
      const timeSelect = document.getElementById('inp-cash-time');
      if (timeSelect) timeSelect.value = '';
      document.querySelectorAll('.branch-btn').forEach((b) => b.classList.remove('selected'));
      const addrEl = document.getElementById('branch-address');
      if (addrEl) addrEl.hidden = true;
    }
    document.querySelectorAll('.method-option').forEach((el) => {
      el.classList.toggle('selected', el.dataset.method === method);
    });
    updateCashSummaryCard();
    updateNextBtnText();
    updateStep2Label();
    document.getElementById('btn-next-1').disabled = false;
  }

  // 在 first-form 頂部插入「帶入上次資料」banner
  function renderPrefillBanner(lastData) {
    if (!lastData) return;
    const firstForm = document.getElementById('first-form');
    if (!firstForm || document.getElementById('prefill-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'prefill-banner';
    banner.id = 'prefill-banner';
    const nameHint = lastData.realName ? `（${lastData.realName}）` : '';
    banner.innerHTML = `
      <div class="prefill-banner-info">
        <i class="fa-solid fa-clock-rotate-left"></i>
        <span>偵測到上次填寫的資料${nameHint}</span>
      </div>
      <button type="button" id="btn-prefill" class="btn btn-sm btn-outline prefill-btn">帶入上次資料</button>
    `;
    firstForm.insertBefore(banner, firstForm.firstChild);

    document.getElementById('btn-prefill').addEventListener('click', () => {
      const setVal = (id, val) => {
        if (!val) return;
        const el = document.getElementById(id);
        if (el) el.value = val;
      };
      setVal('inp-real-name',    lastData.realName);
      setVal('inp-id-number',    lastData.idNumber);
      setVal('inp-address',      lastData.address);
      setVal('inp-bank-code',    lastData.bankCode    || '');
      setVal('inp-bank-branch',  lastData.bankBranch  || '');
      setVal('inp-bank-account', (lastData.bankAccount || '').replace(/[-\s]/g, ''));
      setVal('inp-bank-holder',  lastData.bankHolder  || lastData.bankHolder || '');
      banner.innerHTML = `<div class="prefill-banner-info prefill-banner-done"><i class="fa-solid fa-circle-check"></i><span>已帶入上次填寫資料，請確認或修改後送出</span></div>`;
      banner.classList.add('prefill-banner--done');
    });
  }

  // 進到稅務資料步驟
  function gotoTax() {
    if (!state.method) return;
    toggleCashAppointmentCard();
    toggleTransferSection();
    // 依是否有歷史資料，顯示不同 panel
    document
      .getElementById('history-card')
      .style.display = HAS_TAX_PROFILE ? 'block' : 'none';
    document
      .getElementById('first-form')
      .style.display = HAS_TAX_PROFILE ? 'none' : 'block';

    if (HAS_TAX_PROFILE) {
      // 預先帶入歷史資料
      document.getElementById('history-name').textContent = HISTORY_TAX.realName;
      document.getElementById('history-id').textContent = HISTORY_TAX.idNumber;
      document.getElementById('history-bank').textContent =
        composeBankName(HISTORY_TAX.bankCode, HISTORY_TAX.bankBranch) +
        ' ／ 末四碼 ' + String(HISTORY_TAX.bankAccount || '').slice(-4);
    } else if (!state.editMode) {
      // 非編輯模式下，若有過去填寫過的資料，顯示「帶入上次資料」banner
      renderPrefillBanner(getLastSubmissionData());
    }

    showStep(2);
  }

  // 檔案上傳顯示（圖片預覽含浮水印）— 實作在 common.js
  function bindUpload() {
    if (window.MGMCommon && window.MGMCommon.bindUpload) {
      window.MGMCommon.bindUpload();
    }
  }

  // 讀取修改目標（從 rewards 頁寫入的 sessionStorage）
  function getEditTarget() {
    try {
      const id = sessionStorage.getItem('mgm_edit_withdrawal_id');
      if (!id) return null;
      sessionStorage.removeItem('mgm_edit_withdrawal_id');
      // 優先從使用者送出記錄查（localStorage）
      const list = JSON.parse(localStorage.getItem('mgm_pending_withdraw_apply') || '[]');
      const found = list.find((a) => a.id === id);
      if (found) return found;
      // fallback：從 demo 共用資料源查（demo 預置的申請中記錄不在 localStorage）
      const demoList = (window.MGMCommon && window.MGMCommon.getRewardsDemo)
        ? window.MGMCommon.getRewardsDemo()
        : [];
      return demoList.find(
        (r) => r.id === id && (r.status === 'transferring' || r.status === 'pending_pickup' || r.status === 'transfer_failed')
      ) || null;
    } catch {
      return null;
    }
  }

  // 進入編輯模式：預填所有原始登打資料並跳至步驟 2
  function enterEditMode(target) {
    state.editMode = true;
    state.editTargetId = target.id;
    state.editTargetAmount = Number(target.amount) || 0;

    // 顯示「修改提領資料」標題提示
    const editBanner = document.getElementById('withdraw-edit-banner');
    if (editBanner) editBanner.hidden = false;

    // 退件重填：留在步驟 1 讓用戶重新選擇方式，只預選原方式並顯示原始金額
    if (target.status === 'transfer_failed') {
      if (target.method) selectMethod(target.method);
      renderSummary();
      return;
    }

    // 自動選好方式（步驟一）並直接進步驟 2
    selectMethod(target.method);
    gotoTax();

    // 強制顯示可編輯表單（不走 history-card 沿用流程）
    const histCard  = document.getElementById('history-card');
    const firstForm = document.getElementById('first-form');
    if (histCard)  histCard.style.display  = 'none';
    if (firstForm) firstForm.style.display = 'block';

    // 預填上一次登打的資料
    const setVal = (id, val) => {
      if (!val) return;
      const el = document.getElementById(id);
      if (el) el.value = val;
    };
    setVal('inp-real-name',    target.realName);
    setVal('inp-id-number',    target.idNumber);
    setVal('inp-address',      target.address);
    setVal('inp-bank-code',    target.bankCode    || '');
    setVal('inp-bank-branch',  target.bankBranch  || '');
    setVal('inp-bank-account', (target.bankAccount || '').replace(/[-\s]/g, ''));
    setVal('inp-bank-holder',  target.bankHolder  || '');

    // 現場領取：預選門市與預約日期
    if (target.method === 'cash') {
      if (target.branch) {
        const branchKey = branchKeyFromName(target.branch);
        if (branchKey) selectBranch(branchKey);
      }
      if (target.appointmentDate) {
        const select = document.getElementById('inp-cash-date');
        if (select) {
          const normalized = (target.appointmentDate || '').replace(/\//g, '-');
          for (const opt of select.options) {
            if (opt.value === normalized || opt.value === target.appointmentDate) {
              select.value = opt.value;
              state.cashDate = opt.value;
              state.cashDateLabel = opt.textContent;
              break;
            }
          }
          updateCashSummaryCard();
        }
      }
    }

    // 鎖定「上一步」：編輯模式下只能透過原方式修改，不可回步驟 1 變更方式
    const backBtn = document.getElementById('btn-back-2');
    if (backBtn) {
      backBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>取消修改';
    }
  }

  // 送出申請
  function submitWithdraw() {
    // 編輯模式：只驗付款相關欄位，更新既有 localStorage 記錄後直接顯示完成頁
    if (state.editMode && state.editTargetId) {
      if (state.method === 'cash') {
        if (!state.cashBranch) {
          alert('請選擇提領門市（台北板橋分公司 或 台中中部總公司）');
          return;
        }
        if (!state.cashDate) {
          alert('請先選擇現場預約日期（僅可選下三週的週一或週三）');
          return;
        }
        if (!state.cashTime) {
          alert('請選擇預約時段（上午 10:00-12:00 或 下午 14:00-16:00）');
          return;
        }
        const allowedDates = getNextThreeWeeksMonWed().map(fmtDateYmd);
        const today = toDateOnly(new Date());
        const chosen = toDateOnly(new Date(state.cashDate));
        if (!allowedDates.includes(state.cashDate) || chosen < today) {
          alert('預約日期無效，僅可選擇下三週的週一或週三');
          return;
        }
      } else {
        const bankCode = document.getElementById('inp-bank-code')?.value.trim();
        if (!bankCode || bankCode.length !== 3) { alert('請填寫 3 碼銀行代號（如 808）'); return; }
        const bankBranch = document.getElementById('inp-bank-branch')?.value.trim();
        if (!bankBranch || bankBranch.length !== 4) { alert('請填寫 4 碼分行代號'); return; }
        const bankAccount = document.getElementById('inp-bank-account')?.value.trim();
        if (!bankAccount) { alert('請填寫收款人帳號'); return; }
        if (/[\s\-]/.test(bankAccount)) { alert('帳號請勿包含空格或連字號（-）'); return; }
        const bankHolder = document.getElementById('inp-bank-holder')?.value.trim();
        if (!bankHolder) { alert('請填寫收款人戶名'); return; }
      }

      // 更新 localStorage 既有記錄
      try {
        const key = 'mgm_pending_withdraw_apply';
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const entry = list.find((a) => a.id === state.editTargetId);
        if (entry) {
          entry.method = state.method;
          const eRealName    = document.getElementById('inp-real-name')?.value.trim()    || entry.realName    || '';
          const eIdNumber    = document.getElementById('inp-id-number')?.value.trim()    || entry.idNumber    || '';
          const eAddress     = document.getElementById('inp-address')?.value.trim()      || entry.address     || '';
          entry.realName  = eRealName;
          entry.idNumber  = eIdNumber;
          entry.address   = eAddress;
          if (state.method === 'cash') {
            entry.status = 'pending_pickup';
            entry.appointmentDate = state.cashDate;
            entry.appointmentHours = getCashTimeLabel(state.cashTime);
            delete entry.bankCode; delete entry.bankBranch; delete entry.bankAccount;
            delete entry.bankLast4; delete entry.bankHolder; delete entry.bankName;
          } else {
            entry.status = 'transferring';
            const eBankCode    = document.getElementById('inp-bank-code')?.value.trim();
            const eBankBranch  = document.getElementById('inp-bank-branch')?.value.trim();
            const eBankAccount = document.getElementById('inp-bank-account')?.value.trim();
            const eBankHolder  = document.getElementById('inp-bank-holder')?.value.trim();
            if (eBankCode)    { entry.bankCode   = eBankCode;   entry.bankName = composeBankName(eBankCode, eBankBranch); }
            if (eBankBranch)  { entry.bankBranch = eBankBranch; }
            if (eBankAccount) { entry.bankAccount = eBankAccount; entry.bankLast4 = eBankAccount.slice(-4); }
            if (eBankHolder)  { entry.bankHolder  = eBankHolder; }
            delete entry.branch; delete entry.appointmentDate; delete entry.appointmentHours;
          }
          localStorage.setItem(key, JSON.stringify(list));
        }
      } catch {}

      // 完成畫面：顯示「修改完成」文案
      const doneTitle = document.querySelector('.done-state h2');
      const doneDesc  = document.querySelector('.done-state > p');
      if (doneTitle) doneTitle.textContent = '提領資料已修改';
      if (doneDesc)  doneDesc.textContent  = '您的提領資料已成功更新，財務作業將依新資料執行。';
      document.getElementById('done-method').textContent =
        state.method === 'cash' ? '現場領取' : '匯款入帳';
      const doneApptRow  = document.getElementById('done-appointment-row');
      const doneAppt     = document.getElementById('done-appointment');
      if (doneApptRow && doneAppt) {
        if (state.method === 'cash') {
          doneApptRow.style.display = 'flex';
          doneAppt.textContent = `${state.cashDateLabel || state.cashDate} ${getCashTimeLabel(state.cashTime)}`;
        } else {
          doneApptRow.style.display = 'none';
        }
      }
      const editPayoutRow = document.getElementById('done-payout-row');
      const editPayoutEl  = document.getElementById('done-payout-date');
      const editExpectedPayout = state.method === 'transfer' ? calcExpectedPayoutDate() : null;
      if (editPayoutRow && editPayoutEl) {
        if (editExpectedPayout) {
          editPayoutEl.textContent = editExpectedPayout.replace(/-/g, '/');
          editPayoutRow.style.display = 'flex';
        } else {
          editPayoutRow.style.display = 'none';
        }
      }
      document.getElementById('done-date').textContent = new Date().toLocaleDateString('zh-TW');
      // 金額／筆數不適用於修改流程，隱藏該列
      ['done-amount', 'done-count'].forEach((elId) => {
        const row = document.getElementById(elId)?.closest('.row');
        if (row) row.hidden = true;
      });

      showStep(3);
      return;
    }

    // 首次提領的基本檢查（demo 用）
    if (!HAS_TAX_PROFILE && !state.confirmReused) {
      const name = document.getElementById('inp-real-name')?.value.trim();
      const id = document.getElementById('inp-id-number')?.value.trim();
      const address = document.getElementById('inp-address')?.value.trim();
      const bankCode    = state.method !== 'cash' ? document.getElementById('inp-bank-code')?.value.trim()    : 'ok';
      const bankAccount = state.method !== 'cash' ? document.getElementById('inp-bank-account')?.value.trim() : 'ok';
      const bankHolder  = state.method !== 'cash' ? document.getElementById('inp-bank-holder')?.value.trim()  : 'ok';
      const consent = document.getElementById('inp-consent').checked;

      if (!name || !id || !address || !bankCode || !bankAccount || !bankHolder) {
        alert('請完成所有稅務與匯款資料的填寫');
        return;
      }
      if (!consent) {
        alert('請同意稅務申報與個資使用條款');
        return;
      }
    }

    if (state.method === 'cash') {
      if (!state.cashBranch) {
        alert('請選擇提領門市（台北板橋分公司 或 台中中部總公司）');
        return;
      }
      if (!state.cashDate) {
        alert('請先選擇現場預約日期（僅可選下三週的週一或週三）');
        return;
      }
      if (!state.cashTime) {
        alert('請選擇預約時段（上午 10:00-12:00 或 下午 14:00-16:00）');
        return;
      }
      const allowedDates = getNextThreeWeeksMonWed().map(fmtDateYmd);
      const today = toDateOnly(new Date());
      const chosen = toDateOnly(new Date(state.cashDate));
      if (!allowedDates.includes(state.cashDate) || chosen < today) {
        alert('預約日期無效，僅可選擇下三週的週一或週三');
        return;
      }
    }

    // 顯示完成頁
    const items = getSelectedItems();
    const total = items.reduce((s, r) => s + r.amount, 0);
    document.getElementById('done-amount').textContent = '$' + fmt(total);
    document.getElementById('done-count').textContent = items.length + ' 筆';
    document.getElementById('done-method').textContent =
      state.method === 'cash' ? '現場領取' : '匯款入帳';
    const doneAppointmentRow = document.getElementById('done-appointment-row');
    const doneAppointment = document.getElementById('done-appointment');
    if (doneAppointmentRow && doneAppointment) {
      if (state.method === 'cash') {
        doneAppointmentRow.style.display = 'flex';
        doneAppointment.textContent = `${state.cashDateLabel || state.cashDate} ${getCashTimeLabel(state.cashTime)}`;
      } else {
        doneAppointmentRow.style.display = 'none';
        doneAppointment.textContent = '—';
      }
    }
    const donePayoutRow = document.getElementById('done-payout-row');
    const donePayoutDateEl = document.getElementById('done-payout-date');
    const expectedPayoutAt = state.method === 'transfer' ? calcExpectedPayoutDate() : null;
    if (donePayoutRow && donePayoutDateEl) {
      if (expectedPayoutAt) {
        donePayoutDateEl.textContent = expectedPayoutAt.replace(/-/g, '/');
        donePayoutRow.style.display = 'flex';
      } else {
        donePayoutRow.style.display = 'none';
      }
    }
    const todayStr = new Date().toLocaleDateString('zh-TW');
    document.getElementById('done-date').textContent = todayStr;

    // === A5：把申請狀態寫回 localStorage，讓 rewards.js 重新渲染時升級狀態 ===
    // rewards.js 載入時會掃描此 key 並將對應 id 之狀態改為 transferring / pending_pickup
    try {
      const key = 'mgm_pending_withdraw_apply';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const newStatus = state.method === 'cash' ? 'pending_pickup' : 'transferring';
      // 收集本次填寫的完整資料，方便後續修改時預填
      const _realName    = HAS_TAX_PROFILE ? HISTORY_TAX.realName    : (document.getElementById('inp-real-name')?.value.trim()    || '');
      const _idNumber    = HAS_TAX_PROFILE ? HISTORY_TAX.idNumber    : (document.getElementById('inp-id-number')?.value.trim()    || '');
      const _address     = HAS_TAX_PROFILE ? HISTORY_TAX.address     : (document.getElementById('inp-address')?.value.trim()      || '');
      const _bankCode    = HAS_TAX_PROFILE ? HISTORY_TAX.bankCode    : (document.getElementById('inp-bank-code')?.value.trim()    || '');
      const _bankBranch  = HAS_TAX_PROFILE ? HISTORY_TAX.bankBranch  : (document.getElementById('inp-bank-branch')?.value.trim()  || '');
      const _bankAccount = HAS_TAX_PROFILE ? HISTORY_TAX.bankAccount : (document.getElementById('inp-bank-account')?.value.trim() || '');
      const _bankHolder  = HAS_TAX_PROFILE ? HISTORY_TAX.bankHolder  : (document.getElementById('inp-bank-holder')?.value.trim()  || '');
      const _bankName    = composeBankName(_bankCode, _bankBranch);
      const meta = state.method === 'cash'
        ? { branch: (BRANCH_INFO[state.cashBranch]?.name || state.cashBranch), appointmentDate: state.cashDate, appointmentHours: getCashTimeLabel(state.cashTime),
            realName: _realName, idNumber: _idNumber, address: _address }
        : { bankCode: _bankCode, bankBranch: _bankBranch, bankAccount: _bankAccount, bankHolder: _bankHolder,
            bankName: _bankName, bankLast4: _bankAccount.slice(-4),
            expectedPayoutAt,
            realName: _realName, idNumber: _idNumber, address: _address };
      items.forEach((it) => {
        // 同一筆不重覆寫入
        if (existing.find(e => e.id === it.id)) return;
        existing.push({
          id: it.id,
          status: newStatus,
          appliedAt: todayStr.replace(/\//g, '/'),
          method: state.method,
          ...meta,
        });
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch {}

    // === C2：把本月已申請額累計寫入 sessionStorage，供 dashboard / rewards 進度條使用 ===
    try {
      const key = 'mgm_monthly_usage';
      const cur = JSON.parse(sessionStorage.getItem(key) || '{"amount":0,"count":0}');
      cur.amount = (cur.amount || 0) + total;
      cur.count = (cur.count || 0) + items.length;
      sessionStorage.setItem(key, JSON.stringify(cur));
    } catch {}

    showStep(3);

    // 清除 session
    sessionStorage.removeItem('withdraw_items');
  }

  // 沿用歷史資料：直接送出
  function confirmReuseHistory() {
    state.confirmReused = true;
    submitWithdraw();
  }

  function applyExPrecheckGate() {
    const check = (window.MGMCommon && window.MGMCommon.getExEmployeePrecheckState)
      ? window.MGMCommon.getExEmployeePrecheckState()
      : { required: false, passed: true, reason: '' };
    if (!check.required || check.passed) return false;

    document.querySelector('.withdrawal').innerHTML = `
      <div class="withdraw-blocked-notice">
        <i class="fa-solid fa-user-shield"></i>
        <h3>請先完成離職員工驗證流程</h3>
        <p>提領前請先完成離職員工入口的 LINE 好友綁定與表單手機驗證。<br>驗證完成後即可正常申請提領。</p>
        <a class="btn btn-outline" href="../ex-employee.html">前往離職員工入口完成驗證</a>
      </div>`;

    const bars = document.querySelectorAll('.bottom-actions');
    bars.forEach((b) => { b.style.display = 'none'; });
    return true;
  }

  // 帶入個人設定資料 strip（每次提領固定顯示於步驟 2 最上方）
  function initImportProfileStrip() {
    var strip = document.getElementById('import-profile-strip');
    var stripBtn = document.getElementById('btn-import-profile-strip');
    var stripLabel = document.getElementById('import-strip-label');
    if (!strip || !stripBtn) return;

    function readSettings() {
      return (window.MGMCommon && window.MGMCommon.getUserSettings)
        ? window.MGMCommon.getUserSettings()
        : {};
    }

    function hasAnyData(settings) {
      var bank = settings.withdrawal && settings.withdrawal.bank;
      var identity = settings.identity;
      return (bank && (bank.bankCode || bank.bankName)) || (identity && identity.realName);
    }

    function applyImport() {
      var settings = readSettings();
      var bank = settings.withdrawal && settings.withdrawal.bank;
      var identity = settings.identity;

      if (!hasAnyData(settings)) {
        // 尚未設定：提示前往個人設定
        strip.classList.add('strip-empty');
        if (stripLabel) stripLabel.textContent = '尚未設定個人資料，請先至個人設定填寫';
        stripBtn.disabled = true;
        stripBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>未設定';
        return;
      }

      // 若 history-card 正在顯示（回訪流程），切換為 first-form
      var histCard  = document.getElementById('history-card');
      var firstForm = document.getElementById('first-form');
      if (histCard && histCard.style.display !== 'none') {
        histCard.style.display  = 'none';
        if (firstForm) firstForm.style.display = 'block';
      }

      // 填入欄位
      var inpName       = document.getElementById('inp-real-name');
      var inpId         = document.getElementById('inp-id-number');
      var inpAddress    = document.getElementById('inp-address');
      var inpBankCode   = document.getElementById('inp-bank-code');
      var inpBankBranch = document.getElementById('inp-bank-branch');
      var inpAccount    = document.getElementById('inp-bank-account');
      var inpBankHolder = document.getElementById('inp-bank-holder');

      if (identity && identity.realName) {
        if (inpName)    inpName.value    = identity.realName;
        if (inpId)      inpId.value      = identity.idNumber || '';
        if (inpAddress) inpAddress.value = identity.address  || '';
      }
      if (bank && (bank.bankCode || bank.bankName)) {
        if (inpBankCode)   inpBankCode.value   = bank.bankCode   || '';
        if (inpBankBranch) inpBankBranch.value = bank.bankBranch || '';
        if (inpAccount)    inpAccount.value    = bank.accountNo  || '';
        if (inpBankHolder) inpBankHolder.value = bank.accountName || '';
        if (inpName && !inpName.value && bank.accountName) inpName.value = bank.accountName;
      }

      // 帶入完成：更新 strip 狀態
      strip.classList.remove('strip-empty');
      strip.classList.add('strip-done');
      if (stripLabel) stripLabel.textContent = '已帶入個人設定資料';
      stripBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i>重新帶入';
    }

    // 初始狀態：若設定為空，標示為 empty
    var initSettings = readSettings();
    if (!hasAnyData(initSettings)) {
      strip.classList.add('strip-empty');
      if (stripLabel) stripLabel.textContent = '尚未設定個人資料，請先至個人設定填寫';
      stripBtn.disabled = true;
      stripBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i>未設定';
    }

    stripBtn.addEventListener('click', applyImport);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (applyExPrecheckGate()) {
      return;
    }

    window.addEventListener('storage', (e) => {
      if (!e.key) return;
      if (e.key === 'mgm_person_profile' || e.key === 'mgm_ex_line_friend' || e.key === 'mgm_ex_form_phone' || e.key === 'mgm_login_phone') {
        applyExPrecheckGate();
      }
    });

    // 允許直接開啟提領頁：若未從 rewards 帶入勾選項目，預設帶入所有可提領案件
    ensureDefaultWithdrawItems();
    initImportProfileStrip();

    // 黑名單會員防護：封鎖身分僅顯示提示訊息
    if (window.MGMCommon && window.MGMCommon.isCurrentUserBlacklisted && window.MGMCommon.isCurrentUserBlacklisted()) {
      document.querySelector('.withdrawal').innerHTML = `
        <div class="withdraw-blocked-notice">
          <i class="fa-solid fa-ban"></i>
          <h3>您的帳號目前為封鎖身分</h3>
          <p>被封鎖身分的用戶目前僅可查看此提示訊息，<br><strong>分享與獎金功能皆無法使用</strong>。<br>若需進一步了解，請聯繫客服。</p>
        </div>`;
      const bars = document.querySelectorAll('.bottom-actions');
      bars.forEach((b) => { b.style.display = 'none'; });
      return;
    }

    // 編輯模式：偵測是否從獎金頁的「修改提領資料」進入
    const editTarget = getEditTarget();

    renderSummary();
    renderCashDateOptions();
    bindCashDatePicker();
    bindCashTimePicker();
    updateCashSummaryCard();
    bindUpload();

    if (editTarget) {
      enterEditMode(editTarget);
    }

    document.querySelectorAll('.method-option').forEach((el) => {
      el.addEventListener('click', () => selectMethod(el.dataset.method));
    });

    document.querySelectorAll('.branch-btn').forEach((el) => {
      el.addEventListener('click', () => selectBranch(el.dataset.branch));
    });

    document.getElementById('btn-next-1').addEventListener('click', gotoTax);
    document.getElementById('btn-back-2').addEventListener('click', () => {
      if (state.editMode) {
        // 編輯模式：取消修改，返回獎金清單（不可回步驟 1 變更提領方式）
        if (window.MGMCommon && window.MGMCommon.navigate) {
          window.MGMCommon.navigate('rewards');
        }
        return;
      }
      showStep(1);
    });
    document.getElementById('btn-submit').addEventListener('click', submitWithdraw);

    const reuseBtn = document.getElementById('btn-reuse-history');
    if (reuseBtn) reuseBtn.addEventListener('click', confirmReuseHistory);

    const editBtn = document.getElementById('btn-edit-history');
    if (editBtn)
      editBtn.addEventListener('click', () => {
        document.getElementById('history-card').style.display = 'none';
        document.getElementById('first-form').style.display = 'block';
      });

    document.getElementById('btn-back-home').addEventListener('click', () => {
      if (window.MGMCommon && window.MGMCommon.navigate) {
        window.MGMCommon.navigate('rewards');
      }
    });

    // 常設入口：扣繳憑單說明 / 分享制度說明（§六.2）
    document.querySelectorAll('[data-go]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.MGMCommon && window.MGMCommon.navigate) {
          window.MGMCommon.navigate(el.dataset.go);
        }
      });
    });
  });
})();
