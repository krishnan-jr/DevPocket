'use strict';
// ============================================================
// DevPocket — tools-api.js
// API & Network helpers + Generators
// ============================================================

DevPocket.registerCategory({ id: 'api',  name: 'API & Network',  icon: 'radio', order: 8 });
DevPocket.registerCategory({ id: 'gen',  name: 'Generators',     icon: 'wand-2', order: 9 });

// ---- REST Request Builder ----
DevPocket.registerTool({
  id: 'rest-builder',
  name: 'REST Request Builder',
  category: 'api',
  icon: 'send',
  description: 'Build and fire HTTP requests from the browser (CORS permitting).',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div style="display:flex;gap:8px;align-items:stretch">
        <select id="rbMethod" style="width:110px">
          <option>GET</option><option>POST</option><option>PUT</option>
          <option>PATCH</option><option>DELETE</option><option>HEAD</option><option>OPTIONS</option>
        </select>
        <input type="url" id="rbUrl" placeholder="https://api.example.com/endpoint" style="flex:1" />
      </div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'rbHeaders', label: 'Headers',
          content: `<div class="form-group">
            <label class="form-label">Headers (one per line: Key: Value)</label>
            <textarea id="rbHeadersInput" class="mono" style="min-height:100px" placeholder="Content-Type: application/json\nAuthorization: Bearer token"></textarea>
          </div>`
        },
        {
          id: 'rbBody', label: 'Body',
          content: `<div class="form-group">
            <label class="form-label">Request Body</label>
            <textarea id="rbBodyInput" class="mono" style="min-height:120px" placeholder='{"key": "value"}'></textarea>
          </div>`
        },
        {
          id: 'rbParams', label: 'Query Params',
          content: `<div class="form-group">
            <label class="form-label">Params (one per line: key=value)</label>
            <textarea id="rbParamsInput" class="mono" style="min-height:80px" placeholder="page=1\nlimit=20\nsort=created_at"></textarea>
          </div>`
        },
      ])}
      ${DevPocket.ui.btnRow([
        { id: 'rbSend',    label: 'Send Request', cls: 'btn-primary' },
        { id: 'rbCurlGen', label: 'Generate cURL',  cls: 'btn-secondary' },
        { id: 'rbClear',   label: 'Clear',          cls: 'btn-danger btn-sm' },
      ])}
    `));

    container.insertAdjacentHTML('beforeend', `<div id="rbResponseWrap" style="display:none">` + DevPocket.ui.card(`
      <div class="stats-row" id="rbStats"></div>
      ${DevPocket.ui.output('rbResponse', 'Response')}
    `) + `</div>`);

    container.insertAdjacentHTML('beforeend', `<div id="rbCurlWrap" style="display:none">` + DevPocket.ui.card(`
      ${DevPocket.ui.output('rbCurl', 'cURL Command')}
    `) + `</div>`);

    function getHeaders() {
      const lines = container.querySelector('#rbHeadersInput').value.trim().split('\n').filter(Boolean);
      const hdrs  = {};
      lines.forEach(l => { const [k,...rest] = l.split(':'); if(k) hdrs[k.trim()] = rest.join(':').trim(); });
      return hdrs;
    }

    function buildUrl() {
      const base   = container.querySelector('#rbUrl').value.trim();
      const params = container.querySelector('#rbParamsInput').value.trim();
      if (!params) return base;
      const q = params.split('\n').filter(Boolean).map(l => {
        const [k,...v] = l.split('='); return `${encodeURIComponent(k.trim())}=${encodeURIComponent(v.join('=').trim())}`;
      }).join('&');
      return base.includes('?') ? `${base}&${q}` : `${base}?${q}`;
    }

    container.querySelector('#rbSend').addEventListener('click', async () => {
      const url    = buildUrl();
      const method = container.querySelector('#rbMethod').value;
      if (!url) { DevPocket.toast('Enter a URL', 'error'); return; }

      const wrap = container.querySelector('#rbResponseWrap');
      wrap.style.display = '';
      container.querySelector('#rbResponse').textContent = 'Loading…';
      container.querySelector('#rbStats').innerHTML = '';

      const t0 = performance.now();
      try {
        const opts = { method, headers: getHeaders() };
        const body = container.querySelector('#rbBodyInput').value.trim();
        if (body && !['GET','HEAD'].includes(method)) opts.body = body;

        const res  = await fetch(url, opts);
        const time = Math.round(performance.now() - t0);
        const text = await res.text();

        let formatted = text;
        if (res.headers.get('content-type')?.includes('json')) {
          try { formatted = JSON.stringify(JSON.parse(text), null, 2); } catch(_) {}
        }

        container.querySelector('#rbStats').innerHTML = [
          `<div class="stat-chip"><span>Status</span><strong class="${res.ok ? 'text-success' : 'text-error'}">${res.status} ${res.statusText}</strong></div>`,
          `<div class="stat-chip"><span>Time</span><strong>${time}ms</strong></div>`,
          `<div class="stat-chip"><span>Size</span><strong>${new Blob([text]).size} B</strong></div>`,
          `<div class="stat-chip"><span>Type</span><strong>${res.headers.get('content-type') || '—'}</strong></div>`,
        ].join('');
        container.querySelector('#rbResponse').textContent = formatted;
      } catch (e) {
        container.querySelector('#rbResponse').textContent = `Error: ${e.message}\n\nNote: CORS may be blocking this request. Use a CORS-enabled endpoint or a proxy.`;
        container.querySelector('#rbStats').innerHTML = DevPocket.ui.msg(`Request failed: ${e.message}`, 'error');
      }
    });

    container.querySelector('#rbCurlGen').addEventListener('click', () => {
      const url    = buildUrl();
      const method = container.querySelector('#rbMethod').value;
      const hdrs   = getHeaders();
      const body   = container.querySelector('#rbBodyInput').value.trim();

      let curl = `curl -X ${method} '${url}'`;
      Object.entries(hdrs).forEach(([k,v]) => { curl += `\\\n  -H '${k}: ${v}'`; });
      if (body) curl += `\\\n  -d '${body.replace(/'/g,"'\\''")}'`;

      container.querySelector('#rbCurlWrap').style.display = '';
      container.querySelector('#rbCurl').textContent = curl;
    });

    container.querySelector('#rbClear').addEventListener('click', () => {
      container.querySelector('#rbUrl').value           = '';
      container.querySelector('#rbHeadersInput').value  = '';
      container.querySelector('#rbBodyInput').value     = '';
      container.querySelector('#rbParamsInput').value   = '';
      container.querySelector('#rbResponseWrap').style.display = 'none';
      container.querySelector('#rbCurlWrap').style.display    = 'none';
    });
  }
});

