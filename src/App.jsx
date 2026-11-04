import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Dictionary from "./pages/Dictionary";
import Vocabulary from "./pages/Vocabulary";
import Settings from "./pages/Settings";

import { useAppStore } from "./stores/appStore";

function App() {

  const activePage = useAppStore((state) => state.activePage);
  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      
      <Sidebar />

      <main className="flex-1 min-w-0">
        <Header />

        <section className="p-3 sm:p-5">
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "dictionary" && <Dictionary />}
          {activePage === "vocabulary" && <Vocabulary />}
          {activePage === "settings" && <Settings />}
          {!["dashboard", "dictionary", "vocabulary", "settings"].includes(activePage) && (
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