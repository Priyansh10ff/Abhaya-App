import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Switch,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  getLog, saveLog, deleteLog, formatDisplayDate, getDayOfWeek,
  PCOS_SYMPTOMS, type DayLog, type FlowLevel, type MoodLevel, type PainLevel,
} from '@/lib/health'

const FLOW_OPTIONS: { value: FlowLevel; label: string; icon: string }[] = [
  { value: 'spotting', label: 'Spotting', icon: '🔴' },
  { value: 'light',    label: 'Light',    icon: '🩸' },
  { value: 'medium',   label: 'Medium',   icon: '🩸🩸' },
  { value: 'heavy',    label: 'Heavy',    icon: '🩸🩸🩸' },
]

const MOOD_OPTIONS: { value: MoodLevel; label: string; icon: string }[] = [
  { value: 'happy',   label: 'Happy',   icon: '😊' },
  { value: 'okay',    label: 'Okay',    icon: '😐' },
  { value: 'sad',     label: 'Sad',     icon: '😔' },
  { value: 'anxious', label: 'Anxious', icon: '😰' },
  { value: 'angry',   label: 'Angry',   icon: '😤' },
  { value: 'tired',   label: 'Tired',   icon: '😴' },
]

export default function LogDay() {
  const { date }     = useLocalSearchParams<{ date: string }>()
  const [isPeriod,   setIsPeriod]   = useState(false)
  const [flow,       setFlow]       = useState<FlowLevel | undefined>()
  const [pain,       setPain]       = useState<PainLevel>(0)
  const [mood,       setMood]       = useState<MoodLevel | undefined>()
  const [symptoms,   setSymptoms]   = useState<string[]>([])
  const [notes,      setNotes]      = useState('')
  const [hasExisting,setHasExisting]= useState(false)

  useEffect(() => {
    if (date) load(date)
  }, [date])

  async function load(d: string) {
    const existing = await getLog(d)
    if (existing) {
      setIsPeriod(existing.isPeriod)
      setFlow(existing.flow)
      setPain(existing.pain)
      setMood(existing.mood)
      setSymptoms(existing.symptoms ?? [])
      setNotes(existing.notes ?? '')
      setHasExisting(true)
    }
  }

  function toggleSymptom(s: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  async function handleSave() {
    if (!date) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const log: DayLog = {
      date, isPeriod, flow: isPeriod ? flow : undefined,
      pain, mood, symptoms, notes: notes.trim() || undefined,
    }
    await saveLog(log)
    router.back()
  }

  async function handleDelete() {
    if (!date) return
    await deleteLog(date)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    router.back()
  }

  const displayDate = date ? `${getDayOfWeek(date)}, ${formatDisplayDate(date)}` : ''

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>{displayDate}</Text>
        <TouchableOpacity
          style={s.saveBtn}
          onPress={handleSave}
        >
          <Text style={s.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Period toggle */}
        <Animated.View entering={FadeInDown.duration(400)} style={s.periodCard}>
          <View style={s.periodRow}>
            <View>
              <Text style={s.periodLabel}>Period today</Text>
              <Text style={s.periodSub}>Log if your period started or continued</Text>
            </View>
            <Switch
              value={isPeriod}
              onValueChange={v => { setIsPeriod(v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              trackColor={{ false: Colors.border, true: '#E85D8A' }}
              thumbColor={Colors.white}
            />
          </View>

          {/* Flow level */}
          {isPeriod && (
            <Animated.View entering={FadeInDown.duration(300)} style={s.flowRow}>
              <Text style={s.sectionLabel}>Flow</Text>
              <View style={s.flowOptions}>
                {FLOW_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f.value}
                    style={[s.flowBtn, flow === f.value && s.flowBtnActive]}
                    onPress={() => { setFlow(f.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
                  >
                    <Text style={s.flowIcon}>{f.icon}</Text>
                    <Text style={[s.flowLabel, flow === f.value && s.flowLabelActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          )}
        </Animated.View>

        {/* Pain level */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.section}>
          <Text style={s.sectionLabel}>Pain / cramps  {pain > 0 ? `(${pain}/5)` : '(none)'}</Text>
          <View style={s.painRow}>
            {([0,1,2,3,4,5] as PainLevel[]).map(p => (
              <TouchableOpacity
                key={p}
                style={[s.painBtn, pain === p && s.painBtnActive]}
                onPress={() => { setPain(p); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              >
                <Text style={[s.painLabel, pain === p && s.painLabelActive]}>
                  {p === 0 ? 'None' : String(p)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.painScaleLabels}>
            <Text style={s.painScaleText}>None</Text>
            <Text style={s.painScaleText}>Mild</Text>
            <Text style={s.painScaleText}>Severe</Text>
          </View>
        </Animated.View>

        {/* Mood */}
        <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.section}>
          <Text style={s.sectionLabel}>Mood</Text>
          <View style={s.moodGrid}>
            {MOOD_OPTIONS.map(m => (
              <TouchableOpacity
                key={m.value}
                style={[s.moodBtn, mood === m.value && s.moodBtnActive]}
                onPress={() => { setMood(m.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light) }}
              >
                <Text style={s.moodIcon}>{m.icon}</Text>
                <Text style={[s.moodLabel, mood === m.value && s.moodLabelActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Symptoms */}
        <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.section}>
          <Text style={s.sectionLabel}>Symptoms</Text>
          <Text style={s.sectionSub}>Select all that apply today</Text>
          <View style={s.symptomsGrid}>
            {PCOS_SYMPTOMS.map(sym => (
              <TouchableOpacity
                key={sym}
                style={[s.symBtn, symptoms.includes(sym) && s.symBtnActive]}
                onPress={() => toggleSymptom(sym)}
              >
                <Text style={[s.symLabel, symptoms.includes(sym) && s.symLabelActive]}>
                  {sym}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={s.section}>
          <Text style={s.sectionLabel}>Notes (optional)</Text>
          <TextInput
            style={s.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything else — medication taken, unusual symptoms, how you're feeling..."
            placeholderTextColor={Colors.textMuted}
            multiline
            maxLength={300}
          />
        </Animated.View>

        {/* Delete */}
        {hasExisting && (
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
            <Text style={s.deleteBtnText}>Clear this day's log</Text>
          </TouchableOpacity>
        )}

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
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  saveBtn:  { backgroundColor: '#E85D8A', borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },
  saveBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  sectionLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: Spacing.sm },
  sectionSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
  section:       { gap: Spacing.sm },

  periodCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg,
  },
  periodRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  periodLabel:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  periodSub:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  flowRow:    { gap: Spacing.sm },
  flowOptions:{ flexDirection: 'row', gap: Spacing.sm },
  flowBtn: {
    flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 3,
  },
  flowBtnActive: { backgroundColor: '#E85D8A22', borderColor: '#E85D8A80' },
  flowIcon:      { fontSize: 14 },
  flowLabel:     { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs - 1, color: Colors.textMuted   },
  flowLabelActive:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs - 1, color: '#E85D8A'          },

  painRow: { flexDirection: 'row', gap: Spacing.sm },
  painBtn: {
    flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.md, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  painBtnActive: { backgroundColor: '#E85D8A33', borderColor: '#E85D8A' },
  painLabel:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },
  painLabelActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: '#E85D8A'          },
  painScaleLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  painScaleText:   { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  moodBtn: {
    width: '30%', backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center', gap: 4,
  },
  moodBtnActive: { backgroundColor: Colors.tealDim, borderColor: Colors.teal },
  moodIcon:        { fontSize: 22 },
  moodLabel:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs - 1, color: Colors.textMuted   },
  moodLabelActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs - 1, color: Colors.tealGlow    },

  symptomsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  symBtn: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  symBtnActive: { backgroundColor: Colors.tealDim, borderColor: Colors.teal },
  symLabel:       { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },
  symLabelActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow    },

  notesInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm,
    color: Colors.textPrimary, minHeight: 90, textAlignVertical: 'top',
  },

  deleteBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted },
})