// ---- Query String Builder / Parser ----
DevPocket.registerTool({
  id: 'query-string',
  name: 'Query String Builder',
  category: 'api',
  icon: 'search-code',
  description: 'Build and parse URL query strings interactively.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Parser — URL → Key/Value Pairs</p>
      ${DevPocket.ui.input('qsParseInput', 'URL or Query String', 'https://example.com?foo=bar&baz=qux')}
      ${DevPocket.ui.btnRow([{ id: 'qsParse', label: 'Parse', cls: 'btn-primary' }])}
      <div id="qsParseResult" class="table-wrap" style="display:none">
        <table class="data-table">
          <thead><tr><th>Key</th><th>Value</th></tr></thead>
          <tbody id="qsParseTbody"></tbody>
        </table>
      </div>
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Builder — Key/Value Pairs → URL</p>
      <textarea id="qsBuildInput" class="mono" style="min-height:80px" placeholder="One pair per line:\nkey=value\nfoo=hello world\nbar=test"></textarea>
      ${DevPocket.ui.input('qsBaseUrl', 'Base URL (optional)', 'https://example.com/endpoint')}
      ${DevPocket.ui.btnRow([{ id: 'qsBuild', label: 'Build URL', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('qsBuildOut', 'Built URL')}
    `));

    container.querySelector('#qsParse').addEventListener('click', () => {
      let input = container.querySelector('#qsParseInput').value.trim();
      try {
        if (input.startsWith('http')) input = new URL(input).search;
        const params = new URLSearchParams(input.replace(/^\?/,''));
        const entries = [...params.entries()];
        if (!entries.length) { DevPocket.toast('No query params found', 'error'); return; }
        container.querySelector('#qsParseTbody').innerHTML = entries.map(([k,v]) =>
          `<tr><td><code>${k}</code></td><td>${v}</td></tr>`
        ).join('');
        container.querySelector('#qsParseResult').style.display = '';
      } catch (e) {
        DevPocket.toast(`Error: ${e.message}`, 'error');
      }
    });

    container.querySelector('#qsBuild').addEventListener('click', () => {
      const lines = container.querySelector('#qsBuildInput').value.trim().split('\n').filter(Boolean);
      const base  = container.querySelector('#qsBaseUrl').value.trim();
      const params = new URLSearchParams();
      lines.forEach(l => {
        const idx = l.indexOf('=');
        if (idx > -1) params.append(l.slice(0,idx).trim(), l.slice(idx+1).trim());
      });
      container.querySelector('#qsBuildOut').textContent = base
        ? `${base}${base.includes('?') ? '&' : '?'}${params.toString()}`
        : `?${params.toString()}`;
    });
  }
});

// ---- HTTP Header Formatter ----
DevPocket.registerTool({
  id: 'http-headers',
  name: 'HTTP Header Formatter',
  category: 'api',
  icon: 'list',
  description: 'Parse and format raw HTTP request/response headers.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('httpHdrInput', 'Raw Headers', 'Paste raw HTTP headers here…')}
      ${DevPocket.ui.btnRow([
        { id: 'httpHdrParse',  label: 'Parse', cls: 'btn-primary' },
        { id: 'httpHdrClear',  label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="httpHdrResult" class="table-wrap" style="display:none">
        <table class="data-table">
          <thead><tr><th>Header</th><th>Value</th></tr></thead>
          <tbody id="httpHdrTbody"></tbody>
        </table>
      </div>
    `));

    const COMMON_HDRS = {
      'content-type':       'Describes the media type of the response body',
      'authorization':      'Contains credentials to authenticate a request',
      'cache-control':      'Directives for caching mechanisms',
      'access-control-allow-origin': 'CORS header — which origins may access the resource',
      'x-request-id':       'Unique identifier for a request, useful for debugging',
      'x-forwarded-for':    'Original client IP when behind a proxy',
      'strict-transport-security': 'Forces browsers to use HTTPS (HSTS)',
      'content-encoding':   'Compression encoding applied to the body',
      'set-cookie':         'Instructs the browser to store a cookie',
    };

    container.querySelector('#httpHdrParse').addEventListener('click', () => {
      const raw = container.querySelector('#httpHdrInput').value.trim();
      const lines = raw.split('\n').filter(Boolean);
      const tbody = container.querySelector('#httpHdrTbody');
      tbody.innerHTML = '';

      lines.forEach(line => {
        const idx = line.indexOf(':');
        if (idx === -1) {
          // Status line
          const tr = document.createElement('tr');
          tr.innerHTML = `<td colspan="2"><strong>${line}</strong></td>`;
          tbody.appendChild(tr);
          return;
        }
        const key   = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        const desc  = COMMON_HDRS[key.toLowerCase()] || '';
        const tr    = document.createElement('tr');
        tr.innerHTML = `<td><code>${key}</code>${desc ? `<br><span style="font-size:11px;color:var(--text-muted)">${desc}</span>` : ''}</td><td>${value}</td>`;
        tbody.appendChild(tr);
      });

      container.querySelector('#httpHdrResult').style.display = tbody.children.length ? '' : 'none';
    });

    container.querySelector('#httpHdrClear').addEventListener('click', () => {
      container.querySelector('#httpHdrInput').value = '';
      container.querySelector('#httpHdrResult').style.display = 'none';
    });
  }
});

