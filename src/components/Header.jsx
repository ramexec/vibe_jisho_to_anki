import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Header() {
  const activePage = useAppStore((state) => state.activePage);
  const { t, i18n } = useTranslation();

  const changeLanguage = (language) => {
    i18n.changeLanguage(language);
  };

  return (
    <header className="h-[75px] px-8 flex items-center justify-between bg-white border-b border-gray-200">

      <h1 className="text-xl font-semibold text-[#292a26]">
        {t(`navigation.${activePage}`)}
      </h1>

      <div className="flex items-center gap-3">

        <span className="text-sm text-gray-500">
          Language:
        </span>

        <select
          value={i18n.resolvedLanguage || "en"}
          onChange={(e) => changeLanguage(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-[#292a26]"
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