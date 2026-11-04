# Jisho to Anki

A Japanese-learning companion for looking up words and kanji, keeping a personal vocabulary list, and sending flashcards to Anki.

**Try the app:** [ramexec.github.io/jisho_to_anki](https://ramexec.github.io/jisho_to_anki/)

## What you can do

- **Explore kanji:** Browse by JLPT level or search a character to see readings, meanings, stroke count, grade, frequency, and example words.
- **Look up vocabulary:** Search Jisho for words, readings, kanji, and English meanings when running the app locally.
- **Build a vocabulary list:** Save dictionary results or add your own words, edit them later, filter your list, and remove entries.
- **Create Anki cards:** Choose a deck and note type, map the card fields, add tags and an optional example sentence, and send cards to AnkiConnect.
- **Keep track of learning:** The dashboard shows recent searches, saved words, and cards added.
- **Choose your interface language:** Switch between English, Japanese, and Bengali from the header; your choice is saved in this browser.

## Get started on the hosted app

1. Open the [Jisho to Anki app](https://ramexec.github.io/jisho_to_anki/).
2. Open **Explorer** and search a kanji or browse the JLPT lists.
3. Use **Vocabulary** to add and manage your own saved words. Your list is stored in this browser.
4. To add cards to Anki, follow [Connect Anki from the hosted app](#connect-anki-from-the-hosted-app) below.

### Connect Anki from the hosted app

AnkiConnect runs on your own computer. The hosted app sends requests from your browser directly to your local Anki; it does not send your collection through a Jisho to Anki server.

1. Install and enable the AnkiConnect add-on in Anki. Keep Anki open on the same computer where you use the app.
2. In Anki, open **Tools → Add-ons**, select **AnkiConnect**, choose **Config**, and add `"https://ramexec.github.io"` to the `webCorsOriginList` array. Keep any existing allowed origins.
3. Leave `webBindAddress` set to `"127.0.0.1"`. Do not change it to `0.0.0.0` or expose AnkiConnect to your network or the internet.
4. Save the config and restart Anki.
5. In the app, open **Settings**, test the connection, choose a deck and note type, map the front and back fields, and save. Approve the browser's local-network permission if prompted.
6. In **Explorer**, choose **Save kanji & add to Anki**. This saves the kanji in this browser and creates or updates its matching Anki note. Use **Sync kanji from Anki** to import changes to the tagged kanji notes back into this browser.
7. To create cards from Jisho word results, run the app locally, search in **Dictionary**, and choose **Add to Anki**.

Browser support and local-network permission prompts may vary. If the connection fails, confirm that Anki is running, AnkiConnect is enabled, the site origin is in `webCorsOriginList`, and Anki has been restarted.

## Run locally

Running the app locally enables live Jisho word search and the local development proxy for AnkiConnect.

1. Install [Node.js](https://nodejs.org/).
2. Clone this repository and open its folder in a terminal.
3. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite (usually `http://localhost:5173`).
5. To connect Anki, keep Anki running with AnkiConnect installed, then configure the deck and note fields in **Settings**.

## Data and privacy

- Vocabulary, search history, and preferences are saved in your browser's local storage. They are not synced between devices and may be cleared with browser data.
- Kanji Explorer syncs only its own `jta_kanji`-tagged notes between the current browser and Anki. It does not import, change, or delete unrelated Anki notes.
- For the hosted app, AnkiConnect requests go from your browser to Anki on your own computer.
- For local development, the Vite server proxies requests to Jisho and to your local AnkiConnect service.
- Kanji details are retrieved directly from [KanjiAPI](https://kanjiapi.dev/).
- There is no Jisho to Anki account or app server storing your vocabulary.

## GitHub Pages deployment

The public app is hosted on GitHub Pages. To publish the current local source to the `gh-pages` branch:

```sh
npm run deploy
```

Alternatively, pushing to `main` triggers the GitHub Actions deployment workflow. The hosted app is static: kanji lookup and the browser-to-local AnkiConnect workflow work, while live Jisho word search currently requires running the app locally.

## Ideas for future Explorer features

The Explorer now supports JLPT-level browsing, kanji readings and meanings, study details, example words, and syncing its own tagged Anki notes. Possible next steps:

- **Radical and component breakdowns** to help learners recognize how a kanji is built.
- **Stroke-order diagrams** and writing practice.
- **JLPT study paths** with progress and review goals.
- **Vocabulary connections** linking example compounds to dictionary entries.
- **Anki review status** and due-card summaries alongside saved kanji.
- **Personal study progress** for bookmarked kanji and words already added to Anki.

## Feedback

Found a problem or have an idea? Open an issue in the [GitHub repository](https://github.com/ramexec/jisho_to_anki/issues).
