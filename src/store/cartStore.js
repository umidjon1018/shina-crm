import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// MOCK — replace with: server-side cart session
export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      isBundleSale: false,
      // Miqdorli (kg, litr) tovar qatorlari: { productId, name, unit, qty, unitPrice, available, minSalePrice, installmentBasePrice }
      bulkLines: [],

      setBulkLine: (line) => set(state => ({
        bulkLines: state.bulkLines.some(l => l.productId === line.productId)
          ? state.bulkLines.map(l => l.productId === line.productId ? { ...l, ...line } : l)
          : [...state.bulkLines, line],
      })),
      removeBulkLine: (productId) => set(state => ({ bulkLines: state.bulkLines.filter(l => l.productId !== productId) })),

      addToCart: ({ item, product, warning = null, bundleId = null, bundleName = null }) => {
        const exists = get().cartItems.some(c => c.item.id === item.id)
        if (exists) return false
        set(state => ({
          cartItems: [...state.cartItems, {
            item,
            product,
            warning,
            salePrice: null,
            bundleId,
            bundleName,
          }]
        }))
        return true
      },

      updateSalePrice: (itemId, price) => {
        set(state => ({
          cartItems: state.cartItems.map(c =>
            c.item.id === itemId ? { ...c, salePrice: price } : c
          )
        }))
      },

      removeFromCart: (itemId) => {
        set(state => ({ cartItems: state.cartItems.filter(c => c.item.id !== itemId) }))
      },

      setIsBundleSale: (v) => set({ isBundleSale: v }),
      clearCart: () => set({ cartItems: [], isBundleSale: false, bulkLines: [] }),
    }),
    {
      name: 'goodtires-cart', // localStorage key
    }
  )
)
