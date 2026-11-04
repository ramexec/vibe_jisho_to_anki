import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { saveKanjiToAnki, syncKanjiFromAnki } from "../api/anki";
import { listKanji, lookupKanji } from "../api/jisho";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

const jlptLevels = ["jlpt-5", "jlpt-4", "jlpt-3", "jlpt-2", "jlpt-1"];
const inputClass =
  "min-h-11 w-full border border-white/20 bg-[#202421] px-3 py-2 text-base text-white outline-none placeholder:text-gray-500 focus:border-primary";

function getKanjiReadings(entry) {
  return [
    ...(entry.on_readings || []).map((reading) => `${reading} (on)`),
    ...(entry.kun_readings || []).map((reading) => `${reading} (kun)`),
  ];
}

function getKanjiCardBack(entry) {
  return [
    `MEANING\n${entry.meanings?.join(", ") || "—"}`,
    `ON'YOMI\n${entry.on_readings?.join("、") || "—"}`,
    `KUN'YOMI\n${entry.kun_readings?.join("、") || "—"}`,
    `STROKES: ${entry.stroke_count ?? "—"} · GRADE: ${entry.grade ?? "—"} · JLPT: ${entry.jlpt ?? "—"}`,
    `WORDS USING THIS KANJI\n${(entry.examples || []).slice(0, 12).map((word) =>
      `${word.japanese || ""}${word.readings?.length ? `（${word.readings.join("、")}）` : ""} — ${(word.meanings || []).join(", ")}`
    ).join("\n") || "No example words supplied."}`,
  ].join("\n\n");
}

