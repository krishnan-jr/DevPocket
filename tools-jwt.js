'use strict';
// ============================================================
// DevPocket — tools-jwt.js
// JWT & Security: decoder, hashing, password, token generator
// ============================================================

DevPocket.registerCategory({ id: 'jwt', name: 'JWT & Security', icon: 'shield', order: 4 });

// ---- JWT Decoder ----
DevPocket.registerTool({
  id: 'jwt-decoder',
  name: 'JWT Decoder',
  category: 'jwt',
  icon: 'key',
  description: 'Decode JWT tokens — view header, payload, expiry and signature info.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('jwtInput', 'JWT Token', 'Paste your JWT here…')}
      ${DevPocket.ui.btnRow([
        { id: 'jwtDecode', label: 'Decode', cls: 'btn-primary' },
        { id: 'jwtClear',  label: 'Clear',  cls: 'btn-danger btn-sm' },
      ])}
      <div id="jwtStatus"></div>
    `));

    container.insertAdjacentHTML('beforeend', `
      <div class="grid-2">
        <div class="card">
          <p class="card-title">Header</p>
          <div class="output-area" id="jwtHeader" style="min-height:80px"></div>
        </div>
        <div class="card">
          <p class="card-title">Payload</p>
          <div class="output-area" id="jwtPayload" style="min-height:80px"></div>
        </div>
      </div>
      <div class="card" id="jwtInfoCard" style="display:none">
        <p class="card-title">Token Info</p>
        <div id="jwtInfo" class="stats-row"></div>
      </div>
    `);

    function decodeB64(str) {
      const pad = str.length % 4 ? str + '='.repeat(4 - str.length % 4) : str;
      return JSON.parse(decodeURIComponent(escape(atob(pad.replace(/-/g,'+').replace(/_/g,'/')))));
    }

    container.querySelector('#jwtDecode').addEventListener('click', () => {
      const token  = container.querySelector('#jwtInput').value.trim();
      const status = container.querySelector('#jwtStatus');
      const parts  = token.split('.');
      if (parts.length !== 3) {
        status.innerHTML = DevPocket.ui.msg('Invalid JWT — must have 3 parts (header.payload.signature)', 'error');
        return;
      }
      try {
        const header  = decodeB64(parts[0]);
        const payload = decodeB64(parts[1]);

        container.querySelector('#jwtHeader').textContent  = JSON.stringify(header, null, 2);
        container.querySelector('#jwtPayload').textContent = JSON.stringify(payload, null, 2);

        const infoCard = container.querySelector('#jwtInfoCard');
        const info     = container.querySelector('#jwtInfo');
        infoCard.style.display = '';

        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        const iat = payload.iat;
        const chips = [];

        if (header.alg) chips.push(`<div class="stat-chip"><span>Algorithm</span><strong>${header.alg}</strong></div>`);
        if (header.typ) chips.push(`<div class="stat-chip"><span>Type</span><strong>${header.typ}</strong></div>`);
        if (iat)        chips.push(`<div class="stat-chip"><span>Issued At</span><strong>${new Date(iat*1000).toLocaleString()}</strong></div>`);
        if (exp) {
          const expired = now > exp;
          const badge   = expired ? '<span class="badge badge-error">EXPIRED</span>' : '<span class="badge badge-success">VALID</span>';
          chips.push(`<div class="stat-chip"><span>Expires</span><strong>${new Date(exp*1000).toLocaleString()} ${badge}</strong></div>`);
          if (!expired) {
            const secs = exp - now;
            const mins = Math.floor(secs / 60);
            const hrs  = Math.floor(mins / 60);
            const days = Math.floor(hrs  / 24);
            chips.push(`<div class="stat-chip"><span>Expires In</span><strong>${days > 0 ? `${days}d ` : ''}${hrs%24}h ${mins%60}m</strong></div>`);
          }
        }
        if (payload.sub) chips.push(`<div class="stat-chip"><span>Subject</span><strong>${payload.sub}</strong></div>`);
        if (payload.iss) chips.push(`<div class="stat-chip"><span>Issuer</span><strong>${payload.iss}</strong></div>`);

        info.innerHTML = chips.join('');
        status.innerHTML = '';
      } catch (e) {
        status.innerHTML = DevPocket.ui.msg(`Error decoding: ${e.message}`, 'error');
      }
    });

    container.querySelector('#jwtClear').addEventListener('click', () => {
      container.querySelector('#jwtInput').value = '';
      container.querySelector('#jwtHeader').textContent  = '';
      container.querySelector('#jwtPayload').textContent = '';
      container.querySelector('#jwtInfoCard').style.display = 'none';
      container.querySelector('#jwtStatus').innerHTML = '';
    });
  }
});

// ---- Hashing (MD5, SHA-1, SHA-256, SHA-512) ----
DevPocket.registerTool({
  id: 'hash',
  name: 'Hash Generator',
  category: 'jwt',
  icon: 'hash',
  description: 'Generate MD5, SHA-1, SHA-256 and SHA-512 hashes from text or files.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.tabs([
        {
          id: 'hashText', label: 'Text',
          content: `
            ${DevPocket.ui.textarea('hashInput', 'Input Text', 'Enter text to hash…')}
            ${DevPocket.ui.btnRow([
              { id: 'hashAll',  label: 'Hash All', cls: 'btn-primary' },
              { id: 'hashClear',label: 'Clear',    cls: 'btn-danger btn-sm' },
            ])}
            ${DevPocket.ui.output('hashMD5',    'MD5')}
            ${DevPocket.ui.output('hashSHA1',   'SHA-1')}
            ${DevPocket.ui.output('hashSHA256', 'SHA-256')}
            ${DevPocket.ui.output('hashSHA512', 'SHA-512')}`
        },
        {
          id: 'hashFile', label: 'File',
          content: `
            <div class="form-group">
              <label class="form-label">Select File</label>
              <input type="file" id="hashFile" style="color:var(--text-primary)" />
            </div>
            ${DevPocket.ui.output('hashFileSHA256', 'SHA-256')}
            ${DevPocket.ui.output('hashFileSHA512', 'SHA-512')}`
        },
      ])}
    `));

    function requireCryptoJS(fn) {
      if (typeof CryptoJS === 'undefined') {
        fn('CryptoJS library not loaded'); return false;
      }
      return true;
    }

    container.querySelector('#hashAll').addEventListener('click', () => {
      const text = container.querySelector('#hashInput').value;
      if (!requireCryptoJS(msg => { ['#hashMD5','#hashSHA1','#hashSHA256','#hashSHA512'].forEach(id => container.querySelector(id).textContent = msg); })) return;
      container.querySelector('#hashMD5').textContent    = CryptoJS.MD5(text).toString();
      container.querySelector('#hashSHA1').textContent   = CryptoJS.SHA1(text).toString();
      container.querySelector('#hashSHA256').textContent = CryptoJS.SHA256(text).toString();
      container.querySelector('#hashSHA512').textContent = CryptoJS.SHA512(text).toString();
    });

    container.querySelector('#hashClear').addEventListener('click', () => {
      container.querySelector('#hashInput').value = '';
      ['#hashMD5','#hashSHA1','#hashSHA256','#hashSHA512'].forEach(id => container.querySelector(id).textContent = '');
    });

    container.querySelector('#hashFile').addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        if (typeof CryptoJS === 'undefined') { return; }
        const wordArr = CryptoJS.lib.WordArray.create(ev.target.result);
        container.querySelector('#hashFileSHA256').textContent = CryptoJS.SHA256(wordArr).toString();
        container.querySelector('#hashFileSHA512').textContent = CryptoJS.SHA512(wordArr).toString();
      };
      reader.readAsArrayBuffer(file);
    });
  }
});

