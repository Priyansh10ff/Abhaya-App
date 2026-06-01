import Constants from 'expo-constants'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Constants.expoConfig?.extra?.supabaseUrl  ?? '',
  Constants.expoConfig?.extra?.supabaseAnon ?? '',
)

// ─── Types ──────────────────────────────────────────────
export type Category =
  | 'followed'
  | 'harassment'
  | 'assault'
  | 'unsafe_area'
  | 'eve_teasing'
  | 'other'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'any'

export interface SafetyReport {
  id:          string
  lat:         number
  lng:         number
  category:    Category
  time_of_day: TimeOfDay
  description: string | null
  reported_at: string
  upvotes:     number
}

export interface NewReport {
  lat:         number
  lng:         number
  category:    Category
  time_of_day: TimeOfDay
  description?: string
}

// ─── Category metadata ──────────────────────────────────
export const CATEGORIES: Record<Category, { label: string; icon: string; color: string }> = {
  followed:    { label: 'Followed / stalked',  icon: '👁️',  color: '#EF4444' },
  harassment:  { label: 'Verbal harassment',   icon: '🗣️',  color: '#F97316' },
  assault:     { label: 'Physical assault',    icon: '⚠️',  color: '#DC2626' },
  unsafe_area: { label: 'Generally unsafe',    icon: '🔴',  color: '#F59E0B' },
  eve_teasing: { label: 'Eve teasing',         icon: '😡',  color: '#EF4444' },
  other:       { label: 'Other incident',      icon: '📍',  color: '#6B7280' },
}

export const TIME_OPTIONS: Record<TimeOfDay, string> = {
  morning:   '🌅 Morning (6am–12pm)',
  afternoon: '☀️ Afternoon (12pm–6pm)',
  evening:   '🌆 Evening (6pm–10pm)',
  night:     '🌙 Night (10pm–6am)',
  any:       '🕐 Any time',
}

// ─── Fetch reports in a bounding box ────────────────────
export async function fetchReports(
  minLat: number, maxLat: number,
  minLng: number, maxLng: number,
  timeFilter: TimeOfDay = 'any',
): Promise<SafetyReport[]> {
  try {
    let query = supabase
      .from('safety_reports')
      .select('*')
      .gte('lat', minLat).lte('lat', maxLat)
      .gte('lng', minLng).lte('lng', maxLng)
      .order('reported_at', { ascending: false })
      .limit(200)

    if (timeFilter !== 'any') {
      query = query.eq('time_of_day', timeFilter)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as SafetyReport[]
  } catch {
    return []
  }
}

// ─── Submit a new report (anonymous) ────────────────────
export async function submitReport(report: NewReport): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('safety_reports')
      .insert([{
        lat:         report.lat,
        lng:         report.lng,
        category:    report.category,
        time_of_day: report.time_of_day,
        description: report.description ?? null,
        reported_at: new Date().toISOString(),
        upvotes:     0,
      }])

    return !error
  } catch {
    return false
  }
}

// ─── Upvote a report (confirms it's still accurate) ─────
export async function upvoteReport(id: string): Promise<void> {
  await supabase.rpc('increment_upvote', { report_id: id })
}

// ─── Get safety score for an area (0-10, 10 = safest) ──
export function calculateSafetyScore(reports: SafetyReport[]): number {
  if (reports.length === 0) return 8
  const weights: Record<Category, number> = {
    assault:     10,
    followed:    7,
    harassment:  6,
    eve_teasing: 5,
    unsafe_area: 4,
    other:       3,
  }
  const totalWeight = reports.reduce((sum, r) => sum + (weights[r.category] ?? 3), 0)
  const score = Math.max(0, 10 - totalWeight / 3)
  return Math.round(score * 10) / 10
}

export function getSafetyLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: 'Generally safe',  color: '#10B981' }
  if (score >= 4) return { label: 'Use caution',     color: '#F59E0B' }
  return            { label: 'High risk area',       color: '#EF4444' }
}