// ---- Random Generators ----
DevPocket.registerTool({
  id: 'random-gen',
  name: 'Random Generators',
  category: 'gen',
  icon: 'shuffle',
  description: 'Generate random numbers, strings, colors and more.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'rndNum', label: 'Number',
          content: `
            <div class="grid-2">
              ${DevPocket.ui.input('rndMin', 'Min', '1', 'number')}
              ${DevPocket.ui.input('rndMax', 'Max', '100', 'number')}
            </div>
            <label class="check-group mb-8"><input type="checkbox" id="rndFloat" /> Decimal (float)</label>
            ${DevPocket.ui.input('rndBatch', 'Count', '1', 'number')}
            ${DevPocket.ui.btnRow([{ id: 'rndNumGen', label: 'Generate', cls: 'btn-primary' }])}
            ${DevPocket.ui.output('rndNumOut', 'Result')}`
        },
        {
          id: 'rndStr', label: 'String',
          content: `
            ${DevPocket.ui.input('rndStrLen', 'Length', '16', 'number')}
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px">
              <label class="check-group"><input type="checkbox" id="rndUpper" checked /> A-Z</label>
              <label class="check-group"><input type="checkbox" id="rndLower" checked /> a-z</label>
              <label class="check-group"><input type="checkbox" id="rndDigits" checked /> 0-9</label>
              <label class="check-group"><input type="checkbox" id="rndSpecial" /> Symbols</label>
            </div>
            ${DevPocket.ui.input('rndStrCount', 'Count', '5', 'number')}
            ${DevPocket.ui.btnRow([{ id: 'rndStrGen', label: 'Generate', cls: 'btn-primary' }])}
            ${DevPocket.ui.output('rndStrOut', 'Result')}`
        },
        {
          id: 'rndColor', label: 'Color',
          content: `
            ${DevPocket.ui.input('rndColCount', 'Count', '5', 'number')}
            ${DevPocket.ui.btnRow([{ id: 'rndColGen', label: 'Generate', cls: 'btn-primary' }])}
            <div id="rndColOut" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px"></div>`
        },
        {
          id: 'rndDice', label: 'Dice',
          content: `
            <div class="grid-2">
              ${DevPocket.ui.input('rndDiceN', 'Number of Dice', '1', 'number')}
              ${DevPocket.ui.input('rndDiceSides', 'Sides', '6', 'number')}
            </div>
            ${DevPocket.ui.btnRow([{ id: 'rndDiceRoll', label: 'Roll', cls: 'btn-primary' }])}
            ${DevPocket.ui.output('rndDiceOut', 'Result')}`
        },
      ])}
    `));

    // Number
    container.querySelector('#rndNumGen').addEventListener('click', () => {
      const min   = parseFloat(container.querySelector('#rndMin').value);
      const max   = parseFloat(container.querySelector('#rndMax').value);
      const count = Math.min(1000, parseInt(container.querySelector('#rndBatch').value) || 1);
      const float = container.querySelector('#rndFloat').checked;
      const gen   = () => float ? (Math.random()*(max-min)+min).toFixed(4) : Math.floor(Math.random()*(max-min+1)+min);
      container.querySelector('#rndNumOut').textContent = Array.from({length:count}, gen).join('\n');
    });

    // String
    container.querySelector('#rndStrGen').addEventListener('click', () => {
      let charset = '';
      if (container.querySelector('#rndUpper').checked)   charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (container.querySelector('#rndLower').checked)   charset += 'abcdefghijklmnopqrstuvwxyz';
      if (container.querySelector('#rndDigits').checked)  charset += '0123456789';
      if (container.querySelector('#rndSpecial').checked) charset += '!@#$%^&*_+-=';
      if (!charset) charset = 'abcdefghijklmnopqrstuvwxyz';
      const len   = parseInt(container.querySelector('#rndStrLen').value) || 16;
      const count = Math.min(100, parseInt(container.querySelector('#rndStrCount').value) || 5);
      const arr   = new Uint32Array(len);
      const gen   = () => { crypto.getRandomValues(arr); return [...arr].map(n=>charset[n%charset.length]).join(''); };
      container.querySelector('#rndStrOut').textContent = Array.from({length:count}, gen).join('\n');
    });

    // Color
    container.querySelector('#rndColGen').addEventListener('click', () => {
      const count = Math.min(50, parseInt(container.querySelector('#rndColCount').value) || 5);
      const wrap  = container.querySelector('#rndColOut');
      const colors = Array.from({length:count}, () => {
        const arr = new Uint8Array(3);
        crypto.getRandomValues(arr);
        return '#' + [...arr].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
      });
      wrap.innerHTML = colors.map(c => `
        <div style="text-align:center;cursor:pointer" onclick="DevPocket.copy('${c}')" title="Click to copy">
          <div style="width:60px;height:60px;background:${c};border-radius:8px;border:1px solid var(--border)"></div>
          <code style="font-size:11px">${c}</code>
        </div>`).join('');
    });

    // Dice
    container.querySelector('#rndDiceRoll').addEventListener('click', () => {
      const n     = parseInt(container.querySelector('#rndDiceN').value) || 1;
      const sides = parseInt(container.querySelector('#rndDiceSides').value) || 6;
      const rolls = Array.from({length:n}, () => Math.floor(Math.random()*sides)+1);
      const total = rolls.reduce((a,b)=>a+b,0);
      container.querySelector('#rndDiceOut').textContent = n > 1
        ? `Rolls: ${rolls.join(', ')}\nTotal: ${total}`
        : `Rolled: ${rolls[0]}`;
    });
  }
});

// ---- Dummy JSON / Mock API Generator ----
DevPocket.registerTool({
  id: 'dummy-json',
  name: 'Dummy JSON Generator',
  category: 'gen',
  icon: 'braces',
  description: 'Generate realistic fake JSON data for testing and prototyping.',
  render(container) {
    const FNAMES = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Iris','Jack','Kate','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina'];
    const LNAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Martinez','Davis','Lopez','Wilson','Anderson','Taylor','Thomas','Jackson','White','Harris','Martin','Thompson'];
    const DOMAINS = ['gmail.com','yahoo.com','outlook.com','proton.me','example.com','company.io','dev.co'];
    const STREETS = ['Main St','Oak Ave','Pine Rd','Elm Dr','Cedar Ln','Maple Blvd','Willow Way'];
    const CITIES  = ['New York','Los Angeles','Chicago','Houston','Phoenix','San Antonio','San Diego','Dallas'];
    const JOBS    = ['Engineer','Designer','Manager','Analyst','Developer','Consultant','Architect','Director'];
    const DEPTS   = ['Engineering','Design','Marketing','Sales','Finance','HR','Operations','Product'];

    function rand(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
    function randInt(min,max) { return Math.floor(Math.random()*(max-min+1)+min); }
    function uuidv4() {
      const a=new Uint8Array(16); crypto.getRandomValues(a); a[6]=(a[6]&0x0f)|0x40; a[8]=(a[8]&0x3f)|0x80;
      const h=[...a].map(b=>b.toString(16).padStart(2,'0')).join('');
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    }

    function makeUser() {
      const first = rand(FNAMES), last = rand(LNAMES);
      return {
        id:         uuidv4(),
        name:       `${first} ${last}`,
        first_name: first,
        last_name:  last,
        email:      `${first.toLowerCase()}.${last.toLowerCase()}@${rand(DOMAINS)}`,
        phone:      `+1-${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`,
        age:        randInt(18,65),
        job_title:  rand(JOBS),
        department: rand(DEPTS),
        address: {
          street:  `${randInt(1,9999)} ${rand(STREETS)}`,
          city:    rand(CITIES),
          zip:     String(randInt(10000,99999)),
          country: 'US',
        },
        created_at: new Date(Date.now() - randInt(0,365*3)*86400000).toISOString(),
        is_active:  Math.random() > 0.2,
        score:      parseFloat((Math.random()*100).toFixed(2)),
      };
    }

    function makeProduct() {
      const categories = ['Electronics','Clothing','Food','Books','Sports','Home','Garden','Toys'];
      const adjectives = ['Premium','Classic','Modern','Vintage','Smart','Eco','Pro','Ultra'];
      const items      = ['Widget','Gadget','Device','Tool','Kit','Set','Pack','Bundle'];
      return {
        id:          uuidv4(),
        name:        `${rand(adjectives)} ${rand(items)}`,
        category:    rand(categories),
        price:       parseFloat((Math.random()*500+5).toFixed(2)),
        currency:    'USD',
        stock:       randInt(0,1000),
        rating:      parseFloat((Math.random()*2+3).toFixed(1)),
        reviews:     randInt(0,5000),
        in_stock:    Math.random() > 0.15,
        sku:         `SKU-${randInt(10000,99999)}`,
        created_at:  new Date(Date.now() - randInt(0,365)*86400000).toISOString(),
      };
    }

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <select id="djType" style="width:auto">
          <option value="users">Users</option>
          <option value="products">Products</option>
          <option value="custom">Custom Schema</option>
        </select>
        <label class="form-label" style="margin:0">Count:</label>
        <input type="number" id="djCount" value="5" min="1" max="100" style="width:70px" />
        <button class="btn btn-primary" id="djGen">Generate</button>
        <button class="btn btn-secondary btn-sm" id="djDl">Download JSON</button>
      </div>
      <div id="djCustomSchema" style="display:none">
        ${DevPocket.ui.textarea('djSchema', 'Schema (JSON object template)', '{\n  "id": "uuid",\n  "name": "string",\n  "age": "int:18:65",\n  "active": "bool"\n}')}
        <p style="font-size:12px;color:var(--text-muted)">Supported types: string, int:min:max, float, bool, uuid, email, date</p>
      </div>
      ${DevPocket.ui.output('djOut', 'Generated JSON')}
    `));

    container.querySelector('#djType').addEventListener('change', function() {
      container.querySelector('#djCustomSchema').style.display = this.value === 'custom' ? '' : 'none';
    });

    function generateFromSchema(schema, count) {
      function genVal(type) {
        if (type === 'string')  return rand(['foo','bar','baz','hello','world','test']);
        if (type === 'bool')    return Math.random() > 0.5;
        if (type === 'uuid')    return uuidv4();
        if (type === 'email')   return `user${randInt(1,999)}@${rand(DOMAINS)}`;
        if (type === 'date')    return new Date(Date.now() - randInt(0,365)*86400000).toISOString();
        if (type.startsWith('int')) {
          const [,min=0,max=100] = type.split(':');
          return randInt(+min,+max);
        }
        if (type === 'float') return parseFloat((Math.random()*100).toFixed(2));
        return null;
      }
      return Array.from({length:count}, () =>
        Object.fromEntries(Object.entries(schema).map(([k,v]) => [k, genVal(v)]))
      );
    }

    container.querySelector('#djGen').addEventListener('click', () => {
      const type  = container.querySelector('#djType').value;
      const count = Math.min(100, parseInt(container.querySelector('#djCount').value) || 5);
      const out   = container.querySelector('#djOut');
      try {
        let data;
        if (type === 'users')    data = Array.from({length:count}, makeUser);
        else if (type === 'products') data = Array.from({length:count}, makeProduct);
        else {
          const schema = JSON.parse(container.querySelector('#djSchema').value);
          data = generateFromSchema(schema, count);
        }
        out.textContent = JSON.stringify(data, null, 2);
      } catch (e) { out.textContent = `Error: ${e.message}`; }
    });

    container.querySelector('#djDl').addEventListener('click', () => {
      const text = container.querySelector('#djOut').textContent;
      if (text) DevPocket.download('data.json', text, 'application/json');
    });
  }
});

