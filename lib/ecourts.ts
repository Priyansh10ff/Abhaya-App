import AsyncStorage from '@react-native-async-storage/async-storage'

// ─── Types ──────────────────────────────────────────────
export interface Hearing {
  date:        string   // 'DD-MM-YYYY'
  purpose:     string
  nextDate:    string | null
  judge:       string | null
  businessType:string | null
}

export interface CaseDetail {
  cnr:            string
  caseType:       string
  caseNumber:     string
  filingDate:     string
  registrationDate:string
  status:         'pending' | 'disposed' | 'unknown'
  petitioner:     string
  respondent:     string
  petitionerAdv:  string | null
  respondentAdv:  string | null
  court:          string
  district:       string
  state:          string
  hearings:       Hearing[]
  nextHearing:    string | null
  lastUpdated:    number
  notes:          string
  // User-added metadata
  addedAt:        number
  userLabel:      string   // e.g. "My FIR case"
  notifyDaysBefore: number // 1, 2, or 3 days before
}

const CASES_KEY = 'abhaya:cases'

// ─── eCourts API ────────────────────────────────────────
// eCourts public endpoint for CNR lookup
const ECOURTS_BASE = 'https://services.ecourts.gov.in/ecourtindia_v6'

export async function fetchCaseFromEcourts(cnr: string): Promise<Partial<CaseDetail> | null> {
  try {
    // eCourts API — CNR case status endpoint
    const response = await fetch(
      `${ECOURTS_BASE}/api/getCaseStatus`,
      {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify({ cnr_no: cnr.trim().toUpperCase() }),
      }
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()

    if (!data || data.errMsg) return null

    // Parse eCourts response format
    const hearings: Hearing[] = (data.history ?? []).map((h: any) => ({
      date:         h.business_date     ?? '',
      purpose:      h.business_list     ?? 'Hearing',
      nextDate:     h.next_date         ?? null,
      judge:        h.judge             ?? null,
      businessType: h.business_list_type ?? null,
    }))

    return {
      cnr,
      caseType:        data.case_type        ?? '',
      caseNumber:      data.case_no          ?? cnr,
      filingDate:      data.date_of_filing   ?? '',
      registrationDate:data.date_of_registration ?? '',
      status:          data.case_status?.toLowerCase().includes('disposa') ? 'disposed' : 'pending',
      petitioner:      data.petitioner_name  ?? 'Not available',
      respondent:      data.respondent_name  ?? 'Not available',
      petitionerAdv:   data.petitioner_advocate ?? null,
      respondentAdv:   data.respondent_advocate ?? null,
      court:           data.court_name       ?? '',
      district:        data.district         ?? '',
      state:           data.state            ?? '',
      hearings,
      nextHearing:     getNextHearingDate(hearings),
      lastUpdated:     Date.now(),
    }
  } catch {
    return null
  }
}

function getNextHearingDate(hearings: Hearing[]): string | null {
  if (!hearings.length) return null
  // Find the most recent next_date
  const withNext = hearings
    .filter(h => h.nextDate)
    .map(h => h.nextDate!)
    .sort()
  return withNext[withNext.length - 1] ?? null
}

// ─── Local case storage ─────────────────────────────────
export async function loadCases(): Promise<CaseDetail[]> {
  try {
    const raw = await AsyncStorage.getItem(CASES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

async function saveCases(cases: CaseDetail[]): Promise<void> {
  await AsyncStorage.setItem(CASES_KEY, JSON.stringify(cases))
}

export async function addCase(partial: Partial<CaseDetail> & {
  cnr: string
  userLabel: string
  notifyDaysBefore?: number
}): Promise<CaseDetail> {
  const cases    = await loadCases()
  const existing = cases.find(c => c.cnr === partial.cnr)
  if (existing) return existing

  const newCase: CaseDetail = {
    cnr:              partial.cnr,
    caseType:         partial.caseType         ?? 'Unknown',
    caseNumber:       partial.caseNumber        ?? partial.cnr,
    filingDate:       partial.filingDate        ?? '',
    registrationDate: partial.registrationDate  ?? '',
    status:           partial.status            ?? 'unknown',
    petitioner:       partial.petitioner        ?? 'Not available',
    respondent:       partial.respondent        ?? 'Not available',
    petitionerAdv:    partial.petitionerAdv     ?? null,
    respondentAdv:    partial.respondentAdv     ?? null,
    court:            partial.court             ?? '',
    district:         partial.district          ?? '',
    state:            partial.state             ?? '',
    hearings:         partial.hearings          ?? [],
    nextHearing:      partial.nextHearing       ?? null,
    lastUpdated:      Date.now(),
    notes:            '',
    addedAt:          Date.now(),
    userLabel:        partial.userLabel,
    notifyDaysBefore: partial.notifyDaysBefore  ?? 1,
  }

  await saveCases([...cases, newCase])
  return newCase
}

export async function updateCase(cnr: string, updates: Partial<CaseDetail>): Promise<void> {
  const cases   = await loadCases()
  const updated = cases.map(c => c.cnr === cnr ? { ...c, ...updates, lastUpdated: Date.now() } : c)
  await saveCases(updated)
}

export async function removeCase(cnr: string): Promise<void> {
  const cases = await loadCases()
  await saveCases(cases.filter(c => c.cnr !== cnr))
}

export async function refreshCase(cnr: string): Promise<CaseDetail | null> {
  const fresh = await fetchCaseFromEcourts(cnr)
  if (!fresh) return null
  await updateCase(cnr, fresh)
  const cases = await loadCases()
  return cases.find(c => c.cnr === cnr) ?? null
}

// ─── Helpers ────────────────────────────────────────────
export function formatHearingDate(dateStr: string): string {
  if (!dateStr) return 'Not set'
  // Handle DD-MM-YYYY format from eCourts
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [d, m, y] = parts
    const date = new Date(`${y}-${m}-${d}`)
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
  return dateStr
}

export function getDaysUntilHearing(dateStr: string): number | null {
  if (!dateStr) return null
  const parts = dateStr.split('-')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  const hearing = new Date(`${y}-${m}-${d}`)
  const today   = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.ceil((hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

export function getHearingUrgency(days: number | null): {
  label: string; color: string; bg: string
} {
  if (days === null)  return { label: 'No date set',    color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  if (days < 0)       return { label: 'Past date',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  if (days === 0)     return { label: 'Today!',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)'  }
  if (days === 1)     return { label: 'Tomorrow',       color: '#F97316', bg: 'rgba(249,115,22,0.12)' }
  if (days <= 7)      return { label: `In ${days} days`, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'}
  if (days <= 30)     return { label: `In ${days} days`, color: '#10B981', bg: 'rgba(16,185,129,0.12)'}
  return               { label: `In ${days} days`,     color: '#1A9088', bg: 'rgba(26,144,136,0.12)' }
}

export function parseCNR(input: string): { valid: boolean; formatted: string } {
  // CNR format: XXXX-XX-XXXXXXX-XXXX (e.g. KABA010023322024)
  const clean = input.replace(/[\s-]/g, '').toUpperCase()
  const valid = clean.length >= 10 && /^[A-Z0-9]+$/.test(clean)
  return { valid, formatted: clean }
}

// ─── What each hearing stage means ──────────────────────
export const HEARING_EXPLANATIONS: Record<string, string> = {
  'arguments':      'Lawyers present their legal arguments to the judge. You should be present with your lawyer.',
  'evidence':       'Evidence is examined and witnesses may be cross-examined. Critical stage — be prepared.',
  'judgement':      'The judge will pronounce the verdict. Be present — this is the final decision.',
  'framing issues': 'The court formally states what points it will decide on. Your lawyer handles this.',
  'mediation':      'Both sides may be asked to try resolving the dispute outside court.',
  'default':        'A routine hearing. Your lawyer will attend. Check with them for what to prepare.',
}

export function explainHearing(purpose: string): string {
  const lower = purpose.toLowerCase()
  for (const [key, explanation] of Object.entries(HEARING_EXPLANATIONS)) {
    if (lower.includes(key)) return explanation
  }
  return HEARING_EXPLANATIONS.default
}
