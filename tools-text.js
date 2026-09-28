'use strict';
// ============================================================
// DevPocket — tools-text.js
// Text Utilities: statistics, case conversion, cleanup, diff
// ============================================================

DevPocket.registerCategory({ id: 'text', name: 'Text Utilities', icon: 'type', order: 1 });

// ---- Text Statistics ----
DevPocket.registerTool({
  id: 'text-stats',
  name: 'Text Statistics',
  category: 'text',
  icon: 'bar-chart-2',
  description: 'Count words, characters, lines, paragraphs and estimate reading time.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('tsInput', 'Input Text', 'Paste or type your text here…')}
      <div class="stats-row">
        ${DevPocket.ui.statChip('Words', 'tsWords')}
        ${DevPocket.ui.statChip('Characters', 'tsChars')}
        ${DevPocket.ui.statChip('No Spaces', 'tsNoSpace')}
        ${DevPocket.ui.statChip('Lines', 'tsLines')}
        ${DevPocket.ui.statChip('Paragraphs', 'tsParas')}
        ${DevPocket.ui.statChip('Sentences', 'tsSents')}
        ${DevPocket.ui.statChip('Read Time', 'tsRead')}
      </div>
      ${DevPocket.ui.btnRow([{ id: 'tsClear', label: 'Clear', cls: 'btn-danger btn-sm' }])}
    `));

    const input = container.querySelector('#tsInput');

    function update() {
      const t = input.value;
      const words    = t.trim() ? t.trim().split(/\s+/).filter(Boolean).length : 0;
      const chars    = t.length;
      const noSpace  = t.replace(/\s/g, '').length;
      const lines    = t ? t.split('\n').length : 0;
      const paras    = t.trim() ? t.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
      const sents    = t.trim() ? (t.match(/[^.!?]*[.!?]+/g) || []).length : 0;
      const mins     = Math.max(1, Math.round(words / 200));

      container.querySelector('#tsWords').textContent   = words.toLocaleString();
      container.querySelector('#tsChars').textContent   = chars.toLocaleString();
      container.querySelector('#tsNoSpace').textContent = noSpace.toLocaleString();
      container.querySelector('#tsLines').textContent   = lines.toLocaleString();
      container.querySelector('#tsParas').textContent   = paras.toLocaleString();
      container.querySelector('#tsSents').textContent   = sents.toLocaleString();
      container.querySelector('#tsRead').textContent    = words < 200 ? '< 1 min' : `${mins} min`;
    }

    input.addEventListener('input', update);
    container.querySelector('#tsClear').addEventListener('click', () => { input.value = ''; update(); });
  }
});

// ---- Case Conversion ----
DevPocket.registerTool({
  id: 'case-convert',
  name: 'Case Conversion',
  category: 'text',
  icon: 'case-sensitive',
  description: 'Convert text between UPPERCASE, camelCase, snake_case, kebab-case and more.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('ccInput', 'Input Text', 'Enter text to convert…')}
      <div class="btn-grid" id="ccBtns">
        <button class="btn btn-secondary" data-fn="upper">UPPERCASE</button>
        <button class="btn btn-secondary" data-fn="lower">lowercase</button>
        <button class="btn btn-secondary" data-fn="title">Title Case</button>
        <button class="btn btn-secondary" data-fn="sentence">Sentence case</button>
        <button class="btn btn-secondary" data-fn="camel">camelCase</button>
        <button class="btn btn-secondary" data-fn="pascal">PascalCase</button>
        <button class="btn btn-secondary" data-fn="snake">snake_case</button>
        <button class="btn btn-secondary" data-fn="kebab">kebab-case</button>
        <button class="btn btn-secondary" data-fn="constant">CONSTANT_CASE</button>
        <button class="btn btn-secondary" data-fn="dot">dot.case</button>
        <button class="btn btn-secondary" data-fn="sponge">SpOnGeCaSe</button>
        <button class="btn btn-secondary" data-fn="inverse">iNVERT cASE</button>
      </div>
      ${DevPocket.ui.output('ccOutput', 'Output')}
      ${DevPocket.ui.btnRow([{ id: 'ccClear', label: 'Clear', cls: 'btn-danger btn-sm' }])}
    `));

    const _words = s => s.replace(/[_\-\.]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').trim().split(/\s+/).filter(Boolean);

    const fns = {
      upper:    s => s.toUpperCase(),
      lower:    s => s.toLowerCase(),
      title:    s => _words(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(' '),
      sentence: s => { const t = s.toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); },
      camel:    s => { const ws = _words(s); return ws[0].toLowerCase() + ws.slice(1).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''); },
      pascal:   s => _words(s).map(w => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
      snake:    s => _words(s).map(w => w.toLowerCase()).join('_'),
      kebab:    s => _words(s).map(w => w.toLowerCase()).join('-'),
      constant: s => _words(s).map(w => w.toUpperCase()).join('_'),
      dot:      s => _words(s).map(w => w.toLowerCase()).join('.'),
      sponge:   s => s.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join(''),
      inverse:  s => s.split('').map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join(''),
    };

    container.querySelector('#ccBtns').addEventListener('click', e => {
      const fn = fns[e.target.dataset.fn];
      if (!fn) return;
      const text = container.querySelector('#ccInput').value;
      if (!text.trim()) { DevPocket.toast('Enter some text first', 'error'); return; }
      container.querySelector('#ccOutput').textContent = fn(text);
    });

    container.querySelector('#ccClear').addEventListener('click', () => {
      container.querySelector('#ccInput').value = '';
      container.querySelector('#ccOutput').textContent = '';
    });
  }
});

