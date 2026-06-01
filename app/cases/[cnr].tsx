import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  loadCases, refreshCase, updateCase, removeCase,
  formatHearingDate, getDaysUntilHearing, getHearingUrgency,
  explainHearing, type CaseDetail, type Hearing,
} from '@/lib/ecourts'
import { scheduleHearingReminder } from '@/lib/notifications'

function HearingRow({ hearing, isLatest }: { hearing: Hearing; isLatest: boolean }) {
  const [expanded, setExpanded] = useState(isLatest)
  const explanation = explainHearing(hearing.purpose)

  return (
    <TouchableOpacity
      style={[s.hearingCard, isLatest && s.hearingCardLatest]}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.8}
    >
      <View style={s.hearingCardHeader}>
        <View style={s.hearingDateWrap}>
          <Text style={s.hearingCardDate}>{formatHearingDate(hearing.date)}</Text>
          {isLatest && <View style={s.latestBadge}><Text style={s.latestBadgeText}>Latest</Text></View>}
        </View>
        <Text style={s.hearingCardChevron}>{expanded ? '↑' : '↓'}</Text>
      </View>

      <Text style={s.hearingPurpose}>{hearing.purpose}</Text>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(250)} style={s.hearingExpanded}>
          {/* What this means in plain language */}
          <View style={s.explainBox}>
            <Text style={s.explainLabel}>💡 What this means</Text>
            <Text style={s.explainText}>{explanation}</Text>
          </View>

          {hearing.judge && (
            <View style={s.hearingMeta}>
              <Text style={s.hearingMetaLabel}>Judge</Text>
              <Text style={s.hearingMetaValue}>{hearing.judge}</Text>
            </View>
          )}
          {hearing.nextDate && (
            <View style={s.hearingMeta}>
              <Text style={s.hearingMetaLabel}>Next date set</Text>
              <Text style={[s.hearingMetaValue, { color: Colors.tealGlow }]}>
                {formatHearingDate(hearing.nextDate)}
              </Text>
            </View>
          )}
        </Animated.View>
      )}
    </TouchableOpacity>
  )
}

