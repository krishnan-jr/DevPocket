# DevPocket — Instruction.md

## Project Overview

Build a lightweight all-in-one developer utility web application named **DevPocket**.

The application must run entirely on the client side and be deployable directly to GitHub Pages without any backend, build process, package manager, or server.

The project must contain ONLY these files:

```text
index.html
style.css
app.js
```

No additional files or folders.

CDN libraries may be used ONLY if absolutely necessary.

---

# Core Requirements

- Pure frontend application
- No backend
- No Node.js server
- No database
- No authentication
- No API keys
- No framework (React/Vue/Angular not allowed)
- No build tools
- No TypeScript
- No npm dependency installation
- Must work directly by opening index.html
- Must be GitHub Pages compatible
- All features must run locally in the browser
- Fully responsive
- Mobile friendly
- Keyboard accessible
- Modern minimalistic UI
- Dark mode first design
- High performance and lightweight

---

# Project Goal

DevPocket should feel like a premium developer toolbox that is:
- extremely fast
- clean
- intuitive
- distraction free
- modern
- professional

The application should look polished enough to feel production ready.

---

# UI Requirements

## Design Style

Use:
- minimalistic layout
- modern glassmorphism or flat design
- soft shadows
- rounded corners
- subtle animations
- clean spacing
- monospace fonts for code areas
- smooth hover transitions

Avoid:
- cluttered UI
- excessive gradients
- bright neon colors
- complicated navigation
- unnecessary animations

---

# Layout Structure

Use a sidebar + content layout.

```text
-----------------------------------
| Sidebar | Main Content Area     |
|          |                      |
|          |                      |
-----------------------------------
```

---

# Sidebar Requirements

The sidebar must contain categorized tools.

Include:
- searchable tool list
- category grouping
- active tool highlight
- responsive collapse on mobile

---

# Main Content Requirements

Each tool should:
- render dynamically
- reuse common UI components
- support copy-to-clipboard
- support clear/reset
- support responsive resizing

---

# Theme

Default theme:
- dark mode

Add:
- light/dark toggle
- save theme preference in localStorage

---

# Required Categories & Features

# 1. Text Utilities

## Basic Text
- Word Counter
- Character Counter
- Line Counter
- Paragraph Counter
- Reading Time Estimator

## Case Conversion
- UPPERCASE
- lowercase
- Title Case
- Sentence case
- camelCase
- PascalCase
- snake_case
- kebab-case
- CONSTANT_CASE

## Text Cleanup
- Trim Extra Spaces
- Remove Empty Lines
- Remove Duplicate Lines
- Sort Lines Alphabetically
- Reverse Text
- Reverse Lines
- Remove Special Characters
- Remove Emojis
- Extract Emails
- Extract URLs
- Slug Generator

## Text Comparison
- Side-by-side diff
- Inline diff
- Highlight changes

---

# 2. Encoding & Decoding

## Encoders
- Base64 Encode/Decode
- URL Encode/Decode
- HTML Encode/Decode
- Unicode Escape/Unescape

## Converters
- ASCII Converter
- Binary Converter
- Hex Converter

## File Encoding
- File → Base64
- Image → Base64

---

# 3. JSON & Data Tools

## JSON
- JSON Formatter
- JSON Minifier
- JSON Validator
- JSON Pretty Viewer
- JSON Tree Viewer
- JSON Search
- Copy JSON Path

## Data Conversion
- JSON → Table
- JSON → CSV
- CSV → JSON
- JSON → YAML
- YAML → JSON
- XML → JSON
- JSON → XML

## Formatters
- SQL Formatter
- XML Formatter
- YAML Formatter

---

# 4. JWT & Security Tools

## JWT
- JWT Decoder
- JWT Expiry Checker
- JWT Header Viewer
- JWT Payload Formatter

## Hashing
- SHA1
- SHA256
- SHA512
- MD5

## Security Utilities
- Password Generator
- Password Strength Checker
- Random Token Generator

---

# 5. Developer Utilities

## IDs
- UUID v4 Generator
- Nano ID Generator
- Bulk UUID Generator

