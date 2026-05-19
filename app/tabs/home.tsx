import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking } from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { useAppStore } from '@/store/app'
import { EMERGENCY_STEPS } from '@/constants/guide-data'

const QUICK_ACTIONS = [
  { icon: '🛡️', label: 'Emergency\nGuide',  sub: 'Offline · 7 steps',         route: '/tabs/guide'  },
  { icon: '⚖️', label: 'Legal\nRights AI',  sub: 'Ask anything',               route: '/tabs/legal'  },
  { icon: '📋', label: 'FIR\nEscalator',    sub: 'Generate letters',            route: '/tabs/fir'    },
  { icon: '🔒', label: 'Evidence\nVault',   sub: 'Coming soon',                 route: null           },
  { icon: '🗺️', label: 'Safety\nMap',       sub: 'Coming soon',                 route: null           },
  { icon: '💬', label: 'Safe\nSpace',        sub: 'Coming soon',                 route: null           },
]

const HELPLINES = [
  { label: 'Emergency',     number: '112',        color: Colors.danger },
  { label: 'Women Helpline', number: '1091',       color: Colors.teal   },
  { label: 'NCW',           number: '181',         color: Colors.tealMid},
  { label: 'NALSA',         number: '15100',       color: Colors.teal   },
]

export default function Home() {
  const { completedSteps } = useAppStore()
  const progress = (completedSteps.length / EMERGENCY_STEPS.length) * 100

  function callNumber(n: string) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    Linking.openURL(`tel:${n}`)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).duration(500)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome to</Text>
            <Text style={styles.appName}>Abhaya 🛡️</Text>
          </View>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => {}}>
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* SOS Banner */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <TouchableOpacity
            style={styles.sosBanner}
            onPress={() => callNumber('112')}
            activeOpacity={0.85}
          >
            <View>
              <Text style={styles.sosLabel}>🚨 Emergency SOS</Text>
              <Text style={styles.sosSub}>Tap to call 112 immediately</Text>
            </View>
            <Text style={styles.sosArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Guide progress */}
        {completedSteps.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.progressCard}>
            <Text style={styles.progressTitle}>Emergency guide progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {completedSteps.length} of {EMERGENCY_STEPS.length} steps completed
            </Text>
          </Animated.View>
        )}

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.grid}>
            {QUICK_ACTIONS.map((a, i) => (
              <TouchableOpacity
                key={a.label}
                style={[styles.actionCard, !a.route && styles.actionCardDim]}
                onPress={() => a.route && router.push(a.route as any)}
                activeOpacity={a.route ? 0.75 : 1}
              >
                <Text style={styles.actionIcon}>{a.icon}</Text>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionSub}>{a.sub}</Text>
                {!a.route && (
                  <View style={styles.soonBadge}>
                    <Text style={styles.soonText}>Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Helplines */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={styles.sectionTitle}>Important helplines</Text>
          <View style={styles.helplines}>
            {HELPLINES.map(h => (
              <TouchableOpacity
                key={h.number}
                style={styles.helplineCard}
                onPress={() => callNumber(h.number)}
              >
                <Text style={styles.helplineLabel}>{h.label}</Text>
                <Text style={[styles.helplineNumber, { color: h.color }]}>{h.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Privacy note */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)} style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒 No account required. No data shared with police. Evidence vault keys stay on your device only.
          </Text>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.xl },

  // Header
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    paddingTop:     Spacing.md,
  },
  greeting: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
  },
  appName: {
    fontFamily: 'Lora-SemiBold',
    fontSize:   FontSize.xl,
    color:      Colors.textPrimary,
  },
  settingsBtn: {
    width:  40, height: 40,
    borderRadius:    Radius.md,
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    alignItems:      'center',
    justifyContent:  'center',
  },

  // SOS Banner
  sosBanner: {
    backgroundColor: Colors.dangerLight,
    borderWidth:     1,
    borderColor:     Colors.dangerBorder,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
  },
  sosLabel: {
    fontFamily:   'DMSans-SemiBold',
    fontSize:     FontSize.md,
    color:        Colors.danger,
    marginBottom: Spacing.xs,
  },
  sosSub:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.danger + 'AA' },
  sosArrow: { fontSize: FontSize.xl, color: Colors.danger },

  // Progress
  progressCard: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.xl,
    gap:             Spacing.sm,
  },
  progressTitle: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textPrimary },
  progressBar:   {
    height: 4, backgroundColor: Colors.border,
    borderRadius: Radius.full, overflow: 'hidden',
  },
  progressFill: {
    height: 4, backgroundColor: Colors.teal, borderRadius: Radius.full,
  },
  progressText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },

  // Section title
  sectionTitle: {
    fontFamily:   'DMSans-SemiBold',
    fontSize:     FontSize.sm,
    color:        Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom:  -Spacing.sm,
  },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  actionCard: {
    width:           '31%',
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    padding:         Spacing.md,
    gap:             Spacing.xs,
    position:        'relative',
    overflow:        'hidden',
  },
  actionCardDim: { opacity: 0.6 },
  actionIcon:    { fontSize: 22, marginBottom: Spacing.xs },
  actionLabel:   {
    fontFamily: 'DMSans-SemiBold',
    fontSize:   FontSize.xs,
    color:      Colors.textPrimary,
    lineHeight: 16,
  },
  actionSub: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs - 1,
    color:      Colors.textMuted,
  },
  soonBadge: {
    position:        'absolute',
    top:             Spacing.xs,
    right:           Spacing.xs,
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.sm,
    paddingHorizontal: 5,
    paddingVertical:   2,
  },
  soonText: { fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.tealGlow },

  // Helplines
  helplines:     { gap: Spacing.sm },
  helplineCard: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
  },
  helplineLabel:  { fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm,  color: Colors.textSecond },
  helplineNumber: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.md },

  // Privacy
  privacyNote: {
    backgroundColor: Colors.tealDim,
    borderWidth:     1,
    borderColor:     Colors.teal + '30',
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
  },
  privacyText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.tealGlow + 'AA',
    lineHeight: 18,
    textAlign:  'center',
  },
})
