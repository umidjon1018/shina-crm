import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getBillingStatus } from '../api/billingService'

// Obuna holati: tarifga kirmagan bo'limlar (deniedNodes) hasPermission orqali hamma joyda yopiladi
export const useBillingStore = create(
  persist(
    (set) => ({
      status: null,
      load: async () => {
        try { set({ status: await getBillingStatus() }) } catch {}
      },
      clear: () => set({ status: null }),
    }),
    { name: 'sicrm-billing' }
  )
)