// ---- Text Cleanup ----
DevPocket.registerTool({
  id: 'text-cleanup',
  name: 'Text Cleanup',
  category: 'text',
  icon: 'eraser',
  description: 'Trim spaces, remove empty lines, extract emails/URLs, generate slugs, and more.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('tcInput', 'Input Text', 'Paste text to clean up…')}
      <div class="btn-grid" id="tcBtns">
        <button class="btn btn-secondary" data-fn="trimSpaces">Trim Extra Spaces</button>
        <button class="btn btn-secondary" data-fn="removeEmpty">Remove Empty Lines</button>
        <button class="btn btn-secondary" data-fn="removeDups">Remove Duplicates</button>
        <button class="btn btn-secondary" data-fn="sortAsc">Sort Lines A→Z</button>
        <button class="btn btn-secondary" data-fn="sortDesc">Sort Lines Z→A</button>
        <button class="btn btn-secondary" data-fn="reverseText">Reverse Text</button>
        <button class="btn btn-secondary" data-fn="reverseLines">Reverse Lines</button>
        <button class="btn btn-secondary" data-fn="stripSpecial">Remove Special Chars</button>
        <button class="btn btn-secondary" data-fn="stripEmoji">Remove Emojis</button>
        <button class="btn btn-secondary" data-fn="extractEmails">Extract Emails</button>
        <button class="btn btn-secondary" data-fn="extractUrls">Extract URLs</button>
        <button class="btn btn-secondary" data-fn="toSlug">Slug Generator</button>
        <button class="btn btn-secondary" data-fn="addLineNums">Add Line Numbers</button>
        <button class="btn btn-secondary" data-fn="stripLineNums">Strip Line Numbers</button>
        <button class="btn btn-secondary" data-fn="trimLines">Trim Each Line</button>
        <button class="btn btn-secondary" data-fn="collapseNewlines">Collapse Newlines</button>
      </div>
      ${DevPocket.ui.output('tcOutput', 'Output')}
      ${DevPocket.ui.btnRow([
        { id: 'tcSwap', label: '↓ Use as Input', cls: 'btn-secondary btn-sm' },
        { id: 'tcClear', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
    `));

    const fns = {
      trimSpaces:      s => s.replace(/[^\S\n]+/g, ' ').split('\n').map(l => l.trim()).join('\n'),
      removeEmpty:     s => s.split('\n').filter(l => l.trim()).join('\n'),
      removeDups:      s => [...new Set(s.split('\n'))].join('\n'),
      sortAsc:         s => s.split('\n').sort((a, b) => a.localeCompare(b)).join('\n'),
      sortDesc:        s => s.split('\n').sort((a, b) => b.localeCompare(a)).join('\n'),
      reverseText:     s => [...s].reverse().join(''),
      reverseLines:    s => s.split('\n').reverse().join('\n'),
      stripSpecial:    s => s.replace(/[^a-zA-Z0-9\s\n]/g, ''),
      stripEmoji:      s => s.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}\u{1F300}-\u{1F9FF}]/gu, ''),
      extractEmails:   s => { const m = [...new Set(s.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])]; return m.length ? m.join('\n') : '(no emails found)'; },
      extractUrls:     s => { const m = [...new Set(s.match(/https?:\/\/[^\s"'<>)\]]+/g) || [])]; return m.length ? m.join('\n') : '(no URLs found)'; },
      toSlug:          s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      addLineNums:     s => s.split('\n').map((l, i) => `${String(i + 1).padStart(3, ' ')}  ${l}`).join('\n'),
      stripLineNums:   s => s.split('\n').map(l => l.replace(/^\s*\d+\s+/, '')).join('\n'),
      trimLines:       s => s.split('\n').map(l => l.trim()).join('\n'),
      collapseNewlines:s => s.replace(/\n{3,}/g, '\n\n'),
    };

    const input  = container.querySelector('#tcInput');
    const output = container.querySelector('#tcOutput');

    container.querySelector('#tcBtns').addEventListener('click', e => {
      const fn = fns[e.target.dataset.fn];
      if (!fn) return;
      if (!input.value) { DevPocket.toast('Enter some text first', 'error'); return; }
      output.textContent = fn(input.value);
    });

    container.querySelector('#tcSwap').addEventListener('click', () => {
      if (output.textContent) input.value = output.textContent;
    });

    container.querySelector('#tcClear').addEventListener('click', () => {
      input.value = '';
      output.textContent = '';
    });
  }
});

// ---- Text Diff ----
DevPocket.registerTool({
  id: 'text-diff',
  name: 'Text Diff',
  category: 'text',
  icon: 'diff',
  description: 'Compare two texts with inline and side-by-side diff highlighting.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="grid-2">
        ${DevPocket.ui.textarea('tdLeft',  'Original', 'Paste original text…')}
        ${DevPocket.ui.textarea('tdRight', 'Modified', 'Paste modified text…')}
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'tdCompare', label: 'Compare ↔', cls: 'btn-primary' },
        { id: 'tdClear',   label: 'Clear',      cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.tabs([
        {
          id: 'inline', label: 'Inline Diff',
          content: `<div class="diff-container" id="tdInline" style="padding:12px;min-height:80px;"></div>`
        },
        {
          id: 'side', label: 'Side by Side',
          content: `<div class="grid-2" style="gap:8px;">
            <div class="diff-container" id="tdSideL" style="padding:12px;min-height:80px;"></div>
            <div class="diff-container" id="tdSideR" style="padding:12px;min-height:80px;"></div>
          </div>`
        },
        {
          id: 'analysis', label: 'Advanced Analysis',
          content: `
            <div class="stats-row" style="flex-wrap:wrap">
              ${DevPocket.ui.statChip('Lines Added', 'tdAdd')}
              ${DevPocket.ui.statChip('Lines Removed', 'tdDel')}
              ${DevPocket.ui.statChip('Lines Unchanged', 'tdUnch')}
              ${DevPocket.ui.statChip('Change Ratio', 'tdRatio')}
              ${DevPocket.ui.statChip('Similarity', 'tdSim')}
            </div>
            <div id="tdSimBar" style="margin:10px 0;">
              <div style="height:8px;width:100%;background:var(--border,rgba(128,128,128,0.2));border-radius:4px;overflow:hidden;">
                <div id="tdSimFill" style="height:100%;width:0%;background:var(--success,rgba(76,175,125,0.8));transition:width .3s;"></div>
              </div>
            </div>
            <div class="form-group" style="margin-top:8px;">
              <label class="form-label">Most Changed Lines</label>
              <div class="diff-container" id="tdHot" style="padding:12px;min-height:80px;max-height:320px;overflow:auto;"></div>
            </div>
          `
        },
      ])}
    `));

    function renderDiff() {
      const left  = container.querySelector('#tdLeft').value;
      const right = container.querySelector('#tdRight').value;
      const inlineEl = container.querySelector('#tdInline');
      const sideL    = container.querySelector('#tdSideL');
      const sideR    = container.querySelector('#tdSideR');
      inlineEl.innerHTML = sideL.innerHTML = sideR.innerHTML = '';

      if (typeof Diff === 'undefined') {
        inlineEl.textContent = 'Diff library not loaded. Please check your internet connection.';
        return;
      }

      // Inline (word-level)
      Diff.diffWordsWithSpace(left, right).forEach(part => {
        const span = document.createElement('span');
        if (part.added)   span.style.cssText = 'background:rgba(76,175,125,0.25);color:var(--success);border-radius:3px;padding:0 2px';
        if (part.removed) span.style.cssText = 'background:rgba(224,92,92,0.2);color:var(--error);text-decoration:line-through;border-radius:3px;padding:0 2px';
        if (!part.added && !part.removed) span.style.color = 'var(--text-secondary)';
        span.textContent = part.value;
        inlineEl.appendChild(span);
      });

      // Side by side (line-level)
      Diff.diffLines(left, right).forEach(part => {
        const div = document.createElement('div');
        div.className = 'diff-line ' + (part.added ? 'added' : part.removed ? 'removed' : 'unchanged');
        div.textContent = part.value;
        if (part.added)   sideR.appendChild(div);
        else if (part.removed) sideL.appendChild(div);
        else { sideL.appendChild(div); sideR.appendChild(div.cloneNode(true)); }
      });

      renderAnalysis(left, right);
    }

    function renderAnalysis(left, right) {
      let added = 0, removed = 0, unchanged = 0;
      const lines = Diff.diffLines(left, right);

      lines.forEach(part => {
        if (part.added) added += part.count;
        else if (part.removed) removed += part.count;
        else unchanged += part.count;
      });

      const total = Math.max(1, added + removed + unchanged);
      const changeRatio = ((added + removed) / total * 100).toFixed(1);

      const l = left.split(/\r?\n/).filter(Boolean);
      const r = right.split(/\r?\n/).filter(Boolean);
      const maxLen = Math.max(l.length, r.length);
      let sim = 100;
      if (maxLen === 0) {
        sim = l.length === r.length ? 100 : 0;
      } else {
        sim = (1 - Math.abs(l.length - r.length) / maxLen) * 100;
      }

      const n = (v) => container.querySelector(v);
      n('#tdAdd').textContent = added;
      n('#tdDel').textContent = removed;
      n('#tdUnch').textContent = unchanged;
      n('#tdRatio').textContent = changeRatio + '%';
      n('#tdSim').textContent = sim.toFixed(1) + '%';
      n('#tdSimFill').style.width = sim.toFixed(1) + '%';

      const hot = container.querySelector('#tdHot');
      hot.innerHTML = '';

      const scored = lines
        .map(part => ({ text: part.value.trimEnd(), type: part.added ? 'added' : part.removed ? 'removed' : 'unchanged', n: part.count || 0 }))
        .filter(l => l.text.length > 0)
        .sort((a, b) => b.n - a.n)
        .slice(0, 20);

      if (scored.length === 0) {
        hot.textContent = 'No differences.';
        return;
      }

      scored.forEach(item => {
        const div = document.createElement('div');
        div.className = 'diff-line ' + item.type;
        div.style.cssText = 'font-family:var(--font-mono,monospace);padding:2px 6px;';
        div.title = item.type === 'added' ? 'Added' : item.type === 'removed' ? 'Removed' : 'Unchanged';
        div.textContent = item.text.length > 120 ? item.text.slice(0, 120) + '…' : item.text;
        hot.appendChild(div);
      });
    }

    container.querySelector('#tdCompare').addEventListener('click', renderDiff);
    container.querySelector('#tdClear').addEventListener('click', () => {
      ['#tdLeft','#tdRight'].forEach(s => container.querySelector(s).value = '');
      ['#tdInline','#tdSideL','#tdSideR','#tdHot'].forEach(s => { container.querySelector(s).innerHTML = ''; });
      ['#tdAdd','#tdDel','#tdUnch','#tdRatio','#tdSim'].forEach(s => container.querySelector(s).textContent = '—');
    });
  }
});
