import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Interfeys afzalliklari (shu qurilmada eslab qolinadi): chap menyu ixcham (faqat ikonkalar) yoki to'liq
export const useUiStore = create(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: !!v }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'goodtires-ui' }
  )
)
