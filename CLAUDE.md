# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

No build step. Open `index.html` directly in a browser:

```bash
open index.html
```

Or serve locally to avoid any browser file:// restrictions (e.g. for fetch-based tools):

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

There are no tests, no linter, no npm, and no package.json.

## Architecture

DevPocket is a zero-dependency, zero-build, pure client-side app. All processing is local — nothing is sent to a server.

### Script Load Order (critical)

`index.html` loads scripts in this exact order:

1. CDN libraries in `<head>` (Lucide, CryptoJS, js-yaml, marked, QRCode, diff)
2. `app.js` — creates the global `DevPocket` object via an IIFE
3. `tools-*.js` files — each calls `DevPocket.registerCategory()` and `DevPocket.registerTool()`
4. `DOMContentLoaded` fires → `DevPocket.init()` runs with the full registry already populated

Tool files must not rely on DOM being ready at registration time — only inside the `render(container)` callback.

### The `DevPocket` Global (app.js)

The single global object exposes:

- **Registry**: `registerCategory(cat)`, `registerTool(tool)`
- **Navigation**: `navigateTo(toolId)` — renders a tool into `#toolContent`, updates breadcrumb, persists state
- **UI helpers** (`DevPocket.ui`): `card()`, `textarea()`, `input()`, `select()`, `btnRow()`, `output()`, `tabs()`, `statChip()`, `msg()`
- **Utilities**: `toast(msg, type)`, `copy(text)`, `download(filename, content, mime)`, `icon(name)`
- **Persistence**: localStorage keys `dp_theme`, `dp_last`, `dp_fav`, `dp_recent`

Tab switching and copy-button clicks are handled via event delegation on `#toolContent` — tools do not need to wire these up manually.

### Tool Files

Each `tools-*.js` file owns one category:

| File | Category |
|------|----------|
| `tools-text.js` | Text Utilities |
| `tools-encoding.js` | Encoding & Decoding |
| `tools-json.js` | JSON & Data |
| `tools-jwt.js` | JWT & Security |
| `tools-dev.js` | Developer Utilities |
| `tools-web.js` | Web & Frontend |
| `tools-file.js` | File Utilities |
| `tools-api.js` | API & Network + Generators |

### Adding a Tool

Register in the appropriate `tools-*.js` file:

```js
DevPocket.registerTool({
  id: 'my-tool',        // unique kebab-case, used in URLs/localStorage
  name: 'My Tool',
  category: 'dev',      // must match an existing registered category id
  icon: 'wrench',       // Lucide icon name
  description: 'One-line description shown under the tool title.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('myInput', 'Input', 'Paste here…')}
      ${DevPocket.ui.btnRow([{ id: 'myRun', label: 'Run', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('myOut', 'Output')}
    `));
    container.querySelector('#myRun').addEventListener('click', () => {
      container.querySelector('#myOut').textContent =
        container.querySelector('#myInput').value.toUpperCase();
    });
  }
});
```

Use `container.querySelector()` — never `document.querySelector()` — so tools are scoped and don't conflict.

### Styling

All styles live in `style.css` using CSS custom properties. Dark/light themes are toggled via `data-theme` on `<html>`. Use existing utility classes (`card`, `form-group`, `form-label`, `btn`, `btn-primary`, `btn-secondary`, `btn-row`, `mono`, `output-area`, `msg`, `msg-info/success/warning/error`, `stats-row`, `stat-chip`) rather than inline styles.

### CDN Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| Lucide Icons | latest | All UI icons |
| CryptoJS | 4.2.0 | MD5, SHA-1/256/512 hashing |
| js-yaml | 4.1.0 | YAML parse/stringify |
| marked | 9.1.6 | Markdown rendering |
| QRCode.js | 1.0.0 | QR code generation |
| diff | 5.1.0 | Text diffing |

Everything else (Base64, URL encoding, HTML entities, UUID, image processing, PDF parsing) uses vanilla browser APIs.

### PWA

The app is installable as a PWA on all platforms (Chrome/Edge desktop, Android, iOS Safari).

| File | Purpose |
|------|---------|
| `manifest.json` | Web App Manifest — name, icons, theme, display mode, shortcuts |
| `sw.js` | Service Worker — cache-first for local assets, stale-while-revalidate for CDN |
| `icons/icon.svg` | Single SVG icon used for all sizes/platforms |

**Cache versioning:** The `CACHE_VERSION` constant in `sw.js` (e.g. `devpocket-v1`) must be bumped whenever files change so users receive the updated assets. Old caches are deleted on SW activation.

**Manifest shortcuts** deep-link into specific tools via `?tool=<tool-id>` query params (e.g. `?tool=json-format`). The `_loadState()` function in `app.js` reads this param on startup and navigates to the tool.

**Testing the SW locally:** Service workers require HTTPS or `localhost`. Use `python3 -m http.server 8080` and open `http://localhost:8080` — the install prompt will appear after the SW has cached all assets (usually after the first load).
