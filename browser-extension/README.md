# Browser Extension

Chromium-based extension for Chrome, Coc Coc, and Opera.

## Files

- `manifest.json`
- `content.js`
- `background.js`

## Load locally

1. Open browser extensions page.
2. Enable Developer Mode.
3. Choose **Load unpacked**.
4. Select the `browser-extension/` folder.

The extension sends highlighted text to `http://localhost:8000/scan` with `source: "extension"`.
