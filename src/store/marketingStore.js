import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useMarketingStore = create(
  persist(
    (set, get) => ({
      scenarios: [],

      addScenario: (scenario) => set(state => ({
        scenarios: [
          {
            id: 'sc-' + Date.now(),
            status: 'draft',
            createdAt: new Date().toISOString(),
            approvedAt: null,
            videoUrl: null,
            instagramPosted: false,
            ...scenario,
          },
          ...state.scenarios,
        ],
      })),

      updateScenario: (id, patch) => set(state => ({
        scenarios: state.scenarios.map(s => s.id === id ? { ...s, ...patch } : s),
      })),

      deleteScenario: (id) => set(state => ({
        scenarios: state.scenarios.filter(s => s.id !== id),
      })),

      approveScenario: (id) => set(state => ({
        scenarios: state.scenarios.map(s =>
          s.id === id ? { ...s, status: 'approved', approvedAt: new Date().toISOString() } : s
        ),
      })),

      rejectScenario: (id) => set(state => ({
        scenarios: state.scenarios.map(s =>
          s.id === id ? { ...s, status: 'draft' } : s
        ),
      })),

      // Higgsfield ulanganda chaqiriladi
      setVideoGenerating: (id) => set(state => ({
        scenarios: state.scenarios.map(s =>
          s.id === id ? { ...s, status: 'video_generating' } : s
        ),
      })),

      setVideoReady: (id, videoUrl) => set(state => ({
        scenarios: state.scenarios.map(s =>
          s.id === id ? { ...s, status: 'video_ready', videoUrl } : s
        ),
      })),

      setInstagramPosted: (id) => set(state => ({
        scenarios: state.scenarios.map(s =>
          s.id === id ? { ...s, instagramPosted: true, status: 'posted' } : s
        ),
      })),
    }),
    { name: 'goodtires-marketing' }
  )
)
