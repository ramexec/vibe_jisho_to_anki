let dictionaryPromise;
let kanjiDictionaryPromise;

async function loadCompressedJson(path, label) {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot decompress the local dictionary data. Please update your browser.");
  }

  const response = await fetch(`${import.meta.env.BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Could not load ${label} (HTTP ${response.status}).`);
  }

  const decompressed = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(decompressed).json();
}

async function loadDictionary() {
  if (!dictionaryPromise) {
    dictionaryPromise = loadCompressedJson("data/jmdict/index.json.gz.data", "the local JMdict dictionary")
      .catch((error) => {
        dictionaryPromise = undefined;
        throw error;
      });
  }

  return dictionaryPromise;
}

async function loadKanjiDictionary() {
  if (!kanjiDictionaryPromise) {
    kanjiDictionaryPromise = loadCompressedJson("data/kanjidic2/index.json.gz.data", "the local KANJIDIC2 data")
      .catch((error) => {
        kanjiDictionaryPromise = undefined;
        throw error;
      });
  }

  return kanjiDictionaryPromise;
}

function includesAllWords(text, words) {
  const tokens = new Set(text.match(/[\p{L}\p{N}]+/gu) || []);
  return words.every((word) => tokens.has(word));
}

export async function searchKanjiEntry(character, exampleLimit = 8) {
  const [kanjiEntries, dictionaryEntries] = await Promise.all([
    loadKanjiDictionary(),
    loadDictionary(),
  ]);
  const kanji = kanjiEntries.find((entry) => entry.character === character);
  if (!kanji) return null;

  const candidates = dictionaryEntries
    .filter((entry) => entry.k.some((word) => word.includes(character) && [...word].length > 1))
    .map((entry) => ({
      ...entry,
      exampleWord: entry.k.find((word) => word.includes(character)),
    }))
    .sort((a, b) => {
      if (a.p !== b.p) return b.p - a.p;
      const aLength = [...a.exampleWord].length;
      const bLength = [...b.exampleWord].length;
      return aLength - bLength || a.exampleWord.localeCompare(b.exampleWord, "ja");
    });
  const startsWithKanji = candidates.filter((entry) => entry.exampleWord.startsWith(character));
  const includesKanji = candidates.filter((entry) => !entry.exampleWord.startsWith(character));
  const halfLimit = Math.ceil(exampleLimit / 2);
  const examples = [
    ...startsWithKanji.slice(0, halfLimit),
    ...includesKanji.slice(0, exampleLimit - halfLimit),
    ...startsWithKanji.slice(halfLimit),
    ...includesKanji.slice(exampleLimit - halfLimit),
  ].slice(0, exampleLimit);

  return { ...kanji, examples };
}

export async function searchDictionary(query, limit = 40) {
  const normalizedQuery = query.trim().normalize("NFKC").toLocaleLowerCase();
  if (!normalizedQuery) return [];

  const entries = await loadDictionary();
  const japaneseQuery = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(normalizedQuery);
  const words = normalizedQuery.split(/\s+/u);
  const matches = [];

  for (const entry of entries) {
    const written = entry.k.map((value) => value.toLocaleLowerCase());
    const readings = entry.r.map((value) => value.toLocaleLowerCase());
    const definitions = entry.s.flatMap((sense) => sense.g).map((value) => value.normalize("NFKC").toLocaleLowerCase());

    let score = -1;
    if (japaneseQuery) {
      const terms = [...written, ...readings];
      if (terms.some((term) => term === normalizedQuery)) score = 400;
      else if (terms.some((term) => term.startsWith(normalizedQuery))) score = 300;
      else if (terms.some((term) => term.includes(normalizedQuery))) score = 200;
    } else {
      const searchableDefinitions = definitions.join(" ");
      if (includesAllWords(searchableDefinitions, words)) {
        if (definitions.some((definition) => definition === normalizedQuery)) score = 400;
        else if (definitions.some((definition) => definition.startsWith(normalizedQuery))) score = 300;
        else score = 200;
      }
    }

    if (score < 0) continue;
    matches.push({ entry, score: score + entry.p * 10 });
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, limit).map(({ entry }) => entry);
}
