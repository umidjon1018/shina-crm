import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// MOCK — replace with: server-side cart session
export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      isBundleSale: false,

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
      clearCart: () => set({ cartItems: [], isBundleSale: false }),
    }),
    {
      name: 'goodtires-cart', // localStorage key
    }
  )
)
