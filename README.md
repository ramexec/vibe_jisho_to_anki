
## Jisho to Anki

A Japanese dictionary and vocabulary app with an AnkiConnect card workflow.

### Run locally

```sh
npm install
npm run dev
```

### Connect Anki

1. Install and enable the AnkiConnect add-on in Anki, then keep Anki open.
2. Run this app with `npm run dev`. The Vite development server proxies dictionary requests and forwards AnkiConnect requests to `127.0.0.1:8765`.
3. Open **Settings**, test the connection, choose a deck and note type, map the front and back fields, and save.
4. Search the **Dictionary** and use **Add to Anki** on an entry. Use **Create JishoToAnki note type** if you want the app's suggested two-field card layout.

Saved vocabulary and app settings are stored in this browser. The included Anki proxy is for local development; a deployed app needs a trusted backend/local proxy that can reach the user's AnkiConnect service. Do not expose AnkiConnect directly to the public internet.
