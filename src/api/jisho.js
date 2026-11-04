
export async function searchJisho(query) {
  if (!query.trim()) return [];
  if (import.meta.env.PROD) {
    throw new Error(
      "Live dictionary search needs a server proxy, which GitHub Pages does not provide. Open Jisho directly below or run the app locally.",
    );
  }

  let response;
  try {
    response = await fetch(
      `/api/jisho/search/words?keyword=${encodeURIComponent(query.trim())}`
    );
  } catch {
    throw new Error("Could not connect to the Jisho lookup proxy. Restart the app with npm run dev and try again.");
  }

  if (!response.ok) {
    throw new Error(`Jisho search failed (HTTP ${response.status}).`);
  }

  const json = await response.json();
  if (!Array.isArray(json.data)) {
    throw new Error("Jisho returned an unexpected response.");
  }
  return json.data;
}

export async function lookupKanji(kanji) {
  let response;
  try {
    const url = import.meta.env.PROD
      ? `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(kanji)}`
      : `/api/kanji/${encodeURIComponent(kanji)}`;
    response = await fetch(url);
  } catch {
    throw new Error("Could not connect to the kanji lookup service. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(`Kanji lookup failed (HTTP ${response.status}).`);
  }

  const entry = await response.json();
  const examplesUrl = import.meta.env.PROD
    ? `https://kanjiapi.dev/v1/words/${encodeURIComponent(kanji)}`
    : `/api/kanji-words/${encodeURIComponent(kanji)}`;

  try {
    const examplesResponse = await fetch(examplesUrl);
    if (!examplesResponse.ok) {
      return {
        ...entry,
        examples: [],
        examplesError: `Kanji details loaded, but example words could not be retrieved (HTTP ${examplesResponse.status}).`,
      };
    }

    const words = await examplesResponse.json();
    if (!Array.isArray(words)) {
      return {
        ...entry,
        examples: [],
        examplesError: "Kanji details loaded, but the example-word response was invalid.",
      };
    }

    const seen = new Set();
    const examples = words.flatMap((word) =>
      (word.variants || []).flatMap((variant) => {
        const japanese = variant.written || variant.pronounced;
        if (!japanese || seen.has(japanese)) return [];
        seen.add(japanese);
        return [{
          japanese,
          readings: variant.pronounced ? [variant.pronounced] : [],
          meanings: (word.meanings || []).flatMap((meaning) => meaning.glosses || []),
        }];
      }),
    );
    return { ...entry, examples };
  } catch {
    return {
      ...entry,
      examples: [],
      examplesError: "Kanji details loaded, but example words could not be reached.",
    };
  }
}

export async function listKanji(level) {
  if (!/^jlpt-[1-5]$/.test(level)) {
    throw new Error("Choose a valid JLPT level from N5 to N1.");
  }

  let response;
  try {
    const url = import.meta.env.PROD
      ? `https://kanjiapi.dev/v1/kanji/${level}`
      : `/api/kanji/${level}`;
    response = await fetch(url);
  } catch {
    throw new Error("Could not load the kanji list. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(`Kanji list request failed (HTTP ${response.status}).`);
  }

  const kanji = await response.json();
  if (!Array.isArray(kanji)) {
    throw new Error("The kanji service returned an unexpected list.");
  }
  return kanji;
}
