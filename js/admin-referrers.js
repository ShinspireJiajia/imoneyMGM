/* ==========================================================
   admin-referrers.js - 推薦人管理
  功能：列表渲染、停用、檢視紀錄、內部備註
   ========================================================== */

(function () {
  'use strict';

  // 推薦人 demo
  const REFERRERS = [
    {
      uid: 'U250310001',
      name: '王小毅',
      phone: '0918123888',
      idLast4: '3481',
      phoneOtpVerified: false,
      tag: '會員',
      clicks: 156,
      cases: 24,
      lastUsed: '2026/05/22 14:23',
      lastIp: '111.250.***.45',
      pending: 9000,
      withdrawn: 18500,
      thisMonth: 9000,
      status: 'active',
    },
    {
      uid: 'U240105002',
      name: '李大華',
      phone: '0922456555',
      loginEmail: 'dahua.li@mgm.com',
      idLast4: '9027',
      phoneOtpVerified: true,
      tag: '員工',
      clicks: 89,
      cases: 18,
      lastUsed: '2026/05/24 09:11',
      lastIp: '210.59.***.88',
      pending: 6500,
      withdrawn: 32000,
      thisMonth: 6500,
      status: 'active',
    },
    {
      uid: 'U230620004',
      name: '陳前輩',
      phone: '0912345456',
      loginEmail: 'mentor.chen@mgm.com',
      idLast4: '5512',
      phoneOtpVerified: true,
      tag: '離職員工',
      retiredAt: '2026/04/12',
      clicks: 42,
      cases: 7,
      lastUsed: '2026/05/20 18:30',
      lastIp: '203.74.***.122',
      pending: 0,
      withdrawn: 12500,
      thisMonth: 0,
      status: 'active',
    },
    {
      uid: 'U250115005',
      name: '張志維',
      phone: '0933678111',
      idLast4: '7704',
      phoneOtpVerified: false,
      tag: '會員',
      clicks: 387,
      cases: 24,
      lastUsed: '2026/05/18 14:22',
      lastIp: '45.142.***.* (境外 VPN)',
      pending: 0,
      withdrawn: 0,
      thisMonth: 0,
      status: 'frozen',
      frozenReason: '單日送單 12 筆，IP 多為境外 VPN',
    },
    {
      uid: 'U240328006',
      name: '李育穎',
      phone: '0955333222',
      loginEmail: 'yiying.li@mgm.com',
      idLast4: '1833',
      phoneOtpVerified: true,
      tag: '離職員工',
      retiredAt: '2026/03/28',
      clicks: 251,
      cases: 18,
      lastUsed: '2026/04/30 10:15',
      lastIp: '118.232.***.77',
      pending: 0,
      withdrawn: 0,
      thisMonth: 0,
      status: 'frozen',
      frozenReason: '同一裝置出現多組推薦碼',
    },
    {
      uid: 'U250220007',
      name: '王建鴻',
      phone: '0966444333',
      idLast4: '6408',
      phoneOtpVerified: false,
      tag: '會員',
      clicks: 68,
      cases: 9,
      lastUsed: '2026/05/24 22:05',
      lastIp: '111.250.***.45',
      pending: 4500,
      withdrawn: 0,
      thisMonth: 4500,
      status: 'warning',
    },
    {
      uid: 'U250601010',
      name: '蘇建志',
      phone: '0966123456',
      idLast4: '3456',
      phoneOtpVerified: false,
      tag: '員工',
      employeeSince: '2026/04/15',
      memberSince: '2025/08/01',
      clicks: 44,
      cases: 6,
      lastUsed: '2026/05/18 16:22',
      lastIp: '114.38.***.91',
      pending: 2500,
      withdrawn: 4500,
      thisMonth: 2500,
      status: 'active',
    },
  ];

  // 推薦碼點擊使用紀錄 demo（key 為 uid）— 由原「推薦碼管理」整合進來
  // 每筆紀錄：點擊時間 / 來源 IP / 是否成功送單 / 對應會員編號
  const USAGE = {
    U250310001: [
      { time: '2026/05/22 14:23', ip: '111.250.***.45', submitted: true,  refereeUid: 'U21358' },
      { time: '2026/05/21 19:12', ip: '111.250.***.46', submitted: true,  refereeUid: 'U20511' },
      { time: '2026/05/21 11:08', ip: '111.250.***.46', submitted: false, refereeUid: '—' },
      { time: '2026/05/20 22:34', ip: '203.74.***.99',  submitted: false, refereeUid: '—' },
      { time: '2026/05/20 09:11', ip: '111.250.***.45', submitted: true,  refereeUid: 'U19802' },
    ],
    U240105002: [
      { time: '2026/05/24 09:11', ip: '210.59.***.88',  submitted: true,  refereeUid: 'U23991' },
      { time: '2026/05/23 16:42', ip: '210.59.***.88',  submitted: false, refereeUid: '—' },
    ],
    U230620004: [
      { time: '2026/05/20 18:30', ip: '203.74.***.122', submitted: true,  refereeUid: 'U17688' },
    ],
    U250115005: [
      { time: '2026/05/18 14:22', ip: '45.142.***.55 (境外)', submitted: true,  refereeUid: 'U30021' },
      { time: '2026/05/18 14:21', ip: '45.142.***.55 (境外)', submitted: true,  refereeUid: 'U30022' },
      { time: '2026/05/18 14:20', ip: '45.142.***.55 (境外)', submitted: true,  refereeUid: 'U30023' },
      { time: '2026/05/17 23:55', ip: '45.142.***.55 (境外)', submitted: false, refereeUid: '—' },
    ],
    U240328006: [
      { time: '2026/04/30 10:15', ip: '118.232.***.77', submitted: false, refereeUid: '—' },
    ],
    U250220007: [
      { time: '2026/05/24 22:05', ip: '111.250.***.45', submitted: true,  refereeUid: 'U22107' },
    ],
    U250601010: [
      { time: '2026/05/18 16:22', ip: '114.38.***.91', submitted: true,  refereeUid: 'U31004' },
      { time: '2026/04/20 09:45', ip: '114.38.***.91', submitted: true,  refereeUid: 'U30887' },
    ],
  };

  // 推薦人的專屬推薦碼 demo（每位一組固定碼，可長期使用）
  const SHARE_LINKS = {
    U250310001: [
      { code: 'A1B2C3D',  clicks: 256, submits: 24, status: 'active' },
    ],
    U240105002: [
      { code: 'K3M5N7P',  clicks: 318, submits: 36, status: 'active' },
    ],
    U230620004: [
      { code: 'X9Y8Z7W',  clicks: 142, submits: 18, status: 'active' },
    ],
    U250115005: [
      { code: 'F4G6H8J',  clicks: 156, submits: 12, status: 'disabled' },
    ],
    U240328006: [
      { code: 'P3Q5R7S',  clicks: 251, submits: 18, status: 'disabled' },
    ],
    U250220007: [
      { code: 'T2U4V6W',  clicks: 68, submits: 9, status: 'active' },
    ],
    U250601010: [
      { code: 'J3K5L7M',  clicks: 44, submits: 6, status: 'active' },
    ],
  };

  // 推薦人對應的案件清單 demo
  // 來自 admin-records demo（caseId 應與該頁同步）
  const REFERRER_CASES = {
    U250310001: [
      { caseId: 'M2026052301', refereePhone: '0912345456', refereeName: '陳志明', submitAt: '2026/05/22', status: 'reviewing', refereeTag: '新客戶' },
      { caseId: 'M2026052102', refereePhone: '0922456789', refereeName: '林佳華', submitAt: '2026/05/20', status: 'confirmed', refereeTag: '新客戶' },
      { caseId: 'M2026051205', refereePhone: '0955333222', refereeName: '吳雅芳', submitAt: '2026/05/12', status: 'rewardable', refereeTag: '新客戶' },
      { caseId: 'M2026050207', refereePhone: '0966444333', refereeName: '蔡佳婷', submitAt: '2026/05/02', status: 'invalid', refereeTag: '既有客戶' },
      { caseId: 'M2026052810', refereePhone: '0921457632', refereeName: '游佳淇', submitAt: '2026/05/28', status: 'pending_review', refereeTag: '新客戶' },
    ],
    U240105002: [
      { caseId: 'M2026051504', refereePhone: '0933678111', refereeName: '張俊豪', submitAt: '2026/05/15', status: 'rewardable', refereeTag: '新客戶' },
      { caseId: 'M2026052712', refereePhone: '0941456209', refereeName: '宋雨恩', submitAt: '2026/05/27', status: 'pending_review', refereeTag: '新客戶' },
    ],
    U230620004: [
      { caseId: 'M2026050806', refereePhone: '0911455333', refereeName: '李文仁', submitAt: '2026/05/08', status: 'withdrawn', refereeTag: '新客戶' },
    ],
    U250115005: [],
    U240328006: [],
    U250220007: [],
    U250601010: [
      { caseId: 'M2026042001', refereePhone: '0977654321', refereeName: '吳啟明', submitAt: '2026/04/20', status: 'rewardable', refereeTag: '新客戶' },
      { caseId: 'M2026051801', refereePhone: '0944321100', refereeName: '林淑芬', submitAt: '2026/05/18', status: 'reviewing', refereeTag: '新客戶' },
    ],
  };

  // 名單系統（CRM）會員姓名 demo（key 為手機號碼）— 用於同步顯示會員真實姓名
  // 若手機號碼未在名單系統中比對到資料，畫面以「-」呈現
  const CRM_MEMBER_NAMES = {
    '0918123888': '王小毅',
    '0922456555': '李大華',
    '0912345456': '陳志忠',
    '0955333222': '李育穎',
    '0966444333': '王建鴻',
  };

  function getCrmMemberName(r) {
    return CRM_MEMBER_NAMES[r.phone] || '-';
  }

  const STATUS_LABEL = {
    reviewing: '審核中', confirmed: '專案已確認', pending_review: '人工審核中',
    rewardable: '可提領', withdrawn: '已提領', invalid: '未符合資格',
    active: '使用中', disabled: '已停用',
  };

  const CASE_PROGRESS_LABEL = {
    reviewing: '申請中',
    confirmed: '申請中',
    pending_review: '申請中',
    rewardable: '待提領',
    withdrawn: '已提領',
    pending: '申請提領中',
    transferring: '申請提領中',
    pickup: '申請提領中',
    pending_pickup: '申請提領中',
    invalid: '未符合格',
  };

  const VIEW_PAGE_SIZE = 5;
  const viewPagerState = {
    uid: '',
    links: 1,
    cases: 1,
  };

  // 內部備註 demo
  const NOTES = {
    U250310001: [
      { time: '2026/05/20 10:30', user: '客服 - Mary', text: 'VIP 客戶，過往 3 年信貸紀錄良好，請優先聯繫。' },
      { time: '2026/03/15 14:00', user: '客服 - John', text: '已透過 LINE OA 確認手機號碼為本人使用。' },
    ],
    U240105002: [
      { time: '2026/05/01 09:00', user: '主管 - 林經理', text: '員工自願加入 MGM 推廣，工作表現連續 3 季優秀。' },
    ],
    U250115005: [
      { time: '2026/05/18 14:22', user: 'Admin User', text: '經客訴單位反映，疑似從外部論壇大量擷取案源，已凍結。' },
    ],
    U230620004: [],
    U240328006: [],
    U250220007: [],
    U250601010: [
      { time: '2026/04/16 10:00', user: '主管 - 林經理', text: '原為一般會員推薦客（加入自 2025/08），2026/04/15 正式入職，身分已自動升級為員工，入職前推薦紀錄保留，後續依員工推薦規則計算。' },
    ],
  };

  const TAG_META = {
    會員: 'badge-purple',
    員工: 'badge-green',
    離職員工: 'badge-yellow',
  };

  const STATUS_META = {
    active: { label: '正常', cls: 'badge-green' },
    warning: { label: '系統警示', cls: 'badge-yellow' },
    frozen: { label: '已停用', cls: 'badge-gray' },
  };

  const filterState = {
    uid: '',
    phone: '',
    name: '',
    tag: 'all',
    status: 'all',
  };

  function applyRoleFieldsByTag(ref, tag) {
    if (!ref) return;
    if (tag === '員工') {
      ref.userRole = 'Employee';
      ref.employeeFlag = 'Y';
      ref.employeeStatus = 'Active';
      return;
    }
    if (tag === '離職員工') {
      ref.userRole = 'Visitor';
      ref.employeeFlag = 'Y';
      ref.employeeStatus = 'Resigned';
      return;
    }
    ref.userRole = 'Visitor';
    ref.employeeFlag = 'N';
    ref.employeeStatus = null;
  }

  function ensureReferrerRoleFields(ref) {
    if (!ref) return ref;
    if (!('userRole' in ref) || !('employeeFlag' in ref) || !('employeeStatus' in ref)) {
      applyRoleFieldsByTag(ref, ref.tag || '會員');
    }
    return ref;
  }

  function getReferrerTag(ref) {
    ensureReferrerRoleFields(ref);
    if (ref.userRole === 'Employee' && ref.employeeStatus === 'Active') return '員工';
    if (ref.employeeFlag === 'Y' && ref.employeeStatus === 'Resigned') return '離職員工';
    return '會員';
  }

  function isEmployeeReferrer(ref) {
    return getReferrerTag(ref) === '員工';
  }

  function isResignedReferrer(ref) {
    return getReferrerTag(ref) === '離職員工';
  }

  function getRoleLabel(ref) {
    const role = (ref && ref.userRole) || 'Visitor';
    return role === 'Employee' ? 'Employee（員工）' : 'Visitor（訪客）';
  }

  function getEmployeeFlagLabel(ref) {
    return (ref && ref.employeeFlag) === 'Y' ? 'Y（是）' : 'N（否）';
  }

  function getEmployeeStatusLabel(ref) {
    const s = ref && ref.employeeStatus;
    if (!s) return '—';
    const map = { Active: 'Active（在職）', Resigned: 'Resigned（離職）' };
    return map[s] || s;
  }

  REFERRERS.forEach(ensureReferrerRoleFields);

  function fmt(n) {
    return n.toLocaleString();
  }

  function formatDateYmd(input) {
    const d = input ? new Date(input) : new Date();
    if (Number.isNaN(d.getTime())) {
      const m = String(input || '').match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
      if (m) return `${m[1]}/${String(m[2]).padStart(2, '0')}/${String(m[3]).padStart(2, '0')}`;
      return '—';
    }
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${mo}/${day}`;
  }

  function getNextUid() {
    const max = REFERRERS.reduce((acc, r) => {
      const n = Number(String(r.uid || '').replace(/^U/, ''));
      return Number.isFinite(n) ? Math.max(acc, n) : acc;
    }, 10000);
    return `U${String(max + 1).padStart(5, '0')}`;
  }

  function getPhoneOtpVerified(uid, fallback = false) {
    try {
      const map = JSON.parse(localStorage.getItem('mgm_phone_otp_verified_by_uid') || '{}');
      if (Object.prototype.hasOwnProperty.call(map, uid)) return !!map[uid];
    } catch {}
    return !!fallback;
  }

  function getIdLast4(r) {
    if (r.idLast4) return String(r.idLast4).slice(-4);
    if (r.idNo) return String(r.idNo).slice(-4);
    return '—';
  }

  function moveUidScopedStorageMap(key, oldUid, newUid) {
    try {
      const map = JSON.parse(localStorage.getItem(key) || '{}');
      if (!Object.prototype.hasOwnProperty.call(map, oldUid)) return;
      map[newUid] = map[oldUid];
      delete map[oldUid];
      localStorage.setItem(key, JSON.stringify(map));
    } catch {}
  }

  function pushFreezeLog(uid, note) {
    const time = new Date().toLocaleString('zh-TW');
    const trimmedNote = String(note || '').trim();
    const log = {
      time,
      ip: '系統',
      submitted: false,
      refereeUid: '—',
      isSystemEvent: true,
      resultText: trimmedNote
        ? `停用備註：${trimmedNote}`
        : '停用備註：無（非必填）',
    };
    (USAGE[uid] || (USAGE[uid] = [])).unshift(log);
  }

  function getPagedItems(items, page, pageSize = VIEW_PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    return {
      pageItems: items.slice(start, start + pageSize),
      safePage,
      totalPages,
    };
  }

  function renderInnerPager(kind, totalCount, page, pageSize = VIEW_PAGE_SIZE) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    if (totalPages <= 1) return '';
    return `
      <div class="view-inner-pager" data-pager-kind="${kind}">
        <button type="button" class="pg-btn" data-page-kind="${kind}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>«</button>
        <span class="view-inner-pager-meta">第 ${page} / ${totalPages} 頁</span>
        <button type="button" class="pg-btn" data-page-kind="${kind}" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>»</button>
      </div>`;
  }

  function bindInnerPager(uid) {
    document.querySelectorAll('[data-page-kind]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const kind = btn.dataset.pageKind;
        const page = Number(btn.dataset.page || '1');
        if (!kind || !Number.isFinite(page)) return;
        viewPagerState[kind] = page;
        if (kind === 'links') renderLinksTab(uid);
        if (kind === 'cases') renderCasesTab(uid);
      });
    });
  }

  function renderLinksTab(uid) {
    const links = SHARE_LINKS[uid] || [];
    const linksWrap = document.getElementById('view-links-list');
    if (!linksWrap) return;

    if (links.length === 0) {
      linksWrap.innerHTML = '<div class="view-empty">此推薦人尚無專屬推薦碼</div>';
      return;
    }

    const { pageItems, safePage } = getPagedItems(links, viewPagerState.links);
    viewPagerState.links = safePage;
    linksWrap.innerHTML = `
      ${pageItems.map(l => {
        const url = `https://yourwebsite.com/loan?ref=${l.code}`;
        return `
          <div class="view-link-row">
            <div class="view-link-main">
              <div class="view-link-code">${l.code}</div>
              <div class="view-link-url">${url}</div>
              <div class="view-link-meta">・ 點擊 ${l.clicks} ・ 成功送單 ${l.submits}</div>
            </div>
            <div class="view-link-aside">
              <span class="status-text status-${l.status === 'active' ? 'active' : 'frozen'}">${STATUS_LABEL[l.status] || l.status}</span>
              <button type="button" class="action-btn view-link-copy" data-url="${url}">複製連結</button>
            </div>
          </div>`;
      }).join('')}
      ${renderInnerPager('links', links.length, safePage)}
    `;

    linksWrap.querySelectorAll('.view-link-copy').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.dataset.url));
    });
  }

  function renderCasesTab(uid) {
    const cases = REFERRER_CASES[uid] || [];
    const sortedCases = [...cases].sort((a, b) => {
      const ta = new Date(a.submitAt || '').getTime();
      const tb = new Date(b.submitAt || '').getTime();
      return (Number.isFinite(tb) ? tb : 0) - (Number.isFinite(ta) ? ta : 0);
    });
    const casesWrap = document.getElementById('view-cases-list');
    if (!casesWrap) return;

    if (sortedCases.length === 0) {
      casesWrap.innerHTML = '<div class="view-empty">此推薦人尚無案件紀錄</div>';
      return;
    }

    const { pageItems, safePage } = getPagedItems(sortedCases, viewPagerState.cases);
    viewPagerState.cases = safePage;
    const REFEREE_TAG_CLS = { '新客戶': 'badge-blue', '既有客戶': 'badge-gray' };
    casesWrap.innerHTML = `
      <table class="view-cases-table">
        <thead><tr><th>案號</th><th>被推薦人手機號碼</th><th>被推薦人</th><th>身份</th><th>申請日期</th><th>申請進度</th></tr></thead>
        <tbody>
          ${pageItems.map(c => {
            const rtCls = REFEREE_TAG_CLS[c.refereeTag] || 'badge-gray';
            const rtBadge = c.refereeTag
              ? `<span class="tag-pill ${rtCls}" style="font-size:11px;">${c.refereeTag}</span>`
              : '—';
            return `
            <tr>
              <td class="mono">${c.caseId}</td>
              <td class="mono">${c.refereePhone || '—'}</td>
              <td>${c.refereeName}</td>
              <td>${rtBadge}</td>
              <td class="mono dim">${c.submitAt}</td>
              <td>${CASE_PROGRESS_LABEL[c.status] || '申請中'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      ${renderInnerPager('cases', sortedCases.length, safePage)}
    `;
  }

  function getFilteredReferrers() {
    const uidKeyword = filterState.uid.toLowerCase();
    const phoneKeyword = filterState.phone.toLowerCase();
    const nameKeyword = filterState.name.toLowerCase();

    return REFERRERS.filter((r) => {
      const tagLabel = getReferrerTag(r);
      if (uidKeyword && !r.uid.toLowerCase().includes(uidKeyword)) return false;
      if (phoneKeyword && !r.phone.toLowerCase().includes(phoneKeyword)) return false;
      if (nameKeyword && !r.name.toLowerCase().includes(nameKeyword)) return false;
      if (filterState.tag !== 'all' && tagLabel !== filterState.tag) return false;
      if (filterState.status !== 'all' && r.status !== filterState.status) return false;
      return true;
    });
  }

  function renderRow(r) {
    const tagLabel = getReferrerTag(r);
    const status = STATUS_META[r.status];
    const rowCls = r.status === 'frozen' ? 'frozen' : '';

    const actions =
      r.status === 'frozen'
        ? ``
        : `<button type="button" class="action-btn danger" data-action="freeze" data-uid="${r.uid}" data-name="${r.name}">停用</button>`;

    const statusClsKey = r.status === 'active' ? 'active' : r.status === 'frozen' ? 'frozen' : 'warning';
    return `
      <tr class="${rowCls}">
        <td>${tagLabel}</td>
        <td>${r.uid}</td>
        <td class="cell-name">${getCrmMemberName(r)}</td>
        <td class="cell-name">${r.name}</td>
        <td>${r.phone}</td>
        <td class="num money">$${fmt(r.pending)}</td>
        <td class="num money">$${fmt(r.withdrawn)}</td>
        <td><span class="status-text status-${statusClsKey}">${status.label}</span></td>
        <td>
          <button type="button" class="action-btn" data-action="view" data-uid="${r.uid}">檢視</button>
          <button type="button" class="action-btn note" data-action="note" data-uid="${r.uid}" data-name="${r.name}">備註</button>
          ${actions}
        </td>
      </tr>`;
  }

  // 從員工帳號管理頁同步離職狀態到推薦人
  function syncResignedFromEmployeePage() {
    try {
      const state = JSON.parse(localStorage.getItem('mgm_employees_state') || '{}');
      const resignedMap = {};
      Object.values(state).forEach(emp => {
        if (emp.status === 'resigned' && emp.referrerUid) {
          resignedMap[emp.referrerUid] = emp.resignedAt || null;
        }
      });
      REFERRERS.forEach(r => {
        if (Object.prototype.hasOwnProperty.call(resignedMap, r.uid)) {
          r.tag = '離職員工';
          if (resignedMap[r.uid]) r.retiredAt = resignedMap[r.uid];
          applyRoleFieldsByTag(r, '離職員工');
        }
      });
    } catch {}
  }

  // B5：與「黑名單管理」共用凍結狀態（單一資料來源於 localStorage.mgm_frozen_uids）
  function syncFrozenFromBlacklist() {
    try {
      const frozenSet = new Set(JSON.parse(localStorage.getItem('mgm_frozen_uids') || '[]'));
      REFERRERS.forEach((r) => {
        if (frozenSet.has(r.uid)) {
          if (r.status !== 'frozen') r.status = 'frozen';
        } else {
          // 若從黑名單解除，恢復為 active（warning 例外保留）
          if (r.status === 'frozen') r.status = 'active';
        }
      });
    } catch {}
  }

  function pushFrozenState(uid, frozen) {
    try {
      const arr = JSON.parse(localStorage.getItem('mgm_frozen_uids') || '[]');
      const set = new Set(arr);
      if (frozen) set.add(uid); else set.delete(uid);
      localStorage.setItem('mgm_frozen_uids', JSON.stringify([...set]));
    } catch {}
  }

  let quickSearchKeyword = '';

  function render() {
    syncResignedFromEmployeePage();
    syncFrozenFromBlacklist();
    const tbody = document.getElementById('referrers-tbody');
    let items = getFilteredReferrers();

    // Quick search (name / UID / phone)
    if (quickSearchKeyword) {
      const kw = quickSearchKeyword.toLowerCase();
      items = items.filter((r) =>
        r.name.toLowerCase().includes(kw) ||
        r.uid.toLowerCase().includes(kw) ||
        r.phone.includes(kw)
      );
    }

    tbody.innerHTML = items.length
      ? items.map(renderRow).join('')
      : '<tr><td colspan="11" style="padding:30px;text-align:center;color:var(--color-text-muted);">沒有符合條件的推薦人</td></tr>';

    const pg = document.getElementById('ref-pg-total');
    if (pg) pg.textContent = items.length;

    // Summary stats
    const totalPending   = items.reduce((s, r) => s + (r.pending   || 0), 0);
    const totalWithdrawn = items.reduce((s, r) => s + (r.withdrawn || 0), 0);
    const el = document.getElementById('ref-summary-bar');
    if (el) {
      el.innerHTML = `
        <span class="ref-sum-item"><span class="ref-sum-label">篩選結果</span><span class="ref-sum-val">${items.length} 人</span></span>
        <span class="ref-sum-sep">|</span>
        <span class="ref-sum-item"><span class="ref-sum-label">待提領合計</span><span class="ref-sum-val ref-sum-money">$${fmt(totalPending)}</span></span>
        <span class="ref-sum-sep">|</span>
        <span class="ref-sum-item"><span class="ref-sum-label">已提領合計</span><span class="ref-sum-val">$${fmt(totalWithdrawn)}</span></span>
      `;
    }

    bindRowActions();
  }

  function bindRowActions() {
    document.querySelectorAll('[data-action="view"]').forEach((b) =>
      b.addEventListener('click', () => openViewModal(b.dataset.uid))
    );
    document.querySelectorAll('[data-action="freeze"]').forEach((b) =>
      b.addEventListener('click', () => {
        const note = prompt(
          '停用備註（非必填）\n此備註會顯示於檢視紀錄，供內部追蹤使用。\n可留空後直接確定。',
          ''
        );
        if (note === null) return;

        if (!confirm(`確定要停用 ${b.dataset.name}？\n停用後該帳號之所有推薦連結將立即失效。`)) {
          return;
        }

        // B5：寫入共用凍結狀態
        pushFrozenState(b.dataset.uid, true);
        const r = REFERRERS.find(x => x.uid === b.dataset.uid);
        if (r) r.status = 'frozen';

        // 停用後於檢視紀錄新增系統紀錄（含備註與執行時間）
        pushFreezeLog(b.dataset.uid, note);

        render();
        toast('已將該帳號停用，已同步至洗單黑名單', 'var(--color-danger)');
      })
    );
    document.querySelectorAll('[data-action="note"]').forEach((b) =>
      b.addEventListener('click', () => openNote(b.dataset.uid, b.dataset.name))
    );
  }

  function bindFilters() {
    const sync = () => {
      filterState.uid = document.getElementById('f-uid').value.trim();
      filterState.phone = document.getElementById('f-phone').value.trim();
      filterState.name = document.getElementById('f-name').value.trim();
      filterState.tag = document.getElementById('f-tag').value;
      filterState.status = document.getElementById('f-status').value;
    };

    document.getElementById('btn-search').addEventListener('click', () => {
      sync();
      render();
    });

    ['f-tag', 'f-status'].forEach((id) => {
      document.getElementById(id).addEventListener('change', () => {
        sync();
        render();
      });
    });

    ['f-uid', 'f-phone', 'f-name'].forEach((id) => {
      document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        sync();
        render();
      });
    });
  }

  // 內部備註 Modal
  function openNote(uid, name) {
    document.getElementById('note-target').textContent = `${name}（${uid}）`;
    const list = document.getElementById('note-list');
    const notes = NOTES[uid] || [];
    if (notes.length === 0) {
      list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--color-text-muted);font-size:13px;">尚無內部備註，可在下方新增第一筆。</div>`;
    } else {
      list.innerHTML = notes
        .map(
          (n) => `
        <div class="note-item">
          <div class="note-item-meta">
            <span><i class="fa-regular fa-user"></i> ${n.user}</span>
            <span>${n.time}</span>
          </div>
          <div class="note-item-text">${n.text}</div>
        </div>`
        )
        .join('');
    }

    document.getElementById('note-modal').classList.add('show');
    document.getElementById('note-input').value = '';
    document.getElementById('note-input').focus();

    // 寫入備註
    document.getElementById('btn-note-save').onclick = () => {
      const txt = document.getElementById('note-input').value.trim();
      if (!txt) {
        alert('請輸入備註內容');
        return;
      }
      (NOTES[uid] || (NOTES[uid] = [])).unshift({
        time: new Date().toLocaleString('zh-TW'),
        user: 'Admin User',
        text: txt,
      });
      openNote(uid, name);
      render();
      toast('備註已新增');
    };
  }

  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;';
    t.innerHTML = `<i class="fa-solid fa-check"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }

  // ================ 檢視 Modal ================
  function openViewModal(uid) {
    const r = REFERRERS.find(x => x.uid === uid);
    if (!r) return;
    const tagLabel = getReferrerTag(r);

    viewPagerState.uid = uid;
    viewPagerState.links = 1;
    viewPagerState.cases = 1;

    document.getElementById('view-target').textContent = `${r.name}（${uid}）`;
    document.getElementById('view-uid').textContent = r.uid;
    document.getElementById('view-name').textContent = r.name;
    document.getElementById('view-tag').textContent = tagLabel;
    const retiredAtRow = document.getElementById('view-retired-at-row');
    if (retiredAtRow) retiredAtRow.hidden = !isResignedReferrer(r);
    document.getElementById('view-retired-at').textContent = isResignedReferrer(r) ? (formatDateYmd(r.retiredAt) || '—') : '—';
    document.getElementById('view-login-email').textContent = (isEmployeeReferrer(r) || isResignedReferrer(r))
      ? (r.loginEmail || '—')
      : '—';
    const otpDone = getPhoneOtpVerified(r.uid, r.phoneOtpVerified);
    document.getElementById('view-phone').textContent = `${r.phone}（OTP：${otpDone ? '已完成' : '未完成'}）`;
    const idLast4Row = document.getElementById('view-id-last4-row');
    const isMember = tagLabel === '會員';
    if (idLast4Row) idLast4Row.hidden = isMember;
    document.getElementById('view-id-last4').textContent = isMember ? '—' : getIdLast4(r);
    document.getElementById('view-clicks').textContent = r.clicks;
    document.getElementById('view-cases-stat').textContent = r.cases + ' 筆';
    document.getElementById('view-pending').textContent = '$' + fmt(r.pending);
    document.getElementById('view-withdrawn').textContent = '$' + fmt(r.withdrawn);
    const stMeta = STATUS_META[r.status];
    document.getElementById('view-status').textContent = stMeta ? stMeta.label : r.status;

    renderLinksTab(uid);
    renderCasesTab(uid);
    bindInnerPager(uid);

    // 切回基本資訊 tab
    activateVtab('info');

    document.getElementById('view-modal').classList.add('show');
  }

  function activateVtab(key) {
    document.querySelectorAll('.view-tab').forEach(t => t.classList.toggle('active', t.dataset.vtab === key));
    document.querySelectorAll('.view-pane').forEach(p => p.hidden = (p.dataset.vpane !== key));
  }

  function copyText(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => toast('已複製連結'));
    } else {
      prompt('請手動複製：', text);
    }
  }

  function bindViewModal() {
    document.getElementById('btn-view-close').addEventListener('click', () => {
      document.getElementById('view-modal').classList.remove('show');
    });
    document.querySelectorAll('.view-tab').forEach(t => {
      t.addEventListener('click', () => activateVtab(t.dataset.vtab));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bindFilters();
    // 篩選收合 / 清除
    (function () {
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
    render();
    bindViewModal();

    // Quick search in list header
    const qsInput = document.getElementById('ref-quick-search');
    if (qsInput) {
      qsInput.addEventListener('input', () => {
        quickSearchKeyword = qsInput.value.trim();
        render();
      });
    }

    document
      .getElementById('btn-note-close')
      .addEventListener('click', () =>
        document.getElementById('note-modal').classList.remove('show')
      );

    // 跨頁即時同步：黑名單凍結 + 員工離職狀態
    window.addEventListener('storage', (e) => {
      if (e.key === 'mgm_frozen_uids' || e.key === 'mgm_employees_state') render();
    });
  });
})();