// ---- ENV File Generator ----
DevPocket.registerTool({
  id: 'env-gen',
  name: 'ENV File Generator',
  category: 'gen',
  icon: 'terminal',
  description: 'Build, parse and format .env files with secret generation.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'envBuild', label: 'Builder',
          content: `
            <div id="envRows">
              <div class="env-row" style="display:flex;gap:8px;margin-bottom:8px">
                <input type="text" class="env-key" placeholder="KEY_NAME" style="flex:1" />
                <input type="text" class="env-val" placeholder="value" style="flex:2" />
                <button class="btn btn-secondary btn-sm env-gen-secret" title="Generate secret">🔑</button>
                <button class="btn btn-danger btn-sm env-del">✕</button>
              </div>
            </div>
            <div class="btn-row">
              <button class="btn btn-secondary btn-sm" id="envAddRow">+ Add Row</button>
              <button class="btn btn-primary" id="envBuildBtn">Build .env</button>
            </div>
            ${DevPocket.ui.output('envBuilt', '.env Output')}`
        },
        {
          id: 'envParse', label: 'Parser',
          content: `
            ${DevPocket.ui.textarea('envParseInput', '.env File Contents', 'DB_HOST=localhost\nDB_PORT=5432\nSECRET_KEY=abc123\n# Comment')}
            ${DevPocket.ui.btnRow([{ id: 'envParseBtn', label: 'Parse', cls: 'btn-primary' }])}
            <div id="envParseResult" class="table-wrap" style="display:none">
              <table class="data-table">
                <thead><tr><th>Key</th><th>Value</th><th>Type</th></tr></thead>
                <tbody id="envParseTbody"></tbody>
              </table>
            </div>`
        },
      ])}
    `));

    function genSecret(len = 32) {
      const arr = new Uint8Array(len);
      crypto.getRandomValues(arr);
      return [...arr].map(b=>b.toString(16).padStart(2,'0')).join('');
    }

    function addRow(wrap) {
      const div = document.createElement('div');
      div.className = 'env-row';
      div.style.cssText = 'display:flex;gap:8px;margin-bottom:8px';
      div.innerHTML = `
        <input type="text" class="env-key" placeholder="KEY_NAME" style="flex:1" />
        <input type="text" class="env-val" placeholder="value" style="flex:2" />
        <button class="btn btn-secondary btn-sm env-gen-secret" title="Generate secret">🔑</button>
        <button class="btn btn-danger btn-sm env-del">✕</button>`;
      wrap.appendChild(div);
    }

    container.querySelector('#envAddRow').addEventListener('click', () => addRow(container.querySelector('#envRows')));

    container.querySelector('#envRows').addEventListener('click', e => {
      if (e.target.classList.contains('env-del')) e.target.closest('.env-row').remove();
      if (e.target.classList.contains('env-gen-secret')) {
        e.target.closest('.env-row').querySelector('.env-val').value = genSecret();
      }
    });

    container.querySelector('#envBuildBtn').addEventListener('click', () => {
      const rows = [...container.querySelectorAll('.env-row')];
      const lines = rows.map(r => {
        const k = r.querySelector('.env-key').value.trim();
        const v = r.querySelector('.env-val').value;
        if (!k) return null;
        const needsQuotes = v.includes(' ') || v.includes('#');
        return `${k}=${needsQuotes ? `"${v}"` : v}`;
      }).filter(Boolean);
      container.querySelector('#envBuilt').textContent = lines.join('\n');
    });

    container.querySelector('#envParseBtn').addEventListener('click', () => {
      const lines  = container.querySelector('#envParseInput').value.split('\n');
      const tbody  = container.querySelector('#envParseTbody');
      const result = container.querySelector('#envParseResult');
      tbody.innerHTML = '';
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const idx = trimmed.indexOf('=');
        if (idx === -1) return;
        const key = trimmed.slice(0, idx);
        const val = trimmed.slice(idx+1).replace(/^["']|["']$/g,'');
        const type = /^(true|false)$/i.test(val) ? 'boolean' : /^\d+$/.test(val) ? 'integer' : /^\d+\.\d+$/.test(val) ? 'float' : 'string';
        const tr = document.createElement('tr');
        tr.innerHTML = `<td><code>${key}</code></td><td>${val.length > 30 ? val.slice(0,30)+'…' : val}</td><td><span class="badge badge-info">${type}</span></td>`;
        tbody.appendChild(tr);
      });
      result.style.display = tbody.children.length ? '' : 'none';
    });
  }
});

// ---- Fake User Data Generator ----
DevPocket.registerTool({
  id: 'fake-data',
  name: 'Fake User Data',
  category: 'gen',
  icon: 'users',
  description: 'Generate realistic fake names, addresses, emails and more.',
  render(container) {
    const FNAMES = ['Alice','Bob','Charlie','Diana','Eve','Frank','Grace','Henry','Iris','Jack','Kate','Liam','Mia','Noah','Olivia','Paul','Quinn','Rachel','Sam','Tina','Uma','Victor','Wendy','Xander','Yara','Zoe'];
    const LNAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Martinez','Davis','Lopez','Wilson','Anderson','Taylor','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young'];
    const CITIES = ['New York','Los Angeles','Chicago','Houston','Phoenix','San Antonio','San Diego','Dallas','San Jose','Austin','Jacksonville','Fort Worth','Columbus','Charlotte','Indianapolis'];
    const STATES = ['NY','CA','IL','TX','AZ','TX','CA','TX','CA','TX','FL','TX','OH','NC','IN'];
    const STREETS = ['Main St','Oak Ave','Pine Rd','Elm Dr','Cedar Ln','Maple Blvd','Willow Way','Sunset Blvd','Park Ave','Lake Dr','River Rd','Forest Path'];
    const COMPANIES = ['Acme Corp','Tech Solutions','Global Inc','Digital Works','Future Labs','Smart Systems','Peak Ventures','Core Dynamics'];
    const DOMAINS = ['gmail.com','yahoo.com','outlook.com','proton.me','icloud.com'];

    function rand(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
    function randInt(min,max) { return Math.floor(Math.random()*(max-min+1)+min); }

    function gen() {
      const fn = rand(FNAMES), ln = rand(LNAMES), ci = randInt(0,CITIES.length-1);
      return {
        name:      `${fn} ${ln}`,
        email:     `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1,99)}@${rand(DOMAINS)}`,
        phone:     `+1 (${randInt(200,999)}) ${randInt(100,999)}-${randInt(1000,9999)}`,
        dob:       `${1950+randInt(0,55)}-${String(randInt(1,12)).padStart(2,'0')}-${String(randInt(1,28)).padStart(2,'0')}`,
        address:   `${randInt(1,9999)} ${rand(STREETS)}, ${CITIES[ci]}, ${STATES[ci]} ${randInt(10000,99999)}`,
        company:   rand(COMPANIES),
        username:  `${fn.toLowerCase()}_${ln.toLowerCase()}${randInt(10,99)}`,
        website:   `https://www.${fn.toLowerCase()}${ln.toLowerCase()}.${rand(['com','io','dev','net'])}`,
        avatar_url:`https://api.dicebear.com/7.x/initials/svg?seed=${fn}${ln}`,
      };
    }

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <label class="form-label" style="margin:0">Count:</label>
        <input type="number" id="fdCount" value="3" min="1" max="50" style="width:70px" />
        <button class="btn btn-primary" id="fdGen">Generate</button>
        <button class="btn btn-secondary btn-sm" id="fdDlJSON">Download JSON</button>
        <button class="btn btn-secondary btn-sm" id="fdDlCSV">Download CSV</button>
      </div>
      <div id="fdOut"></div>
    `));

    let lastData = [];

    container.querySelector('#fdGen').addEventListener('click', () => {
      const count = Math.min(50, parseInt(container.querySelector('#fdCount').value) || 3);
      lastData    = Array.from({length:count}, gen);
      const wrap  = container.querySelector('#fdOut');
      wrap.innerHTML = lastData.map((p,i) => `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;gap:12px;align-items:flex-start">
            <img src="${p.avatar_url}" style="width:48px;height:48px;border-radius:50%;border:2px solid var(--border);flex-shrink:0" onerror="this.style.display='none'" />
            <div style="flex:1">
              <strong>${p.name}</strong><br>
              <span style="color:var(--text-muted);font-size:12px">@${p.username} · ${p.company}</span>
              <div class="stats-row mt-8" style="flex-wrap:wrap">
                ${Object.entries(p).filter(([k])=>k!=='avatar_url'&&k!=='name'&&k!=='username'&&k!=='company').map(([k,v])=>
                  `<div class="stat-chip" style="cursor:pointer" onclick="DevPocket.copy('${v.replace(/'/g,"\\'")}')"><span>${k.replace(/_/g,' ')}</span><strong style="max-width:180px;overflow:hidden;text-overflow:ellipsis">${v}</strong></div>`
                ).join('')}
              </div>
            </div>
          </div>
        </div>`
      ).join('');
    });

    container.querySelector('#fdDlJSON').addEventListener('click', () => {
      if (lastData.length) DevPocket.download('fake-users.json', JSON.stringify(lastData, null, 2), 'application/json');
    });

    container.querySelector('#fdDlCSV').addEventListener('click', () => {
      if (!lastData.length) return;
      const keys = Object.keys(lastData[0]).filter(k => k !== 'avatar_url');
      const csv  = [keys.join(','), ...lastData.map(row => keys.map(k => `"${(row[k]||'').replace(/"/g,'""')}"`).join(','))].join('\n');
      DevPocket.download('fake-users.csv', csv, 'text/csv');
    });
  }
});

