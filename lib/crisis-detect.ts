import Constants      from 'expo-constants'
import type { CrisisLevel } from './community'

const API_KEY = Constants.expoConfig?.extra?.claudeApiKey ?? ''

const CRISIS_SYSTEM = `You are a crisis detection system for a women's safety app community.
Analyze the given text and return ONLY a JSON object with these fields:
- level: 0 (safe), 1 (monitor), 2 (concern), 3 (crisis)
- reason: one short sentence explaining your assessment
- show_resources: boolean (true if crisis resources should be shown)

Level definitions:
0 = Normal post, no crisis signals
1 = Some distress, worth monitoring but not urgent  
2 = Clear distress, suicidal ideation hints, severe danger signals
3 = Active crisis — suicidal intent, immediate danger, emergency situation

Examples of level 3: "I can't take this anymore and I've decided to end it", "he said he'll kill me tonight", "I have no reason to live"
Examples of level 2: "I feel like disappearing", "I don't know how much more I can take", "thinking of hurting myself"
Examples of level 1: "I'm really struggling", "I feel so alone", "I'm scared"
Examples of level 0: "Can anyone help with my FIR?", "What are my POSH rights?", "Feeling better today"

Return ONLY valid JSON. No explanation, no markdown.`

export interface CrisisAnalysis {
  level:          CrisisLevel
  reason:         string
  show_resources: boolean
}

export async function analyzeCrisisLevel(text: string): Promise<CrisisAnalysis> {
  // Default safe response — used if API fails
  const safe: CrisisAnalysis = { level: 0, reason: 'No crisis signals detected', show_resources: false }

  if (!API_KEY || text.trim().length < 10) return safe  // No key = skip API, use keyword check only

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001', // Use Haiku for speed + cost
        max_tokens: 150,
        system:     CRISIS_SYSTEM,
        messages:   [{ role: 'user', content: text }],
      }),
    })

    if (!res.ok) return safe

    const data   = await res.json()
    const raw    = data.content?.[0]?.text ?? ''
    const parsed = JSON.parse(raw.trim()) as CrisisAnalysis

    return {
      level:          ([0,1,2,3].includes(parsed.level) ? parsed.level : 0) as CrisisLevel,
      reason:         parsed.reason         ?? safe.reason,
      show_resources: parsed.show_resources ?? (parsed.level >= 2),
    }
  } catch {
    return safe
  }
}

// ─── Local keyword check (fallback, no API needed) ──────
// Used as a first-pass before calling the API
const CRISIS_KEYWORDS_L3 = [
  'end my life', 'kill myself', 'want to die', 'no reason to live',
  'he will kill me', 'he said he\'ll kill', 'end it all', 'goodbye forever',
]
const CRISIS_KEYWORDS_L2 = [
  'disappear', 'hurt myself', 'can\'t take it anymore', 'no point',
  'give up', 'can\'t go on', 'ending everything', 'nothing to live for',
]
const CRISIS_KEYWORDS_L1 = [
  'scared', 'alone', 'help me', 'nobody cares', 'trapped', 'no way out',
  'crying', 'breaking down', 'falling apart',
]

export function quickCrisisCheck(text: string): CrisisLevel {
  const lower = text.toLowerCase()
  if (CRISIS_KEYWORDS_L3.some(k => lower.includes(k))) return 3
  if (CRISIS_KEYWORDS_L2.some(k => lower.includes(k))) return 2
  if (CRISIS_KEYWORDS_L1.some(k => lower.includes(k))) return 1
  return 0
}
