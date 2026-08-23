import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSaleFormStore = create(
  persist(
    (set) => ({
      selectedCustomer: null,
      discountPercent: 0,
      loyaltyDiscountApplied: false,
      paymentType: 'cash',
      cardType: null,
      source: 'walk_in',
      installmentOrgId: '',
      installmentTermMonths: 3,
      contractNumber: '',
      tradeInItems: [],

      setSelectedCustomer: (v) => set({ selectedCustomer: v }),
      setDiscountPercent: (v) => set({ discountPercent: v }),
      setLoyaltyDiscountApplied: (v) => set({ loyaltyDiscountApplied: v }),
      setPaymentType: (v) => set({ paymentType: v, cardType: null }),
      setCardType: (v) => set({ cardType: v }),
      setSource: (v) => set({ source: v }),
      setInstallmentOrgId: (v) => set({ installmentOrgId: v }),
      setInstallmentTermMonths: (v) => set({ installmentTermMonths: v }),
      setContractNumber: (v) => set({ contractNumber: v }),
      setTradeInItems: (updater) => set(state => ({
        tradeInItems: typeof updater === 'function' ? updater(state.tradeInItems) : updater
      })),
      resetForm: () => set({
        selectedCustomer: null,
        discountPercent: 0,
        loyaltyDiscountApplied: false,
        paymentType: 'cash',
        cardType: null,
        source: 'walk_in',
        installmentOrgId: '',
        installmentTermMonths: 3,
        contractNumber: '',
        tradeInItems: [],
      }),
    }),
    { name: 'goodtires-sale-form' }
  )
)
