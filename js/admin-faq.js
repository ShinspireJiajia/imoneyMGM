/* ==========================================================
   admin-faq.js
   常見問答後台維護：支援最多三層樹狀結構
   type: 'group' = 分類群組（title + children）
   type: 'item'  = 問與答（question + answer）
   持久化：localStorage 'mgm_faq_items'
   ========================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'mgm_faq_items';

  const DEFAULT_FAQ = [
    {
      id: 'cat-share',
      type: 'group',
      title: '推薦與分享',
      enabled: true,
      children: [
        {
          id: 'faq-1',
          type: 'item',
          question: '如何取得我的推薦連結？',
          answer: '<p>請在首頁點選「複製連結」按鈕，系統即會將您的專屬推薦連結複製至剪貼簿，您可以直接貼到 LINE、FB 等社群平台分享給親友。</p>',
          enabled: true,
        },
        {
          id: 'faq-3',
          type: 'item',
          question: '一組推薦碼可以無限次分享嗎？',
          answer: '<p>是的，您的推薦碼為<strong>固定碼</strong>，可長期、無限次使用。每位親友的歸屬以首次送單時使用的推薦碼為準，同一親友重複送單不會重複計算獎金。</p>',
          enabled: true,
        },
        {
          id: 'faq-4',
          type: 'item',
          question: '如何確認推薦是否成功登錄？',
          answer: '<p>您可前往底部「紀錄」頁面查看所有透過您連結送出的案件，包含「審核中」、「已核款」及「未通過」等狀態，並可查看對應獎金明細。</p>',
          enabled: true,
        },
      ],
    },
    {
      id: 'cat-reward',
      type: 'group',
      title: '獎金與提領',
      enabled: true,
      children: [
        {
          id: 'cat-reward-w',
          type: 'group',
          title: '提領操作',
          enabled: true,
          children: [
            {
              id: 'faq-2',
              type: 'item',
              question: '推薦獎金何時可以提領？',
              answer: '<p>當您推薦的親友成功送出申請並通過審核後，獎金會顯示為「可提領」狀態。請前往「我的獎金」頁面選擇提領方式（現場領取或匯款入帳）。</p>',
              enabled: true,
            },
          ],
        },
        {
          id: 'faq-5',
          type: 'item',
          question: '獎金需要申報稅務嗎？',
          answer: '<p>推薦獎金將計入年度「執行業務所得／其他所得」申報。超過免稅門檻時，平台將於每年二月提供所得資料協助申報，請留意相關通知。</p>',
          enabled: true,
        },
      ],
    },
  ];

  // ──────────────────────────────────────────────
  // 資料存取
  // ──────────────────────────────────────────────
  function loadItems() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return JSON.parse(JSON.stringify(DEFAULT_FAQ));
  }

  function saveItems(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
      return false;
    }
  }

  function genId() {
    return 'faq-' + Date.now().toString(36);
  }

  // ──────────────────────────────────────────────
  // 樹狀工具函式
  // ──────────────────────────────────────────────

  // 尋找節點，回傳 { node, parent, index } 或 null
  function findNode(id, nodes) {
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return { node: nodes[i], parent: nodes, index: i };
      if (nodes[i].children) {
        var found = findNode(id, nodes[i].children);
        if (found) return found;
      }
    }
    return null;
  }

  // 取得父節點 id mapping（id → parentId）
  function buildParentMap(nodes, parentId, map) {
    map = map || {};
    (nodes || []).forEach(function (n) {
      map[n.id] = parentId || null;
      if (n.children) buildParentMap(n.children, n.id, map);
    });
    return map;
  }

  // 取得節點所在層級（1~3）
  function getNodeLevel(id, nodes, level) {
    nodes = nodes || items;
    level = level || 1;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === id) return level;
      if (nodes[i].children) {
        var found = getNodeLevel(id, nodes[i].children, level + 1);
        if (found) return found;
      }
    }
    return null;
  }

  // 扁平化樹狀以供渲染（保留 level、parentId）
  function flattenTree(nodes, level, parentId) {
    level = level || 1;
    parentId = parentId || '';
    var result = [];
    (nodes || []).forEach(function (node) {
      result.push({ node: node, level: level, parentId: parentId });
      if ((node.type || 'item') === 'group' && node.children && node.children.length && level < 3) {
        flattenTree(node.children, level + 1, node.id).forEach(function (c) { result.push(c); });
      }
    });
    return result;
  }

  // 取得目標陣列（root 或某 group 的 children）
  function getParentArray(parentId) {
    if (!parentId) return items;
    var res = findNode(parentId, items);
    if (!res) return null;
    if (!res.node.children) res.node.children = [];
    return res.node.children;
  }

  // ──────────────────────────────────────────────
  // Toast 通知
  // ──────────────────────────────────────────────
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

  function stripHtml(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  function escHtml(str) {
    return (str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ──────────────────────────────────────────────
  // 渲染列表
  // ──────────────────────────────────────────────
  var items = loadItems();

  function render() {
    var list = document.getElementById('faq-admin-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="faq-admin-empty"><i class="fa-regular fa-face-meh"></i> 尚無資料，請點選「新增問答」</div>';
      return;
    }
    list.innerHTML = flattenTree(items, 1, '').map(function (info) {
      return renderRow(info.node, info.level, info.parentId);
    }).join('');
    bindRowEvents();
    bindDrag();
  }

  function renderRow(f, level, parentId) {
    var type = f.type || 'item';
    var disabled = f.enabled === false;
    var rowClass = 'faq-admin-row faq-admin-row-l' + level + (disabled ? ' row-disabled' : '');
    var statusCls = !disabled ? 'status-on' : 'status-off';
    var statusText = !disabled
      ? '<i class="fa-solid fa-eye"></i>顯示'
      : '<i class="fa-solid fa-eye-slash"></i>停用';

    var levelBadge = '<span class="faq-level-badge faq-level-l' + level + '">L' + level + '</span>';

    var content;
    if (type === 'group') {
      var childCount = f.children ? f.children.length : 0;
      content = (
        '<div class="faq-row-content">' +
          '<div class="faq-row-question faq-row-group-title">' +
            '<i class="fa-solid fa-folder"></i> ' + escHtml(f.title || '') +
          '</div>' +
          '<div class="faq-row-answer-preview">' + childCount + ' 個子項目</div>' +
        '</div>'
      );
    } else {
      var preview = stripHtml(f.answer).slice(0, 60) + (stripHtml(f.answer).length > 60 ? '…' : '');
      content = (
        '<div class="faq-row-content">' +
          '<div class="faq-row-question">' + escHtml(f.question || '') + '</div>' +
          '<div class="faq-row-answer-preview">' + escHtml(preview) + '</div>' +
        '</div>'
      );
    }

    var actions = '<div class="faq-row-actions">';
    if (type === 'group' && level < 3) {
      actions += '<button type="button" class="faq-row-btn faq-btn-add-child" data-add-child="' + f.id + '" title="新增子項目"><i class="fa-solid fa-plus"></i></button>';
    }
    actions += '<button type="button" class="faq-row-btn" data-edit="' + f.id + '" title="編輯"><i class="fa-solid fa-pen"></i></button>';
    actions += '<button type="button" class="faq-row-btn btn-del" data-delete="' + f.id + '" title="刪除"><i class="fa-solid fa-trash"></i></button>';
    actions += '</div>';

    return (
      '<div class="' + rowClass + '" data-id="' + f.id + '" data-level="' + level + '" data-parent="' + parentId + '" draggable="true">' +
        '<div class="faq-row-handle" title="拖曳排序（僅限同層）"><i class="fa-solid fa-up-down"></i></div>' +
        levelBadge +
        content +
        '<button type="button" class="faq-row-status ' + statusCls + '" data-toggle="' + f.id + '" title="切換顯示狀態">' + statusText + '</button>' +
        actions +
      '</div>'
    );
  }

  // ──────────────────────────────────────────────
  // 列表事件
  // ──────────────────────────────────────────────
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
    list.querySelectorAll('[data-add-child]').forEach(function (btn) {
      btn.addEventListener('click', function () { openAdd(btn.dataset.addChild); });
    });
  }

  // ──────────────────────────────────────────────
  // 啟停
  // ──────────────────────────────────────────────
  function toggleEnabled(id) {
    var res = findNode(id, items);
    if (!res) return;
    res.node.enabled = !res.node.enabled;
    if (saveItems(items)) {
      render();
      var label = res.node.title || res.node.question || '';
      showToast(res.node.enabled ? '已啟用「' + label.slice(0, 12) + '」' : '已停用「' + label.slice(0, 12) + '」');
    }
  }

  // ──────────────────────────────────────────────
  // 拖曳排序（僅限同層）
  // ──────────────────────────────────────────────
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
        if (dragSrc.dataset.parent !== row.dataset.parent) {
          e.dataTransfer.dropEffect = 'none';
          return;
        }
        document.querySelectorAll('.drop-before, .drop-after').forEach(function (r) {
          r.classList.remove('drop-before', 'drop-after');
        });
        var rect = row.getBoundingClientRect();
        row.classList.add(e.clientY < rect.top + rect.height / 2 ? 'drop-before' : 'drop-after');
        e.dataTransfer.dropEffect = 'move';
      });
      row.addEventListener('dragleave', function () {
        row.classList.remove('drop-before', 'drop-after');
      });
      row.addEventListener('drop', function (e) {
        e.preventDefault();
        if (!dragSrc || dragSrc === row) return;
        if (dragSrc.dataset.parent !== row.dataset.parent) return;

        var parentArr = getParentArray(row.dataset.parent);
        if (!parentArr) return;

        var srcId = dragSrc.dataset.id;
        var dstId = row.dataset.id;
        var srcIdx = parentArr.findIndex(function (f) { return f.id === srcId; });
        var dstIdx = parentArr.findIndex(function (f) { return f.id === dstId; });
        if (srcIdx === -1 || dstIdx === -1) return;

        var moved = parentArr.splice(srcIdx, 1)[0];
        var newDst = parentArr.findIndex(function (f) { return f.id === dstId; });
        parentArr.splice(row.classList.contains('drop-before') ? newDst : newDst + 1, 0, moved);
        if (saveItems(items)) render();
      });
    });
  }

  // ──────────────────────────────────────────────
  // 新增 / 編輯 Modal
  // ──────────────────────────────────────────────
  var editingId = null;
  var addingParentId = null;

  function getModalType() {
    var radios = document.querySelectorAll('input[name="faq-type"]');
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) return radios[i].value;
    }
    return 'item';
  }

  function setModalType(type) {
    document.querySelectorAll('input[name="faq-type"]').forEach(function (r) {
      r.checked = (r.value === type);
      var opt = r.closest('.faq-type-opt');
      if (opt) opt.classList.toggle('selected', r.value === type);
    });
    applyTypeUi(type);
  }

  function applyTypeUi(type) {
    var titleField = document.getElementById('faq-title-field');
    var qField = document.getElementById('faq-question-field');
    var aField = document.getElementById('faq-answer-field');
    var subtitle = document.getElementById('faq-modal-subtitle');
    if (type === 'group') {
      if (titleField) titleField.hidden = false;
      if (qField) qField.hidden = true;
      if (aField) aField.hidden = true;
      if (subtitle) subtitle.textContent = '分類標題為必填欄位';
    } else {
      if (titleField) titleField.hidden = true;
      if (qField) qField.hidden = false;
      if (aField) aField.hidden = false;
      if (subtitle) subtitle.textContent = '問題與答案均為必填欄位';
    }
  }

  function updateParentPathDisplay(parentId) {
    var parentField = document.getElementById('faq-parent-field');
    var pathEl = document.getElementById('faq-parent-path');
    if (!parentId) {
      if (parentField) parentField.hidden = true;
      return;
    }
    if (parentField) parentField.hidden = false;
    if (pathEl) {
      var res = findNode(parentId, items);
      pathEl.textContent = res ? (res.node.title || res.node.question || parentId) : parentId;
    }
  }

  function openAdd(parentId) {
    editingId = null;
    addingParentId = parentId || null;

    var childLevel = addingParentId ? (getNodeLevel(addingParentId) || 1) + 1 : 1;
    var typeField = document.getElementById('faq-type-field');
    var groupOpt = document.getElementById('faq-type-opt-group');

    document.getElementById('faq-modal-mode').textContent = '新增';

    if (childLevel >= 3) {
      // L3 只能是 item
      if (groupOpt) groupOpt.hidden = true;
      if (typeField) typeField.hidden = true;
      setModalType('item');
    } else {
      if (groupOpt) groupOpt.hidden = false;
      if (typeField) typeField.hidden = false;
      setModalType('item');
    }

    document.getElementById('faq-title').value = '';
    document.getElementById('faq-question').value = '';
    document.getElementById('faq-answer-editor').innerHTML = '';
    document.getElementById('faq-answer-source').value = '';
    document.getElementById('faq-enabled').checked = true;
    updateEnabledLabel();
    updateParentPathDisplay(addingParentId);
    showModal('faq-editor-modal');
    var focus = (getModalType() === 'group') ? document.getElementById('faq-title') : document.getElementById('faq-question');
    if (focus) focus.focus();
  }

  function openEdit(id) {
    var res = findNode(id, items);
    if (!res) return;
    var node = res.node;
    editingId = id;
    addingParentId = null;

    var type = node.type || 'item';
    document.getElementById('faq-modal-mode').textContent = '編輯';

    // 編輯時隱藏類型切換（不允許改變類型）
    var typeField = document.getElementById('faq-type-field');
    if (typeField) typeField.hidden = true;

    setModalType(type);

    if (type === 'group') {
      document.getElementById('faq-title').value = node.title || '';
    } else {
      document.getElementById('faq-question').value = node.question || '';
      document.getElementById('faq-answer-editor').innerHTML = node.answer || '';
      document.getElementById('faq-answer-source').value = node.answer || '';
    }

    document.getElementById('faq-enabled').checked = node.enabled !== false;
    updateEnabledLabel();

    var parentMap = buildParentMap(items, null, {});
    updateParentPathDisplay(parentMap[id]);

    showModal('faq-editor-modal');
    var focus = (type === 'group') ? document.getElementById('faq-title') : document.getElementById('faq-question');
    if (focus) focus.focus();
  }

  function saveEdit() {
    var enabled = document.getElementById('faq-enabled').checked;
    var type;

    if (editingId) {
      var existing = findNode(editingId, items);
      if (!existing) return;
      type = existing.node.type || 'item';
    } else {
      type = getModalType();
    }

    if (type === 'group') {
      var title = document.getElementById('faq-title').value.trim();
      if (!title) { alert('請填寫分類標題'); document.getElementById('faq-title').focus(); return; }

      if (editingId) {
        var er = findNode(editingId, items);
        if (er) { er.node.title = title; er.node.enabled = enabled; }
      } else {
        var newGroup = { id: genId(), type: 'group', title: title, enabled: enabled, children: [] };
        var arr = getParentArray(addingParentId);
        if (arr) arr.push(newGroup);
      }
    } else {
      var question = document.getElementById('faq-question').value.trim();
      if (!question) { alert('請填寫問題內容'); document.getElementById('faq-question').focus(); return; }
      var isSource = !document.getElementById('faq-answer-source').hidden;
      var answer = isSource
        ? document.getElementById('faq-answer-source').value.trim()
        : document.getElementById('faq-answer-editor').innerHTML.trim();
      if (!answer) { alert('請填寫答案內容'); document.getElementById('faq-answer-editor').focus(); return; }

      if (editingId) {
        var ir = findNode(editingId, items);
        if (ir) { ir.node.question = question; ir.node.answer = answer; ir.node.enabled = enabled; }
      } else {
        var newItem = { id: genId(), type: 'item', question: question, answer: answer, enabled: enabled };
        var iarr = getParentArray(addingParentId);
        if (iarr) iarr.push(newItem);
      }
    }

    if (saveItems(items)) {
      hideModal('faq-editor-modal');
      render();
      showToast(editingId ? '已更新' : '已新增');
    }
  }

  // ──────────────────────────────────────────────
  // 刪除確認 Modal
  // ──────────────────────────────────────────────
  var deletingId = null;

  function openDelete(id) {
    var res = findNode(id, items);
    if (!res) return;
    var node = res.node;
    deletingId = id;
    document.getElementById('faq-delete-preview').textContent = node.title || node.question || '此項目';

    var warnEl = document.getElementById('faq-delete-warn');
    if (warnEl) {
      if (node.type === 'group' && node.children && node.children.length > 0) {
        warnEl.hidden = false;
        warnEl.textContent = '⚠ 此分類下有 ' + node.children.length + ' 個子項目，將一併刪除。';
      } else {
        warnEl.hidden = true;
      }
    }
    showModal('faq-delete-modal');
  }

  function confirmDelete() {
    if (!deletingId) return;
    var res = findNode(deletingId, items);
    if (res) res.parent.splice(res.index, 1);
    if (saveItems(items)) {
      hideModal('faq-delete-modal');
      render();
      showToast('已刪除');
    }
    deletingId = null;
  }

  // ──────────────────────────────────────────────
  // Modal 開關
  // ──────────────────────────────────────────────
  function showModal(id) { document.getElementById(id).removeAttribute('hidden'); }
  function hideModal(id) { document.getElementById(id).setAttribute('hidden', ''); }

  // ──────────────────────────────────────────────
  // 答案編輯器：工具列 + HTML 原始碼切換
  // ──────────────────────────────────────────────
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

  function updateEnabledLabel() {
    var chk = document.getElementById('faq-enabled');
    var label = document.getElementById('faq-enabled-label');
    if (label) label.textContent = chk.checked ? '啟用' : '停用';
  }

  function resetSourceMode() {
    sourceMode = false;
    var editor = document.getElementById('faq-answer-editor');
    var sourceArea = document.getElementById('faq-answer-source');
    if (editor) editor.hidden = false;
    if (sourceArea) sourceArea.hidden = true;
    var btn = document.getElementById('faq-toggle-source');
    if (btn) btn.classList.remove('active');
  }

  // ──────────────────────────────────────────────
  // 初始化
  // ──────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    render();
    bindToolbar();

    document.getElementById('btn-faq-add').addEventListener('click', function () { openAdd(null); });
    document.getElementById('faq-save').addEventListener('click', saveEdit);
    document.getElementById('faq-delete-confirm').addEventListener('click', confirmDelete);
    document.getElementById('faq-enabled').addEventListener('change', updateEnabledLabel);

    // 類型切換 radio
    document.querySelectorAll('input[name="faq-type"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.querySelectorAll('.faq-type-opt').forEach(function (opt) { opt.classList.remove('selected'); });
        r.closest('.faq-type-opt').classList.add('selected');
        applyTypeUi(r.value);
      });
    });

    // Modal 關閉
    document.querySelectorAll('.faq-modal').forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.closest('[data-close]') || e.target === modal.querySelector('.faq-modal-backdrop')) {
          modal.setAttribute('hidden', '');
          resetSourceMode();
        }
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.faq-modal:not([hidden])').forEach(function (m) {
          m.setAttribute('hidden', '');
        });
        resetSourceMode();
      }
    });
  });
})();
