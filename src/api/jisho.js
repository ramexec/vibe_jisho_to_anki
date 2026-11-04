
export async function searchJisho(query) {
  if (!query.trim()) return [];

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
    response = await fetch(`/api/kanji/${encodeURIComponent(kanji)}`);
  } catch {
    throw new Error("Could not connect to the kanji lookup service. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new Error(`Kanji lookup failed (HTTP ${response.status}).`);
  }

  return response.json();
}
