import { ArrowRight, BookOpen, Clock3, Layers3, Search, Settings2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../stores/appStore";

function getWord(word, fallback = "Untitled") {
  return word.word || word.japanese?.find((item) => item.word)?.word ||
    word.japanese?.[0]?.reading || word.slug || fallback;
}

function Dashboard() {
  const savedWords = useAppStore((state) => state.savedWords);
  const searchHistory = useAppStore((state) => state.searchHistory);
  const addedCards = useAppStore((state) => state.addedCards);
  const ankiConnection = useAppStore((state) => state.ankiConnection);
  const setActivePage = useAppStore((state) => state.setActivePage);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  const { t } = useTranslation();

  const stats = [
    { label: t("dashboard.savedWords"), value: savedWords.length, icon: BookOpen },
    { label: t("dashboard.ankiCards"), value: addedCards.length, icon: Layers3 },
    { label: t("dashboard.recentSearches"), value: searchHistory.length, icon: Search },
  ];

  function openSearch(query) {
    setSearchQuery(query);
    setActivePage("dictionary");
  }

  const connectionText = ankiConnection === "connected"
    ? t("dashboard.connected")
    : ankiConnection === "disconnected"
      ? t("dashboard.disconnected")
      : t("dashboard.unchecked");

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-5 sm:p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("dashboard.workspace")}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("dashboard.welcome")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">{t("dashboard.subtitle")}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setActivePage("dictionary")}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-4 py-2 font-bold text-black hover:bg-yellow-300"
          >
            <Search size={17} /> {t("dashboard.searchDictionary")}
          </button>
          <button
            type="button"
            onClick={() => setActivePage("explorer")}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-primary px-4 py-2 font-bold text-primary hover:bg-primary hover:text-black"
          >
            <Sparkles size={17} /> {t("dashboard.exploreKanji")}
          </button>
          <button
            type="button"
            onClick={() => setActivePage("settings")}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/25 px-4 py-2 text-sm hover:border-primary hover:text-primary"
          >
            <Settings2 size={17} /> {t("dashboard.ankiSettings")}
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <article key={label} className="border border-yellow-200/70 bg-ldark p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-200">{label}</p>
              <Icon size={18} className="text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold text-primary">{value}</p>
          </article>
        ))}
      </section>

      <section className="flex flex-col gap-3 border border-white/15 bg-[#202421] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${ankiConnection === "connected" ? "bg-emerald-400" : ankiConnection === "disconnected" ? "bg-red-400" : "bg-gray-500"}`} />
          <div>
            <h3 className="font-bold">{t("dashboard.ankiStatus")}</h3>
            <p className="mt-1 text-sm text-gray-300">{connectionText}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActivePage("settings")}
          className="inline-flex min-h-9 items-center gap-2 self-start text-sm text-primary hover:text-yellow-200 sm:self-auto"
        >
          {t("dashboard.configure")} <ArrowRight size={15} />
        </button>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 border border-white/15 bg-[#202421]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <h3 className="inline-flex items-center gap-2 font-bold"><Clock3 size={16} className="text-primary" /> {t("dashboard.searchHistory")}</h3>
            <button type="button" onClick={() => setActivePage("dictionary")} className="text-xs text-primary hover:text-yellow-200">{t("dashboard.dictionary")}</button>
          </div>
          {searchHistory.length ? (
            <ul className="divide-y divide-white/10">
              {searchHistory.slice(0, 6).map((query) => (
                <li key={query}>
                  <button
                    type="button"
                    onClick={() => openSearch(query)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm hover:bg-white/5"
                  >
                    <span className="truncate">{query}</span>
                    <ArrowRight size={15} className="shrink-0 text-gray-500" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-7 text-sm text-gray-400">{t("dashboard.recentLookupsEmpty")}</p>
          )}
        </section>

        <section className="min-w-0 border border-white/15 bg-[#202421]">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <h3 className="inline-flex items-center gap-2 font-bold"><BookOpen size={16} className="text-primary" /> {t("dashboard.recentlySaved")}</h3>
            <button type="button" onClick={() => setActivePage("vocabulary")} className="text-xs text-primary hover:text-yellow-200">{t("dashboard.allWords")}</button>
          </div>
          {savedWords.length ? (
            <ul className="divide-y divide-white/10">
              {savedWords.slice(0, 6).map((word) => (
                <li key={word.slug} className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-serif text-lg text-primary">{getWord(word, t("dashboard.untitled"))}</p>
                    <p className="truncate text-xs text-gray-400">{word.meaning || word.senses?.[0]?.english_definitions?.join(", ") || t("dashboard.savedVocabulary")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage("vocabulary")}
                    aria-label={t("dashboard.viewWord", { word: getWord(word, t("dashboard.untitled")) })}
                    className="shrink-0 text-gray-400 hover:text-primary"
                  >
                    <ArrowRight size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-7 text-sm text-gray-400">{t("dashboard.savedEmpty")}</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
