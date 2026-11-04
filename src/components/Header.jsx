import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <header className="h-[50px] px-9 flex items-center justify-between bg-header border-b border-yellow-200 ">

      <h1 className="text-xl font-semibold text-white">
        {t(`navigation.${activePage}`)}
      </h1>

      <div className="flex items-center gap-3">

        <span className="text-sm text-primary">
          Language:
        </span>

        <select
          value={i18n.resolvedLanguage || "en"}
          onChange={(e) => changeLanguage(e.target.value)}
          className="border border-yellow rounded-sm px-2 py-0.5 text text-sm bg-white outline-none focus:ring-2"
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