// ---- Password Generator & Strength Checker ----
DevPocket.registerTool({
  id: 'password-gen',
  name: 'Password Generator',
  category: 'jwt',
  icon: 'key-round',
  description: 'Generate secure passwords and check password strength.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Generator</p>
      <div class="form-group">
        <label class="form-label">Length: <strong id="pwLenVal">16</strong></label>
        <input type="range" id="pwLen" min="4" max="128" value="16" />
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px">
        <label class="check-group"><input type="checkbox" id="pwUpper" checked /> Uppercase (A-Z)</label>
        <label class="check-group"><input type="checkbox" id="pwLower" checked /> Lowercase (a-z)</label>
        <label class="check-group"><input type="checkbox" id="pwNums"  checked /> Numbers (0-9)</label>
        <label class="check-group"><input type="checkbox" id="pwSym"   checked /> Symbols (!@#…)</label>
        <label class="check-group"><input type="checkbox" id="pwAmb"         /> Exclude ambiguous (0O1lI)</label>
      </div>
      ${DevPocket.ui.btnRow([
        { id: 'pwGen',   label: 'Generate Password', cls: 'btn-primary' },
        { id: 'pwBulk',  label: 'Generate 10',       cls: 'btn-secondary' },
      ])}
      ${DevPocket.ui.output('pwOut', 'Password')}
    `));

    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <p class="card-title">Strength Checker</p>
      ${DevPocket.ui.input('pwCheck', 'Check a Password', 'Type or paste a password…', 'text')}
      <div class="strength-bar"><div class="strength-fill" id="pwStrBar" style="width:0%"></div></div>
      <div id="pwStrLabel" style="margin-top:8px;font-size:13px;color:var(--text-muted)"></div>
      <div id="pwStrTips" style="margin-top:8px;font-size:12px;color:var(--text-secondary)"></div>
    `));

    const lenSlider = container.querySelector('#pwLen');
    const lenVal    = container.querySelector('#pwLenVal');
    lenSlider.addEventListener('input', () => lenVal.textContent = lenSlider.value);

    const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const LOWER = 'abcdefghijklmnopqrstuvwxyz';
    const NUMS  = '0123456789';
    const SYM   = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const AMB   = '0O1lI';

    function genPassword() {
      let charset = '';
      const useUpper = container.querySelector('#pwUpper').checked;
      const useLower = container.querySelector('#pwLower').checked;
      const useNums  = container.querySelector('#pwNums').checked;
      const useSym   = container.querySelector('#pwSym').checked;
      const useAmb   = container.querySelector('#pwAmb').checked;
      if (useUpper) charset += UPPER;
      if (useLower) charset += LOWER;
      if (useNums)  charset += NUMS;
      if (useSym)   charset += SYM;
      if (!charset) charset = LOWER;
      if (useAmb) charset = [...charset].filter(c => !AMB.includes(c)).join('');

      const len = parseInt(lenSlider.value);
      const arr = new Uint32Array(len);
      crypto.getRandomValues(arr);
      return [...arr].map(n => charset[n % charset.length]).join('');
    }

    container.querySelector('#pwGen').addEventListener('click', () => {
      container.querySelector('#pwOut').textContent = genPassword();
    });

    container.querySelector('#pwBulk').addEventListener('click', () => {
      container.querySelector('#pwOut').textContent = Array.from({ length: 10 }, genPassword).join('\n');
    });

    // Strength checker
    container.querySelector('#pwCheck').addEventListener('input', function() {
      const pw  = this.value;
      const bar = container.querySelector('#pwStrBar');
      const lbl = container.querySelector('#pwStrLabel');
      const tips = container.querySelector('#pwStrTips');

      let score = 0;
      const checks = [];
      if (pw.length >= 8)  { score += 1; } else checks.push('Use at least 8 characters');
      if (pw.length >= 12) { score += 1; } else if (pw.length >= 8) checks.push('Use 12+ characters for better security');
      if (pw.length >= 16) score += 1;
      if (/[A-Z]/.test(pw)) score += 1; else checks.push('Add uppercase letters');
      if (/[a-z]/.test(pw)) score += 1; else checks.push('Add lowercase letters');
      if (/\d/.test(pw))    score += 1; else checks.push('Add numbers');
      if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pw)) score += 1; else checks.push('Add symbols');

      const pct = Math.min(100, Math.round((score / 7) * 100));
      const levels = [
        { min: 0,  label: 'Very Weak',  color: '#e05c5c' },
        { min: 30, label: 'Weak',       color: '#f5a623' },
        { min: 50, label: 'Fair',       color: '#f5d020' },
        { min: 70, label: 'Strong',     color: '#4caf7d' },
        { min: 90, label: 'Very Strong',color: '#2e7d32' },
      ];
      const level = [...levels].reverse().find(l => pct >= l.min) || levels[0];
      bar.style.width   = `${pct}%`;
      bar.style.background = level.color;
      lbl.textContent   = pw ? `${level.label} (${pct}%)` : '';
      tips.innerHTML    = checks.map(t => `• ${t}`).join('<br>');
    });
  }
});

