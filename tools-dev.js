'use strict';
// ============================================================
// DevPocket — tools-dev.js
// Developer Utilities: UUID, timestamps, regex, cron,
//   colors, lorem ipsum, URL parser, HTTP codes, MIME types
// ============================================================

DevPocket.registerCategory({ id: 'dev', name: 'Developer Utilities', icon: 'cpu', order: 5 });

// ---- UUID Generator ----
DevPocket.registerTool({
  id: 'uuid-gen',
  name: 'UUID Generator',
  category: 'dev',
  icon: 'fingerprint',
  description: 'Generate UUID v4, Nano IDs and bulk UUIDs.',
  render(container) {
    function uuidV4() {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      arr[6] = (arr[6] & 0x0f) | 0x40;
      arr[8] = (arr[8] & 0x3f) | 0x80;
      const h = [...arr].map(b => b.toString(16).padStart(2,'0')).join('');
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }

    function nanoId(size = 21, alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_-') {
      const arr = new Uint8Array(size);
      crypto.getRandomValues(arr);
      return [...arr].map(b => alphabet[b % alphabet.length]).join('');
    }

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="grid-2">
        <div>
          <p class="card-title">UUID v4</p>
          <div class="output-area" id="uuidOut" style="min-height:40px"></div>
          <div class="btn-row mt-8">
            <button class="btn btn-primary" id="uuidGen">Generate</button>
            <button class="btn btn-secondary btn-sm" id="uuidCopy">Copy</button>
          </div>
        </div>
        <div>
          <p class="card-title">Nano ID</p>
          <div class="output-area" id="nanoOut" style="min-height:40px"></div>
          <div class="btn-row mt-8">
            <button class="btn btn-primary" id="nanoGen">Generate</button>
            <input type="number" id="nanoLen" value="21" min="4" max="100" style="width:60px" title="Length" />
          </div>
        </div>
      </div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Bulk Generator</p>
      <div class="form-group" style="display:flex;gap:12px;align-items:center">
        <label class="form-label" style="margin:0">Count:</label>
        <input type="number" id="bulkCount" value="10" min="1" max="1000" style="width:80px" />
        <select id="bulkType" style="width:auto">
          <option value="uuid">UUID v4</option>
          <option value="nano">Nano ID</option>
        </select>
        <button class="btn btn-primary" id="bulkGen">Generate</button>
        <button class="btn btn-secondary btn-sm" id="bulkDl">Download</button>
      </div>
      ${DevPocket.ui.output('bulkOut', 'Bulk Output')}
    `));

    container.querySelector('#uuidGen').addEventListener('click', () => { container.querySelector('#uuidOut').textContent = uuidV4(); });
    container.querySelector('#uuidCopy').addEventListener('click', () => DevPocket.copy(container.querySelector('#uuidOut').textContent));
    container.querySelector('#nanoGen').addEventListener('click', () => {
      const len = parseInt(container.querySelector('#nanoLen').value) || 21;
      container.querySelector('#nanoOut').textContent = nanoId(len);
    });

    container.querySelector('#bulkGen').addEventListener('click', () => {
      const count = Math.min(1000, parseInt(container.querySelector('#bulkCount').value) || 10);
      const type  = container.querySelector('#bulkType').value;
      const gen   = type === 'uuid' ? uuidV4 : () => nanoId(21);
      container.querySelector('#bulkOut').textContent = Array.from({length:count}, gen).join('\n');
    });

    container.querySelector('#bulkDl').addEventListener('click', () => {
      const text = container.querySelector('#bulkOut').textContent;
      if (text) DevPocket.download('ids.txt', text);
    });

    // Auto-generate on load
    container.querySelector('#uuidOut').textContent = uuidV4();
    container.querySelector('#nanoOut').textContent = nanoId(21);
  }
});

// ---- Unix Timestamp / Epoch Converter ----
DevPocket.registerTool({
  id: 'timestamp',
  name: 'Unix Timestamp Converter',
  category: 'dev',
  icon: 'clock',
  description: 'Convert between Unix timestamps and human-readable dates across timezones.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Current Time</p>
      <div class="stats-row" id="tsNow">
        ${DevPocket.ui.statChip('Unix (s)', 'tsNowSec')}
        ${DevPocket.ui.statChip('Unix (ms)', 'tsNowMs')}
        ${DevPocket.ui.statChip('ISO 8601', 'tsNowIso')}
        ${DevPocket.ui.statChip('UTC', 'tsNowUtc')}
      </div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Epoch → Human Date</p>
      ${DevPocket.ui.input('tsEpoch', 'Unix Timestamp', 'Enter epoch seconds or milliseconds…', 'text')}
      ${DevPocket.ui.btnRow([{ id: 'tsEpochConv', label: 'Convert', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('tsEpochOut', 'Human Date')}
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Human Date → Epoch</p>
      ${DevPocket.ui.input('tsHuman', 'Date / Time', 'e.g. 2024-01-15 14:30:00 or Jan 15 2024', 'text')}
      ${DevPocket.ui.btnRow([{ id: 'tsHumanConv', label: 'Convert', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('tsHumanOut', 'Epoch')}
    `));

    // Live clock
    function updateClock() {
      const now = new Date();
      const sec = Math.floor(now.getTime() / 1000);
      const el = id => container.querySelector(`#${id}`);
      if (el('tsNowSec')) {
        el('tsNowSec').textContent = sec;
        el('tsNowMs').textContent  = now.getTime();
        el('tsNowIso').textContent = now.toISOString();
        el('tsNowUtc').textContent = now.toUTCString();
      }
    }
    updateClock();
    const timer = setInterval(updateClock, 1000);
    // Clean up when tool changes
    const obs = new MutationObserver(() => { if (!container.isConnected) { clearInterval(timer); obs.disconnect(); } });
    obs.observe(container, { childList: false, subtree: false });

    container.querySelector('#tsEpochConv').addEventListener('click', () => {
      const raw = container.querySelector('#tsEpoch').value.trim();
      const out = container.querySelector('#tsEpochOut');
      if (!raw) return;
      let ms = parseInt(raw);
      if (raw.length <= 10) ms *= 1000;
      const d = new Date(ms);
      out.textContent = [
        `Local:  ${d.toLocaleString()}`,
        `UTC:    ${d.toUTCString()}`,
        `ISO:    ${d.toISOString()}`,
        `Relative: ${_relativeTime(d)}`,
      ].join('\n');
    });

    container.querySelector('#tsHumanConv').addEventListener('click', () => {
      const raw = container.querySelector('#tsHuman').value.trim();
      const out = container.querySelector('#tsHumanOut');
      const d   = new Date(raw);
      if (isNaN(d.getTime())) { out.textContent = 'Invalid date'; return; }
      out.textContent = [
        `Epoch (s):  ${Math.floor(d.getTime() / 1000)}`,
        `Epoch (ms): ${d.getTime()}`,
      ].join('\n');
    });

    function _relativeTime(date) {
      const diff = Date.now() - date.getTime();
      const abs  = Math.abs(diff);
      const sign = diff > 0 ? 'ago' : 'from now';
      if (abs < 60000)    return `${Math.round(abs/1000)}s ${sign}`;
      if (abs < 3600000)  return `${Math.round(abs/60000)}m ${sign}`;
      if (abs < 86400000) return `${Math.round(abs/3600000)}h ${sign}`;
      return `${Math.round(abs/86400000)}d ${sign}`;
    }
  }
});

