import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { EMERGENCY_STEPS, GUIDE_INTRO } from '@/constants/guide-data'
import { useAppStore } from '@/store/app'

export default function GuideTab() {
  const { completedSteps } = useAppStore()

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.offlineBadge}>📶 Works offline</Text>
          </View>
          <Text style={styles.title}>{GUIDE_INTRO.title}</Text>
          <Text style={styles.subtitle}>{GUIDE_INTRO.subtitle}</Text>
        </Animated.View>

        {/* Emergency call banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.emergencyBanner}>
          <Text style={styles.emergencyText}>⚠️ {GUIDE_INTRO.warning}</Text>
        </Animated.View>

        {/* Progress */}
        <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.progressRow}>
          <Text style={styles.progressText}>
            {completedSteps.length}/{EMERGENCY_STEPS.length} steps completed
          </Text>
          <View style={styles.progressBarWrap}>
            <View style={[styles.progressFill, { width: `${(completedSteps.length / EMERGENCY_STEPS.length) * 100}%` }]} />
          </View>
        </Animated.View>

        {/* Steps list */}
        <View style={styles.steps}>
          {EMERGENCY_STEPS.map((step, i) => {
            const done = completedSteps.includes(step.id)
            return (
              <Animated.View key={step.id} entering={FadeInDown.delay(200 + i * 60).duration(500)}>
                <TouchableOpacity
                  style={[styles.stepCard, done && styles.stepCardDone]}
                  onPress={() => router.push(`/guide/${step.id}` as any)}
                  activeOpacity={0.8}
                >
                  {/* Left connector */}
                  <View style={styles.stepLeft}>
                    <View style={[styles.stepCircle, done && styles.stepCircleDone]}>
                      {done
                        ? <Text style={styles.checkmark}>✓</Text>
                        : <Text style={styles.stepNum}>{step.step}</Text>
                      }
                    </View>
                    {i < EMERGENCY_STEPS.length - 1 && (
                      <View style={[styles.connector, done && styles.connectorDone]} />
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.stepContent}>
                    <View style={styles.stepHeader}>
                      <Text style={styles.stepIcon}>{step.icon}</Text>
                      {step.timeLimit && (
                        <View style={styles.timeBadge}>
                          <Text style={styles.timeText}>{step.timeLimit}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.stepTitle, done && styles.stepTitleDone]}>{step.title}</Text>
                    <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
                  </View>

                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              </Animated.View>
            )
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },

  header: { gap: Spacing.sm, paddingTop: Spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  offlineBadge: {
    fontFamily:   'DMSans-Medium',
    fontSize:     FontSize.xs,
    color:        Colors.tealGlow,
    backgroundColor: Colors.tealDim,
    borderWidth:  1,
    borderColor:  Colors.teal + '40',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.xs,
  },
  title: {
    fontFamily: 'Lora-SemiBold',
    fontSize:   FontSize['2xl'],
    color:      Colors.textPrimary,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.sm,
    color:      Colors.textSecond,
    lineHeight: 21,
  },

  emergencyBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth:     1,
    borderColor:     Colors.dangerBorder,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
  },
  emergencyText: {
    fontFamily: 'DMSans-Medium',
    fontSize:   FontSize.sm,
    color:      Colors.danger,
    textAlign:  'center',
  },

  progressRow: { gap: Spacing.sm },
  progressText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },
  progressBarWrap: {
    height: 3, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: { height: 3, backgroundColor: Colors.teal, borderRadius: Radius.full },

  steps: { gap: 0 },
  stepCard: {
    flexDirection:   'row',
    alignItems:      'flex-start',
    gap:             Spacing.md,
    paddingVertical: Spacing.md,
  },
  stepCardDone: { opacity: 0.7 },

  stepLeft:     { alignItems: 'center', width: 32 },
  stepCircle: {
    width:           32, height: 32,
    borderRadius:    16,
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },
  stepCircleDone: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkmark:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },
  stepNum:    { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.textSecond },
  connector:  { width: 1, flex: 1, minHeight: 16, backgroundColor: Colors.border, marginTop: 4 },
  connectorDone: { backgroundColor: Colors.teal + '60' },

  stepContent: { flex: 1, gap: Spacing.xs, paddingBottom: Spacing.lg },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepIcon:    { fontSize: 20 },
  timeBadge: {
    backgroundColor: Colors.dangerLight,
    borderRadius:    Radius.sm,
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
  },
  timeText: { fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.danger },

  stepTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22 },
  stepTitleDone: { textDecorationLine: 'line-through', color: Colors.textMuted },
  stepSubtitle:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 20 },

  chevron: { fontSize: FontSize.xl, color: Colors.textMuted, alignSelf: 'center' },
})
