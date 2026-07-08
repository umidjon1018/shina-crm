import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getShops, createShop, updateShop as apiUpdateShop, deleteShop } from '../api/shopService'

export const useShopStore = create(
  persist(
    (set, get) => ({
      shops: [],
      selectedShopId: 'all',
      viewMode: 'tabs',

      setSelectedShop: (id) => set({ selectedShopId: id === 'all' ? 'all' : String(id) }),
      setViewMode: (mode) => set({ viewMode: mode }),

      loadShops: async () => {
        try {
          const shops = await getShops()
          set({ shops })
        } catch (e) {
          // token yo'q yoki server offline — seket qolsin
        }
      },

      addShop: async (shopData) => {
        const shop = await createShop(shopData)
        set((state) => ({ shops: [...state.shops, shop] }))
        return shop
      },

      updateShop: async (id, data) => {
        const updated = await apiUpdateShop(id, data)
        set((state) => ({
          shops: state.shops.map(s => s.id === id ? updated : s)
        }))
      },

      removeShop: async (id) => {
        await deleteShop(id)
        set((state) => ({
          shops: state.shops.filter(s => s.id !== id),
          selectedShopId: state.selectedShopId === id ? 'all' : state.selectedShopId,
        }))
      },

      getActiveShops: () => get().shops.filter(s => s.isActive),
    }),
    {
      name: 'goodtires-shop-store',
      partialize: (state) => ({ selectedShopId: state.selectedShopId, viewMode: state.viewMode, shops: state.shops }),
    }
  )
)