// ---- Regex Tester ----
DevPocket.registerTool({
  id: 'regex',
  name: 'Regex Tester',
  category: 'dev',
  icon: 'regex',
  description: 'Test regex patterns with live match highlighting, groups and extraction.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Regex Pattern</label>
        <div style="display:flex;gap:8px">
          <span style="color:var(--text-muted);font-family:var(--font-mono);padding:10px 0">/</span>
          <input type="text" id="rxPattern" placeholder="your pattern here" style="flex:1" />
          <span style="color:var(--text-muted);font-family:var(--font-mono);padding:10px 0">/</span>
          <input type="text" id="rxFlags" value="gm" placeholder="flags" style="width:60px" />
        </div>
      </div>
      ${DevPocket.ui.textarea('rxInput', 'Test String', 'Enter text to test against…')}
      <div id="rxStatus" style="margin-bottom:8px"></div>
      <div id="rxHighlight" class="code-block" style="min-height:60px;white-space:pre-wrap"></div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Matches</p>
      <div id="rxMatches" class="output-area" style="min-height:60px"></div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Quick Reference</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;font-family:var(--font-mono);font-size:12px">
        ${[
          ['.','Any character except newline'],
          ['\\d','Digit [0-9]'],
          ['\\w','Word char [a-zA-Z0-9_]'],
          ['\\s','Whitespace'],
          ['^','Start of line'],
          ['$','End of line'],
          ['*','0 or more'],
          ['+','1 or more'],
          ['?','0 or 1 (optional)'],
          ['{n,m}','Between n and m'],
          ['(...)','Capture group'],
          ['(?:...)','Non-capture group'],
          ['[abc]','Character class'],
          ['[^abc]','Negated class'],
          ['a|b','a or b'],
          ['\\b','Word boundary'],
        ].map(([sym, desc]) => `<div style="display:flex;gap:8px"><span style="color:var(--accent);min-width:70px">${sym}</span><span style="color:var(--text-secondary)">${desc}</span></div>`).join('')}
      </div>
    `));

    function runRegex() {
      const patStr = container.querySelector('#rxPattern').value;
      const flags  = container.querySelector('#rxFlags').value;
      const text   = container.querySelector('#rxInput').value;
      const status = container.querySelector('#rxStatus');
      const hl     = container.querySelector('#rxHighlight');
      const matches= container.querySelector('#rxMatches');

      if (!patStr) { hl.innerHTML = ''; matches.textContent = ''; status.innerHTML = ''; return; }

      try {
        const rx = new RegExp(patStr, flags.replace(/[^gimsuy]/g,''));
        const allMatches = [...text.matchAll(new RegExp(patStr, flags.replace(/g/,'') + 'g'))];
        status.innerHTML = DevPocket.ui.msg(`${allMatches.length} match${allMatches.length !== 1 ? 'es' : ''}`, allMatches.length ? 'success' : 'warning');

        // Highlight
        hl.innerHTML = text.replace(rx, m => `<mark style="background:rgba(79,142,247,0.35);color:var(--accent);border-radius:3px">${m.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</mark>`);

        // List matches
        matches.textContent = allMatches.map((m, i) => {
          let line = `[${i+1}] "${m[0]}" @ ${m.index}`;
          if (m.length > 1) line += `\n     Groups: ${m.slice(1).map((g,j) => `$${j+1}="${g}"`).join(', ')}`;
          return line;
        }).join('\n\n') || 'No matches';
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`Invalid regex: ${e.message}`, 'error');
        hl.innerHTML = '';
        matches.textContent = '';
      }
    }

    container.querySelector('#rxPattern').addEventListener('input', runRegex);
    container.querySelector('#rxFlags').addEventListener('input', runRegex);
    container.querySelector('#rxInput').addEventListener('input', runRegex);
  }
});

// ---- Cron Expression Builder/Reader ----
DevPocket.registerTool({
  id: 'cron',
  name: 'Cron Expression Builder',
  category: 'dev',
  icon: 'timer',
  description: 'Build and decode cron expressions with human-readable descriptions.',
  render(container) {
    const presets = [
      { label: 'Every minute',      value: '* * * * *' },
      { label: 'Every 5 minutes',   value: '*/5 * * * *' },
      { label: 'Every hour',        value: '0 * * * *' },
      { label: 'Daily at midnight', value: '0 0 * * *' },
      { label: 'Daily at noon',     value: '0 12 * * *' },
      { label: 'Every Monday 9am',  value: '0 9 * * 1' },
      { label: 'Weekdays 9am',      value: '0 9 * * 1-5' },
      { label: 'First of month',    value: '0 0 1 * *' },
      { label: 'Every Sunday midnight', value: '0 0 * * 0' },
    ];

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('cronExpr', 'Cron Expression', '* * * * *')}
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-bottom:12px;font-family:var(--font-mono);font-size:11px;text-align:center;color:var(--text-muted)">
        <span>Minute<br>(0-59)</span>
        <span>Hour<br>(0-23)</span>
        <span>Day of Month<br>(1-31)</span>
        <span>Month<br>(1-12)</span>
        <span>Day of Week<br>(0-7, 0/7=Sun)</span>
      </div>
      ${DevPocket.ui.btnRow([{ id: 'cronRead', label: 'Describe', cls: 'btn-primary' }])}
      <div id="cronDesc" class="output-area" style="min-height:60px"></div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Next 10 Run Times</p>
      <div id="cronNext" class="output-area" style="min-height:60px"></div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Common Presets</p>
      <div class="btn-grid">
        ${presets.map(p => `<button class="btn btn-secondary btn-sm cron-preset" data-cron="${p.value}">${p.label}</button>`).join('')}
      </div>
    `));

    function describeCron(expr) {
      const parts = expr.trim().split(/\s+/);
      if (parts.length !== 5) return 'Invalid cron expression (expected 5 fields)';
      const [min, hr, dom, mon, dow] = parts;
      const f = (v, unit, vals) => v === '*' ? `every ${unit}` : v.startsWith('*/') ? `every ${v.slice(2)} ${unit}s` : v.includes('-') ? `${unit}s ${v.replace('-',' to ')}` : `${unit} ${vals ? vals[parseInt(v)] || v : v}`;
      const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
      const parts2 = [
        `At ${hr==='*'?'every hour':hr.startsWith('*/')?`every ${hr.slice(2)} hours`:`hour ${hr}`}`,
        `minute ${min==='*'?'(every)':min.startsWith('*/')?`every ${min.slice(2)}`:min}`,
        dom !== '*' ? `on day ${dom}` : '',
        mon !== '*' ? `in ${months[parseInt(mon)] || mon}` : '',
        dow !== '*' ? `on ${days[parseInt(dow.split('-')[0])] || dow}` : '',
      ].filter(Boolean);
      return parts2.join(', ');
    }

    function nextRuns(expr, count = 10) {
      // Simple approximation: find next N run minutes
      const parts = expr.trim().split(/\s+/);
      if (parts.length !== 5) return ['Invalid expression'];
      const matches = (val, field) => {
        if (field === '*') return true;
        if (field.startsWith('*/')) return val % parseInt(field.slice(2)) === 0;
        if (field.includes('-')) {
          const [a,b] = field.split('-').map(Number);
          return val >= a && val <= b;
        }
        return field.split(',').map(Number).includes(val);
      };
      const results = [];
      const now = new Date();
      now.setSeconds(0,0);
      now.setMinutes(now.getMinutes() + 1);
      let d = new Date(now);
      let safety = 0;
      while (results.length < count && safety++ < 525600) {
        if (matches(d.getMinutes(), parts[0]) &&
            matches(d.getHours(),   parts[1]) &&
            matches(d.getDate(),    parts[2]) &&
            matches(d.getMonth()+1, parts[3]) &&
            matches(d.getDay(),     parts[4])) {
          results.push(d.toLocaleString());
        }
        d = new Date(d.getTime() + 60000);
      }
      return results.length ? results : ['Could not compute runs'];
    }

    container.querySelector('#cronRead').addEventListener('click', () => {
      const expr = container.querySelector('#cronExpr').value.trim();
      container.querySelector('#cronDesc').textContent = describeCron(expr);
      container.querySelector('#cronNext').textContent = nextRuns(expr).join('\n');
    });

    container.querySelectorAll('.cron-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelector('#cronExpr').value = btn.dataset.cron;
        const expr = btn.dataset.cron;
        container.querySelector('#cronDesc').textContent = describeCron(expr);
        container.querySelector('#cronNext').textContent = nextRuns(expr).join('\n');
      });
    });
  }
});

