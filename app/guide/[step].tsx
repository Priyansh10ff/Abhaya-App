import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { EMERGENCY_STEPS } from '@/constants/guide-data'
import { useAppStore } from '@/store/app'
import { markStepComplete } from '@/lib/storage'

export default function GuideStep() {
  const { step: stepId }     = useLocalSearchParams<{ step: string }>()
  const { completedSteps, markStepComplete: markDone } = useAppStore()

  const stepIndex = EMERGENCY_STEPS.findIndex(s => s.id === stepId)
  const step      = EMERGENCY_STEPS[stepIndex]
  const nextStep  = EMERGENCY_STEPS[stepIndex + 1]
  const prevStep  = EMERGENCY_STEPS[stepIndex - 1]
  const isDone    = completedSteps.includes(step?.id ?? '')

  if (!step) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: Colors.textPrimary, padding: Spacing.xl }}>Step not found</Text>
      </SafeAreaView>
    )
  }

  async function handleComplete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await markStepComplete(step.id)
    markDone(step.id)
    if (nextStep) {
      router.replace(`/guide/${nextStep.id}` as any)
    } else {
      router.back()
    }
  }

  function handleCTA() {
    switch (step.ctaAction) {
      case 'find-hospital':
        Linking.openURL('https://maps.google.com/?q=government+hospital+near+me')
        break
      case 'open-vault':
        router.push('/tabs/more' as any)
        break
      case 'open-fir':
        router.push('/tabs/fir' as any)
        break
      case 'open-legal':
        router.push('/tabs/legal' as any)
        break
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.topProgress}>
          Step {step.step} of {EMERGENCY_STEPS.length}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Step hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>{step.icon}</Text>
          <View style={[styles.stepNumBadge]}>
            <Text style={styles.stepNumText}>Step {step.step}</Text>
          </View>
          <Text style={styles.heroTitle}>{step.title}</Text>
          <Text style={styles.heroSub}>{step.subtitle}</Text>
        </View>

        {/* Critical warning */}
        {step.critical && (
          <View style={styles.criticalBox}>
            <Text style={styles.criticalLabel}>⚠️ Critical</Text>
            <Text style={styles.criticalText}>{step.critical}</Text>
          </View>
        )}

        {/* Time limit */}
        {step.timeLimit && (
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>⏱ {step.timeLimit}</Text>
          </View>
        )}

        {/* Main body */}
        <View style={styles.bodyCard}>
          <Text style={styles.bodyText}>{step.body}</Text>
        </View>

        {/* Do list */}
        {step.doList && step.doList.length > 0 && (
          <View style={styles.listCard}>
            <Text style={styles.listTitle}>✅ What to do</Text>
            {step.doList.map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={styles.listDot}>•</Text>
                <Text style={styles.listItem}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Don't list */}
        {step.dontList && step.dontList.length > 0 && (
          <View style={[styles.listCard, styles.dontCard]}>
            <Text style={styles.listTitle}>🚫 Do NOT</Text>
            {step.dontList.map((item, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.listDot, { color: Colors.danger }]}>✗</Text>
                <Text style={[styles.listItem, { color: Colors.danger + 'DD' }]}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        {step.tip && (
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>💡 Know this</Text>
            <Text style={styles.tipText}>{step.tip}</Text>
          </View>
        )}

        {/* In-app CTA */}
        {step.ctaLabel && (
          <TouchableOpacity style={styles.ctaCard} onPress={handleCTA}>
            <Text style={styles.ctaLabel}>{step.ctaLabel} →</Text>
          </TouchableOpacity>
        )}

        {/* Navigation */}
        <View style={styles.navRow}>
          {prevStep && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => router.replace(`/guide/${prevStep.id}` as any)}
            >
              <Text style={styles.navBtnText}>← Previous</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.markDoneBtn, isDone && styles.markDoneBtnDone]}
            onPress={handleComplete}
          >
            <Text style={styles.markDoneText}>
              {isDone ? '✓ Done' : nextStep ? 'Mark done & next →' : 'Mark complete ✓'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },

  topBar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop:     Spacing.md,
    paddingBottom:  Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  topProgress: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },

  hero: { alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xl },
  heroIcon: { fontSize: 56 },
  stepNumBadge: {
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
  },
  stepNumText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow },
  heroTitle: {
    fontFamily: 'Lora-SemiBold',
    fontSize:   FontSize.xl,
    color:      Colors.textPrimary,
    textAlign:  'center',
    lineHeight: 30,
  },
  heroSub: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.base,
    color:      Colors.textSecond,
    textAlign:  'center',
    lineHeight: 22,
  },

  criticalBox: {
    backgroundColor: Colors.dangerLight,
    borderWidth:     1,
    borderColor:     Colors.dangerBorder,
    borderRadius:    Radius.lg,
    padding:         Spacing.lg,
    gap:             Spacing.sm,
  },
  criticalLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
  criticalText:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.danger + 'CC', lineHeight: 20 },

  timeBox: {
    backgroundColor: Colors.warningLight,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    alignSelf:         'flex-start',
    borderWidth: 1, borderColor: Colors.warning + '30',
  },
  timeLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.warning },

  bodyCard: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
  },
  bodyText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.base,
    color:      Colors.textSecond,
    lineHeight: 24,
  },

  listCard: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    gap:             Spacing.md,
  },
  dontCard: { borderColor: Colors.dangerBorder, backgroundColor: Colors.dangerLight + '22' },
  listTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  listRow:   { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  listDot:   { color: Colors.tealGlow, fontSize: FontSize.base, lineHeight: 22 },
  listItem:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 22, flex: 1 },

  tipCard: {
    backgroundColor: Colors.tealDim,
    borderWidth:     1,
    borderColor:     Colors.teal + '40',
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    gap:             Spacing.sm,
  },
  tipLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow },
  tipText:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.tealGlow + 'AA', lineHeight: 21 },

  ctaCard: {
    backgroundColor: Colors.teal,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    alignItems:      'center',
  },
  ctaLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },

  navRow:    { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  navBtn: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
  },
  navBtnText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textSecond },
  markDoneBtn: {
    flex:            1,
    backgroundColor: Colors.teal,
    borderRadius:    Radius.full,
    paddingVertical: Spacing.md,
    alignItems:      'center',
  },
  markDoneBtnDone: { backgroundColor: Colors.success + '30', borderWidth: 1, borderColor: Colors.success + '50' },
  markDoneText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },
})
