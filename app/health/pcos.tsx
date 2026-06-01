import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Linking,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { getPCOSRiskIndicators } from '@/lib/health'

const PCOS_FACTS = [
  {
    q: 'What is PCOS?',
    a: 'Polycystic Ovary Syndrome (PCOS) is a hormonal condition affecting 1 in 10 women of reproductive age. It affects how the ovaries work and is one of the most common causes of irregular periods and fertility issues in India.',
  },
  {
    q: 'Is PCOS curable?',
    a: 'PCOS is manageable, not curable. With the right lifestyle changes and sometimes medication, most women with PCOS live completely normal lives. Early diagnosis helps significantly.',
  },
  {
    q: 'Can PCOS affect my future?',
    a: 'Untreated PCOS can increase the risk of type 2 diabetes, high blood pressure, and endometrial cancer over time. But these risks are greatly reduced with proper management and regular check-ups.',
  },
  {
    q: 'What\'s the first step if I\'m concerned?',
    a: 'See a gynaecologist. Diagnosis involves a blood test (hormone levels) and an ultrasound. Free or subsidised consultations are available at government hospitals. This app does not diagnose — only a doctor can.',
  },
  {
    q: 'Is irregular period always PCOS?',
    a: 'No. Irregular periods can be caused by stress, thyroid issues, extreme weight changes, over-exercise, or other hormonal issues. PCOS is one of many causes. Tracking and seeing a doctor is the right step.',
  },
]

const RISK_COLORS = {
  low:      { bg: Colors.successLight, border: Colors.success + '40', text: Colors.success, label: '✓ Low risk indicators' },
  moderate: { bg: Colors.warningLight, border: Colors.warning + '40', text: Colors.warning, label: '⚠ Moderate indicators' },
  high:     { bg: Colors.dangerLight,  border: Colors.dangerBorder,   text: Colors.danger,  label: '⚠ Several indicators present' },
}

