'use strict';
// ============================================================
// DevPocket — tools-encoding.js
// Encoding & Decoding: Base64, URL, HTML, Unicode, Binary/Hex
// ============================================================

DevPocket.registerCategory({ id: 'encoding', name: 'Encoding & Decoding', icon: 'lock', order: 2 });

// ---- Base64 ----
DevPocket.registerTool({
  id: 'base64',
  name: 'Base64 Encode/Decode',
  category: 'encoding',
  icon: 'binary',
  description: 'Encode or decode Base64 strings. Also converts files and images to Base64.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'b64text', label: 'Text',
          content: `
            ${DevPocket.ui.textarea('b64Input', 'Input', 'Enter text or Base64 string…')}
            ${DevPocket.ui.btnRow([
              { id: 'b64Enc', label: 'Encode →', cls: 'btn-primary' },
              { id: 'b64Dec', label: '← Decode', cls: 'btn-secondary' },
              { id: 'b64Clear', label: 'Clear', cls: 'btn-danger btn-sm' },
            ])}
            ${DevPocket.ui.output('b64Output', 'Output')}`
        },
        {
          id: 'b64file', label: 'File / Image',
          content: `
            <div class="form-group">
              <label class="form-label">Select File or Image</label>
              <input type="file" id="b64File" style="color:var(--text-primary)" />
            </div>
            <div class="form-group" id="b64ImgPreviewWrap" style="display:none">
              <label class="form-label">Preview</label>
              <img id="b64ImgPreview" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--border)" />
            </div>
            ${DevPocket.ui.output('b64FileOut', 'Base64 Data URL')}`
        },
      ])}
    `));

    const inp = container.querySelector('#b64Input');
    const out = container.querySelector('#b64Output');

    container.querySelector('#b64Enc').addEventListener('click', () => {
      try { out.textContent = btoa(unescape(encodeURIComponent(inp.value))); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#b64Dec').addEventListener('click', () => {
      try { out.textContent = decodeURIComponent(escape(atob(inp.value.trim()))); }
      catch (_) { out.textContent = 'Error: Invalid Base64 string'; }
    });

    container.querySelector('#b64Clear').addEventListener('click', () => {
      inp.value = ''; out.textContent = '';
    });

    container.querySelector('#b64File').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const prev = container.querySelector('#b64ImgPreviewWrap');
      prev.style.display = file.type.startsWith('image/') ? '' : 'none';
      const reader = new FileReader();
      reader.onload = ev => {
        container.querySelector('#b64FileOut').textContent = ev.target.result;
        if (file.type.startsWith('image/'))
          container.querySelector('#b64ImgPreview').src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
});

// ---- URL Encode/Decode ----
DevPocket.registerTool({
  id: 'url-encode',
  name: 'URL Encode/Decode',
  category: 'encoding',
  icon: 'link',
  description: 'Encode and decode URL components and full URLs.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('urlInp', 'Input', 'Enter text or URL-encoded string…')}
      ${DevPocket.ui.btnRow([
        { id: 'urlEnc',    label: 'encodeURIComponent', cls: 'btn-primary' },
        { id: 'urlDec',    label: 'decodeURIComponent', cls: 'btn-secondary' },
        { id: 'urlEncFull',label: 'encodeURI (full URL)', cls: 'btn-secondary' },
        { id: 'urlClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('urlOut', 'Output')}
    `));

    const inp = container.querySelector('#urlInp');
    const out = container.querySelector('#urlOut');

    container.querySelector('#urlEnc').addEventListener('click', () => {
      try { out.textContent = encodeURIComponent(inp.value); } catch (e) { out.textContent = `Error: ${e.message}`; }
    });
    container.querySelector('#urlDec').addEventListener('click', () => {
      try { out.textContent = decodeURIComponent(inp.value); } catch (_) { out.textContent = 'Error: Invalid URL encoding'; }
    });
    container.querySelector('#urlEncFull').addEventListener('click', () => {
      try { out.textContent = encodeURI(inp.value); } catch (e) { out.textContent = `Error: ${e.message}`; }
    });
    container.querySelector('#urlClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- HTML Encode/Decode ----
DevPocket.registerTool({
  id: 'html-encode',
  name: 'HTML Encode/Decode',
  category: 'encoding',
  icon: 'code',
  description: 'Encode and decode HTML entities (&amp; &lt; &gt; etc).',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('htmlInp', 'Input', 'Enter text or HTML-encoded string…')}
      ${DevPocket.ui.btnRow([
        { id: 'htmlEnc',  label: 'Encode →', cls: 'btn-primary' },
        { id: 'htmlDec',  label: '← Decode', cls: 'btn-secondary' },
        { id: 'htmlClear',label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('htmlOut', 'Output')}
    `));

    const inp = container.querySelector('#htmlInp');
    const out = container.querySelector('#htmlOut');

    const encode = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const decode = s => { const d = document.createElement('div'); d.innerHTML = s; return d.textContent; };

    container.querySelector('#htmlEnc').addEventListener('click', () => { out.textContent = encode(inp.value); });
    container.querySelector('#htmlDec').addEventListener('click', () => { out.textContent = decode(inp.value); });
    container.querySelector('#htmlClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- Unicode Escape/Unescape ----
DevPocket.registerTool({
  id: 'unicode-escape',
  name: 'Unicode Escape/Unescape',
  category: 'encoding',
  icon: 'braces',
  description: 'Convert characters to/from \\uXXXX Unicode escape sequences.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('uniInp', 'Input', 'Enter text or \\u escape sequences…')}
      ${DevPocket.ui.btnRow([
        { id: 'uniEsc',   label: 'Escape →',   cls: 'btn-primary' },
        { id: 'uniUnesc', label: '← Unescape', cls: 'btn-secondary' },
        { id: 'uniInfo',  label: 'Code Points', cls: 'btn-secondary' },
        { id: 'uniClear', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('uniOut', 'Output')}
    `));

    const inp = container.querySelector('#uniInp');
    const out = container.querySelector('#uniOut');

    container.querySelector('#uniEsc').addEventListener('click', () => {
      out.textContent = [...inp.value].map(c =>
        c.codePointAt(0) > 127 ? `\\u${c.codePointAt(0).toString(16).padStart(4,'0')}` : c
      ).join('');
    });
    container.querySelector('#uniUnesc').addEventListener('click', () => {
      try {
        out.textContent = inp.value
          .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h,16)))
          .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h,16)));
      } catch (e) { out.textContent = `Error: ${e.message}`; }
    });
    container.querySelector('#uniInfo').addEventListener('click', () => {
      out.textContent = [...inp.value].map(c => {
        const cp = c.codePointAt(0);
        return `U+${cp.toString(16).toUpperCase().padStart(4,'0')} (${cp})  ${c}`;
      }).join('\n');
    });
    container.querySelector('#uniClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- Number Base Converter (ASCII / Binary / Hex / Decimal) ----
DevPocket.registerTool({
  id: 'number-base',
  name: 'Number Base Converter',
  category: 'encoding',
  icon: 'hash',
  description: 'Convert text between ASCII, Binary, Hexadecimal and Decimal representations.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Text → Numbers</p>
      ${DevPocket.ui.textarea('nbcTxtIn', 'Text Input', 'Type text to convert to binary/hex/decimal…')}
      ${DevPocket.ui.btnRow([
        { id: 'nbcConvert', label: 'Convert', cls: 'btn-primary' },
        { id: 'nbcClearTop', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('nbcBin', 'Binary')}
      ${DevPocket.ui.output('nbcHex', 'Hexadecimal')}
      ${DevPocket.ui.output('nbcDec', 'Decimal (ASCII codes)')}
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Numbers → Text</p>
      ${DevPocket.ui.textarea('nbcNumIn', 'Number Input', 'e.g. 01001000 01101001  or  48 69  or  0x48 0x69')}
      ${DevPocket.ui.select('nbcType', 'Input Format', [
        { value: 'bin', label: 'Binary (space-separated bytes)' },
        { value: 'hex', label: 'Hex (0xFF or FF format)' },
        { value: 'dec', label: 'Decimal (space-separated)' },
      ])}
      ${DevPocket.ui.btnRow([{ id: 'nbcFromConvert', label: 'Convert to Text', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('nbcTxtOut', 'Text Output')}
    `));

    container.querySelector('#nbcConvert').addEventListener('click', () => {
      const text = container.querySelector('#nbcTxtIn').value;
      if (!text) return;
      const codes = [...text].map(c => c.codePointAt(0));
      container.querySelector('#nbcBin').textContent = codes.map(c => c.toString(2).padStart(8,'0')).join(' ');
      container.querySelector('#nbcHex').textContent = codes.map(c => c.toString(16).padStart(2,'0').toUpperCase()).join(' ');
      container.querySelector('#nbcDec').textContent = codes.join(' ');
    });

    container.querySelector('#nbcClearTop').addEventListener('click', () => {
      container.querySelector('#nbcTxtIn').value = '';
      ['#nbcBin','#nbcHex','#nbcDec'].forEach(s => container.querySelector(s).textContent = '');
    });

    container.querySelector('#nbcFromConvert').addEventListener('click', () => {
      const val  = container.querySelector('#nbcNumIn').value.trim();
      const type = container.querySelector('#nbcType').value;
      const out  = container.querySelector('#nbcTxtOut');
      try {
        let codes = [];
        if (type === 'bin') {
          codes = val.split(/\s+/).map(b => parseInt(b, 2));
        } else if (type === 'hex') {
          const clean = val.replace(/0x/gi,'').trim();
          codes = clean.split(/\s+/).map(h => parseInt(h, 16));
        } else {
          codes = val.split(/\s+/).map(d => parseInt(d, 10));
        }
        out.textContent = codes.map(c => String.fromCodePoint(c)).join('');
      } catch (e) { out.textContent = `Error: ${e.message}`; }
    });
  }
});
