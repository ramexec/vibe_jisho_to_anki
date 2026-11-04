import { useTranslation } from "react-i18next";

function DictionaryAttribution() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/10 pt-4 text-xs leading-5 text-gray-400">
      {t("dictionary.jmdictAttribution")}{" "}
      <a
        href="https://www.edrdg.org/jmdict/j_jmdict.html"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        JMdict
      </a>
      {" · "}
      <a
        href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        KANJIDIC2
      </a>
      {" · "}
      <a
        href="https://creativecommons.org/licenses/by-sa/4.0/"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-primary"
      >
        CC BY-SA 4.0
      </a>
    </footer>
  );
}

export default DictionaryAttribution;
