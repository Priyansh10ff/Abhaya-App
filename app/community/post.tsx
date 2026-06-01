import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, ActivityIndicator, Linking,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { submitPost, CATEGORIES, CRISIS_RESOURCES, type Category } from '@/lib/community'
import { analyzeCrisisLevel, quickCrisisCheck }                    from '@/lib/crisis-detect'

export default function NewPostScreen() {
  const [content,   setContent]   = useState('')
  const [category,  setCategory]  = useState<Category>('general')
  const [posting,   setPosting]   = useState(false)
  const [step,      setStep]      = useState<'write' | 'crisis' | 'done'>('write')
  const [crisisLvl, setCrisisLvl] = useState(0)

  const charLeft = 500 - content.length

  async function handlePost() {
    if (!content.trim() || content.trim().length < 10) {
      Alert.alert('Too short', 'Please write at least 10 characters.')
      return
    }

    setPosting(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    // Quick local check first (no API call)
    const quickLevel = quickCrisisCheck(content)

    // If potentially concerning, do full AI analysis
    let finalLevel = quickLevel
    if (quickLevel >= 1) {
      const analysis = await analyzeCrisisLevel(content)
      finalLevel     = analysis.level
    }

    setCrisisLvl(finalLevel)

    // If crisis detected — show resources first
    if (finalLevel >= 2) {
      setPosting(false)
      setStep('crisis')
      return
    }

    // Otherwise post directly
    await doPost(finalLevel)
  }

  async function doPost(level: number) {
    setPosting(true)
    const result = await submitPost({
      content:      content.trim(),
      category,
      crisis_level: level as any,
    })
    setPosting(false)

    if (result) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setStep('done')
    } else {
      Alert.alert('Could not post', 'Check your connection and try again.')
    }
  }

  // ── DONE screen ──────────────────────────────────────
  if (step === 'done') {
    return (
      <SafeAreaView style={s.safe}>
        <Animated.View entering={FadeIn.duration(500)} style={s.doneWrap}>
          <Text style={s.doneIcon}>💙</Text>
          <Text style={s.doneTitle}>Posted anonymously</Text>
          <Text style={s.doneBody}>
            No one can see who you are. Your post is visible to the community. You are not alone in this.
          </Text>
          <TouchableOpacity style={s.doneCta} onPress={() => router.replace('/tabs/community' as any)}>
            <Text style={s.doneCtaText}>See the community →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={s.doneBack}>
            <Text style={s.doneBackText}>Back</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    )
  }

  // ── CRISIS screen ────────────────────────────────────
  if (step === 'crisis') {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.crisisContent}>
          <Animated.View entering={FadeIn.duration(400)} style={s.crisisWrap}>
            <Text style={s.crisisIcon}>{crisisLvl === 3 ? '🆘' : '💙'}</Text>
            <Text style={s.crisisTitle}>
              {crisisLvl === 3
                ? 'It sounds like you might be in crisis'
                : 'We noticed you might be going through something difficult'
              }
            </Text>
            <Text style={s.crisisBody}>
              {crisisLvl === 3
                ? 'Before we post this, we want to make sure you\'re safe. Please reach out to someone who can help right now.'
                : 'Your post will be shared with the community. There are also people you can talk to right now who are trained to help.'
              }
            </Text>

            {/* Crisis resources */}
            <View style={s.resourcesCard}>
              <Text style={s.resourcesTitle}>Talk to someone now</Text>
              {CRISIS_RESOURCES.map(r => (
                <TouchableOpacity
                  key={r.number}
                  style={s.resourceRow}
                  onPress={() => Linking.openURL(`tel:${r.number}`)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.resourceName}>{r.name}</Text>
                    <Text style={s.resourceAvail}>{r.available}</Text>
                  </View>
                  <Text style={s.resourceNumber}>{r.number}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.postAnywayBtn, posting && { opacity: 0.6 }]}
              onPress={() => doPost(crisisLvl)}
              disabled={posting}
            >
              {posting
                ? <ActivityIndicator size="small" color={Colors.textMuted} />
                : <Text style={s.postAnywayText}>Post to community anyway</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => router.back()}>
              <Text style={s.cancelBtnText}>← Go back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── WRITE screen ─────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Share anonymously</Text>
        <TouchableOpacity
          style={[s.submitBtn, (!content.trim() || posting) && s.submitBtnDim]}
          onPress={handlePost}
          disabled={!content.trim() || posting}
        >
          {posting
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={s.submitBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Anonymous note */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.anonCard}>
          <Text style={s.anonText}>
            🔒 Anonymous · No name · No account · No one in your life will see this
          </Text>
        </Animated.View>

        {/* Category */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Category</Text>
          <View style={s.catGrid}>
            {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
              <TouchableOpacity
                key={key}
                style={[s.catCard, category === key && s.catCardActive, category === key && { borderColor: cat.color + '80' }]}
                onPress={() => { setCategory(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              >
                <Text style={s.catCardIcon}>{cat.icon}</Text>
                <Text style={[s.catCardLabel, category === key && { color: cat.color }]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Content */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>What's on your mind?</Text>
          <TextInput
            style={s.textArea}
            value={content}
            onChangeText={setContent}
            placeholder="Share what you're going through. Ask for help. You don't have to face this alone.

No names. No identifying details. Just what you need to say."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={500}
            autoFocus
            textAlignVertical="top"
          />
          <Text style={[s.charCount, charLeft < 50 && { color: Colors.warning }]}>
            {charLeft} characters left
          </Text>
        </View>

        {/* Community guidelines */}
        <View style={s.guidelinesCard}>
          <Text style={s.guidelinesTitle}>Community guidelines</Text>
          {[
            'Be kind — everyone here is going through something',
            'No identifying info about yourself or others',
            'No advice that could put someone in danger',
            'Crisis resources are always available — 181, 1091, 9152987821',
          ].map((g, i) => (
            <View key={i} style={s.guidelineRow}>
              <Text style={s.guidelineDot}>·</Text>
              <Text style={s.guidelineText}>{g}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.xl },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:      { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:     { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle:     { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  submitBtn:    { backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  submitBtnDim: { opacity: 0.4 },
  submitBtnText:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  anonCard: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.teal + '30',
  },
  anonText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'BB', textAlign: 'center' },

  section:       { gap: Spacing.md },
  sectionLabel:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },

  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  catCardActive: { backgroundColor: Colors.dark3 },
  catCardIcon:   { fontSize: 14 },
  catCardLabel:  { fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.textSecond },

  textArea: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.base,
    color: Colors.textPrimary, minHeight: 180, lineHeight: 24,
  },
  charCount: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },

  guidelinesCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm,
  },
  guidelinesTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  guidelineRow:    { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  guidelineDot:    { color: Colors.tealGlow, fontSize: FontSize.base, lineHeight: 20 },
  guidelineText:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18, flex: 1 },

  // Crisis screen
  crisisContent: { flexGrow: 1, padding: Spacing.xl },
  crisisWrap:    { flex: 1, alignItems: 'center', gap: Spacing.xl, paddingTop: Spacing['4x'] },
  crisisIcon:    { fontSize: 52 },
  crisisTitle:   { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl, color: Colors.textPrimary, textAlign: 'center', lineHeight: 30 },
  crisisBody:    { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, textAlign: 'center', lineHeight: 22 },
  resourcesCard: {
    width: '100%', backgroundColor: Colors.dangerLight, borderRadius: Radius.xl,
    padding: Spacing.xl, gap: Spacing.md, borderWidth: 1, borderColor: Colors.dangerBorder,
  },
  resourcesTitle:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },
  resourceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.dangerBorder + '50',
  },
  resourceName:    { fontFamily: 'DMSans-Medium',   fontSize: FontSize.sm, color: Colors.danger        },
  resourceAvail:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.danger + 'AA' },
  resourceNumber:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.danger      },
  postAnywayBtn:   { borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.md },
  postAnywayText:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },
  cancelBtn:       { paddingVertical: Spacing.md },
  cancelBtnText:   { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },

  // Done screen
  doneWrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3x'], gap: Spacing.xl },
  doneIcon:    { fontSize: 56 },
  doneTitle:   { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  doneBody:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },
  doneCta: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.md,
  },
  doneCtaText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
  doneBack:    { paddingVertical: Spacing.sm },
  doneBackText:{ fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },
})
