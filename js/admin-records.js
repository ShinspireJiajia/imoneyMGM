/* ==========================================================
   admin-records.js - 後台推薦案件管理
   ========================================================== */

(function () {
  'use strict';

  const REFERRER_PROFILE_BY_UID = {
    U250310001: { name: '王小毅', customerId: 'U250310001' },
    U240105002: { name: '李大華', customerId: 'U240105002' },
    U230620004: { name: '陳前輩', customerId: 'U230620004' },
    U240214003: { name: '林副總', customerId: 'U240214003' },
    U240315008: { name: '彭俊豪', customerId: 'U240315008' },
    U230408009: { name: '葉文群', customerId: 'U230408009' },
  };
  function referrerCidOf(uid) {
    if (!uid) return '—';
    return (REFERRER_PROFILE_BY_UID[uid] && REFERRER_PROFILE_BY_UID[uid].customerId) || '—';
  }

  // ============================================================
  //  RECORDS
  //  status 欄位為原始業務狀態；
  //  財務流狀態（S0–S9）由 computeDisplayStatus() 動態計算。
  //
  //  新增欄位說明：
  //    accountingTicked    {boolean}  會計人員已核對打勾
  //    rewardableAt        {string}   案件轉為「可提領」的日期 (YYYY/MM/DD)
  //    withdrawalDataFilled{boolean}  客戶已填完提領資料
  //    withdrawalMethod    {string}   'transfer' | 'cash'
  //    disbursementStatus  {string}   'archived' | 'transfer_failed' | 'cash_failed'
  //    disbursementFailedAt{string}   失敗日期
  // ============================================================
  const RECORDS = [
    // ── S0 案件審核中 ─────────────────────────────────────────
    {
      caseId: 'M2026052301', customerId: '2605220001', negotiationId: 'G26052200001',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '陳志明', refereePhone: '0912345456',
      product: '尚未確認', feeType: '—',
      submitAt: '2026/05/22 14:23', payoutAt: '—',
      status: 'reviewing', snapshot: null, amount: null, payoutAmount: null,
      campaignId: 'CAMP-2026Q2',
    },
    {
      caseId: 'M2026052102', customerId: '2605200002', negotiationId: 'G26052000002',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '林佳華', refereePhone: '0922456789',
      product: '汽車貸款', feeType: '非收費',
      submitAt: '2026/05/20 09:11', payoutAt: '—',
      status: 'confirmed', snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: null, payoutAmount: null,
      campaignId: 'CAMP-2026Q2',
    },
    // ── S1 待會計核對（payoutAt 五月 → 六月 1–25 核款期，未打勾）──
    {
      caseId: 'M2026052014', customerId: '2605200014', negotiationId: 'G26052000014',
      referrerUid: 'U240214003',
      referrerName: '林副總', referrerTag: '員工',
      refereeName: '賴文雄', refereePhone: '0988123456',
      customerProfileCreatedAt: '2026/05/20 09:30',
      product: '信用貸款', feeType: '非收費',
      expectedServiceFee: 8000, actualServiceFee: 8000,
      submitAt: '2026/04/20 09:30', payoutAt: '2026/05/20',
      status: 'rewardable',
      accountingTicked: false,
      snapshot: { base: 500, ratio: 0, cap: 500 }, amount: 500, payoutAmount: 500000,
      campaignId: 'CAMP-2026Q2',
      receiptNote: '客戶要求分批入帳，請確認撥款序號',
    },
    // ── S2 會計已核對（_overrideDisplayStatus 固定展示，避免跨月後自動轉為可提領）
    {
      caseId: 'M2026051205', customerId: '2605130004', negotiationId: 'G26051300004',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '吳雅芳', refereePhone: '0955333222',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 3000, actualServiceFee: 3000,
      submitAt: '2026/05/12 16:30', payoutAt: '2026/05/13',
      status: 'rewardable',
      accountingTicked: true,
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 2500, payoutAmount: 300000,
      campaignId: 'CAMP-2026Q2',
      _overrideDisplayStatus: 'accounting_confirmed',
    },
    // ── S3 可提領（無警示，27 天）────────────────────────────
    {
      caseId: 'M2026040112', customerId: '2604010012', negotiationId: 'G26040100012',
      referrerUid: 'U230408009',
      referrerName: '葉文群', referrerTag: '會員',
      refereeName: '葉文群', refereePhone: '0928457555',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 0, actualServiceFee: 0,
      submitAt: '2026/04/01 02:15', payoutAt: '2026/04/03',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/05/26',
      snapshot: { base: 0, ratio: 0, cap: 0 },
      amount: 0, payoutAmount: 200000,
      campaignSource: '預設值', isDefault: true, defaultReason: 'no-campaign',
      campaignId: null,
    },
    // ── S3 可提領（藍色警示，33 天）─────────────────────────
    {
      caseId: 'M2026042415', customerId: '2604240015', negotiationId: 'G26042400015',
      referrerUid: 'U230408009',
      referrerName: '葉文群', referrerTag: '會員',
      refereeName: '黃佳琪', refereePhone: '0933234567',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 5000, actualServiceFee: 5000,
      submitAt: '2026/03/24 14:00', payoutAt: '2026/04/24',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/05/20',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 3500, payoutAmount: 500000,
      campaignId: 'CAMP-2026Q2',
    },
    // ── S3 可提領（綠色警示，63 天）─────────────────────────
    {
      caseId: 'M2026031516', customerId: '2603150016', negotiationId: 'G26031500016',
      referrerUid: 'U240315008',
      referrerName: '彭俊豪', referrerTag: '會員',
      refereeName: '陳秋月', refereePhone: '0966778899',
      product: '房屋貸款', feeType: '非收費',
      expectedServiceFee: 30000, actualServiceFee: 30000,
      submitAt: '2026/02/15 10:00', payoutAt: '2026/03/15',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/04/20',
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 }, amount: 12000, payoutAmount: 2000000,
      campaignId: 'CAMP-2026Q1',
      receiptNote: '補件後補登，金額已重新確認',
    },
    // ── S3 可提領（紅色警示，94 天）─────────────────────────
    {
      caseId: 'M2026021517', customerId: '2602150017', negotiationId: 'G26021500017',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '劉俊彥', refereePhone: '0911777888',
      product: '信用貸款', feeType: '非收費',
      expectedServiceFee: 12000, actualServiceFee: 12000,
      submitAt: '2026/01/15 15:30', payoutAt: '2026/02/15',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/03/20',
      snapshot: { base: 500, ratio: 0, cap: 500 }, amount: 500, payoutAmount: 800000,
      campaignId: 'CAMP-2026Q1',
    },
    // ── S4 提領申請中（_overrideDisplayStatus 固定展示此狀態，正常邏輯依月份日期動態切換）
    {
      caseId: 'M2026051422', customerId: '2605140022', negotiationId: 'G26051400022',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '周美玲', refereePhone: '0955667788',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 7000, actualServiceFee: 7000,
      submitAt: '2026/04/14 13:45', payoutAt: '2026/05/14',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/06/16',
      withdrawalDataFilled: true,
      withdrawalMethod: 'transfer',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 3000, payoutAmount: 450000,
      campaignId: 'CAMP-2026Q2',
      _overrideDisplayStatus: 'withdrawal_pending',
    },
    // ── S5 撥款處理中（_overrideDisplayStatus 固定展示，正常邏輯僅在月份 16–24 日顯示）
    {
      caseId: 'M2026042318', customerId: '2604230018', negotiationId: 'G26042300018',
      referrerUid: 'U240105002',
      referrerName: '李大華', referrerTag: '員工',
      refereeName: '王志偉', refereePhone: '0922987654',
      customerProfileCreatedAt: '2026/04/23 11:00',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 6000, actualServiceFee: 6000,
      submitAt: '2026/03/23 11:00', payoutAt: '2026/04/23',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/05/26',
      withdrawalDataFilled: true,
      withdrawalMethod: 'transfer',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 4000, payoutAmount: 600000,
      campaignId: 'CAMP-2026Q2',
      _overrideDisplayStatus: 'disbursing',
    },
    // ── S6 已歸檔 ────────────────────────────────────────────
    {
      caseId: 'M2026050806', customerId: '2605090005', negotiationId: 'G26050900005',
      referrerUid: 'U230620004',
      referrerName: '陳前輩', referrerTag: '離職員工',
      refereeName: '李文仁', refereePhone: '0911455333',
      product: '信用貸款', feeType: '收費',
      expectedServiceFee: 18000, actualServiceFee: 18000,
      thirdInstPaid: true, firstInstAmt: 6500,
      submitAt: '2026/05/08 10:18', payoutAt: '2026/05/09',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/04/26',
      withdrawalDataFilled: true,
      withdrawalMethod: 'transfer',
      disbursementStatus: 'archived',
      disbursementCompletedAt: '2026/05/14',
      snapshot: { base: 500, ratio: 0, cap: 500 }, amount: 500, payoutAmount: 100000,
      campaignId: 'CAMP-2026Q2',
    },
    // ── S7 獎金已失效（rewardableAt 2025/11/26，距今 208 天 > 預設 180 天）
    {
      caseId: 'M2025110519', customerId: '2511050019', negotiationId: 'G25110500019',
      referrerUid: 'U230620004',
      referrerName: '陳前輩', referrerTag: '離職員工',
      refereeName: '林義雄', refereePhone: '0988456123',
      product: '信用貸款', feeType: '非收費',
      expectedServiceFee: 15000, actualServiceFee: 15000,
      submitAt: '2025/10/05 09:00', payoutAt: '2025/11/05',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2025/11/26',
      snapshot: { base: 500, ratio: 0, cap: 500 }, amount: 500, payoutAmount: 1200000,
      campaignId: 'CAMP-2025Q4',
    },
    // ── S8 匯款失敗 ──────────────────────────────────────────
    {
      caseId: 'M2026040920', customerId: '2604090020', negotiationId: 'G26040900020',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '謝明宏', refereePhone: '0977123456',
      product: '汽車貸款', feeType: '非收費',
      expectedServiceFee: 5000, actualServiceFee: 5000,
      submitAt: '2026/03/09 16:00', payoutAt: '2026/04/09',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/05/26',
      withdrawalDataFilled: true,
      withdrawalMethod: 'transfer',
      disbursementStatus: 'transfer_failed',
      disbursementFailedAt: '2026/06/18',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 3500, payoutAmount: 500000,
      campaignId: 'CAMP-2026Q2',
    },
    // ── S9 現場提領失敗 ──────────────────────────────────────
    {
      caseId: 'M2026040521', customerId: '2604050021', negotiationId: 'G26040500021',
      referrerUid: 'U240315008',
      referrerName: '彭俊豪', referrerTag: '會員',
      refereeName: '許志明', refereePhone: '0944567891',
      product: '房屋貸款', feeType: '非收費',
      expectedServiceFee: 25000, actualServiceFee: 25000,
      submitAt: '2026/03/05 11:30', payoutAt: '2026/04/05',
      status: 'rewardable',
      accountingTicked: true,
      rewardableAt: '2026/05/26',
      withdrawalDataFilled: true,
      withdrawalMethod: 'cash',
      disbursementStatus: 'cash_failed',
      disbursementFailedAt: '2026/06/19',
      snapshot: { base: 2000, ratio: 0.1, cap: 15000 }, amount: 4500, payoutAmount: 2500000,
      campaignId: 'CAMP-2026Q2',
    },
    // ── 無效案件 ─────────────────────────────────────────────
    {
      caseId: 'M2026050207', customerId: '2505010006', negotiationId: 'G25050100006',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '蔡佳婷', refereePhone: '0966444333',
      product: '—', feeType: '—',
      submitAt: '2026/05/02 22:01', payoutAt: '—',
      status: 'invalid', invalidReason: '訪客已是平台往來客戶（既有舊客不發放新客推薦獎金）',
      snapshot: null, amount: 0,
      campaignId: 'CAMP-2026Q2',
    },
    {
      caseId: 'M2026042808', customerId: '2604280007', negotiationId: 'G26042800007',
      referrerUid: 'U240214003',
      referrerName: '林副總', referrerTag: '員工',
      refereeName: '周志宏', refereePhone: '0977457555',
      product: '—', feeType: '—',
      submitAt: '2026/04/28 13:55', payoutAt: '—',
      status: 'invalid', invalidReason: '已由其他推薦人率先綁定（綁定推薦人：王小毅，綁定時間 2026/04/25 09:08）',
      snapshot: null, amount: 0,
      campaignId: 'CAMP-2026Q2',
    },
    {
      caseId: 'M2026042009', customerId: '2604200008', negotiationId: 'G26042000008',
      referrerUid: 'U250310001',
      referrerName: '王小毅', referrerTag: '會員',
      refereeName: '王小毅（本人）', refereePhone: '0918123888',
      product: '—', feeType: '—',
      submitAt: '2026/04/20 18:42', payoutAt: '—',
      status: 'invalid', invalidReason: '自我推薦：申請人手機與推薦人相符，系統自動註銷以防止套利',
      snapshot: null, amount: 0, fraud: true,
      campaignId: 'CAMP-2026Q2',
    },
    {
      caseId: 'M2026050113', customerId: '2605010013', negotiationId: 'G26050100013',
      referrerUid: 'U240105002',
      referrerName: '李大華', referrerTag: '員工',
      refereeName: '高雅婷', refereePhone: '0934567812',
      customerProfileCreatedAt: '2025/12/03 09:10',
      product: '信用貸款', feeType: '收費',
      submitAt: '2026/05/01 10:20', payoutAt: '—',
      status: 'reviewing', snapshot: null, amount: null, payoutAmount: null,
      campaignId: 'CAMP-2026Q2',
    },
    {
      caseId: 'M2026041511', customerId: '2604150011', negotiationId: 'G26041500011',
      referrerUid: 'U240315008',
      referrerName: '彭俊豪', referrerTag: '會員',
      refereeName: '黃志宇', refereePhone: '0987456221',
      product: '汽車貸款', feeType: '非收費',
      submitAt: '2026/04/15 16:30', payoutAt: '—',
      status: 'invalid', invalidReason: '案件最終未成案（銀行核貸未通過）',
      snapshot: { base: 1000, ratio: 0.5, cap: 5000 }, amount: 0,
      campaignId: 'CAMP-2026Q2',
    },
  ];

  const DEFAULT_REASON_LABEL = {
    'no-campaign':  '當下無進行中活動（空窗期）',
    'plan-paused':  '方案全部停用',
    'system-error': '系統錯誤回退',
  };

  const PLAIN_NAME_MAP = {
    '陳Ｏ明': '陳志明',
    '林Ｏ華': '林冠華',
    '張Ｏ豪': '張家豪',
    '吳Ｏ芳': '吳雅芳',
    '李Ｏ仁': '李政仁',
    '蔡Ｏ婷': '蔡怡婷',
    '周Ｏ宏': '周彥宏',
    '游Ｏ淇': '游佳淇',
    '黃Ｏ宇': '黃聖宇',
    '葉Ｏ群': '葉建群',
    '彭Ｏ豪': '彭家豪',
  };

  const STATUS_TEXT = {
    reviewing:            '案件審核中',
    waiting_accounting:   '待會計核對',
    accounting_confirmed: '會計已核對',
    rewardable:           '可提領',
    withdrawal_pending:   '提領申請中',
    disbursing:           '撥款處理中',
    archived:             '已歸檔',
    expired:              '獎金已失效',
    transfer_failed:      '匯款失敗',
    cash_failed:          '現場提領失敗',
    invalid:              '未符合資格',
  };

  const STATUS_FILTER_OPTIONS = [
    { value: 'all',                  label: '全部' },
    { value: 'reviewing',            label: STATUS_TEXT.reviewing },
    { value: 'waiting_accounting',   label: STATUS_TEXT.waiting_accounting },
    { value: 'accounting_confirmed', label: STATUS_TEXT.accounting_confirmed },
    { value: 'rewardable',           label: STATUS_TEXT.rewardable },
    { value: 'withdrawal_pending',   label: STATUS_TEXT.withdrawal_pending },
    { value: 'disbursing',           label: STATUS_TEXT.disbursing },
    { value: 'archived',             label: STATUS_TEXT.archived },
    { value: 'expired',              label: STATUS_TEXT.expired },
    { value: 'transfer_failed',      label: STATUS_TEXT.transfer_failed },
    { value: 'cash_failed',          label: STATUS_TEXT.cash_failed },
    { value: 'invalid',              label: STATUS_TEXT.invalid },
  ];

  const filterState = {
    referrerQuery: '',
    refereeQuery: '',
    caseId: '',
    status: 'all',
    tag: '',
    dateFrom: '',
    dateTo: '',
  };

  let DEFAULT_CALC_HTML = '';

  // ============================================================
  //  財務流狀態計算
  // ============================================================

  function getUnclaimedDays() {
    try { return parseInt(localStorage.getItem('mgm_risk_unclaimed_days') || '180', 10) || 180; }
    catch { return 180; }
  }

  function computeDisplayStatus(r) {
    // 強制狀態覆寫（僅限展示用 mock 資料）
    if (r._overrideDisplayStatus) return r._overrideDisplayStatus;

    // 無效案件：直接回傳
    if (r.status === 'invalid') return 'invalid';

    // 後台人員手動標記的終態
    if (r.disbursementStatus === 'archived')        return 'archived';
    if (r.disbursementStatus === 'transfer_failed') return 'transfer_failed';
    if (r.disbursementStatus === 'cash_failed')     return 'cash_failed';

    // 服務費尚未取得 → S0 案件審核中
    if (!r.payoutAt || r.payoutAt === '—') return 'reviewing';

    const today = new Date();
    const day   = today.getDate();

    // 已有 rewardableAt → 核款期已過，進入 S3+
    if (r.rewardableAt) {
      const rewardableDate = new Date(r.rewardableAt.replace(/\//g, '-'));
      const daysSince = Math.floor((today - rewardableDate) / (1000 * 60 * 60 * 24));
      if (daysSince > getUnclaimedDays()) return 'expired';

      if (r.withdrawalDataFilled) {
        // 次月 16–24 日：撥款處理中
        return (day >= 16 && day <= 24) ? 'disbursing' : 'withdrawal_pending';
      }
      return 'rewardable';
    }

    // 無 rewardableAt → 還在核款週期
    // 核款月 = payoutAt 月份的下一個月
    const payoutDate = new Date(r.payoutAt.replace(/\//g, '-'));
    let acctYear  = payoutDate.getFullYear();
    let acctMonth = payoutDate.getMonth() + 1; // 0-indexed，+1 = 下個月
    if (acctMonth > 11) { acctMonth = 0; acctYear++; }

    const inAcctPeriod =
      today.getFullYear() === acctYear &&
      today.getMonth()    === acctMonth &&
      day <= 25;

    if (inAcctPeriod) {
      return r.accountingTicked ? 'accounting_confirmed' : 'waiting_accounting';
    }

    // 超過核款期（25 日後）
    return r.accountingTicked ? 'rewardable' : 'waiting_accounting';
  }

  // ── 提領剩餘天數（有 rewardableAt 的案件均計算）───────────
  function getRemainingDays(r) {
    if (!r.rewardableAt) return null;
    const today         = new Date();
    const rewardableDate = new Date(r.rewardableAt.replace(/\//g, '-'));
    const unclaimedDays  = getUnclaimedDays();
    const expiryDate    = new Date(rewardableDate.getTime() + unclaimedDays * 86400000);
    return Math.ceil((expiryDate - today) / 86400000);
  }

  function renderRemainingDays(r, displayStatus) {
    const HIDE = ['reviewing', 'invalid', 'archived'];
    if (HIDE.includes(displayStatus)) return '<span class="rem-days rem-na">—</span>';

    const remaining = getRemainingDays(r);
    if (remaining === null) return '<span class="rem-days rem-na">—</span>';
    if (displayStatus === 'expired' || remaining <= 0)
      return '<span class="rem-days rem-expired">已失效</span>';

    let cls = 'rem-ok';
    if (remaining <= 10)      cls = 'rem-urgent';
    else if (remaining <= 30) cls = 'rem-warn';

    return `<span class="rem-days ${cls}">剩 ${remaining} 天</span>`;
  }

  // ── 提領天數警示（僅適用 S3 可提領）────────────────────────
  function getRewardableWarning(r) {
    if (!r.rewardableAt) return null;
    const today         = new Date();
    const rewardableDate = new Date(r.rewardableAt.replace(/\//g, '-'));
    const days = Math.floor((today - rewardableDate) / (1000 * 60 * 60 * 24));
    if (days > 90) return { level: 'red',   text: '已逾 90 天未提領' };
    if (days > 60) return { level: 'green', text: '已逾 60 天未提領' };
    if (days > 30) return { level: 'blue',  text: '已逾 30 天未提領' };
    return null;
  }

  // ============================================================
  //  工具函式
  // ============================================================

  function fmt(n) { return n == null ? '—' : '$' + n.toLocaleString(); }

  function fmtDateYmd(dateStr) {
    if (!dateStr || dateStr === '—') return '—';
    return (String(dateStr).split(' ')[0] || '') || '—';
  }

  function plainNameOf(name) {
    const raw = String(name || '').trim();
    if (!raw) return '—';
    const withoutSelf = raw.replace(/[（(]本人[)）]/g, '');
    return PLAIN_NAME_MAP[raw] || PLAIN_NAME_MAP[withoutSelf] || withoutSelf.replace(/Ｏ/g, '');
  }

  function receiptNoOf(r) {
    if (r.payoutAmount == null) return '—';
    if (r.receiptNo) return r.receiptNo;
    const datePart = String(r.payoutAt || '').split(' ')[0].replace(/\//g, '');
    if (!/^\d{8}$/.test(datePart)) return '—';
    const yymmdd = datePart.slice(2);
    const seq4 = String(r.customerId || '').replace(/\D/g, '').slice(-4).padStart(4, '0');
    return `I${yymmdd}${seq4}`;
  }

  function parseDateTimeLike(value) {
    if (!value) return null;
    const normalized = String(value).trim().replace(/\//g, '-');
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function isEmployeeNewCustomerEligible(record) {
    if (record.referrerTag !== '員工') return true;
    const submitAt  = parseDateTimeLike(record.submitAt);
    const createdAt = parseDateTimeLike(record.customerProfileCreatedAt);
    if (!submitAt || !createdAt) return false;
    return createdAt.getTime() >= submitAt.getTime();
  }

  function applyEmployeeNewCustomerRule() {
    RECORDS.forEach((r) => {
      if (r.referrerTag !== '員工') return;
      if (isEmployeeNewCustomerEligible(r)) return;
      r.status = 'invalid';
      r.snapshot = null;
      r.amount = 0;
      r.invalidReason = `員工推薦僅限新客戶：系統建檔時間 ${r.customerProfileCreatedAt || '（缺資料）'} 早於送單時間 ${r.submitAt || '（缺資料）'}，判定為既有資料，不符合員工推薦獎金資格。`;
    });
  }

  function parseSubmitDate(dateStr) {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(' ')[0] || '';
    const t = new Date(datePart.replace(/\//g, '-'));
    return Number.isNaN(t.getTime()) ? null : t;
  }

  function withinDateRange(dateStr, fromStr, toStr) {
    if (!fromStr && !toStr) return true;
    const submitDate = parseSubmitDate(dateStr);
    if (!submitDate) return false;
    if (fromStr) {
      const fromDate = new Date(fromStr);
      if (Number.isNaN(fromDate.getTime())) return false;
      if (submitDate < fromDate) return false;
    }
    if (toStr) {
      const toDate = new Date(toStr);
      if (Number.isNaN(toDate.getTime())) return false;
      if (submitDate > toDate) return false;
    }
    return true;
  }

  function getFiltered() {
    return RECORDS.filter((r) => {
      const displayStatus = computeDisplayStatus(r);
      if (filterState.status !== 'all' && displayStatus !== filterState.status) return false;
      if (filterState.tag && r.referrerTag !== filterState.tag) return false;
      if (!withinDateRange(r.submitAt, filterState.dateFrom, filterState.dateTo)) return false;

      if (filterState.referrerQuery) {
        const k = filterState.referrerQuery.toLowerCase();
        const refHay = `${referrerCidOf(r.referrerUid)} ${plainNameOf(r.referrerName)}`.toLowerCase();
        if (!refHay.includes(k)) return false;
      }

      if (filterState.refereeQuery) {
        const k = filterState.refereeQuery.toLowerCase();
        const refereeHay = `${r.refereePhone || ''} ${plainNameOf(r.refereeName)}`.toLowerCase();
        if (!refereeHay.includes(k)) return false;
      }

      if (filterState.caseId) {
        const k = filterState.caseId.toLowerCase();
        if (!r.caseId.toLowerCase().includes(k)) return false;
      }

      return true;
    });
  }

  function receiptTypeOf(r) {
    if (r.feeType === '收費') return '協商單';
    if (r.feeType === '非收費') return '審核單';
    return null;
  }

  function receiptTypeBadge(r) {
    const type = receiptTypeOf(r);
    if (!type) return '<span class="rtype-badge rtype-unknown">—</span>';
    const cls = type === '協商單' ? 'rtype-neg' : 'rtype-review';
    return `<span class="rtype-badge ${cls}">${type}</span>`;
  }

  function feeBadge(feeType) {
    if (!feeType || feeType === '—') {
      return `<span class="fee-badge fee-unknown">—</span>`;
    }
    if (feeType === '非收費') {
      return `<span class="fee-badge fee-free"><i class="fa-solid fa-circle-check" style="font-size:10px;"></i>非收費</span>`;
    }
    return `<span class="fee-badge fee-charged"><i class="fa-solid fa-circle-dollar-to-slot" style="font-size:10px;"></i>收費</span>`;
  }

  function renderRow(r) {
    const displayStatus = computeDisplayStatus(r);
    const amountTxt     = r.amount == null ? '計算中' : fmt(r.amount);
    const statusLabel   = STATUS_TEXT[displayStatus] || displayStatus;
    const statusCls     = 'status-text status-' + displayStatus;

    const defaultBadge = r.isDefault
      ? `<span class="default-badge" title="送單當下因「${DEFAULT_REASON_LABEL[r.defaultReason] || '空窗期'}」套用活動空窗期獎金設定"><i class="fa-solid fa-triangle-exclamation"></i>空窗期設定</span>`
      : '';

    // 提領天數警示（僅 S3）
    const warning = displayStatus === 'rewardable' ? getRewardableWarning(r) : null;
    const caseIdColorStyle = warning ? `style="color:var(--caseid-warn-${warning.level})"` : '';
    const warnBadge = warning
      ? `<span class="caseid-warn-badge caseid-warn-${warning.level}">${warning.text}</span>`
      : '';

    const referrerName = plainNameOf(r.referrerName);
    const refereeName  = plainNameOf(r.refereeName);
    const submitDate   = fmtDateYmd(r.submitAt);

    return `
      <tr data-id="${r.caseId}">
        <td class="mono">
          <span ${caseIdColorStyle}>${r.caseId}</span>
          ${defaultBadge}
          ${warnBadge}
        </td>
        <td>${receiptTypeBadge(r)}</td>
        <td>${r.referrerTag}</td>
        <td class="mono">${referrerCidOf(r.referrerUid)}</td>
        <td class="cell-name">${referrerName}</td>
        <td class="cell-name">${refereeName}</td>
        <td class="mono">${r.refereePhone || '—'}</td>
        <td><span class="${statusCls}">${statusLabel}</span></td>
        <td>${renderRemainingDays(r, displayStatus)}</td>
        <td class="num money">${amountTxt}</td>
        <td>
          <button type="button" class="action-btn" data-act="view" data-id="${r.caseId}">
            <i class="fa-solid fa-eye"></i>查看
          </button>
        </td>
      </tr>`;
  }

  function render() {
    const tbody = document.getElementById('records-tbody');
    const items = getFiltered();
    tbody.innerHTML = items.length
      ? items.map(renderRow).join('')
      : '<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--color-text-muted);">沒有符合條件的案件</td></tr>';
    const tc = document.getElementById('total-count');
    if (tc) tc.textContent = items.length;
    const pgc = document.getElementById('rec-pg-total');
    if (pgc) pgc.textContent = items.length;
    bindRowActions();
  }

  function getMatchedProjects(r) {
    const snap = r.snapshot || {};
    if (Array.isArray(snap.items) && snap.items.length) {
      return snap.items.map((x) => x.projectLabel || x.projectKey || '未命名專案').filter(Boolean);
    }
    if (r.product && r.product !== '—' && r.product !== '尚未確認') {
      return String(r.product).split('+').map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }

  function bindRowActions() {
    document.querySelectorAll('[data-act="view"]').forEach((btn) => {
      btn.addEventListener('click', () => openView(btn.dataset.id));
    });
  }

  // ============================================================
  //  查看 Modal
  // ============================================================
  let currentModalCaseId = null;

  function openView(caseId) {
    currentModalCaseId = caseId;
    const r = RECORDS.find((x) => x.caseId === caseId);
    if (!r) return;
    const modal = document.getElementById('rec-view-modal');
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setLink = (id, text, href) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text;
      if (href && text !== '—') {
        el.href = href;
        el.style.pointerEvents = '';
        el.style.opacity = '';
      } else {
        el.href = '#';
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.5';
      }
    };

    const CRM_BASE     = 'https://crm.shinda.com.tw';
    const RECEIPT_BASE = 'https://erp.shinda.com.tw';

    set('rv-caseid', r.caseId);
    set('rv-caseid2', r.caseId);
    set('rv-referrer', plainNameOf(r.referrerName));
    set('rv-referrer-cid', referrerCidOf(r.referrerUid));
    set('rv-tag', r.referrerTag);
    setLink('rv-neg', r.negotiationId || '—', r.negotiationId ? `${CRM_BASE}/negotiation/${r.negotiationId}` : null);
    set('rv-referee', plainNameOf(r.refereeName));
    set('rv-referee-cid', r.refereePhone || '—');
    setLink('rv-customer-id', r.customerId || '—', r.customerId ? `${CRM_BASE}/customer/${r.customerId}` : null);

    const matchedProjects = getMatchedProjects(r);
    set('rv-projects', matchedProjects.length ? matchedProjects.join(' + ') : '—');
    set('rv-campaign', r.campaignId || '—');
    set('rv-submit', fmtDateYmd(r.submitAt));
    set('rv-payout', r.payoutAt || '—');
    const rno = receiptNoOf(r);
    setLink('rv-receipt-no', rno, rno !== '—' ? `${RECEIPT_BASE}/receipt/${rno}` : null);
    const noteIconEl = document.getElementById('rv-receipt-note-icon');
    if (noteIconEl) {
      if (r.receiptNote) {
        noteIconEl.innerHTML = '<i class="fa-solid fa-note-sticky"></i>';
        noteIconEl.title = '備註：' + r.receiptNote;
        noteIconEl.hidden = false;
      } else {
        noteIconEl.hidden = true;
        noteIconEl.title = '';
      }
    }
    set('rv-expected-fee', r.expectedServiceFee == null ? '—' : fmt(r.expectedServiceFee));
    set('rv-actual-fee',   r.actualServiceFee   == null ? '—' : fmt(r.actualServiceFee));

    // 顯示計算後的財務狀態
    const displayStatus = computeDisplayStatus(r);
    const stEl = document.getElementById('rv-status');
    if (stEl) {
      stEl.className = 'rv-value status-text status-' + displayStatus;
      stEl.textContent = STATUS_TEXT[displayStatus] || displayStatus;
    }
    set('rv-amount', r.amount == null ? '計算中' : fmt(r.amount));

    // 可提領日
    const rowRewardable = document.getElementById('rv-row-rewardable-date');
    const valRewardable = document.getElementById('rv-rewardable-date');
    if (rowRewardable && valRewardable) {
      if (r.rewardableAt) {
        valRewardable.textContent = r.rewardableAt;
        rowRewardable.hidden = false;
      } else {
        rowRewardable.hidden = true;
      }
    }

    // 提領資料狀態
    const rowWd  = document.getElementById('rv-row-withdrawal-data');
    const valWd  = document.getElementById('rv-withdrawal-data');
    if (rowWd && valWd) {
      const show = r.rewardableAt && r.disbursementStatus !== 'archived';
      if (show) {
        valWd.textContent = r.withdrawalDataFilled
          ? `已填寫（${r.withdrawalMethod === 'cash' ? '現場提領' : '銀行匯款'}）`
          : '尚未填寫';
        valWd.className = 'rv-value ' + (r.withdrawalDataFilled ? 'tone-ok' : 'tone-waiting');
        rowWd.hidden = false;
      } else {
        rowWd.hidden = true;
      }
    }

    // 狀態說明 section（invalid / pending_review / S7 / S8 / S9）
    const reasonSec = document.getElementById('rv-section-reason');
    const reasonEl  = document.getElementById('rv-reason-text');
    if (reasonSec && reasonEl) {
      let reasonText = '';
      let reasonTone = 'tone-neutral';
      let showReason = false;

      if ((r.status === 'invalid' || r.status === 'pending_review') && r.invalidReason) {
        reasonText = r.invalidReason;
        reasonTone = r.status === 'invalid' ? 'tone-danger' : 'tone-warning';
        showReason = true;
      } else if (displayStatus === 'expired') {
        const days = r.rewardableAt
          ? Math.floor((new Date() - new Date(r.rewardableAt.replace(/\//g, '-'))) / 86400000)
          : '—';
        reasonText = `可提領日（${r.rewardableAt || '—'}）起已逾 ${days} 天，超過系統設定的未提領失效期限（${getUnclaimedDays()} 天），該筆獎金已視為失效。`;
        reasonTone = 'tone-danger';
        showReason = true;
      } else if (displayStatus === 'transfer_failed') {
        reasonText = `匯款失敗（${r.disbursementFailedAt || '—'}）：系統已通知客戶補件或聯繫專員，請至「提領功能管理」確認後續處理。`;
        reasonTone = 'tone-warning';
        showReason = true;
      } else if (displayStatus === 'cash_failed') {
        reasonText = `現場提領失敗（${r.disbursementFailedAt || '—'}）：系統已通知客戶補件或聯繫專員，請至「提領功能管理（現場提領）」確認後續處理。`;
        reasonTone = 'tone-warning';
        showReason = true;
      } else if (displayStatus === 'rewardable') {
        const warn = getRewardableWarning(r);
        if (warn) {
          const days = Math.floor((new Date() - new Date(r.rewardableAt.replace(/\//g, '-'))) / 86400000);
          reasonText = `${warn.text}：自 ${r.rewardableAt} 起已 ${days} 天尚未提領。請提醒客戶填寫提領資料，或確認失效期限。`;
          reasonTone = warn.level === 'red' ? 'tone-danger' : (warn.level === 'green' ? 'tone-success' : 'tone-info');
          showReason = true;
        }
      }

      reasonSec.hidden = !showReason;
      if (showReason) {
        reasonEl.textContent = reasonText;
        reasonEl.className = 'rv-reason ' + reasonTone;
      }
    }

    renderConditionFlags(r);
    renderCalcSection(r);

    const snapSec = document.getElementById('rv-section-snapshot');
    const snapEl  = document.getElementById('rv-snapshot');
    if (r.snapshot && (Array.isArray(r.snapshot.items) || r.snapshot.base != null || r.snapshot.ratio != null || r.snapshot.cap != null)) {
      snapSec.hidden = false;
      const sourceLine = r.isDefault
        ? `\n⚠ 快照來源：活動空窗期獎金設定（原因：${DEFAULT_REASON_LABEL[r.defaultReason] || '空窗期'}）`
        : `\n快照來源：${r.campaignSource || '當期活動'}`;
      if (Array.isArray(r.snapshot.items) && r.snapshot.items.length) {
        const lines = r.snapshot.items.map((x) => {
          const label = x.projectLabel || x.projectKey || '未命名專案';
          const base  = Number(x.base  || 0).toLocaleString();
          const ratio = Number(x.ratio || 0).toFixed(2);
          const cap   = Number(x.cap   || 0).toLocaleString();
          return `- ${label}：底包 $${base} ／ 比例 ${ratio}% ／ 單筆上限 $${cap}`;
        });
        const totalCap = r.snapshot.totalCap != null
          ? `\n組合總上限：$${Number(r.snapshot.totalCap).toLocaleString()}`
          : '';
        snapEl.textContent = `疊加制快照：\n${lines.join('\n')}${totalCap}${sourceLine}`;
      } else {
        snapEl.textContent = `固定底包 $${(r.snapshot.base || 0).toLocaleString()} ／ 抽成比例 ${r.snapshot.ratio || 0}% ／ 單筆上限 $${(r.snapshot.cap || 0).toLocaleString()}${sourceLine}`;
      }
      snapEl.style.whiteSpace = 'pre-line';
    } else {
      snapSec.hidden = true;
    }

    const memoContainer = document.getElementById('memo-container-record');
    if (memoContainer && typeof MemoManager !== 'undefined') {
      MemoManager.renderWidget(memoContainer, 'case', r.caseId, 'Admin User');
    }

    modal.hidden = false;
  }

  function renderCalcSection(r) {
    const sec     = document.getElementById('rv-section-calc');
    if (!sec) return;
    const calcWrap = document.getElementById('rv-calc');
    if (calcWrap && DEFAULT_CALC_HTML && !document.getElementById('rc-base')) {
      calcWrap.innerHTML = DEFAULT_CALC_HTML;
    }
    const snap = r.snapshot;
    if (!snap || (snap.base == null && snap.ratio == null && snap.cap == null && (!Array.isArray(snap.items) || !snap.items.length))) {
      sec.hidden = true;
      return;
    }
    if (Array.isArray(snap.items) && snap.items.length) {
      renderAdditiveCalcSection(r);
      return;
    }
    sec.hidden = false;
    const base  = Number(snap.base)  || 0;
    const ratio = Number(snap.ratio) || 0;
    const cap   = Number(snap.cap)   || 0;
    const loan  = r.payoutAmount;
    const setHTML = (id, html) => { const el = document.getElementById(id); if (el) el.innerHTML = html; };
    setHTML('rc-base',  fmt(base));
    setHTML('rc-ratio', ratio.toFixed(2) + ' %');
    setHTML('rc-cap',   fmt(cap));
    if (loan == null) {
      setHTML('rc-loan',     '<span style="color:var(--color-text-muted);">尚未撥款</span>');
      setHTML('rc-subtotal', '<span style="color:var(--color-text-muted);">待撥款後計算</span>');
      setHTML('rc-final',    '<span style="color:var(--color-text-muted);">待撥款後產生</span>');
      const note = document.getElementById('rv-calc-note');
      if (note) {
        note.innerHTML =
          '公式：MIN ( 固定底包 ＋ 實際撥款金額 × 抽成比例 ，單筆上限 )<br>' +
          '<strong style="color:var(--color-warning-dark);">本案件尚未撥款，待撥款金額確定後系統將自動套用以上快照參數計算最終獎金。</strong>';
      }
      return;
    }
    const subtotal = base + loan * (ratio / 100);
    const final    = Math.min(subtotal, cap);
    const hitCap   = final < subtotal;
    setHTML('rc-loan', fmt(loan));
    setHTML('rc-subtotal', fmt(Math.round(subtotal)));
    setHTML('rc-final',
      `<strong>${fmt(Math.round(final))}</strong>` +
      (hitCap
        ? '<span class="rc-tag rc-tag-cap" title="小計超過單筆上限，已取上限">已觸頂</span>'
        : '<span class="rc-tag rc-tag-ok">未觸頂</span>'),
    );
    const note = document.getElementById('rv-calc-note');
    if (note) {
      note.innerHTML =
        `公式：MIN ( ${fmt(base)} ＋ ${fmt(loan)} × ${ratio.toFixed(2)}% ，${fmt(cap)} ) = <strong>${fmt(Math.round(final))}</strong>` +
        (hitCap ? '<br><span style="color:var(--color-warning-dark);">⚠ 小計 ' + fmt(Math.round(subtotal)) + ' 超過上限 ' + fmt(cap) + '，最終獎金以上限為準。</span>' : '');
    }
  }

  function renderAdditiveCalcSection(r) {
    const sec  = document.getElementById('rv-section-calc');
    const wrap = document.getElementById('rv-calc');
    if (!sec || !wrap) return;
    sec.hidden = false;
    const snap    = r.snapshot || {};
    const loan    = Number(r.payoutAmount || 0);
    const hasLoan = r.payoutAmount != null;
    const rows    = [];
    let rewardSum = 0;
    (snap.items || []).forEach((item) => {
      const base     = Number(item.base  || 0);
      const ratio    = Number(item.ratio || 0);
      const cap      = Number(item.cap   || 0);
      const subtotal = base + loan * (ratio / 100);
      const reward   = hasLoan ? Math.min(subtotal, cap) : null;
      if (reward != null) rewardSum += reward;
      rows.push(`
        <tr>
          <td class="rc-label">${item.projectLabel || item.projectKey || '未命名專案'}</td>
          <td class="rc-op">MIN</td>
          <td class="rc-value mono">${fmt(base)} + ${hasLoan ? fmt(loan) : '待撥款'} × ${ratio.toFixed(2)}% , ${fmt(cap)} = ${reward == null ? '待計算' : fmt(Math.round(reward))}</td>
        </tr>
      `);
    });
    const totalCap   = snap.totalCap != null ? Number(snap.totalCap) : null;
    const final      = hasLoan ? (totalCap == null ? rewardSum : Math.min(rewardSum, totalCap)) : null;
    const hitTotalCap = hasLoan && totalCap != null && final < rewardSum;
    wrap.innerHTML = `
      <table class="rv-calc-table">
        <tbody>
          ${rows.join('')}
          <tr class="rc-sep"><td colspan="3"></td></tr>
          <tr><td class="rc-label">疊加小計</td><td class="rc-op">=</td><td class="rc-value mono">${hasLoan ? fmt(Math.round(rewardSum)) : '待撥款後計算'}</td></tr>
          <tr><td class="rc-label">組合總上限</td><td class="rc-op">MIN</td><td class="rc-value mono">${totalCap == null ? '未設定' : fmt(totalCap)}</td></tr>
          <tr class="rc-final"><td class="rc-label">最終獎金</td><td class="rc-op">=</td><td class="rc-value mono">${final == null ? '待撥款後產生' : `<strong>${fmt(Math.round(final))}</strong>${hitTotalCap ? '<span class="rc-tag rc-tag-cap">已觸頂</span>' : '<span class="rc-tag rc-tag-ok">未觸頂</span>'}`}</td></tr>
        </tbody>
      </table>
      <p class="rv-calc-note" id="rv-calc-note">
        公式：各專案獎金先個別計算後加總，再套用組合總上限。
      </p>
    `;
  }

  function renderConditionFlags(r) {
    const sec    = document.getElementById('rv-section-conditions');
    const listEl = document.getElementById('rv-condition-flags');
    if (!sec || !listEl) return;
    const receiptType = receiptTypeOf(r);
    const flags = [];
    const hasSvcFee = r.expectedServiceFee != null && r.actualServiceFee != null;
    if (hasSvcFee) {
      const met = r.actualServiceFee >= r.expectedServiceFee;
      flags.push({
        label:  '被推薦人的案件服務費已付清',
        detail: `實收 ${fmt(r.actualServiceFee)} ／ 應收 ${fmt(r.expectedServiceFee)}`,
        met,
      });
    }
    if (receiptType === '協商單') {
      if (r.thirdInstPaid != null) {
        flags.push({ label: '協商案件的第三期服務費已繳滿', met: r.thirdInstPaid });
      }
      if (r.firstInstAmt != null) {
        const met = r.firstInstAmt >= 6000;
        flags.push({ label: '協商案件的第一期款服務費大於或等於 $6,000', detail: `第一期款：${fmt(r.firstInstAmt)}`, met });
      }
    }
    if (flags.length === 0) { sec.hidden = true; return; }
    sec.hidden = false;
    listEl.innerHTML = flags.map((f) => `
      <div class="rv-condition-flag">
        <div class="rcf-label">
          <span>${f.label}</span>
          ${f.detail ? `<span class="rcf-detail">${f.detail}</span>` : ''}
        </div>
        <span class="rcf-badge ${f.met ? 'rcf-met' : 'rcf-unmet'}">${f.met ? '符合' : '不符合'}</span>
      </div>
    `).join('');
  }

  function closeView() {
    const modal = document.getElementById('rec-view-modal');
    if (modal) modal.hidden = true;
    currentModalCaseId = null;
  }

  function bindViewModal() {
    const modal = document.getElementById('rec-view-modal');
    if (!modal) return;
    modal.querySelectorAll('[data-close]').forEach((el) =>
      el.addEventListener('click', closeView)
    );
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.hidden) closeView();
    });
  }

  // ============================================================
  //  篩選
  // ============================================================
  function bindFilters() {
    ensureStatusFilterOptions();

    const syncFiltersFromUI = () => {
      filterState.referrerQuery = document.getElementById('f-referrer-query').value.trim();
      filterState.refereeQuery  = document.getElementById('f-referee-query').value.trim();
      filterState.caseId        = document.getElementById('f-case-id').value.trim();
      filterState.status        = document.getElementById('f-status').value;
      filterState.tag           = document.getElementById('f-tag').value;
      filterState.dateFrom      = document.getElementById('f-date-from').value;
      filterState.dateTo        = document.getElementById('f-date-to').value;
    };

    document.getElementById('btn-search').addEventListener('click', () => {
      syncFiltersFromUI();
      render();
    });

    ['f-status', 'f-tag', 'f-date-from', 'f-date-to'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => {
        syncFiltersFromUI();
        render();
      });
    });

    ['f-referrer-query', 'f-referee-query', 'f-case-id', 'f-date-from', 'f-date-to'].forEach((id) => {
      document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        syncFiltersFromUI();
        render();
      });
    });
  }

  function ensureStatusFilterOptions() {
    const statusSelect = document.getElementById('f-status');
    if (!statusSelect) return;
    const selectedValue = statusSelect.value || 'all';
    statusSelect.innerHTML = STATUS_FILTER_OPTIONS
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    statusSelect.value = STATUS_FILTER_OPTIONS.some((opt) => opt.value === selectedValue)
      ? selectedValue
      : 'all';
  }

  function applyJumpCaseIdFilter() {
    let caseId = '';
    try {
      caseId = sessionStorage.getItem('jump_case_id') || '';
      if (caseId) sessionStorage.removeItem('jump_case_id');
    } catch {}
    if (!caseId) return;
    const input = document.getElementById('f-case-id');
    if (input) input.value = caseId;
    filterState.caseId = caseId;
  }

  function toInputDateValue(d) {
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function applyDefaultDateRangeFilter() {
    const fromInput = document.getElementById('f-date-from');
    const toInput   = document.getElementById('f-date-to');
    if (!fromInput || !toInput) return;
    const today = new Date();
    const from  = new Date(today);
    from.setMonth(from.getMonth() - 2);
    if (!fromInput.value) fromInput.value = toInputDateValue(from);
    if (!toInput.value)   toInput.value   = toInputDateValue(today);
    filterState.dateFrom = fromInput.value;
    filterState.dateTo   = toInput.value;
  }

  // ============================================================
  //  Toast
  // ============================================================
  function toast(msg) {
    let t = document.getElementById('admin-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'admin-toast';
      t.style.cssText =
        'position:fixed;left:50%;bottom:32px;transform:translateX(-50%);' +
        'background:#1f2937;color:#fff;padding:12px 20px;border-radius:8px;' +
        'font-size:14px;z-index:9999;opacity:0;transition:opacity .2s;max-width:90%;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._tid);
    t._tid = setTimeout(() => (t.style.opacity = '0'), 3000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const calcWrap = document.getElementById('rv-calc');
    if (calcWrap) DEFAULT_CALC_HTML = calcWrap.innerHTML;
    bindFilters();
    (function () {
      const btnToggle  = document.getElementById('btn-toggle-advanced');
      const filterGrid = document.getElementById('filter-grid');
      if (btnToggle && filterGrid) {
        btnToggle.addEventListener('click', () => {
          const collapsed = filterGrid.classList.toggle('collapsed');
          btnToggle.innerHTML = collapsed
            ? '<i class="fa-solid fa-chevron-down"></i>展開篩選'
            : '<i class="fa-solid fa-chevron-up"></i>收合篩選';
        });
      }
      const btnClear = document.getElementById('btn-clear-filter');
      if (btnClear && filterGrid) {
        btnClear.addEventListener('click', () => {
          filterGrid.querySelectorAll('input').forEach((el) => (el.value = ''));
          filterGrid.querySelectorAll('select').forEach((el) => (el.selectedIndex = 0));
          const s = document.getElementById('btn-search');
          if (s) s.click();
        });
      }
    })();
    bindViewModal();
    bindExport();
    applyEmployeeNewCustomerRule();
    applyJumpCaseIdFilter();
    render();
  });

  // ============================================================
  //  CSV 匯出
  // ============================================================
  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function bindExport() {
    const btn = document.getElementById('btn-export-csv');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const items = getFiltered();
      if (items.length === 0) { alert('目前無資料可匯出'); return; }
      const header = ['案號','類型','推薦人','會員編號','身份','諮詢單號','被推薦人','被推薦人手機號碼','申請日期','撥款日','狀態','對應獎金','備註說明'];
      const rows = items.map((r) => {
        const displayStatus = computeDisplayStatus(r);
        return [
          r.caseId, r.product || '',
          plainNameOf(r.referrerName), referrerCidOf(r.referrerUid), r.referrerTag,
          r.negotiationId, plainNameOf(r.refereeName), r.refereePhone || '',
          fmtDateYmd(r.submitAt), r.payoutAt || '',
          STATUS_TEXT[displayStatus] || displayStatus,
          r.amount == null ? '計算中' : r.amount,
          r.invalidReason || '',
        ];
      });
      const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `referral_records_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    });
  }

})();
