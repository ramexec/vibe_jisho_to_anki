import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Clock3,
  Search,
} from "lucide-react";
import { lookupKanji, searchJisho } from "../api/jisho";
import { addAnkiNote, saveKanjiToAnki } from "../api/anki";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function getJapanese(entry) {
  return entry.japanese?.find((item) => item.word) ?? entry.japanese?.[0] ?? {};
}

function getMeaning(entry, fallback) {
  return entry.senses
    ?.map((sense) => sense.english_definitions?.join(", "))
    .filter(Boolean)
    .join("; ") || fallback;
}

function Dictionary() {
  const { t } = useTranslation();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchHistory = useAppStore((state) => state.searchHistory);
  const addToHistory = useAppStore((state) => state.addToHistory);
  const saveWord = useAppStore((state) => state.saveWord);
  const savedWords = useAppStore((state) => state.savedWords);
  const ankiSettings = useAppStore((state) => state.ankiSettings);
  const recordAddedCard = useAppStore((state) => state.recordAddedCard);
  const setAnkiConnection = useAppStore((state) => state.setAnkiConnection);
  const requestId = useRef(0);
  const [query, setQuery] = useState(searchQuery);
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [kanjiEntry, setKanjiEntry] = useState(null);
  const [exampleSentence, setExampleSentence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  const [ankiMessage, setAnkiMessage] = useState("");
  const [ankiError, setAnkiError] = useState(false);
  const messageText = (message) => {
    if (!message) return "";
    if (typeof message === "string") return message;
    return `${t(message.key, message.options)}${message.detail ? ` ${message.detail}` : ""}`;
  };

  const selectedJapanese = useMemo(
    () => (selected ? getJapanese(selected) : {}),
    [selected],
  );
  const selectedSlug = selected
    ? selected.slug || `${selectedJapanese.word || selectedJapanese.reading || query}-${selectedJapanese.reading || ""}`
    : "";
  const isSaved = savedWords.some((word) => word.slug === selectedSlug);

  useEffect(() => {
    if (searchQuery.trim()) search(searchQuery);
    // Load the last query when this page is entered, including from the dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(value = query) {
    const trimmedQuery = value.trim();
    if (!trimmedQuery) {
      setError({ key: "dictionary.emptyQuery" });
      return;
    }

    setQuery(trimmedQuery);
    setIsLoading(true);
    setError("");
    setEntries([]);
    setSelected(null);
    setKanjiEntry(null);
    setExampleSentence("");
    setAnkiMessage("");
    setAnkiError(false);
    const currentRequestId = ++requestId.current;
    useAppStore.getState().setSearchQuery(trimmedQuery);
    addToHistory(trimmedQuery);

    try {
      if ([...trimmedQuery].length === 1 && /[\u3400-\u9fff々〆ヶ]/u.test(trimmedQuery)) {
        const result = await lookupKanji(trimmedQuery);
        if (currentRequestId !== requestId.current) return;
        setKanjiEntry(result);
        return;
      }
      const results = await searchJisho(trimmedQuery);
      if (currentRequestId !== requestId.current) return;
      setEntries(results);
      setSelected(results[0] ?? null);
      if (!results.length) setError({ key: "dictionary.noResults", options: { query: trimmedQuery } });
    } catch (requestError) {
      if (currentRequestId === requestId.current) {
        setError({ key: "dictionary.fallbackError", detail: requestError.message });
      }
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }

  function saveSelected() {
    if (kanjiEntry) {
      saveWord({
        slug: `kanji-${query}`,
        word: query,
        reading: [...(kanjiEntry.on_readings || []), ...(kanjiEntry.kun_readings || [])].join(", "),
        meaning: kanjiEntry.meanings?.join(", ") || t("dictionary.noMeaning"),
      });
      return;
    }
    if (!selected) return;
    const japanese = getJapanese(selected);
    saveWord({
      ...selected,
      slug: selectedSlug,
      word: japanese.word || japanese.reading || query,
      reading: japanese.reading || "",
      meaning: getMeaning(selected, t("dictionary.noDefinition")),
    });
  }

  async function addSelectedToAnki() {
    const front = kanjiEntry ? query : selectedJapanese.word || selectedJapanese.reading || query;
    if (!front || (!kanjiEntry && !selected)) return;

    const meanings = kanjiEntry
      ? [
          `MEANING\n${kanjiEntry.meanings?.join(", ") || "—"}`,
          `ON'YOMI\n${kanjiEntry.on_readings?.join("、") || "—"}`,
          `KUN'YOMI\n${kanjiEntry.kun_readings?.join("、") || "—"}`,
          `STROKES: ${kanjiEntry.stroke_count ?? "—"} · GRADE: ${kanjiEntry.grade ?? "—"} · JLPT: ${kanjiEntry.jlpt ?? "—"}`,
          `WORDS USING THIS KANJI\n${(kanjiEntry.examples || []).slice(0, 12).map((word) =>
            `${word.japanese || ""}${word.readings?.length ? `（${word.readings.join("、")}）` : ""} — ${(word.meanings || []).join(", ")}`
          ).join("\n") || "No example words supplied."}`,
        ]
      : [
          `READING\n${[...new Set((selected.japanese || []).map((item) => item.reading).filter(Boolean))].join("、") || "—"}`,
          `MEANING\n${selected.senses?.map((sense) => sense.english_definitions?.join(", ")).filter(Boolean).join("; ") || "—"}`,
          `PART OF SPEECH\n${[...new Set((selected.senses || []).flatMap((sense) => sense.parts_of_speech || []))].join(", ") || "—"}`,
          `TAGS\n${selected.tags?.join(", ") || "—"}`,
        ];
    const back = [...meanings, ...(exampleSentence.trim() ? [`EXAMPLE SENTENCE\n${exampleSentence.trim()}`] : [])].join("\n\n");

    setIsAdding(true);
    setAnkiMessage("");
    setAnkiError(false);
    try {
      if (kanjiEntry) {
        saveWord({
          slug: `kanji-${query}`,
          word: query,
          reading: [...(kanjiEntry.on_readings || []), ...(kanjiEntry.kun_readings || [])].join(", "),
          meaning: kanjiEntry.meanings?.join(", ") || t("dictionary.noMeaning"),
          kanjiData: kanjiEntry,
          source: "kanji-explorer",
        });
        setAnkiMessage({ key: "dictionary.kanjiSavedSyncing" });
        const result = await saveKanjiToAnki({
          kanji: query,
          back,
          deckName: ankiSettings.deck,
          modelName: ankiSettings.model,
          frontField: ankiSettings.frontField,
          backField: ankiSettings.backField,
          tags: ankiSettings.tags || "",
        });
        saveWord({
          slug: `kanji-${query}`,
          word: query,
          reading: [...(kanjiEntry.on_readings || []), ...(kanjiEntry.kun_readings || [])].join(", "),
          meaning: kanjiEntry.meanings?.join(", ") || t("dictionary.noMeaning"),
          kanjiData: kanjiEntry,
          source: "kanji-explorer",
          ankiNoteId: result.noteId,
          ankiSyncedAt: new Date().toISOString(),
        });
        if (result.created) {
          recordAddedCard({
            front,
            source: query,
            noteId: result.noteId,
            addedAt: new Date().toISOString(),
          });
        }
        setAnkiConnection("connected");
        setAnkiMessage({ key: result.created ? "dictionary.kanjiAdded" : "dictionary.kanjiUpdated", options: { id: result.noteId } });
        return;
      }

      const noteId = await addAnkiNote({
        deckName: ankiSettings.deck,
        modelName: ankiSettings.model,
        frontField: ankiSettings.frontField,
        backField: ankiSettings.backField,
        front,
        back,
        tags: ankiSettings.tags || "",
      });
      recordAddedCard({
        front,
        source: query,
        noteId,
        addedAt: new Date().toISOString(),
      });
      setAnkiConnection("connected");
      setAnkiMessage({ key: "dictionary.added", options: { id: noteId } });
    } catch (requestError) {
      setAnkiError(true);
      setAnkiMessage(kanjiEntry
        ? { key: "dictionary.kanjiSyncFailed", options: { error: requestError.message || t("dictionary.addFailed") } }
        : { key: "dictionary.addFailed", detail: requestError.message });
    } finally {
      setIsAdding(false);
    }
  }

  const jishoUrl = selected
    ? `https://jisho.org/search/${encodeURIComponent(selectedJapanese.word || selectedJapanese.reading || query)}`
    : `https://jisho.org/search/${encodeURIComponent(query)}`;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("dictionary.eyebrow")}</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("dictionary.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-300">
            {t("dictionary.subtitle")}
          </p>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); search(); }} className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="dictionary-search" className="sr-only">{t("dictionary.searchLabel")}</label>
          <input
            id="dictionary-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("dictionary.placeholder")}
            className="min-w-0 flex-1 border border-gray-500 bg-[#202421] px-4 py-3 text-base text-white outline-none placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex min-h-12 items-center justify-center gap-2 bg-primary px-6 font-bold text-black transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
          >
            <Search size={18} />
            {isLoading ? t("dictionary.searching") : t("dictionary.search")}
          </button>
        </form>

        {searchHistory.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 inline-flex items-center gap-1 text-xs text-gray-400">
              <Clock3 size={14} /> {t("dictionary.recent")}
            </span>
            {searchHistory.slice(0, 6).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => search(item)}
                className="max-w-full border border-white/15 px-2.5 py-1 text-xs text-gray-200 transition-colors hover:border-primary hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && (
        <div role="alert" className="border border-red-400/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {messageText(error)}
          <a
            href={`https://jisho.org/search/${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
            className="ml-2 inline-flex items-center gap-1 font-bold underline underline-offset-2 hover:text-white"
          >
            {t("dictionary.openJisho")} <ArrowUpRight size={14} />
          </a>
        </div>
      )}

      {kanjiEntry && (
        <section className="border border-yellow-200/70 bg-ldark p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400">{t("dictionary.kanjiEntry")}</span>
              <h3 className="mt-2 font-serif text-6xl text-primary">{query}</h3>
              <p className="mt-2 text-sm text-gray-200">{kanjiEntry.meanings?.join(", ") || t("dictionary.noMeaning")}</p>
            </div>
            <button
              type="button"
              onClick={addSelectedToAnki}
              disabled={isAdding}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
            >
              {isAdding ? t("dictionary.savingSyncing") : savedWords.some((word) => word.slug === `kanji-${query}`) ? t("dictionary.kanjiSyncAction") : t("dictionary.kanjiSaveAction")}
            </button>
          </div>
          {ankiMessage && (
            <p role="status" className={`mt-4 border-t border-white/15 pt-3 text-sm leading-6 ${ankiError ? "text-amber-200" : "text-emerald-300"}`}>
              {messageText(ankiMessage)}
            </p>
          )}
          <div className="mt-5 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase text-gray-400">{t("dictionary.onYomi")}</p>
              <p className="mt-1 text-sm">{kanjiEntry.on_readings?.join("、") || "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-gray-400">{t("dictionary.kunYomi")}</p>
              <p className="mt-1 text-sm">{kanjiEntry.kun_readings?.join("、") || "—"}</p>
            </div>
            <p className="text-sm text-gray-300 sm:col-span-2">
              {t("dictionary.strokes")}: {kanjiEntry.stroke_count ?? "—"} · {t("dictionary.grade")}: {kanjiEntry.grade ?? "—"} · {t("dictionary.jlpt")}: {kanjiEntry.jlpt ?? "—"}
            </p>
            {kanjiEntry.examples?.length > 0 && (
              <div className="sm:col-span-2">
                <p className="mb-2 text-xs uppercase text-gray-400">{t("dictionary.wordsUsingKanji")}</p>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {kanjiEntry.examples.slice(0, 8).map((word) => (
                    <li key={`${word.japanese}-${word.readings?.[0]}`} className="border border-white/10 px-3 py-2 text-sm">
                      <span className="font-serif text-lg text-primary">{word.japanese}</span>
                      <span className="ml-2 text-gray-300">{word.readings?.join("、")}</span>
                      <p className="mt-1 text-gray-400">{word.meanings?.join(", ")}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0 border border-white/15 bg-[#202421]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="font-bold">{t("dictionary.searchResults")}</h3>
              <span className="text-xs text-gray-400">{t("dictionary.resultCount", { count: entries.length })}</span>
            </div>
            <ul className="divide-y divide-white/10">
              {entries.slice(0, 12).map((entry, index) => {
                const japanese = getJapanese(entry);
                const active = selected === entry;
                return (
                  <li key={entry.slug || `${japanese.word}-${japanese.reading}-${index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(entry);
                        setAnkiMessage("");
                      }}
                      aria-pressed={active}
                      className={`w-full px-4 py-4 text-left transition-colors hover:bg-white/5 ${active ? "border-l-2 border-primary bg-white/5" : "border-l-2 border-transparent"}`}
                    >
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-serif text-2xl text-primary">{japanese.word || japanese.reading || "—"}</span>
                        {japanese.reading && japanese.reading !== japanese.word && (
                          <span className="text-sm text-gray-300">{japanese.reading}</span>
                        )}
                      </span>
                      <span className="mt-2 block text-sm leading-5 text-gray-300">{getMeaning(entry, t("dictionary.noDefinition"))}</span>
                      {entry.senses?.[0]?.parts_of_speech?.length > 0 && (
                        <span className="mt-2 block text-xs text-gray-500">
                          {entry.senses[0].parts_of_speech.join(" · ")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {selected && (
            <section className="min-w-0 border border-yellow-200/70 bg-ldark p-4 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <span className="text-xs uppercase tracking-widest text-gray-400">{t("dictionary.entry")}</span>
                  <h3 className="mt-2 break-words font-serif text-4xl text-primary sm:text-5xl">
                    {selectedJapanese.word || selectedJapanese.reading || query}
                  </h3>
                  {selectedJapanese.reading && selectedJapanese.reading !== selectedJapanese.word && (
                    <p className="mt-2 text-lg text-gray-200">{selectedJapanese.reading}</p>
                  )}
                  {selectedJapanese.is_common && (
                    <span className="mt-3 inline-block border border-primary/50 px-2 py-1 text-xs text-primary">{t("dictionary.commonWord")}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={saveSelected}
                  disabled={isSaved}
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-primary px-3 py-2 text-sm text-primary transition-colors hover:bg-primary hover:text-black disabled:cursor-default disabled:border-white/20 disabled:text-gray-300 disabled:hover:bg-transparent disabled:hover:text-gray-300"
                >
                  {isSaved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                  {isSaved ? t("dictionary.saved") : t("dictionary.saveWord")}
                </button>
              </div>

              <div className="mt-6 border-t border-white/15 pt-5">
                <h4 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <BookOpen size={16} /> {t("dictionary.meanings")}
                </h4>
                <ol className="space-y-4">
                  {selected.senses?.map((sense, index) => (
                    <li key={`${sense.english_definitions?.[0] || "sense"}-${index}`} className="text-sm leading-6">
                      <span className="mr-2 text-gray-500">{index + 1}.</span>
                      {sense.parts_of_speech?.length > 0 && (
                        <span className="mr-2 text-xs italic text-gray-400">{sense.parts_of_speech.join(", ")}</span>
                      )}
                      <span>{sense.english_definitions?.join(", ") || t("dictionary.noDefinition")}</span>
                      {sense.tags?.length > 0 && (
                        <span className="ml-2 text-xs text-gray-500">({sense.tags.join(", ")})</span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {selected.tags?.length > 0 && (
                <p className="mt-5 text-xs text-gray-400">{t("dictionary.tags")}: {selected.tags.join(" · ")}</p>
              )}
              <label className="mt-5 block text-xs text-gray-400">
                {t("dictionary.exampleSentence")} <span className="text-gray-500">{t("dictionary.optionalAnki")}</span>
                <textarea
              rows={2}
              value={exampleSentence}
              onChange={(event) => setExampleSentence(event.target.value)}
              className="mt-2 w-full resize-y border border-white/20 bg-[#202421] px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder={t("dictionary.examplePlaceholder")}
                />
              </label>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
              type="button"
              onClick={addSelectedToAnki}
              disabled={isAdding}
              className="min-h-10 bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
                >
              {isAdding ? t("dictionary.addingToAnki") : t("dictionary.addToAnki")}
                </button>
                {ankiMessage && (
              <p role="status" className={`self-center text-sm ${ankiError ? "text-red-300" : "text-emerald-300"}`}>
                {messageText(ankiMessage)}
              </p>
                )}
              </div>
              <a
                href={jishoUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex min-h-10 items-center gap-2 border border-white/20 px-3 py-2 text-sm text-gray-200 transition-colors hover:border-primary hover:text-primary"
              >
                {t("dictionary.openFullEntry")} <ArrowUpRight size={16} />
              </a>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default Dictionary;