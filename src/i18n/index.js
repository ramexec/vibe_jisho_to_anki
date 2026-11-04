import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      app: {
        name: "jisho_to_anki_frnt",
      },
      navigation: {
        dashboard: "Dashboard",
        dictionary: "Dictionary",
        kanji: "Kanji Explorer",
        vocabulary: "Vocabulary",
        study: "Study",
        settings: "Settings",
      },
      common: {
        welcome: "Welcome to JishoToAnki!",
      },
    },
  },

  ja: {
    translation: {
      app: {
        name: "jisho_to_anki_frnt",
      },
      navigation: {
        dashboard: "ダッシュボード",
        dictionary: "辞書",
        kanji: "漢字エクスプローラー",
        vocabulary: "単語帳",
        study: "学習",
        settings: "設定",
      },
      common: {
        welcome: "JishoToAnkiへようこそ！",
      },
    },
  },

  bn: {
    translation: {
      app: {
        name: "JishoToAnki",
      },
      navigation: {
        dashboard: "ড্যাশবোর্ড",
        dictionary: "অভিধান",
        kanji: "কাঞ্জি এক্সপ্লোরার",
        vocabulary: "শব্দভাণ্ডার",
        study: "পড়াশোনা",
        settings: "সেটিংস",
      },
      common: {
        welcome: "JishoToAnki-তে স্বাগতম!",
      },
    },
  },
};

const savedLanguage = localStorage.getItem("app-language") || "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: "en",
    supportedLngs: ["en", "ja", "bn"],
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (language) => {
  localStorage.setItem("app-language", language);
});

export default i18n;