
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAppStore = create(
  persist(
    (set) => ({
      activePage: "dashboard",
      searchQuery: "",
      savedWords: [],
      searchHistory: [],

      setActivePage: (page) => set({ activePage: page }),
      setSearchQuery: (query) => set({ searchQuery: query }),

      addToHistory: (word) =>
        set((state) => ({
          searchHistory: [
            word,
            ...state.searchHistory.filter((item) => item !== word),
          ].slice(0, 50),
        })),

      saveWord: (word) =>
        set((state) => ({
          savedWords: state.savedWords.some(
            (item) => item.slug === word.slug
          )
            ? state.savedWords
            : [word, ...state.savedWords],
        })),

      removeWord: (slug) =>
        set((state) => ({
          savedWords: state.savedWords.filter(
            (word) => word.slug !== slug
          ),
        })),
    }),
    {
      name: "jishotoanki-storage",
    }
  )
);
