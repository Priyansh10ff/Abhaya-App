import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Types ──────────────────────────────────────────────
export type FlowLevel  = 'light' | 'medium' | 'heavy' | 'spotting'
export type MoodLevel  = 'happy' | 'okay' | 'sad' | 'anxious' | 'angry' | 'tired'
export type PainLevel  = 0 | 1 | 2 | 3 | 4 | 5  // 0 = none, 5 = severe

export interface DayLog {
  date:        string   // 'YYYY-MM-DD'
  isPeriod:    boolean
  flow?:       FlowLevel
  pain:        PainLevel
  mood?:       MoodLevel
  symptoms:    string[] // from PCOS_SYMPTOMS list
  notes?:      string
}

export interface CycleRecord {
  startDate: string  // 'YYYY-MM-DD'
  endDate?:  string
  length?:   number  // days of bleeding
}

export interface HealthProfile {
  avgCycleLength: number  // days between periods (default 28)
  avgPeriodLength:number  // days of bleeding (default 5)
  lastUpdated:    number
}

// ─── PCOS symptoms ──────────────────────────────────────
export const PCOS_SYMPTOMS = [
  'Irregular periods',
  'Heavy bleeding',
  'Cramps',
  'Bloating',
  'Acne / oily skin',
  'Hair thinning',
  'Facial hair',
  'Weight gain',
  'Fatigue',
  'Mood swings',
  'Headache',
  'Nausea',
  'Breast tenderness',
  'Lower back pain',
]

// ─── Storage keys ────────────────────────────────────────
const KEYS = {
  LOGS:    'abhaya:health:logs',
  CYCLES:  'abhaya:health:cycles',
  PROFILE: 'abhaya:health:profile',
}

// ─── Day logs ────────────────────────────────────────────
export async function loadLogs(): Promise<Record<string, DayLog>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.LOGS)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

export async function saveLog(log: DayLog): Promise<void> {
  const logs = await loadLogs()
  logs[log.date] = log
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs))
  // Rebuild cycle records when period data changes
  await rebuildCycles(logs)
}

export async function getLog(date: string): Promise<DayLog | null> {
  const logs = await loadLogs()
  return logs[date] ?? null
}

export async function deleteLog(date: string): Promise<void> {
  const logs = await loadLogs()
  delete logs[date]
  await AsyncStorage.setItem(KEYS.LOGS, JSON.stringify(logs))
  await rebuildCycles(logs)
}

// ─── Cycles ──────────────────────────────────────────────
export async function loadCycles(): Promise<CycleRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.CYCLES)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

async function rebuildCycles(logs: Record<string, DayLog>): Promise<void> {
  const periodDays = Object.values(logs)
    .filter(l => l.isPeriod)
    .map(l => l.date)
    .sort()

  if (periodDays.length === 0) {
    await AsyncStorage.setItem(KEYS.CYCLES, JSON.stringify([]))
    return
  }

  const cycles: CycleRecord[] = []
  let cycleStart = periodDays[0]
  let prev       = periodDays[0]

  for (let i = 1; i < periodDays.length; i++) {
    const curr = periodDays[i]
    const gap  = daysBetween(prev, curr)

    if (gap > 2) {
      // Gap > 2 days = new cycle
      cycles.push({ startDate: cycleStart, endDate: prev, length: daysBetween(cycleStart, prev) + 1 })
      cycleStart = curr
    }
    prev = curr
  }

  // Last ongoing cycle
  cycles.push({ startDate: cycleStart, endDate: prev, length: daysBetween(cycleStart, prev) + 1 })
  await AsyncStorage.setItem(KEYS.CYCLES, JSON.stringify(cycles))

  // Update profile averages
  await updateProfile(cycles)
}

async function updateProfile(cycles: CycleRecord[]): Promise<void> {
  if (cycles.length < 2) return

  const cycleLengths: number[] = []
  for (let i = 1; i < cycles.length; i++) {
    cycleLengths.push(daysBetween(cycles[i-1].startDate, cycles[i].startDate))
  }

  const avgCycle  = Math.round(cycleLengths.reduce((a,b) => a+b, 0) / cycleLengths.length)
  const periodLen = cycles.map(c => c.length ?? 5)
  const avgPeriod = Math.round(periodLen.reduce((a,b) => a+b, 0) / periodLen.length)

  const profile: HealthProfile = {
    avgCycleLength:  Math.max(21, Math.min(35, avgCycle)),  // clamp 21-35
    avgPeriodLength: Math.max(2,  Math.min(8,  avgPeriod)), // clamp 2-8
    lastUpdated:     Date.now(),
  }
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile))
}

