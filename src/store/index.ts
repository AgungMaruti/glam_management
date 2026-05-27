'use client'
import { create } from 'zustand'

interface AppStore {
  dashboardVersion: number
  triggerDashboardRefresh: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  dashboardVersion: 0,
  triggerDashboardRefresh: () => set(s => ({ dashboardVersion: s.dashboardVersion + 1 })),
}))
