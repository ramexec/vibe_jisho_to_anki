
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      activePage: "dashboard",
      searchQuery: "",
      savedWords: [],
      searchHistory: [],
      addedCards: [],
      ankiSettings: {
        deck: "",
        model: "JishoToAnki",
        frontField: "Front",
        backField: "Back",
        tags: "japanese jisho",
      },
      ankiConnection: "unknown",

      setActivePage: (page) => set({ activePage: page }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setAnkiSettings: (settings) => set({ ankiSettings: settings }),
      setAnkiConnection: (connection) => set({ ankiConnection: connection }),

      addToHistory: (word) =>
        set((state) => ({
          searchHistory: [
            word,
            ...state.searchHistory.filter((item) => item !== word),
          ].slice(0, 50),
        })),

      saveWord: (word) =>
        set((state) => {
          const slug = word.slug || `${word.word || "word"}-${Date.now()}`;
          const normalizedWord = { ...word, slug };
          const exists = state.savedWords.some((item) => item.slug === slug);
          return {
            savedWords: exists
              ? state.savedWords.map((item) =>
                  item.slug === slug ? { ...item, ...normalizedWord } : item
                )
              : [normalizedWord, ...state.savedWords],
          };
        }),

      updateWord: (slug, updates) =>
        set((state) => ({
          savedWords: state.savedWords.map((word) =>
            word.slug === slug ? { ...word, ...updates, slug } : word
          ),
        })),

      removeWord: (slug) =>
        set((state) => ({
          savedWords: state.savedWords.filter(
            (word) => word.slug !== slug
          ),
        })),

      recordAddedCard: (card) =>
        set((state) => ({
          addedCards: [card, ...state.addedCards].slice(0, 100),
        })),
    }),
    {
      name: "jishotoanki-storage",
    }
  )
);