// ---- Random Token Generator ----
DevPocket.registerTool({
  id: 'token-gen',
  name: 'Random Token Generator',
  category: 'jwt',
  icon: 'shield-check',
  description: 'Generate cryptographically secure random tokens in various formats.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      <div class="form-group">
        <label class="form-label">Token Length (bytes)</label>
        <input type="number" id="tkLen" value="32" min="4" max="512" style="width:auto" />
      </div>
      ${DevPocket.ui.select('tkFormat', 'Output Format', [
        { value: 'hex',    label: 'Hexadecimal' },
        { value: 'base64', label: 'Base64' },
        { value: 'base64url', label: 'Base64 URL-safe' },
        { value: 'bytes',  label: 'Byte Array' },
        { value: 'uuid',   label: 'UUID v4' },
      ])}
      ${DevPocket.ui.btnRow([
        { id: 'tkGen',   label: 'Generate',    cls: 'btn-primary' },
        { id: 'tkGenX5', label: 'Generate ×5', cls: 'btn-secondary' },
      ])}
      ${DevPocket.ui.output('tkOut', 'Token')}
    `));

    function generate(bytes, format) {
      if (format === 'uuid') {
        const arr = new Uint8Array(16);
        crypto.getRandomValues(arr);
        arr[6] = (arr[6] & 0x0f) | 0x40;
        arr[8] = (arr[8] & 0x3f) | 0x80;
        const hex = [...arr].map(b => b.toString(16).padStart(2,'0')).join('');
        return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
      }
      const arr = new Uint8Array(bytes);
      crypto.getRandomValues(arr);
      if (format === 'hex')    return [...arr].map(b => b.toString(16).padStart(2,'0')).join('');
      if (format === 'bytes')  return `[${arr.join(', ')}]`;
      const b64 = btoa(String.fromCharCode(...arr));
      if (format === 'base64url') return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
      return b64;
    }

    function getParams() {
      return {
        bytes:  parseInt(container.querySelector('#tkLen').value) || 32,
        format: container.querySelector('#tkFormat').value,
      };
    }

    container.querySelector('#tkGen').addEventListener('click', () => {
      const { bytes, format } = getParams();
      container.querySelector('#tkOut').textContent = generate(bytes, format);
    });

    container.querySelector('#tkGenX5').addEventListener('click', () => {
      const { bytes, format } = getParams();
      container.querySelector('#tkOut').textContent = Array.from({length:5}, () => generate(bytes, format)).join('\n');
    });
  }
});