function Explorer() {
  const { t } = useTranslation();
  const savedWords = useAppStore((state) => state.savedWords);
  const saveWord = useAppStore((state) => state.saveWord);
  const ankiSettings = useAppStore((state) => state.ankiSettings);
  const recordAddedCard = useAppStore((state) => state.recordAddedCard);
  const setAnkiConnection = useAppStore((state) => state.setAnkiConnection);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("jlpt-5");
  const [kanjiList, setKanjiList] = useState([]);
  const [selectedKanji, setSelectedKanji] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [listError, setListError] = useState("");
  const [entryError, setEntryError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const listRequestId = useRef(0);
  const entryRequestId = useRef(0);
  const messageText = (message) => {
    if (!message) return "";
    if (typeof message === "string") return message;
    return `${t(message.key, message.options)}${message.detail ? ` ${message.detail}` : ""}`;
  };

  const selected = selectedKanji?.data;
  const selectedCharacter = selectedKanji?.character || "";
  const savedEntry = savedWords.find((word) => word.slug === `kanji-${selectedCharacter}`);

  useEffect(() => {
    const requestId = ++listRequestId.current;
    listKanji(level)
      .then((list) => {
        if (requestId === listRequestId.current) setKanjiList(list);
      })
      .catch((error) => {
        if (requestId === listRequestId.current) setListError({ key: "explorer.loadFailed", detail: error.message });
      })
      .finally(() => {
        if (requestId === listRequestId.current) setIsLoadingList(false);
      });
    return () => {
      if (requestId === listRequestId.current) listRequestId.current += 1;
    };
  }, [level, t]);

  async function selectKanji(character) {
    const normalized = character.trim();
    if (!normalized) {
      setEntryError({ key: "explorer.emptyQuery" });
      return;
    }
    if (Array.from(normalized).length !== 1 || !/\p{Script=Han}/u.test(normalized)) {
      setEntryError({ key: "explorer.invalidKanji" });
      return;
    }

    const requestId = ++entryRequestId.current;
    setIsLoadingEntry(true);
    setEntryError("");
    setSaveMessage("");
    setSyncMessage("");
    try {
      const data = await lookupKanji(normalized);
      if (requestId === entryRequestId.current) {
        setSelectedKanji({ character: normalized, data });
        setQuery(normalized);
      }
    } catch (error) {
      if (requestId === entryRequestId.current) {
        setEntryError({ key: "explorer.lookupFailed", detail: error.message });
        setSelectedKanji(null);
      }
    } finally {
      if (requestId === entryRequestId.current) setIsLoadingEntry(false);
    }
  }

  async function submitSearch(event) {
    event.preventDefault();
    await selectKanji(query);
  }

  function makeSavedKanji(character, entry, noteId) {
    return {
      slug: `kanji-${character}`,
      word: character,
      reading: getKanjiReadings(entry).join(", "),
      meaning: entry.meanings?.join(", ") || t("dictionary.noMeaning"),
      kanjiData: entry,
      source: "kanji-explorer",
      ...(noteId ? { ankiNoteId: noteId, ankiSyncedAt: new Date().toISOString() } : {}),
    };
  }

  async function saveAndSync() {
    if (!selected || !selectedCharacter) return;
    const localWord = makeSavedKanji(selectedCharacter, selected);
    saveWord(localWord);
    setIsSaving(true);
    setSaveMessage({ key: "explorer.saving" });
    setEntryError("");

    try {
      const result = await saveKanjiToAnki({
        kanji: selectedCharacter,
        back: getKanjiCardBack(selected),
        deckName: ankiSettings.deck,
        modelName: ankiSettings.model,
        frontField: ankiSettings.frontField,
        backField: ankiSettings.backField,
        tags: ankiSettings.tags,
      });
      saveWord(makeSavedKanji(selectedCharacter, selected, result.noteId));
      if (result.created) {
        recordAddedCard({
          front: selectedCharacter,
          source: "kanji-explorer",
          noteId: result.noteId,
          addedAt: new Date().toISOString(),
        });
      }
      setAnkiConnection("connected");
      setSaveMessage({ key: result.created ? "dictionary.kanjiAdded" : "dictionary.kanjiUpdated", options: { id: result.noteId } });
    } catch (error) {
      setSaveMessage({ key: "explorer.saveFailed" });
      setEntryError({ key: "dictionary.addFailed", detail: error.message });
    } finally {
      setIsSaving(false);
    }
  }

  async function syncFromAnki() {
    setIsSyncing(true);
    setSyncMessage("");
    setEntryError("");
    try {
      const kanji = await syncKanjiFromAnki({
        frontField: ankiSettings.frontField,
        backField: ankiSettings.backField,
      });
      kanji.forEach(saveWord);
      setAnkiConnection("connected");
      setSyncMessage(
        kanji.length
          ? { key: "explorer.syncSuccess", options: { count: kanji.length } }
          : { key: "explorer.noCards" },
      );
    } catch (error) {
      setAnkiConnection("disconnected");
      setEntryError({ key: "explorer.syncFailed", detail: error.message });
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("explorer.eyebrow")}</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("explorer.title")}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
          {t("explorer.subtitle")}
        </p>

        <form onSubmit={submitSearch} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="explorer-kanji-search" className="sr-only">{t("explorer.searchLabel")}</label>
          <input
            id="explorer-kanji-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={`${inputClass} sm:max-w-xs`}
            placeholder={t("explorer.placeholder")}
            maxLength={2}
          />
          <button type="submit" disabled={isLoadingEntry} className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 font-bold text-black hover:bg-yellow-300 disabled:opacity-60">
            {isLoadingEntry ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />}
            {t("explorer.explore")}
          </button>
          <button type="button" onClick={syncFromAnki} disabled={isSyncing} className="inline-flex min-h-11 items-center justify-center gap-2 border border-primary px-4 py-2 text-sm text-primary hover:bg-primary hover:text-black disabled:opacity-60">
            {isSyncing ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isSyncing ? t("explorer.syncing") : t("explorer.sync")}
          </button>
        </form>

        {syncMessage && (
          <p role="status" className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
            <Check size={16} /> {messageText(syncMessage)}
          </p>
        )}
      </section>

      {entryError && (
        <div role="alert" className="flex items-start gap-2 border border-red-400/60 bg-red-950/40 px-4 py-3 text-sm leading-6 text-red-200">
          <CircleAlert size={17} className="mt-1 shrink-0" />
          <span>{messageText(entryError)}</span>
        </div>
      )}

      {selected && (
        <section className="border border-yellow-200/70 bg-ldark p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4 sm:gap-6">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center border border-primary/40 bg-black/20 font-serif text-6xl text-primary sm:h-32 sm:w-32 sm:text-8xl">
                {selectedCharacter}
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-widest text-gray-400">{t("explorer.details")}</p>
                <h3 className="mt-2 break-words text-xl font-bold sm:text-2xl">{selected.meanings?.join(", ") || t("explorer.meaningsUnavailable")}</h3>
                <p className="mt-3 text-xs uppercase text-primary">{t("explorer.readings")}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {getKanjiReadings(selected).map((reading) => (
                    <span key={reading} className="border border-white/15 px-2 py-1 text-sm text-gray-200">{reading}</span>
                  ))}
                  {!getKanjiReadings(selected).length && <span className="text-sm text-gray-400">{t("explorer.noReadings")}</span>}
                </div>
                <p className="mt-3 text-sm text-gray-300">
                  {t("dictionary.strokes")}: {selected.stroke_count ?? "—"} · {t("dictionary.grade")}: {selected.grade ?? "—"} · {t("dictionary.jlpt")}: {selected.jlpt ?? "—"} · {t("explorer.frequency")}: {selected.freq_mainichi_shinbun ?? "—"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={saveAndSync}
              disabled={isSaving}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-60"
            >
              {isSaving ? <LoaderCircle size={17} className="animate-spin" /> : savedEntry?.ankiNoteId ? <RefreshCw size={17} /> : <Sparkles size={17} />}
              {isSaving ? t("explorer.saving") : savedEntry?.ankiNoteId ? t("explorer.updateAndSync") : t("explorer.saveAndAdd")}
            </button>
          </div>

          {saveMessage && (
            <p role="status" className={`mt-4 border-t border-white/15 pt-3 text-sm leading-6 ${entryError ? "text-amber-200" : "text-emerald-300"}`}>
              {messageText(saveMessage)}
            </p>
          )}

          <div className="mt-5 grid gap-5 border-t border-white/15 pt-5 md:grid-cols-2">
            <div>
              <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary"><BookOpen size={16} /> {t("explorer.commonWords")}</h4>
              {selected.examples?.length ? (
                <ul className="space-y-2">
                  {selected.examples.slice(0, 12).map((word) => (
                    <li key={`${word.japanese}-${word.readings?.[0]}`} className="border border-white/10 px-3 py-2">
                      <p>
                        <span className="font-serif text-xl text-primary">{word.japanese}</span>
                        <span className="ml-2 text-sm text-gray-300">{word.readings?.join("、")}</span>
                      </p>
                      <p className="mt-1 text-sm text-gray-400">{word.meanings?.join(", ")}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">{selected.examplesError || t("explorer.noExamples")}</p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">{t("explorer.components")}</h4>
                {selected.radical ? (
                  <p className="text-sm text-gray-200">
                    {t("explorer.radical")}: <span className="font-serif text-xl text-primary">{selected.radical}</span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">{t("explorer.noComponents")}</p>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-bold uppercase tracking-wider text-primary">{t("explorer.studyDetails")}</h4>
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-gray-400">{t("explorer.schoolGrade")}</dt><dd>{selected.grade ?? "—"}</dd>
                  <dt className="text-gray-400">{t("explorer.level")}</dt><dd>{selected.jlpt ?? "—"}</dd>
                  <dt className="text-gray-400">{t("explorer.strokeCount")}</dt><dd>{selected.stroke_count ?? "—"}</dd>
                  <dt className="text-gray-400">{t("explorer.newspaperFrequency")}</dt><dd>{selected.freq_mainichi_shinbun ?? "—"}</dd>
                  <dt className="text-gray-400">{t("explorer.heisigKeyword")}</dt><dd>{selected.heisig_en || "—"}</dd>
                </dl>
              </div>
              <a
                href={`https://jisho.org/search/${encodeURIComponent(selectedCharacter)}%20%23kanji`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 py-2 text-xs text-gray-200 hover:border-primary hover:text-primary"
              >
                {t("explorer.moreJisho")} <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </section>
      )}

      <section className="border border-white/15 bg-[#202421]">
        <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-bold">{t("explorer.browse")}</h3>
            <p className="mt-1 text-xs text-gray-400">{t("explorer.browseHint")}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            {t("explorer.level")}
            <select
              value={level}
              onChange={(event) => {
                setIsLoadingList(true);
                setListError("");
                setLevel(event.target.value);
              }}
              className="min-h-10 border border-white/20 bg-[#202421] px-3 text-white outline-none focus:border-primary"
            >
              {jlptLevels.map((item) => <option key={item} value={item}>{item.replace("jlpt-", "N")}</option>)}
            </select>
          </label>
        </div>

        {listError && <p role="alert" className="m-4 border border-red-400/50 bg-red-950/30 px-3 py-2 text-sm text-red-200">{messageText(listError)}</p>}
        {isLoadingList ? (
          <p className="flex items-center gap-2 p-6 text-sm text-gray-300"><LoaderCircle size={16} className="animate-spin" /> {t("explorer.loadingList")}</p>
        ) : kanjiList.length ? (
          <div className="grid grid-cols-5 gap-px bg-white/10 p-px sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
            {kanjiList.map((kanji) => (
              <button
                key={kanji}
                type="button"
                onClick={() => selectKanji(kanji)}
                aria-label={t("explorer.exploreCharacter", { kanji })}
                className={`flex aspect-square items-center justify-center bg-[#202421] font-serif text-2xl transition-colors hover:bg-[#343932] hover:text-primary ${selectedCharacter === kanji ? "text-primary ring-1 ring-inset ring-primary" : "text-gray-200"}`}
              >
                {kanji}
              </button>
            ))}
          </div>
        ) : (
          <p className="p-6 text-sm text-gray-400">{t("explorer.noKanji")}</p>
        )}
      </section>
    </div>
  );
}

export default Explorer;
