import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 3 themes: 'dark' | 'light' | 'brand'
export const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'dark',

      setTheme: (newTheme) => {
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme: newTheme });
      },

      initTheme: () => {
        const currentTheme = useThemeStore.getState().theme;
        document.documentElement.setAttribute('data-theme', currentTheme);
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }),
    {
      name: 'shina-theme-storage',
    }
  )
)
