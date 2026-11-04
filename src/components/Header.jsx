import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <header className="flex min-h-[50px] flex-wrap items-center justify-between gap-2 border-b border-yellow-200 bg-header px-4 py-2 sm:px-6 md:px-9">

      <h1 className="text-lg font-semibold text-white sm:text-xl">
        {t(`navigation.${activePage}`)}
      </h1>

      <div className="flex items-center gap-2 sm:gap-3">

        <span className="text-xs text-primary sm:text-sm">
          Language:
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