## Time
- Unix Timestamp Converter
- Epoch ↔ Human Date
- Timezone Converter
- Relative Time Formatter

## Regex
- Regex Tester
- Regex Match Extractor
- Regex Cheat Sheet

## Cron
- Cron Expression Reader
- Cron Expression Builder

## Colors
- HEX ↔ RGB
- HEX ↔ HSL
- Color Picker
- Gradient Generator

## Misc
- Lorem Ipsum Generator
- Fake User Data Generator
- User Agent Parser
- Query Parameter Parser
- URL Parser
- MIME Type Lookup
- HTTP Status Code Lookup

---

# 6. Web & Frontend Utilities

## HTML/CSS
- HTML Preview
- HTML Beautifier
- CSS Beautifier
- CSS Minifier

## Markdown
- Markdown Preview
- Markdown → HTML

## QR & Clipboard
- QR Code Generator
- Clipboard Inspector

---

# 7. File Utilities

## File Tools
- Text File Viewer
- CSV Viewer
- Image Metadata Viewer

## Image Tools
- Image Compressor
- Image Resizer
- Image Format Converter

## PDF
- PDF Metadata Viewer
- Extract Text From PDF

---

# 8. API & Network Helpers

## HTTP
- REST Request Builder
- HTTP Header Formatter
- CURL Formatter

## Query Tools
- Query String Builder
- Query Parameter Extractor

---

# 9. Generators

## Random Generators
- UUID Generator
- Random Number Generator
- Random String Generator
- Random Color Generator

## Dev Generators
- Dummy JSON Generator
- Mock API Response Generator
- ENV File Generator

---

# Suggested CDN Libraries

Use CDN libraries ONLY where necessary.

Recommended:

## Text Diff
diff.js

## Crypto
crypto-js

## YAML
js-yaml

## UUID
uuid

## Time Utilities
dayjs

## Markdown
marked

## SQL Formatting
sql-formatter

## QR Code
qrcode.js

## PDF Parsing
pdf.js

---

# Performance Requirements

- Fast initial load
- Lazy initialize heavy tools
- Avoid unnecessary DOM rerenders
- Use event delegation where possible
- Minimize memory usage
- Keep bundle lightweight

---

# Architecture Requirements

## JavaScript Structure

Even though only one JS file is allowed, organize code modularly.

Use:
- feature modules
- reusable utility functions
- centralized state management
- reusable render functions

Avoid:
- duplicated code
- giant nested logic
- inline event handlers

---

# CSS Requirements

Use:
- CSS variables
- responsive layout
- reusable utility classes
- smooth transitions

Avoid:
- massive duplicated styles
- inline styles

---

# Accessibility Requirements

- Keyboard navigable
- Proper contrast ratios
- Focus states
- ARIA labels where needed
- Mobile accessibility support

---

# UX Requirements

Every applicable tool should include:
- Copy button
- Download button
- Clear button
- Paste shortcut
- Responsive textareas

Nice-to-have:
- Auto detect pasted JSON
- Auto formatting
- Drag and drop file support
- Tool search
- Favorites
- Recent tools

---

# State Persistence

Use localStorage for:
- theme preference
- last selected tool
- favorites
- recent tools

Do NOT store sensitive data.

---

# Mobile Requirements

- Fully responsive
- Sidebar collapses on mobile
- Touch-friendly controls
- No horizontal overflow
- Optimized textarea sizes

---

# Coding Standards

- Use modern ES6+
- Use const/let
- Avoid global pollution
- Use descriptive naming
- Keep functions small
- Add comments only where useful
- Prioritize readability

---

# Error Handling

All tools must:
- validate input
- show friendly errors
- never crash the UI
- handle malformed data gracefully

---

# Output Requirements

The final implementation should feel:
- premium
- polished
- production-ready
- fast
- clean
- developer focused

The UI should resemble modern developer tools and productivity apps.

---

# Final Deliverables

Generate ONLY:
- index.html
- style.css
- app.js

No additional files.

The application must be immediately deployable to GitHub Pages without modification.

---