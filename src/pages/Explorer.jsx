import { useState } from "react";
import { BookOpen, LoaderCircle, RefreshCw, Search } from "lucide-react";
import { syncKanjiFromAnki } from "../api/anki";
import { searchKanjiEntry } from "../api/localDictionary";
import DictionaryAttribution from "../components/DictionaryAttribution";
import KanjiSummary from "../components/KanjiSummary";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

function Explorer() {
  const { t } = useTranslation();
  const savedWords = useAppStore((state) => state.savedWords);
  const saveWord = useAppStore((state) => state.saveWord);
  const ankiSettings = useAppStore((state) => state.ankiSettings);
  const setAnkiConnection = useAppStore((state) => state.setAnkiConnection);
  const [query, setQuery] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [kanjiEntry, setKanjiEntry] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState("");
  const savedKanji = savedWords.filter((word) => word.slug?.startsWith("kanji-"));

  async function searchKanjiWords(event) {
    event.preventDefault();
    const character = query.trim();
    if (!character) {
      toast.error(t("explorer.emptyQuery"));
      return;
    }
    if ([...character].length !== 1 || !/\p{Script=Han}/u.test(character)) {
      toast.error(t("explorer.invalidKanji"));
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchError("");
    setKanjiEntry(null);
    try {
      setKanjiEntry(await searchKanjiEntry(character, 8));
    } catch (error) {
      setSearchError(error.message);
    } finally {
      setIsSearching(false);
    }
  }

  async function syncFromAnki() {
    setIsSyncing(true);
    try {
      const kanji = await syncKanjiFromAnki({
        frontField: ankiSettings.frontField,
        backField: ankiSettings.backField,
      });
      kanji.forEach(saveWord);
      setAnkiConnection("connected");
      toast.success(
        kanji.length
          ? t("explorer.syncSuccess", { count: kanji.length })
          : t("explorer.noCards"),
      );
    } catch (error) {
      setAnkiConnection("disconnected");
      toast.error(`${t("explorer.syncFailed")} ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("explorer.eyebrow")}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("explorer.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-300">{t("explorer.subtitle")}</p>

        <form onSubmit={searchKanjiWords} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="explorer-kanji-search" className="sr-only">{t("explorer.searchLabel")}</label>
          <input
            id="explorer-kanji-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-h-11 w-full border border-white/20 bg-[#202421] px-3 py-2 text-base text-white outline-none placeholder:text-gray-500 focus:border-primary sm:max-w-xs"
            placeholder={t("explorer.placeholder")}
            maxLength={2}
          />
          <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 font-bold text-black hover:bg-yellow-300">
            <Search size={17} />
            {isSearching ? t("dictionary.searching") : t("explorer.findWords")}
          </button>
          <button
            type="button"
            onClick={syncFromAnki}
            disabled={isSyncing}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-primary px-4 py-2 text-sm text-primary hover:bg-primary hover:text-black disabled:opacity-60"
          >
            {isSyncing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isSyncing ? t("explorer.syncing") : t("explorer.sync")}
          </button>
        </form>
      </section>

      {searchError && <p role="alert" className="border border-red-400/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">{searchError}</p>}

      {hasSearched && (isSearching ? (
        <section className="flex items-center gap-2 border border-white/15 bg-[#202421] p-6 text-sm text-gray-300">
          <LoaderCircle size={16} className="animate-spin" /> {t("dictionary.searching")}
        </section>
      ) : kanjiEntry ? (
        <KanjiSummary entry={kanjiEntry} />
      ) : (
        <section className="border border-white/15 bg-[#202421] px-4 py-6 text-sm text-gray-400">
          {t("explorer.noWordsWithKanji", { kanji: query.trim() })}
        </section>
      ))}

      <section className="border border-white/15 bg-[#202421]">
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="inline-flex items-center gap-2 font-bold">
            <BookOpen size={16} className="text-primary" />
            {t("explorer.savedKanji")}
          </h3>
        </div>
        {savedKanji.length ? (
          <ul className="divide-y divide-white/10">
            {savedKanji.map((word) => (
              <li key={word.slug} className="flex items-start gap-3 px-4 py-3">
                <span className="font-serif text-2xl text-primary">{word.word}</span>
                <div className="min-w-0">
                  {word.reading && <p className="text-sm text-gray-300">{word.reading}</p>}
                  {word.meaning && <p className="mt-1 text-sm text-gray-400">{word.meaning}</p>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-gray-400">{t("explorer.noSavedKanji")}</p>
        )}
      </section>
      <DictionaryAttribution />
    </div>
  );
}

export default Explorer;