// ---- Color Converter ----
DevPocket.registerTool({
  id: 'color-convert',
  name: 'Color Converter',
  category: 'dev',
  icon: 'palette',
  description: 'Convert between HEX, RGB, HSL color formats and pick colors visually.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
        <div>
          <label class="form-label">Color Picker</label>
          <input type="color" id="colorPick" value="#4f8ef7" style="width:80px;height:60px" />
        </div>
        <div style="flex:1;min-width:200px">
          ${DevPocket.ui.input('colorHex', 'HEX', '#4f8ef7')}
        </div>
      </div>
      <div class="grid-3" style="margin-top:8px">
        ${DevPocket.ui.input('colorR', 'R', '79', 'number')}
        ${DevPocket.ui.input('colorG', 'G', '142', 'number')}
        ${DevPocket.ui.input('colorB', 'B', '247', 'number')}
      </div>
      <div class="grid-3">
        ${DevPocket.ui.input('colorH', 'H', '219', 'number')}
        ${DevPocket.ui.input('colorS', 'S%', '91', 'number')}
        ${DevPocket.ui.input('colorL', 'L%', '64', 'number')}
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'colorFromHex', label: 'HEX → RGB/HSL', cls: 'btn-primary' },
        { id: 'colorFromRGB', label: 'RGB → HEX/HSL', cls: 'btn-secondary' },
        { id: 'colorFromHSL', label: 'HSL → HEX/RGB', cls: 'btn-secondary' },
      ])}
      <div id="colorPreview" style="height:60px;border-radius:10px;border:1px solid var(--border);background:#4f8ef7;margin-top:8px"></div>
      ${DevPocket.ui.output('colorOut', 'All Formats')}
    `));

    function hexToRgb(hex) {
      const n = parseInt(hex.replace('#',''), 16);
      return [(n>>16)&255, (n>>8)&255, n&255];
    }

    function rgbToHex(r,g,b) {
      return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,+v)).toString(16).padStart(2,'0')).join('').toUpperCase();
    }

    function rgbToHsl(r,g,b) {
      r/=255; g/=255; b/=255;
      const max=Math.max(r,g,b), min=Math.min(r,g,b), l=(max+min)/2;
      if (max===min) return [0,0,Math.round(l*100)];
      const d=max-min, s=l>0.5?d/(2-max-min):d/(max+min);
      let h = max===r ? (g-b)/d+(g<b?6:0) : max===g ? (b-r)/d+2 : (r-g)/d+4;
      return [Math.round(h/6*360), Math.round(s*100), Math.round(l*100)];
    }

    function hslToRgb(h,s,l) {
      s/=100; l/=100;
      const a=s*Math.min(l,1-l);
      const f=n => { const k=(n+h/30)%12; return Math.round((l-a*Math.max(-1,Math.min(k-3,Math.min(9-k,1))))*255); };
      return [f(0),f(8),f(4)];
    }

    function showColor(hex, r, g, b, h, s, l) {
      container.querySelector('#colorHex').value  = hex;
      container.querySelector('#colorR').value    = r;
      container.querySelector('#colorG').value    = g;
      container.querySelector('#colorB').value    = b;
      container.querySelector('#colorH').value    = h;
      container.querySelector('#colorS').value    = s;
      container.querySelector('#colorL').value    = l;
      container.querySelector('#colorPreview').style.background = hex;
      container.querySelector('#colorPick').value = hex;
      container.querySelector('#colorOut').textContent = [
        `HEX:  ${hex}`,
        `RGB:  rgb(${r}, ${g}, ${b})`,
        `HSL:  hsl(${h}, ${s}%, ${l}%)`,
        `CSS:  color: ${hex};`,
        `RGBA: rgba(${r}, ${g}, ${b}, 1)`,
      ].join('\n');
    }

    container.querySelector('#colorPick').addEventListener('input', function() {
      const [r,g,b] = hexToRgb(this.value);
      const [h,s,l] = rgbToHsl(r,g,b);
      showColor(this.value.toUpperCase(), r, g, b, h, s, l);
    });

    container.querySelector('#colorFromHex').addEventListener('click', () => {
      const hex = container.querySelector('#colorHex').value.trim();
      const [r,g,b] = hexToRgb(hex.startsWith('#') ? hex : '#'+hex);
      const [h,s,l] = rgbToHsl(r,g,b);
      showColor('#'+hex.replace('#','').toUpperCase(), r, g, b, h, s, l);
    });

    container.querySelector('#colorFromRGB').addEventListener('click', () => {
      const r = +container.querySelector('#colorR').value;
      const g = +container.querySelector('#colorG').value;
      const b = +container.querySelector('#colorB').value;
      const [h,s,l] = rgbToHsl(r,g,b);
      showColor(rgbToHex(r,g,b), r, g, b, h, s, l);
    });

    container.querySelector('#colorFromHSL').addEventListener('click', () => {
      const h = +container.querySelector('#colorH').value;
      const s = +container.querySelector('#colorS').value;
      const l = +container.querySelector('#colorL').value;
      const [r,g,b] = hslToRgb(h,s,l);
      showColor(rgbToHex(r,g,b), r, g, b, h, s, l);
    });

    showColor('#4F8EF7', 79, 142, 247, 219, 91, 64);
  }
});

// ---- Gradient Generator ----
DevPocket.registerTool({
  id: 'gradient-gen',
  name: 'Gradient Generator',
  category: 'dev',
  icon: 'brush',
  description: 'Build CSS linear and radial gradients with a live preview.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="gradient-preview" id="gradPreview"></div>
      <div class="grid-2">
        <div>
          ${DevPocket.ui.select('gradType', 'Type', [
            { value: 'linear-gradient', label: 'Linear' },
            { value: 'radial-gradient', label: 'Radial' },
            { value: 'conic-gradient',  label: 'Conic' },
          ])}
        </div>
        <div>
          ${DevPocket.ui.input('gradAngle', 'Angle (deg)', '135', 'number')}
        </div>
      </div>
      <div id="gradStops">
        <div class="grad-stop" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <input type="color" class="grad-color" value="#4f8ef7" />
          <input type="number" class="grad-pos" value="0" min="0" max="100" style="width:70px" /> %
          <button class="btn btn-danger btn-sm grad-remove">✕</button>
        </div>
        <div class="grad-stop" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <input type="color" class="grad-color" value="#a855f7" />
          <input type="number" class="grad-pos" value="100" min="0" max="100" style="width:70px" /> %
          <button class="btn btn-danger btn-sm grad-remove">✕</button>
        </div>
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'gradAddStop', label: '+ Add Stop',   cls: 'btn-secondary btn-sm' },
        { id: 'gradUpdate',  label: 'Update',        cls: 'btn-primary' },
      ])}
      ${DevPocket.ui.output('gradOut', 'CSS Output')}
    `));

    function buildCSS() {
      const type  = container.querySelector('#gradType').value;
      const angle = container.querySelector('#gradAngle').value;
      const stops = [...container.querySelectorAll('.grad-stop')].map(s => {
        const color = s.querySelector('.grad-color').value;
        const pos   = s.querySelector('.grad-pos').value;
        return `${color} ${pos}%`;
      }).join(', ');
      const prefix = type === 'linear-gradient' ? `${angle}deg, ` : type === 'radial-gradient' ? 'circle, ' : '';
      return `${type}(${prefix}${stops})`;
    }

    function update() {
      const css = buildCSS();
      container.querySelector('#gradPreview').style.background = css;
      container.querySelector('#gradOut').textContent = [
        `background: ${css};`,
        `background-image: ${css};`,
      ].join('\n');
    }

    container.querySelector('#gradUpdate').addEventListener('click', update);
    container.querySelector('#gradType').addEventListener('change', update);

    container.querySelector('#gradAddStop').addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'grad-stop';
      div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px';
      div.innerHTML = `<input type="color" class="grad-color" value="#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}" />
        <input type="number" class="grad-pos" value="50" min="0" max="100" style="width:70px" /> %
        <button class="btn btn-danger btn-sm grad-remove">✕</button>`;
      container.querySelector('#gradStops').appendChild(div);
      div.querySelector('.grad-remove').addEventListener('click', () => div.remove());
    });

    container.querySelector('#gradStops').addEventListener('click', e => {
      if (e.target.classList.contains('grad-remove')) e.target.closest('.grad-stop').remove();
    });

    update();
  }
});

