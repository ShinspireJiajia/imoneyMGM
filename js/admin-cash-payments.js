/* ==========================================================
   admin-cash-payments.js - 提領功能管理（現場提領）
   功能：每日刊版、現場提領清單、批次標記、異動歷程
   ========================================================== */

(function () {
  'use strict';

  // 款項 demo（僅包含現場提領相關資料，與 admin-payments.js 同源）
  const PAYMENTS = [
    {
      id: 'PAY-26052203',
      caseId: 'M2026050610',
      memberId: 'U250310001',
      referrer: '王小毅',
      tag: '會員',
      product: '汽車貸款',
      amount: 3000,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/05',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/05/22 16:00',
      status: 'pickup',
    },
    {
      id: 'PAY-26052006',
      caseId: 'M2026050415',
      memberId: 'U240310010',
      referrer: '黃俊偉',
      tag: '會員',
      product: '汽車貸款',
      amount: 1800,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/05',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/05/20 11:20',
      status: 'pickup',
    },
    {
      id: 'PAY-26032808',
      caseId: 'M2026031816',
      memberId: 'U240815012',
      referrer: '高志仁',
      tag: '會員',
      product: '信用貸款',
      amount: 500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/03/28',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/03/25 14:00',
      pickedUpAt: '2026/03/28 11:30',
      status: 'completed',
    },
    {
      id: 'PAY-26060301',
      caseId: 'M2026052801',
      memberId: 'U250601011',
      referrer: '陳小玲',
      tag: '會員',
      product: '房屋貸款',
      amount: 3200,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/04',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/01 09:30',
      status: 'pickup',
    },
    {
      id: 'PAY-26060302',
      caseId: 'M2026052802',
      memberId: 'U250601012',
      referrer: '蔡明芳',
      tag: '會員',
      product: '信用貸款',
      amount: 2200,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/05',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/01 14:00',
      status: 'pending',
    },
    {
      id: 'PAY-26060303',
      caseId: 'M2026052803',
      memberId: 'U250601013',
      referrer: '林正豪',
      tag: '員工',
      product: '房屋貸款',
      amount: 4500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/06',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/02 10:15',
      status: 'pending',
    },
    {
      id: 'PAY-26060304',
      caseId: 'M2026052804',
      memberId: 'U250601014',
      referrer: '謝佳慧',
      tag: '會員',
      product: '汽車貸款',
      amount: 1500,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/07',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/02 15:30',
      status: 'pending',
    },
    {
      id: 'PAY-26060305',
      caseId: 'M2026052805',
      memberId: 'U250601015',
      referrer: '吳志遠',
      tag: '離職員工',
      product: '房屋貸款',
      amount: 3800,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/07',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/02 16:45',
      status: 'pending',
    },
    // ── 近兩週 demo 資料（2026/06/08 ~ 2026/06/21）────────────
    {
      id: 'PAY-26060801',
      caseId: 'M2026060801',
      memberId: 'U250604001',
      referrer: '劉建宏',
      tag: '會員',
      product: '房屋貸款',
      amount: 2500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/08',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/03 09:00',
      status: 'pickup',
    },
    {
      id: 'PAY-26060802',
      caseId: 'M2026060802',
      memberId: 'U250604002',
      referrer: '許雅婷',
      tag: '員工',
      product: '汽車貸款',
      amount: 1800,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/08',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/03 10:00',
      status: 'pickup',
    },
    {
      id: 'PAY-26060901',
      caseId: 'M2026060901',
      memberId: 'U250604003',
      referrer: '張偉中',
      tag: '會員',
      product: '房屋貸款',
      amount: 5200,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/09',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/04 09:30',
      status: 'pending',
    },
    {
      id: 'PAY-26060902',
      caseId: 'M2026060902',
      memberId: 'U250604004',
      referrer: '林宜靜',
      tag: '會員',
      product: '信用貸款',
      amount: 2800,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/09',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/04 10:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061101',
      caseId: 'M2026061101',
      memberId: 'U250604005',
      referrer: '陳志豪',
      tag: '會員',
      product: '信用貸款',
      amount: 1800,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/11',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/05 09:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061102',
      caseId: 'M2026061102',
      memberId: 'U250604006',
      referrer: '蔡明哲',
      tag: '離職員工',
      product: '房屋貸款',
      amount: 6000,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/11',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/05 10:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061103',
      caseId: 'M2026061103',
      memberId: 'U250604007',
      referrer: '黃淑芬',
      tag: '員工',
      product: '汽車貸款',
      amount: 3500,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/11',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/05 11:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061201',
      caseId: 'M2026061201',
      memberId: 'U250604008',
      referrer: '王建忠',
      tag: '會員',
      product: '信用貸款',
      amount: 2100,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/12',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/05 14:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061501',
      caseId: 'M2026061501',
      memberId: 'U250605001',
      referrer: '吳靜宜',
      tag: '員工',
      product: '房屋貸款',
      amount: 7500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/15',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/06 09:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061502',
      caseId: 'M2026061502',
      memberId: 'U250605002',
      referrer: '李俊賢',
      tag: '會員',
      product: '汽車貸款',
      amount: 2300,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/15',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/06 10:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061503',
      caseId: 'M2026061503',
      memberId: 'U250605003',
      referrer: '鄭雅涵',
      tag: '會員',
      product: '信用貸款',
      amount: 1600,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/15',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/06 11:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061601',
      caseId: 'M2026061601',
      memberId: 'U250605004',
      referrer: '徐志明',
      tag: '會員',
      product: '房屋貸款',
      amount: 4800,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/16',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/07 09:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061701',
      caseId: 'M2026061701',
      memberId: 'U250606001',
      referrer: '洪明芬',
      tag: '員工',
      product: '房屋貸款',
      amount: 3200,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/17',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/07 09:30',
      status: 'pending',
    },
    {
      id: 'PAY-26061702',
      caseId: 'M2026061702',
      memberId: 'U250606002',
      referrer: '吳俊宏',
      tag: '會員',
      product: '信用貸款',
      amount: 1900,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/17',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/07 10:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061703',
      caseId: 'M2026061703',
      memberId: 'U250606003',
      referrer: '林佳蓉',
      tag: '離職員工',
      product: '汽車貸款',
      amount: 5600,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/17',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/07 11:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061801',
      caseId: 'M2026061801',
      memberId: 'U250606004',
      referrer: '楊文豪',
      tag: '會員',
      product: '房屋貸款',
      amount: 8200,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/18',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/08 09:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061802',
      caseId: 'M2026061802',
      memberId: 'U250606005',
      referrer: '謝佩君',
      tag: '會員',
      product: '汽車貸款',
      amount: 2700,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/18',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/08 10:00',
      status: 'pending',
    },
    {
      id: 'PAY-26061901',
      caseId: 'M2026061901',
      memberId: 'U250606006',
      referrer: '蔡宗翰',
      tag: '會員',
      product: '信用貸款',
      amount: 2000,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/19',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/08 10:30',
      status: 'pending',
    },
    {
      id: 'PAY-26061902',
      caseId: 'M2026061902',
      memberId: 'U250606007',
      referrer: '陳宜玲',
      tag: '員工',
      product: '汽車貸款',
      amount: 3900,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/19',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/08 11:00',
      status: 'pending',
    },
    {
      id: 'PAY-26062101',
      caseId: 'M2026062101',
      memberId: 'U250607001',
      referrer: '柯建志',
      tag: '會員',
      product: '房屋貸款',
      amount: 4500,
      method: 'cash',
      branch: '板橋分公司',
      expectedPickupDate: '2026/06/21',
      appointmentHours: '上午 10:00-12:00',
      appliedAt: '2026/06/08 14:00',
      status: 'pending',
    },
    {
      id: 'PAY-26062102',
      caseId: 'M2026062102',
      memberId: 'U250607002',
      referrer: '羅雅文',
      tag: '會員',
      product: '信用貸款',
      amount: 3100,
      method: 'cash',
      branch: '中部總公司',
      expectedPickupDate: '2026/06/21',
      appointmentHours: '下午 14:00-16:00',
      appliedAt: '2026/06/08 15:00',
      status: 'pending',
    },
  ];

  const HISTORY = {
    'PAY-26052203': [
      { time: '2026/05/22 16:00', actor: '推薦人 - 王小毅', action: '建立提領申請', desc: '現場領取 - 板橋分公司，預計 2026/06/05 上午 10:00-12:00', cls: 'done' },
    ],
    'PAY-26032808': [
      { time: '2026/03/25 14:00', actor: '推薦人 - 高志仁', action: '建立提領申請', desc: '現場領取 - 板橋分公司，預計 2026/03/28 上午 10:00-12:00', cls: 'done' },
      { time: '2026/03/28 11:30', actor: '財務 - Mary', action: '完成現場領取', desc: '推薦人已攜帶身分證至現場簽收', cls: 'done' },
    ],
  };

  // ── 現場提領會員 demo 資料（僅需身分證，無銀行帳號）────────
  const DEMO_MEMBER_DATA = {
    'PAY-26052203': { realName: '王志誠',  idNumber: 'B23****90' },
    'PAY-26052006': { realName: '黃俊偉',  idNumber: 'D45****12' },
    'PAY-26032808': { realName: '高志仁',  idNumber: 'G67****34' },
    'PAY-26060301': { realName: '陳小玲',  idNumber: 'H78****45' },
    'PAY-26060302': { realName: '蔡明芳',  idNumber: 'I89****56' },
    'PAY-26060303': { realName: '林正豪',  idNumber: 'J90****67' },
    'PAY-26060304': { realName: '謝佳慧',  idNumber: 'K01****78' },
    'PAY-26060305': { realName: '吳志遠',  idNumber: 'L12****89' },
    'PAY-26060801': { realName: '劉建宏',  idNumber: 'M24****01' },
    'PAY-26060802': { realName: '許雅婷',  idNumber: 'N35****12' },
    'PAY-26060901': { realName: '張偉中',  idNumber: 'O46****23' },
    'PAY-26060902': { realName: '林宜靜',  idNumber: 'P57****34' },
    'PAY-26061101': { realName: '陳志豪',  idNumber: 'Q68****45' },
    'PAY-26061102': { realName: '蔡明哲',  idNumber: 'R79****56' },
    'PAY-26061103': { realName: '黃淑芬',  idNumber: 'S80****67' },
    'PAY-26061201': { realName: '王建忠',  idNumber: 'T91****78' },
    'PAY-26061501': { realName: '吳靜宜',  idNumber: 'U02****89' },
    'PAY-26061502': { realName: '李俊賢',  idNumber: 'V13****90' },
    'PAY-26061503': { realName: '鄭雅涵',  idNumber: 'W24****01' },
    'PAY-26061601': { realName: '徐志明',  idNumber: 'X35****12' },
    'PAY-26061701': { realName: '洪明芬',  idNumber: 'Y46****23' },
    'PAY-26061702': { realName: '吳俊宏',  idNumber: 'Z57****34' },
    'PAY-26061703': { realName: '林佳蓉',  idNumber: 'A68****45' },
    'PAY-26061801': { realName: '楊文豪',  idNumber: 'B79****56' },
    'PAY-26061802': { realName: '謝佩君',  idNumber: 'C80****67' },
    'PAY-26061901': { realName: '蔡宗翰',  idNumber: 'D91****78' },
    'PAY-26061902': { realName: '陳宜玲',  idNumber: 'E02****89' },
    'PAY-26062101': { realName: '柯建志',  idNumber: 'F13****90' },
    'PAY-26062102': { realName: '羅雅文',  idNumber: 'G24****01' },
  };

  function getDemoMemberData(payId) {
    return DEMO_MEMBER_DATA[payId] || { realName: '—', idNumber: '—' };
  }

  const STATUS_META = {
    pending:   { label: '待確認',   cls: 'pending',   icon: 'fa-hourglass-half' },
    pickup:    { label: '待領取',   cls: 'pickup',    icon: 'fa-store' },
    completed: { label: '已領取',   cls: 'completed', icon: 'fa-handshake' },
  };

  const TAG_META = {
    會員: 'badge-purple',
    員工: 'badge-green',
    離職員工: 'badge-yellow',
  };

  function fmt(n) { return n.toLocaleString(); }

  function branchCity(branchName) {
    if (!branchName) return '未知';
    if (branchName.includes('板橋') || branchName === '台北') return '台北';
    if (branchName.includes('中部') || branchName.includes('台中')) return '台中';
    return '未知';
  }

  function parsePickupDate(s) {
    if (!s) return null;
    const m = String(s).match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function fmtDateLabel(date) {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${mm}/${dd}（週${weekdays[date.getDay()]}）`;
  }

  // ==================== 每日刊版 ====================
  let dailyBoardDays = 5;

  function renderDailyBoard() {
    const grid = document.getElementById('daily-board-grid');
    if (!grid) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeCash = PAYMENTS.filter((p) => p.status !== 'completed');

    const cards = [];
    for (let i = 0; i < dailyBoardDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateKey = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
      const isToday = (i === 0);

      const dayPayments = activeCash.filter((p) => (p.expectedPickupDate || '').startsWith(dateKey));
      const taipei   = dayPayments.filter((p) => branchCity(p.branch) === '台北');
      const taichung = dayPayments.filter((p) => branchCity(p.branch) === '台中');

      const branchBlock = (cls, label, items) => {
        const isEmpty = items.length === 0;
        let innerHtml;
        if (isEmpty) {
          innerHtml = '<span class="slot-empty">無預約</span>';
        } else {
          const am = items.filter((p) => (p.appointmentHours || '').startsWith('上午'));
          const pm = items.filter((p) => (p.appointmentHours || '').startsWith('下午'));
          const amAmt = am.reduce((s, p) => s + p.amount, 0);
          const pmAmt = pm.reduce((s, p) => s + p.amount, 0);
          const rows = [];
          if (am.length) rows.push(`<div class="slot-stat-row"><span class="slot-badge slot-am">上午</span><span class="slot-count">${am.length}筆</span><strong class="slot-amt">$${fmt(amAmt)}</strong></div>`);
          if (pm.length) rows.push(`<div class="slot-stat-row"><span class="slot-badge slot-pm">下午</span><span class="slot-count">${pm.length}筆</span><strong class="slot-amt">$${fmt(pmAmt)}</strong></div>`);
          if (!rows.length) rows.push(`<div class="slot-stat-row">${items.length}筆 &nbsp;$${fmt(items.reduce((s, p) => s + p.amount, 0))}</div>`);
          innerHtml = rows.join('');
        }
        return `<div class="daily-branch ${cls}${isEmpty ? ' empty' : ''}">
          <span class="daily-branch-name">${label}</span>
          <div class="daily-slot-stats">${innerHtml}</div>
        </div>`;
      };

      cards.push(`
        <div class="daily-date-card${isToday ? ' is-today' : ''}${dailyBoardDays > 5 ? ' compact' : ''}">
          <div class="daily-date-header">
            <span class="daily-date-label">${fmtDateLabel(d)}</span>
            ${isToday ? '<span class="daily-today-badge">今天</span>' : ''}
          </div>
          <div class="daily-branch-col">
            ${branchBlock('taipei', '台北 板橋分公司', taipei)}
            ${branchBlock('taichung', '台中 中部總公司', taichung)}
          </div>
        </div>`);
    }

    grid.innerHTML = cards.join('');
    grid.dataset.days = dailyBoardDays;
  }

  function bindDailyRangeTabs() {
    document.querySelectorAll('.daily-range-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const days = Number(btn.dataset.range);
        if (!days || days === dailyBoardDays) return;
        dailyBoardDays = days;
        document.querySelectorAll('.daily-range-tab').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        const label = document.getElementById('daily-board-range-label');
        if (label) label.textContent = days === 5 ? '近五日' : '近兩週';
        renderDailyBoard();
      });
    });
  }

  // ==================== 清單 ====================
  const cashFilters = { keyword: '', referrerName: '', referrerId: '', status: 'all', branch: 'all' };
  let cashPgPage = 1, cashPgSize = 20;
  let cashSelected = new Set();

  const PERM_KEY = 'mgm_perm_edit_cash';
  function canEditCash() { try { return localStorage.getItem(PERM_KEY) === '1'; } catch { return false; } }
  function setCanEditCash(v) { try { localStorage.setItem(PERM_KEY, v ? '1' : '0'); } catch {} }

  function isBatchSelectable(p) {
    return p.status === 'pending' || p.status === 'pickup';
  }

  function normalizeSelected() {
    cashSelected = new Set(
      [...cashSelected].filter((id) => {
        const p = PAYMENTS.find((x) => x.id === id);
        return p && isBatchSelectable(p);
      })
    );
  }

  function getCashFiltered() {
    const kw      = cashFilters.keyword.trim().toLowerCase();
    const rnKw    = cashFilters.referrerName.trim().toLowerCase();
    const ridKw   = cashFilters.referrerId.trim().toLowerCase();
    const result = PAYMENTS.filter((p) => {
      if (cashFilters.status !== 'all' && p.status !== cashFilters.status) return false;
      if (cashFilters.branch !== 'all' && branchCity(p.branch) !== cashFilters.branch) return false;
      if (rnKw  && !(p.referrer  || '').toLowerCase().includes(rnKw))  return false;
      if (ridKw && !(p.memberId  || '').toLowerCase().includes(ridKw)) return false;
      if (kw) {
        const hay = [p.id, p.caseId, p.memberId, p.referrer, p.tag, p.product, p.branch]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
    return result.sort((a, b) => {
      const da = parsePickupDate(a.expectedPickupDate);
      const db = parsePickupDate(b.expectedPickupDate);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da - db;
    });
  }

  function renderRow(p) {
    const s = STATUS_META[p.status] || { label: p.status, cls: 'pending', icon: 'fa-question' };
    const tagCls = TAG_META[p.tag] || 'badge-gray';
    const city = branchCity(p.branch);
    const cityBadge = city === '台北'
      ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#eff6ff;color:#1d4ed8;">台北</span>`
      : city === '台中'
      ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#f0fdf4;color:#15803d;">台中</span>`
      : '';
    const slotLabel = (p.appointmentHours || '').startsWith('上午') ? '上午'
      : (p.appointmentHours || '').startsWith('下午') ? '下午' : '';
    const slotBadge = slotLabel
      ? `<br><span class="slot-badge slot-${slotLabel === '上午' ? 'am' : 'pm'}">${slotLabel}</span>`
      : '';
    const pickupDate = p.expectedPickupDate
      ? `<span style="font-weight:600;">${p.expectedPickupDate}</span>${slotBadge}`
      : `<span style="color:var(--color-text-muted);">未設定</span>`;
    const canCheck = isBatchSelectable(p);
    const checked  = cashSelected.has(p.id);

    return `
      <tr>
        <td>${canCheck ? `<input type="checkbox" class="row-check" data-id="${p.id}" ${checked ? 'checked' : ''}>` : ''}</td>
        <td class="cell-mono"><span class="mono-strong">${p.id}</span></td>
        <td class="cell-mono">${p.caseId}</td>
        <td class="cell-mono" style="font-size:12px;">${p.memberId || '—'}</td>
        <td><strong>${p.referrer}</strong></td>
        <td>${p.tag}</td>
        <td class="cell-amount">$${fmt(p.amount)}</td>
        <td>${cityBadge} <span style="font-size:11px;color:var(--color-text-secondary);">${p.branch || '—'}</span></td>
        <td class="cell-applied">${pickupDate}</td>
        <td><span class="pay-status ${s.cls}"><i class="fa-solid ${s.icon}"></i>${s.label}</span></td>
        <td>
          <button type="button" class="action-btn" data-action="attach" data-id="${p.id}">
            <i class="fa-solid fa-paperclip"></i>提領資料
          </button>
          <button type="button" class="action-btn" data-action="history" data-id="${p.id}">
            <i class="fa-solid fa-clock-rotate-left"></i>歷程
          </button>
          <button type="button" class="action-btn note" data-action="note" data-id="${p.id}" title="${p.note ? '已有備註' : '新增備註'}">
            <i class="fa-regular fa-note-sticky"></i>${p.note ? '備註•' : '備註'}
          </button>
          ${canEditCash() ? `<button type="button" class="action-btn" data-action="edit" data-id="${p.id}">
            <i class="fa-solid fa-pen-to-square"></i>編輯
          </button>` : ''}
        </td>
      </tr>`;
  }

  function render() {
    normalizeSelected();
    const filtered = getCashFiltered();
    const total = filtered.length;
    const maxPage = Math.max(1, Math.ceil(total / cashPgSize));
    if (cashPgPage > maxPage) cashPgPage = maxPage;
    const start = (cashPgPage - 1) * cashPgSize;
    const rows = filtered.slice(start, start + cashPgSize);

    const tbody = document.getElementById('cash-tbody');
    if (tbody) {
      tbody.innerHTML = rows.length
        ? rows.map(renderRow).join('')
        : `<tr><td colspan="11" style="padding:32px;text-align:center;color:var(--color-text-muted);">此分類目前沒有資料</td></tr>`;
    }

    const totalEl = document.getElementById('cash-pg-total');
    const curEl   = document.getElementById('cash-pg-cur');
    const maxEl   = document.getElementById('cash-pg-max');
    if (totalEl) totalEl.textContent = total;
    if (curEl)   curEl.textContent   = cashPgPage;
    if (maxEl)   maxEl.textContent   = maxPage;

    renderPagination(maxPage);
    bindRowActions();
    updateBatchBar();
  }

  function renderPagination(maxPage) {
    const wrap = document.getElementById('cash-pagination');
    if (!wrap) return;
    const btns = [];
    btns.push(`<button class="pg-btn" data-pg="prev" ${cashPgPage <= 1 ? 'disabled' : ''}>«</button>`);
    const pages = new Set([1, maxPage]);
    for (let i = Math.max(1, cashPgPage - 2); i <= Math.min(maxPage, cashPgPage + 2); i++) pages.add(i);
    const sorted = [...pages].sort((a, b) => a - b);
    let prev = 0;
    sorted.forEach((n) => {
      if (n - prev > 1) btns.push('<span class="pg-ellipsis">…</span>');
      btns.push(`<button class="pg-btn ${n === cashPgPage ? 'pg-active' : ''}" data-pg="${n}">${n}</button>`);
      prev = n;
    });
    btns.push(`<button class="pg-btn" data-pg="next" ${cashPgPage >= maxPage ? 'disabled' : ''}>»</button>`);
    wrap.innerHTML = btns.join('');
    wrap.querySelectorAll('.pg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const v = b.dataset.pg;
        if (v === 'prev') cashPgPage = Math.max(1, cashPgPage - 1);
        else if (v === 'next') cashPgPage = Math.min(maxPage, cashPgPage + 1);
        else cashPgPage = parseInt(v, 10) || 1;
        render();
      });
    });
  }

  function bindRowActions() {
    document.querySelectorAll('.row-check').forEach((cb) => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.id;
        const p = PAYMENTS.find((x) => x.id === id);
        if (!p || !isBatchSelectable(p)) { cb.checked = false; cashSelected.delete(id); }
        else if (cb.checked) cashSelected.add(id);
        else cashSelected.delete(id);
        updateBatchBar();
      });
    });
    document.querySelectorAll('[data-action="attach"]').forEach((b) =>
      b.addEventListener('click', () => openAttachments(b.dataset.id))
    );
    document.querySelectorAll('[data-action="history"]').forEach((b) =>
      b.addEventListener('click', () => openHistory(b.dataset.id))
    );
    document.querySelectorAll('[data-action="note"]').forEach((b) =>
      b.addEventListener('click', () => openNote(b.dataset.id))
    );
    document.querySelectorAll('[data-action="edit"]').forEach((b) =>
      b.addEventListener('click', () => openEdit(b.dataset.id))
    );
  }

  function updateBatchBar() {
    normalizeSelected();
    const bar = document.getElementById('cash-batch-bar');
    if (!bar) return;
    if (cashSelected.size === 0) { bar.classList.add('hidden'); return; }
    bar.classList.remove('hidden');
    const items = [...cashSelected].map((id) => PAYMENTS.find((p) => p.id === id)).filter(Boolean);
    document.getElementById('cash-batch-count').textContent = items.length;
    document.getElementById('cash-batch-amount').textContent = '$' + fmt(items.reduce((s, p) => s + p.amount, 0));
  }

  // ==================== 歷程 Modal ====================
  function openHistory(payId) {
    const p = PAYMENTS.find((x) => x.id === payId);
    if (!p) return;
    document.getElementById('history-payid').textContent = p.id;
    document.getElementById('history-ref').textContent = `${p.referrer} / ${p.tag}`;
    document.getElementById('history-amount').textContent = '$' + fmt(p.amount);
    document.getElementById('history-branch').textContent = p.branch || '—';
    document.getElementById('history-pickup').textContent =
      p.expectedPickupDate
        ? (p.appointmentHours ? `${p.expectedPickupDate}　${p.appointmentHours}` : p.expectedPickupDate)
        : '—';
    const s = STATUS_META[p.status] || { label: p.status, cls: 'pending' };
    document.getElementById('history-status').innerHTML =
      `<span class="pay-status ${s.cls}">${s.label}</span>`;

    const list = HISTORY[payId] || [];
    const wrap = document.getElementById('history-timeline');
    wrap.innerHTML = list.length
      ? list.map((h) => `
        <div class="timeline-entry ${h.cls || ''}">
          <div class="timeline-time">${h.time}</div>
          <div class="timeline-title">${h.action}</div>
          <div class="timeline-desc">${h.desc}</div>
          <div class="timeline-actor"><i class="fa-regular fa-user"></i> ${h.actor}</div>
        </div>`).join('')
      : `<div style="text-align:center;padding:30px;color:var(--color-text-muted);">尚無歷程紀錄</div>`;

    document.getElementById('history-modal').classList.add('show');
  }

  // ==================== 備註 Modal ====================
  let noteId = null;
  function openNote(id) {
    const p = PAYMENTS.find((x) => x.id === id);
    if (!p) return;
    noteId = id;
    document.getElementById('note-pay-id').textContent = id;
    document.getElementById('note-pay-text').value = p.note || '';
    document.getElementById('note-pay-modal').classList.add('show');
  }
  function closeNote() {
    document.getElementById('note-pay-modal').classList.remove('show');
    noteId = null;
  }
  function saveNote() {
    if (!noteId) return;
    const p = PAYMENTS.find((x) => x.id === noteId);
    if (!p) return;
    p.note = document.getElementById('note-pay-text').value.trim();
    if (!HISTORY[p.id]) HISTORY[p.id] = [];
    HISTORY[p.id].unshift({
      time: new Date().toLocaleString('zh-TW'),
      actor: 'Admin User',
      action: '更新備註',
      desc: p.note || '（清除備註）',
      cls: '',
    });
    closeNote();
    render();
    toast('已儲存備註');
  }

  // ==================== 編輯 Modal ====================
  let editId = null;
  function openEdit(id) {
    if (!canEditCash()) { alert('您沒有「編輯現場提領」權限，請聯繫管理員開啟。'); return; }
    const p = PAYMENTS.find((x) => x.id === id);
    if (!p) return;
    editId = id;
    document.getElementById('edit-pay-id').textContent = id;
    document.getElementById('edit-pay-ref').value = `${p.referrer} (${p.tag})`;
    document.getElementById('edit-pay-status').value = p.status || 'pending';
    document.getElementById('edit-pay-branch-select').value = p.branch || '板橋分公司';
    const pickup = (p.expectedPickupDate || '').replace(/\//g, '-');
    document.getElementById('edit-pay-expected-pickup').value = pickup;
    document.getElementById('edit-pay-time-slot').value = p.appointmentHours || '';
    document.getElementById('edit-pay-reason').value = '';
    document.getElementById('edit-pay-modal').classList.add('show');
  }
  function closeEdit() {
    document.getElementById('edit-pay-modal').classList.remove('show');
    editId = null;
  }
  function saveEdit() {
    if (!editId) return;
    const p = PAYMENTS.find((x) => x.id === editId);
    if (!p) return;
    const reason = document.getElementById('edit-pay-reason').value.trim();
    if (!reason) { alert('請填寫變更原因（必填，將寫入異動歷程）'); return; }
    const oldBranch = p.branch;
    const oldStatus = p.status;
    const oldTimeSlot = p.appointmentHours || '未設定';
    p.branch = document.getElementById('edit-pay-branch-select').value;
    p.status = document.getElementById('edit-pay-status').value;
    const pickup = document.getElementById('edit-pay-expected-pickup').value;
    p.expectedPickupDate = pickup ? pickup.replace(/-/g, '/') : p.expectedPickupDate;
    p.appointmentHours = document.getElementById('edit-pay-time-slot').value || p.appointmentHours;
    if (p.status === 'completed') p.pickedUpAt = new Date().toLocaleString('zh-TW');
    if (!HISTORY[p.id]) HISTORY[p.id] = [];
    const newTimeSlot = p.appointmentHours || '未設定';
    HISTORY[p.id].push({
      time: new Date().toLocaleString('zh-TW'),
      actor: '財務後台 - 編輯權限使用',
      action: '修改現場提領資訊',
      desc: `門市：${oldBranch} → ${p.branch}；時段：${oldTimeSlot} → ${newTimeSlot}；狀態：${STATUS_META[oldStatus]?.label || oldStatus} → ${STATUS_META[p.status]?.label || p.status}；原因：${reason}`,
      cls: '',
    });
    closeEdit();
    render();
    renderDailyBoard();
    toast('已更新現場提領資訊');
  }

  // ==================== 檢視附件 Modal ====================
  function drawAttachCanvas(canvasId, typeLabel, subLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const W = 300, H = 190;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#edf2f7'); grad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#c7d2e0'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0.75, 0.75, W - 1.5, H - 1.5);
    ctx.fillStyle = '#475569'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(typeLabel, W / 2, H / 2 - 12);
    if (subLabel) {
      ctx.fillStyle = '#7c8fa8'; ctx.font = '12px sans-serif';
      ctx.fillText(subLabel, W / 2, H / 2 + 10);
    }
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px sans-serif';
    ctx.fillText('（上傳後顯示於此）', W / 2, H / 2 + 28);
    ctx.save();
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#1e3a5f';
    ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left';
    ctx.rotate(-Math.PI / 6);
    const wm = '僅限台灣理財通系統使用';
    for (let y = -H * 2; y < H * 2; y += 30) {
      for (let x = -W * 2; x < W * 2.5; x += 170) { ctx.fillText(wm, x, y); }
    }
    ctx.restore();
  }

  function openAttachments(payId) {
    const p = PAYMENTS.find((x) => x.id === payId);
    if (!p) return;
    const m = getDemoMemberData(payId);
    document.getElementById('attach-payid').textContent    = p.id;
    document.getElementById('attach-referrer').textContent = p.referrer;
    document.getElementById('attach-real-name').textContent = m.realName || '—';
    document.getElementById('attach-id-number').textContent = m.idNumber || '—';
    document.getElementById('attach-branch').textContent    = p.branch || '—';
    const apptText = p.expectedPickupDate
      ? (p.appointmentHours ? `${p.expectedPickupDate}　${p.appointmentHours}` : p.expectedPickupDate)
      : '—';
    document.getElementById('attach-appt').textContent = apptText;
    requestAnimationFrame(() => {
      drawAttachCanvas('attach-canvas-id-front', '身分證正面', p.referrer);
      drawAttachCanvas('attach-canvas-id-back',  '身分證反面', '');
      bindCanvasZoom('attach-canvas-id-front', '身分證正面');
      bindCanvasZoom('attach-canvas-id-back',  '身分證反面');
    });
    document.getElementById('attach-modal').classList.add('show');
  }

  function closeAttachModal() {
    document.getElementById('attach-modal').classList.remove('show');
  }

  function bindAttachModal() {
    document.getElementById('btn-attach-close').addEventListener('click', closeAttachModal);
    document.getElementById('btn-attach-close-foot').addEventListener('click', closeAttachModal);
    document.getElementById('attach-modal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeAttachModal();
    });
  }

  // ==================== 圖片燈箱 ====================
  function bindCanvasZoom(canvasId, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    canvas.onclick = () => openLightbox(canvasId, label);
  }

  function openLightbox(canvasId, label) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const img = document.getElementById('lightbox-img');
    const lbl = document.getElementById('lightbox-label-text');
    if (img) { img.src = dataUrl; img.alt = label; }
    if (lbl) lbl.textContent = label;
    document.getElementById('img-lightbox').classList.add('show');
  }

  function closeLightbox() {
    const lb = document.getElementById('img-lightbox');
    if (lb) lb.classList.remove('show');
  }

  function bindLightbox() {
    document.getElementById('btn-lightbox-close').addEventListener('click', closeLightbox);
    document.getElementById('img-lightbox').addEventListener('click', (e) => {
      if (e.target === e.currentTarget || e.target.id === 'img-lightbox-body') closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const lb = document.getElementById('img-lightbox');
      if (lb && lb.classList.contains('show')) { closeLightbox(); e.stopPropagation(); }
    }, true);
  }

  // ==================== Toast ====================
  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  // ==================== CSV 匯出 ====================
  function csvEscape(v) {
    if (v == null) return '';
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  function downloadCsv(filename, rows) {
    const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  }

  function bindExportCash() {
    const btn = document.getElementById('btn-export-cash');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const rows = getCashFiltered();
      if (!rows.length) { alert('目前無資料可匯出'); return; }
      const header = ['款項編號','案號','推薦人編號','推薦人','標籤','金額(NT$)','門市','城市','預計領取日','預約時段','狀態','備註'];
      const data = rows.map((p) => [
        p.id, p.caseId, p.memberId || '', p.referrer, p.tag, p.amount,
        p.branch || '', branchCity(p.branch),
        p.expectedPickupDate || '', p.appointmentHours || '',
        STATUS_META[p.status]?.label || p.status, p.note || '',
      ]);
      downloadCsv(`cash_payments_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`, [header, ...data]);
      toast(`已匯出 ${rows.length} 筆現場提領資料`);
    });
  }

  // ==================== DOMContentLoaded ====================
  document.addEventListener('DOMContentLoaded', () => {
    // 篩選
    const btnSearch = document.getElementById('btn-cash-search');
    if (btnSearch) btnSearch.addEventListener('click', applyFilters);
    const rnInp  = document.getElementById('cash-filter-referrer-name');
    const ridInp = document.getElementById('cash-filter-referrer-id');
    if (rnInp)  rnInp.addEventListener('keydown',  (e) => { if (e.key === 'Enter') applyFilters(); });
    if (ridInp) ridInp.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
    const st = document.getElementById('cash-filter-status');
    if (st) st.addEventListener('change', applyFilters);
    const br = document.getElementById('cash-filter-branch');
    if (br) br.addEventListener('change', applyFilters);
    // 篩選收合 / 清除
    const btnToggle = document.getElementById('btn-toggle-advanced');
    const filterGrid = document.getElementById('filter-grid');
    if (btnToggle && filterGrid) {
      btnToggle.addEventListener('click', () => {
        const collapsed = filterGrid.classList.toggle('collapsed');
        btnToggle.innerHTML = collapsed
          ? '<i class="fa-solid fa-chevron-down"></i>展開篩選'
          : '<i class="fa-solid fa-chevron-up"></i>收合篩選';
      });
    }
    const btnClearFilter = document.getElementById('btn-clear-filter');
    if (btnClearFilter && filterGrid) {
      btnClearFilter.addEventListener('click', () => {
        filterGrid.querySelectorAll('input').forEach((el) => (el.value = ''));
        filterGrid.querySelectorAll('select').forEach((el) => (el.selectedIndex = 0));
        applyFilters();
      });
    }

    function applyFilters() {
      cashFilters.referrerName = rnInp  ? rnInp.value  : '';
      cashFilters.referrerId   = ridInp ? ridInp.value : '';
      cashFilters.status       = st ? st.value : 'all';
      cashFilters.branch       = br ? br.value : 'all';
      cashPgPage = 1;
      cashSelected.clear();
      render();
      renderDailyBoard();
    }

    // 批次操作
    const batchCompleted = document.getElementById('btn-cash-batch-completed');
    if (batchCompleted) {
      batchCompleted.addEventListener('click', () => {
        normalizeSelected();
        if (cashSelected.size === 0) return;
        if (!confirm(`將 ${cashSelected.size} 筆現場提領標記為「已領取」？`)) return;
        const now = new Date().toLocaleString('zh-TW');
        [...cashSelected].forEach((id) => {
          const p = PAYMENTS.find((x) => x.id === id);
          if (!p || !isBatchSelectable(p)) return;
          p.status = 'completed';
          p.pickedUpAt = now;
          if (!HISTORY[id]) HISTORY[id] = [];
          HISTORY[id].unshift({ time: now, actor: 'Admin User', action: '批次標記「已領取」', desc: '門市現場簽收完成', cls: 'done' });
        });
        cashSelected.clear();
        render();
        renderDailyBoard();
        toast('已批次更新現場提領狀態');
      });
    }
    const batchCancel = document.getElementById('btn-cash-batch-cancel');
    if (batchCancel) batchCancel.addEventListener('click', () => { cashSelected.clear(); render(); });

    // 分頁大小
    const pageSizeSel = document.getElementById('cash-page-size');
    if (pageSizeSel) {
      cashPgSize = parseInt(pageSizeSel.value, 10) || 20;
      pageSizeSel.addEventListener('change', () => {
        cashPgSize = parseInt(pageSizeSel.value, 10) || 20;
        cashPgPage = 1;
        render();
      });
    }

    // 權限 toggle
    const permCb = document.getElementById('perm-edit-cash');
    if (permCb) {
      permCb.checked = canEditCash();
      permCb.addEventListener('change', () => {
        setCanEditCash(permCb.checked);
        render();
        toast(permCb.checked ? '已開啟「編輯現場提領」權限' : '已關閉「編輯現場提領」權限');
      });
    }

    // 備註 Modal
    document.getElementById('btn-note-pay-close').addEventListener('click', closeNote);
    document.getElementById('btn-note-pay-cancel').addEventListener('click', closeNote);
    document.getElementById('btn-note-pay-save').addEventListener('click', saveNote);

    // 編輯 Modal
    document.getElementById('btn-edit-pay-close').addEventListener('click', closeEdit);
    document.getElementById('btn-edit-pay-cancel').addEventListener('click', closeEdit);
    document.getElementById('btn-edit-pay-save').addEventListener('click', saveEdit);

    // 歷程 Modal
    document.getElementById('btn-history-close').addEventListener('click', () =>
      document.getElementById('history-modal').classList.remove('show')
    );

    // 附件 Modal & 燈箱
    bindAttachModal();
    bindLightbox();

    // CSV 匯出
    bindExportCash();

    // 看板日期範圍切換
    bindDailyRangeTabs();

    // 初始渲染
    renderDailyBoard();
    render();
  });
})();
