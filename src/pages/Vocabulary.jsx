import { useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const emptyForm = { word: "", reading: "", meaning: "" };
const inputClass =
  "mt-1 min-h-11 w-full border border-white/20 bg-[#202421] px-3 py-2 text-sm text-white outline-none placeholder:text-gray-500 focus:border-primary";

function getWord(word, fallback = "Untitled") {
  return word.word || word.japanese?.find((item) => item.word)?.word ||
    word.japanese?.[0]?.reading || word.slug || fallback;
}

function getReading(word) {
  return word.reading || word.japanese?.find((item) => item.reading)?.reading || "";
}

function getMeaning(word, fallback = "No definition saved.") {
  return word.meaning || word.senses
    ?.map((sense) => sense.english_definitions?.join(", "))
    .filter(Boolean)
    .join("; ") || fallback;
}

function Vocabulary() {
  const { t } = useTranslation();
  const savedWords = useAppStore((state) => state.savedWords);
  const saveWord = useAppStore((state) => state.saveWord);
  const updateWord = useAppStore((state) => state.updateWord);
  const removeWord = useAppStore((state) => state.removeWord);
  const [filter, setFilter] = useState("");
  const [editingSlug, setEditingSlug] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const filteredWords = useMemo(() => {
    const term = filter.trim().toLocaleLowerCase();
    if (!term) return savedWords;
    return savedWords.filter((word) =>
      `${getWord(word)} ${getReading(word)} ${getMeaning(word)}`
        .toLocaleLowerCase()
        .includes(term),
    );
  }, [filter, savedWords]);

  function editWord(word) {
    setEditingSlug(word.slug);
    setForm({
      word: getWord(word, t("vocabulary.untitled")),
      reading: getReading(word),
      meaning: getMeaning(word, t("vocabulary.noMeaning")) === t("vocabulary.noMeaning") ? "" : getMeaning(word, t("vocabulary.noMeaning")),
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingSlug("");
    setForm(emptyForm);
    setFormError("");
  }

  function submitWord(event) {
    event.preventDefault();
    const word = form.word.trim();
    const meaning = form.meaning.trim();
    if (!word || !meaning) {
      setFormError({ key: "vocabulary.validation" });
      return;
    }

    const wasEditing = Boolean(editingSlug);
    const updates = {
      word,
      reading: form.reading.trim(),
      meaning,
    };
    if (editingSlug) {
      updateWord(editingSlug, updates);
    } else {
      saveWord({ ...updates, slug: `manual-${Date.now()}`, source: "manual" });
    }
    cancelEdit();
    toast.success(t(wasEditing ? "vocabulary.updatedSuccess" : "vocabulary.addedSuccess"));
  }

  function deleteWord(slug) {
    toast(t("vocabulary.confirmDelete"), {
      duration: 10000,
      action: {
        label: t("vocabulary.delete"),
        onClick: () => {
          removeWord(slug);
          if (editingSlug === slug) cancelEdit();
          toast.success(t("vocabulary.deletedSuccess"));
        },
      },
      cancel: {
        label: t("vocabulary.cancel"),
        onClick: () => {},
      },
    });
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("vocabulary.eyebrow")}</p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t("vocabulary.title")}</h2>
            <p className="mt-2 text-sm text-gray-300">
              {t("vocabulary.count", { count: savedWords.length })}
            </p>
          </div>
          <label className="relative block w-full sm:max-w-xs">
            <span className="sr-only">{t("vocabulary.filterLabel")}</span>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="min-h-11 w-full border border-white/20 bg-[#202421] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-primary"
              placeholder={t("vocabulary.filterPlaceholder")}
            />
          </label>
        </div>
      </section>

      <section className="border border-white/15 bg-[#202421] p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          {editingSlug ? <Pencil size={17} className="text-primary" /> : <Plus size={18} className="text-primary" />}
          <h3 className="font-bold">{editingSlug ? t("vocabulary.editWord") : t("vocabulary.addWord")}</h3>
        </div>
        <form onSubmit={submitWord} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-gray-300">
            {t("vocabulary.japaneseWord")} <span className="text-primary">*</span>
            <input
              required
              value={form.word}
              onChange={(event) => setForm((current) => ({ ...current, word: event.target.value }))}
              className={inputClass}
              placeholder="猫"
            />
          </label>
          <label className="text-sm text-gray-300">
            {t("vocabulary.reading")}
            <input
              value={form.reading}
              onChange={(event) => setForm((current) => ({ ...current, reading: event.target.value }))}
              className={inputClass}
              placeholder="ねこ"
            />
          </label>
          <label className="text-sm text-gray-300 sm:col-span-2">
            {t("vocabulary.meaning")} <span className="text-primary">*</span>
            <textarea
              required
              rows={3}
              value={form.meaning}
              onChange={(event) => setForm((current) => ({ ...current, meaning: event.target.value }))}
              className={`${inputClass} resize-y`}
              placeholder={t("vocabulary.catPlaceholder")}
            />
          </label>
          {formError && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{t(formError.key)}</p>}
          <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row">
            <button type="submit" className="min-h-11 inline-flex items-center justify-center gap-2 bg-primary px-5 py-2 font-bold text-black hover:bg-yellow-300">
              {editingSlug ? <Pencil size={16} /> : <Plus size={17} />}
              {editingSlug ? t("vocabulary.saveChanges") : t("vocabulary.addToVocabulary")}
            </button>
            {editingSlug && (
              <button type="button" onClick={cancelEdit} className="min-h-11 inline-flex items-center justify-center gap-2 border border-white/20 px-4 py-2 text-sm hover:border-white/50">
                <X size={16} /> {t("vocabulary.cancel")}
              </button>
            )}
          </div>
        </form>
      </section>

      {filteredWords.length ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filteredWords.map((word) => (
            <article key={word.slug} className="flex min-w-0 flex-col border border-white/15 bg-[#202421] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words font-serif text-2xl text-primary">{getWord(word, t("vocabulary.untitled"))}</h3>
                  {getReading(word) && <p className="mt-1 text-sm text-gray-300">{getReading(word)}</p>}
                </div>
                <BookOpen size={17} className="mt-1 shrink-0 text-gray-500" />
              </div>
              <p className="mt-3 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-200">{getMeaning(word, t("vocabulary.noMeaning"))}</p>
              <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                <button
                  type="button"
                  onClick={() => editWord(word)}
                  aria-label={t("vocabulary.editLabel", { word: getWord(word, t("vocabulary.untitled")) })}
                  className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs hover:border-primary hover:text-primary"
                >
                  <Pencil size={14} /> {t("vocabulary.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => deleteWord(word.slug)}
                  aria-label={t("vocabulary.deleteLabel", { word: getWord(word, t("vocabulary.untitled")) })}
                  className="inline-flex min-h-9 items-center gap-2 border border-white/20 px-3 text-xs text-gray-300 hover:border-red-400 hover:text-red-300"
                >
                  <Trash2 size={14} /> {t("vocabulary.delete")}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="border border-dashed border-white/20 px-5 py-12 text-center">
          <BookOpen size={28} className="mx-auto text-gray-500" />
          <h3 className="mt-3 font-bold">{filter ? t("vocabulary.noMatches") : t("vocabulary.empty")}</h3>
          <p className="mt-2 text-sm text-gray-400">
            {filter ? t("vocabulary.tryAnother") : t("vocabulary.emptyHint")}
          </p>
        </section>
      )}
    </div>
  );
}

export default Vocabulary;