// ---- Lorem Ipsum Generator ----
DevPocket.registerTool({
  id: 'lorem-ipsum',
  name: 'Lorem Ipsum Generator',
  category: 'dev',
  icon: 'align-left',
  description: 'Generate placeholder Lorem Ipsum text in various lengths.',
  render(container) {
    const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
    const WORDS = LOREM.replace(/[.,]/g,'').toLowerCase().split(/\s+/);

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <input type="number" id="liCount" value="3" min="1" max="100" style="width:70px" />
        <select id="liType" style="width:auto">
          <option value="paragraphs">Paragraphs</option>
          <option value="sentences">Sentences</option>
          <option value="words">Words</option>
        </select>
        <label class="check-group"><input type="checkbox" id="liStart" checked /> Start with "Lorem ipsum"</label>
        <button class="btn btn-primary" id="liGen">Generate</button>
      </div>
      ${DevPocket.ui.output('liOut', 'Generated Text')}
    `));

    function randomWord() { return WORDS[Math.floor(Math.random() * WORDS.length)]; }
    function randomSentence(wordCount = Math.floor(Math.random()*15)+8) {
      const ws = Array.from({length:wordCount}, randomWord);
      ws[0] = ws[0].charAt(0).toUpperCase() + ws[0].slice(1);
      return ws.join(' ') + '.';
    }
    function randomParagraph(sentCount = Math.floor(Math.random()*4)+4) {
      return Array.from({length:sentCount}, randomSentence).join(' ');
    }

    container.querySelector('#liGen').addEventListener('click', () => {
      const count   = parseInt(container.querySelector('#liCount').value) || 3;
      const type    = container.querySelector('#liType').value;
      const start   = container.querySelector('#liStart').checked;
      let result    = '';

      if (type === 'paragraphs') {
        const paras = Array.from({length:count}, (_, i) => i===0&&start ? LOREM : randomParagraph());
        result = paras.join('\n\n');
      } else if (type === 'sentences') {
        const sents = Array.from({length:count}, (_, i) => i===0&&start ? 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' : randomSentence());
        result = sents.join(' ');
      } else {
        const ws = start ? ['Lorem','ipsum',...Array.from({length:Math.max(0,count-2)}, randomWord)] : Array.from({length:count}, randomWord);
        result = ws.join(' ');
      }

      container.querySelector('#liOut').textContent = result;
    });
  }
});

// ---- URL Parser ----
DevPocket.registerTool({
  id: 'url-parser',
  name: 'URL Parser',
  category: 'dev',
  icon: 'link-2',
  description: 'Parse a URL into protocol, host, pathname, query params and fragments.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('urlpInput', 'URL', 'https://example.com/path?key=val&foo=bar#section', 'url')}
      ${DevPocket.ui.btnRow([
        { id: 'urlpParse', label: 'Parse', cls: 'btn-primary' },
        { id: 'urlpClear', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="urlpResult"></div>
    `));

    container.querySelector('#urlpParse').addEventListener('click', () => {
      const raw = container.querySelector('#urlpInput').value.trim();
      const div = container.querySelector('#urlpResult');
      try {
        const u = new URL(raw);
        const params = [...u.searchParams.entries()];
        div.innerHTML = `
          <div class="stats-row" style="flex-wrap:wrap">
            ${[
              ['Protocol', u.protocol.replace(':','')],
              ['Host',     u.host],
              ['Hostname', u.hostname],
              ['Port',     u.port || '(default)'],
              ['Pathname', u.pathname],
              ['Hash',     u.hash || '(none)'],
            ].map(([k,v]) => `<div class="stat-chip"><span>${k}</span><strong>${v}</strong></div>`).join('')}
          </div>
          ${params.length ? `
            <div class="table-wrap mt-12">
              <table class="data-table">
                <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
                <tbody>${params.map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('')}</tbody>
              </table>
            </div>` : `<p class="text-muted mt-8">No query parameters</p>`}
        `;
      } catch (e) {
        div.innerHTML = DevPocket.ui.msg(`Invalid URL: ${e.message}`, 'error');
      }
    });

    container.querySelector('#urlpClear').addEventListener('click', () => {
      container.querySelector('#urlpInput').value = '';
      container.querySelector('#urlpResult').innerHTML = '';
    });
  }
});

