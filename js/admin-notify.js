/* ==========================================================
   admin-notify.js — 推播通知管理
   ========================================================== */
(function () {
  'use strict';

  const CLAIM_URL     = 'https://mgm.shinda.com.tw/';
  const LOG_KEY       = 'mgm_notify_log';
  const TPL_KEY       = 'mgm_notify_templates';
  const DEMO_EXPIRE   = '2026/07/31';

  // ── Mock referrer list ──────────────────────────────────
  const REFERRERS = [
    { id: 'U250310001', name: '王大明', mobile: '0912-345-678', line: true,  cases: 3 },
    { id: 'U240105002', name: '李小芬', mobile: '0923-456-789', line: true,  cases: 1 },
    { id: 'U230620003', name: '張志偉', mobile: '0934-567-890', line: false, cases: 5 },
    { id: 'U250115004', name: '陳美玲', mobile: '0945-678-901', line: true,  cases: 2 },
    { id: 'U240328005', name: '林建宏', mobile: '0956-789-012', line: true,  cases: 4 },
    { id: 'U250220006', name: '黃淑惠', mobile: '0967-890-123', line: false, cases: 1 },
    { id: 'U250401007', name: '吳俊男', mobile: '0978-901-234', line: true,  cases: 2 },
    { id: 'U240603008', name: '劉雅婷', mobile: '0989-012-345', line: true,  cases: 3 },
    { id: 'U250508009', name: '蔡政廷', mobile: '0900-123-456', line: false, cases: 2 },
    { id: 'U240715010', name: '楊秀英', mobile: '0911-234-567', line: true,  cases: 6 },
  ];

  // ── Default event templates ─────────────────────────────
  const DEFAULT_TEMPLATES = [
    {
      id:          'tpl-payout',
      name:        '核款通知',
      triggerLabel:'執行推薦案獎金核款 = 同意時',
      iconCls:     'tpl-icon--payout',
      icon:        'fa-solid fa-circle-check',
      sms:  '親愛的{姓名}，您的推薦獎金已核款！請於 {效期} 前登入 {URL} 選擇提領方式，逾期視同放棄，請盡速處理。',
      line: '🎉 {姓名} 您好！\n您的推薦獎金已核款。\n\n請於 {效期} 前至以下連結\n選擇提領方式：\n{URL}\n\n逾期視同放棄，請盡速處理。',
    },
    {
      id:          'tpl-transferred',
      name:        '已撥款通知',
      triggerLabel:'提領功能資料狀態 = 已撥款時',
      iconCls:     'tpl-icon--transfer',
      icon:        'fa-solid fa-money-bill-transfer',
      sms:  '親愛的{姓名}，您申請的推薦獎金已完成撥款，請確認帳戶入帳。感謝您推薦理財通，歡迎多多使用！',
      line: '✅ {姓名} 您好！\n您的推薦獎金已撥款至您的帳戶。\n請確認入帳情況。\n\n感謝您推薦理財通，歡迎繼續支持！',
    },
  ];

  // ── State ───────────────────────────────────────────────
  let selected     = new Set();   // selected referrer IDs
  let rcptFilter   = 'all';       // 'all' | 'line' | 'sms'
  let rcptSearch   = '';
  let activeCh     = 'sms';       // active compose msg tab
  let channels     = { sms: true, line: true };
  let currentTplId = '';

  // mutable copy of templates (updated on save)
  const templates = loadTemplates();

  // ── Template persistence ────────────────────────────────
  function loadTemplates() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(TPL_KEY) || '{}'); } catch {}
    return DEFAULT_TEMPLATES.map((t) => ({
      ...t,
      sms:  saved[t.id + '_sms']  ?? t.sms,
      line: saved[t.id + '_line'] ?? t.line,
    }));
  }

  function saveTemplateField(tplId, channel, text) {
    try {
      const saved = JSON.parse(localStorage.getItem(TPL_KEY) || '{}');
      saved[tplId + '_' + channel] = text;
      localStorage.setItem(TPL_KEY, JSON.stringify(saved));
    } catch {}
  }

  // ── Log persistence ─────────────────────────────────────
  function loadLog() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; }
  }

  function appendLog(entry) {
    try {
      const log = loadLog();
      log.unshift(entry);
      if (log.length > 200) log.length = 200;
      localStorage.setItem(LOG_KEY, JSON.stringify(log));
    } catch {}
  }

  // ── Helpers ─────────────────────────────────────────────
  function escHtml(s) {
    return (s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function insertAtCursor(ta, text) {
    const s = ta.selectionStart, e = ta.selectionEnd;
    ta.value = ta.value.substring(0, s) + text + ta.value.substring(e);
    ta.selectionStart = ta.selectionEnd = s + text.length;
    ta.dispatchEvent(new Event('input'));
    ta.focus();
  }

  function previewText(raw, name) {
    return (raw || '')
      .replace(/\{姓名\}/g, name)
      .replace(/\{URL\}/g,  CLAIM_URL)
      .replace(/\{效期\}/g, DEMO_EXPIRE);
  }

  function toast(msg, color = '#10b981') {
    const t = document.createElement('div');
    t.style.cssText =
      `position:fixed;top:80px;right:24px;background:${color};color:#fff;` +
      'padding:12px 18px;border-radius:10px;font-size:14px;z-index:9999;' +
      'box-shadow:0 8px 20px rgba(0,0,0,.15);display:flex;align-items:center;gap:8px;';
    t.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  function getFiltered() {
    return REFERRERS.filter((r) => {
      if (rcptFilter === 'line' && !r.line) return false;
      if (rcptFilter === 'sms'  &&  r.line) return false;
      const q = rcptSearch.trim().toLowerCase();
      if (q && !r.name.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function activeTextarea() {
    return document.getElementById(activeCh === 'sms' ? 'msg-sms-text' : 'msg-line-text');
  }

  // ── Recipient list render ───────────────────────────────
  function renderRecipients() {
    const list = document.getElementById('rcpt-list');
    const filtered = getFiltered();

    if (!filtered.length) {
      list.innerHTML = `<div style="padding:28px;text-align:center;color:#252629;font-size:13px;">
        無符合條件的推薦人
      </div>`;
      return;
    }

    list.innerHTML = filtered.map((r) => {
      const sel  = selected.has(r.id);
      const lineBadge = r.line
        ? `<span class="rbadge rbadge--line"><i class="fa-brands fa-line"></i> LINE</span>`
        : `<span class="rbadge rbadge--no">無LINE</span>`;
      return `
        <div class="rcpt-item${sel ? ' is-selected' : ''}" data-id="${r.id}">
          <input class="rcpt-cb" type="checkbox" ${sel ? 'checked' : ''} tabindex="-1" data-id="${r.id}" />
          <div class="rcpt-info">
            <div class="rcpt-name">${escHtml(r.name)}<span class="rcpt-id">${r.id}</span></div>
            <div class="rcpt-sub">${r.mobile}・案件數 ${r.cases}</div>
          </div>
          <div class="rcpt-badges">
            <span class="rbadge rbadge--sms"><i class="fa-solid fa-comment-sms"></i> SMS</span>
            ${lineBadge}
          </div>
        </div>`;
    }).join('');

    list.querySelectorAll('.rcpt-item').forEach((item) => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        if (selected.has(id)) selected.delete(id); else selected.add(id);
        renderRecipients();
        syncSendBar();
        syncLineWarn();
      });
    });
  }

  function syncSendBar() {
    const n = selected.size;
    document.getElementById('sel-count-label').textContent = `已選 ${n} 人`;

    const disp = document.getElementById('send-rcpt-display');
    const btn  = document.getElementById('btn-send-notify');

    if (n === 0) {
      disp.textContent = '尚未選擇推薦人';
      btn.disabled = true;
    } else {
      const selList = REFERRERS.filter((r) => selected.has(r.id));
      const labels  = selList.map((r) => `${r.name}(@${r.id})`);
      disp.textContent = labels.length <= 3
        ? labels.join('、')
        : labels.slice(0, 3).join('、') + ` 等 ${labels.length} 人`;
      btn.disabled = false;
    }
  }

  function syncLineWarn() {
    const warn = document.getElementById('no-line-warn');
    if (!channels.line) { warn.style.display = 'none'; return; }
    const cnt = REFERRERS.filter((r) => selected.has(r.id) && !r.line).length;
    document.getElementById('no-line-count').textContent = cnt;
    warn.style.display = cnt > 0 ? 'block' : 'none';
  }

  // ── Channel toggle ──────────────────────────────────────
  function syncChannelUI() {
    document.getElementById('ch-sms-opt').classList.toggle('is-on',  channels.sms);
    document.getElementById('ch-line-opt').classList.toggle('is-on', channels.line);
    document.getElementById('ch-sms').checked  = channels.sms;
    document.getElementById('ch-line').checked = channels.line;

    // Show/hide msg tabs based on channel selection
    const tabs = document.getElementById('compose-msg-tabs');
    tabs.querySelector('[data-ch="sms"]').style.display  = channels.sms  ? '' : 'none';
    tabs.querySelector('[data-ch="line"]').style.display = channels.line ? '' : 'none';

    // If active tab got hidden, switch to the other
    if (activeCh === 'sms'  && !channels.sms)  activeCh = 'line';
    if (activeCh === 'line' && !channels.line)  activeCh = 'sms';
    syncMsgArea();
    syncLineWarn();
  }

  // ── Msg tab area ────────────────────────────────────────
  function syncMsgArea() {
    document.querySelectorAll('.msg-tab').forEach((t) =>
      t.classList.toggle('active', t.dataset.ch === activeCh)
    );
    document.getElementById('sms-area').style.display  = activeCh === 'sms'  ? '' : 'none';
    document.getElementById('line-area').style.display = activeCh === 'line' ? '' : 'none';
    syncCharCount();
    syncPreview();
  }

  function syncCharCount() {
    const ta    = activeTextarea();
    const len   = (ta?.value || '').length;
    const limit = activeCh === 'line' ? 50 : 70;
    const el    = document.getElementById('compose-char-count');
    el.textContent = len + (activeCh === 'line' ? ` 字（建議 ≤ 50）` : ' 字');
    el.classList.toggle('warn', len > limit);
  }

  function syncPreview() {
    const ta = activeTextarea();
    const text = previewText(ta?.value || '', '王大明');
    document.getElementById('msg-preview').textContent = text || '（尚未輸入訊息）';
  }

  // ── Apply template to compose area ─────────────────────
  function applyTemplate(tplId) {
    const tpl = templates.find((t) => t.id === tplId);
    document.getElementById('msg-sms-text').value  = tpl ? tpl.sms  : '';
    document.getElementById('msg-line-text').value = tpl ? tpl.line : '';
    syncCharCount();
    syncPreview();
  }

  // ── Send ────────────────────────────────────────────────
  function handleSend() {
    const selList = REFERRERS.filter((r) => selected.has(r.id));
    if (!selList.length) return;

    const smsText  = document.getElementById('msg-sms-text').value.trim();
    const lineText = document.getElementById('msg-line-text').value.trim();
    const chList   = [];
    if (channels.sms  && smsText)  chList.push('SMS');
    if (channels.line && lineText) chList.push('LINE');

    if (!chList.length) {
      toast('請先輸入訊息內容', '#ef4444');
      return;
    }

    const tplName = currentTplId
      ? (templates.find((t) => t.id === currentTplId)?.name || '自訂')
      : '自訂';

    const ok = confirm(
      `即將發送推播給 ${selList.length} 位推薦人\n` +
      `管道：${chList.join(' + ')}\n` +
      `母版：${tplName}\n\n確定發送？`
    );
    if (!ok) return;

    appendLog({
      time:             new Date().toLocaleString('zh-TW'),
      actor:            'Admin User',
      recipientDetails: selList.map((r) => ({ name: r.name, id: r.id, mobile: r.mobile, line: r.line })),
      recipientCount:   selList.length,
      channels:         chList,
      tplName,
      smsText,
      lineText,
    });

    toast(`推播已發送！${selList.length} 位推薦人 × ${chList.join(' + ')}`);
    selected.clear();
    renderRecipients();
    syncSendBar();
    syncLineWarn();
  }

  // ── Settings: render template cards ────────────────────
  function renderSettingsCards() {
    const container = document.getElementById('tpl-cards-container');
    const tpls = loadTemplates();

    container.innerHTML = tpls.map((t) => `
      <div class="tpl-card" id="card-${t.id}">
        <div class="tpl-card-head">
          <div class="tpl-icon ${t.iconCls}"><i class="${t.icon}"></i></div>
          <div>
            <div class="tpl-card-title">${t.name}</div>
            <div class="tpl-trigger">
              自動觸發條件：<span class="tpl-trigger-code">${t.triggerLabel}</span>
            </div>
          </div>
        </div>
        <div class="tpl-body">
          <div class="tpl-ch-tabs">
            <button class="tpl-ch-tab active" data-tpl="${t.id}" data-tplch="sms">
              <i class="fa-solid fa-comment-sms"></i> SMS
            </button>
            <button class="tpl-ch-tab" data-tpl="${t.id}" data-tplch="line">
              <i class="fa-brands fa-line"></i> LINE（建議 50 字以內）
            </button>
          </div>
          <div class="tpl-var-row">
            <div class="tpl-var-label">可用變數（點擊插入）：</div>
            <div class="var-chips">
              <span class="var-chip" data-tplid="${t.id}" data-v="{姓名}">{姓名}</span>
              <span class="var-chip" data-tplid="${t.id}" data-v="{URL}">{URL}</span>
              <span class="var-chip" data-tplid="${t.id}" data-v="{效期}">{效期}</span>
            </div>
          </div>
          <div id="wrap-sms-${t.id}">
            <textarea class="tpl-textarea" id="ta-sms-${t.id}">${escHtml(t.sms)}</textarea>
          </div>
          <div id="wrap-line-${t.id}" style="display:none;">
            <textarea class="tpl-textarea" id="ta-line-${t.id}">${escHtml(t.line)}</textarea>
          </div>
          <div class="tpl-save-row">
            <span class="tpl-char-info" id="ci-${t.id}"></span>
            <button class="btn-tpl-save" data-saveid="${t.id}">
              <i class="fa-solid fa-floppy-disk"></i> 儲存此母版
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // channel tabs
    container.querySelectorAll('.tpl-ch-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.tpl;
        const ch    = btn.dataset.tplch;
        const card  = document.getElementById('card-' + tplId);
        card.querySelectorAll('.tpl-ch-tab').forEach((b) =>
          b.classList.toggle('active', b.dataset.tplch === ch)
        );
        document.getElementById('wrap-sms-'  + tplId).style.display = ch === 'sms'  ? '' : 'none';
        document.getElementById('wrap-line-' + tplId).style.display = ch === 'line' ? '' : 'none';
        updateTplCharInfo(tplId, ch);
      });
    });

    // var chips
    container.querySelectorAll('.var-chip[data-tplid]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const tplId = chip.dataset.tplid;
        const card  = document.getElementById('card-' + tplId);
        const ch    = card.querySelector('.tpl-ch-tab.active').dataset.tplch;
        const ta    = document.getElementById('ta-' + ch + '-' + tplId);
        insertAtCursor(ta, chip.dataset.v);
        updateTplCharInfo(tplId, ch);
      });
    });

    // save
    container.querySelectorAll('[data-saveid]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tplId   = btn.dataset.saveid;
        const smsText = document.getElementById('ta-sms-'  + tplId).value;
        const lineTxt = document.getElementById('ta-line-' + tplId).value;
        saveTemplateField(tplId, 'sms',  smsText);
        saveTemplateField(tplId, 'line', lineTxt);
        // update in-memory copy so compose area picks up latest
        const t = templates.find((x) => x.id === tplId);
        if (t) { t.sms = smsText; t.line = lineTxt; }
        toast('母版已儲存');
      });
    });

    // textarea input → char count
    tpls.forEach((t) => {
      ['sms', 'line'].forEach((ch) => {
        const ta = document.getElementById('ta-' + ch + '-' + t.id);
        if (ta) ta.addEventListener('input', () => updateTplCharInfo(t.id, ch));
      });
      updateTplCharInfo(t.id, 'sms');
    });
  }

  function updateTplCharInfo(tplId, ch) {
    const ta    = document.getElementById('ta-' + ch + '-' + tplId);
    const el    = document.getElementById('ci-' + tplId);
    if (!ta || !el) return;
    const len   = (ta.value || '').length;
    const limit = ch === 'line' ? 50 : 70;
    el.className = 'tpl-char-info' + (len > limit ? ' warn' : '');
    el.textContent = `${len} 字${ch === 'line' ? '（建議 ≤ 50）' : ''}`;
  }

  // ── Log render ──────────────────────────────────────────
  const DEMO_LOG = [
    {
      time: '2026/5/30 下午 2:18:44', actor: 'Admin User',
      recipientDetails: [
        { name: '王大明', id: 'U250310001', mobile: '0912-345-678', line: true },
        { name: '林建宏', id: 'U240328005', mobile: '0956-789-012', line: true },
        { name: '劉雅婷', id: 'U240603008', mobile: '0989-012-345', line: true },
      ],
      recipientCount: 3,
      channels: ['SMS', 'LINE'], tplName: '核款通知',
      smsText:  '親愛的{姓名}，您的推薦獎金已核款！請於 {效期} 前登入 {URL} 選擇提領方式，逾期視同放棄，請盡速處理。',
      lineText: '🎉 {姓名} 您好！\n您的推薦獎金已核款。\n\n請於 {效期} 前至以下連結\n選擇提領方式：\n{URL}\n\n逾期視同放棄，請盡速處理。',
    },
    {
      time: '2026/5/20 上午 10:05:12', actor: 'Admin User',
      recipientDetails: [
        { name: '陳美玲', id: 'U250115004', mobile: '0945-678-901', line: true },
      ],
      recipientCount: 1,
      channels: ['SMS'], tplName: '已撥款通知',
      smsText:  '親愛的{姓名}，您申請的推薦獎金已完成撥款，請確認帳戶入帳。感謝您推薦理財通，歡迎多多使用！',
      lineText: '',
    },
  ];

  function renderLog() {
    const tbody = document.getElementById('log-tbody');
    if (!tbody) return;
    const real = loadLog();
    const rows = (real.length ? real : DEMO_LOG).slice(0, 100);

    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:28px;color:#252629;">尚無發送紀錄</td></tr>`;
      return;
    }

    tbody.innerHTML = rows.map((e, idx) => {
      const chBadges = (e.channels || []).map((ch) =>
        `<span class="log-ch-badge log-ch-badge--${ch.toLowerCase()}">${ch}</span>`
      ).join(' ');

      const details = e.recipientDetails ||
        (e.recipients || []).map((n) => ({ name: n, id: '', mobile: '', line: false }));
      const count = e.recipientCount || details.length;

      const fmtName = (r) => r.id
        ? `${escHtml(r.name)}<span style="color:#252629;font-weight:400;">(${r.id})</span>`
        : escHtml(r.name);

      const rcptStr = details.length <= 2
        ? details.map(fmtName).join('、')
        : details.slice(0, 2).map(fmtName).join('、') + ` 等 ${count} 人`;

      const msgPreview = (e.smsText || e.lineText || e.smsSummary || '');

      return `
        <tr>
          <td style="white-space:nowrap;font-size:12px;">${e.time || '—'}</td>
          <td style="white-space:nowrap;font-size:12px;">${e.actor || '—'}</td>
          <td style="font-size:12px;">${rcptStr}</td>
          <td style="white-space:nowrap;">${chBadges}</td>
          <td style="font-size:12px;color:#374151;">
            <span style="color:#6366f1;font-weight:600;">【${e.tplName || '自訂'}】</span>
            <span style="color:#252629;">${escHtml(msgPreview.substring(0, 20))}${msgPreview.length > 20 ? '…' : ''}</span>
          </td>
          <td style="white-space:nowrap;">
            <span class="log-sent"><i class="fa-solid fa-check"></i> 已發送</span>
            <button class="log-detail-btn" data-idx="${idx}">
              <i class="fa-solid fa-magnifying-glass" style="font-size:9px;margin-right:3px;"></i>明細
            </button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('.log-detail-btn').forEach((btn) => {
      btn.addEventListener('click', () => openNotifyDetail(rows[+btn.dataset.idx]));
    });
  }

  // ── Detail Modal ─────────────────────────────────────────
  function openNotifyDetail(e) {
    const modal = document.getElementById('notify-detail-modal');
    const body  = document.getElementById('nm-body');
    if (!modal || !body) return;

    const hasSms  = (e.channels || []).includes('SMS');
    const hasLine = (e.channels || []).includes('LINE');

    const details = e.recipientDetails ||
      (e.recipients || []).map((n) => ({ name: n, id: '', mobile: '', line: false }));
    const count = e.recipientCount || details.length;

    const chBadges = (e.channels || []).map((ch) =>
      `<span class="log-ch-badge log-ch-badge--${ch.toLowerCase()}" style="font-size:12px;">${ch}</span>`
    ).join(' ');

    // recipient list
    const rcptHtml = details.map((r) => {
      const identity = hasSms && r.mobile
        ? `${escHtml(r.name)}<span class="nm-rcpt-meta">(${r.id}、${escHtml(r.mobile)})</span>`
        : (r.id ? `${escHtml(r.name)}<span class="nm-rcpt-meta">(${r.id})</span>` : escHtml(r.name));
      const lineBadge = hasLine
        ? (r.line
            ? `<span class="nm-rcpt-line nm-rcpt-line--yes"><i class="fa-brands fa-line" style="font-size:9px;"></i> LINE</span>`
            : `<span class="nm-rcpt-line nm-rcpt-line--no">無 LINE</span>`)
        : '';
      return `<div class="nm-rcpt-item">${identity}${lineBadge}</div>`;
    }).join('');

    // message sections
    let msgHtml = '';
    if (hasSms && e.smsText) {
      msgHtml += `
        <div class="nm-section">
          <div class="nm-ch-head nm-ch-head--sms">
            <i class="fa-solid fa-comment-sms"></i> SMS 發送內容
          </div>
          <div class="nm-msg-box">${escHtml(e.smsText)}</div>
          <div class="nm-msg-note">* {姓名} 於實際發送時自動替換為各收件人姓名</div>
        </div>`;
    }
    if (hasLine && e.lineText) {
      msgHtml += `
        <div class="nm-section">
          <div class="nm-ch-head nm-ch-head--line">
            <i class="fa-brands fa-line"></i> LINE 推播內容
          </div>
          <div class="nm-msg-box">${escHtml(e.lineText)}</div>
          <div class="nm-msg-note">* {姓名} 於實際發送時自動替換為各收件人姓名</div>
        </div>`;
    }
    if (!msgHtml) {
      const fallback = e.smsText || e.lineText || e.smsSummary || '';
      if (fallback) {
        msgHtml = `
          <div class="nm-section">
            <div class="nm-section-title"><i class="fa-solid fa-envelope"></i> 發送內容</div>
            <div class="nm-msg-box">${escHtml(fallback)}</div>
          </div>`;
      }
    }

    body.innerHTML = `
      <div class="nm-meta">
        <i class="fa-regular fa-clock" style="color:#6366f1;"></i>
        <strong>${escHtml(e.time || '—')}</strong>
        <span class="nm-meta-sep">|</span>
        <i class="fa-solid fa-user" style="color:#252629;font-size:11px;"></i>${escHtml(e.actor || '—')}
        <span class="nm-meta-sep">|</span>
        ${chBadges}
        <span class="nm-meta-sep">|</span>
        <span style="color:#6366f1;font-weight:700;">【${escHtml(e.tplName || '自訂')}】</span>
      </div>

      <div class="nm-section">
        <div class="nm-section-title">
          <i class="fa-solid fa-users"></i> 收件人（共 ${count} 位）
        </div>
        <div class="nm-rcpt-list">${rcptHtml}</div>
      </div>

      ${msgHtml}`;

    modal.hidden = false;
  }

  function closeNotifyDetail() {
    const modal = document.getElementById('notify-detail-modal');
    if (modal) modal.hidden = true;
  }

  function bindNotifyModal() {
    document.getElementById('nm-close')?.addEventListener('click', closeNotifyDetail);
    document.getElementById('nm-close-foot')?.addEventListener('click', closeNotifyDetail);
    document.getElementById('nm-backdrop')?.addEventListener('click', closeNotifyDetail);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNotifyDetail();
    });
  }

  // ── Bind: tabs ──────────────────────────────────────────
  function bindTabs() {
    document.querySelectorAll('.ntab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.ntab').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.ntab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.ntab).classList.add('active');
        if (btn.dataset.ntab === 'settings') renderSettingsCards();
        if (btn.dataset.ntab === 'log')      renderLog();
      });
    });
  }

  // ── Bind: recipient controls ────────────────────────────
  function bindRecipients() {
    document.getElementById('rcpt-search-input').addEventListener('input', (e) => {
      rcptSearch = e.target.value;
      renderRecipients();
    });

    document.querySelectorAll('.rcpt-filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.rcpt-filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        rcptFilter = btn.dataset.filter;
        renderRecipients();
      });
    });

    document.getElementById('btn-sel-all').addEventListener('click', () => {
      getFiltered().forEach((r) => selected.add(r.id));
      renderRecipients(); syncSendBar(); syncLineWarn();
    });
    document.getElementById('btn-sel-clear').addEventListener('click', () => {
      selected.clear();
      renderRecipients(); syncSendBar(); syncLineWarn();
    });
    document.getElementById('btn-sel-line').addEventListener('click', () => {
      getFiltered().filter((r) => r.line).forEach((r) => selected.add(r.id));
      renderRecipients(); syncSendBar(); syncLineWarn();
    });
  }

  // ── Bind: channel toggles ───────────────────────────────
  function bindChannels() {
    ['sms', 'line'].forEach((ch) => {
      const opt = document.getElementById('ch-' + ch + '-opt');
      const cb  = document.getElementById('ch-' + ch);

      // clicking the label wrapper toggles channel
      opt.addEventListener('click', (e) => {
        if (e.target === cb) return; // handled by change event
        channels[ch] = !channels[ch];
        if (!channels.sms && !channels.line) channels[ch] = true;
        syncChannelUI();
      });

      cb.addEventListener('change', () => {
        channels[ch] = cb.checked;
        if (!channels.sms && !channels.line) { channels[ch] = true; cb.checked = true; }
        syncChannelUI();
      });
    });
  }

  // ── Bind: message tab switches ──────────────────────────
  function bindMsgTabs() {
    document.querySelectorAll('.msg-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCh = btn.dataset.ch;
        syncMsgArea();
      });
    });
  }

  // ── Bind: compose area ──────────────────────────────────
  function bindCompose() {
    document.getElementById('tpl-picker').addEventListener('change', (e) => {
      currentTplId = e.target.value;
      applyTemplate(currentTplId);
    });

    ['msg-sms-text', 'msg-line-text'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        syncCharCount();
        syncPreview();
      });
    });

    document.querySelectorAll('.var-chip[data-var]').forEach((chip) => {
      chip.addEventListener('click', () => {
        insertAtCursor(activeTextarea(), chip.dataset.var);
        syncCharCount();
        syncPreview();
      });
    });
  }

  // ── Init ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    bindTabs();
    bindRecipients();
    bindChannels();
    bindMsgTabs();
    bindCompose();
    bindNotifyModal();

    document.getElementById('btn-send-notify').addEventListener('click', handleSend);
    document.getElementById('btn-refresh-log').addEventListener('click', renderLog);

    renderRecipients();
    syncSendBar();
    syncLineWarn();
    syncChannelUI();
    applyTemplate('');
  });
})();