// ---- User Agent Parser ----
DevPocket.registerTool({
  id: 'user-agent',
  name: 'User Agent Parser',
  category: 'gen',
  icon: 'monitor-smartphone',
  description: 'Parse user agent strings to identify browser, OS and device type.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.input('uaInput', 'User Agent String', 'Paste a user agent string…')}
      ${DevPocket.ui.btnRow([
        { id: 'uaParse', label: 'Parse', cls: 'btn-primary' },
        { id: 'uaThis',  label: 'Use My UA', cls: 'btn-secondary' },
        { id: 'uaClear', label: 'Clear', cls: 'btn-danger btn-sm' },
      ])}
      <div id="uaResult"></div>
    `));

    container.querySelector('#uaThis').addEventListener('click', () => {
      container.querySelector('#uaInput').value = navigator.userAgent;
    });

    function parse(ua) {
      const browser = (() => {
        if (/Edg\//.test(ua))    return 'Edge';
        if (/OPR\//.test(ua))    return 'Opera';
        if (/Chrome\//.test(ua)) return 'Chrome';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/Safari\//.test(ua)) return 'Safari';
        if (/MSIE|Trident/.test(ua)) return 'Internet Explorer';
        return 'Unknown';
      })();

      const os = (() => {
        if (/Windows NT 10/.test(ua))   return 'Windows 10/11';
        if (/Windows NT 6/.test(ua))    return 'Windows 7/8';
        if (/Macintosh/.test(ua))       return 'macOS';
        if (/iPhone/.test(ua))          return 'iOS (iPhone)';
        if (/iPad/.test(ua))            return 'iOS (iPad)';
        if (/Android/.test(ua))         return 'Android';
        if (/Linux/.test(ua))           return 'Linux';
        if (/CrOS/.test(ua))            return 'Chrome OS';
        return 'Unknown';
      })();

      const device = /Mobile|Android|iPhone|iPad|Touch/i.test(ua) ? 'Mobile/Tablet' : 'Desktop';
      const engine = /Gecko\//.test(ua) ? 'Gecko' : /WebKit\//.test(ua) ? 'WebKit' : /Trident\//.test(ua) ? 'Trident' : 'Unknown';

      const verBrowser = ua.match(new RegExp(`${browser === 'Edge' ? 'Edg' : browser}\\/(\\S+)`))?.[1] || '—';
      const verOS = ua.match(/(?:Windows NT|Android|OS)\s([\d._]+)/)?.[1]?.replace(/_/g,'.') || '—';

      return { Browser: browser, 'Browser Version': verBrowser, OS: os, 'OS Version': verOS, Device: device, 'Engine': engine };
    }

    container.querySelector('#uaParse').addEventListener('click', () => {
      const ua = container.querySelector('#uaInput').value.trim();
      if (!ua) return;
      const info = parse(ua);
      container.querySelector('#uaResult').innerHTML = `
        <div class="stats-row mt-8">
          ${Object.entries(info).map(([k,v]) => `<div class="stat-chip"><span>${k}</span><strong>${v}</strong></div>`).join('')}
        </div>
        <div class="code-block mt-8" style="font-size:11px;word-break:break-all">${ua}</div>`;
    });

    container.querySelector('#uaClear').addEventListener('click', () => {
      container.querySelector('#uaInput').value = '';
      container.querySelector('#uaResult').innerHTML = '';
    });

    // Auto-parse current UA
    container.querySelector('#uaInput').value = navigator.userAgent;
    container.querySelector('#uaParse').click();
  }
});
