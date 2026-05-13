'use strict';
// ============================================================
// DevPocket — tools-json.js
// JSON & Data: formatter, validator, tree, CSV/YAML/XML, SQL
// ============================================================

DevPocket.registerCategory({ id: 'json', name: 'JSON & Data', icon: 'braces', order: 3 });

// ---- JSON Formatter / Validator ----
DevPocket.registerTool({
  id: 'json-format',
  name: 'JSON Formatter',
  category: 'json',
  icon: 'braces',
  description: 'Format, validate and minify JSON. Auto-detects and highlights errors.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jfInput', 'JSON Input', 'Paste JSON here…')}
      <div class="btn-row">
        <button class="btn btn-primary" id="jfFormat">Format</button>
        <button class="btn btn-secondary" id="jfMinify">Minify</button>
        <button class="btn btn-secondary" id="jfValidate">Validate</button>
        <select id="jfIndent" style="width:auto">
          <option value="2">2 spaces</option>
          <option value="4">4 spaces</option>
          <option value="	">Tab</option>
        </select>
        <button class="btn btn-danger btn-sm" id="jfClear">Clear</button>
      </div>
      <div id="jfStatus"></div>
      ${DevPocket.ui.output('jfOutput', 'Output')}
    `));

    const inp = container.querySelector('#jfInput');
    const out = container.querySelector('#jfOutput');
    const status = container.querySelector('#jfStatus');

    function showStatus(msg, type) {
      status.innerHTML = DevPocket.ui.msg(msg, type);
    }

    container.querySelector('#jfFormat').addEventListener('click', () => {
      try {
        const indent = container.querySelector('#jfIndent').value;
        const parsed = JSON.parse(inp.value);
        out.textContent = JSON.stringify(parsed, null, indent === '\t' ? '\t' : parseInt(indent));
        showStatus('✓ Valid JSON', 'success');
      } catch (e) { showStatus(`✗ ${e.message}`, 'error'); out.textContent = ''; }
    });

    container.querySelector('#jfMinify').addEventListener('click', () => {
      try {
        out.textContent = JSON.stringify(JSON.parse(inp.value));
        showStatus('✓ Minified', 'success');
      } catch (e) { showStatus(`✗ ${e.message}`, 'error'); }
    });

    container.querySelector('#jfValidate').addEventListener('click', () => {
      try {
        const parsed = JSON.parse(inp.value);
        const keys = Object.keys(parsed).length || (Array.isArray(parsed) ? parsed.length : 0);
        showStatus(`✓ Valid JSON — ${Array.isArray(parsed) ? `Array(${parsed.length})` : `Object(${keys} keys)`}`, 'success');
      } catch (e) { showStatus(`✗ ${e.message}`, 'error'); }
    });

    container.querySelector('#jfClear').addEventListener('click', () => {
      inp.value = ''; out.textContent = ''; status.innerHTML = '';
    });
  }
});

// ---- JSON Tree Viewer ----
DevPocket.registerTool({
  id: 'json-tree',
  name: 'JSON Tree Viewer',
  category: 'json',
  icon: 'network',
  description: 'Interactive collapsible tree view of JSON data with path copying.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jtInput', 'JSON Input', 'Paste JSON to visualize…')}
      ${DevPocket.ui.btnRow([
        { id: 'jtRender', label: 'Render Tree', cls: 'btn-primary' },
        { id: 'jtExpand', label: 'Expand All',  cls: 'btn-secondary' },
        { id: 'jtCollapse', label: 'Collapse All', cls: 'btn-secondary' },
        { id: 'jtClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="jtStatus"></div>
      <div id="jtTree" class="code-block" style="min-height:80px;cursor:default;"></div>
      <div id="jtPath" style="margin-top:8px;font-family:var(--font-mono);font-size:12px;color:var(--text-muted)"></div>
    `));

    function buildNode(data, path) {
      const type = Array.isArray(data) ? 'array' : typeof data;
      if (data === null || type !== 'object') {
        const span = document.createElement('span');
        if (data === null)         span.className = 'tree-null';
        else if (type === 'number') span.className = 'tree-number';
        else if (type === 'boolean') span.className = 'tree-bool';
        else                        span.className = 'tree-string';
        span.textContent = JSON.stringify(data);
        span.style.cursor = 'pointer';
        span.title = 'Click to copy value';
        span.addEventListener('click', e => { e.stopPropagation(); DevPocket.copy(String(data)); });
        return span;
      }

      const isArr = Array.isArray(data);
      const entries = isArr ? data.map((v,i) => [i,v]) : Object.entries(data);
      const wrap = document.createElement('div');
      wrap.className = 'tree-node';

      entries.forEach(([key, val]) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'flex-start';

        const keySpan = document.createElement('span');
        keySpan.className = 'tree-key';
        keySpan.style.cursor = 'pointer';
        keySpan.title = 'Click to copy path';
        const childPath = isArr ? `${path}[${key}]` : `${path}.${key}`;
        keySpan.addEventListener('click', e => {
          e.stopPropagation();
          DevPocket.copy(childPath);
          container.querySelector('#jtPath').textContent = `Path: ${childPath}`;
        });

        const isObj = val !== null && typeof val === 'object';
        if (isObj) {
          const toggle = document.createElement('span');
          toggle.className = 'tree-toggle';
          toggle.textContent = '▾ ';
          const children = document.createElement('div');
          children.className = 'tree-children';
          children.appendChild(buildNode(val, childPath));

          const bracket = Array.isArray(val) ? ['[', ']'] : ['{', '}'];
          const count   = Array.isArray(val) ? val.length : Object.keys(val).length;
          keySpan.textContent = `${isArr ? '' : `"${key}": `}${bracket[0]}`;
          const closingSpan = document.createElement('span');
          closingSpan.style.color = 'var(--text-muted)';
          closingSpan.textContent = ` ${bracket[1]} (${count})`;

          toggle.addEventListener('click', () => {
            const hidden = children.style.display === 'none';
            children.style.display = hidden ? '' : 'none';
            toggle.textContent = hidden ? '▾ ' : '▸ ';
          });

          row.appendChild(toggle);
          row.appendChild(keySpan);
          row.appendChild(closingSpan);
          wrap.appendChild(row);
          wrap.appendChild(children);
        } else {
          keySpan.textContent = isArr ? '' : `"${key}": `;
          row.appendChild(keySpan);
          row.appendChild(buildNode(val, childPath));
          wrap.appendChild(row);
        }
      });
      return wrap;
    }

    container.querySelector('#jtRender').addEventListener('click', () => {
      const status = container.querySelector('#jtStatus');
      const tree = container.querySelector('#jtTree');
      try {
        const data = JSON.parse(container.querySelector('#jtInput').value);
        tree.innerHTML = '';
        tree.appendChild(buildNode(data, '$'));
        status.innerHTML = '';
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`✗ ${e.message}`, 'error');
        tree.innerHTML = '';
      }
    });

    container.querySelector('#jtExpand').addEventListener('click', () => {
      container.querySelectorAll('.tree-children').forEach(el => el.style.display = '');
      container.querySelectorAll('.tree-toggle').forEach(el => el.textContent = '▾ ');
    });

    container.querySelector('#jtCollapse').addEventListener('click', () => {
      container.querySelectorAll('.tree-children').forEach(el => el.style.display = 'none');
      container.querySelectorAll('.tree-toggle').forEach(el => el.textContent = '▸ ');
    });

    container.querySelector('#jtClear').addEventListener('click', () => {
      container.querySelector('#jtInput').value = '';
      container.querySelector('#jtTree').innerHTML = '';
      container.querySelector('#jtStatus').innerHTML = '';
    });
  }
});

