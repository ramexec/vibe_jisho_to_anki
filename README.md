
## Jisho to Anki

A Japanese dictionary and vocabulary app with an AnkiConnect card workflow.

### Run locally

```sh
npm install
npm run dev
```

### Deploy to GitHub Pages

To publish your current local changes, run:

```sh
npm run deploy
```

This builds the site with the correct project URL and pushes the generated `dist/` files to `gh-pages`. You can also push to `main`; GitHub Actions will build and publish automatically. In the repository settings, **Pages** should use **Deploy from a branch**, `gh-pages`, and `/ (root)`. The site URL is `https://ramexec.github.io/jisho_to_anki/`.

GitHub Pages is static hosting. It can host the app UI and browser-stored vocabulary, but it cannot run the Vite API proxy required for live Jisho/kanji lookups or AnkiConnect. Those integrations require running the app locally with `npm run dev`; hosted users can open Jisho directly for searches.

### Connect Anki

1. Install and enable the AnkiConnect add-on in Anki, then keep Anki open.
2. Run this app with `npm run dev`. The Vite development server proxies dictionary requests and forwards AnkiConnect requests to `127.0.0.1:8765`.
3. Open **Settings**, test the connection, choose a deck and note type, map the front and back fields, and save.
4. Search the **Dictionary** and use **Add to Anki** on an entry. Use **Create JishoToAnki note type** if you want the app's suggested two-field card layout.

Saved vocabulary and app settings are stored in this browser. Do not expose AnkiConnect directly to the public internet.
