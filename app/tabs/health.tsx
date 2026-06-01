import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  loadLogs, loadCycles, predictNextPeriod, loadProfile,
  formatDate, formatDisplayDate, getDayOfWeek,
  getMonthDays, addDays, parseDate, PHASE_INFO,
  type DayLog, type PredictionResult,
} from '@/lib/health'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function HealthTab() {
  const today = formatDate(new Date())
  const [viewYear,  setViewYear]  = useState(new Date().getFullYear())
  const [viewMonth, setViewMonth] = useState(new Date().getMonth())
  const [logs,      setLogs]      = useState<Record<string, DayLog>>({})
  const [prediction,setPrediction]= useState<PredictionResult | null>(null)
  const [profile,   setProfile]   = useState({ avgCycleLength: 28, avgPeriodLength: 5, lastUpdated: 0 })

  useFocusEffect(useCallback(() => {
    load()
  }, []))

  async function load() {
    const [l, pred, prof] = await Promise.all([loadLogs(), predictNextPeriod(), loadProfile()])
    setLogs(l)
    setPrediction(pred)
    setProfile(prof)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  // Build calendar data
  const monthDays = getMonthDays(viewYear, viewMonth)
  const firstDow  = parseDate(monthDays[0]).getDay()

  function getDayStyle(dateStr: string) {
    const log       = logs[dateStr]
    const isToday   = dateStr === today
    const isPeriod  = log?.isPeriod ?? false
    const isNext    = prediction && dateStr >= prediction.nextPeriodDate &&
                      dateStr <= formatDate(addDays(parseDate(prediction.nextPeriodDate), profile.avgPeriodLength - 1))
    const isFertile = prediction &&
                      dateStr >= prediction.fertileWindowStart &&
                      dateStr <= prediction.fertileWindowEnd
    const isOvul    = prediction && dateStr === prediction.ovulationDate

    return { log, isToday, isPeriod, isNext, isFertile, isOvul }
  }

  const phase = prediction?.phase ?? 'unknown'
  const phaseInfo = PHASE_INFO[phase]

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Health</Text>
            <Text style={s.headerSub}>Cycle tracker · PCOS info · Health schemes</Text>
          </View>
          <TouchableOpacity
            style={s.logBtn}
            onPress={() => router.push(`/health/log?date=${today}` as any)}
          >
            <Text style={s.logBtnText}>+ Log today</Text>
          </TouchableOpacity>
        </View>

        {/* Phase card */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.phaseCard}>
          <View style={s.phaseHeader}>
            <Text style={s.phaseIcon}>{phaseInfo.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.phaseLabel}>{phaseInfo.label}</Text>
              {prediction && (
                <Text style={s.phaseDay}>Day {prediction.cycleDay} of cycle</Text>
              )}
            </View>
            {prediction && (
              <View style={s.daysUntilWrap}>
                <Text style={s.daysUntilNum}>{prediction.daysUntilPeriod}</Text>
                <Text style={s.daysUntilLabel}>days{'\n'}away</Text>
              </View>
            )}
          </View>
          <Text style={s.phaseDesc}>{phaseInfo.desc}</Text>
          <View style={s.phaseTips}>
            {phaseInfo.tips.slice(0, 2).map((t, i) => (
              <View key={i} style={s.phaseTipRow}>
                <Text style={s.phaseTipDot}>·</Text>
                <Text style={s.phaseTipText}>{t}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Calendar */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.calCard}>

          {/* Month nav */}
          <View style={s.calNav}>
            <TouchableOpacity onPress={prevMonth} style={s.calNavBtn}>
              <Text style={s.calNavIcon}>‹</Text>
            </TouchableOpacity>
            <Text style={s.calTitle}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={s.calNavBtn}>
              <Text style={s.calNavIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={s.calWeekRow}>
            {WEEKDAYS.map(d => (
              <Text key={d} style={s.calWeekDay}>{d}</Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={s.calGrid}>
            {/* Spacer for first day */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <View key={`sp-${i}`} style={s.calDay} />
            ))}

            {monthDays.map(dateStr => {
              const { log, isToday, isPeriod, isNext, isFertile, isOvul } = getDayStyle(dateStr)
              const dayNum = parseInt(dateStr.slice(8))

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    s.calDay,
                    isPeriod  && s.calDayPeriod,
                    isNext    && !isPeriod && s.calDayNext,
                    isFertile && !isPeriod && s.calDayFertile,
                    isOvul    && !isPeriod && s.calDayOvul,
                    isToday   && !isPeriod && s.calDayToday,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push(`/health/log?date=${dateStr}` as any)
                  }}
                >
                  <Text style={[
                    s.calDayNum,
                    isPeriod && s.calDayNumPeriod,
                    isToday  && !isPeriod && s.calDayNumToday,
                  ]}>
                    {dayNum}
                  </Text>
                  {log?.symptoms?.length > 0 && (
                    <View style={s.calDayDot} />
                  )}
                </TouchableOpacity>
              )
            })}
          </View>

          {/* Legend */}
          <View style={s.legend}>
            {[
              { color: '#E85D8A', label: 'Period'   },
              { color: '#E85D8A44', label: 'Predicted' },
              { color: Colors.tealDim, label: 'Fertile'  },
              { color: Colors.tealGlow, label: 'Ovulation'},
            ].map(l => (
              <View key={l.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: l.color }]} />
                <Text style={s.legendLabel}>{l.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Next period prediction */}
        {prediction && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.predCard}>
            <Text style={s.predTitle}>📅 Predictions</Text>
            {[
              { label: 'Next period',     value: formatDisplayDate(prediction.nextPeriodDate),       color: '#E85D8A' },
              { label: 'Fertile window',  value: `${formatDisplayDate(prediction.fertileWindowStart)} – ${formatDisplayDate(prediction.fertileWindowEnd)}`, color: Colors.teal },
              { label: 'Ovulation',       value: formatDisplayDate(prediction.ovulationDate),        color: Colors.tealGlow },
            ].map(row => (
              <View key={row.label} style={s.predRow}>
                <View style={[s.predDot, { backgroundColor: row.color }]} />
                <Text style={s.predLabel}>{row.label}</Text>
                <Text style={s.predValue}>{row.value}</Text>
              </View>
            ))}
            <Text style={s.predNote}>
              Based on your last {profile.avgCycleLength}-day average cycle. More data = better accuracy.
            </Text>
          </Animated.View>
        )}

        {/* Quick links */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.quickLinks}>
          {[
            { icon: '🔬', label: 'PCOS checker',       route: '/health/pcos'    },
            { icon: '🏛', label: 'Govt health schemes', route: '/health/schemes' },
          ].map(l => (
            <TouchableOpacity
              key={l.label}
              style={s.quickLink}
              onPress={() => router.push(l.route as any)}
            >
              <Text style={s.quickLinkIcon}>{l.icon}</Text>
              <Text style={s.quickLinkLabel}>{l.label}</Text>
              <Text style={s.quickLinkChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Privacy note */}
        <View style={s.privacyNote}>
          <Text style={s.privacyText}>
            🔒 All health data is stored on this device only. Nothing is uploaded or shared.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  headerTitle: { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,   color: Colors.textPrimary },
  headerSub:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs,   color: Colors.textMuted   },
  logBtn: {
    backgroundColor: '#E85D8A', borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  logBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.white },

  phaseCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  phaseHeader:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  phaseIcon:      { fontSize: 32 },
  phaseLabel:     { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  phaseDay:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  daysUntilWrap:  { alignItems: 'center' },
  daysUntilNum:   { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl, color: '#E85D8A' },
  daysUntilLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted, textAlign: 'center' },
  phaseDesc:      { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  phaseTips:      { gap: Spacing.xs },
  phaseTipRow:    { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  phaseTipDot:    { color: '#E85D8A', fontSize: FontSize.base, lineHeight: 20 },
  phaseTipText:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond, flex: 1, lineHeight: 18 },

  calCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  calNav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calNavBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  calNavIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  calTitle:   { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  calWeekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  calWeekDay: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.textMuted, width: 36, textAlign: 'center' },
  calGrid:    { flexDirection: 'row', flexWrap: 'wrap' },
  calDay: {
    width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: Radius.sm, position: 'relative',
  },
  calDayPeriod:  { backgroundColor: '#E85D8A' },
  calDayNext:    { backgroundColor: '#E85D8A22' },
  calDayFertile: { backgroundColor: Colors.tealDim },
  calDayOvul:    { backgroundColor: Colors.teal + '40' },
  calDayToday:   { borderWidth: 1.5, borderColor: Colors.textPrimary },
  calDayNum:        { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm,  color: Colors.textSecond  },
  calDayNumPeriod:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm,  color: Colors.white       },
  calDayNumToday:   { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm,  color: Colors.textPrimary },
  calDayDot: {
    position: 'absolute', bottom: 2, width: 4, height: 4,
    borderRadius: 2, backgroundColor: Colors.tealGlow,
  },
  legend:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, justifyContent: 'center' },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  legendDot:   { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },

  predCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  predTitle:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  predRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  predDot:    { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  predLabel:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted, width: 100 },
  predValue:  { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  predNote:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, lineHeight: 18 },

  quickLinks: { gap: Spacing.sm },
  quickLink: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg,
  },
  quickLinkIcon:    { fontSize: 22 },
  quickLinkLabel:   { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  quickLinkChevron: { fontSize: FontSize.xl, color: Colors.textMuted },

  privacyNote: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.teal + '30',
  },
  privacyText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'AA', textAlign: 'center' },
})
