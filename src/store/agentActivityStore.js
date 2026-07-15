import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const INITIAL_ACTIVITIES = [
  {
    id: 'act-1',
    agentId: 'inventory',
    type: 'ALERT',
    messageKey: 'ai_mock_act1',
    message: '',
    relatedAgentId: 'marketing',
    relatedEntity: { type: 'product', id: 'p2' },
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    read: false,
  },
  {
    id: 'act-2',
    agentId: 'inventory',
    type: 'RECOMMENDATION',
    messageKey: 'ai_mock_act2',
    message: '',
    relatedAgentId: null,
    relatedEntity: { type: 'product', id: 'p1' },
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    read: false,
  },
  {
    id: 'act-3',
    agentId: 'sales',
    type: 'ANALYSIS',
    messageKey: 'ai_mock_act3',
    message: '',
    relatedAgentId: null,
    relatedEntity: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    read: false,
  },
  {
    id: 'act-4',
    agentId: 'marketing',
    type: 'NOTE',
    messageKey: 'ai_mock_act4',
    message: '',
    relatedAgentId: null,
    relatedEntity: null,
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    read: false,
  },
  {
    id: 'act-5',
    agentId: 'customer',
    type: 'NOTE',
    messageKey: 'ai_mock_act5',
    message: '',
    relatedAgentId: null,
    relatedEntity: { type: 'client', id: 'C001' },
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    read: false,
  },
]

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
          ],
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
