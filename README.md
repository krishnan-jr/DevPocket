# DevPocket

An all-in-one developer utility toolbox that runs entirely in your browser. No backend, no build step, no accounts — just open `index.html` and start working.

## Features

- **50+ tools** across 9 categories
- **100% offline** — all processing happens locally, nothing is sent to a server
- **Dark / Light theme** with persistence
- **Searchable** tool list with keyboard shortcut (`⌘K` / `Ctrl+K`)
- **Favorites & recent tools** remembered via localStorage
- **Responsive** — works on desktop and mobile
- **GitHub Pages ready** — deploy by uploading the files, no configuration needed

## Tools

### Text Utilities
| Tool | Description |
|------|-------------|
| Text Statistics | Word, character, line, paragraph counts and reading time |
| Case Conversion | camelCase, snake_case, PascalCase, kebab-case, CONSTANT_CASE and more |
| Text Cleanup | Trim whitespace, remove blank lines, normalize line endings, deduplicate |
| Text Diff | Side-by-side and inline diff with added/removed highlighting |

### Encoding & Decoding
| Tool | Description |
|------|-------------|
| Base64 Encode/Decode | Text and file/image to Base64, Unicode-safe |
| URL Encode/Decode | Percent-encoding with full / component modes |
| HTML Encode/Decode | HTML entity encoding and decoding |
| Unicode Escape/Unescape | `\uXXXX` escape sequences |
| Number Base Converter | Convert between binary, octal, decimal, hex |

### JSON & Data
| Tool | Description |
|------|-------------|
| JSON Formatter | Format, validate and minify JSON with error highlighting |
| JSON Tree Viewer | Interactive collapsible tree with click-to-copy paths |
| JSON Search | Query JSON with dot-notation paths |
| JSON ↔ CSV | Bidirectional conversion |
| JSON ↔ YAML | Bidirectional conversion using js-yaml |
| JSON ↔ XML | Bidirectional conversion |
| JSON → Table | Render JSON arrays as a sortable HTML table |
| SQL Formatter | Keyword-based SQL beautifier |
| YAML Formatter | Validate and pretty-print YAML |

### JWT & Security
| Tool | Description |
|------|-------------|
| JWT Decoder | Decode header, payload, expiry; verify structure |
| Hash Generator | MD5, SHA-1, SHA-256, SHA-512 for text and files |
| Password Generator | Configurable with strength meter |
| Random Token Generator | Cryptographically secure hex/base64 tokens |

### Developer Utilities
| Tool | Description |
|------|-------------|
| UUID Generator | Bulk RFC 4122 v4 UUIDs via `crypto.getRandomValues` |
| Unix Timestamp Converter | Live clock, convert to/from ISO 8601 |
| Regex Tester | Live match highlighting with flags and match list |
| Cron Expression Builder | Parse cron expressions and show next 10 run times |
| Color Converter | HEX ↔ RGB ↔ HSL with live swatch |
| Gradient Generator | CSS linear gradient builder with live preview and copy |
| Lorem Ipsum Generator | Paragraphs, sentences, or word count |
| URL Parser | Break URLs into protocol, host, path, query params, fragment |
| HTTP Status Codes | Full reference lookup for 1xx–5xx |
| MIME Type Lookup | Extension → MIME type reference (~60 types) |

### Web & Frontend
| Tool | Description |
|------|-------------|
| HTML Preview | Live preview in sandboxed iframe; beautify or minify HTML |
| CSS Beautifier / Minifier | Format or compress CSS stylesheets |
| Markdown Preview | Live GitHub-flavored Markdown rendering |
| QR Code Generator | Configurable size and error correction level |
| Clipboard Inspector | Read, transform (trim, single-line) and write clipboard |

### File Utilities
| Tool | Description |
|------|-------------|
| Text File Viewer | Open and search text files with line numbers |
| CSV Viewer | Parse and display CSV as a formatted table |
| Image Metadata Viewer | Dimensions, size, format, dominant color palette |
| Image Tools | Compress, resize, and convert images (JPEG/PNG/WebP) via Canvas |
| PDF Metadata & Text | Extract metadata and text from text-based PDFs |

### API & Network
| Tool | Description |
|------|-------------|
| REST Request Builder | Send HTTP requests with custom headers and body (fetch-based) |
| Query String Builder | Build and decode URL query strings |
| HTTP Header Formatter | Parse and format raw HTTP header blocks |

