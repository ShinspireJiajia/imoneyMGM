/* ==========================================================
   records.js - 推廣紀錄（可提領生命週期）
   功能：Tab 篩選、卡片渲染、180 天期限提醒
   ========================================================== */

(function () {
  'use strict';

  // 推廣紀錄：從獎金共用資料源（MGMCommon.getRewardsDemo）派生，確保兩頁案例一致
  // 另附靜態補充條目：尚未進入獎金流程的審核中 / 失效 / 無效案件

  function _rewardStatusToRecordStatus(rewardStatus) {
    switch (rewardStatus) {
      case 'rewardable':     return 'rewardable';
      case 'transfer_failed':
      case 'transferring':
      case 'pending_pickup': return 'transferring';
      case 'transferred':
      case 'picked_up':      return 'withdrawn';
      case 'pending_review': return 'pending_review';
      default:               return 'reviewing';
    }
  }

  function _joinedAtFromId(id) {
    const m = String(id || '').match(/^M(\d{4})(\d{2})(\d{2})/);
    return m ? `${m[1]}/${m[2]}/${m[3]}` : '';
  }

  function buildRecords() {
    const rewards = (window.MGMCommon && window.MGMCommon.getRewardsDemo)
      ? window.MGMCommon.getRewardsDemo()
      : [];

    const fromRewards = rewards.map((r) => ({
      id: r.id,
      name: r.name,
      joinedAt: _joinedAtFromId(r.id),
      status: _rewardStatusToRecordStatus(r.status),
      rewardableAt: r.payoutAt || '',
      expectedPayoutAt: r.expectedPayoutAt || r.estimatedPayoutAt || '',
    }));

    // 尚未進入獎金流程（審核中）或已失效的補充案件
    const rewardIds = new Set(fromRewards.map((r) => r.id));
    const staticExtra = [
      { id: 'M2026060801', name: '林Ｏ安',  joinedAt: '2026/06/08', status: 'reviewing',     rewardableAt: null },
      { id: 'M2026060202', name: '彭Ｏ豪',  joinedAt: '2026/06/02', status: 'pending_review', rewardableAt: null },
      { id: 'M2025111105', name: '吳Ｏ盛',  joinedAt: '2025/11/11', status: 'expired',        rewardableAt: '2025/11/28', expiredSource: 'auto' },
      { id: 'M2026041506', name: '蔡Ｏ婷',  joinedAt: '2026/04/15', status: 'invalid',        rewardableAt: '2026/04/30', expiredSource: 'manual' },
    ].filter((r) => !rewardIds.has(r.id));

    return [...fromRewards, ...staticExtra];
  }

  const RECORDS = buildRecords();

  const STATUS_META = {
    reviewing: { bucket: 'hidden', label: '審核中', badge: 'badge-yellow' },
    confirmed: { bucket: 'hidden', label: '審核中', badge: 'badge-yellow' },
    pending_review: { bucket: 'hidden', label: '審核中', badge: 'badge-yellow' },
    rewardable: { bucket: 'rewardable', label: '可提領', badge: 'badge-green' },
    transferring: { bucket: 'rewardable', label: '撥款處理中', badge: 'badge-blue' },
    withdrawn: { bucket: 'archived', label: '已歸檔', badge: 'badge-gray' },
    expired: { bucket: 'expired', label: '已失效', badge: 'badge-danger' },
    invalid: { bucket: 'expired', label: '資格不符', badge: 'badge-gray' },
  };

  const FILTER_GROUPS = {
    all: () => true,
    rewardable: (r) => bucketOf(r.status) === 'rewardable',
    archived: (r) => bucketOf(r.status) === 'archived',
    expired: (r) => bucketOf(r.status) === 'expired',
  };

  const STATUS_SORT_PRIORITY = {
    rewardable: 0,
    transferring: 1,
    withdrawn: 2,
    expired: 3,
    invalid: 3,
  };

  function bucketOf(status) {
    const meta = STATUS_META[status];
    return meta && meta.bucket ? meta.bucket : 'hidden';
  }

  function toDate(value) {
    if (!value) return null;
    if (window.MGMCommon && typeof window.MGMCommon.toDate === 'function') {
      return window.MGMCommon.toDate(value);
    }
    const normalized = String(value).replace(/-/g, '/');
    const d = new Date(normalized);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  function toDayStart(dateObj) {
    if (!dateObj) return null;
    const d = new Date(dateObj);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getJoinDate(rec) {
    const raw = rec.joinedAt || rec.submitAt || '';
    return String(raw).split(' ')[0] || '—';
  }

  function getSortDate(rec) {
    return toDate(rec.joinedAt || rec.submitAt || rec.rewardableAt) || new Date(0);
  }

  function formatDateYmdSlash(value) {
    const d = toDate(value);
    if (!d) return String(value || '').replace(/-/g, '/');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}/${m}/${day}`;
  }

  function compareRecords(a, b) {
    const rankA = STATUS_SORT_PRIORITY[a.status] ?? 99;
    const rankB = STATUS_SORT_PRIORITY[b.status] ?? 99;
    if (rankA !== rankB) return rankA - rankB;

    const timeA = getSortDate(a).getTime();
    const timeB = getSortDate(b).getTime();
    if (timeA !== timeB) return timeB - timeA;

    return String(a.id || '').localeCompare(String(b.id || ''));
  }

  function getReminder(rec) {
    if (rec.status === 'withdrawn') {
      return {
        cls: 'reminder-done',
        text: '已完成提領歸檔',
        shortText: '已歸檔',
      };
    }

    if (rec.status === 'invalid') {
      return {
        cls: 'reminder-muted',
        text: '資格不符，不進入提領流程',
        shortText: '資格不符',
      };
    }

    const startDate = toDayStart(toDate(rec.rewardableAt || rec.joinedAt || rec.submitAt));
    if (!startDate) {
      return {
        cls: 'reminder-muted',
        text: '待系統同步期限',
        shortText: '待系統同步',
      };
    }

    const nowDay = toDayStart(new Date());
    const daysPassed = Math.max(0, Math.floor((nowDay.getTime() - startDate.getTime()) / 86400000));
    const daysLeft = 180 - daysPassed;

    if (rec.status === 'expired' || daysLeft <= 0) {
      const suffix = rec.expiredSource === 'manual' ? '（人工標記）' : '';
      return {
        cls: 'reminder-overdue',
        text: `已逾期未提領，視同放棄${suffix}`,
        shortText: '已失效',
      };
    }

    if (daysLeft <= 30) {
      return {
        cls: 'reminder-warning',
        text: `倒數 ${daysLeft} 天，若持續未提領將視同放棄`,
        shortText: `剩餘 ${daysLeft} 天失效`,
      };
    }

    return {
      cls: 'reminder-normal',
      text: `倒數 ${daysLeft} 天，若持續未提領將視同放棄`,
      shortText: `剩餘 ${daysLeft} 天失效`,
    };
  }

  function renderCard(rec) {
    const meta = STATUS_META[rec.status] || STATUS_META.reviewing;
    const reminder = getReminder(rec);
    const expectedPayoutDate = rec.status === 'transferring'
      ? formatDateYmdSlash(rec.expectedPayoutAt || rec.payoutAt)
      : '';
    const expectedPayoutLine = expectedPayoutDate
      ? `<div class="rc-subline" aria-label="預計撥款日">
           <i class="fa-regular fa-calendar-check"></i>
           <span>預計撥款日 ${expectedPayoutDate}</span>
         </div>`
      : '';

    return `
      <article class="record-card status-${rec.status}">
        <div class="record-summary">
          <div class="rc-col rc-col-left">
            <div class="rc-name-row">
              <div class="rc-name">
                <i class="fa-regular fa-user"></i>
                <span class="rc-name-text">${rec.name}</span>
              </div>
              <div class="rc-date-line" aria-label="加入理財通日期">
                <i class="fa-regular fa-calendar"></i>
                <span>${getJoinDate(rec)}</span>
              </div>
            </div>
            <div class="rc-status-row">
              <span class="badge ${meta.badge}">${meta.label}</span>
              <div class="rc-reminder ${reminder.cls}" role="note" aria-label="時間期限提醒：${reminder.text}">
                <i class="fa-regular fa-hourglass-half" aria-hidden="true"></i>
                <span class="rc-reminder-text">${reminder.shortText || reminder.text}</span>
              </div>
            </div>
            ${expectedPayoutLine}
          </div>
        </div>
      </article>`;
  }

  function getVisibleRecords() {
    return RECORDS.filter((r) => bucketOf(r.status) !== 'hidden');
  }

  function render(filter) {
    const list = document.getElementById('record-list');
    const records = getVisibleRecords();
    const predicate = FILTER_GROUPS[filter] || FILTER_GROUPS.all;
    const items = records.filter(predicate).sort(compareRecords);

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty">
          <i class="fa-regular fa-folder-open"></i>
          <div class="empty-text">此分類目前沒有紀錄</div>
          <div class="empty-text" style="font-size:12px;color:var(--color-text-muted);margin-top:4px;">剛申請且尚未人工放行的案件不會顯示於本頁</div>
        </div>`;
      return;
    }

    list.innerHTML = items.map(renderCard).join('');
  }

  function updateCounts() {
    const records = getVisibleRecords();
    const counts = {
      all: records.length,
      rewardable: records.filter(FILTER_GROUPS.rewardable).length,
      archived: records.filter(FILTER_GROUPS.archived).length,
      expired: records.filter(FILTER_GROUPS.expired).length,
    };

    document.querySelectorAll('.status-tab').forEach((tab) => {
      const key = tab.dataset.filter;
      const counter = tab.querySelector('.count');
      if (counter) counter.textContent = counts[key] || 0;
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateCounts();
    render('all');

    document.querySelectorAll('.status-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.status-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        render(tab.dataset.filter);
      });
    });
  });
})();
