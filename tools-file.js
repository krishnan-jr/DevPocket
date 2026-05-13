'use strict';
// ============================================================
// DevPocket — tools-file.js
// File Utilities: text viewer, CSV viewer, image tools, PDF
// ============================================================

DevPocket.registerCategory({ id: 'file', name: 'File Utilities', icon: 'folder', order: 7 });

// ---- Text File Viewer ----
DevPocket.registerTool({
  id: 'text-viewer',
  name: 'Text File Viewer',
  category: 'file',
  icon: 'file-text',
  description: 'Open and view text files with line numbers and stats.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Select Text File</label>
        <input type="file" id="tvFile" accept=".txt,.md,.csv,.json,.xml,.yaml,.yml,.js,.ts,.html,.css,.log,.conf,.env,.sh,.py,.java,.go,.rs,.sql" style="color:var(--text-primary)" />
      </div>
      <div class="stats-row" id="tvStats" style="display:none">
        ${DevPocket.ui.statChip('Lines',      'tvLines')}
        ${DevPocket.ui.statChip('Characters', 'tvChars')}
        ${DevPocket.ui.statChip('Words',      'tvWords')}
        ${DevPocket.ui.statChip('Size',       'tvSize')}
      </div>
      <div class="form-group" id="tvSearch" style="display:none">
        <input type="text" id="tvSearchInput" placeholder="Search in file…" />
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'tvCopyAll',  label: 'Copy All',       cls: 'btn-secondary btn-sm' },
        { id: 'tvDownload', label: 'Download',        cls: 'btn-secondary btn-sm' },
        { id: 'tvClear',    label: 'Clear',           cls: 'btn-danger btn-sm' },
      ])}
      <div id="tvContent" class="code-block" style="min-height:200px;max-height:600px;overflow:auto;display:none;counter-reset:line"></div>
    `));

    let fileContent = '';
    let fileName    = '';

    function displayContent(text, hl = '') {
      const lines = text.split('\n');
      const q     = hl.toLowerCase();
      const el    = container.querySelector('#tvContent');
      el.innerHTML = lines.map((line, i) => {
        const safe = line.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const highlighted = q && line.toLowerCase().includes(q)
          ? safe.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'gi'), m => `<mark style="background:rgba(79,142,247,0.4);border-radius:2px">${m}</mark>`)
          : safe;
        return `<div style="display:flex;gap:12px"><span style="color:var(--text-muted);min-width:36px;text-align:right;user-select:none">${i+1}</span><span style="flex:1;white-space:pre-wrap;word-break:break-all">${highlighted}</span></div>`;
      }).join('');
    }

    container.querySelector('#tvFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      fileName = file.name;
      const reader = new FileReader();
      reader.onload = ev => {
        fileContent = ev.target.result;
        const words = fileContent.trim().split(/\s+/).filter(Boolean).length;
        container.querySelector('#tvLines').textContent = fileContent.split('\n').length.toLocaleString();
        container.querySelector('#tvChars').textContent = fileContent.length.toLocaleString();
        container.querySelector('#tvWords').textContent = words.toLocaleString();
        container.querySelector('#tvSize').textContent  = file.size > 1024*1024 ? `${(file.size/1024/1024).toFixed(1)} MB` : `${(file.size/1024).toFixed(1)} KB`;
        container.querySelector('#tvStats').style.display   = '';
        container.querySelector('#tvSearch').style.display  = '';
        container.querySelector('#tvContent').style.display = '';
        displayContent(fileContent);
      };
      reader.readAsText(file);
    });

    container.querySelector('#tvSearchInput').addEventListener('input', function() {
      if (fileContent) displayContent(fileContent, this.value);
    });

    container.querySelector('#tvCopyAll').addEventListener('click', () => DevPocket.copy(fileContent));
    container.querySelector('#tvDownload').addEventListener('click', () => {
      if (fileContent) DevPocket.download(fileName || 'file.txt', fileContent);
    });
    container.querySelector('#tvClear').addEventListener('click', () => {
      fileContent = '';
      container.querySelector('#tvFile').value = '';
      container.querySelector('#tvContent').innerHTML = '';
      container.querySelector('#tvStats').style.display  = 'none';
      container.querySelector('#tvSearch').style.display = 'none';
      container.querySelector('#tvContent').style.display = 'none';
    });
  }
});

// ---- CSV Viewer ----
DevPocket.registerTool({
  id: 'csv-viewer',
  name: 'CSV Viewer',
  category: 'file',
  icon: 'table',
  description: 'View CSV files as a sortable, searchable table.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Select CSV File or Paste CSV</label>
        <input type="file" id="csvFile" accept=".csv,.tsv,.txt" style="color:var(--text-primary);margin-bottom:8px" />
        <textarea id="csvPaste" class="mono" style="min-height:80px" placeholder="…or paste CSV here"></textarea>
      </div>
      <div class="form-group" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label class="form-label" style="margin:0">Delimiter:</label>
        <select id="csvDelim" style="width:auto">
          <option value=",">Comma (,)</option>
          <option value="	">Tab</option>
          <option value=";">Semicolon (;)</option>
          <option value="|">Pipe (|)</option>
        </select>
        <input type="text" id="csvSearch" placeholder="Filter rows…" style="flex:1;min-width:140px" />
        <button class="btn btn-primary" id="csvRender">Render Table</button>
        <button class="btn btn-danger btn-sm" id="csvClear">Clear</button>
      </div>
      <div id="csvStats" class="stats-row" style="display:none">
        ${DevPocket.ui.statChip('Rows',    'csvRows')}
        ${DevPocket.ui.statChip('Columns', 'csvCols')}
      </div>
      <div id="csvTable" class="table-wrap mt-8" style="max-height:500px;min-height:40px"></div>
    `));

    let parsedData = [];
    let headers    = [];

    function parseCSV(text, delim = ',') {
      const lines = text.trim().split('\n').filter(Boolean);
      if (!lines.length) return { headers: [], rows: [] };
      const parseRow = line => {
        const cells = [];
        let cur = '', inQ = false;
        for (const ch of line) {
          if (ch === '"') { inQ = !inQ; }
          else if (ch === delim && !inQ) { cells.push(cur); cur = ''; }
          else cur += ch;
        }
        cells.push(cur);
        return cells.map(c => c.trim().replace(/^"|"$/g,''));
      };
      return { headers: parseRow(lines[0]), rows: lines.slice(1).map(parseRow) };
    }

    function renderTable(filter = '') {
      const q   = filter.toLowerCase();
      const rows = parsedData.filter(row => !q || row.some(c => c.toLowerCase().includes(q)));
      if (!rows.length) {
        container.querySelector('#csvTable').innerHTML = `<p style="padding:12px;color:var(--text-muted)">No rows match "${filter}"</p>`;
        return;
      }
      container.querySelector('#csvRows').textContent = rows.length.toLocaleString();
      container.querySelector('#csvCols').textContent = headers.length;
      container.querySelector('#csvStats').style.display = '';

      const thead = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
      const tbody = rows.map(row =>
        `<tr>${headers.map((_, i) => `<td>${row[i] ?? ''}</td>`).join('')}</tr>`
      ).join('');
      container.querySelector('#csvTable').innerHTML =
        `<table class="data-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
    }

    container.querySelector('#csvFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => { container.querySelector('#csvPaste').value = ev.target.result; };
      reader.readAsText(file);
    });

    container.querySelector('#csvRender').addEventListener('click', () => {
      const text  = container.querySelector('#csvPaste').value.trim();
      const delim = container.querySelector('#csvDelim').value;
      if (!text) { DevPocket.toast('Provide CSV data', 'error'); return; }
      const { headers: h, rows } = parseCSV(text, delim);
      headers    = h;
      parsedData = rows;
      renderTable();
    });

    container.querySelector('#csvSearch').addEventListener('input', function() { renderTable(this.value); });

    container.querySelector('#csvClear').addEventListener('click', () => {
      container.querySelector('#csvFile').value  = '';
      container.querySelector('#csvPaste').value = '';
      container.querySelector('#csvTable').innerHTML = '';
      container.querySelector('#csvStats').style.display = 'none';
      parsedData = []; headers = [];
    });
  }
});

// ---- Image Metadata Viewer ----
DevPocket.registerTool({
  id: 'image-meta',
  name: 'Image Metadata Viewer',
  category: 'file',
  icon: 'image',
  description: 'View image dimensions, file size, type and color analysis.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Select Image File</label>
        <input type="file" id="imgMetaFile" accept="image/*" style="color:var(--text-primary)" />
      </div>
      <div id="imgMetaResult"></div>
    `));

    container.querySelector('#imgMetaFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const url    = URL.createObjectURL(file);
      const img    = new Image();
      const result = container.querySelector('#imgMetaResult');
      img.onload = () => {
        // Sample dominant colors from canvas
        const cv = document.createElement('canvas');
        cv.width = cv.height = 50;
        const ctx = cv.getContext('2d');
        ctx.drawImage(img, 0, 0, 50, 50);
        const data    = ctx.getImageData(0, 0, 50, 50).data;
        const samples = [];
        for (let i = 0; i < data.length; i += 100) {
          const r = data[i], g = data[i+1], b = data[i+2];
          samples.push(`#${[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase()}`);
        }
        const unique = [...new Set(samples)].slice(0, 6);

        result.innerHTML = `
          <img src="${url}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid var(--border);margin-bottom:12px" />
          <div class="stats-row">
            <div class="stat-chip"><span>File Name</span><strong>${file.name}</strong></div>
            <div class="stat-chip"><span>Type</span><strong>${file.type}</strong></div>
            <div class="stat-chip"><span>Size</span><strong>${file.size > 1048576 ? (file.size/1048576).toFixed(2)+' MB' : (file.size/1024).toFixed(1)+' KB'}</strong></div>
            <div class="stat-chip"><span>Dimensions</span><strong>${img.naturalWidth} × ${img.naturalHeight}px</strong></div>
            <div class="stat-chip"><span>Aspect Ratio</span><strong>${(img.naturalWidth/img.naturalHeight).toFixed(3)}</strong></div>
            <div class="stat-chip"><span>Megapixels</span><strong>${((img.naturalWidth*img.naturalHeight)/1e6).toFixed(2)} MP</strong></div>
          </div>
          <div class="form-label mt-8">Sample Colors</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${unique.map(c => `<div title="${c}" style="width:36px;height:36px;background:${c};border-radius:6px;border:1px solid var(--border);cursor:pointer" onclick="DevPocket.copy('${c}')"></div>`).join('')}
          </div>`;
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  }
});

