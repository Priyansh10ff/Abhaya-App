import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import * as Haptics  from 'expo-haptics'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { router } from 'expo-router'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  submitReport, CATEGORIES, TIME_OPTIONS,
  type Category, type TimeOfDay,
} from '@/lib/safety-map'

type Step = 'location' | 'category' | 'time' | 'describe' | 'done'

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1825' }] },
  { featureType: 'road',     elementType: 'geometry', stylers: [{ color: '#1e3040' }] },
  { featureType: 'water',    elementType: 'geometry', stylers: [{ color: '#050e1a' }] },
  { featureType: 'poi',      elementType: 'labels',   stylers: [{ visibility: 'off' }] },
]

export default function ReportScreen() {
  const [step,        setStep]        = useState<Step>('location')
  const [lat,         setLat]         = useState(12.9716)
  const [lng,         setLng]         = useState(77.5946)
  const [category,    setCategory]    = useState<Category | null>(null)
  const [timeOfDay,   setTimeOfDay]   = useState<TimeOfDay>('any')
  const [description, setDescription] = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [locating,    setLocating]    = useState(false)

  const steps: Step[] = ['location', 'category', 'time', 'describe', 'done']
  const stepIdx        = steps.indexOf(step)

  async function useMyLocation() {
    setLocating(true)
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Enable location to pin your current spot.')
      setLocating(false)
      return
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    setLat(loc.coords.latitude)
    setLng(loc.coords.longitude)
    setLocating(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  function next() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }

  function back() {
    const idx = steps.indexOf(step)
    if (idx > 0) setStep(steps[idx - 1])
    else router.back()
  }

  async function handleSubmit() {
    if (!category) return
    setSubmitting(true)
    const success = await submitReport({
      lat, lng, category, time_of_day: timeOfDay,
      description: description.trim() || undefined,
    })
    setSubmitting(false)
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setStep('done')
    } else {
      Alert.alert('Could not submit', 'Check your connection and try again.')
    }
  }

  if (step === 'done') {
    return (
      <SafeAreaView style={s.safe}>
        <Animated.View entering={FadeInDown.duration(500)} style={s.doneWrap}>
          <Text style={s.doneIcon}>🙏</Text>
          <Text style={s.doneTitle}>Thank you for reporting</Text>
          <Text style={s.doneBody}>
            Your anonymous report helps other women know about this area. Every pin on the map is a woman who took a moment to protect someone else.
          </Text>
          <View style={s.doneBadge}>
            <Text style={s.doneBadgeText}>🔒 Submitted anonymously — no account, no trace</Text>
          </View>
          <TouchableOpacity style={s.doneCta} onPress={() => router.back()}>
            <Text style={s.doneCtaText}>Back to map →</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={back} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Report unsafe spot</Text>
        <Text style={s.topStep}>{stepIdx + 1}/{steps.length - 1}</Text>
      </View>

      {/* Progress */}
      <View style={s.progressRow}>
        {steps.slice(0, -1).map((st, i) => (
          <View key={st} style={[s.progressSeg, i <= stepIdx && s.progressSegActive]} />
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── STEP 1: Location ── */}
        {step === 'location' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.stepWrap}>
            <Text style={s.stepTitle}>Where did this happen?</Text>
            <Text style={s.stepSub}>Drag the map to adjust the pin to the exact location.</Text>

            <View style={s.mapContainer}>
              <MapView
                style={s.miniMap}
                provider={PROVIDER_GOOGLE}
                customMapStyle={DARK_MAP_STYLE}
                region={{ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                onRegionChangeComplete={r => { setLat(r.latitude); setLng(r.longitude) }}
              >
                <Marker coordinate={{ latitude: lat, longitude: lng }}>
                  <View style={s.mapPin}>
                    <Text style={{ fontSize: 24 }}>📍</Text>
                  </View>
                </Marker>
              </MapView>
              <View style={s.mapPinCenter} pointerEvents="none">
                <Text style={{ fontSize: 28 }}>📍</Text>
              </View>
            </View>

            <TouchableOpacity style={s.myLocBtn} onPress={useMyLocation} disabled={locating}>
              {locating
                ? <ActivityIndicator size="small" color={Colors.tealGlow} />
                : <Text style={s.myLocText}>📍 Use my current location</Text>
              }
            </TouchableOpacity>

            <View style={s.coordRow}>
              <Text style={s.coordText}>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </Text>
            </View>

            <TouchableOpacity style={s.nextBtn} onPress={next}>
              <Text style={s.nextBtnText}>Confirm location →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── STEP 2: Category ── */}
        {step === 'category' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.stepWrap}>
            <Text style={s.stepTitle}>What happened?</Text>
            <Text style={s.stepSub}>Choose the option that best describes the incident.</Text>

            <View style={s.optList}>
              {(Object.entries(CATEGORIES) as [Category, typeof CATEGORIES[Category]][]).map(([key, cat]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.optCard, category === key && s.optCardActive, category === key && { borderColor: cat.color + '80' }]}
                  onPress={() => { setCategory(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
                >
                  <Text style={s.optIcon}>{cat.icon}</Text>
                  <Text style={[s.optLabel, category === key && { color: cat.color }]}>
                    {cat.label}
                  </Text>
                  {category === key && <Text style={[s.optCheck, { color: cat.color }]}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[s.nextBtn, !category && s.nextBtnDim]}
              onPress={next}
              disabled={!category}
            >
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── STEP 3: Time ── */}
        {step === 'time' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.stepWrap}>
            <Text style={s.stepTitle}>When did this happen?</Text>
            <Text style={s.stepSub}>This helps women know which times to be extra careful.</Text>

            <View style={s.optList}>
              {(Object.entries(TIME_OPTIONS) as [TimeOfDay, string][]).map(([key, label]) => (
                <TouchableOpacity
                  key={key}
                  style={[s.optCard, timeOfDay === key && s.optCardActive]}
                  onPress={() => { setTimeOfDay(key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
                >
                  <Text style={s.optLabel}>{label}</Text>
                  {timeOfDay === key && <Text style={s.optCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={s.nextBtn} onPress={next}>
              <Text style={s.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── STEP 4: Description ── */}
        {step === 'describe' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.stepWrap}>
            <Text style={s.stepTitle}>Add any details</Text>
            <Text style={s.stepSub}>Optional. Don't include names or personal information.</Text>

            <TextInput
              style={s.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Dark alley near X bus stop, group of men gathered after 9pm..."
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={200}
            />
            <Text style={s.charCount}>{description.length}/200</Text>

            <View style={s.anonNote}>
              <Text style={s.anonText}>
                🔒 This is submitted completely anonymously. No account, no IP address, no identifying information is stored.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.nextBtn, s.submitBtn]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={s.nextBtnText}>Submit anonymously →</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.skipBtn} onPress={handleSubmit} disabled={submitting}>
              <Text style={s.skipText}>Skip description and submit</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.dark },
  scroll:  { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4x'] },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  topStep:  { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },

  progressRow: { flexDirection: 'row', gap: 3, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  progressSeg:       { flex: 1, height: 3, backgroundColor: Colors.border,       borderRadius: Radius.full },
  progressSegActive: { flex: 1, height: 3, backgroundColor: Colors.teal,         borderRadius: Radius.full },

  stepWrap: { gap: Spacing.xl, paddingTop: Spacing.xl },
  stepTitle: { fontFamily: 'Lora-SemiBold', fontSize: FontSize.xl,  color: Colors.textPrimary, lineHeight: 30 },
  stepSub:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond,  lineHeight: 21, marginTop: -Spacing.md },

  mapContainer: { position: 'relative', height: 220, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  miniMap:      { flex: 1 },
  mapPin:       { alignItems: 'center' },
  mapPinCenter: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
  },

  myLocBtn: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingVertical: Spacing.md, alignItems: 'center',
  },
  myLocText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },

  coordRow: { alignItems: 'center' },
  coordText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },

  optList: { gap: Spacing.sm },
  optCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  optCardActive: { backgroundColor: Colors.dark3 },
  optIcon:  { fontSize: 22 },
  optLabel: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },
  optCheck: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.tealGlow },

  nextBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  nextBtnDim:  { opacity: 0.5 },
  nextBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
  submitBtn:   { backgroundColor: Colors.teal },

  descInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm,
    color: Colors.textPrimary, minHeight: 120, textAlignVertical: 'top',
  },
  charCount: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', marginTop: -Spacing.md },

  anonNote: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.teal + '30',
  },
  anonText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'AA', lineHeight: 18, textAlign: 'center' },

  skipBtn:  { alignItems: 'center', paddingVertical: Spacing.md },
  skipText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['3x'], gap: Spacing.xl },
  doneIcon:  { fontSize: 56 },
  doneTitle: { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  doneBody:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },
  doneBadge: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.teal + '40',
  },
  doneBadgeText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.tealGlow + 'AA' },
  doneCta: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.lg,
  },
  doneCtaText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
})