export async function loadProfile(): Promise<HealthProfile> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE)
    return raw ? JSON.parse(raw) : { avgCycleLength: 28, avgPeriodLength: 5, lastUpdated: Date.now() }
  } catch {
    return { avgCycleLength: 28, avgPeriodLength: 5, lastUpdated: Date.now() }
  }
}

// ─── Predictions ─────────────────────────────────────────
export interface PredictionResult {
  nextPeriodDate:   string
  fertileWindowStart:string
  fertileWindowEnd:  string
  ovulationDate:     string
  daysUntilPeriod:  number
  cycleDay:         number   // what day of cycle today is
  phase:            'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown'
}

export async function predictNextPeriod(): Promise<PredictionResult | null> {
  const [cycles, profile] = await Promise.all([loadCycles(), loadProfile()])

  if (cycles.length === 0) return null

  const lastCycle    = cycles[cycles.length - 1]
  const lastStart    = parseDate(lastCycle.startDate)
  const today        = new Date(); today.setHours(0,0,0,0)

  const nextStart    = addDays(lastStart, profile.avgCycleLength)
  const ovulation    = addDays(nextStart, -14)
  const fertileStart = addDays(ovulation, -5)
  const fertileEnd   = addDays(ovulation, 1)

  const cycleDay     = daysBetween(lastCycle.startDate, formatDate(today)) + 1
  const daysUntil    = daysBetween(formatDate(today), formatDate(nextStart))

  let phase: PredictionResult['phase'] = 'unknown'
  if (cycleDay <= profile.avgPeriodLength)          phase = 'menstrual'
  else if (cycleDay <= 13)                          phase = 'follicular'
  else if (cycleDay <= 16)                          phase = 'ovulation'
  else if (cycleDay <= profile.avgCycleLength)      phase = 'luteal'

  return {
    nextPeriodDate:    formatDate(nextStart),
    fertileWindowStart:formatDate(fertileStart),
    fertileWindowEnd:  formatDate(fertileEnd),
    ovulationDate:     formatDate(ovulation),
    daysUntilPeriod:   daysUntil,
    cycleDay,
    phase,
  }
}

// ─── PCOS risk indicators ─────────────────────────────────
export async function getPCOSRiskIndicators(): Promise<{
  hasIrregularCycles: boolean
  hasFrequentSymptoms: string[]
  riskLevel: 'low' | 'moderate' | 'high'
  suggestion: string
}> {
  const [cycles, logs, profile] = await Promise.all([loadCycles(), loadLogs(), loadProfile()])

  const hasIrregular = cycles.length >= 2 && (
    profile.avgCycleLength < 21 ||
    profile.avgCycleLength > 35
  )

  // Check frequent PCOS symptoms
  const symptomCount: Record<string, number> = {}
  Object.values(logs).forEach(log => {
    log.symptoms.forEach(s => { symptomCount[s] = (symptomCount[s] ?? 0) + 1 })
  })

  const pcosSymptoms   = ['Irregular periods','Acne / oily skin','Hair thinning','Facial hair','Weight gain']
  const freqSymptoms   = pcosSymptoms.filter(s => (symptomCount[s] ?? 0) >= 3)
  const riskScore      = (hasIrregular ? 2 : 0) + freqSymptoms.length

  const riskLevel: 'low' | 'moderate' | 'high' =
    riskScore >= 4 ? 'high' : riskScore >= 2 ? 'moderate' : 'low'

  const suggestion =
    riskLevel === 'high'
      ? 'You have several indicators that are sometimes associated with PCOS. Consider speaking with a gynaecologist. This is not a diagnosis.'
      : riskLevel === 'moderate'
      ? 'Some of your patterns may be worth discussing with a doctor, especially if periods are irregular.'
      : 'Your patterns look typical. Keep tracking for more accurate insights.'

  return { hasIrregularCycles: hasIrregular, hasFrequentSymptoms: freqSymptoms, riskLevel, suggestion }
}

// ─── Government schemes ──────────────────────────────────
export interface GovtScheme {
  name:        string
  ministry:    string
  desc:        string
  eligibility: string
  link?:       string
  states?:     string[]
}