### Generators
| Tool | Description |
|------|-------------|
| Random Generators | Dice rolls, coin flips, random numbers, shuffled lists, pick-from-list |
| Dummy JSON Generator | Structured fake JSON (users, products, posts) |
| ENV File Generator | `.env` file builder with auto-generated secret tokens |
| Fake User Data | Realistic fake profiles with avatar, name, email, address |
| User Agent Parser | Detect and break down browser/OS from any user-agent string |

## Getting Started

```bash
# Clone or download the repository
git clone https://github.com/your-username/devpocket.git

# Open in browser — no server needed
open index.html
```

Or deploy to GitHub Pages by pushing the files to a `gh-pages` branch (or enabling Pages on `main`).

## Project Structure

```
devpocket/
├── index.html          # App shell — layout and script tags
├── style.css           # All styles (dark/light theme via CSS variables)
├── app.js              # Core: registry, routing, sidebar, UI helpers
├── tools-text.js       # Text Utilities
├── tools-encoding.js   # Encoding & Decoding
├── tools-json.js       # JSON & Data
├── tools-jwt.js        # JWT & Security
├── tools-dev.js        # Developer Utilities
├── tools-web.js        # Web & Frontend
├── tools-file.js       # File Utilities
└── tools-api.js        # API & Network + Generators
```

**Script load order matters:** CDN libraries load in `<head>`, then `app.js` (which creates the global `DevPocket` object), then each tool file (which calls `DevPocket.registerTool()`). All registrations complete before `DOMContentLoaded` fires, so `DevPocket.init()` always sees the full tool registry.

## Adding a Tool

Register a tool in the appropriate `tools-*.js` file:

```js
DevPocket.registerTool({
  id: 'my-tool',           // unique kebab-case ID
  name: 'My Tool',
  category: 'dev',         // must match a registered category id
  icon: 'wrench',          // Lucide icon name
  description: 'What it does.',
  render(container) {
    container.insertAdjacentHTML('beforeend', DevPocket.ui.card(`
      ${DevPocket.ui.textarea('myInput', 'Input', 'Paste something…')}
      ${DevPocket.ui.btnRow([{ id: 'myRun', label: 'Run', cls: 'btn-primary' }])}
      ${DevPocket.ui.output('myOut', 'Output')}
    `));

    container.querySelector('#myRun').addEventListener('click', () => {
      const result = container.querySelector('#myInput').value.toUpperCase();
      container.querySelector('#myOut').textContent = result;
    });
  }
});
```

### UI Helpers (`DevPocket.ui`)

| Helper | Returns |
|--------|---------|
| `ui.card(innerHTML)` | Wrapped card container |
| `ui.textarea(id, label, placeholder)` | Labelled `<textarea>` |
| `ui.input(id, label, placeholder, type, extra)` | Labelled `<input>` |
| `ui.select(id, label, options)` | Labelled `<select>` |
| `ui.btnRow(buttons)` | Row of `<button>` elements |
| `ui.output(id, label, withCopy)` | Output area with optional Copy button |
| `ui.tabs(tabs)` | Tab bar + panels |
| `ui.statChip(label, valueId)` | Stat badge (label + bold value) |
| `ui.msg(text, type)` | Info/success/warning/error message block |

### Other APIs

```js
DevPocket.toast('Message', 'success');       // show a toast notification
DevPocket.copy(text);                         // copy to clipboard
DevPocket.download(filename, content, mime); // trigger a file download
DevPocket.icon('icon-name');                 // render a Lucide icon <i> tag
DevPocket.navigateTo('tool-id');             // navigate to a tool
```

## Dependencies (CDN)

All loaded from public CDNs — no npm, no bundler.

| Library | Version | Used for |
|---------|---------|----------|
| [Lucide Icons](https://lucide.dev) | latest | UI icons |
| [CryptoJS](https://github.com/brix/crypto-js) | 4.2.0 | MD5, SHA-1/256/512 hashing |
| [js-yaml](https://github.com/nodeca/js-yaml) | 4.1.0 | YAML parse/stringify |
| [marked](https://marked.js.org) | 9.1.6 | Markdown rendering |
| [QRCode.js](https://github.com/davidshimjs/qrcodejs) | 1.0.0 | QR code generation |
| [diff](https://github.com/kpdecker/jsdiff) | 5.1.0 | Text diffing |

Everything else — Base64, URL encoding, HTML entities, hashing UI, image processing, PDF parsing, UUID generation — is implemented in vanilla JS using standard browser APIs.

## Browser Support

Any modern browser that supports ES6+, the Fetch API, the Web Crypto API, and the Canvas API. No polyfills are included.

## License

MIT
