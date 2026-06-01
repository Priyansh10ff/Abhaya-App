import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { GOVT_SCHEMES, type GovtScheme } from '@/lib/health'

function SchemeCard({ scheme, index }: { scheme: GovtScheme; index: number }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)} style={s.card}>
      <TouchableOpacity
        onPress={() => { setExpanded(e => !e); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
        activeOpacity={0.8}
      >
        <View style={s.cardHeader}>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={s.schemeName}>{scheme.name}</Text>
            <Text style={s.ministry}>{scheme.ministry}</Text>
          </View>
          <Text style={s.chevron}>{expanded ? '↑' : '↓'}</Text>
        </View>
        <Text style={s.schemeDesc} numberOfLines={expanded ? undefined : 2}>
          {scheme.desc}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(250)} style={s.expandedContent}>
          <View style={s.divider} />
          <View style={s.eligibilityWrap}>
            <Text style={s.eligibilityLabel}>Who can apply</Text>
            <Text style={s.eligibilityText}>{scheme.eligibility}</Text>
          </View>
          {scheme.link && (
            <TouchableOpacity
              style={s.linkBtn}
              onPress={() => Linking.openURL(scheme.link!)}
            >
              <Text style={s.linkBtnText}>Learn more & apply →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </Animated.View>
  )
}

export default function SchemesScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Govt Health Schemes</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.duration(400)} style={s.intro}>
          <Text style={s.introTitle}>Free health benefits for women</Text>
          <Text style={s.introBody}>
            These government schemes exist and most women don't know about them. Tap each one to see if you're eligible.
          </Text>
        </Animated.View>

        {GOVT_SCHEMES.map((scheme, i) => (
          <SchemeCard key={scheme.name} scheme={scheme} index={i} />
        ))}

        <View style={s.helpCard}>
          <Text style={s.helpTitle}>Need help applying?</Text>
          <Text style={s.helpBody}>
            Visit your nearest Anganwadi centre, PHC (Primary Health Centre), or government hospital to access these schemes. They are free to apply for.
          </Text>
          <TouchableOpacity style={s.helpBtn} onPress={() => Linking.openURL('tel:104')}>
            <Text style={s.helpBtnText}>📞 Health helpline: 104 (free)</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.md },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' },

  intro: { gap: Spacing.sm, paddingTop: Spacing.sm },
  introTitle: { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.lg,  color: Colors.textPrimary },
  introBody:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },

  card: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, marginBottom: Spacing.sm },
  schemeName:   { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm,  color: Colors.textPrimary, lineHeight: 20 },
  ministry:     { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,  color: Colors.tealGlow    },
  chevron:      { fontSize: FontSize.lg, color: Colors.textMuted, paddingTop: 2 },
  schemeDesc:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm,  color: Colors.textSecond, lineHeight: 21 },
  expandedContent: { gap: Spacing.md },
  divider:      { height: 1, backgroundColor: Colors.border },
  eligibilityWrap: { gap: Spacing.xs },
  eligibilityLabel:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  eligibilityText: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 20 },
  linkBtn: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.teal + '40', paddingVertical: Spacing.sm, alignItems: 'center',
  },
  linkBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow },

  helpCard: {
    backgroundColor: Colors.tealDim, borderWidth: 1, borderColor: Colors.teal + '40',
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md, marginTop: Spacing.sm,
  },
  helpTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow },
  helpBody:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.tealGlow + 'AA', lineHeight: 21 },
  helpBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.sm, alignItems: 'center',
  },
  helpBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },
})
