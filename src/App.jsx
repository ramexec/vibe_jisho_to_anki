import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Dictionary from "./pages/Dictionary";
import Vocabulary from "./pages/Vocabulary";
import Settings from "./pages/Settings";
import Explorer from "./pages/Explorer";

import { useAppStore } from "./stores/appStore";

function App() {

  const activePage = useAppStore((state) => state.activePage);
  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar />

      <main className="min-h-screen w-full min-w-0 flex-1 bg-[#101311] md:ml-45">
        <Header />

        <section className="min-h-screen px-4 pb-8 pt-32 sm:px-6 sm:pb-10 md:px-8 md:pt-20 lg:px-10">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "dictionary" && <Dictionary />}
          {activePage === "vocabulary" && <Vocabulary />}
          {activePage === "settings" && <Settings />}
          {activePage === "explorer" && <Explorer />}
          {!["dashboard", "dictionary", "vocabulary", "settings", "explorer"].includes(activePage) && (
            <div className="font-mono text-white">
              <h2 className="text-2xl font-semibold capitalize">
                {activePage}
              </h2>
              <p className="mt-2 text-gray-500">
                This page is under development.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;