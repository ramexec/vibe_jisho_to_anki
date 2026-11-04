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

const jishoCardCss = `
.card {
  box-sizing: border-box;
  min-height: 100vh;
  margin: 0;
  padding: clamp(24px, 7vh, 68px) 20px;
  color: #293a35;
  background:
    radial-gradient(circle at 12% 8%, rgba(226, 190, 151, 0.22), transparent 32%),
    linear-gradient(145deg, #f8f5ee 0%, #edf1e9 100%);
  font-family: "Noto Serif JP", "Yu Mincho", "游明朝", "Hiragino Mincho ProN", serif;
  font-size: 20px;
  text-align: center;
}
.jta-front {
  position: relative;
  box-sizing: border-box;
  display: grid;
  place-content: center;
  width: min(100%, 760px);
  min-height: min(60vh, 440px);
  margin: clamp(24px, 8vh, 72px) auto;
  padding: clamp(56px, 9vw, 88px) 28px;
  overflow-wrap: anywhere;
  border: 1px solid rgba(47, 72, 61, 0.12);
  border-radius: 20px;
  background: rgba(255, 254, 250, 0.94);
  box-shadow: 0 24px 70px rgba(40, 54, 46, 0.11), 0 3px 10px rgba(40, 54, 46, 0.05);
  color: #263a33;
  font-size: clamp(3rem, 11vw, 5.5rem);
  letter-spacing: 0.04em;
  line-height: 1.3;
}
.jta-front::before {
  position: absolute;
  top: 24px;
  left: 28px;
  color: #77877b;
  content: "JISHO  /  VOCABULARY";
  font-family: "DM Sans", "Yu Gothic", Arial, sans-serif;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
}
.jta-front::after {
  position: absolute;
  bottom: 24px;
  left: calc(50% - 22px);
  width: 44px;
  height: 3px;
  border-radius: 3px;
  background: #d4775b;
  content: "";
}
.jta-back {
  box-sizing: border-box;
  width: min(100%, 760px);
  margin: 0 auto;
  padding: clamp(22px, 5vw, 36px);
  overflow-wrap: anywhere;
  border: 1px solid rgba(47, 72, 61, 0.12);
  border-radius: 18px;
  background: rgba(255, 254, 250, 0.96);
  box-shadow: 0 16px 46px rgba(40, 54, 46, 0.08);
  color: #33423b;
  font-family: "DM Sans", "Yu Gothic", Arial, sans-serif;
  font-size: clamp(1rem, 2.8vw, 1.15rem);
  line-height: 1.85;
  text-align: left;
  white-space: pre-line;
}
#answer {
  width: min(100%, 760px);
  height: 1px;
  margin: 0 auto clamp(20px, 4vh, 32px);
  border: 0;
  background: linear-gradient(90deg, transparent, rgba(47, 72, 61, 0.22), transparent);
}
.card.nightMode {
  color: #e7e5dc;
  background:
    radial-gradient(circle at 12% 8%, rgba(132, 91, 63, 0.18), transparent 32%),
    linear-gradient(145deg, #202823 0%, #18211e 100%);
}
.card.nightMode .jta-front,
.card.nightMode .jta-back {
  border-color: rgba(226, 232, 221, 0.12);
  background: rgba(36, 46, 40, 0.96);
  color: #e7e5dc;
}
.card.nightMode .jta-front::before {
  color: #aab8aa;
}
.card.nightMode #answer {
  background: linear-gradient(90deg, transparent, rgba(226, 232, 221, 0.22), transparent);
}
`;

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
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

export async function addAnkiNote({
  deckName,
  modelName,
  frontField,
  backField,
  front,
  back,
  tags,
}) {
  if (!deckName) throw new Error("Choose a deck in Settings before adding a card.");
  if (!modelName) throw new Error("Choose a note type in Settings before adding a card.");
  if (!frontField || !backField || frontField === backField) {
    throw new Error("Choose different front and back fields in Settings.");
  }

  const fields = {
    [frontField]: `<div class="jta-front">${escapeHtml(front)}</div>`,
    [backField]: `<div class="jta-back">${escapeHtml(back).replace(/\n/g, "<br>")}</div>`,
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

function getKanjiSyncTag(kanji) {
  const codePoints = Array.from(kanji, (character) =>
    character.codePointAt(0).toString(16),
  );
  return `jta_kanji_${codePoints.join("_")}`;
}

export async function saveKanjiToAnki({
  kanji,
  back,
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
    [backField]: `<div class="jta-back">${escapeHtml(back).replace(/\n/g, "<br>")}</div>`,
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
    .replace(/<\/(div|p|li)>/gi, "\n")
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
