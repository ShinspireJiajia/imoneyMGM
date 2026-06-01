/* ==========================================================
   admin-share-rules.js
   分享制度說明後台維護：項次新增/編輯/刪除/排序/樣式選擇
   持久化：localStorage 'mgm_share_rules'
   ========================================================== */

(function () {
  'use strict';

  // ---------- 預設條款 ----------
  const DEFAULT_RULES = [
    {
      id: 'sr-1',
      title: '專屬固定推薦碼',
      style: 'normal',
      content: `<p>每位推薦人（會員 / 員工）皆擁有一組<strong>專屬且固定</strong>之推薦碼，可長期使用、無需更換。已分享出去的連結將永久歸屬於您。</p>`,
    },
    {
      id: 'sr-2-flow',
      title: '分享流程',
      style: 'flow',
      content: `<p>1. 取得您的專屬推薦碼</p><p>2. 透過 LINE OA / 簡訊複製連結分享</p><p>3. 訪客點擊後寫入 7 天 Cookie 追蹤</p>`,
    },
    {
      id: 'sr-3',
      title: '防弊與歸屬判定原則',
      style: 'normal',
      content: `
        <h3>（一）阻擋自我推薦</h3>
        <p>送出表單時系統將比對「申請人手機號碼／身分證字號」是否與該推薦碼擁有者完全相符，若相符該筆貸款仍正常進入審核，但<strong>系統將自動註銷該訂單的推薦分潤資格</strong>。</p>
        <h3>（二）首次送單歸屬權</h3>
        <p>所有歸屬以「首次成功送單時所使用的優惠碼」為唯一基準。</p>
      `.trim(),
    },
    {
      id: 'sr-4-quote',
      title: '推薦歸屬須知（引用）',
      style: 'quote',
      content: `<p>若同一位親友收到多組推薦連結，獎金歸屬將以「該親友首次成功送出表單時所使用的優惠碼」為準。已送出之表單<strong>無法</strong>變更推薦歸屬。</p>`,
    },
    {
      id: 'sr-5',
      title: '獎金快照點機制（規則不溯及既往）',
      style: 'normal',
      content: `<p>當訪客<strong>成功送出諮詢表單的當下</strong>，系統會將該產品當下的「固定底包、抽成比例、發放上限」鎖定為快照資料。</p><p>後續無論審核多久、行銷如何更改後台參數，最終獎金一律以「送單當下的快照」進行計算，<strong>規則絕不溯及既往</strong>。</p>`,
    },
    {
      id: 'sr-6-warn',
      title: '獎金動態計算須知（重要免責聲明）',
      style: 'warning',
      content: `<p>本平台推薦獎金依據「<strong>訪客實際成功送出申請表單當下</strong>」之平台最新活動規則與獎金基準進行計算，<strong>非以推薦人轉發連結時之活動為準</strong>。本平台保留隨時調整分潤比例與金額之權利。</p>`,
    },
    {
      id: 'sr-7',
      title: '獎金提領與稅務',
      style: 'normal',
      content: `<ul><li>支援單筆或<strong>一次性多筆勾選</strong>合併申請。</li><li>提領方式分為「現場領取」與「匯款入帳」兩種。</li><li>首次提領需上傳身分證正反面與存摺封面，後續提領自動沿用。</li><li>本筆獎金將計入年度「執行業務所得 / 其他所得」申報。</li></ul>`,
    },
  ];

  const STORAGE_KEY = 'mgm_share_rules';

  function loadRules() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_RULES.map((r) => ({ ...r }));
  }

  function saveRules(rules) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
      return true;
    } catch (e) {
      alert('儲存失敗：' + (e && e.message ? e.message : '不明原因'));
      return false;
    }
  }

  let rules = loadRules();

  // ---------- 樣式 metadata ----------
  const STYLE_META = {
    normal:  { label: '一般段落', icon: 'fa-paragraph',          tone: 'tone-normal'  },
    warning: { label: '警示框',   icon: 'fa-triangle-exclamation', tone: 'tone-warning' },
    quote:   { label: '引用框',   icon: 'fa-quote-left',          tone: 'tone-quote'   },
    flow:    { label: '流程步驟', icon: 'fa-diagram-project',     tone: 'tone-flow'    },
  };

  // ---------- 預覽 HTML 產生（與前台一致的轉換邏輯） ----------
  function previewItemHtml(rule, idx) {
    const meta = STYLE_META[rule.style] || STYLE_META.normal;
    if (rule.style === 'flow') {
      // 把每個 <p>1. xxx</p> 轉成步驟卡
      const div = document.createElement('div');
      div.innerHTML = rule.content;
      const items = [...div.querySelectorAll('p,li')]
        .map((p) => p.textContent.trim())
        .filter(Boolean);
      const steps = items.map((t) => `<div class="sr-prev-flow-step">${t}</div>`).join('');
      return `<div class="sr-prev-flow"><div class="sr-prev-h2"><span class="num">${idx + 1}</span>${rule.title}</div>${steps}</div>`;
    }
    if (rule.style === 'warning') {
      return `<div class="sr-prev-warn"><div class="sr-prev-h2 warn"><span class="num warn">!</span>${rule.title}</div><div class="sr-prev-quote warn">${rule.content}</div></div>`;
    }
    if (rule.style === 'quote') {
      return `<div class="sr-prev-quote"><div class="sr-prev-h2"><span class="num">${idx + 1}</span>${rule.title}</div><div class="sr-prev-quote-inner">${rule.content}</div></div>`;
    }
    return `<div class="sr-prev"><div class="sr-prev-h2"><span class="num">${idx + 1}</span>${rule.title}</div><div class="sr-prev-body">${rule.content}</div></div>`;
  }

  // ---------- Render 後台項次列表 ----------
  function render() {
    const list = document.getElementById('sr-list');
    if (!list) return;
    list.innerHTML = rules.map((r, i) => {
      const meta = STYLE_META[r.style] || STYLE_META.normal;
      return `
        <article class="sr-row" data-id="${r.id}">
          <div class="sr-row-handle" title="拖曳排序" draggable="true"><i class="fa-solid fa-up-down"></i></div>
          <div class="sr-row-num">${i + 1}</div>
          <div class="sr-row-main">
            <div class="sr-row-title">${escapeHtml(r.title || '(未命名項次)')}</div>
            <div class="sr-row-meta">
              <span class="sr-style-pill ${meta.tone}">
                <i class="fa-solid ${meta.icon}"></i>${meta.label}
              </span>
              <span class="sr-row-preview">${stripHtml(r.content).slice(0, 60) || '（無內容）'}</span>
            </div>
          </div>
          <div class="sr-row-actions">
            <button type="button" class="action-btn" data-act="edit"><i class="fa-solid fa-pen-to-square"></i>編輯</button>
            <button type="button" class="action-btn danger" data-act="delete"><i class="fa-solid fa-trash"></i></button>
          </div>
        </article>
      `;
    }).join('');

    bindRowActions();
    bindDragDrop();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function stripHtml(s) {
    const d = document.createElement('div');
    d.innerHTML = s || '';
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function bindRowActions() {
    document.querySelectorAll('.sr-row').forEach((row) => {
      const id = row.dataset.id;
      row.querySelectorAll('[data-act]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.act;
          const idx = rules.findIndex((r) => r.id === id);
          if (idx < 0) return;
          if (act === 'edit') {
            openEditor(rules[idx]);
          } else if (act === 'delete') {
            if (!confirm('確定刪除此項次？')) return;
            rules.splice(idx, 1);
            saveRules(rules);
            render();
            toast('已刪除項次。');
          }
        });
      });
    });
  }

  // ---------- 拖曳排序 ----------
  let dragSrcId = null;
  let dropPos = 'before';
  function bindDragDrop() {
    document.querySelectorAll('.sr-row').forEach((row) => {
      const handle = row.querySelector('.sr-row-handle');
      if (!handle) return;

      handle.addEventListener('dragstart', (e) => {
        dragSrcId = row.dataset.id;
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', dragSrcId); } catch {}
      });
      handle.addEventListener('dragend', () => {
        row.classList.remove('dragging');
        dragSrcId = null;
        dropPos = 'before';
        document.querySelectorAll('.sr-row.drop-target, .sr-row.drop-before, .sr-row.drop-after').forEach((r) => {
          r.classList.remove('drop-target', 'drop-before', 'drop-after');
        });
      });

      row.addEventListener('dragover', (e) => {
        if (!dragSrcId || dragSrcId === row.dataset.id) return;
        e.preventDefault();
        const rect = row.getBoundingClientRect();
        dropPos = (e.clientY - rect.top) > rect.height / 2 ? 'after' : 'before';
        row.classList.toggle('drop-before', dropPos === 'before');
        row.classList.toggle('drop-after', dropPos === 'after');
        row.classList.add('drop-target');
      });
      row.addEventListener('dragleave', () => {
        row.classList.remove('drop-target', 'drop-before', 'drop-after');
      });
      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drop-target', 'drop-before', 'drop-after');
        if (!dragSrcId || dragSrcId === row.dataset.id) return;
        const srcIdx = rules.findIndex((r) => r.id === dragSrcId);
        const tgtIdx = rules.findIndex((r) => r.id === row.dataset.id);
        if (srcIdx < 0 || tgtIdx < 0) return;
        const [moved] = rules.splice(srcIdx, 1);
        let insertIdx = tgtIdx;
        if (srcIdx < tgtIdx) insertIdx -= 1;
        if (dropPos === 'after') insertIdx += 1;
        rules.splice(insertIdx, 0, moved);
        saveRules(rules);
        render();
        toast('已更新項次順序。');
      });
    });
  }

  // ==================== Modal 編輯器 ====================
  let editing = null; // { id, isNew }

  function openEditor(rule) {
    const isNew = !rule;
    editing = {
      id: isNew ? 'sr-' + Date.now().toString(36) : rule.id,
      isNew,
    };

    document.getElementById('sr-modal-mode').textContent = isNew ? '新增項次' : '編輯項次';
    document.getElementById('sr-title').value = rule ? rule.title : '';

    // style radios
    const style = rule ? rule.style : 'normal';
    document.querySelectorAll('input[name="sr-style"]').forEach((r) => {
      r.checked = (r.value === style);
    });

    const editor = document.getElementById('sr-editor');
    const source = document.getElementById('sr-source');
    editor.innerHTML = rule ? rule.content : '';
    source.value = editor.innerHTML;
    setEditorMode('visual');

    document.getElementById('sr-editor-modal').hidden = false;
    setTimeout(() => document.getElementById('sr-title').focus(), 0);
  }

  function closeEditor() {
    document.getElementById('sr-editor-modal').hidden = true;
    editing = null;
  }

  let editorMode = 'visual';
  function setEditorMode(mode) {
    editorMode = mode;
    const editor = document.getElementById('sr-editor');
    const source = document.getElementById('sr-source');
    const toolbar = document.getElementById('sr-toolbar');
    const btn = document.getElementById('sr-toggle-source');

    if (mode === 'source') {
      source.value = editor.innerHTML;
      editor.hidden = true;
      source.hidden = false;
      toolbar.classList.add('disabled');
      btn.innerHTML = '<i class="fa-solid fa-eye"></i>所見即所得';
    } else {
      editor.innerHTML = source.value || editor.innerHTML;
      editor.hidden = false;
      source.hidden = true;
      toolbar.classList.remove('disabled');
      btn.innerHTML = '<i class="fa-solid fa-code"></i>HTML 原始碼';
    }
  }

  function exec(cmd, value) {
    if (editorMode === 'source') return;
    document.getElementById('sr-editor').focus();
    document.execCommand(cmd, false, value || null);
  }

  function bindEditorModal() {
    // 工具列
    document.querySelectorAll('#sr-toolbar [data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.value || null;
        if (cmd === 'createLink') {
          const url = prompt('請輸入連結網址：', 'https://');
          if (url) exec(cmd, url);
        } else {
          exec(cmd, val);
        }
      });
    });

    // 圖片上傳
    document.getElementById('sr-img-input').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) { alert('請選擇圖片檔'); return; }
      if (file.size > 1024 * 1024 * 2) {
        if (!confirm('圖片大於 2MB，可能會超過儲存上限，仍要繼續嗎？')) return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        exec('insertHTML', `<img src="${dataUrl}" alt="" style="max-width:100%;height:auto;border-radius:8px;display:block;margin:8px 0;" />`);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });

    document.getElementById('sr-toggle-source').addEventListener('click', () => {
      setEditorMode(editorMode === 'visual' ? 'source' : 'visual');
    });

    document.querySelectorAll('#sr-editor-modal [data-close]').forEach((el) => {
      el.addEventListener('click', closeEditor);
    });

    document.getElementById('sr-save').addEventListener('click', () => {
      if (!editing) return;
      const title = document.getElementById('sr-title').value.trim();
      if (!title) { alert('請輸入項次標題'); return; }

      const styleRadio = document.querySelector('input[name="sr-style"]:checked');
      const style = styleRadio ? styleRadio.value : 'normal';

      const editor = document.getElementById('sr-editor');
      const source = document.getElementById('sr-source');
      const content = (editorMode === 'source') ? source.value : editor.innerHTML;

      if (editing.isNew) {
        rules.push({ id: editing.id, title, style, content });
      } else {
        const idx = rules.findIndex((r) => r.id === editing.id);
        if (idx >= 0) rules[idx] = { ...rules[idx], title, style, content };
      }
      if (saveRules(rules)) {
        toast(editing.isNew ? '已新增項次。' : '已儲存項次。');
        closeEditor();
        render();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const m = document.getElementById('sr-editor-modal');
        if (m && !m.hidden) closeEditor();
      }
    });
  }

  // ==================== Toast ====================
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

  // ==================== 預覽 ====================
  function preview() {
    if (window.parent && window.parent.AdminRouter) {
      // 開新分頁直接看前台
      window.open('../index.html#share-rules', '_blank');
    } else {
      window.open('../pages/share-rules.html', '_blank');
    }
  }

  // ==================== 初始化 ====================
  document.addEventListener('DOMContentLoaded', () => {
    bindEditorModal();
    render();

    document.getElementById('btn-sr-add').addEventListener('click', () => openEditor(null));
    document.getElementById('btn-sr-preview').addEventListener('click', preview);
  });
})();
