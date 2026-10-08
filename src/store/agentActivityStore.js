import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_ACTIVITIES = []

export const useAgentActivityStore = create(
  persist(
    (set, get) => ({
      activities: INITIAL_ACTIVITIES,

      addActivity: (activity) => set(state => {
        const today = new Date().toISOString().slice(0, 10)
        const isDuplicate = state.activities.some(a =>
          a.agentId === activity.agentId &&
          a.type === activity.type &&
          a.message === activity.message &&
          a.timestamp?.slice(0, 10) === today
        )
        if (isDuplicate) return state
        return {
          activities: [
            {
              id: 'act-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
              timestamp: new Date().toISOString(),
              read: false,
              ...activity,
            },
            ...state.activities,
          ].slice(0, 200),
        }
      }),

      markAsRead: (id) => set(state => ({
        activities: state.activities.map(a => a.id === id ? { ...a, read: true } : a),
      })),

      markAllAsRead: () => set(state => ({
        activities: state.activities.map(a => ({ ...a, read: true })),
      })),

      deleteActivity: (id) => set(state => ({
        activities: state.activities.filter(a => a.id !== id),
      })),

      clearAllActivities: () => set({ activities: [] }),

      getActivitiesByAgent: (agentId) => {
        return get().activities.filter(
          a => a.agentId === agentId || a.relatedAgentId === agentId
        )
      },
    }),
    {
      name: 'agent-activities-v2',
      // Faqat activities saqlanadi, metodlar emas
      partialize: (state) => ({ activities: state.activities }),
    }
  )
)
