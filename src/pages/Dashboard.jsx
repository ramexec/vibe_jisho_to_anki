import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";

function Dashboard() {
  const savedWords = useAppStore((state) => state.savedWords);

  const { t } = useTranslation();

  return (
    <div className="space-y-8 p-5 font-mono text-white bg-ldark">

      {/* Welcome section */}
      <div>
        <h2 className="text-xl font-bold">
          {t("dashboard.welcome")}
        </h2>

        <p className="mt-2 text-gray-500">
          {t("dashboard.subtitle")}
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-ldark rounded-l p-6 border border-yellow-200">
          <p className="text-sm ">
            {t("dashboard.savedWords")}
          </p>

          <h3 className="text-4xl font-bold mt-3 text-primary">
            {savedWords.length}
          </h3>

          <p className="text-sm mt-2">
            {t("dashboard.words")}
          </p>
        </div>

      </div>

      {/* Recent searches */}
      <div className=" rounded-xl p-6">

        <h3 className="text-lg font-semibold mb-3">
          {t("dashboard.searchHistory")}
        </h3>

        <p className="text-gray-400 text-sm">
          No recent searches yet.
        </p>
      </div>

    </div>
  );
}

export default Dashboard;