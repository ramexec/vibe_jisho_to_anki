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

export async function createJishoNoteType() {
  const modelName = "JishoToAnki";
  const models = await ankiRequest("modelNames");
  if (models.includes(modelName)) return false;

  await ankiRequest("createModel", {
    modelName,
    inOrderFields: ["Front", "Back"],
    css: `
.card {
  font-family: "Yu Mincho", "游明朝", "YuMincho", "Hiragino Mincho ProN", serif;
  font-size: 24px;
  text-align: center;
  color: #222;
  background: #fff;
}
.jta-front {
  font-size: 48px;
  line-height: 1.5;
}
.jta-back {
  font-family: Arial, "Yu Gothic", sans-serif;
  font-size: 18px;
  line-height: 1.75;
  text-align: left;
  overflow-wrap: anywhere;
}
`,
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
