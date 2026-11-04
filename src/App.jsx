import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useAppStore } from "./stores/appStore";

function App() {
  const activePage = useAppStore((state) => state.activePage);

  return (
    <div className="flex min-h-screen bg-[#f5f4f0]">

      <Sidebar />

      <main className="flex-1 min-w-0">

        <Header />

        <section className="p-8">
          <h2 className="text-2xl font-semibold capitalize text-[#292a26]">
            {activePage}
          </h2>

          <p className="mt-2 text-gray-500">
            Welcome to JishoToAnki!
          </p>
        </section>

      </main>

    </div>
  );
}

export default App;