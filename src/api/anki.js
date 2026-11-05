export async function ankiRequest(action, params = {}) {
  let response;
  try {
    response = await fetch(
      import.meta.env.PROD ? "http://127.0.0.1:8765" : "/api/anki",
      {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
      },
    );
  } catch {
    throw new Error(
      import.meta.env.PROD
        ? "Could not reach AnkiConnect on this computer. Open Anki and allow local-network access for this site if your browser asks. If it still fails, add https://ramexec.github.io to AnkiConnect's webCorsOriginList and restart Anki."
        : "Could not reach AnkiConnect. Open Anki, make sure AnkiConnect is installed, and run this app with npm run dev.",
    );
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(
        import.meta.env.PROD
          ? "Could not reach AnkiConnect on this computer. Open Anki and make sure AnkiConnect is installed and enabled."
          : "Could not reach AnkiConnect. Open Anki, make sure AnkiConnect is installed, and run this app with npm run dev.",
      );
    }
    throw new Error(`AnkiConnect returned HTTP ${response.status}.`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

export async function getAnkiSetup() {
  const [decks, models] = await Promise.all([
    ankiRequest("deckNames"),
    ankiRequest("modelNames"),
  ]);
  return { decks, models };
}

export async function getModelFields(modelName) {
  if (!modelName) return [];
  return ankiRequest("modelFieldNames", { modelName });
}

const jishoCardCss =`
/* Base card */
.card {
  box-sizing: border-box;
  min-height: 100vh;
  margin: 0;
  padding: 35px 20px;
  background: #f3f2eb;
  color: #293a35;
  font-family: "Yu Mincho", "游明朝", "YuMincho",
    "Hiragino Mincho ProN", serif;
  font-size: 20px;
  text-align: center;
}

/* Front */
.jta-front {
  box-sizing: border-box;
  max-width: 760px;
  min-height: 350px;
  margin: 40px auto;
  padding: 70px 25px;
  border: 1px solid #dce2d8;
  border-radius: 16px;
  background: #fffefa;
  color: #263a33;
  font-size: 64px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

/* Back */
.jta-back {
  box-sizing: border-box;
  max-width: 760px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid #dce2d8;
  border-radius: 16px;
  background: #fffefa;
  color: #33423b;
  font-family: Arial, "Yu Gothic", sans-serif;
  font-size: 18px;
  line-height: 1.7;
  text-align: left;
  overflow-wrap: anywhere;
}

/* Sections */
.jta-section + .jta-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid #dce2d8;
}

.jta-section-title {
  margin-bottom: 10px;
  color: #78877b;
  font-size: 12px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* Readings */
.jta-reading-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.jta-reading {
  padding: 5px 12px;
  border: 1px solid #dce2d8;
  border-radius: 20px;
  background: #f3f2eb;
  color: #34443c;
  font-family: "Yu Mincho", serif;
}

/* Senses */
.jta-sense + .jta-sense {
  margin-top: 12px;
}

.jta-pos {
  color: #78877b;
  font-size: 14px;
  font-weight: bold;
}

.jta-meaning-list {
  margin: 5px 0 0;
  padding-left: 22px;
}

.jta-meaning-list li + li {
  margin-top: 3px;
}

/* Examples */
.jta-example {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 14px;
  align-items: baseline;
}

.jta-example + .jta-example {
  margin-top: 12px;
}

.jta-example-word {
  color: #34443c;
  font-family: "Yu Mincho", serif;
  font-size: 22px;
  font-weight: bold;
}

.jta-example-reading {
  color: #78877b;
  font-size: 14px;
}

.jta-example-meanings {
  grid-column: 1 / -1;
  color: #56665d;
  font-size: 16px;
}

.jta-empty {
  color: #89948c;
  font-style: italic;
}

/* Answer separator */
#answer {
  max-width: 760px;
  margin: 25px auto;
  border: 0;
  border-top: 1px solid #dce2d8;
}

/* Night mode */
.card.nightMode {
  background: #202823;
  color: #e7e5dc;
}

.nightMode .jta-front,
.nightMode .jta-back {
  border-color: #414d44;
  background: #29342d;
  color: #e7e5dc;
}

.nightMode .jta-section + .jta-section {
  border-top-color: #414d44;
}

.nightMode .jta-section-title,
.nightMode .jta-pos,
.nightMode .jta-example-reading {
  color: #aab8aa;
}

.nightMode .jta-reading {
  border-color: #414d44;
  background: #354138;
  color: #e7e5dc;
}

.nightMode .jta-example-word {
  color: #e7e5dc;
}

.nightMode .jta-example-meanings {
  color: #c1c9c0;
}

.nightMode .jta-empty {
  color: #aab8aa;
}

.nightMode #answer {
  border-top-color: #414d44;
}
`;
// const jishoCardCss = `
// .card {
//   box-sizing: border-box;
//   min-height: 100vh;
//   margin: 0;
//   padding: clamp(24px, 7vh, 68px) 20px;
//   color: #293a35;
//   background:
//     radial-gradient(circle at 12% 8%, rgba(226, 190, 151, 0.22), transparent 32%),
//     linear-gradient(145deg, #f8f5ee 0%, #edf1e9 100%);
//   font-family: "Noto Serif JP", "Yu Mincho", "游明朝", "Hiragino Mincho ProN", serif;
//   font-size: 20px;
//   text-align: center;
// }
// .jta-front {
//   position: relative;
//   box-sizing: border-box;
//   display: grid;
//   place-content: center;
//   width: min(100%, 760px);
//   min-height: min(60vh, 440px);
//   margin: clamp(24px, 8vh, 72px) auto;
//   padding: clamp(56px, 9vw, 88px) 28px;
//   overflow-wrap: anywhere;
//   border: 1px solid rgba(47, 72, 61, 0.12);
//   border-radius: 20px;
//   background: rgba(255, 254, 250, 0.94);
//   box-shadow: 0 24px 70px rgba(40, 54, 46, 0.11), 0 3px 10px rgba(40, 54, 46, 0.05);
//   color: #263a33;
//   font-size: clamp(3rem, 11vw, 5.5rem);
//   letter-spacing: 0.04em;
//   line-height: 1.3;
// }
// .jta-front::before {
//   position: absolute;
//   top: 24px;
//   left: 28px;
//   color: #77877b;
//   content: "JISHO  /  VOCABULARY";
//   font-family: "DM Sans", "Yu Gothic", Arial, sans-serif;
//   font-size: 0.68rem;
//   font-weight: 700;
//   letter-spacing: 0.18em;
// }
// .jta-front::after {
//   position: absolute;
//   bottom: 24px;
//   left: calc(50% - 22px);
//   width: 44px;
//   height: 3px;
//   border-radius: 3px;
//   background: #d4775b;
//   content: "";
// }
// .jta-back {
//   box-sizing: border-box;
//   width: min(100%, 760px);
//   margin: 0 auto;
//   padding: clamp(22px, 5vw, 36px);
//   overflow-wrap: anywhere;
//   border: 1px solid rgba(47, 72, 61, 0.12);
//   border-radius: 18px;
//   background: rgba(255, 254, 250, 0.96);
//   box-shadow: 0 16px 46px rgba(40, 54, 46, 0.08);
//   color: #33423b;
//   font-family: "DM Sans", "Yu Gothic", Arial, sans-serif;
//   font-size: clamp(1rem, 2.8vw, 1.15rem);
//   line-height: 1.85;
//   text-align: left;
//   white-space: pre-line;
// }
// .jta-back .jta-back {
//   width: auto;
//   margin: 0;
//   padding: 0;
//   border: 0;
//   border-radius: 0;
//   background: transparent;
//   box-shadow: none;
// }
// .jta-section {
//   margin-top: 0.8rem;
//   padding: 0.9rem 1rem;
//   border: 1px solid rgba(47, 72, 61, 0.1);
//   border-radius: 12px;
//   background: rgba(243, 242, 235, 0.62);
// }
// .jta-section:first-child {
//   margin-top: 0;
// }
// .jta-section.jta-section-compact {
//   display: inline-block;
//   width: calc(50% - 0.45rem);
//   min-height: 100px;
//   margin: 0.25rem 0.45rem 0.25rem 0;
//   vertical-align: top;
// }
// .jta-section-title {
//   display: flex;
//   align-items: center;
//   gap: 0.6rem;
//   margin: 0 0 0.5rem;
//   color: #78877b;
//   font-size: 0.7rem;
//   font-weight: 800;
//   letter-spacing: 0.16em;
//   line-height: 1.4;
//   text-transform: uppercase;
// }
// .jta-section-title::before {
//   width: 0.4rem;
//   height: 0.4rem;
//   border-radius: 50%;
//   background: #d4775b;
//   content: "";
// }
// .jta-reading-list {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 0.5rem;
// }
// .jta-reading {
//   display: inline-flex;
//   padding: 0.3rem 0.7rem;
//   border: 1px solid rgba(47, 72, 61, 0.13);
//   border-radius: 999px;
//   background: #f3f2eb;
//   color: #34443c;
//   font-family: "Noto Serif JP", "Yu Mincho", serif;
//   font-size: 1.05em;
// }
// .jta-meaning-text {
//   margin: 0;
//   line-height: 1.65;
// }
// .jta-meaning-pos {
//   color: #78877b;
//   font-size: 0.8em;
//   font-weight: 700;
// }
// .jta-example-list {
//   margin: 0;
//   padding-left: 1.6rem;
// }
// .jta-example-item {
//   padding-left: 0.2rem;
// }
// .jta-example-item + .jta-example-item {
//   margin-top: 0.65rem;
// }
// .jta-example-japanese {
//   display: flex;
//   flex-wrap: wrap;
//   gap: 0.15rem 0.65rem;
//   align-items: baseline;
// }
// .jta-example-word {
//   overflow-wrap: anywhere;
//   color: #34443c;
//   font-family: "Noto Serif JP", "Yu Mincho", serif;
//   font-size: 1.13em;
//   font-weight: 600;
// }
// .jta-example-reading {
//   color: #78877b;
//   font-size: 0.9em;
// }
// .jta-example-meaning {
//   margin: 0.12rem 0 0;
//   color: #56665d;
//   font-size: 0.92em;
//   line-height: 1.55;
// }
// .jta-empty {
//   margin: 0;
//   color: #89948c;
//   font-size: 0.9em;
//   font-style: italic;
// }
// #answer {
//   width: min(100%, 760px);
//   height: 1px;
//   margin: 0 auto clamp(20px, 4vh, 32px);
//   border: 0;
//   background: linear-gradient(90deg, transparent, rgba(47, 72, 61, 0.22), transparent);
// }
// .card.nightMode {
//   color: #e7e5dc;
//   background:
//     radial-gradient(circle at 12% 8%, rgba(132, 91, 63, 0.18), transparent 32%),
//     linear-gradient(145deg, #202823 0%, #18211e 100%);
// }
// .card.nightMode .jta-front,
// .card.nightMode .jta-back {
//   border-color: rgba(226, 232, 221, 0.12);
//   background: rgba(36, 46, 40, 0.96);
//   color: #e7e5dc;
// }
// .card.nightMode .jta-back .jta-back {
//   border: 0;
//   background: transparent;
//   box-shadow: none;
// }
// .card.nightMode .jta-front::before {
//   color: #aab8aa;
// }
// .card.nightMode .jta-section {
//   border-color: rgba(226, 232, 221, 0.1);
//   background: rgba(48, 59, 52, 0.48);
// }
// .card.nightMode .jta-section-title,
// .card.nightMode .jta-meaning-pos,
// .card.nightMode .jta-example-reading {
//   color: #aab8aa;
// }
// .card.nightMode .jta-meaning-text {
//   color: #e7e5dc;
// }
// .card.nightMode .jta-reading {
//   border-color: rgba(226, 232, 221, 0.13);
//   background: #303b34;
//   color: #e7e5dc;
// }
// .card.nightMode .jta-example-word {
//   color: #e7e5dc;
// }
// .card.nightMode .jta-example-meaning {
//   color: #c1c9c0;
// }
// .card.nightMode .jta-empty {
//   color: #aab8aa;
// }
// .card.nightMode #answer {
//   background: linear-gradient(90deg, transparent, rgba(226, 232, 221, 0.22), transparent);
// }
// `;

const jishoCardCssStart = "/* JishoToAnki card theme: begin */";
const jishoCardCssEnd = "/* JishoToAnki card theme: end */";

function withJishoCardCss(css = "") {
  const start = css.indexOf(jishoCardCssStart);
  if (start !== -1) {
    const end = css.indexOf(jishoCardCssEnd, start);
    if (end !== -1) {
      css = css.slice(0, start) + css.slice(end + jishoCardCssEnd.length);
    }
  }
  return `${css.trim()}\n\n${jishoCardCssStart}\n${jishoCardCss}\n${jishoCardCssEnd}`;
}

export async function createJishoNoteType() {
  const modelName = "JishoToAnki";
  const models = await ankiRequest("modelNames");
  if (models.includes(modelName)) {
    const styling = await ankiRequest("modelStyling", { modelName });
    if (typeof styling?.css !== "string") {
      throw new Error("AnkiConnect did not return the JishoToAnki note type styling.");
    }
    await ankiRequest("updateModelStyling", {
      model: { name: modelName, css: withJishoCardCss(styling.css) },
    });
    return false;
  }

  await ankiRequest("createModel", {
    modelName,
    inOrderFields: ["Front", "Back"],
    css: withJishoCardCss(),
    cardTemplates: [
      {
        Name: "JishoToAnki Card",
        Front: '<div class="jta-front">{{Front}}</div>',
        Back: '{{FrontSide}}<hr id="answer"><div class="jta-back">{{Back}}</div>',
      },
    ],
  });
  return true;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function renderBackSections(sections) {
  return (Array.isArray(sections) ? sections : [])
    .filter((section) => section && typeof section === "object")
    .map((section) => {
      const title = escapeHtml(section.title || "DETAILS");
      const items = Array.isArray(section.items)
        ? section.items.filter((item) => item != null && item !== "")
        : [];
      const emptyText = escapeHtml(section.emptyText || "Not available.");
      let content;

      if (!items.length) {
        content = `<p class="jta-empty">${emptyText}</p>`;
      } else if (section.type === "readings") {
        content = `<div class="jta-reading-list">${items.map((reading) =>
          `<span class="jta-reading">${escapeHtml(reading)}</span>`,
        ).join("")}</div>`;
      } else if (section.type === "meanings") {
        content = items.map((item) => {
          if (typeof item === "string") {
            return `<p class="jta-meaning-text">${escapeHtml(item)}</p>`;
          }
          const parts = Array.isArray(item.parts) ? item.parts.filter(Boolean) : [];
          const meanings = Array.isArray(item.meanings) ? item.meanings.filter(Boolean) : [];
          if (!meanings.length) return `<p class="jta-empty">${emptyText}</p>`;
          return `<p class="jta-meaning-text">${parts.length
            ? `<span class="jta-meaning-pos">${escapeHtml(parts.join(", "))}: </span>`
            : ""}${meanings.map(escapeHtml).join(", ")}</p>`;
        }).join("");
      } else if (section.type === "meaning-list") {
        content = `<p class="jta-meaning-text">${items.map(escapeHtml).join(", ")}</p>`;
      } else if (section.type === "examples") {
        const examples = items.map((item) => {
          const word = String(item.word || "").trim();
          if (!word) return "";
          const reading = String(item.reading || "").trim();
          const meanings = Array.isArray(item.meanings)
            ? item.meanings.filter(Boolean)
            : [];
          return `<li class="jta-example-item"><div class="jta-example-japanese"><span class="jta-example-word">${escapeHtml(word)}</span>${reading
            ? `<span class="jta-example-reading">${escapeHtml(reading)}</span>`
            : ""}</div><p class="jta-example-meaning">${meanings.length
              ? meanings.map(escapeHtml).join(", ")
              : emptyText}</p></li>`;
        }).join("");
        content = examples
          ? `<ol class="jta-example-list">${examples}</ol>`
          : `<p class="jta-empty">${emptyText}</p>`;
      } else {
        content = `<ul>${items.map((item) =>
          `<li>${escapeHtml(item)}</li>`,
        ).join("")}</ul>`;
      }

      const compactClass = section.compact ? " jta-section-compact" : "";
      return `<section class="jta-section${compactClass}"><h3 class="jta-section-title">${title}</h3>${content}</section>`;
    }).join("");
}

export async function addAnkiNote({
  deckName,
  modelName,
  frontField,
  backField,
  front,
  backSections,
  tags,
}) {
  if (!deckName) throw new Error("Choose a deck in Settings before adding a card.");
  if (!modelName) throw new Error("Choose a note type in Settings before adding a card.");
  if (!frontField || !backField || frontField === backField) {
    throw new Error("Choose different front and back fields in Settings.");
  }

  const fields = {
    [frontField]: `<div class="jta-front">${escapeHtml(front)}</div>`,
    [backField]: `<div class="jta-back">${renderBackSections(backSections)}</div>`,
  };
  const noteId = await ankiRequest("addNote", {
    note: {
      deckName,
      modelName,
      fields,
      tags: tags.split(/\s+/).filter(Boolean),
      options: { allowDuplicate: false },
    },
  });

  if (!noteId) throw new Error("Anki did not add the card. It may already exist.");
  return noteId;
}

function getWordSyncTag(slug) {
  const codePoints = Array.from(slug, (character) =>
    character.codePointAt(0).toString(16),
  );
  return `jta_word_${codePoints.join("_")}`;
}

export async function saveWordToAnki({
  slug,
  deckName,
  modelName,
  frontField,
  backField,
  front,
  backSections,
  tags,
}) {
  if (!slug || !front) throw new Error("Choose a word before syncing it to Anki.");
  if (!deckName) throw new Error("Choose a deck in Settings before syncing.");
  if (!modelName) throw new Error("Choose a note type in Settings before syncing.");
  if (!frontField || !backField || frontField === backField) {
    throw new Error("Choose different front and back fields in Settings.");
  }

  const syncTag = getWordSyncTag(slug);
  const fields = {
    [frontField]: `<div class="jta-front">${escapeHtml(front)}</div>`,
    [backField]: `<div class="jta-back">${renderBackSections(backSections)}</div>`,
  };
  const taggedNotes = await ankiRequest("findNotes", {
    query: `tag:${syncTag}`,
  });

  if (taggedNotes.length > 1) {
    throw new Error(`Anki has multiple cards for ${front}. Remove the duplicates in Anki, then retry.`);
  }

  let noteId = taggedNotes[0];
  if (!noteId) {
    const legacyNoteIds = await ankiRequest("findNotes", {
      query: `${frontField}:${JSON.stringify(front)}`,
    });
    if (legacyNoteIds.length) {
      const notes = await ankiRequest("notesInfo", { notes: legacyNoteIds });
      const matchingNotes = notes.filter((note) =>
        note.modelName === modelName &&
        plainText(note.fields?.[frontField]?.value) === front
      );
      if (matchingNotes.length > 1) {
        throw new Error(`Anki has multiple cards for ${front}. Remove the duplicates in Anki, then retry.`);
      }
      noteId = matchingNotes[0]?.noteId;
      if (noteId) {
        await ankiRequest("addTags", {
          notes: [noteId],
          tags: syncTag,
        });
      }
    }
  }

  if (noteId) {
    await ankiRequest("updateNoteFields", {
      note: { id: noteId, fields },
    });
    return { noteId, created: false };
  }

  noteId = await ankiRequest("addNote", {
    note: {
      deckName,
      modelName,
      fields,
      tags: [...new Set([...String(tags || "").split(/\s+/).filter(Boolean), syncTag])],
      options: { allowDuplicate: false },
    },
  });

  if (!noteId) {
    throw new Error("Anki did not add the card. Check for an existing duplicate and retry.");
  }
  return { noteId, created: true };
}

function getKanjiSyncTag(kanji) {
  const codePoints = Array.from(kanji, (character) =>
    character.codePointAt(0).toString(16),
  );
  return `jta_kanji_${codePoints.join("_")}`;
}

export async function saveKanjiToAnki({
  kanji,
  backSections,
  deckName,
  modelName,
  frontField,
  backField,
  tags,
}) {
  if (!kanji || !/\p{Script=Han}/u.test(kanji)) {
    throw new Error("Choose a kanji before syncing it to Anki.");
  }
  if (!deckName) throw new Error("Choose a deck in Settings before syncing.");
  if (!modelName) throw new Error("Choose a note type in Settings before syncing.");
  if (!frontField || !backField || frontField === backField) {
    throw new Error("Choose different front and back fields in Settings.");
  }

  const syncTag = getKanjiSyncTag(kanji);
  const fields = {
    [frontField]: `<div class="jta-front">${escapeHtml(kanji)}</div>`,
    [backField]: `<div class="jta-back">${renderBackSections(backSections)}</div>`,
  };
  const matchingNotes = await ankiRequest("findNotes", {
    query: `tag:${syncTag}`,
  });

  if (matchingNotes.length > 1) {
    throw new Error(`Anki has multiple cards for ${kanji}. Remove the duplicates in Anki, then retry.`);
  }

  if (matchingNotes.length === 1) {
    const noteId = matchingNotes[0];
    await ankiRequest("updateNoteFields", {
      note: { id: noteId, fields },
    });
    return { noteId, created: false };
  }

  const noteId = await ankiRequest("addNote", {
    note: {
      deckName,
      modelName,
      fields,
      tags: [...new Set([...String(tags || "").split(/\s+/).filter(Boolean), "jta_kanji", syncTag])],
      options: { allowDuplicate: false },
    },
  });

  if (!noteId) {
    throw new Error("Anki did not add the card. Check for an existing duplicate and retry.");
  }
  return { noteId, created: true };
}

function plainText(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(div|p|li|h[1-6]|section|article|span)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function syncKanjiFromAnki({ frontField, backField }) {
  const noteIds = await ankiRequest("findNotes", {
    query: "tag:jta_kanji",
  });
  if (!noteIds.length) return [];

  const notes = await ankiRequest("notesInfo", { notes: noteIds });
  return notes.flatMap((note) => {
    const kanji = plainText(note.fields?.[frontField]?.value);
    if (!kanji || !/\p{Script=Han}/u.test(kanji)) return [];
    const back = plainText(note.fields?.[backField]?.value);
    const section = (name) => {
      const match = back.match(
        new RegExp(`(?:^|\\n)${name}\\s*\\n([\\s\\S]*?)(?=\\n\\n[A-Z][A-Z' /]+(?::|\\n)|$)`),
      );
      return match?.[1]?.trim() || "";
    };
    const readings = [
      section("ON'YOMI"),
      section("KUN'YOMI"),
    ].filter(Boolean);
    return [{
      slug: `kanji-${kanji}`,
      word: kanji,
      reading: readings.join(", "),
      meaning: section("MEANING") || back || "Synced from Anki",
      ankiNoteId: note.noteId,
      ankiSyncedAt: new Date().toISOString(),
      source: "anki",
    }];
  });
}