// ---- JSON Search ----
DevPocket.registerTool({
  id: 'json-search',
  name: 'JSON Search',
  category: 'json',
  icon: 'search',
  description: 'Search keys and values inside JSON and extract matching paths.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jsInput', 'JSON Input', 'Paste JSON to search…')}
      ${DevPocket.ui.input('jsQuery', 'Search Query', 'Search key or value…')}
      ${DevPocket.ui.btnRow([
        { id: 'jsSearch', label: 'Search', cls: 'btn-primary' },
        { id: 'jsClear',  label: 'Clear',  cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('jsOut', 'Matches (path → value)')}
    `));

    function search(obj, query, path, results) {
      const q = query.toLowerCase();
      if (obj === null || typeof obj !== 'object') {
        if (String(obj).toLowerCase().includes(q)) results.push(`${path}  →  ${JSON.stringify(obj)}`);
        return;
      }
      Object.entries(obj).forEach(([k, v]) => {
        const childPath = Array.isArray(obj) ? `${path}[${k}]` : `${path}.${k}`;
        if (k.toLowerCase().includes(q)) results.push(`${childPath}  (key match)`);
        search(v, query, childPath, results);
      });
    }

    container.querySelector('#jsSearch').addEventListener('click', () => {
      const out = container.querySelector('#jsOut');
      try {
        const data  = JSON.parse(container.querySelector('#jsInput').value);
        const query = container.querySelector('#jsQuery').value.trim();
        if (!query) { out.textContent = 'Enter a search query'; return; }
        const results = [];
        search(data, query, '$', results);
        out.textContent = results.length ? results.join('\n') : `No matches found for "${query}"`;
      } catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jsClear').addEventListener('click', () => {
      container.querySelector('#jsInput').value = '';
      container.querySelector('#jsQuery').value = '';
      container.querySelector('#jsOut').textContent = '';
    });
  }
});

// ---- JSON ↔ CSV ----
DevPocket.registerTool({
  id: 'json-csv',
  name: 'JSON ↔ CSV',
  category: 'json',
  icon: 'table',
  description: 'Convert JSON arrays to CSV and CSV back to JSON.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jcInput', 'Input', 'Paste JSON array or CSV…')}
      ${DevPocket.ui.btnRow([
        { id: 'jcToCSV',  label: 'JSON → CSV',  cls: 'btn-primary' },
        { id: 'jcToJSON', label: 'CSV → JSON',  cls: 'btn-secondary' },
        { id: 'jcDl',     label: 'Download',    cls: 'btn-secondary btn-sm' },
        { id: 'jcClear',  label: 'Clear',        cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('jcOut', 'Output')}
    `));

    const inp = container.querySelector('#jcInput');
    const out = container.querySelector('#jcOut');

    function jsonToCSV(json) {
      const arr = JSON.parse(json);
      if (!Array.isArray(arr) || !arr.length) throw new Error('Expected a non-empty JSON array');
      const keys = [...new Set(arr.flatMap(o => Object.keys(o || {})))];
      const escape = v => { const s = v == null ? '' : String(v); return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s; };
      return [keys.join(','), ...arr.map(row => keys.map(k => escape(row[k])).join(','))].join('\n');
    }

    function csvToJSON(csv) {
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g,''));
      return JSON.stringify(lines.slice(1).map(line => {
        const vals = line.match(/(".*?(?<!\\)"|[^,]+|(?<=,)(?=,)|^(?=,)|(?<=,)$)/g) || [];
        return Object.fromEntries(headers.map((h, i) => [h, (vals[i] || '').trim().replace(/^"|"$/g,'')]));
      }), null, 2);
    }

    container.querySelector('#jcToCSV').addEventListener('click', () => {
      try { out.textContent = jsonToCSV(inp.value); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jcToJSON').addEventListener('click', () => {
      try { out.textContent = csvToJSON(inp.value); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jcDl').addEventListener('click', () => {
      const text = out.textContent;
      if (!text) return;
      const isCSV = text.trim().startsWith('{') || text.trim().startsWith('[') ? false : true;
      DevPocket.download(isCSV ? 'export.csv' : 'export.json', text, isCSV ? 'text/csv' : 'application/json');
    });

    container.querySelector('#jcClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- JSON ↔ YAML ----
DevPocket.registerTool({
  id: 'json-yaml',
  name: 'JSON ↔ YAML',
  category: 'json',
  icon: 'file-code',
  description: 'Convert between JSON and YAML formats.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jyInput', 'Input', 'Paste JSON or YAML…')}
      ${DevPocket.ui.btnRow([
        { id: 'jyToYAML', label: 'JSON → YAML', cls: 'btn-primary' },
        { id: 'jyToJSON', label: 'YAML → JSON', cls: 'btn-secondary' },
        { id: 'jyClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('jyOut', 'Output')}
    `));

    const inp = container.querySelector('#jyInput');
    const out = container.querySelector('#jyOut');

    container.querySelector('#jyToYAML').addEventListener('click', () => {
      if (typeof jsyaml === 'undefined') { out.textContent = 'js-yaml library not loaded'; return; }
      try { out.textContent = jsyaml.dump(JSON.parse(inp.value)); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jyToJSON').addEventListener('click', () => {
      if (typeof jsyaml === 'undefined') { out.textContent = 'js-yaml library not loaded'; return; }
      try { out.textContent = JSON.stringify(jsyaml.load(inp.value), null, 2); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jyClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- JSON ↔ XML ----
DevPocket.registerTool({
  id: 'json-xml',
  name: 'JSON ↔ XML',
  category: 'json',
  icon: 'code-xml',
  description: 'Convert between JSON and XML formats.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jxInput', 'Input', 'Paste JSON or XML…')}
      ${DevPocket.ui.btnRow([
        { id: 'jxToXML',  label: 'JSON → XML', cls: 'btn-primary' },
        { id: 'jxToJSON', label: 'XML → JSON', cls: 'btn-secondary' },
        { id: 'jxClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('jxOut', 'Output')}
    `));

    const inp = container.querySelector('#jxInput');
    const out = container.querySelector('#jxOut');

    function jsonToXML(obj, tag = 'root', indent = '') {
      if (Array.isArray(obj)) {
        return obj.map(item => jsonToXML(item, 'item', indent)).join('\n');
      }
      if (obj !== null && typeof obj === 'object') {
        const inner = Object.entries(obj).map(([k, v]) => jsonToXML(v, k, indent + '  ')).join('\n');
        return `${indent}<${tag}>\n${inner}\n${indent}</${tag}>`;
      }
      return `${indent}<${tag}>${obj === null ? '' : String(obj).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</${tag}>`;
    }

    function xmlToJSON(xmlStr) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlStr, 'text/xml');
      if (doc.querySelector('parsererror')) throw new Error('Invalid XML');
      function nodeToObj(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim();
        const obj = {};
        [...node.children].forEach(child => {
          const val = child.children.length ? nodeToObj(child) : child.textContent.trim();
          if (obj[child.tagName] !== undefined) {
            if (!Array.isArray(obj[child.tagName])) obj[child.tagName] = [obj[child.tagName]];
            obj[child.tagName].push(val);
          } else {
            obj[child.tagName] = val;
          }
        });
        return obj;
      }
      return JSON.stringify(nodeToObj(doc.documentElement), null, 2);
    }

    container.querySelector('#jxToXML').addEventListener('click', () => {
      try { out.textContent = `<?xml version="1.0"?>\n${jsonToXML(JSON.parse(inp.value))}`; }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jxToJSON').addEventListener('click', () => {
      try { out.textContent = xmlToJSON(inp.value); }
      catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#jxClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- JSON → Table ----
DevPocket.registerTool({
  id: 'json-table',
  name: 'JSON → Table',
  category: 'json',
  icon: 'table-2',
  description: 'Render a JSON array as an interactive HTML table.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jtblInput', 'JSON Array Input', 'Paste a JSON array of objects…')}
      ${DevPocket.ui.btnRow([
        { id: 'jtblRender', label: 'Render Table', cls: 'btn-primary' },
        { id: 'jtblClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="jtblStatus"></div>
      <div id="jtblOut" class="table-wrap" style="min-height:60px;"></div>
    `));

    container.querySelector('#jtblRender').addEventListener('click', () => {
      const status = container.querySelector('#jtblStatus');
      const tbl    = container.querySelector('#jtblOut');
      try {
        const arr = JSON.parse(container.querySelector('#jtblInput').value);
        if (!Array.isArray(arr)) throw new Error('Expected a JSON array');
        const keys = [...new Set(arr.flatMap(o => Object.keys(o || {})))];
        const thead = `<tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr>`;
        const tbody = arr.map(row =>
          `<tr>${keys.map(k => `<td>${row[k] == null ? '' : String(row[k])}</td>`).join('')}</tr>`
        ).join('');
        tbl.innerHTML = `<table class="data-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
        status.innerHTML = '';
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`✗ ${e.message}`, 'error');
        tbl.innerHTML = '';
      }
    });

    container.querySelector('#jtblClear').addEventListener('click', () => {
      container.querySelector('#jtblInput').value = '';
      container.querySelector('#jtblOut').innerHTML = '';
      container.querySelector('#jtblStatus').innerHTML = '';
    });
  }
});

// ---- SQL Formatter ----
DevPocket.registerTool({
  id: 'sql-format',
  name: 'SQL Formatter',
  category: 'json',
  icon: 'database',
  description: 'Format and beautify SQL queries.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('sqlInput', 'SQL Input', 'Paste SQL query…')}
      ${DevPocket.ui.select('sqlDialect', 'Dialect', [
        { value: 'sql', label: 'Standard SQL' },
        { value: 'mysql', label: 'MySQL' },
        { value: 'postgresql', label: 'PostgreSQL' },
        { value: 'sqlite', label: 'SQLite' },
        { value: 'bigquery', label: 'BigQuery' },
      ])}
      ${DevPocket.ui.btnRow([
        { id: 'sqlFmt',   label: 'Format',   cls: 'btn-primary' },
        { id: 'sqlMin',   label: 'Minify',   cls: 'btn-secondary' },
        { id: 'sqlClear', label: 'Clear',    cls: 'btn-danger btn-sm' },
      ])}
      ${DevPocket.ui.output('sqlOut', 'Formatted SQL')}
    `));

    const inp = container.querySelector('#sqlInput');
    const out = container.querySelector('#sqlOut');

    function basicFormat(sql) {
      const keywords = ['SELECT','FROM','WHERE','AND','OR','JOIN','LEFT JOIN','RIGHT JOIN','INNER JOIN','OUTER JOIN','ON','GROUP BY','ORDER BY','HAVING','LIMIT','OFFSET','INSERT INTO','VALUES','UPDATE','SET','DELETE FROM','CREATE TABLE','DROP TABLE','ALTER TABLE','UNION','EXCEPT','INTERSECT','WITH'];
      let result = sql;
      keywords.forEach(kw => {
        result = result.replace(new RegExp(`\\b${kw}\\b`, 'gi'), `\n${kw}`);
      });
      return result.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n');
    }

    container.querySelector('#sqlFmt').addEventListener('click', () => {
      const sql  = inp.value.trim();
      const lang = container.querySelector('#sqlDialect').value;
      if (!sql) { DevPocket.toast('Enter some SQL', 'error'); return; }
      if (typeof sqlFormatter !== 'undefined' && sqlFormatter.format) {
        try { out.textContent = sqlFormatter.format(sql, { language: lang, tabWidth: 2 }); return; }
        catch (_) {}
      }
      out.textContent = basicFormat(sql);
    });

    container.querySelector('#sqlMin').addEventListener('click', () => {
      out.textContent = inp.value.replace(/\s+/g, ' ').trim();
    });

    container.querySelector('#sqlClear').addEventListener('click', () => { inp.value = ''; out.textContent = ''; });
  }
});

// ---- YAML Formatter ----
DevPocket.registerTool({
  id: 'yaml-format',
  name: 'YAML Formatter',
  category: 'json',
  icon: 'file-code-2',
  description: 'Validate and pretty-print YAML documents.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('yamlInput', 'YAML Input', 'Paste YAML…')}
      ${DevPocket.ui.btnRow([
        { id: 'yamlFmt',   label: 'Format / Validate', cls: 'btn-primary' },
        { id: 'yamlClear', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="yamlStatus"></div>
      ${DevPocket.ui.output('yamlOut', 'Formatted YAML')}
    `));

    container.querySelector('#yamlFmt').addEventListener('click', () => {
      const status = container.querySelector('#yamlStatus');
      const out    = container.querySelector('#yamlOut');
      if (typeof jsyaml === 'undefined') { out.textContent = 'js-yaml library not loaded'; return; }
      try {
        const parsed = jsyaml.load(container.querySelector('#yamlInput').value);
        out.textContent = jsyaml.dump(parsed, { lineWidth: 100 });
        status.innerHTML = DevPocket.ui.msg('✓ Valid YAML', 'success');
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`✗ ${e.message}`, 'error');
        out.textContent = '';
      }
    });

    container.querySelector('#yamlClear').addEventListener('click', () => {
      container.querySelector('#yamlInput').value = '';
      container.querySelector('#yamlOut').textContent = '';
      container.querySelector('#yamlStatus').innerHTML = '';
    });
  }
});
