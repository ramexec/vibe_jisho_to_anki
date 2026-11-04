import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Sidebar() {
  const activePage = useAppStore((state) => state.activePage);
  const setActivePage = useAppStore((state) => state.setActivePage);

  const { t } = useTranslation();

  const pages = [
    { id: "dashboard", label: t("navigation.dashboard") },
    { id: "dictionary", label: t("navigation.dictionary") },
    { id: "vocabulary", label: t("navigation.vocabulary") },
    { id: "explorer", label: t("navigation.explorer") },
    { id: "settings", label: t("navigation.settings") },
  ];

  return (
    <aside className="w-full shrink-0 bg-[#292a26] p-3 font-mono text-white md:min-h-screen md:w-45 md:p-5">
      <h2 className="mb-3 text-base font-bold sm:text-xl md:mb-10">
        Jisho_To_Anki
      </h2>

      <nav className="flex gap-2 overflow-x-auto md:flex-col">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-left transition-colors md:py-1
              ${
                activePage === page.id
                  ? "bg-[#494a44] text-white"
                  : "text-gray-400 hover:bg-[#3b3c37] hover:text-white"
              }`}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;