/* ==========================================================
   admin-matrix.js - 活動詳情頁
   Tabs: 基本資訊 / 獎金級距 / 活動文案 / 變更歷程
   入口：admin-campaigns 列表的「編輯」按鈕
   ========================================================== */

(function () {
  'use strict';

  // ---------- 從 sessionStorage 取得目前編輯中的活動 ----------
  function getCurrentCampaign() {
    try {
      return JSON.parse(sessionStorage.getItem('edit_campaign') || 'null');
    } catch {
      return null;
    }
  }

  let CURRENT = getCurrentCampaign();

  // Preview mode (?preview=1)：用於簡報 iframe 嵌入，略過 session 要求
  if (!CURRENT && new URLSearchParams(location.search).get('preview') === '1') {
    CURRENT = {
      id: 'CAMP-C-2026Q2',
      name: '2026 Q2 會員初夏推薦大賞',
      status: 'active',
      start: '2026-04-01',
      end: '2026-06-30',
      plan: 'member',
    };
  }

  // 沒帶活動資訊 → 跳回列表
  if (!CURRENT) {
    if (window.parent && window.parent.AdminRouter) {
      window.parent.AdminRouter.go('admin-campaigns');
    }
    // demo 防呆：若獨立開啟，直接顯示提示
    document.addEventListener('DOMContentLoaded', () => {
      document.body.innerHTML = '<div style="padding:60px;text-align:center;color:#252629;">請從「活動檔期管理」清單選擇一檔活動進入。</div>';
    });
    return;
  }

  // ---------- 預設文案（沿用前次設定） ----------
  const DEFAULT_CONTENT = {
    'CAMP-C-2026Q2': '<h2>2026 初夏推薦大賞</h2><p>把財通的好，告訴身邊有資金需求的家人朋友。每一份分享，都是<strong>支持與信任</strong>。</p><p>本檔期推薦最高可獲 <strong style="color:#7c3aed;">NT$ 15,000</strong> 獎金回饋。</p><ul><li>房屋貸款 — 最高 $15,000</li><li>汽車貸款 — 最高 $5,000</li><li>信用貸款 — 固定 $500</li></ul>',
    'CAMP-C-2026Q3': '<h2>2026 秋季推薦衝刺</h2><p>把握下一檔活動，提早讓親友認識財通。秋季檔期將於 7/1 開跑。</p>',
    'CAMP-C-2026Q1': '<h2>2026 新春推薦贏家（已結束）</h2><p>感謝大家的熱情參與，本檔期已結束發放。請期待下一檔活動。</p>',
    'CAMP-E-2026Q2': '<h2>2026 Q2 員工推薦獎勵</h2><p>同仁專屬：每成功推薦一筆貸款撥款，依方案發放分潤。歡迎踴躍分享給有需求的親友。</p>',
    'CAMP-E-2026Q3': '<h2>2026 Q3 員工衝刺加碼</h2><p>7/1 起加碼開跑，敬請期待。</p>',
    'CAMP-E-2026Q1': '<h2>2026 Q1 員工新春活動（已結束）</h2><p>感謝同仁配合，本檔期已結束發放。</p>',
  };

  function loadContent(id) {
    try {
      const s = localStorage.getItem('mgm_campaign_content_' + id);
      if (s !== null) return s;
    } catch {}
    return DEFAULT_CONTENT[id] || '';
  }

  function saveContent(id, html) {
    try {
      localStorage.setItem('mgm_campaign_content_' + id, html);
      return true;
    } catch (e) {
      alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
      return false;
    }
  }

  // ---------- Demo 變更歷程資料 ----------
  // type: info | matrix | content | snapshot
  const DEMO_HISTORY = {
    'CAMP-C-2026Q2': [
      { time: '2026/05/25 09:42', type: 'matrix', actor: 'Admin User', title: '修改獎金金額', desc: '債務協商觸發條件更新為「需繳滿第三期服務費（第一期 ≥ $6,000 起算）」' },
      { time: '2026/05/20 14:15', type: 'content', actor: '行銷 - Mary', title: '更新活動文案', desc: '加入推薦獎金範圍（$1,500 ～ $5,000）醒目標語，並補上免責聲明連結' },
      { time: '2026/05/15 11:05', type: 'snapshot', actor: '系統', title: '案件快照寫入', desc: '案 M2026051504（張Ｏ豪）送單時擷取本檔不動產貸款參數：獎金 $5,000 / 觸發：付訖服務費' },
      { time: '2026/05/12 16:30', type: 'snapshot', actor: '系統', title: '案件快照寫入', desc: '案 M2026051205（吳Ｏ芳）送單時擷取本檔汽機車小額融資參數：獎金 $1,500 / 觸發：付訖服務費' },
      { time: '2026/05/08 10:18', type: 'matrix', actor: 'Admin User', title: '啟用銀行信貸／企貸方案', desc: '本檔新增「銀行信貸／企貸」並啟用：獎金 $3,600 / 觸發：付訖服務費' },
      { time: '2026/04/15 14:00', type: 'info', actor: 'Admin User', title: '調整活動結束日', desc: '原 2026/06/15 延長至 2026/06/30（行銷需求）' },
      { time: '2026/04/01 00:00', type: 'info', actor: 'Admin User', title: '活動建立', desc: '建立會員方案 Q2 檔期，期間 2026/04/01 ~ 2026/06/30' },
    ],
    'CAMP-E-2026Q2': [
      { time: '2026/05/22 16:10', type: 'matrix', actor: 'Admin User', title: '調整員工獎金', desc: '銀行信貸／企貸獎金金額：$3,200 → $3,600' },
      { time: '2026/05/10 09:30', type: 'content', actor: '行銷 - John', title: '更新內部文案', desc: '加入員工 Q&A 連結' },
      { time: '2026/04/01 00:00', type: 'info', actor: 'Admin User', title: '活動建立', desc: '建立員工方案 Q2 檔期' },
    ],
  };

  const RUNTIME_HISTORY = {};

  function formatNow() {
    return new Date().toLocaleString('zh-TW', { hour12: false }).replace(',', '');
  }

  function appendHistory(type, title, desc, actor = 'Admin User') {
    const id = CURRENT && CURRENT.id ? CURRENT.id : 'default';
    if (!RUNTIME_HISTORY[id]) RUNTIME_HISTORY[id] = [];
    RUNTIME_HISTORY[id].unshift({ time: formatNow(), type, actor, title, desc });
    renderAllHistorySections();
  }

  // ---------- 同期間單一進行中規則 ----------
  function toDate(s) {
    return new Date(String(s).replace(/\//g, '-').replace(' ', 'T'));
  }
  function isTimeOverlap(a, b) {
    const aS = toDate(a.start), aE = toDate(a.end);
    const bS = toDate(b.start), bE = toDate(b.end);
    if (isNaN(aS) || isNaN(aE) || isNaN(bS) || isNaN(bE)) return false;
    return aS <= bE && bS <= aE;
  }
  function checkActiveConflict(candidate) {
    try {
      const snap = JSON.parse(sessionStorage.getItem('mgm_active_campaigns') || '{}');
      const list = snap.all || [];
      return list.find(c => c.id !== candidate.id && isTimeOverlap(candidate, c));
    } catch {
      return null;
    }
  }

  function getHistory(id) {
    const runtime = RUNTIME_HISTORY[id] || [];
    const base = DEMO_HISTORY[id] || [
      { time: new Date().toLocaleString('zh-TW').replace(/\//g, '/'), type: 'info', actor: 'Admin User', title: '活動建立', desc: '此為複製建立或新增之活動，尚無其他歷程紀錄。' },
    ];
    return runtime.concat(base);
  }

  // ---------- 標題卡填值 ----------
  function fillCampaignHead() {
    const c = CURRENT;
    document.getElementById('cd-name').textContent = c.name || '未命名活動';
    document.getElementById('cd-id').textContent = c.id || '';

    const statusEl = document.getElementById('cd-status');
    const statusLabels = { active: '進行中', upcoming: '未開始', ended: '已結束' };
    statusEl.textContent = statusLabels[c.status] || '—';
    statusEl.classList.add('s-' + (c.status || 'upcoming'));

    // period
    const periodEl = document.getElementById('cd-period');
    const start = (c.start || '').slice(0, 10);
    const end = (c.end || '').slice(0, 10);
    periodEl.textContent = start && end ? `${start} ～ ${end}` : '—';

    // 剩餘天數
    const remainEl = document.getElementById('cd-remain');
    if (c.status === 'active' && end) {
      const days = Math.max(0, Math.floor((new Date(end) - new Date()) / (1000 * 60 * 60 * 24)));
      remainEl.textContent = `剩 ${days} 天`;
    } else {
      remainEl.textContent = '';
      remainEl.style.display = 'none';
    }
  }

  // ---------- Tab 切換 ----------
  function bindTabs() {
    document.querySelectorAll('.cd-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.dataset.tab;
        document.querySelectorAll('.cd-tab').forEach((t) => t.classList.toggle('active', t === tab));
        document.querySelectorAll('.cd-pane').forEach((p) => {
          if (p.dataset.pane === key) p.removeAttribute('hidden');
          else p.setAttribute('hidden', '');
        });
        if (key === 'content') ensureContentLoaded();
      });
    });
  }

  // ---------- PANE 1: 基本資訊 ----------
  function fillInfoForm() {
    const c = CURRENT;
    document.getElementById('info-name').value = c.name || '';
    document.getElementById('info-id').value = c.id || '';
    document.getElementById('info-start').value = (c.start || '').slice(0, 10).replace(/\//g, '-');
    document.getElementById('info-end').value = (c.end || '').slice(0, 10).replace(/\//g, '-');
    document.getElementById('info-status').value = c.status || 'upcoming';
  }

  function bindInfoSave() {
    document.getElementById('btn-info-save').addEventListener('click', () => {
      const nextName = document.getElementById('info-name').value.trim() || CURRENT.name;
      const nextStart = document.getElementById('info-start').value.replace(/-/g, '/') + ' 00:00';
      const nextEnd = document.getElementById('info-end').value.replace(/-/g, '/') + ' 23:59';
      const nextStatus = document.getElementById('info-status').value;
      const nextNote = '';
      // 同期間單一規則：若狀態改為 active，檢查是否與其他 active 重疊
      if (nextStatus === 'active') {
        const conflict = checkActiveConflict({ id: CURRENT.id, start: nextStart, end: nextEnd });
        if (conflict) {
          alert(
            `無法切換為「進行中」：\n\n` +
            `本活動時間（${nextStart.slice(0,10)} ～ ${nextEnd.slice(0,10)}）\n` +
            `與既有進行中之活動「${conflict.name}」\n` +
            `（${conflict.start.slice(0,10)} ～ ${conflict.end.slice(0,10)}）重疊。\n\n` +
            `每個方案同期間僅允許一筆進行中活動，請先調整時間或結束既有活動。`
          );
          return;
        }
      }

      CURRENT.name = nextName;
      CURRENT.start = nextStart;
      CURRENT.end = nextEnd;
      CURRENT.status = nextStatus;
      CURRENT.note = nextNote;

      // 寫回 sessionStorage 與標題卡
      sessionStorage.setItem('edit_campaign', JSON.stringify(CURRENT));
      // 重置 status badge class
      const statusEl = document.getElementById('cd-status');
      statusEl.className = 'badge';
      statusEl.id = 'cd-status';
      fillCampaignHead();

      appendHistory('info', '儲存基本資訊', `已更新活動「${CURRENT.name || '未命名活動'}」的基本設定。`);
      toast('已儲存基本資訊。', 'matrix');
    });
  }

  // ---------- PANE 2: 獎金級距 ----------
  const TRIGGER_OPTIONS = [
    '付訖服務費',
    '需繳滿第三期服務費（第一期 ≥ $6,000 起算）',
  ];

  const PROJECT_OPTIONS = [
    // 審核單請項目類型
    { key: 'century_mobile',  label: '21世紀手機貸', category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    { key: 'asia_micro',      label: '亞太小額融資', category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    { key: 'credit_loan',     label: '信用貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 3600 },
    { key: 'motor_loan',      label: '機車貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    { key: 'car_loan',        label: '汽車貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    { key: 'house_loan',      label: '房屋貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 5000 },
    { key: 'house_2nd',       label: '房屋二胎',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 5000 },
    { key: 'taili_real',      label: '台理不動產',   category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 5000 },
    { key: 'taili_add',       label: '台理增貸',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 3600 },
    { key: 'biz_loan',        label: '企業貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 3600 },
    { key: 'land_loan',       label: '土地貸款',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 5000 },
    { key: 'anything_loan',   label: '萬物貸',       category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    { key: 'notary_loan',     label: '代書信貸',     category: 'general',     defaultTrigger: '付訖服務費',                                  defaultBonus: 1500 },
    // 協商單請項目類型
    { key: 'pre_negotiation', label: '前置協商',     category: 'negotiation', defaultTrigger: '需繳滿第三期服務費（第一期 ≥ $6,000 起算）', defaultBonus: 2000 },
    { key: 'individual_nego', label: '個別協商',     category: 'negotiation', defaultTrigger: '需繳滿第三期服務費（第一期 ≥ $6,000 起算）', defaultBonus: 0 },
    { key: 'rehabilitation',  label: '更生方案',     category: 'negotiation', defaultTrigger: '需繳滿第三期服務費（第一期 ≥ $6,000 起算）', defaultBonus: 2000 },
  ];

  const PROJECT_KEY_BY_LABEL = Object.fromEntries(PROJECT_OPTIONS.map((p) => [p.label, p.key]));

  function matrixStorageKey() {
    return `mgm_campaign_matrix_rules_${CURRENT.id || 'default'}`;
  }

  function getProjectLabel(key) {
    const found = PROJECT_OPTIONS.find((p) => p.key === key);
    return found ? found.label : key;
  }

  function getRowProjectKey(row) {
    const select = row.querySelector('.project-select');
    if (select) return select.value;
    if (row.dataset.projectKey) return row.dataset.projectKey;
    const label = ((row.querySelector('td:first-child strong') || {}).textContent || '').trim();
    return PROJECT_KEY_BY_LABEL[label] || '';
  }

  function getRowProjectLabel(row) {
    const key = getRowProjectKey(row);
    if (key) return getProjectLabel(key);
    return ((row.querySelector('td:first-child') || {}).textContent || '').trim();
  }

  // 列層級的「檢視 / 編輯」切換：預設檢視（disabled），按下「編輯」才可調整
  function setRowMode(row, mode) {
    row.dataset.rowMode = mode;
    const editing = mode === 'edit';
    row.querySelectorAll('.inline-input, .project-select, .status-label input[type="checkbox"]').forEach((el) => {
      el.disabled = !editing;
    });
    row.querySelectorAll('[data-row-action]').forEach((btn) => {
      const act = btn.dataset.rowAction;
      if (act === 'edit')   btn.hidden = editing;
      if (act === 'save')   btn.hidden = !editing;
      if (act === 'cancel') btn.hidden = !editing;
      // remove（移除）按鈕只在檢視模式顯示，避免編輯中誤刪
      if (act === 'remove') btn.hidden = editing;
    });
  }

  function snapshotRow(row) {
    const snap = [];
    row.querySelectorAll('.inline-input').forEach((el) => snap.push({ el, val: el.value }));
    row.querySelectorAll('.project-select').forEach((el) => snap.push({ el, val: el.value }));
    row.querySelectorAll('.status-label input[type="checkbox"]').forEach((el) => snap.push({ el, val: el.checked, isCheck: true }));
    return snap;
  }
  function restoreRow(snap) {
    snap.forEach((s) => { if (s.isCheck) s.el.checked = s.val; else s.el.value = s.val; });
  }

  function buildProjectOptionsHtml(selectedKey) {
    const groups = [
      { cat: 'general',     label: '審核單請項目類型' },
      { cat: 'negotiation', label: '協商單請項目類型' },
    ];
    return groups.map(({ cat, label }) => {
      const items = PROJECT_OPTIONS.filter((p) => p.category === cat);
      const opts = items.map((p) => `<option value="${p.key}"${p.key === selectedKey ? ' selected' : ''}>${p.label}</option>`).join('');
      return `<optgroup label="${label}">${opts}</optgroup>`;
    }).join('');
  }

  function createProjectRow(rule = {}) {
    const tr = document.createElement('tr');
    const key = rule.projectKey || '';
    tr.dataset.rowMode = 'view';
    if (key) tr.dataset.projectKey = key;

    const opt = PROJECT_OPTIONS.find((p) => p.key === key);
    const defaultTrigger = opt ? opt.defaultTrigger : '';
    const defaultBonus   = opt ? opt.defaultBonus  : 0;

    tr.innerHTML = `
      <td>
        <select class="field-select project-select" disabled>
          <option value="">請選擇方案</option>
          ${buildProjectOptionsHtml(key)}
        </select>
      </td>
      <td><span class="cell-input"><span class="inline-prefix">$</span><input class="inline-input bonus-input" type="number" value="${rule.bonus != null ? rule.bonus : defaultBonus}" disabled /></span></td>
      <td class="status-label"><label class="switch"><input type="checkbox" ${rule.enabled !== false ? 'checked' : ''} disabled /><span class="switch-slider"></span></label></td>
      <td class="row-actions">
        <button type="button" class="row-action-btn" data-row-action="edit"><i class="fa-solid fa-pen"></i>編輯</button>
        <button type="button" class="row-action-btn primary" data-row-action="save" hidden><i class="fa-solid fa-check"></i>儲存</button>
        <button type="button" class="row-action-btn" data-row-action="cancel" hidden>取消</button>
        <button type="button" class="row-action-btn danger" data-row-action="remove">移除</button>
      </td>
    `;
    return tr;
  }

  function getAlreadyUsedKeys(excludeRow) {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return new Set();
    return new Set(
      Array.from(tbody.querySelectorAll('tr[data-project-key]'))
        .filter((r) => r !== excludeRow)
        .map((r) => r.dataset.projectKey)
        .filter(Boolean)
    );
  }

  function createNewProjectRow(usedKeys) {
    const tr = document.createElement('tr');
    tr.dataset.rowMode = 'view';
    tr.dataset.isNew = '1';

    tr.innerHTML = `
      <td>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <select class="field-select category-select" style="font-size:12px;padding:5px 8px;">
            <option value="">請選擇類型</option>
            <option value="general">一般（審核單請）</option>
            <option value="negotiation">協商（協商單請）</option>
          </select>
          <select class="field-select project-select" disabled style="font-size:12px;padding:5px 8px;">
            <option value="">請先選擇類型</option>
          </select>
        </div>
      </td>
      <td><span class="cell-input"><span class="inline-prefix">$</span><input class="inline-input bonus-input" type="number" value="0" disabled /></span></td>
      <td class="status-label"><label class="switch"><input type="checkbox" checked disabled /><span class="switch-slider"></span></label></td>
      <td class="row-actions">
        <button type="button" class="row-action-btn primary" data-row-action="save" hidden><i class="fa-solid fa-check"></i>儲存</button>
        <button type="button" class="row-action-btn" data-row-action="cancel" hidden>取消</button>
        <button type="button" class="row-action-btn" data-row-action="edit"><i class="fa-solid fa-pen"></i>編輯</button>
        <button type="button" class="row-action-btn danger" data-row-action="remove">移除</button>
      </td>
    `;

    const catSel  = tr.querySelector('.category-select');
    const projSel = tr.querySelector('.project-select');
    catSel.addEventListener('change', () => {
      const cat = catSel.value;
      projSel.innerHTML = '';
      if (!cat) {
        projSel.disabled = true;
        projSel.innerHTML = '<option value="">請先選擇類型</option>';
        return;
      }
      const currentUsed = getAlreadyUsedKeys(tr);
      const available = PROJECT_OPTIONS.filter((p) => p.category === cat && !currentUsed.has(p.key));
      if (available.length === 0) {
        projSel.innerHTML = '<option value="">此類型所有方案均已設定</option>';
        projSel.disabled = true;
        return;
      }
      projSel.disabled = false;
      projSel.innerHTML = '<option value="">請選擇方案</option>' + available.map((p) => `<option value="${p.key}">${p.label}</option>`).join('');
    });

    projSel.addEventListener('change', () => {
      const key = projSel.value;
      const opt = PROJECT_OPTIONS.find((p) => p.key === key);
      if (!opt) return;
      const bonusEl = tr.querySelector('.bonus-input');
      if (bonusEl) bonusEl.value = opt.defaultBonus;
    });

    return tr;
  }

  function bindAddProject() {
    const btn = document.getElementById('btn-add-project');
    const tbody = document.getElementById('matrix-tbody');
    if (!btn || !tbody) return;
    btn.addEventListener('click', () => {
      const usedKeys = getAlreadyUsedKeys();
      const available = PROJECT_OPTIONS.filter((p) => !usedKeys.has(p.key));
      if (available.length === 0) {
        alert('所有可用專案均已設定完畢，如需調整請直接點擊「編輯」修改現有項目。');
        return;
      }
      const row = createNewProjectRow(usedKeys);
      tbody.appendChild(row);
      setRowMode(row, 'edit');
      const catSel = row.querySelector('.category-select');
      if (catSel) { catSel.disabled = false; catSel.focus(); }
    });
  }

  function bindRowToggle() {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return;
    const snapshots = new WeakMap();

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-row-action]');
      if (!btn) return;
      const row = btn.closest('tr');
      if (!row) return;
      const action = btn.dataset.rowAction;

      if (action === 'edit') {
        snapshots.set(row, snapshotRow(row));
        setRowMode(row, 'edit');
        const firstInput = row.querySelector('.project-select:not(:disabled), .inline-input:not(:disabled)') || row.querySelector('.project-select, .inline-input');
        if (firstInput) { firstInput.disabled = false; firstInput.focus(); firstInput.select && firstInput.select(); }
      } else if (action === 'save') {
        const projectKey = getRowProjectKey(row);
        if (!projectKey) {
          alert('請先選擇貸款專案。');
          return;
        }
        const duplicated = Array.from(tbody.querySelectorAll('tr')).some((x) => x !== row && getRowProjectKey(x) === projectKey);
        if (duplicated) {
          alert(`「${getProjectLabel(projectKey)}」已存在，請勿重複建立。`);
          return;
        }
        row.dataset.projectKey = projectKey;
        // 若為新增行，將 category+project selects 替換為純文字顯示
        if (row.dataset.isNew === '1') {
          const label = getProjectLabel(projectKey);
          const firstTd = row.querySelector('td:first-child');
          if (firstTd) firstTd.innerHTML = `<strong>${label}</strong>`;
          delete row.dataset.isNew;
        }
        setRowMode(row, 'view');
        snapshots.delete(row);
        const name = getRowProjectLabel(row) || '此筆級距';
        toast(`已儲存「${name.trim()}」之級距設定。`);
      } else if (action === 'cancel') {
        const snap = snapshots.get(row);
        if (snap) restoreRow(snap);
        if (!getRowProjectKey(row) && row.querySelector('.project-select')) {
          row.remove();
          snapshots.delete(row);
          return;
        }
        setRowMode(row, 'view');
        snapshots.delete(row);
      } else if (action === 'remove') {
        const name = getRowProjectLabel(row) || '此筆';
        if (!confirm(`確定要移除「${name.trim()}」級距？\n此操作無法復原（僅影響後續送單，已產生快照之歷史紀錄不受影響）。`)) return;
        row.remove();
        toast('已移除級距。');
      }
    });
  }

  function collectOverlapCap() {
    const capEl = document.getElementById('overlap-cap-input');
    const enabledEl = document.getElementById('overlap-cap-enabled');
    return {
      overlapCap: Number(capEl ? capEl.value : 0) || 0,
      overlapCapEnabled: !!(enabledEl && enabledEl.checked),
    };
  }

  function collectProjectRules() {
    const tbody = document.getElementById('matrix-tbody');
    if (!tbody) return [];
    return Array.from(tbody.querySelectorAll('tr')).map((row) => {
      const bonusEl   = row.querySelector('.bonus-input');
      const enabledEl = row.querySelector('.status-label input[type="checkbox"]');
      const projectKey = getRowProjectKey(row);
      return {
        projectKey,
        label:   getProjectLabel(projectKey),
        bonus:   Number(bonusEl ? bonusEl.value : 0) || 0,
        enabled: !!(enabledEl && enabledEl.checked),
      };
    }).filter((r) => !!r.projectKey);
  }

  function readStoredMatrixRules() {
    const raw = localStorage.getItem(matrixStorageKey());
    if (!raw) return { projectRules: [], overlapCap: 20000, overlapCapEnabled: true };
    try {
      const data = JSON.parse(raw);
      return {
        projectRules: Array.isArray(data.projectRules) ? data.projectRules : [],
        overlapCap: data.overlapCap != null ? data.overlapCap : 20000,
        overlapCapEnabled: data.overlapCapEnabled !== false,
      };
    } catch {
      return { projectRules: [], overlapCap: 20000, overlapCapEnabled: true };
    }
  }

  function formatProjectRule(rule) {
    return `${getProjectLabel(rule.projectKey)}：獎金 $${Number(rule.bonus || 0).toLocaleString()} / ${rule.enabled ? '啟用' : '停用'}`;
  }

  function diffProjectRule(prev, next) {
    const changes = [];
    if (Number(prev.bonus || 0) !== Number(next.bonus || 0)) {
      changes.push(`獎金 $${Number(prev.bonus || 0).toLocaleString()} → $${Number(next.bonus || 0).toLocaleString()}`);
    }
    if (!!prev.enabled !== !!next.enabled) {
      changes.push(`狀態 ${prev.enabled ? '啟用' : '停用'} → ${next.enabled ? '啟用' : '停用'}`);
    }
    return changes;
  }

  function buildMatrixChangeSummary(previous, next) {
    const lines = [];
    const prevProjectMap = new Map((previous.projectRules || []).map((r) => [r.projectKey, r]));
    const nextProjectMap = new Map((next.projectRules || []).map((r) => [r.projectKey, r]));

    const projectAdded = [];
    const projectUpdated = [];
    const projectRemoved = [];

    nextProjectMap.forEach((rule, key) => {
      const oldRule = prevProjectMap.get(key);
      if (!oldRule) {
        projectAdded.push(`- 新增專案：${formatProjectRule(rule)}`);
        return;
      }
      const changes = diffProjectRule(oldRule, rule);
      if (changes.length) {
        projectUpdated.push(`- 調整專案：${getProjectLabel(rule.projectKey)}（${changes.join('；')}）`);
      }
    });

    prevProjectMap.forEach((rule, key) => {
      if (!nextProjectMap.has(key)) {
        projectRemoved.push(`- 移除專案：${formatProjectRule(rule)}`);
      }
    });

    const overlapChanges = [];
    if (Number(previous.overlapCap || 0) !== Number(next.overlapCap || 0)) {
      overlapChanges.push(`- 重疊上限金額：$${Number(previous.overlapCap || 0).toLocaleString()} → $${Number(next.overlapCap || 0).toLocaleString()}`);
    }
    if (!!previous.overlapCapEnabled !== !!next.overlapCapEnabled) {
      overlapChanges.push(`- 重疊上限狀態：${previous.overlapCapEnabled ? '啟用' : '停用'} → ${next.overlapCapEnabled ? '啟用' : '停用'}`);
    }

    lines.push(`專案 ${next.projectRules.length} 筆`);
    lines.push(...projectAdded, ...projectUpdated, ...projectRemoved, ...overlapChanges);

    if (lines.length === 1) {
      lines.push('- 本次未偵測到欄位差異（可能僅重新儲存）');
    }

    return lines.join('\n');
  }

  function persistMatrixRules() {
    const { overlapCap, overlapCapEnabled } = collectOverlapCap();
    const payload = {
      projectRules: collectProjectRules(),
      overlapCap,
      overlapCapEnabled,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(matrixStorageKey(), JSON.stringify(payload));
    return payload;
  }

  function applyProjectRuleToRow(row, rule) {
    const bonusEl   = row.querySelector('.bonus-input');
    const enabledEl = row.querySelector('.status-label input[type="checkbox"]');
    if (bonusEl)   bonusEl.value   = rule.bonus   != null ? rule.bonus   : 0;
    if (enabledEl) enabledEl.checked = rule.enabled !== false;
    const select = row.querySelector('.project-select');
    if (select) select.value = rule.projectKey || '';
    row.dataset.projectKey = rule.projectKey || row.dataset.projectKey || '';
    setRowMode(row, 'view');
  }

  function loadMatrixRules() {
    const raw = localStorage.getItem(matrixStorageKey());
    if (!raw) return;
    let data = null;
    try { data = JSON.parse(raw); } catch { data = null; }
    if (!data) return;

    const matrixBody = document.getElementById('matrix-tbody');
    if (!matrixBody) return;

    const rowByKey = new Map(Array.from(matrixBody.querySelectorAll('tr')).map((row) => [getRowProjectKey(row), row]));
    (data.projectRules || []).forEach((rule) => {
      if (!rule.projectKey) return;
      const existing = rowByKey.get(rule.projectKey);
      if (existing) {
        applyProjectRuleToRow(existing, rule);
      } else {
        const newRow = createProjectRow(rule);
        matrixBody.appendChild(newRow);
        applyProjectRuleToRow(newRow, rule);
      }
    });

    const capEl = document.getElementById('overlap-cap-input');
    const enabledEl = document.getElementById('overlap-cap-enabled');
    if (capEl && data.overlapCap != null) capEl.value = data.overlapCap;
    if (enabledEl && data.overlapCapEnabled != null) enabledEl.checked = data.overlapCapEnabled;
  }

  function bindMatrixSave() {
    document.getElementById('btn-save-matrix').addEventListener('click', () => {
      const previous = readStoredMatrixRules();
      const payload = persistMatrixRules();
      const detail = buildMatrixChangeSummary(previous, payload);
      appendHistory('matrix', '儲存獎金級距', detail);
      toast(`已儲存獎金級距設定（專案 ${payload.projectRules.length} 筆）。`);
    });

    // 即時試算（固定獎金制：選擇方案即顯示對應金額）
    const calcPlan   = document.getElementById('calc-plan');
    const calcResult = document.getElementById('calc-result');
    const updateCalc = () => {
      const bonus = parseInt(calcPlan ? calcPlan.value : 0, 10) || 0;
      if (calcResult) calcResult.textContent = '$' + bonus.toLocaleString();
    };
    if (calcPlan) calcPlan.addEventListener('change', updateCalc);
    updateCalc();
  }

  // ---------- PANE 3: 活動文案（RTE） ----------
  let contentLoaded = false;
  let editorMode = 'visual';

  function ensureContentLoaded() {
    if (contentLoaded) return;
    contentLoaded = true;
    const html = loadContent(CURRENT.id);
    document.getElementById('ce-editor').innerHTML = html;
    document.getElementById('ce-source').value = html;
  }

  function setMode(mode) {
    editorMode = mode;
    const editor = document.getElementById('ce-editor');
    const source = document.getElementById('ce-source');
    const toolbar = document.getElementById('ce-toolbar');
    const btn = document.getElementById('ce-toggle-source');
    if (mode === 'source') {
      source.value = editor.innerHTML;
      editor.hidden = true; source.hidden = false;
      toolbar.classList.add('disabled');
      btn.innerHTML = '<i class="fa-solid fa-eye"></i>所見即所得';
    } else {
      editor.innerHTML = source.value || editor.innerHTML;
      editor.hidden = false; source.hidden = true;
      toolbar.classList.remove('disabled');
      btn.innerHTML = '<i class="fa-solid fa-code"></i>HTML 原始碼';
    }
  }

  function exec(cmd, value) {
    if (editorMode === 'source') return;
    document.getElementById('ce-editor').focus();
    document.execCommand(cmd, false, value || null);
  }

  function bindEditor() {
    if (!document.getElementById('ce-img-input')) return;
    document.querySelectorAll('#ce-toolbar [data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.value || null;
        if (cmd === 'createLink') {
          const url = prompt('請輸入連結網址：', 'https://');
          if (url) exec(cmd, url);
        } else if (cmd === 'insertHTML' && btn.dataset.value === 'hr') {
          exec('insertHTML', '<hr/>');
        } else {
          exec(cmd, val);
        }
      });
    });

    document.getElementById('ce-img-input').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('請選擇圖片檔'); return; }
      if (file.size > 1024 * 1024 * 2) {
        if (!confirm('圖片大於 2MB，可能會超過儲存上限，仍要繼續嗎？')) return;
      }
      const r = new FileReader();
      r.onload = (ev) => exec('insertHTML', `<img src="${ev.target.result}" alt="" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0;" />`);
      r.readAsDataURL(file);
      e.target.value = '';
    });

    document.getElementById('ce-toggle-source').addEventListener('click', () => {
      setMode(editorMode === 'visual' ? 'source' : 'visual');
    });

    document.getElementById('ce-save').addEventListener('click', () => {
      const editor = document.getElementById('ce-editor');
      const source = document.getElementById('ce-source');
      const html = (editorMode === 'source') ? source.value : editor.innerHTML;
      if (saveContent(CURRENT.id, html)) {
        appendHistory('content', '儲存活動文案', '已更新前台顯示的活動文案內容。');
        toast('已儲存活動文案。', 'content');
      }
    });

    document.getElementById('ce-reset').addEventListener('click', () => {
      if (!confirm('還原為預設文案？目前未儲存的編輯將會遺失。')) return;
      const def = DEFAULT_CONTENT[CURRENT.id] || '';
      try { localStorage.removeItem('mgm_campaign_content_' + CURRENT.id); } catch {}
      document.getElementById('ce-editor').innerHTML = def;
      document.getElementById('ce-source').value = def;
    });
  }

  // ---------- 各分頁底部：編輯歷程 ----------
  function renderHistorySection(wrapId, allowTypes) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;

    const typeSet = new Set(allowTypes || []);
    const list = getHistory(CURRENT.id).filter((h) => typeSet.has(h.type));
    if (list.length === 0) {
      wrap.innerHTML = '<div class="cd-h-empty">本分頁尚無紀錄</div>';
      return;
    }

    const TYPE_LABEL = { info: '基本資訊', matrix: '獎金級距', content: '活動文案', snapshot: '系統快照' };

    wrap.innerHTML = list.map((h) => `
      <div class="cd-h-entry type-${h.type}">
        <div class="cd-h-time">${h.time}</div>
        <div class="cd-h-title">
          ${h.title}
          <span class="cd-h-type-tag">${TYPE_LABEL[h.type] || h.type}</span>
        </div>
        <div class="cd-h-desc">${h.desc}</div>
        <div class="cd-h-actor"><i class="fa-regular fa-user"></i>${h.actor}</div>
      </div>
    `).join('');
  }

  function renderAllHistorySections() {
    renderHistorySection('history-timeline-info', ['info']);
    renderHistorySection('history-timeline-matrix', ['matrix', 'snapshot']);
    renderHistorySection('history-timeline-content', ['content']);
  }

  // ---------- 回列表 ----------
  function bindBack() {
    document.getElementById('btn-back-list').addEventListener('click', () => {
      if (window.parent && window.parent.AdminRouter) {
        window.parent.AdminRouter.go('admin-campaigns');
      } else {
        location.href = 'admin-campaigns.html';
      }
    });
  }

  // ---------- Toast ----------
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
    t._tid = setTimeout(() => (t.style.opacity = '0'), 2400);
  }

  function maybeShowWizardOnboard() {}

  // ---------- 初始化 ----------
  document.addEventListener('DOMContentLoaded', () => {
    fillCampaignHead();
    fillInfoForm();
    bindTabs();
    // 根據 URL hash 自動切換 tab（例如 #matrix → 獎金級距）
    const _hashTab = location.hash.slice(1);
    if (_hashTab) {
      const _tabEl = document.querySelector('.cd-tab[data-tab="' + _hashTab + '"]');
      if (_tabEl) _tabEl.click();
    }
    bindInfoSave();
    bindMatrixSave();
    bindAddProject();
    bindRowToggle();
    bindEditor();
    bindBack();
    loadMatrixRules();
    renderAllHistorySections();

    maybeShowWizardOnboard();
  });
})();
