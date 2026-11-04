import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Sidebar() {
  const activePage = useAppStore((state) => state.activePage);
  const setActivePage = useAppStore((state) => state.setActivePage);

  const { t } = useTranslation();

  const pages = [
    { id: "dashboard", label: t("navigation.dashboard") },
    { id: "dictionary", label: t("navigation.dictionary") },
    { id: "explorer", label: t("navigation.explorer") },
    { id: "settings", label: t("navigation.settings") },
  ];

  return (
    <aside className="w-45 min-h-screen bg-[#292a26] text-white p-5 font-mono">
      <h2 className="text-xl font-bold  mb-10">
        Jisho_To_Anki
      </h2>

      <nav className="flex flex-col gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => setActivePage(page.id)}
            className={`text-left px-3  rounded-sm transition-colors
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