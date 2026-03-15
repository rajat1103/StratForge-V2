import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Exam, AIInsight } from '@/types'

interface AppStore {
  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // Exams
  exams: Exam[]
  setExams: (exams: Exam[]) => void
  updateExam: (id: string, data: Partial<Exam>) => void

  // Active session
  activeExamId: string | null
  setActiveExamId: (id: string | null) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  theme: 'dark' | 'light'
  setTheme: (theme: 'dark' | 'light') => void

  // Insights
  unreadInsights: number
  setUnreadInsights: (count: number) => void

  // Focus mode
  focusMode: boolean
  setFocusMode: (active: boolean) => void
  focusTopicId: string | null
  setFocusTopicId: (id: string | null) => void
  pomodoroActive: boolean
  setPomodoroActive: (active: boolean) => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Notification) => void
  removeNotification: (id: string) => void
}

interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      exams: [],
      setExams: (exams) => set({ exams }),
      updateExam: (id, data) =>
        set((state) => ({
          exams: state.exams.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),

      activeExamId: null,
      setActiveExamId: (id) => set({ activeExamId: id }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      unreadInsights: 0,
      setUnreadInsights: (count) => set({ unreadInsights: count }),

      focusMode: false,
      setFocusMode: (active) => set({ focusMode: active }),
      focusTopicId: null,
      setFocusTopicId: (id) => set({ focusTopicId: id }),
      pomodoroActive: false,
      setPomodoroActive: (active) => set({ pomodoroActive: active }),

      notifications: [],
      addNotification: (n) =>
        set((state) => ({ notifications: [...state.notifications.slice(-4), n] })),
      removeNotification: (id) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
    }),
    {
      name: 'stratforge-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        activeExamId: state.activeExamId,
      }),
    }
  )
)
