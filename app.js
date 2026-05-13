'use strict';
// ============================================================
// DevPocket — app.js
// Core: registry, routing, sidebar, theme, shared UI helpers
// ============================================================

const DevPocket = (() => {
  const _tools = [];
  const _categories = [];
  let _activeTool = null;
  let _favorites = [];
  let _recent = [];

  // ---- Icon helpers ----
  function _icon(name) {
    return `<i data-lucide="${name}" class="dp-icon"></i>`;
  }

  function _createIcons() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }

  // ---- Registry ----
  function registerCategory(cat) { _categories.push(cat); }
  function registerTool(tool) { _tools.push(tool); }

  // ---- Persistence ----
  function _loadState() {
    try {
      _favorites = JSON.parse(localStorage.getItem('dp_fav') || '[]');
      _recent    = JSON.parse(localStorage.getItem('dp_recent') || '[]');
      const last = localStorage.getItem('dp_last');
      if (last && _tools.find(t => t.id === last)) navigateTo(last);
    } catch(_) {}
  }

  function _saveState() {
    try {
      localStorage.setItem('dp_fav',    JSON.stringify(_favorites));
      localStorage.setItem('dp_recent', JSON.stringify(_recent));
      if (_activeTool) localStorage.setItem('dp_last', _activeTool);
    } catch(_) {}
  }

  // ---- Toast ----
  function toast(msg, type = '', duration = 2500) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => {
      el.style.cssText = 'opacity:0;transform:translateX(20px);transition:all 0.2s';
      setTimeout(() => el.remove(), 220);
    }, duration);
  }

  // ---- Clipboard ----
  function copy(text) {
    if (!text && text !== 0) return;
    const str = String(text);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str)
        .then(() => toast('Copied!', 'success'))
        .catch(() => _fallbackCopy(str));
    } else {
      _fallbackCopy(str);
    }
  }

  function _fallbackCopy(str) {
    const ta = Object.assign(document.createElement('textarea'), { value: str });
    Object.assign(ta.style, { position: 'fixed', opacity: '0' });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copied!', 'success');
  }

  // ---- Download ----
  function download(filename, content, mime = 'text/plain') {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- Navigation ----
  function navigateTo(toolId) {
    const tool = _tools.find(t => t.id === toolId);
    if (!tool) return;

    _activeTool = toolId;
    _recent = [toolId, ..._recent.filter(id => id !== toolId)].slice(0, 10);
    _saveState();

    // Sidebar active state
    document.querySelectorAll('.tool-item').forEach(el =>
      el.classList.toggle('active', el.dataset.toolId === toolId)
    );

    // Breadcrumb
    const cat = _categories.find(c => c.id === tool.category);
    document.getElementById('breadcrumb').innerHTML =
      `<span>${cat ? cat.name : ''}</span><span style="color:var(--text-muted)"> / </span><span class="current">${tool.name}</span>`;

    // Fav button
    const favBtn = document.getElementById('favBtn');
    favBtn.innerHTML = _icon('star');
    favBtn.classList.toggle('favorited', _favorites.includes(toolId));

    // Render
    document.getElementById('welcomeScreen').classList.add('hidden');
    const content = document.getElementById('toolContent');
    content.classList.remove('hidden');
    content.innerHTML = `
      <div class="tool-header">
        <div class="tool-title">${_icon(tool.icon || 'wrench')} ${tool.name}</div>
        ${tool.description ? `<div class="tool-description">${tool.description}</div>` : ''}
      </div>`;
    tool.render(content);
    _createIcons();

    if (window.innerWidth <= 768) _closeMobileSidebar();
  }

  // ---- Sidebar ----
  function _buildSidebar() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = '';
    const sorted = [..._categories].sort((a, b) => (a.order || 99) - (b.order || 99));

    sorted.forEach(cat => {
      const catTools = _tools.filter(t => t.category === cat.id);
      if (!catTools.length) return;

      const wrap = document.createElement('div');
      wrap.className = 'nav-category';
      wrap.dataset.catId = cat.id;

      const hdr = document.createElement('div');
      hdr.className = 'cat-header';
      hdr.innerHTML = `<span class="cat-arrow">${_icon('chevron-down')}</span><span class="cat-icon">${_icon(cat.icon)}</span><span class="cat-label">${cat.name}</span>`;
      hdr.addEventListener('click', () => wrap.classList.toggle('collapsed'));

      const ul = document.createElement('ul');
      ul.className = 'cat-tools';
      catTools.forEach(tool => {
        const li = document.createElement('li');
        li.className = 'tool-item';
        li.dataset.toolId = tool.id;
        li.title = tool.name;
        li.innerHTML = `<span class="tool-item-icon">${_icon(tool.icon || 'wrench')}</span><span class="tool-item-name">${tool.name}</span>`;
        li.addEventListener('click', () => navigateTo(tool.id));
        ul.appendChild(li);
      });

      wrap.appendChild(hdr);
      wrap.appendChild(ul);
      nav.appendChild(wrap);
    });

    const el = document.getElementById('toolCount');
    if (el) el.textContent = _tools.length;
    _createIcons();
  }

  // ---- Search ----
  function _initSearch() {
    document.getElementById('toolSearch').addEventListener('input', function() {
      const q = this.value.toLowerCase().trim();
      document.querySelectorAll('.nav-category').forEach(catEl => {
        let visible = false;
        catEl.querySelectorAll('.tool-item').forEach(el => {
          const match = !q || el.querySelector('.tool-item-name').textContent.toLowerCase().includes(q);
          el.style.display = match ? '' : 'none';
          if (match) visible = true;
        });
        catEl.style.display = visible ? '' : 'none';
        if (q && visible) catEl.classList.remove('collapsed');
      });
    });
  }

  // ---- Theme ----
  function _initTheme() {
    const saved = localStorage.getItem('dp_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    _updateThemeBtn(saved);
  }

  function _toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dp_theme', next);
    _updateThemeBtn(next);
  }

  function _updateThemeBtn(theme) {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.querySelector('.theme-icon').innerHTML = _icon(theme === 'dark' ? 'sun' : 'moon');
    btn.querySelector('.theme-label').textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    _createIcons();
  }

  // ---- Sidebar collapse (desktop) ----
  function _initSidebarToggle() {
    document.getElementById('sidebarToggle').addEventListener('click', () =>
      document.getElementById('sidebar').classList.toggle('collapsed')
    );
  }

  // ---- Mobile sidebar ----
  function _initMobileSidebar() {
    document.getElementById('menuBtn').addEventListener('click', () => {
      document.getElementById('sidebar').classList.add('mobile-open');
      document.getElementById('sidebarOverlay').classList.add('visible');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', _closeMobileSidebar);
  }

  function _closeMobileSidebar() {
    document.getElementById('sidebar').classList.remove('mobile-open');
    document.getElementById('sidebarOverlay').classList.remove('visible');
  }

  // ---- Favorites ----
  function _initFavBtn() {
    document.getElementById('favBtn').addEventListener('click', () => {
      if (!_activeTool) return;
      const isFav = _favorites.includes(_activeTool);
      _favorites = isFav
        ? _favorites.filter(id => id !== _activeTool)
        : [..._favorites, _activeTool];
      const btn = document.getElementById('favBtn');
      btn.innerHTML = _icon('star');
      btn.classList.toggle('favorited', !isFav);
      _createIcons();
      _saveState();
      toast(isFav ? 'Removed from favorites' : 'Added to favorites', isFav ? '' : 'success');
    });
  }

  // ---- Shared UI helpers (used by tool files) ----
  const ui = {
    textarea(id, label, placeholder = '', mono = true) {
      return `<div class="form-group">
        <label class="form-label" for="${id}">${label}</label>
        <textarea id="${id}" placeholder="${placeholder}"${mono ? ' class="mono"' : ''}></textarea>
      </div>`;
    },
    input(id, label, placeholder = '', type = 'text', extra = '') {
      return `<div class="form-group">
        <label class="form-label" for="${id}">${label}</label>
        <input type="${type}" id="${id}" placeholder="${placeholder}" ${extra} />
      </div>`;
    },
    select(id, label, options) {
      const opts = options.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
      return `<div class="form-group">
        <label class="form-label" for="${id}">${label}</label>
        <select id="${id}">${opts}</select>
      </div>`;
    },
    btnRow(buttons) {
      return `<div class="btn-row">${buttons.map(b =>
        `<button class="btn ${b.cls || 'btn-secondary'}" id="${b.id || ''}">${b.label}</button>`
      ).join('')}</div>`;
    },
    output(id, label = 'Output', withCopy = true) {
      return `<div class="form-group">
        <label class="form-label">${label}</label>
        <div class="output-wrapper">
          <div class="output-area" id="${id}"></div>
          ${withCopy ? `<button class="output-copy-btn" data-copy-target="${id}">Copy</button>` : ''}
        </div>
      </div>`;
    },
    statChip(label, valueId) {
      return `<div class="stat-chip"><span>${label}</span><strong id="${valueId}">—</strong></div>`;
    },
    msg(text, type = 'info') {
      return `<div class="msg msg-${type}">${text}</div>`;
    },
    card(innerHTML) {
      return `<div class="card">${innerHTML}</div>`;
    },
    tabs(tabs) {
      const bar = tabs.map((t, i) =>
        `<button class="tab-btn${i === 0 ? ' active' : ''}" data-tab="${t.id}">${t.label}</button>`
      ).join('');
      const panels = tabs.map((t, i) =>
        `<div class="tab-panel${i === 0 ? ' active' : ''}" id="panel-${t.id}">${t.content}</div>`
      ).join('');
      return `<div class="tab-bar">${bar}</div>${panels}`;
    },
  };

  // Wire up copy buttons delegated from output areas
  function _initCopyDelegation() {
    document.getElementById('toolContent').addEventListener('click', e => {
      const btn = e.target.closest('[data-copy-target]');
      if (!btn) return;
      const el = document.getElementById(btn.dataset.copyTarget);
      if (el) copy(el.textContent);
    });
  }

  // Wire up tab bars delegated
  function _initTabDelegation() {
    document.getElementById('toolContent').addEventListener('click', e => {
      const btn = e.target.closest('.tab-btn');
      if (!btn) return;
      const bar = btn.closest('.tab-bar');
      if (!bar) return;
      bar.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const card = bar.closest('.card') || bar.parentElement;
      card.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      const panel = card.querySelector(`#panel-${btn.dataset.tab}`);
      if (panel) panel.classList.add('active');
    });
  }

  // ---- Init ----
  function init() {
    _initTheme();
    _buildSidebar();
    _initSearch();
    _initSidebarToggle();
    _initMobileSidebar();
    _initFavBtn();
    _initCopyDelegation();
    _initTabDelegation();
    _loadState();
    _createIcons();

    document.getElementById('themeToggle').addEventListener('click', _toggleTheme);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const s = document.getElementById('toolSearch');
        s.focus(); s.select();
      }
    });
  }

  return { registerCategory, registerTool, navigateTo, toast, copy, download, ui, icon: _icon, init };
})();

window.addEventListener('DOMContentLoaded', () => DevPocket.init());
