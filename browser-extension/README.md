# Browser Extension

Chromium-based extension for Chrome, Coc Coc, and Opera.

## Files

- `manifest.json`
- `selectors.js`
- `content.js`
- `background.js`

## Load locally

1. Open browser extensions page.
2. Enable Developer Mode.
3. Choose **Load unpacked**.
4. Select the `browser-extension/` folder.

## Behavior

- Runs only on `https://web.telegram.org/*`.
- Detects composer area and adds highlight + `Auto Scan` badge.
- Scans hovered messages only after 2 seconds (to reduce backend load).
- Observes outgoing drafts.
- Triggers scans:
  - hover (2s stable hover on a message)
  - realtime (debounced) while typing
  - final check when pressing Send
- Sends message text to `http://localhost:8000/scan` with `source: "extension"`.
- Shows floating right-side panel with:
  - status (`idle`, `watching`, `scanning`, `done`, `error`, `offline`)
  - spam/ham label + confidence
  - advice level (`safe`, `caution`, `risky`)

## Quick test

1. Start backend API on `http://localhost:8000`.
2. Open Telegram Web and load a chat.
3. Type a message with more than 10 words and wait for realtime status.
4. Press Send and verify a final scan result appears.
5. Receive a long incoming message and confirm panel updates.
6. Toggle `Auto Scan` off and verify no more API requests are sent.
