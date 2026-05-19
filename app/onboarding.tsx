import { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, Dimensions, ScrollView,
  TouchableOpacity, SafeAreaView,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import { setOnboarded, setLanguage, type Language } from '@/lib/storage'
import { useAppStore } from '@/store/app'

const { width } = Dimensions.get('window')

const SLIDES = [
  {
    emoji: '🛡️',
    title: 'The app that has your back',
    body:  'Safety guide, legal rights AI, evidence vault, safety map — everything you need, in one place. Built for when the system fails you.',
  },
  {
    emoji: '⚖️',
    title: 'Know your rights',
    body:  'Ask about your legal rights in plain language. Police refusing your FIR? Workplace harassment? Domestic violence? Get real answers, instantly.',
  },
  {
    emoji: '🔒',
    title: 'Your data is yours',
    body:  'No ads. No data selling. Evidence is encrypted with a key only you hold. Core features work completely offline. We can\'t read your files even if we wanted to.',
  },
]

const LANGUAGES: { code: Language; label: string; native: string }[] = [
  { code: 'en', label: 'English',    native: 'English'    },
  { code: 'hi', label: 'Hindi',      native: 'हिंदी'       },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ'       },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்'       },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు'      },
  { code: 'bn', label: 'Bengali',    native: 'বাংলা'       },
]

export default function Onboarding() {
  const [slide,   setSlide]   = useState(0)
  const [lang,    setLang]    = useState<Language>('en')
  const [phase,   setPhase]   = useState<'slides' | 'language'>('slides')
  const scrollRef = useRef<ScrollView>(null)
  const store     = useAppStore()

  function nextSlide() {
    if (slide < SLIDES.length - 1) {
      const next = slide + 1
      setSlide(next)
      scrollRef.current?.scrollTo({ x: next * width, animated: true })
    } else {
      setPhase('language')
    }
  }

  async function finish() {
    await Promise.all([setOnboarded(), setLanguage(lang)])
    store.setOnboarded(true)
    store.setLanguage(lang)
    router.replace('/tabs')
  }

  if (phase === 'language') {
    return (
      <SafeAreaView style={styles.safe}>
        <Animated.View entering={FadeIn.duration(400)} style={styles.langContainer}>
          <Text style={styles.langTitle}>Choose your language</Text>
          <Text style={styles.langSub}>You can change this later in settings</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLang(l.code)}
                style={[styles.langCard, lang === l.code && styles.langCardActive]}
              >
                <Text style={[styles.langNative, lang === l.code && styles.langNativeActive]}>
                  {l.native}
                </Text>
                <Text style={styles.langLabel}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.finishBtn} onPress={finish}>
            <Text style={styles.finishLabel}>Get started →</Text>
          </TouchableOpacity>
          <Text style={styles.noAccount}>No account required. Ever.</Text>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.slideWrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={styles.emoji}>
                {s.emoji}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.slideTitle}>
                {s.title}
              </Animated.Text>
              <Animated.Text entering={FadeInDown.delay(300).duration(600)} style={styles.slideBody}>
                {s.body}
              </Animated.Text>
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, slide === i && styles.dotActive]} />
          ))}
        </View>

        {/* CTA */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity style={styles.nextBtn} onPress={nextSlide}>
            <Text style={styles.nextLabel}>
              {slide < SLIDES.length - 1 ? 'Next' : 'Choose language →'}
            </Text>
          </TouchableOpacity>
          {slide < SLIDES.length - 1 && (
            <TouchableOpacity onPress={() => setPhase('language')}>
              <Text style={styles.skip}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  // Slides
  slideWrap: { flex: 1, justifyContent: 'space-between' },
  slide: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['3x'],
    paddingTop:     Spacing['6x'],
  },
  emoji:      { fontSize: 72, marginBottom: Spacing['3x'] },
  slideTitle: {
    fontFamily:  'Lora-SemiBold',
    fontSize:    FontSize['2xl'],
    color:       Colors.textPrimary,
    textAlign:   'center',
    marginBottom:Spacing.lg,
    lineHeight:  36,
  },
  slideBody: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.base,
    color:      Colors.textSecond,
    textAlign:  'center',
    lineHeight: 24,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingBottom: Spacing.xl },
  dot:       { width: 6,  height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: Colors.tealGlow  },
  ctaWrap: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3x'], gap: Spacing.md },
  nextBtn: {
    backgroundColor: Colors.teal,
    borderRadius:    Radius.full,
    paddingVertical: Spacing.lg,
    alignItems:      'center',
  },
  nextLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
  skip: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.sm,
    color:      Colors.textMuted,
    textAlign:  'center',
    paddingVertical: Spacing.sm,
  },

  // Language
  langContainer: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['4x'],
  },
  langTitle: {
    fontFamily:   'Lora-SemiBold',
    fontSize:     FontSize['2xl'],
    color:        Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  langSub: {
    fontFamily:   'DMSans-Regular',
    fontSize:     FontSize.sm,
    color:        Colors.textMuted,
    marginBottom: Spacing['3x'],
  },
  langGrid: {
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            Spacing.sm,
    marginBottom:   Spacing['3x'],
  },
  langCard: {
    width:           (width - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    backgroundColor: Colors.cardBg,
    borderWidth:     1,
    borderColor:     Colors.border,
    borderRadius:    Radius.lg,
    padding:         Spacing.md,
    alignItems:      'center',
    gap:             Spacing.xs,
  },
  langCardActive: {
    backgroundColor: Colors.tealDim,
    borderColor:     Colors.teal,
  },
  langNative: {
    fontFamily: 'DMSans-Medium',
    fontSize:   FontSize.md,
    color:      Colors.textPrimary,
  },
  langNativeActive: { color: Colors.tealGlow },
  langLabel: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
  },
  finishBtn: {
    backgroundColor: Colors.teal,
    borderRadius:    Radius.full,
    paddingVertical: Spacing.lg,
    alignItems:      'center',
    marginBottom:    Spacing.md,
  },
  finishLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
  noAccount: {
    fontFamily: 'DMSans-Regular',
    fontSize:   FontSize.xs,
    color:      Colors.textMuted,
    textAlign:  'center',
  },
})
