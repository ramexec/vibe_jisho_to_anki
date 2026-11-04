import { useEffect, useState } from "react";
import { Check, CircleAlert, LoaderCircle, PlugZap, RefreshCw } from "lucide-react";
import {
  createJishoNoteType,
  getAnkiSetup,
  getModelFields,
} from "../api/anki";
import { useAppStore } from "../stores/appStore";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const fieldClass =
  "mt-1 min-h-11 w-full border border-white/20 bg-[#202421] px-3 py-2 text-sm text-white outline-none focus:border-primary";

function Settings() {
  const { t } = useTranslation();
  const savedSettings = useAppStore((state) => state.ankiSettings);
  const setAnkiSettings = useAppStore((state) => state.setAnkiSettings);
  const setAnkiConnection = useAppStore((state) => state.setAnkiConnection);
  const [settings, setSettings] = useState(savedSettings);
  const [decks, setDecks] = useState([]);
  const [models, setModels] = useState([]);
  const [fields, setFields] = useState([]);
  const [connection, setConnection] = useState("checking");
  const [message, setMessage] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const messageText = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    return `${t(value.key, value.options)}${value.detail ? ` ${value.detail}` : ""}`;
  };

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function connectToAnki(notify = false) {
    setIsChecking(true);
    setConnection("checking");
    setMessage("");
    try {
      const setup = await getAnkiSetup();
      const deck = setup.decks.includes(settings.deck)
        ? settings.deck
        : setup.decks[0] || "";
      const model = setup.models.includes(settings.model)
        ? settings.model
        : setup.models.includes("JishoToAnki")
          ? "JishoToAnki"
          : setup.models.includes("Basic")
            ? "Basic"
            : setup.models[0] || "";
      const modelFields = await getModelFields(model);
      setDecks(setup.decks);
      setModels(setup.models);
      setFields(modelFields);
      setSettings((current) => ({
        ...current,
        deck,
        model,
        frontField: modelFields.includes(current.frontField)
          ? current.frontField
          : modelFields[0] || "",
        backField: modelFields.includes(current.backField) &&
          current.backField !== (modelFields[0] || "")
          ? current.backField
          : modelFields[1] || modelFields[0] || "",
      }));
      setConnection("connected");
      setAnkiConnection("connected");
      setMessage({ key: "settings.decksFound", options: { count: setup.decks.length } });
      if (notify) toast.success(t("settings.decksFound", { count: setup.decks.length }));
    } catch (error) {
      setConnection("disconnected");
      setAnkiConnection("disconnected");
      setMessage({ key: "settings.connectionError", detail: error.message });
      if (notify) toast.error(`${t("settings.connectionError")} ${error.message}`);
    } finally {
      setIsChecking(false);
    }
  }

  useEffect(() => {
    connectToAnki();
    // The initial connection check uses the settings restored from persistent storage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function changeModel(model) {
    updateSetting("model", model);
    try {
      const modelFields = await getModelFields(model);
      setFields(modelFields);
      setSettings((current) => ({
        ...current,
        model,
        frontField: modelFields.includes(current.frontField)
          ? current.frontField
          : modelFields[0] || "",
        backField: modelFields.includes(current.backField) &&
          current.backField !== (modelFields[0] || "")
          ? current.backField
          : modelFields[1] || modelFields[0] || "",
      }));
    } catch (error) {
      setMessage({ key: "settings.fieldsError", detail: error.message });
      toast.error(`${t("settings.fieldsError")} ${error.message}`);
    }
  }

  function saveSettings() {
    if (settings.frontField && settings.frontField === settings.backField) {
      toast.error(t("settings.fieldsDifferent"));
      return;
    }
    setAnkiSettings(settings);
    toast.success(t("settings.settingsSaved"));
  }

  async function makeNoteType() {
    setIsCreating(true);
    setMessage("");
    try {
      const created = await createJishoNoteType();
      const setup = await getAnkiSetup();
      const modelFields = await getModelFields("JishoToAnki");
      const nextSettings = {
        ...settings,
        deck: setup.decks.includes(settings.deck) ? settings.deck : setup.decks[0] || "",
        model: "JishoToAnki",
        frontField: modelFields[0] || "Front",
        backField: modelFields[1] || "Back",
      };
      setDecks(setup.decks);
      setModels(setup.models);
      setFields(modelFields);
      setSettings(nextSettings);
      setAnkiSettings(nextSettings);
      setConnection("connected");
      setAnkiConnection("connected");
      const resultMessage = t(created ? "settings.noteTypeCreated" : "settings.noteTypeExists");
      setMessage(resultMessage);
      toast.success(resultMessage);
    } catch (error) {
      setMessage({ key: "settings.createFailed", detail: error.message });
      toast.error(`${t("settings.createFailed")} ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">{t("settings.eyebrow")}</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{t("settings.title")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              {t("settings.subtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => connectToAnki(true)}
            disabled={isChecking}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-black disabled:opacity-60"
          >
            {isChecking ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isChecking ? t("settings.connecting") : t("settings.testConnection")}
          </button>
        </div>

        <div
          role="status"
          className={`mt-5 flex items-start gap-2 border px-3 py-3 text-sm ${
            connection === "connected"
              ? "border-emerald-500/50 bg-emerald-950/30 text-emerald-200"
              : connection === "disconnected"
                ? "border-red-400/50 bg-red-950/30 text-red-200"
                : "border-white/15 bg-black/20 text-gray-300"
          }`}
        >
          {connection === "connected" ? <Check size={18} className="mt-0.5 shrink-0" /> : <CircleAlert size={18} className="mt-0.5 shrink-0" />}
          <div>
            <p className="font-bold">
              {connection === "connected" ? t("settings.connected") : connection === "disconnected" ? t("settings.disconnected") : t("settings.checking")}
            </p>
            {message && <p className="mt-1 leading-5">{messageText(message)}</p>}
            {connection === "disconnected" && (
              <p className="mt-1 leading-5">
                {t("settings.setupHint")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-200">
            {t("settings.deck")}
            <select
              value={settings.deck}
              onChange={(event) => updateSetting("deck", event.target.value)}
              disabled={!decks.length}
              className={fieldClass}
            >
              <option value="">{t("settings.selectDeck")}</option>
              {decks.map((deck) => <option key={deck} value={deck}>{deck}</option>)}
            </select>
          </label>

          <label className="text-sm text-gray-200">
            {t("settings.noteType")}
            <select
              value={settings.model}
              onChange={(event) => changeModel(event.target.value)}
              disabled={!models.length}
              className={fieldClass}
            >
              <option value="">{t("settings.selectNoteType")}</option>
              {models.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </label>

          <label className="text-sm text-gray-200">
            {t("settings.frontField")}
            {fields.length ? (
              <select value={settings.frontField} onChange={(event) => updateSetting("frontField", event.target.value)} className={fieldClass}>
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            ) : (
              <input value={settings.frontField} onChange={(event) => updateSetting("frontField", event.target.value)} className={fieldClass} placeholder={t("settings.frontField")} />
            )}
          </label>

          <label className="text-sm text-gray-200">
            {t("settings.backField")}
            {fields.length ? (
              <select value={settings.backField} onChange={(event) => updateSetting("backField", event.target.value)} className={fieldClass}>
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            ) : (
              <input value={settings.backField} onChange={(event) => updateSetting("backField", event.target.value)} className={fieldClass} placeholder={t("settings.backField")} />
            )}
          </label>

          <label className="text-sm text-gray-200 sm:col-span-2">
            {t("settings.tags")} <span className="text-gray-500">{t("settings.spaceSeparated")}</span>
            <input
              value={settings.tags}
              onChange={(event) => updateSetting("tags", event.target.value)}
              className={fieldClass}
              placeholder={t("settings.tagsPlaceholder")}
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={saveSettings}
            className="min-h-11 bg-primary px-5 py-2 font-bold text-black hover:bg-yellow-300"
          >
            {t("settings.saveSettings")}
          </button>
          <button
            type="button"
            onClick={makeNoteType}
            disabled={isCreating || connection !== "connected"}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/25 px-5 py-2 text-sm text-gray-100 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlugZap size={16} />
            {isCreating ? t("settings.creatingNoteType") : t("settings.createNoteType")}
          </button>
        </div>
      </section>

      <section className="border border-white/15 bg-[#202421] p-4 text-sm leading-6 text-gray-300 sm:p-5">
        <h3 className="font-bold text-white">{t("settings.connectIntro")}</h3>
        <p className="mt-2">
          {t("settings.connectInstructions")}
        </p>
        <p className="mt-2">
          {t("settings.syncInfo")}
        </p>
      </section>
      <section role="note" className="border border-amber-400/50 bg-amber-950/30 p-4 text-sm leading-6 text-amber-100 sm:p-5">
          <h3 className="font-bold">{t("settings.hostedTitle")}</h3>
          <p className="mt-2">
            {t("settings.hostedInstructions")}
          </p>
          <p className="mt-2">
            {t("settings.hostedLookupInfo")}
          </p>
      </section>
    </div>
  );
}

export default Settings;
