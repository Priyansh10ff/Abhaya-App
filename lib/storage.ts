import AsyncStorage from '@react-native-async-storage/async-storage'

const KEYS = {
  ONBOARDED:   'abhaya:onboarded',
  LANGUAGE:    'abhaya:language',
  CHAT_HISTORY:'abhaya:chat-history',
  GUIDE_PROGRESS:'abhaya:guide-progress',
}

// ─── Onboarding ────────────────────────────────────────
export async function setOnboarded(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true')
}

export async function isOnboarded(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED)
  return val === 'true'
}

// ─── Language ───────────────────────────────────────────
export type Language = 'en' | 'hi' | 'kn' | 'ta' | 'te' | 'bn'

export async function setLanguage(lang: Language): Promise<void> {
  await AsyncStorage.setItem(KEYS.LANGUAGE, lang)
}

export async function getLanguage(): Promise<Language> {
  const val = await AsyncStorage.getItem(KEYS.LANGUAGE)
  return (val as Language) ?? 'en'
}

// ─── Chat history ───────────────────────────────────────
export interface StoredMessage {
  role:      'user' | 'assistant'
  content:   string
  timestamp: number
}

export async function saveChatHistory(messages: StoredMessage[]): Promise<void> {
  // Keep last 50 messages only
  const trimmed = messages.slice(-50)
  await AsyncStorage.setItem(KEYS.CHAT_HISTORY, JSON.stringify(trimmed))
}

export async function loadChatHistory(): Promise<StoredMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CHAT_HISTORY)
    if (!raw) return []
    return JSON.parse(raw) as StoredMessage[]
  } catch {
    return []
  }
}

export async function clearChatHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.CHAT_HISTORY)
}

// ─── Guide progress ─────────────────────────────────────
export async function markStepComplete(stepId: string): Promise<void> {
  const raw  = await AsyncStorage.getItem(KEYS.GUIDE_PROGRESS)
  const done: string[] = raw ? JSON.parse(raw) : []
  if (!done.includes(stepId)) {
    done.push(stepId)
    await AsyncStorage.setItem(KEYS.GUIDE_PROGRESS, JSON.stringify(done))
  }
}

export async function getCompletedSteps(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEYS.GUIDE_PROGRESS)
  return raw ? JSON.parse(raw) : []
}

export async function resetGuideProgress(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.GUIDE_PROGRESS)
}
