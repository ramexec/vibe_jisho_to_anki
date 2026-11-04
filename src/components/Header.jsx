import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";

function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <header className="fixed left-0 top-14 z-20 flex h-14 w-full flex-nowrap items-center justify-between gap-2 border-b border-yellow-200 bg-header px-4 sm:px-6 md:left-45 md:top-0 md:w-[calc(100%-11.25rem)] md:px-9">

      <h1 className="min-w-0 truncate text-lg font-semibold text-white sm:text-xl">
        {t(`navigation.${activePage}`)}
      </h1>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <a
          href="https://buymeacoffee.com/ramexec"
          target="_blank"
          rel="noreferrer"
          aria-label={t("header.donate")}
          className="inline-flex min-h-9 items-center gap-1 border border-white/25 px-2 text-xs text-white transition-colors hover:border-primary hover:text-primary sm:gap-1.5 sm:px-2.5"
        >
          <Coffee size={14} />
          <span className="hidden sm:inline">{t("header.donate")}</span>
        </a>

        <span className="text-xs text-primary sm:text-sm">
          {t("header.language")}:
        </span>

        <select
          value={i18n.resolvedLanguage || "en"}
          onChange={(e) => changeLanguage(e.target.value)}
          className="rounded-sm border border-yellow bg-white px-2 py-1 text-sm outline-none focus:ring-2"
        >
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="bn">বাংলা</option>
          
        </select>

      </div>

    </header>
  );
}

export default Header;