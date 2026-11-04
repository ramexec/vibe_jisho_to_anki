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
                explorer: "Explorer",
            },
            common: {
                welcome: "Welcome to JishoToAnki!",
            },
            dashboard: {
                welcome: "Welcome back!",
                subtitle: "Your Japanese learning overview.",
                savedWords: "Saved Words",
                studyGoal: "Daily Study Goal",
                searchHistory: "Recent Searches",
                words: "words",
                progress: "Progress",
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
                explorer: "エクスプローラー",
            },
            common: {
                welcome: "JishoToAnkiへようこそ！",
            },
            dashboard: {
                welcome: "おかえりなさい！",
                subtitle: "日本語学習の概要",
                savedWords: "保存した単語",
                studyGoal: "毎日の学習目標",
                searchHistory: "最近の検索",
                words: "単語",
                progress: "進捗",
            },
        },
    },

    bn: {
        translation: {
            app: {
                name: "jisho_to_anki_frnt",
            },
            navigation: {
                dashboard: "ড্যাশবোর্ড",
                dictionary: "অভিধান",
                kanji: "কাঞ্জি এক্সপ্লোরার",
                vocabulary: "শব্দভাণ্ডার",
                study: "পড়াশোনা",
                settings: "সেটিংস",
                explorer: "এক্সপ্লোরার",
            },
            common: {
                welcome: "JishoToAnki-তে স্বাগতম!",
            },
            dashboard: {
                welcome: "আবার স্বাগতম!",
                subtitle: "আপনার জাপানি শেখার অগ্রগতি।",
                savedWords: "সংরক্ষিত শব্দ",
                studyGoal: "দৈনিক পড়াশোনার লক্ষ্য",
                searchHistory: "সাম্প্রতিক অনুসন্ধান",
                words: "শব্দ",
                progress: "অগ্রগতি",
            },
        },
    },
};

const savedLanguage = localStorage.getItem("app-language") || "en";

i18n.use(initReactI18next)
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