// ---- Image Compressor / Resizer / Converter ----
DevPocket.registerTool({
  id: 'image-tools',
  name: 'Image Tools',
  category: 'file',
  icon: 'image-plus',
  description: 'Compress, resize and convert images (PNG, JPEG, WebP) in the browser.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Select Image</label>
        <input type="file" id="imgFile" accept="image/*" style="color:var(--text-primary)" />
      </div>
      <div id="imgOrigInfo" style="display:none">
        <div class="stats-row" id="imgOrigStats"></div>
      </div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'imgCompress', label: 'Compress',
          content: `
            <div class="form-group">
              <label class="form-label">Quality: <strong id="imgQualVal">80</strong>%</label>
              <input type="range" id="imgQual" min="1" max="100" value="80" />
            </div>
            ${DevPocket.ui.select('imgOutFmt', 'Output Format', [
              { value: 'image/jpeg', label: 'JPEG' },
              { value: 'image/png',  label: 'PNG'  },
              { value: 'image/webp', label: 'WebP' },
            ])}
            ${DevPocket.ui.btnRow([{ id: 'imgCompr', label: 'Compress', cls: 'btn-primary' }])}`
        },
        {
          id: 'imgResize', label: 'Resize',
          content: `
            <div class="grid-2">
              ${DevPocket.ui.input('imgW', 'Width (px)', '', 'number')}
              ${DevPocket.ui.input('imgH', 'Height (px)', '', 'number')}
            </div>
            <label class="check-group" style="margin-bottom:12px"><input type="checkbox" id="imgAspect" checked /> Keep aspect ratio</label>
            ${DevPocket.ui.btnRow([{ id: 'imgResize2', label: 'Resize', cls: 'btn-primary' }])}`
        },
      ])}
      <div id="imgResult" style="margin-top:12px;display:none">
        <div class="stats-row" id="imgResultStats"></div>
        <canvas id="imgCanvas" style="max-width:100%;border-radius:8px;border:1px solid var(--border);margin-top:8px;display:block"></canvas>
        <div class="btn-row mt-8">
          <button class="btn btn-success" id="imgDl">Download</button>
        </div>
      </div>
    `));

    let origImage  = null;
    let origFile   = null;
    let outputFmt  = 'image/jpeg';
    let outputBlob = null;

    container.querySelector('#imgQual').addEventListener('input', function() {
      container.querySelector('#imgQualVal').textContent = this.value;
    });

    container.querySelector('#imgFile').addEventListener('change', e => {
      origFile = e.target.files[0];
      if (!origFile) return;
      const url = URL.createObjectURL(origFile);
      const img = new Image();
      img.onload = () => {
        origImage = img;
        container.querySelector('#imgW').value = img.naturalWidth;
        container.querySelector('#imgH').value = img.naturalHeight;
        container.querySelector('#imgOrigStats').innerHTML = [
          `<div class="stat-chip"><span>Original</span><strong>${img.naturalWidth}×${img.naturalHeight}px</strong></div>`,
          `<div class="stat-chip"><span>Size</span><strong>${(origFile.size/1024).toFixed(1)} KB</strong></div>`,
          `<div class="stat-chip"><span>Type</span><strong>${origFile.type}</strong></div>`,
        ].join('');
        container.querySelector('#imgOrigInfo').style.display = '';
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });

    function processImage(width, height, quality, fmt) {
      if (!origImage) { DevPocket.toast('Select an image first', 'error'); return; }
      outputFmt = fmt || container.querySelector('#imgOutFmt').value;
      const cv  = container.querySelector('#imgCanvas');
      cv.width  = width;
      cv.height = height;
      const ctx = cv.getContext('2d');
      ctx.drawImage(origImage, 0, 0, width, height);
      cv.toBlob(blob => {
        outputBlob = blob;
        container.querySelector('#imgResultStats').innerHTML = [
          `<div class="stat-chip"><span>Output</span><strong>${width}×${height}px</strong></div>`,
          `<div class="stat-chip"><span>New Size</span><strong>${(blob.size/1024).toFixed(1)} KB</strong></div>`,
          `<div class="stat-chip"><span>Reduction</span><strong>${Math.round((1 - blob.size/origFile.size)*100)}%</strong></div>`,
        ].join('');
        container.querySelector('#imgResult').style.display = '';
      }, outputFmt, quality / 100);
    }

    container.querySelector('#imgCompr').addEventListener('click', () => {
      if (!origImage) { DevPocket.toast('Select an image first', 'error'); return; }
      const q = parseInt(container.querySelector('#imgQual').value);
      processImage(origImage.naturalWidth, origImage.naturalHeight, q);
    });

    container.querySelector('#imgResize2').addEventListener('click', () => {
      if (!origImage) { DevPocket.toast('Select an image first', 'error'); return; }
      let w = parseInt(container.querySelector('#imgW').value) || origImage.naturalWidth;
      let h = parseInt(container.querySelector('#imgH').value) || origImage.naturalHeight;
      if (container.querySelector('#imgAspect').checked) {
        const ratio = origImage.naturalWidth / origImage.naturalHeight;
        const activeInput = document.activeElement;
        if (activeInput && activeInput.id === 'imgW') h = Math.round(w / ratio);
        else w = Math.round(h * ratio);
      }
      processImage(w, h, 90, container.querySelector('#imgOutFmt').value);
    });

    container.querySelector('#imgW').addEventListener('change', function() {
      if (origImage && container.querySelector('#imgAspect').checked) {
        container.querySelector('#imgH').value = Math.round(+this.value / (origImage.naturalWidth / origImage.naturalHeight));
      }
    });

    container.querySelector('#imgH').addEventListener('change', function() {
      if (origImage && container.querySelector('#imgAspect').checked) {
        container.querySelector('#imgW').value = Math.round(+this.value * (origImage.naturalWidth / origImage.naturalHeight));
      }
    });

    container.querySelector('#imgDl').addEventListener('click', () => {
      if (!outputBlob) return;
      const ext = outputFmt.split('/')[1] || 'jpg';
      const url = URL.createObjectURL(outputBlob);
      const a   = Object.assign(document.createElement('a'), { href: url, download: `output.${ext}` });
      a.click();
      URL.revokeObjectURL(url);
    });
  }
});

// ---- PDF Metadata & Text Extractor ----
DevPocket.registerTool({
  id: 'pdf-tools',
  name: 'PDF Metadata & Text',
  category: 'file',
  icon: 'file',
  description: 'View PDF metadata and extract text content without any server.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Select PDF File</label>
        <input type="file" id="pdfFile" accept=".pdf" style="color:var(--text-primary)" />
      </div>
      <div id="pdfStatus"></div>
      <div id="pdfMeta" class="stats-row" style="display:none"></div>
      ${DevPocket.ui.output('pdfText', 'Extracted Text')}
    `));

    container.querySelector('#pdfFile').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      const status = container.querySelector('#pdfStatus');
      const meta   = container.querySelector('#pdfMeta');
      const out    = container.querySelector('#pdfText');

      status.innerHTML = DevPocket.ui.msg('Reading PDF…', 'info');
      meta.style.display = 'none';

      const reader = new FileReader();
      reader.onload = ev => {
        const bytes = new Uint8Array(ev.target.result);
        const txt   = new TextDecoder('latin1').decode(bytes);

        // Extract metadata from PDF header comments
        const get = key => {
          const m = txt.match(new RegExp(`/${key}\\s*\\(([^)]+)\\)`));
          return m ? m[1] : null;
        };

        const info = {
          'File':     file.name,
          'Size':     `${(file.size/1024).toFixed(1)} KB`,
          'Title':    get('Title') || '—',
          'Author':   get('Author') || '—',
          'Creator':  get('Creator') || '—',
          'Producer': get('Producer') || '—',
          'Created':  get('CreationDate') || '—',
        };

        meta.innerHTML = Object.entries(info).map(([k,v]) =>
          `<div class="stat-chip"><span>${k}</span><strong>${v}</strong></div>`
        ).join('');
        meta.style.display = '';

        // Naive text extraction from PDF content streams
        const textMatches = [...txt.matchAll(/\(([^)]{1,500})\)\s*Tj/g)];
        const extracted   = textMatches.map(m => m[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '')
          .replace(/\\t/g, '\t')
          .replace(/\\\(/g,'(')
          .replace(/\\\)/g,')')
        ).join(' ').trim();

        out.textContent = extracted || '(Could not extract text — PDF may be image-based or encrypted)';
        status.innerHTML = DevPocket.ui.msg(`✓ Processed — ${textMatches.length} text elements found`, 'success');
      };
      reader.readAsArrayBuffer(file);
    });
  }
});
