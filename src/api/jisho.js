
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
  if (import.meta.env.PROD) {
    throw new Error(
      "Kanji lookup needs a server proxy, which GitHub Pages does not provide. Open Jisho directly below or run the app locally.",
    );
  }
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
