import { useEffect, useState } from "react";
import { Check, CircleAlert, LoaderCircle, PlugZap, RefreshCw } from "lucide-react";
import {
  createJishoNoteType,
  getAnkiSetup,
  getModelFields,
} from "../api/anki";
import { useAppStore } from "../stores/appStore";

const fieldClass =
  "mt-1 min-h-11 w-full border border-white/20 bg-[#202421] px-3 py-2 text-sm text-white outline-none focus:border-primary";

function Settings() {
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

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  async function connectToAnki() {
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
      setMessage(`Connected to Anki · ${setup.decks.length} decks available.`);
    } catch (error) {
      setConnection("disconnected");
      setAnkiConnection("disconnected");
      setMessage(error.message || "Could not connect to AnkiConnect.");
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
      setMessage(error.message || "Could not load note type fields.");
    }
  }

  function saveSettings() {
    if (settings.frontField && settings.frontField === settings.backField) {
      setMessage("Front and back fields must be different.");
      return;
    }
    setAnkiSettings(settings);
    setMessage("Anki settings saved.");
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
      setMessage(created ? "JishoToAnki note type created and selected." : "JishoToAnki note type already exists.");
    } catch (error) {
      setMessage(error.message || "Could not create the JishoToAnki note type.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 font-mono text-white">
      <section className="border border-yellow-200 bg-ldark p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Preferences</p>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Anki settings</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              Choose where dictionary cards go and map the fields in your Anki note type.
            </p>
          </div>
          <button
            type="button"
            onClick={connectToAnki}
            disabled={isChecking}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-black disabled:opacity-60"
          >
            {isChecking ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {isChecking ? "Connecting..." : "Test connection"}
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
              {connection === "connected" ? "AnkiConnect is ready" : connection === "disconnected" ? "AnkiConnect is unavailable" : "Checking AnkiConnect"}
            </p>
            {message && <p className="mt-1 leading-5">{message}</p>}
            {connection === "disconnected" && (
              <p className="mt-1 leading-5">
                Open Anki, install/enable the AnkiConnect add-on, then retry. The local proxy expects AnkiConnect at 127.0.0.1:8765.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-gray-200">
            Anki deck
            <select
              value={settings.deck}
              onChange={(event) => updateSetting("deck", event.target.value)}
              disabled={!decks.length}
              className={fieldClass}
            >
              <option value="">Select a deck</option>
              {decks.map((deck) => <option key={deck} value={deck}>{deck}</option>)}
            </select>
          </label>

          <label className="text-sm text-gray-200">
            Note type
            <select
              value={settings.model}
              onChange={(event) => changeModel(event.target.value)}
              disabled={!models.length}
              className={fieldClass}
            >
              <option value="">Select a note type</option>
              {models.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </label>

          <label className="text-sm text-gray-200">
            Front field
            {fields.length ? (
              <select value={settings.frontField} onChange={(event) => updateSetting("frontField", event.target.value)} className={fieldClass}>
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            ) : (
              <input value={settings.frontField} onChange={(event) => updateSetting("frontField", event.target.value)} className={fieldClass} placeholder="Front" />
            )}
          </label>

          <label className="text-sm text-gray-200">
            Back field
            {fields.length ? (
              <select value={settings.backField} onChange={(event) => updateSetting("backField", event.target.value)} className={fieldClass}>
                {fields.map((field) => <option key={field} value={field}>{field}</option>)}
              </select>
            ) : (
              <input value={settings.backField} onChange={(event) => updateSetting("backField", event.target.value)} className={fieldClass} placeholder="Back" />
            )}
          </label>

          <label className="text-sm text-gray-200 sm:col-span-2">
            Tags <span className="text-gray-500">(space-separated)</span>
            <input
              value={settings.tags}
              onChange={(event) => updateSetting("tags", event.target.value)}
              className={fieldClass}
              placeholder="japanese jisho"
            />
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={saveSettings}
            className="min-h-11 bg-primary px-5 py-2 font-bold text-black hover:bg-yellow-300"
          >
            Save settings
          </button>
          <button
            type="button"
            onClick={makeNoteType}
            disabled={isCreating || connection !== "connected"}
            className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/25 px-5 py-2 text-sm text-gray-100 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlugZap size={16} />
            {isCreating ? "Creating note type..." : "Create JishoToAnki note type"}
          </button>
        </div>
      </section>

      <section className="border border-white/15 bg-[#202421] p-4 text-sm leading-6 text-gray-300 sm:p-5">
        <h3 className="font-bold text-white">Before you connect</h3>
        <p className="mt-2">
          Keep Anki open with AnkiConnect installed. The development server forwards requests to AnkiConnect at 127.0.0.1:8765.
        </p>
      </section>
      <section role="note" className="border border-amber-400/50 bg-amber-950/30 p-4 text-sm leading-6 text-amber-100 sm:p-5">
          <h3 className="font-bold">Connect the hosted app to Anki</h3>
          <p className="mt-2">
            GitHub Pages can connect directly to AnkiConnect on this computer. In Anki, open <strong>Tools → Add-ons → AnkiConnect → Config</strong> and add <code>https://ramexec.github.io</code> to the <code>webCorsOriginList</code> array. Save the config and restart Anki. Keep <code>webBindAddress</code> set to <code>127.0.0.1</code>; do not expose AnkiConnect to your network or the internet. Then return here, test the connection, and allow local-network access in your browser if prompted.
          </p>
          <p className="mt-2">
            Kanji lookup works directly on the hosted site. Jisho word search still needs the local development proxy and is unavailable on the static hosted site.
          </p>
      </section>
    </div>
  );
}

export default Settings;