// ---- HTTP Status Code Lookup ----
DevPocket.registerTool({
  id: 'http-status',
  name: 'HTTP Status Codes',
  category: 'dev',
  icon: 'activity',
  description: 'Look up any HTTP status code with description and usage context.',
  render(container) {
    const CODES = {
      100:['Continue','Informational'],101:['Switching Protocols','Informational'],102:['Processing','Informational'],103:['Early Hints','Informational'],
      200:['OK','Success'],201:['Created','Success'],202:['Accepted','Success'],203:['Non-Authoritative Information','Success'],204:['No Content','Success'],205:['Reset Content','Success'],206:['Partial Content','Success'],207:['Multi-Status','Success'],208:['Already Reported','Success'],226:['IM Used','Success'],
      300:['Multiple Choices','Redirect'],301:['Moved Permanently','Redirect'],302:['Found (Temporary Redirect)','Redirect'],303:['See Other','Redirect'],304:['Not Modified','Redirect'],307:['Temporary Redirect','Redirect'],308:['Permanent Redirect','Redirect'],
      400:['Bad Request','Client Error'],401:['Unauthorized','Client Error'],402:['Payment Required','Client Error'],403:['Forbidden','Client Error'],404:['Not Found','Client Error'],405:['Method Not Allowed','Client Error'],406:['Not Acceptable','Client Error'],408:['Request Timeout','Client Error'],409:['Conflict','Client Error'],410:['Gone','Client Error'],411:['Length Required','Client Error'],413:['Content Too Large','Client Error'],414:['URI Too Long','Client Error'],415:['Unsupported Media Type','Client Error'],422:['Unprocessable Content','Client Error'],423:['Locked','Client Error'],425:['Too Early','Client Error'],426:['Upgrade Required','Client Error'],429:['Too Many Requests','Client Error'],431:['Request Header Fields Too Large','Client Error'],451:['Unavailable For Legal Reasons','Client Error'],
      500:['Internal Server Error','Server Error'],501:['Not Implemented','Server Error'],502:['Bad Gateway','Server Error'],503:['Service Unavailable','Server Error'],504:['Gateway Timeout','Server Error'],505:['HTTP Version Not Supported','Server Error'],507:['Insufficient Storage','Server Error'],508:['Loop Detected','Server Error'],511:['Network Authentication Required','Server Error'],
    };

    const groups = {
      'Informational (1xx)':  Object.entries(CODES).filter(([c]) => c < 200),
      'Success (2xx)':        Object.entries(CODES).filter(([c]) => c >= 200 && c < 300),
      'Redirection (3xx)':    Object.entries(CODES).filter(([c]) => c >= 300 && c < 400),
      'Client Error (4xx)':   Object.entries(CODES).filter(([c]) => c >= 400 && c < 500),
      'Server Error (5xx)':   Object.entries(CODES).filter(([c]) => c >= 500),
    };

    const catColor = c => c<200?'info':c<300?'success':c<400?'warning':c<500?'error':'error';

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('httpSearch', 'Search', 'Search code or description…')}
      <div id="httpResult"></div>
    `));

    function renderAll(filter='') {
      const q = filter.toLowerCase();
      let html = '';
      Object.entries(groups).forEach(([groupName, entries]) => {
        const filtered = entries.filter(([c,v]) => !q || c.includes(q) || v[0].toLowerCase().includes(q));
        if (!filtered.length) return;
        html += `<div class="card-title" style="margin-top:12px">${groupName}</div>`;
        html += `<div class="table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Name</th><th>Category</th></tr></thead><tbody>`;
        filtered.forEach(([code, [name, cat]]) => {
          html += `<tr><td><strong>${code}</strong></td><td>${name}</td><td><span class="badge badge-${catColor(+code)}">${cat}</span></td></tr>`;
        });
        html += `</tbody></table></div>`;
      });
      container.querySelector('#httpResult').innerHTML = html || `<p class="text-muted">No codes match "${filter}"</p>`;
    }

    container.querySelector('#httpSearch').addEventListener('input', function() { renderAll(this.value); });
    renderAll();
  }
});

