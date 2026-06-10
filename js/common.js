/* ==========================================================
   common.js - 全站共用工具（前台 + 後台共用）
   - 身分判定優先級（單一來源，避免 layout / dashboard 不一致）
   - 活動快取讀取（由 admin-campaigns 寫入 sessionStorage 之 active 列表）
   - 月份工具（曆月起迄，超量待審佇列由此決定本月上限歸屬）
   - 三段狀態統一定義（records / rewards / 後台共用）
   ========================================================== */
(function () {
  'use strict';

  const PERSON_PROFILE_KEY = 'mgm_person_profile';
  const PERSON_ROLE_HISTORY_KEY = 'mgm_person_role_history';

  // ---------- 員工主檔（demo；真實環境由後端 API 同步至 localStorage.mgm_employee_master） ----------
  // 以手機號碼為 key；身分欄位（employeeFlag / userRole）不由前台手動設定，以此主檔為準。
  // 一旦出現在主檔（含離職），永遠套用員工推薦規則，不回頭改為一般會員。
  const EMPLOYEE_MASTER_DEMO = [
    { mobile: '0911222333', employeeId: 'E001', name: '李大華',  status: 'Active',   joinDate: '2022/01/05' },
    { mobile: '0966123456', employeeId: 'E007', name: '蘇建志',  status: 'Active',   joinDate: '2026/04/15' },
    { mobile: '0912345678', employeeId: 'E004', name: '陳前輩',  status: 'Resigned', joinDate: '2019/06/20', resignDate: '2026/05/20' },
    { mobile: '0955333222', employeeId: 'E006', name: '李育穎',  status: 'Resigned', joinDate: '2020/03/28', resignDate: '2026/03/28' },
  ];

  function getEmployeeMaster() {
    try {
      var custom = JSON.parse(localStorage.getItem('mgm_employee_master') || '[]');
      if (Array.isArray(custom) && custom.length > 0) return custom;
    } catch (e) {}
    return EMPLOYEE_MASTER_DEMO;
  }

  function checkEmployeeMasterByMobile(mobile) {
    if (!mobile) return { found: false };
    var master = getEmployeeMaster();
    var hit = master.filter(function (e) {
      return String(e.mobile || '').trim() === String(mobile).trim();
    })[0];
    if (!hit) return { found: false };
    return {
      found: true,
      status: hit.status === 'Active' ? 'Active' : 'Resigned',
      employeeId: hit.employeeId || '',
      joinDate: hit.joinDate || '',
      resignDate: hit.resignDate || '',
    };
  }

  // 以員工主檔為單一真相來源：在 resolvePersonProfile 讀取時覆寫身分欄位。
  // 不寫回 sessionStorage，確保主檔變更立即生效而不殘留舊狀態。
  function applyEmployeeMasterOverride(profile) {
    if (!profile || !profile.mobile) return profile;
    var emp = checkEmployeeMasterByMobile(profile.mobile);
    if (!emp.found) return profile;
    var override = Object.assign({}, profile);
    override.employeeFlag = 'Y';
    if (emp.status === 'Active') {
      override.userRole = 'Employee';
      override.employeeStatus = 'Active';
    } else {
      override.userRole = 'Visitor';
      override.employeeStatus = 'Resigned';
      if (emp.resignDate && !override.resignDate) override.resignDate = emp.resignDate;
    }
    return override;
  }

  function todayYmd() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd}`;
  }

  function mapIdentityToProfileFields(identity) {
    if (identity === '員工') {
      return { userRole: 'Employee', employeeFlag: 'Y', employeeStatus: 'Active' };
    }
    if (identity === '離職員工') {
      return { userRole: 'Visitor', employeeFlag: 'Y', employeeStatus: 'Resigned' };
    }
    return { userRole: 'Visitor', employeeFlag: 'N', employeeStatus: null };
  }

  function normalizePersonProfile(profile) {
    if (!profile || typeof profile !== 'object') return null;

    const identityNo = String(profile.identityNo || profile.personId || '').trim().toUpperCase();
    const mobile = String(profile.mobile || profile.phone || '').trim();
    const uid = String(profile.uid || profile.memberUid || profile.lineUserId || '').trim();
    const lineUserId = String(profile.lineUserId || profile.uid || profile.memberUid || '').trim();

    let userRole = profile.userRole === 'Employee' ? 'Employee' : 'Visitor';
    let employeeFlag = profile.employeeFlag === 'Y' ? 'Y' : 'N';
    let employeeStatus = profile.employeeStatus === 'Active'
      ? 'Active'
      : (profile.employeeStatus === 'Resigned' ? 'Resigned' : null);

    if (userRole === 'Employee') {
      employeeFlag = 'Y';
      employeeStatus = 'Active';
    } else if (employeeStatus === 'Resigned') {
      employeeFlag = 'Y';
    } else if (employeeFlag !== 'Y') {
      employeeStatus = null;
    }

    return {
      personId: identityNo || String(profile.personId || '').trim().toUpperCase() || '',
      identityNo,
      mobile,
      lineUserId,
      uid,
      userRole,
      employeeFlag,
      employeeStatus,
      name: String(profile.name || '').trim(),
      source: String(profile.source || '').trim(),
      resignDate: String(profile.resignDate || '').trim(),
    };
  }

  function getRoleTypeFromProfile(profile) {
    const normalized = normalizePersonProfile(profile);
    if (!normalized) return '';
    if (normalized.userRole === 'Employee' && normalized.employeeStatus === 'Active') return 'Employee';
    if (normalized.employeeFlag === 'Y' && normalized.employeeStatus === 'Resigned') return 'ResignedEmployee';
    return 'Visitor';
  }

  function getPersonRoleHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(PERSON_ROLE_HISTORY_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  }

  function setPersonRoleHistory(history) {
    try {
      localStorage.setItem(PERSON_ROLE_HISTORY_KEY, JSON.stringify(Array.isArray(history) ? history : []));
    } catch {}
  }

  function syncPersonRoleHistory(profile, sourceSystem, startDate) {
    const normalized = normalizePersonProfile(profile);
    if (!normalized || !normalized.personId) return;

    const roleType = getRoleTypeFromProfile(normalized);
    const effectiveDate = startDate || todayYmd();
    const source = sourceSystem || normalized.source || 'system';
    const history = getPersonRoleHistory();
    const activeIndex = history.findIndex((item) => item.personId === normalized.personId && !item.endDate);

    if (activeIndex >= 0) {
      const activeItem = history[activeIndex];
      if (activeItem.roleType === roleType && activeItem.sourceSystem === source) {
        return;
      }
      history[activeIndex] = Object.assign({}, activeItem, { endDate: effectiveDate });
    }

    history.push({
      personId: normalized.personId,
      roleType,
      startDate: effectiveDate,
      endDate: null,
      sourceSystem: source,
    });
    setPersonRoleHistory(history);
  }

  function resolveLegacyIdentity() {
    try {
      const ex = sessionStorage.getItem('mgm_login_identity');
      if (ex === '員工' || ex === '離職員工' || ex === '會員') return ex;
      const plan = localStorage.getItem('mgm_current_user_plan');
      if (plan === 'employee') return '員工';
    } catch {}
    return '會員';
  }

  function buildLegacyPersonProfile() {
    const identity = resolveLegacyIdentity();
    const fields = mapIdentityToProfileFields(identity);
    let identityNo = '';
    let mobile = '';
    let uid = '';
    let name = '';
    let source = '';
    let resignDate = '';
    try {
      identityNo = String(sessionStorage.getItem('mgm_login_id_number') || '').trim().toUpperCase();
      mobile = String(sessionStorage.getItem('mgm_login_phone') || '').trim();
      uid = String(sessionStorage.getItem('mgm_login_uid') || '').trim();
      name = String(sessionStorage.getItem('mgm_login_name') || '').trim();
      source = String(sessionStorage.getItem('mgm_login_source') || '').trim();
      resignDate = String(sessionStorage.getItem('mgm_ex_resign_date') || '').trim();
    } catch {}
    return normalizePersonProfile({
      personId: identityNo,
      identityNo,
      mobile,
      lineUserId: uid,
      uid,
      name,
      source,
      resignDate,
      userRole: fields.userRole,
      employeeFlag: fields.employeeFlag,
      employeeStatus: fields.employeeStatus,
    });
  }

  function resolvePersonProfile() {
    var profile = null;
    try {
      var raw = sessionStorage.getItem(PERSON_PROFILE_KEY);
      if (raw) profile = normalizePersonProfile(JSON.parse(raw));
    } catch (e) {}
    if (!profile) profile = buildLegacyPersonProfile();
    return applyEmployeeMasterOverride(profile);
  }

  function setPersonProfile(profile) {
    const normalized = normalizePersonProfile(profile);
    if (!normalized) return null;
    try {
      sessionStorage.setItem(PERSON_PROFILE_KEY, JSON.stringify(normalized));
    } catch {}
    syncPersonRoleHistory(normalized, normalized.source, todayYmd());
    return normalized;
  }

  function mergePersonProfile(partialProfile) {
    const current = resolvePersonProfile() || {};
    return setPersonProfile(Object.assign({}, current, partialProfile));
  }

  // 某些瀏覽器擴充套件會在頁面產生非業務相關的未處理 Promise 錯誤，
  // 這裡僅精準忽略已知訊息，避免干擾專案除錯。
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event && event.reason;
    const msg = reason && reason.message ? String(reason.message) : String(reason || '');
    if (msg.includes('A listener indicated an asynchronous response by returning true')) {
      event.preventDefault();
    }
  });

  // ---------- 身分判定 ----------
  // 優先級從高到低：
  //   0) sessionStorage.mgm_person_profile（新角色模型）
  //   1) sessionStorage.mgm_login_identity（ex-employee.html 真實 2FA 登入）
  //   2) localStorage.mgm_current_user_plan（demo 切換器 / 真實帳號方案）
  //   3) 預設 '會員' / 'customer'
  function resolveIdentity() {
    const profile = resolvePersonProfile();
    if (profile) {
      if (profile.userRole === 'Employee' && profile.employeeStatus === 'Active') return '員工';
      if (profile.employeeFlag === 'Y' && profile.employeeStatus === 'Resigned') return '離職員工';
    }
    return '會員';
  }

  function resolvePlan() {
    const profile = resolvePersonProfile();
    if (profile && profile.userRole === 'Employee' && profile.employeeStatus === 'Active') {
      return 'employee';
    }
    return 'customer';
  }

  function resolvePermissionLevel() {
    const profile = resolvePersonProfile();
    if (profile) {
      if (profile.userRole === 'Employee' && profile.employeeStatus === 'Active') return 'employee';
      if (profile.employeeFlag === 'Y' && profile.employeeStatus === 'Resigned') return 'resigned-employee';
    }
    return 'visitor';
  }

  function isResignedEmployee() {
    return resolvePermissionLevel() === 'resigned-employee';
  }

  function isActiveEmployee() {
    return resolvePermissionLevel() === 'employee';
  }

  function resolveDisplayName(fallback) {
    try {
      const n = sessionStorage.getItem('mgm_login_name');
      if (n) return n;
    } catch {}
    return fallback || '王小毅';
  }

  // ---------- 離職員工登入前置驗證（LINE 好友 + 表單手機） ----------
  // 非離職員工視為已通過；離職員工需同時具備：
  // 1) mgm_ex_line_friend = '1'
  // 2) mgm_ex_form_phone 有值
  // 3) 該手機與登入手機一致（若有登入手機）
  function getExEmployeePrecheckState() {
    if (!isResignedEmployee()) {
      return { required: false, passed: true, reason: '' };
    }

    let lineFriend = false;
    let formPhone = '';
    let loginPhone = '';
    try {
      lineFriend = sessionStorage.getItem('mgm_ex_line_friend') === '1';
      formPhone = sessionStorage.getItem('mgm_ex_form_phone') || '';
      loginPhone = sessionStorage.getItem('mgm_login_phone') || '';
    } catch {}

    if (!lineFriend) {
      return { required: true, passed: false, reason: 'missing_line_friend' };
    }
    if (!formPhone) {
      return { required: true, passed: false, reason: 'missing_form_phone' };
    }
    if (loginPhone && formPhone !== loginPhone) {
      return { required: true, passed: false, reason: 'phone_mismatch' };
    }

    return { required: true, passed: true, reason: '' };
  }

  function isExEmployeePrecheckReady() {
    return getExEmployeePrecheckState().passed;
  }

  // ---------- 離職員工分享規則 ----------
  // 目前業務規則：離職員工可持續分享，不套用「次日鎖定分享」限制。
  // 取得「離職日期」（demo：sessionStorage.mgm_ex_resign_date，格式 'YYYY/MM/DD'）
  // 真實環境應由後台帳號資料表 T_User 取得
  function getResignDate() {
    try {
      const s = sessionStorage.getItem('mgm_ex_resign_date');
      if (s) return toDate(s);
    } catch {}
    return null;
  }

  // 相容保留：既有程式仍可能呼叫此函式；目前統一回傳 false。
  function isExEmployeeLocked() {
    return false;
  }

  function isPlanPaused(plan) {
    try { return localStorage.getItem('mgm_plan_paused_' + plan) === '1'; }
    catch { return false; }
  }

  // ---------- 獎金資料（demo，rewards 與 dashboard 共用） ----------
  // 注意：每個 iframe 各自載入一份 common.js，因此「狀態升級」必須透過
  // localStorage.mgm_pending_withdraw_apply 中介，兩邊計算才會一致。
  const REWARDS_DEMO_SOURCE = [
    {
      id: 'M2026051504',
      name: '張Ｏ豪',
      product: '房屋貸款 + 汽車貸款',
      payoutAmount: 4500000,
      snapshot: {
        mode: 'additive',
        totalCap: 18000,
        items: [
          { projectKey: 'home', projectLabel: '房屋貸款', base: 2000, ratio: 0.25, cap: 15000 },
          { projectKey: 'car', projectLabel: '汽車貸款', base: 1000, ratio: 0.5, cap: 5000 },
        ],
      },
      payoutAt: '2026/05/16',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026051205',
      name: '吳Ｏ芳',
      product: '汽車貸款',
      payoutAmount: 300000,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      payoutAt: '2026/05/13',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026050610',
      name: '葉Ｏ群',
      product: '汽車貸款',
      payoutAmount: 400000,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      payoutAt: '2026/05/07',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026052711',
      name: '陳Ｏ澤',
      product: '房屋貸款',
      payoutAmount: 2800000,
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 },
      payoutAt: '2026/05/28',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026052917',
      name: '林Ｏ君',
      product: '信用貸款',
      payoutAmount: 220000,
      snapshot: { base: 500, ratio: 0.2, cap: 5000 },
      payoutAt: '2026/05/29',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026053018',
      name: '黃Ｏ翔',
      product: '汽車貸款',
      payoutAmount: 520000,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      payoutAt: '2026/05/30',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026060119',
      name: '曾Ｏ宇',
      product: '房屋貸款',
      payoutAmount: 3200000,
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 },
      payoutAt: '2026/06/01',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026060220',
      name: '鄭Ｏ安',
      product: '信用貸款',
      payoutAmount: 250000,
      snapshot: { base: 500, ratio: 0.2, cap: 5000 },
      payoutAt: '2026/06/02',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026053002',
      name: '陳Ｏ君',
      product: '一般貸款',
      payoutAmount: 300000,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      payoutAt: '2026/05/31',
      status: 'rewardable',
      eligibleApproved: false,
    },
    {
      id: 'M2026050806',
      name: '李Ｏ仁',
      product: '信用貸款',
      payoutAmount: 100000,
      snapshot: { base: 500, ratio: 0, cap: 500 },
      payoutAt: '2026/05/09',
      appliedAt: '2026/05/22',
      method: 'transfer',
      bankName: '玉山銀行',
      bankLast4: '1234',
      bankAccount: '0118-979-12345678',
      realName: '王小毅',
      idNumber: 'A123456789',
      address: '台北市信義區松仁路100號5樓',
      status: 'transferring',
    },
    {
      id: 'M2026042214',
      name: '何Ｏ蓁',
      product: '房屋貸款',
      payoutAmount: 3500000,
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 },
      payoutAt: '2026/04/24',
      appliedAt: '2026/04/26',
      method: 'transfer',
      bankName: '玉山銀行',
      bankLast4: '1234',
      transferredAt: '2026/04/30',
      status: 'transferred',
    },
    {
      id: 'M2026060310',
      name: '蔡Ｏ玉',
      product: '房屋貸款',
      payoutAmount: 2500000,
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 },
      payoutAt: '2026/05/05',
      appliedAt: '2026/05/18',
      method: 'cash',
      branch: '中部總公司',
      appointmentDate: '2026/06/10',
      appointmentHours: '10:00-17:00',
      realName: '王小毅',
      idNumber: 'A123456789',
      address: '台北市信義區松仁路100號5樓',
      status: 'pending_pickup',
    },
    {
      id: 'M2026050415',
      name: '柯Ｏ玟',
      product: '汽車貸款',
      payoutAmount: 160000,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 },
      payoutAt: '2026/05/06',
      appliedAt: '2026/05/20',
      method: 'cash',
      branch: '板橋分公司',
      appointmentDate: '2026/06/12',
      appointmentHours: '10:00-17:00',
      realName: '王小毅',
      idNumber: 'A123456789',
      address: '台北市信義區松仁路100號5樓',
      status: 'pending_pickup',
    },
    {
      id: 'M2026031816',
      name: '高Ｏ仁',
      product: '信用貸款',
      payoutAmount: 100000,
      snapshot: { base: 500, ratio: 0, cap: 500 },
      payoutAt: '2026/03/20',
      appliedAt: '2026/03/25',
      method: 'cash',
      branch: '現場',
      pickedUpAt: '2026/03/28',
      status: 'picked_up',
    },
    {
      id: 'M2026042920',
      name: '林Ｏ妤',
      product: '信用貸款',
      payoutAmount: 100000,
      snapshot: { base: 500, ratio: 0, cap: 500 },
      payoutAt: '2026/04/30',
      appliedAt: '2026/05/03',
      method: 'transfer',
      bankName: '玉山銀行',
      bankLast4: '9999',
      failReason: '帳號錯誤，銀行退匯',
      failedAt: '2026/05/05 13:00',
      status: 'transfer_failed',
    },
  ];

  // ---------- 可提領清單（會計已確認獲獎資格） ----------
  // 內部確認完成後，將案件 id 放入此清單，前台才會顯示為可提領。
  const WITHDRAWABLE_APPROVAL_LIST_DEMO = [
    {
      id: 'M2026052711',
      approvedAt: '2026/05/29 11:20',
      approvedBy: '會計A01',
      note: '線下核對完成，資格確認通過',
    },
    {
      id: 'M2026052917',
      approvedAt: '2026/05/29 16:40',
      approvedBy: '會計A02',
      note: '線下核對完成，資格確認通過',
    },
    {
      id: 'M2026053002',
      approvedAt: '2026/06/01 10:00',
      approvedBy: '會計A01',
      note: '線下核對完成，資格確認通過',
    },
  ];

  function getWithdrawableApprovalList() {
    const fallback = WITHDRAWABLE_APPROVAL_LIST_DEMO.map((x) => Object.assign({}, x));
    try {
      const custom = JSON.parse(localStorage.getItem('mgm_reward_eligible_approved_list') || '[]');
      if (!Array.isArray(custom) || custom.length === 0) return fallback;
      return custom
        .filter((x) => x && x.id)
        .map((x) => ({
          id: String(x.id),
          approvedAt: x.approvedAt || '',
          approvedBy: x.approvedBy || '',
          note: x.note || '',
        }));
    } catch {
      return fallback;
    }
  }

  function applyWithdrawableApprovalList(list, approvals) {
    if (!Array.isArray(list) || !Array.isArray(approvals) || approvals.length === 0) return;
    const byId = new Map(approvals.map((a) => [a.id, a]));
    list.forEach((r) => {
      if (!r || r.status !== 'rewardable') return;
      const hit = byId.get(r.id);
      if (!hit) return;
      r.eligibleApproved = true;
      if (hit.approvedAt) r.accountingApprovedAt = hit.approvedAt;
      if (hit.approvedBy) r.accountingApprovedBy = hit.approvedBy;
      if (hit.note) r.accountingApprovedNote = hit.note;
    });
  }

  function calcSingleRule(rule, payoutAmount) {
    const base = Number(rule && rule.base) || 0;
    const ratio = Number(rule && rule.ratio) || 0;
    const cap = Number(rule && rule.cap) || 0;
    const loan = Number(payoutAmount);
    if (isNaN(loan)) {
      return { base, ratio, cap, subtotal: null, reward: null };
    }
    const subtotal = base + loan * (ratio / 100);
    const reward = Math.min(subtotal, cap);
    return { base, ratio, cap, subtotal, reward };
  }

  function calculateRewardBySnapshot(snapshot, payoutAmount) {
    if (!snapshot || typeof snapshot !== 'object') return null;

    if (Array.isArray(snapshot.items) && snapshot.items.length) {
      const lines = snapshot.items.map((item) => {
        const line = calcSingleRule(item, payoutAmount);
        return Object.assign({
          projectKey: item.projectKey || '',
          projectLabel: item.projectLabel || item.projectKey || '未命名專案',
        }, line);
      });
      const hasLoan = lines.every((x) => x.reward != null);
      const subtotal = hasLoan ? lines.reduce((s, x) => s + x.reward, 0) : null;
      const totalCap = snapshot.totalCap == null ? null : Number(snapshot.totalCap);
      const amount = (subtotal == null || (totalCap != null && isNaN(totalCap)))
        ? subtotal
        : (totalCap == null ? subtotal : Math.min(subtotal, totalCap));
      return {
        mode: 'additive',
        lines,
        subtotal,
        totalCap,
        amount,
      };
    }

    if (snapshot.base != null || snapshot.ratio != null || snapshot.cap != null) {
      const one = calcSingleRule(snapshot, payoutAmount);
      return {
        mode: 'single',
        lines: [Object.assign({ projectKey: '', projectLabel: '單一專案' }, one)],
        subtotal: one.reward,
        totalCap: Number(snapshot.cap) || 0,
        amount: one.reward,
      };
    }

    return null;
  }

  function getRewardsDemo() {
    // 回傳深拷貝避免外部誤改影響其他呼叫端
    const list = REWARDS_DEMO_SOURCE.map((r) => Object.assign({}, r));
    applyWithdrawableApprovalList(list, getWithdrawableApprovalList());
    // 統一快照計算來源：若案件有 snapshot + payoutAmount，優先由共用公式回推 amount
    list.forEach((r) => {
      const calc = calculateRewardBySnapshot(r.snapshot, r.payoutAmount);
      if (!calc || calc.amount == null || isNaN(calc.amount)) return;
      r.amount = Math.round(calc.amount);
      r.calc = calc;
    });

    // 套用「提領失敗」記錄（由後台 admin-payments.js 寫入 localStorage）
    try {
      const failedList = JSON.parse(localStorage.getItem('mgm_failed_withdrawals') || '[]');
      failedList.forEach((f) => {
        const r = list.find((x) => x.id === f.caseId);
        if (!r) return;
        if (r.status === 'transferring' || r.status === 'pending_pickup') {
          r.status = 'transfer_failed';
          if (f.failReason) r.failReason = f.failReason;
          if (f.failedAt) r.failedAt = f.failedAt;
        }
      });
    } catch {}

    // 套用「已申請提領」之狀態升級（由 withdrawal.js 寫入 localStorage）
    try {
      const apply = JSON.parse(localStorage.getItem('mgm_pending_withdraw_apply') || '[]');
      apply.forEach((a) => {
        const r = list.find((x) => x.id === a.id);
        if (!r || r.status !== 'rewardable') return;
        r.status = a.status;
        if (a.appliedAt) r.appliedAt = a.appliedAt;
        if (a.method) r.method = a.method;
        if (a.bankName) r.bankName = a.bankName;
        if (a.bankLast4) r.bankLast4 = a.bankLast4;
        if (a.branch) r.branch = a.branch;
        if (a.appointmentDate) r.appointmentDate = a.appointmentDate;
        if (a.appointmentHours) r.appointmentHours = a.appointmentHours;
      });
    } catch {}
    // 黑名單會員：未被人工放行之獎金 → 凍結為「人工審核中（pending_review）」
    if (isCurrentUserBlacklisted()) {
      const released = getBlacklistReleasedIds();
      list.forEach((r) => {
        if (r.status === 'rewardable' && !released.has(r.id)) {
          r.status = 'pending_review';
          r.blacklistFrozen = true;
        }
      });
    }
    return list.filter(isRewardVisibleToUser);
  }

  function getRewardsOverview() {
    const list = getRewardsDemo();
    const isSelectable = (r) => r.status === 'rewardable';
    const isCompleted = (r) => r.status === 'transferred' || r.status === 'picked_up';
    const available = list.filter(isSelectable).reduce((s, r) => s + r.amount, 0);
    const pendingCount = list.filter(isSelectable).length;
    const withdrawn = list.filter(isCompleted).reduce((s, r) => s + r.amount, 0);
    return { available, pendingCount, withdrawn };
  }

  // ---------- 黑名單 / 凍結帳號判定 ----------
  // 單一資料源：localStorage.mgm_frozen_uids（admin-blacklist / admin-referrers 共同維護）
  function getFrozenUids() {
    try { return new Set(JSON.parse(localStorage.getItem('mgm_frozen_uids') || '[]')); }
    catch { return new Set(); }
  }
  function isUidBlacklisted(uid) {
    if (!uid) return false;
    return getFrozenUids().has(uid);
  }
  // 取得目前登入身分對應之 UID（員工 2FA 登入時寫入 sessionStorage.mgm_login_uid）
  function getCurrentLoginUid() {
    try { return sessionStorage.getItem('mgm_login_uid') || null; }
    catch { return null; }
  }

  // 手機 OTP 驗證狀態（依 UID 儲存）
  // 結構：localStorage.mgm_phone_otp_verified_by_uid = { U10025: true, ... }
  function getPhoneOtpVerifiedMap() {
    try { return JSON.parse(localStorage.getItem('mgm_phone_otp_verified_by_uid') || '{}'); }
    catch { return {}; }
  }
  function isPhoneOtpVerified(uid) {
    const targetUid = uid || getCurrentLoginUid();
    if (!targetUid) return false;
    const map = getPhoneOtpVerifiedMap();
    return map[targetUid] === true;
  }
  function setPhoneOtpVerified(uid, verified) {
    const targetUid = uid || getCurrentLoginUid();
    if (!targetUid) return;
    try {
      const map = getPhoneOtpVerifiedMap();
      map[targetUid] = verified !== false;
      localStorage.setItem('mgm_phone_otp_verified_by_uid', JSON.stringify(map));
    } catch {}
  }
  function isCurrentUserBlacklisted() {
    // demo 切換器強制旗標：mgm_blacklisted='1' 即視為被封鎖
    try {
      if (sessionStorage.getItem('mgm_blacklisted') === '1') return true;
    } catch {}
    return isUidBlacklisted(getCurrentLoginUid());
  }

  // 黑名單帳戶之獎金「人工放行清單」（admin-pending-review 寫入；rewards/withdrawal 讀取）
  // 結構：localStorage.mgm_blacklist_released_ids = ['M2026051504', ...]
  function getBlacklistReleasedIds() {
    try { return new Set(JSON.parse(localStorage.getItem('mgm_blacklist_released_ids') || '[]')); }
    catch { return new Set(); }
  }
  function isRewardReleased(id) {
    return getBlacklistReleasedIds().has(id);
  }
  function releaseBlacklistReward(id) {
    try {
      const cur = new Set(JSON.parse(localStorage.getItem('mgm_blacklist_released_ids') || '[]'));
      cur.add(id);
      localStorage.setItem('mgm_blacklist_released_ids', JSON.stringify([...cur]));
    } catch {}
  }
  function revokeBlacklistReward(id) {
    try {
      const cur = new Set(JSON.parse(localStorage.getItem('mgm_blacklist_released_ids') || '[]'));
      cur.delete(id);
      localStorage.setItem('mgm_blacklist_released_ids', JSON.stringify([...cur]));
    } catch {}
  }

  // ---------- 目前進行中活動快取 ----------
  // admin-campaigns.js 會把每個方案目前 active 之活動寫入 sessionStorage
  // 結構：{ employee: [{id,start,end,name}], customer: [...] }
  // 若快取不存在，回傳一份預設值供前台呈現
  function getActiveCampaign(plan) {
    plan = plan || resolvePlan();
    try {
      const snap = JSON.parse(sessionStorage.getItem('mgm_active_campaigns') || '{}');
      const list = snap[plan] || [];
      // 篩出當下時間落在 start ~ end 之間者
      const now = Date.now();
      const hit = list.find(c => {
        const s = toDate(c.start), e = toDate(c.end);
        return s && e && s.getTime() <= now && now <= e.getTime();
      });
      if (hit) return hit;
    } catch {}
    // fallback 預設值（demo 用）
    return plan === 'employee'
      ? { id: 'CAMP-E-2026Q2', name: '2026 Q2 員工推薦獎勵',     start: '2026/04/01 00:00', end: '2026/06/30 23:59' }
      : { id: 'CAMP-C-2026Q2', name: '2026 Q2 會員初夏推薦大賞', start: '2026/04/01 00:00', end: '2026/06/30 23:59' };
  }

  function toDate(s) {
    if (s instanceof Date) return s;
    if (!s) return null;
    const d = new Date(String(s).replace(/\//g, '-').replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }

  function shiftToBusinessDay(date) {
    const d = new Date(date);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  }

  // 可提領效期規則：案件達成月份次月 25 日核款（遇假日順延），次日起算 180 天內可提領
  function getRewardableWindow(reward) {
    if (!reward || reward.status !== 'rewardable') return null;
    const payoutDate = toDate(reward.payoutAt);
    if (!payoutDate) return null;

    const settlementDate = shiftToBusinessDay(
      new Date(payoutDate.getFullYear(), payoutDate.getMonth() + 1, 25)
    );
    const validFrom = new Date(settlementDate);
    validFrom.setDate(validFrom.getDate() + 1);

    const validTo = new Date(settlementDate);
    validTo.setDate(validTo.getDate() + 180);

    return { settlementDate, validFrom, validTo };
  }

  // 會計線下核對後，確認推薦有獲獎資格才可顯示／提領
  function isRewardEligibleApproved(reward) {
    if (!reward || reward.status !== 'rewardable') return true;
    if (reward.eligibleApproved === true) return true;
    return !!reward.accountingApprovedAt;
  }

  // 可提領需同時滿足：狀態為 rewardable 且會計已確認獲獎資格
  function canRewardBeWithdrawn(reward) {
    if (!reward || reward.status !== 'rewardable') return false;
    return isRewardEligibleApproved(reward);
  }

  // 前台可見規則：未確認獲獎資格的 rewardable 案件不顯示在用戶畫面
  function isRewardVisibleToUser(reward) {
    if (!reward) return false;
    if (reward.status !== 'rewardable') return true;
    return isRewardEligibleApproved(reward);
  }

  // ---------- 倒數計算（活動結束日，會員顯示口徑） ----------
  // 回傳：{ ended, daysLeft, endDateStr, label }
  // label 已是可直接顯示之文字
  function formatCampaignCountdown(campaign) {
    const end = toDate(campaign && campaign.end);
    if (!end) return { ended: true, daysLeft: 0, endDateStr: '—', label: '活動已結束' };
    const now = Date.now();
    if (end.getTime() <= now) {
      return { ended: true, daysLeft: 0, endDateStr: end.toLocaleDateString('zh-TW'), label: '本檔活動已結束' };
    }
    // 剩餘天數採「自然日」計算：以當地時區之 00:00 為基準，將「今日」與「結束日」皆 normalize 後相減
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    const endDay0 = new Date(end); endDay0.setHours(0, 0, 0, 0);
    const daysLeft = Math.max(0, Math.round((endDay0.getTime() - today0.getTime()) / 86400000));
    const endDateStr = end.toLocaleDateString('zh-TW');
    return {
      ended: false,
      daysLeft,
      endDateStr,
      label: `活動結束於 ${endDateStr}（剩 ${daysLeft} 天）`,
    };
  }

  // ---------- 月份工具（曆月：1 日 00:00:00 ~ 月底 23:59:59） ----------
  function monthRange(ref) {
    const d = ref ? new Date(ref) : new Date();
    const y = d.getFullYear(), m = d.getMonth();
    const start = new Date(y, m, 1, 0, 0, 0, 0);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    return { start, end, yyyymm: y + '-' + String(m + 1).padStart(2, '0') };
  }

  function isInThisMonth(dateStr) {
    const d = toDate(dateStr);
    if (!d) return false;
    const { start, end } = monthRange();
    return d >= start && d <= end;
  }

  // ---------- 月份上限設定（與 admin-limits 同步；超額 → pending_review） ----------
  // 後台 admin-limits 可改寫 storage 值（demo 用）
  function getMonthlyLimits() {
    let amt = 50000, cnt = 5;
    try {
      const a = parseInt(localStorage.getItem('mgm_monthly_amount_limit'), 10);
      const c = parseInt(localStorage.getItem('mgm_monthly_count_limit'), 10);
      if (!isNaN(a) && a > 0) amt = a;
      if (!isNaN(c) && c > 0) cnt = c;
    } catch {}
    return { amount: amt, count: cnt };
  }

  // ---------- 三段狀態統一（記錄 / 獎金 / 後台共用） ----------
  // 內部狀態 → 使用者面三段（未符合 / 已符合 / 已歸檔）
  // bucket：reviewing(審核中含 confirmed/pending_review) / rewardable(可提領+提領中) / archived(已提領/未符合)
  const STATUS_MAP = {
    // 案件未確認專案
    reviewing:      { bucket: 'reviewing',  label: '審核中',     badge: 'badge-yellow' },
    // 已確認專案待撥款
    confirmed:      { bucket: 'reviewing',  label: '審核中',     badge: 'badge-yellow' },
    // 超過上限轉人工審核
    pending_review: { bucket: 'reviewing',  label: '人工審核中', badge: 'badge-yellow' },
    // 已撥款可提領
    rewardable:     { bucket: 'rewardable', label: '可提領',     badge: 'badge-green' },
    // 已申請匯款待財務
    transferring:   { bucket: 'rewardable', label: '匯款處理中', badge: 'badge-blue' },
    // 已申請現場待領
    pending_pickup: { bucket: 'rewardable', label: '待現場領取', badge: 'badge-yellow' },
    // 已完成匯款
    transferred:    { bucket: 'archived',   label: '已匯款',     badge: 'badge-purple' },
    // 已現場領取
    picked_up:      { bucket: 'archived',   label: '已領取',     badge: 'badge-purple' },
    // 舊版「已提領」（兼容 records.js demo）
    withdrawn:      { bucket: 'archived',   label: '已歸檔',     badge: 'badge-gray' },
    // 未符合資格
    invalid:        { bucket: 'archived',   label: '已歸檔',     badge: 'badge-gray' },
    // 提領失敗（銀行退匯）
    transfer_failed: { bucket: 'rewardable', label: '提領失敗',   badge: 'badge-red' },
  };

  // ---------- 跨 iframe 導航（支援 http:// 與 file:// 雙環境） ----------
  // file:// 協定下 cross-frame access 會被 SecurityError 擋下
  // 此函式依序嘗試：1) 直接呼叫 parent.AppRouter 2) postMessage 通知 parent 3) hash 跳轉
  function navigate(key) {
    if (!key) return;
    // 嘗試 1：同源直接呼叫
    try {
      if (window.parent && window.parent !== window && window.parent.AppRouter && window.parent.AppRouter.go) {
        window.parent.AppRouter.go(key);
        return;
      }
    } catch (e) {
      // 跨 origin（含 file://）會丟 SecurityError，下面 fallback
    }
    // 嘗試 2：postMessage 通知 parent
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'mgm:navigate', key: key }, '*');
        return;
      }
    } catch {}
    // 嘗試 3：本頁 fallback（無 iframe 環境，例如獨立打開頁面）
    try {
      location.hash = '#' + key;
    } catch {}
  }

  // 暴露
  // ---------- 個人設定（profile-settings 頁讀寫；withdrawal 帶入用） ----------
  const USER_SETTINGS_KEY = 'mgm_user_settings';

  function getUserSettings() {
    try {
      const profile = resolvePersonProfile();
      const uid = (profile && (profile.uid || profile.lineUserId)) || '';
      if (!uid) return {};
      const all = JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || '{}');
      return all[uid] || {};
    } catch (e) { return {}; }
  }

  function saveUserSettings(uid, patch) {
    if (!uid) return;
    try {
      const all = JSON.parse(localStorage.getItem(USER_SETTINGS_KEY) || '{}');
      all[uid] = Object.assign(all[uid] || {}, patch);
      localStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(all));
    } catch (e) {}
  }

  window.MGMCommon = {
    resolvePersonProfile,
    setPersonProfile,
    mergePersonProfile,
    getPersonRoleHistory,
    syncPersonRoleHistory,
    resolveIdentity,
    resolvePlan,
    resolvePermissionLevel,
    isResignedEmployee,
    isActiveEmployee,
    resolveDisplayName,
    getExEmployeePrecheckState,
    isExEmployeePrecheckReady,
    isPlanPaused,
    getActiveCampaign,
    formatCampaignCountdown,
    monthRange,
    isInThisMonth,
    getRewardableWindow,
    canRewardBeWithdrawn,
    getMonthlyLimits,
    STATUS_MAP,
    toDate,
    getResignDate,
    isExEmployeeLocked,
    navigate,
    // 個人設定
    getUserSettings,
    saveUserSettings,
    USER_SETTINGS_KEY,
    // 員工主檔
    checkEmployeeMasterByMobile,
    // 黑名單
    isUidBlacklisted,
    getCurrentLoginUid,
    isPhoneOtpVerified,
    setPhoneOtpVerified,
    isCurrentUserBlacklisted,
    getBlacklistReleasedIds,
    isRewardReleased,
    releaseBlacklistReward,
    revokeBlacklistReward,
    getWithdrawableApprovalList,
    // 獎金共用資料
    getRewardsDemo,
    getRewardsOverview,
    calculateRewardBySnapshot,
    // 共用上傳工具
    applyWatermarkToPreview,
    bindUpload,
  };

  /* ── 共用上傳工具 ── */

  function applyWatermarkToPreview(file, imgEl) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var tmpImg = new window.Image();
      tmpImg.onload = function () {
        var MAX_DIM = 1600;
        var w = tmpImg.naturalWidth;
        var h = tmpImg.naturalHeight;
        if (w > MAX_DIM || h > MAX_DIM) {
          var ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(tmpImg, 0, 0, w, h);
        ctx.save();
        ctx.globalAlpha = 0.30;
        ctx.fillStyle = '#7f1d1d';
        var fontSize = Math.max(12, Math.round(Math.min(w, h) / 8));
        ctx.font = 'bold ' + fontSize + 'px "Noto Sans TC", "Microsoft JhengHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(w / 2, h / 2);
        ctx.rotate(-Math.PI / 6);
        var text = '僅限理財通使用';
        var textW = ctx.measureText(text).width;
        var colStep = textW * 1.6;
        var rowStep = fontSize * 3.0;
        var rows = Math.ceil(h / rowStep) + 4;
        var cols = Math.ceil(w / colStep) + 4;
        for (var r = -rows; r <= rows; r++) {
          for (var c = -cols; c <= cols; c++) {
            ctx.fillText(text, c * colStep, r * rowStep);
          }
        }
        ctx.restore();
        imgEl.src = canvas.toDataURL('image/jpeg', 0.88);
        imgEl.hidden = false;
      };
      tmpImg.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function bindUpload(container) {
    var root = container || document;
    root.querySelectorAll('.upload-row input[type=file]').forEach(function (input) {
      var row = input.closest('.upload-row');
      var reselectBtn = row ? row.querySelector('.upload-row-reselect') : null;

      if (reselectBtn) {
        reselectBtn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          input.click();
        });
      }

      input.addEventListener('change', function (e) {
        var file = e.target.files[0];
        var previewEl = row ? row.querySelector('.upload-row-preview') : null;
        var rowReselectBtn = row ? row.querySelector('.upload-row-reselect') : null;

        if (!row || !previewEl) return;

        if (!file) {
          row.classList.remove('uploaded');
          previewEl.hidden = true;
          previewEl.removeAttribute('src');
          if (rowReselectBtn) rowReselectBtn.hidden = true;
          return;
        }

        row.classList.add('uploaded');
        if (rowReselectBtn) rowReselectBtn.hidden = false;

        if (file.type && file.type.startsWith('image/')) {
          applyWatermarkToPreview(file, previewEl);
        } else {
          previewEl.hidden = true;
          previewEl.removeAttribute('src');
        }
      });
    });
  }

})();
