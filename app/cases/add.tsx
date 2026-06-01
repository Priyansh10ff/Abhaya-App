import { useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, ActivityIndicator, Alert, Switch,
} from 'react-native'
import { router } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  fetchCaseFromEcourts, addCase, parseCNR,
  type CaseDetail,
} from '@/lib/ecourts'
import {
  scheduleHearingReminder, requestNotificationPermission,
} from '@/lib/notifications'

type Mode = 'cnr' | 'manual' | 'preview'

export default function AddCase() {
  const [mode,          setMode]         = useState<Mode>('cnr')
  const [cnrInput,      setCnrInput]     = useState('')
  const [label,         setLabel]        = useState('')
  const [notify,        setNotify]       = useState(true)
  const [notifyDays,    setNotifyDays]   = useState(1)
  const [fetching,      setFetching]     = useState(false)
  const [preview,       setPreview]      = useState<Partial<CaseDetail> | null>(null)
  const [fetchError,    setFetchError]   = useState('')

  // Manual entry fields
  const [manualCourt,   setManualCourt]  = useState('')
  const [manualDate,    setManualDate]   = useState('')
  const [manualType,    setManualType]   = useState('')

  const { valid, formatted } = parseCNR(cnrInput)

  async function handleLookup() {
    if (!valid) return
    setFetching(true)
    setFetchError('')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    const result = await fetchCaseFromEcourts(formatted)
    setFetching(false)

    if (result) {
      setPreview(result)
      setMode('preview')
      if (!label) setLabel(result.caseType ?? formatted)
    } else {
      setFetchError(
        'Could not fetch case details from eCourts. The CNR may be incorrect, or eCourts may be unavailable right now. You can add case details manually instead.'
      )
    }
  }

  async function handleSave(partial?: Partial<CaseDetail>) {
    const data = partial ?? preview
    if (!label.trim()) {
      Alert.alert('Add a label', 'Give this case a name so you can identify it, e.g. "My FIR case".')
      return
    }

    const saved = await addCase({
      ...(data ?? {}),
      cnr:              formatted || `MANUAL-${Date.now()}`,
      userLabel:        label.trim(),
      notifyDaysBefore: notifyDays,
      court:            manualCourt || data?.court || '',
      nextHearing:      manualDate  || data?.nextHearing || undefined,
      caseType:         manualType  || data?.caseType    || 'Unknown',
    })

    if (notify && saved.nextHearing) {
      const granted = await requestNotificationPermission()
      if (granted) {
        await scheduleHearingReminder(saved)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    }

    router.replace(`/cases/${saved.cnr}` as any)
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Add case</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Mode selector */}
        <View style={s.modeRow}>
          {(['cnr', 'manual'] as Mode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.modeBtn, mode === m && s.modeBtnActive]}
              onPress={() => { setMode(m); setFetchError('') }}
            >
              <Text style={[s.modeBtnText, mode === m && s.modeBtnTextActive]}>
                {m === 'cnr' ? '🔍 Lookup by CNR' : '✏️ Add manually'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CNR LOOKUP ── */}
        {mode === 'cnr' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.section}>
            <Text style={s.sectionTitle}>Enter your CNR number</Text>
            <Text style={s.sectionSub}>
              Find it on your FIR acknowledgment, court notice, or the eCourts website.
            </Text>

            <View style={s.cnrInputRow}>
              <TextInput
                style={[s.cnrInput, valid && s.cnrInputValid]}
                value={cnrInput}
                onChangeText={v => { setCnrInput(v); setFetchError('') }}
                placeholder="e.g. KABA010023322024"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={20}
              />
              {cnrInput.length > 0 && (
                <View style={[s.cnrStatus, { backgroundColor: valid ? Colors.successLight : Colors.dangerLight }]}>
                  <Text style={{ color: valid ? Colors.success : Colors.danger, fontSize: 12 }}>
                    {valid ? '✓' : '✗'}
                  </Text>
                </View>
              )}
            </View>

            <View style={s.cnrHintCard}>
              <Text style={s.cnrHintTitle}>Where to find your CNR:</Text>
              {[
                'On your FIR copy or police acknowledgment',
                'On any court notice or summons you received',
                'On eCourts website — ecourts.gov.in',
                'By asking your lawyer',
              ].map((h, i) => (
                <View key={i} style={s.hintRow}>
                  <Text style={s.hintDot}>·</Text>
                  <Text style={s.hintText}>{h}</Text>
                </View>
              ))}
            </View>

            {fetchError ? (
              <Animated.View entering={FadeIn.duration(300)} style={s.errorCard}>
                <Text style={s.errorText}>{fetchError}</Text>
                <TouchableOpacity onPress={() => { setMode('manual'); setFetchError('') }}>
                  <Text style={s.errorCta}>Add manually instead →</Text>
                </TouchableOpacity>
              </Animated.View>
            ) : null}

            <TouchableOpacity
              style={[s.lookupBtn, (!valid || fetching) && s.lookupBtnDim]}
              onPress={handleLookup}
              disabled={!valid || fetching}
            >
              {fetching
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Text style={s.lookupBtnText}>Look up on eCourts →</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* ── MANUAL ENTRY ── */}
        {mode === 'manual' && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.section}>
            <Text style={s.sectionTitle}>Add case manually</Text>
            <Text style={s.sectionSub}>
              If you don't have a CNR or eCourts isn't working, add the details yourself.
            </Text>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>CNR number (optional)</Text>
              <TextInput
                style={s.field}
                value={cnrInput}
                onChangeText={setCnrInput}
                placeholder="Leave blank if unknown"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Court name</Text>
              <TextInput
                style={s.field}
                value={manualCourt}
                onChangeText={setManualCourt}
                placeholder="e.g. Additional Sessions Court, Bengaluru"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Next hearing date (DD-MM-YYYY)</Text>
              <TextInput
                style={s.field}
                value={manualDate}
                onChangeText={setManualDate}
                placeholder="e.g. 15-08-2025"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Case type</Text>
              <TextInput
                style={s.field}
                value={manualType}
                onChangeText={setManualType}
                placeholder="e.g. Criminal, Sessions, IPC 376"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          </Animated.View>
        )}

        {/* ── PREVIEW from eCourts ── */}
        {mode === 'preview' && preview && (
          <Animated.View entering={FadeInDown.duration(400)} style={s.section}>
            <View style={s.previewHeader}>
              <Text style={s.previewSuccess}>✓ Case found on eCourts</Text>
            </View>

            {[
              { label: 'Case type',     value: preview.caseType    ?? '—' },
              { label: 'Case number',   value: preview.caseNumber  ?? '—' },
              { label: 'Court',         value: preview.court       ?? '—' },
              { label: 'Status',        value: preview.status      ?? '—' },
              { label: 'Filed on',      value: preview.filingDate  ?? '—' },
              { label: 'Next hearing',  value: preview.nextHearing ? preview.nextHearing : 'Not scheduled' },
              { label: 'Past hearings', value: String(preview.hearings?.length ?? 0) },
            ].map(row => (
              <View key={row.label} style={s.previewRow}>
                <Text style={s.previewLabel}>{row.label}</Text>
                <Text style={s.previewValue}>{row.value}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* ── COMMON: Label + Notifications ── */}
        {(mode === 'manual' || mode === 'preview') && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.section}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Your label for this case *</Text>
              <TextInput
                style={s.field}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. My FIR case, Workplace harassment, DV case"
                placeholderTextColor={Colors.textMuted}
                maxLength={50}
              />
              <Text style={s.fieldHint}>This is just for you — helps you identify the case in the app.</Text>
            </View>

            {/* Notifications */}
            <View style={s.notifyCard}>
              <View style={s.notifyRow}>
                <View>
                  <Text style={s.notifyTitle}>Hearing reminders</Text>
                  <Text style={s.notifySub}>Get notified before each hearing date</Text>
                </View>
                <Switch
                  value={notify}
                  onValueChange={setNotify}
                  trackColor={{ false: Colors.border, true: Colors.teal }}
                  thumbColor={Colors.white}
                />
              </View>

              {notify && (
                <View style={s.notifyDaysRow}>
                  <Text style={s.notifyDaysLabel}>Remind me</Text>
                  <View style={s.notifyDaysPicker}>
                    {[1, 2, 3].map(d => (
                      <TouchableOpacity
                        key={d}
                        style={[s.dayBtn, notifyDays === d && s.dayBtnActive]}
                        onPress={() => setNotifyDays(d)}
                      >
                        <Text style={[s.dayBtnText, notifyDays === d && s.dayBtnTextActive]}>
                          {d} day{d > 1 ? 's' : ''} before
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[s.saveBtn, !label.trim() && s.saveBtnDim]}
              onPress={() => handleSave()}
              disabled={!label.trim()}
            >
              <Text style={s.saveBtnText}>Save case →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Label for CNR mode after successful lookup */}
        {mode === 'cnr' && !fetching && !fetchError && !preview && (
          <View style={s.section}>
            <View style={s.fieldGroup}>
              <Text style={s.fieldLabel}>Your label for this case</Text>
              <TextInput
                style={s.field}
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. My FIR case"
                placeholderTextColor={Colors.textMuted}
                maxLength={50}
              />
            </View>
          </View>
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
  topTitle: { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, textAlign: 'center' },

  modeRow: { flexDirection: 'row', gap: Spacing.sm },
  modeBtn: {
    flex: 1, backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  modeBtnActive:    { backgroundColor: Colors.tealDim, borderColor: Colors.teal },
  modeBtnText:      { fontFamily: 'DMSans-Medium',   fontSize: FontSize.xs, color: Colors.textMuted   },
  modeBtnTextActive:{ fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow    },

  section: { gap: Spacing.lg },
  sectionTitle: { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.lg, color: Colors.textPrimary },
  sectionSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21, marginTop: -Spacing.sm },

  cnrInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cnrInput: {
    flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontFamily: 'DMSans-Medium', fontSize: FontSize.base, color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cnrInputValid: { borderColor: Colors.teal },
  cnrStatus:     { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  cnrHintCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm,
  },
  cnrHintTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  hintRow:      { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  hintDot:      { color: Colors.tealGlow, fontSize: FontSize.base, lineHeight: 20 },
  hintText:     { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18, flex: 1 },

  errorCard: {
    backgroundColor: Colors.dangerLight, borderWidth: 1, borderColor: Colors.dangerBorder,
    borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm,
  },
  errorText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.danger, lineHeight: 20 },
  errorCta:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.danger },

  lookupBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  lookupBtnDim:  { opacity: 0.5 },
  lookupBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },

  fieldGroup: { gap: Spacing.sm },
  fieldLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  field: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textPrimary,
  },
  fieldHint: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },

  previewHeader: { backgroundColor: Colors.successLight, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  previewSuccess: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.success },
  previewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  previewLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted,  flex: 1 },
  previewValue: { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.textPrimary, flex: 2, textAlign: 'right' },

  notifyCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.lg,
  },
  notifyRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifyTitle:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  notifySub:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted   },
  notifyDaysRow: { gap: Spacing.sm },
  notifyDaysLabel:{ fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond },
  notifyDaysPicker: { flexDirection: 'row', gap: Spacing.sm },
  dayBtn: {
    flex: 1, backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.full, paddingVertical: Spacing.sm, alignItems: 'center',
  },
  dayBtnActive:     { backgroundColor: Colors.tealDim, borderColor: Colors.teal },
  dayBtnText:       { fontFamily: 'DMSans-Medium',   fontSize: FontSize.xs, color: Colors.textMuted  },
  dayBtnTextActive: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow   },

  saveBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingVertical: Spacing.lg, alignItems: 'center',
  },
  saveBtnDim:  { opacity: 0.5 },
  saveBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
})
