'use strict';
// ============================================================
// DevPocket — tools-web.js
// Web & Frontend: HTML preview, CSS tools, Markdown, QR code
// ============================================================

DevPocket.registerCategory({ id: 'web', name: 'Web & Frontend', icon: 'globe', order: 6 });

// ---- HTML Preview & Beautifier ----
DevPocket.registerTool({
  id: 'html-preview',
  name: 'HTML Preview',
  category: 'web',
  icon: 'monitor',
  description: 'Live preview HTML, and beautify or minify HTML markup.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('htmlPrevInput', 'HTML Input', '<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>')}
      ${DevPocket.ui.btnRow([
        { id: 'htmlPrevRun',    label: 'Preview →',     cls: 'btn-primary' },
        { id: 'htmlBeautify',  label: 'Beautify',       cls: 'btn-secondary' },
        { id: 'htmlMinify',    label: 'Minify',         cls: 'btn-secondary' },
        { id: 'htmlPrevClear', label: 'Clear',          cls: 'btn-danger btn-sm' },
      ])}
    `));

    container.insertAdjacentHTML('beforeend', `
      <div class="card">
        <p class="card-title">Live Preview</p>
        <iframe id="htmlFrame" class="preview-frame" sandbox="allow-scripts allow-same-origin" title="HTML Preview"></iframe>
      </div>
    `);

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.output('htmlPrevOut', 'Processed HTML')}
    `));

    function beautifyHTML(html) {
      let indent = 0;
      const result = [];
      const tokens = html.split(/(<[^>]+>)/g);
      tokens.forEach(tok => {
        const t = tok.trim();
        if (!t) return;
        if (/^<\//.test(t)) { indent = Math.max(0, indent - 1); result.push('  '.repeat(indent) + t); }
        else if (/^<[^/!][^>]*[^/]>$/.test(t) && !/^<(br|hr|img|input|link|meta|area|base|col|embed|param|source|track|wbr)/i.test(t)) {
          result.push('  '.repeat(indent) + t); indent++;
        }
        else { result.push('  '.repeat(indent) + t); }
      });
      return result.join('\n');
    }

    const inp = container.querySelector('#htmlPrevInput');
    const out = container.querySelector('#htmlPrevOut');

    container.querySelector('#htmlPrevRun').addEventListener('click', () => {
      const doc = inp.value;
      const frame = container.querySelector('#htmlFrame');
      frame.srcdoc = doc;
    });

    container.querySelector('#htmlBeautify').addEventListener('click', () => {
      out.textContent = beautifyHTML(inp.value);
    });

    container.querySelector('#htmlMinify').addEventListener('click', () => {
      out.textContent = inp.value
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .trim();
    });

    container.querySelector('#htmlPrevClear').addEventListener('click', () => {
      inp.value = '';
      out.textContent = '';
      container.querySelector('#htmlFrame').srcdoc = '';
    });

    // Set a starter default
    inp.value = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
  h1   { color: #4f8ef7; }
</style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Edit the HTML on the left and click <strong>Preview</strong>.</p>
</body>
</html>`;
  }
});

// ---- CSS Beautifier & Minifier ----
DevPocket.registerTool({
  id: 'css-tools',
  name: 'CSS Beautifier / Minifier',
  category: 'web',
  icon: 'paintbrush',
  description: 'Beautify or minify CSS stylesheets.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('cssInput', 'CSS Input', 'Paste CSS here…')}
      ${DevPocket.ui.btnRow([
        { id: 'cssBeautify', label: 'Beautify', cls: 'btn-primary' },
        { id: 'cssMinify',   label: 'Minify',   cls: 'btn-secondary' },
        { id: 'cssClear',    label: 'Clear',    cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('cssOut', 'Output')}
    `));

    function beautifyCSS(css) {
      return css
        .replace(/\s*{\s*/g, ' {\n  ')
        .replace(/;\s*/g, ';\n  ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/,\s*/g, ',\n')
        .replace(/\/\*\s*/g, '/* ')
        .replace(/\s*\*\//g, ' */')
        .split('\n').map(l => l.trimEnd()).join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }

    function minifyCSS(css) {
      return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{}:;,>~+])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    }

    const inp = container.querySelector('#cssInput');
    const out = container.querySelector('#cssOut');
    container.querySelector('#cssBeautify').addEventListener('click', () => { out.textContent = beautifyCSS(inp.value); });
    container.querySelector('#cssMinify').addEventListener('click', () => { out.textContent = minifyCSS(inp.value); });
    container.querySelector('#cssClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- Markdown Preview ----
DevPocket.registerTool({
  id: 'markdown-preview',
  name: 'Markdown Preview',
  category: 'web',
  icon: 'file-text',
  description: 'Live render Markdown to HTML with syntax highlighting.',
  render(container) {
    container.insertAdjacentHTML('beforeend', `
      <div class="grid-2" style="gap:16px">
        <div class="card" style="display:flex;flex-direction:column">
          <p class="card-title">Markdown Input</p>
          <textarea id="mdInput" class="mono" style="flex:1;min-height:400px;resize:vertical" placeholder="Write Markdown here…">
# Hello, DevPocket! ⚡

Write **bold**, *italic*, or \`inline code\` text.

## Features
- Live preview
- GitHub-flavored Markdown
- Code blocks

\`\`\`javascript
const hello = 'world';
console.log(hello);
\`\`\`

> Blockquotes work too!

| Column 1 | Column 2 |
|----------|----------|
| Cell A   | Cell B   |
          </textarea>
          <div class="btn-row mt-8">
            <button class="btn btn-secondary btn-sm" id="mdCopyHTML">Copy HTML</button>
            <button class="btn btn-secondary btn-sm" id="mdDl">Download HTML</button>
            <button class="btn btn-danger btn-sm" id="mdClear">Clear</button>
          </div>
        </div>
        <div class="card" style="overflow:auto">
          <p class="card-title">Preview</p>
          <div id="mdPreview" class="markdown-body" style="min-height:400px;color:var(--text-primary);line-height:1.7"></div>
        </div>
      </div>
    `);

    // Inject minimal markdown styles
    if (!document.getElementById('md-styles')) {
      const style = document.createElement('style');
      style.id = 'md-styles';
      style.textContent = `.markdown-body h1,.markdown-body h2,.markdown-body h3{color:var(--accent);margin:16px 0 8px}.markdown-body code{background:var(--bg-elevated);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:12px}.markdown-body pre{background:var(--bg-elevated);padding:12px;border-radius:8px;overflow:auto;margin:8px 0}.markdown-body pre code{background:none;padding:0}.markdown-body blockquote{border-left:3px solid var(--accent);margin:8px 0;padding:4px 12px;color:var(--text-secondary)}.markdown-body table{border-collapse:collapse;width:100%}.markdown-body th,.markdown-body td{border:1px solid var(--border);padding:6px 10px}.markdown-body th{background:var(--bg-elevated)}.markdown-body ul,.markdown-body ol{padding-left:24px}.markdown-body a{color:var(--accent)}`;
      document.head.appendChild(style);
    }

    const mdInput  = container.querySelector('#mdInput');
    const preview  = container.querySelector('#mdPreview');

    function render() {
      if (typeof marked === 'undefined') { preview.textContent = 'marked.js library not loaded'; return; }
      try { preview.innerHTML = marked.parse(mdInput.value); }
      catch (e) { preview.textContent = `Error: ${e.message}`; }
    }

    mdInput.addEventListener('input', render);
    render();

    container.querySelector('#mdCopyHTML').addEventListener('click', () => {
      if (typeof marked !== 'undefined') DevPocket.copy(marked.parse(mdInput.value));
    });

    container.querySelector('#mdDl').addEventListener('click', () => {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title></head><body>${marked.parse(mdInput.value)}</body></html>`;
      DevPocket.download('document.html', html, 'text/html');
    });

    container.querySelector('#mdClear').addEventListener('click', () => {
      mdInput.value = '';
      preview.innerHTML = '';
    });
  }
});

// ---- QR Code Generator ----
DevPocket.registerTool({
  id: 'qr-code',
  name: 'QR Code Generator',
  category: 'web',
  icon: 'qr-code',
  description: 'Generate QR codes from text or URLs with custom sizes.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('qrInput', 'Text / URL', 'Enter text or URL to encode…', 'text')}
      <div class="form-group" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label class="form-label" style="margin:0">Size (px):</label>
        <input type="number" id="qrSize" value="256" min="64" max="1024" step="32" style="width:90px" />
        <label class="form-label" style="margin:0">Error Correction:</label>
        <select id="qrLevel" style="width:auto">
          <option value="L">L (7%)</option>
          <option value="M" selected>M (15%)</option>
          <option value="Q">Q (25%)</option>
          <option value="H">H (30%)</option>
        </select>
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'qrGen',  label: 'Generate QR', cls: 'btn-primary' },
        { id: 'qrDl',   label: 'Download PNG', cls: 'btn-secondary' },
        { id: 'qrClear',label: 'Clear',        cls: 'btn-danger btn-sm' },
      ])}
      <div id="qrOutput" style="margin-top:12px;display:flex;justify-content:center;min-height:64px"></div>
    `));

    let qrInstance = null;

    container.querySelector('#qrGen').addEventListener('click', () => {
      const text  = container.querySelector('#qrInput').value.trim();
      const size  = parseInt(container.querySelector('#qrSize').value) || 256;
      const level = container.querySelector('#qrLevel').value;
      const wrap  = container.querySelector('#qrOutput');

      if (!text) { DevPocket.toast('Enter some text first', 'error'); return; }
      if (typeof QRCode === 'undefined') { wrap.textContent = 'QRCode library not loaded'; return; }

      wrap.innerHTML = '';
      try {
        qrInstance = new QRCode(wrap, {
          text, width: size, height: size,
          colorDark: '#000000', colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel[level],
        });
      } catch (e) { wrap.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#qrDl').addEventListener('click', () => {
      const img = container.querySelector('#qrOutput img') || container.querySelector('#qrOutput canvas');
      if (!img) { DevPocket.toast('Generate a QR code first', 'error'); return; }
      const src = img.tagName === 'CANVAS' ? img.toDataURL() : img.src;
      const a   = Object.assign(document.createElement('a'), { href: src, download: 'qr-code.png' });
      a.click();
    });

    container.querySelector('#qrClear').addEventListener('click', () => {
      container.querySelector('#qrInput').value = '';
      container.querySelector('#qrOutput').innerHTML = '';
      qrInstance = null;
    });
  }
});

// ---- Clipboard Inspector ----
DevPocket.registerTool({
  id: 'clipboard',
  name: 'Clipboard Inspector',
  category: 'web',
  icon: 'clipboard',
  description: 'Inspect, format and transform your clipboard contents.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.btnRow([
        { id: 'clipRead',  label: 'Read Clipboard', cls: 'btn-primary' },
        { id: 'clipClear', label: 'Clear',              cls: 'btn-danger btn-sm' },
      ])}
      <div id="clipStatus"></div>
      ${DevPocket.ui.output('clipOut', 'Clipboard Content')}
      <div id="clipMeta" class="stats-row mt-8"></div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Transform & Write to Clipboard</p>
      ${DevPocket.ui.textarea('clipTransIn', 'Text', 'Paste or type text here…')}
      ${DevPocket.ui.btnRow([
        { id: 'clipWrite',      label: 'Write to Clipboard', cls: 'btn-primary' },
        { id: 'clipTrimWhite',  label: 'Trim Whitespace',    cls: 'btn-secondary' },
        { id: 'clipStripLines', label: 'Single Line',        cls: 'btn-secondary' },
      ])}
    `));

    const status = container.querySelector('#clipStatus');
    const out    = container.querySelector('#clipOut');

    container.querySelector('#clipRead').addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        out.textContent = text;
        const meta = container.querySelector('#clipMeta');
        meta.innerHTML = [
          DevPocket.ui.statChip('Characters', ''),
          DevPocket.ui.statChip('Words', ''),
          DevPocket.ui.statChip('Lines', ''),
        ].join('');
        const chips = meta.querySelectorAll('.stat-chip strong');
        chips[0].textContent = text.length;
        chips[1].textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
        chips[2].textContent = text.split('\n').length;
        status.innerHTML = DevPocket.ui.msg('Clipboard read successfully', 'success');
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`Cannot read clipboard: ${e.message}. Try pasting into the text area below.`, 'warning');
      }
    });

    container.querySelector('#clipWrite').addEventListener('click', () => {
      const text = container.querySelector('#clipTransIn').value;
      DevPocket.copy(text);
    });

    container.querySelector('#clipTrimWhite').addEventListener('click', () => {
      const inp = container.querySelector('#clipTransIn');
      inp.value = inp.value.trim().split('\n').map(l => l.trim()).join('\n');
    });

    container.querySelector('#clipStripLines').addEventListener('click', () => {
      const inp = container.querySelector('#clipTransIn');
      inp.value = inp.value.replace(/\s+/g, ' ').trim();
    });

    container.querySelector('#clipClear').addEventListener('click', () => {
      out.textContent = '';
      status.innerHTML = '';
      container.querySelector('#clipMeta').innerHTML = '';
    });
  }
});
