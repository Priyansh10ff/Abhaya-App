import { create } from 'zustand'
import type { Language } from '@/lib/storage'
import type { StoredMessage } from '@/lib/storage'

interface AppState {
  // Onboarding
  onboarded:    boolean
  setOnboarded: (v: boolean) => void

  // Language
  language:    Language
  setLanguage: (l: Language) => void

  // Legal AI chat
  chatMessages:    StoredMessage[]
  addMessage:      (m: StoredMessage) => void
  clearChat:       () => void
  isChatLoading:   boolean
  setChatLoading:  (v: boolean) => void

  // Guide progress
  completedSteps:    string[]
  markStepComplete:  (id: string) => void
  resetGuide:        () => void

  // Emergency mode
  emergencyMode:    boolean
  setEmergencyMode: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Onboarding
  onboarded:    false,
  setOnboarded: (v) => set({ onboarded: v }),

  // Language
  language:    'en',
  setLanguage: (l) => set({ language: l }),

  // Chat
  chatMessages:   [],
  addMessage:     (m) => set(s => ({ chatMessages: [...s.chatMessages, m] })),
  clearChat:      () => set({ chatMessages: [] }),
  isChatLoading:  false,
  setChatLoading: (v) => set({ isChatLoading: v }),

  // Guide
  completedSteps:   [],
  markStepComplete: (id) => set(s => ({
    completedSteps: s.completedSteps.includes(id)
      ? s.completedSteps
      : [...s.completedSteps, id],
  })),
  resetGuide: () => set({ completedSteps: [] }),

  // Emergency
  emergencyMode:    false,
  setEmergencyMode: (v) => set({ emergencyMode: v }),
}))
