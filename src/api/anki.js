export async function ankiRequest(action, params = {}) {
  let response;
  try {
    response = await fetch("/api/anki", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, version: 6, params }),
    });
  } catch {
    throw new Error(
      "Could not reach AnkiConnect. Open Anki, make sure AnkiConnect is installed, and run this app with npm run dev.",
    );
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error(
        "Could not reach AnkiConnect. Open Anki, make sure AnkiConnect is installed, and run this app with npm run dev.",
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
