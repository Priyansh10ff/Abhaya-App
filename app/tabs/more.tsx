import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking, Switch } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { useAppStore } from '@/store/app'
import { setLanguage as saveLanguage, type Language } from '@/lib/storage'

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi',   native: 'हिंदी'    },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ'    },
  { code: 'ta', label: 'Tamil',   native: 'தமிழ்'    },
  { code: 'te', label: 'Telugu',  native: 'తెలుగు'   },
  { code: 'bn', label: 'Bengali', native: 'বাংলা'    },
]

const HELPLINES = [
  { name: 'Emergency',              number: '112',        color: Colors.danger   },
  { name: 'Women Helpline',         number: '1091',       color: Colors.teal     },
  { name: 'NCW Helpline',           number: '181',        color: Colors.tealMid  },
  { name: 'NALSA (Free Legal Aid)', number: '15100',      color: Colors.teal     },
  { name: 'iCall Mental Health',    number: '9152987821', color: Colors.tealGlow },
  { name: 'Childline',              number: '1098',       color: Colors.warning  },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

function Row({ icon, label, sub, onPress, right }: {
  icon: string; label: string; sub?: string; onPress?: () => void; right?: React.ReactNode
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub && <Text style={s.rowSub}>{sub}</Text>}
      </View>
      {right ?? (onPress && <Text style={s.rowChevron}>›</Text>)}
    </TouchableOpacity>
  )
}

export default function MoreTab() {
  const { language, setLanguage } = useAppStore()

  function changeLang(code: Language) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    saveLanguage(code)
    setLanguage(code)
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Brand */}
        <View style={s.brand}>
          <Text style={s.brandIcon}>🛡️</Text>
          <Text style={s.brandName}>Abhaya</Text>
          <Text style={s.brandTagline}>The app that has your back</Text>
          <Text style={s.version}>v1.0.0 · Phase 1 MVP</Text>
        </View>

        {/* Language */}
        <Section title="Language">
          <View style={s.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langCard, language === l.code && s.langCardActive]}
                onPress={() => changeLang(l.code)}
              >
                <Text style={[s.langNative, language === l.code && s.langNativeActive]}>
                  {l.native}
                </Text>
                <Text style={s.langLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Helplines */}
        <Section title="Emergency helplines">
          <View style={s.card}>
            {HELPLINES.map((h, i) => (
              <TouchableOpacity
                key={h.number}
                style={[s.helplineRow, i < HELPLINES.length - 1 && s.helplineDivider]}
                onPress={() => Linking.openURL(`tel:${h.number}`)}
              >
                <Text style={s.helplineName}>{h.name}</Text>
                <Text style={[s.helplineNum, { color: h.color }]}>{h.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Coming soon features */}
        <Section title="Coming soon">
          <View style={s.card}>
            {[
              { icon: '🔒', label: 'Evidence Vault',       sub: 'Encrypted file storage with legal timestamps' },
              { icon: '🗺️', label: 'Safety Map',           sub: 'Crowd-sourced anonymous safety reports'       },
              { icon: '💬', label: 'Safe Space Community', sub: 'Anonymous peer support'                       },
              { icon: '🩺', label: 'Health Tracker',       sub: 'Period & PCOS tracking in your language'      },
              { icon: '💰', label: 'Credit Builder',       sub: 'Financial identity for informal workers'      },
            ].map((f, i) => (
              <View
                key={f.label}
                style={[s.comingRow, i > 0 && s.helplineDivider]}
              >
                <Text style={s.comingIcon}>{f.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.comingLabel}>{f.label}</Text>
                  <Text style={s.comingSub}>{f.sub}</Text>
                </View>
                <View style={s.soonBadge}>
                  <Text style={s.soonText}>Soon</Text>
                </View>
              </View>
            ))}
          </View>
        </Section>

        {/* About */}
        <Section title="About">
          <View style={s.card}>
            <Row icon="🌐" label="Visit abhaya.app"     onPress={() => Linking.openURL('https://abhaya.vercel.app')} />
            <View style={s.divider} />
            <Row icon="📋" label="Take the survey"      onPress={() => Linking.openURL('https://abhaya-survey.vercel.app')} />
            <View style={s.divider} />
            <Row icon="🔒" label="Privacy promise"      sub="No data shared. Ever." />
            <View style={s.divider} />
            <Row icon="📧" label="Contact the builder"  onPress={() => Linking.openURL('mailto:YOUR_EMAIL_HERE')} />
          </View>
        </Section>

        {/* Safety promise */}
        <View style={s.promise}>
          <Text style={s.promiseText}>
            🔒 No ads. No data selling. Evidence vault keys stay on your device only. Core features are always free. This app is built for you, not for anyone who wants information about you.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.xxl },

  brand: { alignItems: 'center', paddingTop: Spacing.xl, gap: Spacing.xs },
  brandIcon:    { fontSize: 40 },
  brandName:    { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.xl, color: Colors.textPrimary },
  brandTagline: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond  },
  version:      { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },

  section:      { gap: Spacing.md },
  sectionTitle: {
    fontFamily:    'DMSans-SemiBold',
    fontSize:      FontSize.xs,
    color:         Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  card: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.xl,
    overflow:        'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.xl },

  row: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
    gap:             Spacing.md,
  },
  rowIcon:    { fontSize: 18 },
  rowLabel:   { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.textPrimary },
  rowSub:     { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted,  marginTop: 2 },
  rowChevron: { fontSize: FontSize.lg, color: Colors.textMuted },

  // Language
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  langCard: {
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical:   Spacing.sm,
    alignItems:      'center',
    minWidth:        90,
    gap:             2,
  },
  langCardActive:   { borderColor: Colors.teal, backgroundColor: Colors.tealDim },
  langNative:       { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  langNativeActive: { color: Colors.tealGlow },
  langLabel:        { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },

  // Helplines
  helplineRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
  },
  helplineDivider: { borderTopWidth: 1, borderTopColor: Colors.border },
  helplineName:    { fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm, color: Colors.textPrimary },
  helplineNum:     { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base },

  // Coming soon
  comingRow: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical:   Spacing.md,
  },
  comingIcon:  { fontSize: 20 },
  comingLabel: { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.textPrimary },
  comingSub:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted,  marginTop: 2 },
  soonBadge: {
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.sm,
    paddingHorizontal: 7,
    paddingVertical:   3,
    borderWidth: 1,
    borderColor: Colors.teal + '40',
  },
  soonText: { fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.tealGlow },

  promise: {
    backgroundColor: Colors.tealDim,
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    borderWidth:     1,
    borderColor:     Colors.teal + '30',
  },
  promiseText: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.tealGlow + 'AA',
    lineHeight: 18,
    textAlign:  'center',
  },
})