// ---- MIME Type Lookup ----
DevPocket.registerTool({
  id: 'mime-lookup',
  name: 'MIME Type Lookup',
  category: 'dev',
  icon: 'file-question',
  description: 'Look up MIME types by file extension or content type.',
  render(container) {
    const MIMES = {
      'html':'text/html','htm':'text/html','css':'text/css','js':'application/javascript','mjs':'application/javascript',
      'json':'application/json','xml':'application/xml','yaml':'application/x-yaml','yml':'application/x-yaml',
      'txt':'text/plain','csv':'text/csv','md':'text/markdown','pdf':'application/pdf',
      'png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','gif':'image/gif','webp':'image/webp','svg':'image/svg+xml','ico':'image/x-icon','bmp':'image/bmp','tiff':'image/tiff','avif':'image/avif',
      'mp3':'audio/mpeg','ogg':'audio/ogg','wav':'audio/wav','aac':'audio/aac','flac':'audio/flac','webm':'video/webm',
      'mp4':'video/mp4','mov':'video/quicktime','avi':'video/x-msvideo','mkv':'video/x-matroska',
      'zip':'application/zip','tar':'application/x-tar','gz':'application/gzip','rar':'application/vnd.rar','7z':'application/x-7z-compressed',
      'woff':'font/woff','woff2':'font/woff2','ttf':'font/ttf','otf':'font/otf','eot':'application/vnd.ms-fontobject',
      'doc':'application/msword','docx':'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls':'application/vnd.ms-excel','xlsx':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt':'application/vnd.ms-powerpoint','pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'sh':'application/x-sh','py':'text/x-python','java':'text/x-java-source','c':'text/x-c','cpp':'text/x-c++',
      'ts':'application/typescript','jsx':'text/jsx','tsx':'text/tsx',
      'wasm':'application/wasm','bin':'application/octet-stream','exe':'application/vnd.microsoft.portable-executable',
    };

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('mimeSearch', 'Search Extension or MIME Type', 'e.g. png  or  image/jpeg')}
      <div id="mimeResult" class="table-wrap mt-8"><table class="data-table">
        <thead><tr><th>Extension</th><th>MIME Type</th></tr></thead>
        <tbody id="mimeTbody"></tbody>
      </table></div>
    `));

    function render(q='') {
      const entries = Object.entries(MIMES).filter(([ext, mime]) => !q || ext.includes(q) || mime.includes(q));
      container.querySelector('#mimeTbody').innerHTML = entries.map(([ext, mime]) =>
        `<tr><td><strong>.${ext}</strong></td><td>${mime}</td></tr>`
      ).join('') || `<tr><td colspan="2" style="text-align:center;color:var(--text-muted)">No results</td></tr>`;
    }

    container.querySelector('#mimeSearch').addEventListener('input', function() { render(this.value.toLowerCase()); });
    render();
  }
});
