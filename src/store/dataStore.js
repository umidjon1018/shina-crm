import { create } from 'zustand'

// Global data version — sahifalararo yangilanish uchun
// Barcha sahifalar shu raqamni kuzatib, o'z ma'lumotlarini yangilaydi
export const useDataStore = create((set) => ({
  version: 0,
  bump: () => set(state => ({ version: state.version + 1 })),
}))
