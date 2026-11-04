import { ArrowUpRight, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

function KanjiSummary({ entry }) {
  const { t } = useTranslation();

  return (
    <section className="min-w-0 border border-yellow-200/70 bg-ldark p-4 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-gray-400">{t("dictionary.kanjiEntry")}</span>
          <h3 className="mt-2 font-serif text-5xl leading-none text-primary sm:text-6xl">{entry.character}</h3>
        </div>
        <a
          href={`https://jisho.org/search/${encodeURIComponent(`${entry.character} #kanji`)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-10 shrink-0 items-center gap-2 border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-black"
        >
          {t("dictionary.openJisho")} <ArrowUpRight size={15} />
        </a>
      </div>

      <div className="mt-5 space-y-4 border-t border-white/15 pt-5">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">{t("dictionary.meanings")}</h4>
          <p className="mt-1 text-sm leading-6 text-gray-200">
            {entry.meanings.length ? entry.meanings.join(", ") : t("dictionary.noMeaning")}
          </p>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="border border-white/10 bg-[#202421]/70 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{t("dictionary.onYomi")}</dt>
            <dd className="mt-1 text-base text-gray-100">{entry.on.join(" · ") || t("explorer.noReadings")}</dd>
          </div>
          <div className="border border-white/10 bg-[#202421]/70 p-3">
            <dt className="text-xs font-bold uppercase tracking-wider text-gray-400">{t("dictionary.kunYomi")}</dt>
            <dd className="mt-1 text-base text-gray-100">{entry.kun.join(" · ") || t("explorer.noReadings")}</dd>
          </div>
        </dl>

        <div>
          <h4 className="mb-2 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary">
            <BookOpen size={16} /> {t("dictionary.wordsUsingKanji")}
          </h4>
          {entry.examples.length ? (
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {entry.examples.map((word, index) => {
                const written = word.exampleWord || word.k[0] || word.r[0];
                const meanings = word.s.slice(0, 2).flatMap((sense) => sense.g).join("; ");
                return (
                  <li key={`${written}-${word.r[0]}-${index}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                    <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-serif text-xl text-primary">{written}</span>
                      {word.r[0] && <span className="text-sm text-gray-300">{word.r[0]}</span>}
                      <span className="text-sm leading-5 text-gray-300">{meanings}</span>
                    </div>
                    <a
                      href={`https://jisho.org/search/${encodeURIComponent(written)}`}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t("dictionary.openWordOnJisho", { word: written })}
                      className="inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:text-yellow-200"
                    >
                      {t("explorer.openJisho")} <ArrowUpRight size={13} />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">{t("dictionary.noExamples")}</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default KanjiSummary;
