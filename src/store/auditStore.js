import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuditStore = create(
  persist(
    (set) => ({
      logs: [],
      addLog: ({ userId, userName, action, actionKey, entity, details }) =>
        set(s => ({
          logs: [
            {
              id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toISOString(),
              userId,
              userName,
              action,
              actionKey: actionKey || '',
              entity,
              details: details || '',
            },
            ...s.logs,
          ].slice(0, 5000),
        })),
      clearLogs: () => set({ logs: [] }),
    }),
    { name: 'goodtires-audit' }
  )
)
