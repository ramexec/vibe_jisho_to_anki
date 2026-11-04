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
    <aside className="fixed left-0 top-0 z-30 flex h-14 w-full shrink-0 items-center gap-3 bg-[#292a26] px-3 font-mono text-white md:inset-y-0 md:right-auto md:h-screen md:w-45 md:flex-col md:items-stretch md:gap-0 md:p-5">
      <h2 className="shrink-0 text-sm font-bold sm:text-base md:mb-10 md:text-xl">
        Jisho_To_Anki
      </h2>

      <nav className="flex min-w-0 flex-1 gap-2 overflow-x-auto md:flex-col md:overflow-visible">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`shrink-0 rounded-sm px-3 py-1.5 text-left transition-colors md:py-1
              ${
                activePage === page.id
                  ? "bg-[#494a44] text-white"
                  : "text-gray-400 hover:bg-[#3b3c37] hover:text-yellow-200"
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