export default function CaseDetailScreen() {
  const { cnr }              = useLocalSearchParams<{ cnr: string }>()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [editNote, setEditNote] = useState(false)
  const [note,     setNote]     = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    load()
  }, [cnr])

  async function load() {
    const cases = await loadCases()
    const found = cases.find(c => c.cnr === cnr)
    if (found) { setCaseData(found); setNote(found.notes ?? '') }
  }

  async function handleRefresh() {
    if (!cnr) return
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const updated = await refreshCase(cnr)
    setRefreshing(false)
    if (updated) {
      setCaseData(updated)
      setNote(updated.notes ?? '')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Alert.alert('Could not refresh', 'eCourts may be unavailable. Try again later.')
    }
  }

  async function handleSaveNote() {
    if (!cnr) return
    await updateCase(cnr, { notes: note })
    setEditNote(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  }

  async function handleDelete() {
    Alert.alert('Remove case?', 'This will remove the case from your tracker. Your actual legal case is not affected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          if (!cnr) return
          await removeCase(cnr)
          router.replace('/tabs/cases' as any)
        },
      },
    ])
  }

  async function handleRescheduleNotification() {
    if (!caseData) return
    await scheduleHearingReminder(caseData)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    Alert.alert('Reminder set', `You'll be notified ${caseData.notifyDaysBefore} day(s) before the hearing on ${caseData.nextHearing}.`)
  }

  if (!caseData) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}><ActivityIndicator color={Colors.teal} size="large" /></View>
      </SafeAreaView>
    )
  }

  const days    = getDaysUntilHearing(caseData.nextHearing ?? '')
  const urgency = getHearingUrgency(days)
  const hearingsSorted = [...caseData.hearings].sort((a, b) => {
    const da = a.date.split('-').reverse().join('')
    const db = b.date.split('-').reverse().join('')
    return db.localeCompare(da)
  })

  return (
    <SafeAreaView style={s.safe}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{caseData.userLabel}</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing} style={s.refreshBtn}>
          {refreshing
            ? <ActivityIndicator size="small" color={Colors.tealGlow} />
            : <Text style={s.refreshIcon}>↻</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Next hearing hero */}
        <Animated.View entering={FadeInDown.duration(400)} style={[s.heroCard, { borderColor: urgency.color + '40' }]}>
          <Text style={s.heroLabel}>Next hearing</Text>
          <Text style={[s.heroDate, { color: urgency.color }]}>
            {caseData.nextHearing ? formatHearingDate(caseData.nextHearing) : 'Not scheduled'}
          </Text>
          <View style={[s.urgencyBadge, { backgroundColor: urgency.bg }]}>
            <Text style={[s.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
          </View>
          {caseData.nextHearing && (
            <TouchableOpacity style={s.remindBtn} onPress={handleRescheduleNotification}>
              <Text style={s.remindBtnText}>🔔 Set reminder</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Case details */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.detailCard}>
          <Text style={s.cardTitle}>Case details</Text>
          {[
            { label: 'CNR',           value: caseData.cnr          },
            { label: 'Case type',     value: caseData.caseType     },
            { label: 'Court',         value: caseData.court        },
            { label: 'District',      value: caseData.district     },
            { label: 'Filed on',      value: caseData.filingDate   },
            { label: 'Status',        value: caseData.status       },
            { label: 'Petitioner',    value: caseData.petitioner   },
            { label: 'Respondent',    value: caseData.respondent   },
          ].filter(r => r.value).map(row => (
            <View key={row.label} style={s.detailRow}>
              <Text style={s.detailLabel}>{row.label}</Text>
              <Text style={s.detailValue} selectable>{row.value}</Text>
            </View>
          ))}
        </Animated.View>

        {/* What to do next */}
        {caseData.nextHearing && (
          <Animated.View entering={FadeInDown.delay(120).duration(400)} style={s.todoCard}>
            <Text style={s.cardTitle}>📋 Before your hearing</Text>
            {[
              'Contact your lawyer at least 3 days before',
              'Carry all original documents and copies',
              'Note the court room number from the notice board on arrival',
              'Bring your case number and this tracker for reference',
              'Arrive 30 minutes early — courts start on time',
            ].map((t, i) => (
              <View key={i} style={s.todoRow}>
                <Text style={s.todoNum}>{i + 1}</Text>
                <Text style={s.todoText}>{t}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Free legal aid */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={s.legalAidCard}>
          <Text style={s.cardTitle}>⚖️ Free legal aid</Text>
          <Text style={s.legalAidText}>
            If you don't have a lawyer, the District Legal Services Authority (DLSA) provides free legal aid to victims of crime. Call NALSA helpline: 15100.
          </Text>
        </Animated.View>

        {/* Hearing history */}
        {hearingsSorted.length > 0 && (
          <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.historySection}>
            <Text style={s.cardTitle}>
              Hearing history ({hearingsSorted.length})
            </Text>
            <Text style={s.historySub}>Tap each hearing to see what it means in plain language</Text>
            {hearingsSorted.map((h, i) => (
              <HearingRow key={`${h.date}-${i}`} hearing={h} isLatest={i === 0} />
            ))}
          </Animated.View>
        )}

        {/* Notes */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={s.notesCard}>
          <View style={s.notesHeader}>
            <Text style={s.cardTitle}>📝 Your notes</Text>
            {!editNote && (
              <TouchableOpacity onPress={() => setEditNote(true)}>
                <Text style={s.editBtn}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          {editNote ? (
            <View style={s.noteEditWrap}>
              <TextInput
                style={s.noteInput}
                value={note}
                onChangeText={setNote}
                placeholder="Add notes — lawyer contact, documents to bring, case context..."
                placeholderTextColor={Colors.textMuted}
                multiline
                autoFocus
              />
              <View style={s.noteActions}>
                <TouchableOpacity onPress={() => { setEditNote(false); setNote(caseData.notes ?? '') }}>
                  <Text style={s.noteCancelBtn}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.noteSaveBtn} onPress={handleSaveNote}>
                  <Text style={s.noteSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <Text style={note ? s.noteText : s.notePlaceholder}>
              {note || 'No notes yet. Tap Edit to add context.'}
            </Text>
          )}
        </Animated.View>

        {/* Remove case */}
        <TouchableOpacity style={s.deleteBtn} onPress={handleDelete}>
          <Text style={s.deleteBtnText}>Remove from tracker</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.dark },
  scroll: { flex: 1 },
  content:{ padding: Spacing.xl, paddingBottom: Spacing['4x'], gap: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backIcon:   { fontSize: FontSize.xl, color: Colors.textPrimary },
  topTitle:   { flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  refreshBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  refreshIcon:{ fontSize: FontSize.xl, color: Colors.tealGlow },

  heroCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderRadius: Radius.xl,
    padding: Spacing.xl, gap: Spacing.sm, alignItems: 'center',
  },
  heroLabel:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroDate:     { fontFamily: 'Lora-SemiBold',   fontSize: FontSize.xl, textAlign: 'center', lineHeight: 30 },
  urgencyBadge: { borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  urgencyText:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs },
  remindBtn: {
    backgroundColor: Colors.tealDim, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.teal + '40',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, marginTop: Spacing.sm,
  },
  remindBtnText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },

  cardTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary, marginBottom: Spacing.sm },

  detailCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm,
  },
  detailRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted, flex: 1 },
  detailValue: { fontFamily: 'DMSans-Medium',  fontSize: FontSize.sm, color: Colors.textPrimary, flex: 2, textAlign: 'right' },

  todoCard: {
    backgroundColor: Colors.tealDim, borderWidth: 1, borderColor: Colors.teal + '30',
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  todoRow:  { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  todoNum:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.tealGlow, width: 20 },
  todoText: { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.tealGlow + 'CC', lineHeight: 20, flex: 1 },

  legalAidCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm,
  },
  legalAidText: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },

  historySection: { gap: Spacing.md },
  historySub:     { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: -Spacing.sm, marginBottom: Spacing.sm },

  hearingCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.sm,
  },
  hearingCardLatest: { borderColor: Colors.teal + '60', backgroundColor: Colors.dark3 },
  hearingCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hearingDateWrap:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  hearingCardDate:   { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  latestBadge:       { backgroundColor: Colors.tealDim, borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  latestBadgeText:   { fontFamily: 'DMSans-SemiBold', fontSize: 9, color: Colors.tealGlow },
  hearingCardChevron:{ fontFamily: 'DMSans-Regular', fontSize: FontSize.base, color: Colors.textMuted },
  hearingPurpose:    { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textSecond },
  hearingExpanded:   { gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.sm },
  explainBox: {
    backgroundColor: Colors.dark, borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs,
  },
  explainLabel: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.tealGlow },
  explainText:  { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18 },
  hearingMeta:  { flexDirection: 'row', justifyContent: 'space-between' },
  hearingMetaLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted },
  hearingMetaValue: { fontFamily: 'DMSans-Medium',  fontSize: FontSize.xs, color: Colors.textPrimary },

  notesCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.md,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  editBtn:     { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.tealGlow },
  noteText:        { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textSecond, lineHeight: 21 },
  notePlaceholder: { fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  noteEditWrap: { gap: Spacing.md },
  noteInput: {
    backgroundColor: Colors.inputBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, padding: Spacing.md,
    fontFamily: 'DMSans-Regular', fontSize: FontSize.sm, color: Colors.textPrimary,
    minHeight: 100, textAlignVertical: 'top',
  },
  noteActions:   { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  noteCancelBtn: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.textMuted, padding: Spacing.sm },
  noteSaveBtn:   { backgroundColor: Colors.teal, borderRadius: Radius.full, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  noteSaveText:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.white },

  deleteBtn: {
    borderWidth: 1, borderColor: Colors.dangerBorder, borderRadius: Radius.full,
    paddingVertical: Spacing.md, alignItems: 'center',
  },
  deleteBtnText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.sm, color: Colors.danger },
})
