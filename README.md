
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

GitHub Pages is static hosting, so it cannot run the Vite API proxy used for Jisho/kanji lookups. The hosted app can still connect directly from the browser to AnkiConnect on the user's own computer; see the hosted setup below.

### Connect Anki

1. Install and enable the AnkiConnect add-on in Anki, then keep Anki open.
2. Run this app with `npm run dev`. The Vite development server proxies dictionary requests and forwards AnkiConnect requests to `127.0.0.1:8765`.
3. Open **Settings**, test the connection, choose a deck and note type, map the front and back fields, and save.
4. Search the **Dictionary** and use **Add to Anki** on an entry. Use **Create JishoToAnki note type** if you want the app's suggested two-field card layout.

### Connect Anki from the hosted site

1. Install and enable AnkiConnect, then keep Anki running on the same computer and browser you use to access the site.
2. In Anki, open **Tools → Add-ons**, select **AnkiConnect**, choose **Config**, and add `"https://ramexec.github.io"` to its `webCorsOriginList` array. Keep any existing allowed origins.
3. Keep `webBindAddress` set to `"127.0.0.1"`. Do not change it to `0.0.0.0` or expose AnkiConnect to your network or the internet.
4. Save the config and restart Anki. In the hosted app's **Settings**, test the connection and allow local-network access in the browser if asked.

The browser talks directly to `http://127.0.0.1:8765`; no hosted backend is involved. Browser support and local-network permission prompts may vary. Saved vocabulary and app settings are stored in this browser. Live Jisho/kanji lookup still needs the local development proxy, so it is unavailable on the static hosted site.
