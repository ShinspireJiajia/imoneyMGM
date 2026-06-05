/* ==========================================================
   admin-faq.js
   常見問答後台維護：新增 / 編輯 / 刪除 / 啟停 / 拖曳排序
   持久化：localStorage 'mgm_faq_items'
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'mgm_faq_items';

  const DEFAULT_FAQ = [
    {
      id: 'faq-1',
      question: '如何取得我的推薦連結？',
      answer: '<p>請在首頁點選「複製連結」按鈕，系統即會將您的專屬推薦連結複製至剪貼簿，您可以直接貼到 LINE、FB 等社群平台分享給親友。</p>',
      enabled: true,
    },
    {
      id: 'faq-2',
      question: '推薦獎金何時可以提領？',
      answer: '<p>當您推薦的親友成功送出申請並通過審核後，獎金會顯示為「可提領」狀態。請前往「我的獎金」頁面選擇提領方式（現場領取或匯款入帳）。</p>',
      enabled: true,
    },
    {
      id: 'faq-3',
      question: '一組推薦碼可以無限次分享嗎？',
      answer: '<p>是的，您的推薦碼為<strong>固定碼</strong>，可長期、無限次使用。每位親友的歸屬以首次送單時使用的推薦碼為準，同一親友重複送單不會重複計算獎金。</p>',
      enabled: true,
    },
    {
      id: 'faq-4',
      question: '如何確認推薦是否成功登錄？',
      answer: '<p>您可前往底部「紀錄」頁面查看所有透過您連結送出的案件，包含「審核中」、「已核款」及「未通過」等狀態，並可查看對應獎金明細。</p>',
      enabled: true,
    },
    {
      id: 'faq-5',
      question: '獎金需要申報稅務嗎？',
      answer: '<p>推薦獎金將計入年度「執行業務所得／其他所得」申報。超過免稅門檻時，平台將於每年二月提供所得資料協助申報，請留意相關通知。</p>',
      enabled: true,
    },
  ];

  // ---------- 資料存取 ----------
  function loadItems() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_FAQ.map(function (f) { return Object.assign({}, f); });
  }

  function saveItems(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      return true;
    } catch (e) {
      alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
      return false;
    }
  }

  function genId() {
    return 'faq-' + Date.now().toString(36);
  }

  // ---------- Toast 通知 ----------
  function showToast(msg) {
    var t = document.getElementById('faq-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'faq-toast';
      t.className = 'faq-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tid);
    t._tid = setTimeout(function () { t.classList.remove('show'); }, 2000);
  }

  // ---------- 純文字預覽（去除 HTML 標籤） ----------
  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  // ---------- 渲染列表 ----------
  var items = loadItems();

  function render() {
    var list = document.getElementById('faq-admin-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="faq-admin-empty"><i class="fa-regular fa-face-meh"></i> 尚無問答資料，請點選「新增問答」</div>';
      return;
    }
    list.innerHTML = items.map(function (f, idx) {
      var preview = stripHtml(f.answer).slice(0, 60) + (stripHtml(f.answer).length > 60 ? '…' : '');
      var statusCls = f.enabled !== false ? 'status-on' : 'status-off';
      var statusText = f.enabled !== false ? '<i class="fa-solid fa-eye"></i>顯示中' : '<i class="fa-solid fa-eye-slash"></i>已停用';
      return (
        '<div class="faq-admin-row' + (f.enabled === false ? ' row-disabled' : '') + '" data-id="' + f.id + '" draggable="true">' +
          '<div class="faq-row-handle" title="拖曳排序"><i class="fa-solid fa-up-down"></i></div>' +
          '<div class="faq-row-content">' +
            '<div class="faq-row-question">' + escHtml(f.question) + '</div>' +
            '<div class="faq-row-answer-preview">' + escHtml(preview) + '</div>' +
          '</div>' +
          '<button type="button" class="faq-row-status ' + statusCls + '" data-toggle="' + f.id + '" title="點擊切換顯示狀態">' + statusText + '</button>' +
          '<div class="faq-row-actions">' +
            '<button type="button" class="faq-row-btn" data-edit="' + f.id + '" title="編輯"><i class="fa-solid fa-pen"></i></button>' +
            '<button type="button" class="faq-row-btn btn-del" data-delete="' + f.id + '" title="刪除"><i class="fa-solid fa-trash"></i></button>' +
          '</div>' +
        '</div>'
      );
    }).join('');

    bindRowEvents();
    bindDrag();
  }

  function escHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ---------- 列表事件綁定 ----------
  function bindRowEvents() {
    var list = document.getElementById('faq-admin-list');

    list.querySelectorAll('[data-edit]').forEach(function (btn) {
      btn.addEventListener('click', function () { openEdit(btn.dataset.edit); });
    });

    list.querySelectorAll('[data-delete]').forEach(function (btn) {
      btn.addEventListener('click', function () { openDelete(btn.dataset.delete); });
    });

    list.querySelectorAll('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () { toggleEnabled(btn.dataset.toggle); });
    });
  }

  // ---------- 啟停 ----------
  function toggleEnabled(id) {
    var item = items.find(function (f) { return f.id === id; });
    if (!item) return;
    item.enabled = !item.enabled;
    if (saveItems(items)) {
      render();
      showToast(item.enabled ? '已啟用「' + item.question.slice(0, 12) + '」' : '已停用「' + item.question.slice(0, 12) + '」');
    }
  }

  // ============================================================
  // 拖曳排序
  // ============================================================
  var dragSrc = null;

  function bindDrag() {
    var rows = document.querySelectorAll('#faq-admin-list .faq-admin-row');
    rows.forEach(function (row) {
      row.addEventListener('dragstart', function (e) {
        dragSrc = row;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', function () {
        row.classList.remove('dragging');
        document.querySelectorAll('.drop-before, .drop-after').forEach(function (r) {
          r.classList.remove('drop-before', 'drop-after');
        });
        dragSrc = null;
      });
      row.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (!dragSrc || dragSrc === row) return;
        document.querySelectorAll('.drop-before, .drop-after').forEach(function (r) {
          r.classList.remove('drop-before', 'drop-after');
        });
        var rect = row.getBoundingClientRect();
        var mid = rect.top + rect.height / 2;
        if (e.clientY < mid) {
          row.classList.add('drop-before');
        } else {
          row.classList.add('drop-after');
        }
        e.dataTransfer.dropEffect = 'move';
      });
      row.addEventListener('dragleave', function () {
        row.classList.remove('drop-before', 'drop-after');
      });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!dragSrc || dragSrc === row) return;
        var srcId = dragSrc.dataset.id;
        var dstId = row.dataset.id;
        var srcIdx = items.findIndex(function (f) { return f.id === srcId; });
        var dstIdx = items.findIndex(function (f) { return f.id === dstId; });
        if (srcIdx === -1 || dstIdx === -1) return;
        var moved = items.splice(srcIdx, 1)[0];
        var newIdx = items.findIndex(function (f) { return f.id === dstId; });
        var isBefore = row.classList.contains('drop-before');
        items.splice(isBefore ? newIdx : newIdx + 1, 0, moved);
        if (saveItems(items)) render();
      });
    });
  }

  // ============================================================
  // 新增 / 編輯 Modal
  // ============================================================
  var editingId = null;

  function openAdd() {
    editingId = null;
    document.getElementById('faq-modal-mode').textContent = '新增問答';
    document.getElementById('faq-question').value = '';
    document.getElementById('faq-answer-editor').innerHTML = '';
    document.getElementById('faq-enabled').checked = true;
    updateEnabledLabel();
    showModal('faq-editor-modal');
    document.getElementById('faq-question').focus();
  }

  function openEdit(id) {
    var item = items.find(function (f) { return f.id === id; });
    if (!item) return;
    editingId = id;
    document.getElementById('faq-modal-mode').textContent = '編輯問答';
    document.getElementById('faq-question').value = item.question;
    document.getElementById('faq-answer-editor').innerHTML = item.answer || '';
    // 同步 source textarea
    document.getElementById('faq-answer-source').value = item.answer || '';
    document.getElementById('faq-enabled').checked = item.enabled !== false;
    updateEnabledLabel();
    showModal('faq-editor-modal');
    document.getElementById('faq-question').focus();
  }

  function saveEdit() {
    var question = document.getElementById('faq-question').value.trim();
    if (!question) {
      alert('請填寫問題內容');
      document.getElementById('faq-question').focus();
      return;
    }
    var isSource = !document.getElementById('faq-answer-source').hidden;
    var answer = isSource
      ? document.getElementById('faq-answer-source').value.trim()
      : document.getElementById('faq-answer-editor').innerHTML.trim();
    if (!answer) {
      alert('請填寫答案內容');
      document.getElementById('faq-answer-editor').focus();
      return;
    }
    var enabled = document.getElementById('faq-enabled').checked;

    if (editingId) {
      var item = items.find(function (f) { return f.id === editingId; });
      if (item) {
        item.question = question;
        item.answer = answer;
        item.enabled = enabled;
      }
    } else {
      items.push({ id: genId(), question: question, answer: answer, enabled: enabled });
    }

    if (saveItems(items)) {
      hideModal('faq-editor-modal');
      render();
      showToast(editingId ? '問答已更新' : '已新增問答');
    }
  }

  // ============================================================
  // 刪除確認 Modal
  // ============================================================
  var deletingId = null;

  function openDelete(id) {
    var item = items.find(function (f) { return f.id === id; });
    if (!item) return;
    deletingId = id;
    document.getElementById('faq-delete-preview').textContent = item.question;
    showModal('faq-delete-modal');
  }

  function confirmDelete() {
    if (!deletingId) return;
    var idx = items.findIndex(function (f) { return f.id === deletingId; });
    if (idx !== -1) items.splice(idx, 1);
    if (saveItems(items)) {
      hideModal('faq-delete-modal');
      render();
      showToast('問答已刪除');
    }
    deletingId = null;
  }

  // ============================================================
  // Modal 開關
  // ============================================================
  function showModal(id) {
    document.getElementById(id).removeAttribute('hidden');
  }

  function hideModal(id) {
    document.getElementById(id).setAttribute('hidden', '');
  }

  // ============================================================
  // 答案編輯器：工具列 + HTML 原始碼切換
  // ============================================================
  var sourceMode = false;

  function bindToolbar() {
    var toolbar = document.getElementById('faq-toolbar');
    if (!toolbar) return;
    var editor = document.getElementById('faq-answer-editor');
    var sourceArea = document.getElementById('faq-answer-source');

    toolbar.querySelectorAll('[data-cmd]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        editor.focus();
        document.execCommand(btn.dataset.cmd, false, null);
      });
    });

    document.getElementById('faq-toggle-source').addEventListener('click', function () {
      sourceMode = !sourceMode;
      if (sourceMode) {
        sourceArea.value = editor.innerHTML;
        editor.hidden = true;
        sourceArea.hidden = false;
        this.classList.add('active');
      } else {
        editor.innerHTML = sourceArea.value;
        sourceArea.hidden = true;
        editor.hidden = false;
        this.classList.remove('active');
        editor.focus();
      }
    });
  }

  // ---------- Toggle 啟用狀態 label ----------
  function updateEnabledLabel() {
    var chk = document.getElementById('faq-enabled');
    var label = document.getElementById('faq-enabled-label');
    if (label) label.textContent = chk.checked ? '啟用' : '停用';
  }

  // ============================================================
  // 初始化
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    render();
    bindToolbar();

    // 新增按鈕
    document.getElementById('btn-faq-add').addEventListener('click', openAdd);

    // 儲存按鈕
    document.getElementById('faq-save').addEventListener('click', saveEdit);

    // 確認刪除按鈕
    document.getElementById('faq-delete-confirm').addEventListener('click', confirmDelete);

    // Toggle 啟用 label
    document.getElementById('faq-enabled').addEventListener('change', updateEnabledLabel);

    // Modal 關閉：backdrop + data-close 按鈕
    document.querySelectorAll('.faq-modal').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        var target = e.target;
        if (target.closest('[data-close]') || target === modal.querySelector('.faq-modal-backdrop')) {
          modal.setAttribute('hidden', '');
          sourceMode = false;
          // 重置原始碼模式
          var editor = document.getElementById('faq-answer-editor');
          var sourceArea = document.getElementById('faq-answer-source');
          if (editor) editor.hidden = false;
          if (sourceArea) sourceArea.hidden = true;
          var toggleBtn = document.getElementById('faq-toggle-source');
          if (toggleBtn) toggleBtn.classList.remove('active');
        }
      });
    });

    // ESC 關閉 modal
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.faq-modal:not([hidden])').forEach(function (m) {
          m.setAttribute('hidden', '');
        });
      }
    });
  });
})();