export const GOVT_SCHEMES: GovtScheme[] = [
  {
    name:        'Pradhan Mantri Ujjwala Yojana (PMUY)',
    ministry:    'Ministry of Petroleum',
    desc:        'Free LPG connections to women from BPL households. Improves kitchen health.',
    eligibility: 'Women from BPL households not already having LPG connection.',
    link:        'https://www.pmuy.gov.in',
  },
  {
    name:        'SABLA (Rajiv Gandhi Scheme)',
    ministry:    'Ministry of WCD',
    desc:        'Nutrition, health, life skills for adolescent girls 11-18 years including iron, folic acid, and health check-ups.',
    eligibility: 'Adolescent girls aged 11-18 in selected blocks.',
    link:        'https://wcd.nic.in',
  },
  {
    name:        'Janani Suraksha Yojana (JSY)',
    ministry:    'Ministry of Health',
    desc:        'Cash assistance for institutional delivery. Promotes safe childbirth in hospitals.',
    eligibility: 'Pregnant women from BPL families for hospital delivery.',
    link:        'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
  },
  {
    name:        'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    ministry:    'Ministry of WCD',
    desc:        '₹5,000 direct cash benefit for first live birth to support nutrition during pregnancy and after.',
    eligibility: 'All pregnant and lactating mothers for first living child.',
    link:        'https://pmmvy.wcd.gov.in',
  },
  {
    name:        'Free Sanitary Napkins — Suvidha',
    ministry:    'Ministry of WCD / State govts',
    desc:        'Free or subsidised sanitary napkins for school girls and women at Anganwadi centres.',
    eligibility: 'School-going girls and women through government channels.',
  },
  {
    name:        'Ayushman Bharat — PM-JAY',
    ministry:    'Ministry of Health',
    desc:        '₹5 lakh health insurance cover per family per year. Covers maternity, gynaecology, and reproductive health.',
    eligibility: 'Families listed in SECC 2011 data.',
    link:        'https://pmjay.gov.in',
  },
  {
    name:        'National Iron Plus Initiative',
    ministry:    'Ministry of Health',
    desc:        'Free iron and folic acid supplements for adolescent girls, pregnant and lactating women.',
    eligibility: 'Available at PHCs, Anganwadi centres, and government schools.',
  },
  {
    name:        'Kishori Shakti Yojana (KSY)',
    ministry:    'Ministry of WCD',
    desc:        'Health, nutrition, and life skills programme for adolescent girls with focus on menstrual hygiene.',
    eligibility: 'Adolescent girls 11-18 years in rural areas.',
  },
]

// ─── Date helpers ─────────────────────────────────────────
export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function parseDate(s: string): Date {
  const d = new Date(s + 'T00:00:00')
  return d
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function daysBetween(a: string, b: string): number {
  const da = parseDate(a)
  const db = parseDate(b)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function formatDisplayDate(s: string): string {
  return parseDate(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function getDayOfWeek(s: string): string {
  return parseDate(s).toLocaleDateString('en-IN', { weekday: 'short' })
}

export function getMonthDays(year: number, month: number): string[] {
  const days: string[] = []
  const d = new Date(year, month, 1)
  while (d.getMonth() === month) {
    days.push(formatDate(d))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export const PHASE_INFO: Record<string, { label: string; icon: string; desc: string; tips: string[] }> = {
  menstrual: {
    label: 'Menstrual phase',
    icon:  '🌑',
    desc:  'Your period is here. Your body is shedding the uterine lining. This is completely normal.',
    tips:  ['Rest more than usual — it\'s okay', 'Stay warm, use a heating pad for cramps', 'Iron-rich foods: leafy greens, lentils, jaggery', 'Track your flow and symptoms'],
  },
  follicular: {
    label: 'Follicular phase',
    icon:  '🌱',
    desc:  'Your body is preparing an egg. Energy levels usually rise during this phase.',
    tips:  ['Good time for new projects and socialising', 'Fermented foods support gut health', 'Light exercise feels easier now', 'Cervical mucus is usually dry or creamy'],
  },
  ovulation: {
    label: 'Ovulation phase',
    icon:  '🌕',
    desc:  'Your body releases an egg. Fertility is highest. You may feel more energetic.',
    tips:  ['Peak energy and confidence for most women', 'Cervical mucus is clear and stretchy', 'You may notice a slight temperature rise', 'Fertile window: 5 days before + day of ovulation'],
  },
  luteal: {
    label: 'Luteal phase',
    icon:  '🌘',
    desc:  'After ovulation, your body prepares for next period. PMS symptoms may appear.',
    tips:  ['Cravings are normal — magnesium helps (dark chocolate, nuts)', 'Mood may dip — be kind to yourself', 'Bloating is common, reduce salt intake', 'Exercise helps with PMS symptoms'],
  },
  unknown: {
    label: 'Start tracking',
    icon:  '📅',
    desc:  'Log your period start date to see your cycle insights.',
    tips:  ['Tap any day to log your period', 'After 2-3 cycles, predictions get accurate', 'You can also log symptoms and mood'],
  },
}
