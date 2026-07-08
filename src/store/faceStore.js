import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useFaceStore = create(
  persist(
    (set) => ({
      // { [userId]: number[] } — har bir foydalanuvchining referens yuz descriptori
      descriptors: {},
      setDescriptor: (userId, descriptor) =>
        set(s => ({ descriptors: { ...s.descriptors, [userId]: descriptor } })),
      removeDescriptor: (userId) =>
        set(s => {
          const descriptors = { ...s.descriptors }
          delete descriptors[userId]
          return { descriptors }
        }),
    }),
    {
      name: 'shina-face-data',
    }
  )
)
