import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, BookmarkCheck, BookmarkPlus, BookOpen, Clock3, LoaderCircle, Search } from "lucide-react";
import { addAnkiNote } from "../api/anki";
import { searchDictionary, searchKanjiEntry } from "../api/localDictionary";
import DictionaryAttribution from "../components/DictionaryAttribution";
import KanjiSummary from "../components/KanjiSummary";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function getWord(entry) {
  return entry.k[0] || entry.r[0] || "";
}

function getMeaning(entry) {
  return entry.s.flatMap((sense) => sense.g).join("; ");
}

function Dictionary() {
  const { t } = useTranslation();
  const searchQuery = useAppStore((state) => state.searchQuery);
  const searchHistory = useAppStore((state) => state.searchHistory);
  const addToHistory = useAppStore((state) => state.addToHistory);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const savedWords = useAppStore((state) => state.savedWords);
  const saveWord = useAppStore((state) => state.saveWord);
  const ankiSettings = useAppStore((state) => state.ankiSettings);
  const recordAddedCard = useAppStore((state) => state.recordAddedCard);
  const setAnkiConnection = useAppStore((state) => state.setAnkiConnection);
  const requestId = useRef(0);
  const [query, setQuery] = useState(searchQuery);
  const [entries, setEntries] = useState([]);
  const [kanjiEntry, setKanjiEntry] = useState(null);
  const [selected, setSelected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  const selectedWord = selected ? getWord(selected) : "";
  const selectedSlug = selected
    ? `jmdict-${selectedWord}-${selected.r[0] || ""}`
    : "";
  const isSaved = savedWords.some((word) => word.slug === selectedSlug);
  const jishoUrl = `https://jisho.org/search/${encodeURIComponent(query.trim())}`;
  const detailJishoUrl = `https://jisho.org/search/${encodeURIComponent(selectedWord || query.trim())}`;

  const selectedSenses = useMemo(() => selected?.s ?? [], [selected]);

  useEffect(() => {
    if (searchQuery.trim()) runSearch(searchQuery);
    // Load the last query when this page is entered, including from the dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(value) {
    const term = value.trim();
    if (!term) {
      toast.error(t("dictionary.emptyQuery"));
      return;
    }

    const currentRequestId = ++requestId.current;
    setQuery(term);
    setSearchQuery(term);
    addToHistory(term);
    setIsLoading(true);
    setError("");
    setEntries([]);
    setKanjiEntry(null);
    setSelected(null);

    try {
      if ([...term].length === 1 && /\p{Script=Han}/u.test(term)) {
        const kanji = await searchKanjiEntry(term);
        if (currentRequestId !== requestId.current) return;
        if (kanji) {
          setKanjiEntry(kanji);
          return;
        }
      }

      const results = await searchDictionary(term);
      if (currentRequestId !== requestId.current) return;
      setEntries(results);
      setSelected(results[0] ?? null);
      if (!results.length) setError(t("dictionary.noResults", { query: term }));
    } catch (requestError) {
      if (currentRequestId === requestId.current) setError(requestError.message);
    } finally {
      if (currentRequestId === requestId.current) setIsLoading(false);
    }
  }

  function saveSelected() {
    if (!selected) return;
    saveWord({
      slug: selectedSlug,
      word: selectedWord,
      reading: selected.r.join(", "),
      meaning: getMeaning(selected),
      source: "JMdict",
    });
    toast.success(t("dictionary.saved"));
  }

  async function addSelectedToAnki() {
    if (!selected) return;
    setIsAdding(true);
    const back = [
      `READINGS\n${selected.r.join(", ") || "—"}`,
      ...selectedSenses.map((sense, index) =>
        `${sense.p.length ? `${sense.p.join(", ")}\n` : ""}${index + 1}. ${sense.g.join(", ")}`,
      ),
    ].join("\n\n");

    try {
      const noteId = await addAnkiNote({
        deckName: ankiSettings.deck,
        modelName: ankiSettings.model,
        frontField: ankiSettings.frontField,
        backField: ankiSettings.backField,
        front: selectedWord,
        back,
        tags: ankiSettings.tags || "",
      });
      recordAddedCard({
        front: selectedWord,
        source: query,
        noteId,
        addedAt: new Date().toISOString(),
      });
      setAnkiConnection("connected");
      toast.success(t("dictionary.added", { id: noteId }));
    } catch (requestError) {
      toast.error(`${t("dictionary.addFailed")} ${requestError.message}`);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("dictionary.eyebrow")}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("dictionary.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-300">{t("dictionary.subtitle")}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
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
            {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}
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
                onClick={() => runSearch(item)}
                className="max-w-full border border-white/15 px-2.5 py-1 text-xs text-gray-200 transition-colors hover:border-primary hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </section>

      {error && <p role="status" className="border border-white/15 bg-[#202421] px-4 py-3 text-sm text-gray-200">{error}</p>}

      {kanjiEntry && <KanjiSummary entry={kanjiEntry} />}

      {entries.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="min-w-0 border border-white/15 bg-[#202421]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <h3 className="font-bold">{t("dictionary.searchResults")}</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{t("dictionary.resultCount", { count: entries.length })}</span>
                <a
                  href={jishoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:text-yellow-200"
                >
                  {t("dictionary.openJisho")} <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
            <ul className="divide-y divide-white/10">
              {entries.map((entry, index) => {
                const active = selected === entry;
                return (
                  <li key={`${entry.k.join("-")}-${entry.r[0]}-${index}`}>
                    <button
                      type="button"
                      onClick={() => setSelected(entry)}
                      aria-pressed={active}
                      className={`w-full px-4 py-4 text-left transition-colors hover:bg-white/5 ${active ? "border-l-2 border-primary bg-white/5" : "border-l-2 border-transparent"}`}
                    >
                      <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="font-serif text-2xl text-primary">{getWord(entry)}</span>
                        {entry.r[0] && entry.r[0] !== getWord(entry) && (
                          <span className="text-sm text-gray-300">{entry.r[0]}</span>
                        )}
                      </span>
                      <span className="mt-2 block text-sm leading-5 text-gray-300">
                        {entry.s.slice(0, 2).map((sense) => sense.g.join(", ")).join("; ")}
                      </span>
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
                  <h3 className="mt-2 break-words font-serif text-4xl text-primary sm:text-5xl">{selectedWord}</h3>
                  {selected.r.length > 0 && (
                    <p className="mt-2 text-lg text-gray-200">{selected.r.join(" · ")}</p>
                  )}
                </div>
                <a
                  href={detailJishoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-black"
                >
                  {t("dictionary.openJisho")} <ArrowUpRight size={15} />
                </a>
              </div>

              <div className="mt-6 border-t border-white/15 pt-5">
                <h4 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
                  <BookOpen size={16} /> {t("dictionary.meanings")}
                </h4>
                <ol className="space-y-4">
                  {selectedSenses.map((sense, index) => (
                    <li key={`${sense.g[0]}-${index}`} className="text-sm leading-6">
                      <span className="mr-2 text-gray-500">{index + 1}.</span>
                      {sense.p.length > 0 && (
                        <span className="mr-2 text-xs italic text-gray-400">{sense.p.join(", ")}</span>
                      )}
                      <span>{sense.g.join(", ")}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 flex flex-col gap-2 border-t border-white/15 pt-5 sm:flex-row">
                <button
                  type="button"
                  onClick={saveSelected}
                  disabled={isSaved}
                  className="inline-flex min-h-10 items-center justify-center gap-2 border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-black disabled:border-white/20 disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  {isSaved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
                  {isSaved ? t("dictionary.saved") : t("dictionary.saveWord")}
                </button>
                <button
                  type="button"
                  onClick={addSelectedToAnki}
                  disabled={isAdding}
                  className="inline-flex min-h-10 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
                >
                  {isAdding && <LoaderCircle size={16} className="animate-spin" />}
                  {isAdding ? t("dictionary.addingToAnki") : t("dictionary.addToAnki")}
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <DictionaryAttribution />
    </div>
  );
}

export default Dictionary;