export default function PCOSScreen() {
  const [risk,    setRisk]    = useState<Awaited<ReturnType<typeof getPCOSRiskIndicators>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    getPCOSRiskIndicators().then(r => { setRisk(r); setLoading(false) })
  }, [])

  const riskColors = risk ? RISK_COLORS[risk.riskLevel] : null

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>PCOS Information</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View entering={FadeIn.duration(400)} style={s.hero}>
          <Text style={s.heroIcon}>🔬</Text>
          <Text style={s.heroTitle}>PCOS Checker</Text>
          <Text style={s.heroBody}>
            Based on your logged symptoms and cycle patterns, here's what your data suggests. This is not a medical diagnosis.
          </Text>
        </Animated.View>

        {/* Risk result */}
        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={Colors.teal} size="large" />
            <Text style={s.loadingText}>Analysing your data...</Text>
          </View>
        ) : risk && riskColors ? (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[s.riskCard, { backgroundColor: riskColors.bg, borderColor: riskColors.border }]}
          >
            <Text style={[s.riskLabel, { color: riskColors.text }]}>{riskColors.label}</Text>
            <Text style={s.riskSuggestion}>{risk.suggestion}</Text>

            {risk.hasFrequentSymptoms.length > 0 && (
              <View style={s.riskSymptoms}>
                <Text style={s.riskSymptomsTitle}>Frequently logged symptoms:</Text>
                <View style={s.symptomTags}>
                  {risk.hasFrequentSymptoms.map(sym => (
                    <View key={sym} style={[s.symptomTag, { borderColor: riskColors.border }]}>
                      <Text style={[s.symptomTagText, { color: riskColors.text }]}>{sym}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {risk.hasIrregularCycles && (
              <View style={s.irregularNote}>
                <Text style={s.irregularText}>
                  📅 Your average cycle length is outside the typical 21-35 day range, which may be worth discussing with a doctor.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={s.bookBtn}
              onPress={() => Linking.openURL('https://www.nhp.gov.in/healthlyliving/womens-health')}
            >
              <Text style={s.bookBtnText}>Find a gynaecologist near you →</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={s.noDataCard}>
            <Text style={s.noDataText}>
              Log at least 2-3 cycles of data to see your PCOS indicators. Tap the calendar on the Health tab to start logging.
            </Text>
            <TouchableOpacity style={s.startLoggingBtn} onPress={() => router.back()}>
              <Text style={s.startLoggingText}>Start logging →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            ⚕️ This is informational only. Abhaya does not diagnose medical conditions. Always consult a qualified doctor for any health concerns.
          </Text>
        </View>

        {/* PCOS Facts */}
        <Text style={s.factsTitle}>Understanding PCOS</Text>
        {PCOS_FACTS.map((fact, i) => (
          <Animated.View
            key={i}
            entering={FadeInDown.delay(i * 60).duration(400)}
            style={s.factCard}
          >
            <TouchableOpacity
              style={s.factHeader}
              onPress={() => setExpanded(expanded === i ? null : i)}
            >
              <Text style={s.factQ}>{fact.q}</Text>
              <Text style={s.factChevron}>{expanded === i ? '↑' : '↓'}</Text>
            </TouchableOpacity>
            {expanded === i && (
              <Animated.View entering={FadeInDown.duration(250)}>
                <Text style={s.factA}>{fact.a}</Text>
              </Animated.View>
            )}
          </Animated.View>
        ))}

        {/* When to see a doctor */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={s.doctorCard}>
          <Text style={s.doctorTitle}>See a doctor if you have:</Text>
          {[
            'Periods less than 21 days or more than 35 days apart',
            'Missed 3+ periods in a row without pregnancy',
            'Unusually heavy or painful periods',
            'Unexplained weight gain or hair loss',
            'Difficulty getting pregnant after 12 months of trying',
          ].map((item, i) => (
            <View key={i} style={s.doctorRow}>
              <Text style={s.doctorDot}>·</Text>
              <Text style={s.doctorText}>{item}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={s.nalsakBtn}
            onPress={() => Linking.openURL('tel:104')}
          >
            <Text style={s.nalsakBtnText}>📞 Health helpline: 104 (free)</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' },

  hero:     { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  heroIcon: { fontSize: 48 },
  heroTitle:{ fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  heroBody: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },

  loadingWrap: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing['3x'] },
  loadingText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },

  riskCard: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md },
  riskLabel:      { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, },
  riskSuggestion: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  riskSymptoms:   { gap: Spacing.sm },
  riskSymptomsTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.textPrimary },
  symptomTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  symptomTag:  { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
  symptomTagText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs },
  irregularNote: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.lg,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  irregularText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18 },
  bookBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  bookBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  noDataCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg, alignItems: 'center',
  },
  noDataText:       { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, textAlign: 'center', lineHeight: 21 },
  startLoggingBtn:  { backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.sm },
  startLoggingText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  disclaimer: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.teal + '30',
  },
  disclaimerText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'AA', textAlign: 'center', lineHeight: 18 },

  factsTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textMuted, letterSpacing: 0.8, textTransform: 'uppercase' },
  factCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, overflow: 'hidden',
  },
  factHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, gap: Spacing.md,
  },
  factQ:       { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1, lineHeight: 20 },
  factChevron: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.base, color: Colors.textMuted },
  factA: {
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.md,
  },

  doctorCard: {
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  doctorTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
  doctorRow:   { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  doctorDot:   { color: Colors.danger, fontSize: FontSize.base, lineHeight: 20 },
  doctorText:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.danger + 'CC', lineHeight: 20, flex: 1 },
  nalsakBtn: {
    backgroundColor: Colors.danger + '20', borderRadius: Radius.full,
    paddingVertical: Spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: Colors.dangerBorder,
    marginTop: Spacing.sm,
  },
  nalsakBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
})
