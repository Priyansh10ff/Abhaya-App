import { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, Alert,
} from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors, FontSize, Spacing, Radius } from '@/constants/colors'
import {
  loadCases, refreshCase, removeCase,
  formatHearingDate, getDaysUntilHearing, getHearingUrgency,
  type CaseDetail,
} from '@/lib/ecourts'

function CaseCard({ item, index, onRefresh, onDelete }: {
  item: CaseDetail; index: number
  onRefresh: (cnr: string) => void
  onDelete:  (cnr: string) => void
}) {
  const days    = getDaysUntilHearing(item.nextHearing ?? '')
  const urgency = getHearingUrgency(days)

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400)}>
      <TouchableOpacity
        style={s.caseCard}
        onPress={() => router.push(`/cases/${item.cnr}` as any)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          Alert.alert(
            item.userLabel,
            'What would you like to do?',
            [
              { text: 'Refresh from eCourts', onPress: () => onRefresh(item.cnr) },
              { text: 'Remove case',  style: 'destructive', onPress: () => onDelete(item.cnr) },
              { text: 'Cancel', style: 'cancel' },
            ]
          )
        }}
        activeOpacity={0.8}
      >
        {/* Status dot + label */}
        <View style={s.caseHeader}>
          <View style={[
            s.statusDot,
            { backgroundColor: item.status === 'disposed' ? Colors.textMuted : Colors.teal }
          ]} />
          <Text style={s.caseLabel} numberOfLines={1}>{item.userLabel}</Text>
          <View style={[s.urgencyBadge, { backgroundColor: urgency.bg }]}>
            <Text style={[s.urgencyText, { color: urgency.color }]}>{urgency.label}</Text>
          </View>
        </View>

        {/* CNR + Court */}
        <Text style={s.caseCnr} numberOfLines={1}>{item.cnr}</Text>
        {item.court ? (
          <Text style={s.caseCourt} numberOfLines={1}>🏛 {item.court}</Text>
        ) : null}

        <View style={s.caseDivider} />

        {/* Next hearing */}
        <View style={s.hearingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.hearingLabel}>Next hearing</Text>
            <Text style={[s.hearingDate, { color: urgency.color }]}>
              {item.nextHearing ? formatHearingDate(item.nextHearing) : 'Not scheduled'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.hearingLabel}>Total hearings</Text>
            <Text style={s.hearingCount}>{item.hearings.length}</Text>
          </View>
        </View>

        {/* Status tag */}
        <View style={s.caseFooter}>
          <View style={[
            s.statusTag,
            item.status === 'disposed' ? s.statusDisposed : s.statusPending
          ]}>
            <Text style={[
              s.statusTagText,
              item.status === 'disposed' ? s.statusDisposedText : s.statusPendingText
            ]}>
              {item.status === 'disposed' ? '✓ Disposed' : item.status === 'unknown' ? '? Status unknown' : '⏳ Pending'}
            </Text>
          </View>
          <Text style={s.lastUpdated}>
            Updated {new Date(item.lastUpdated).toLocaleDateString('en-IN')}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function CasesTab() {
  const [cases,     setCases]     = useState<CaseDetail[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [loading,   setLoading]   = useState(true)

  useFocusEffect(useCallback(() => {
    load()
  }, []))

  async function load() {
    const data = await loadCases()
    setCases(data.sort((a, b) => b.addedAt - a.addedAt))
    setLoading(false)
  }

  async function handleRefreshCase(cnr: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const updated = await refreshCase(cnr)
    if (updated) {
      await load()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } else {
      Alert.alert('Could not refresh', 'Check your connection or the CNR number.')
    }
  }

  async function handleDeleteCase(cnr: string) {
    await removeCase(cnr)
    await load()
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  }

  async function handlePullRefresh() {
    setRefreshing(true)
    // Refresh all cases from eCourts
    for (const c of cases) {
      await refreshCase(c.cnr)
    }
    await load()
    setRefreshing(false)
  }

  const upcoming = cases.filter(c => {
    const days = getDaysUntilHearing(c.nextHearing ?? '')
    return days !== null && days >= 0 && days <= 30
  })

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Case Tracker</Text>
          <Text style={s.headerSub}>{cases.length} case{cases.length !== 1 ? 's' : ''} tracked</Text>
        </View>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/cases/add' as any)}
        >
          <Text style={s.addBtnText}>+ Add case</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming hearings banner */}
      {upcoming.length > 0 && (
        <Animated.View entering={FadeIn.duration(400)} style={s.upcomingBanner}>
          <Text style={s.upcomingIcon}>⚖️</Text>
          <Text style={s.upcomingText}>
            {upcoming.length} hearing{upcoming.length > 1 ? 's' : ''} in the next 30 days
          </Text>
        </Animated.View>
      )}

      {/* Cases list */}
      {cases.length === 0 && !loading ? (
        <Animated.View entering={FadeIn.duration(500)} style={s.empty}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No cases tracked</Text>
          <Text style={s.emptyBody}>
            Add your CNR number to track your case, get hearing date reminders, and understand what happens at each stage.
          </Text>
          <TouchableOpacity
            style={s.emptyCta}
            onPress={() => router.push('/cases/add' as any)}
          >
            <Text style={s.emptyCtaText}>Add your first case →</Text>
          </TouchableOpacity>
          <View style={s.cnrHelp}>
            <Text style={s.cnrHelpTitle}>What is a CNR number?</Text>
            <Text style={s.cnrHelpBody}>
              The Case Number Record (CNR) is a unique 16-digit code given to every case filed in India. You can find it on your FIR acknowledgment, court notice, or by asking your lawyer.
            </Text>
          </View>
        </Animated.View>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={c => c.cnr}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor={Colors.teal}
              colors={[Colors.teal]}
            />
          }
          renderItem={({ item, index }) => (
            <CaseCard
              item={item}
              index={index}
              onRefresh={handleRefreshCase}
              onDelete={handleDeleteCase}
            />
          )}
          ListFooterComponent={
            <Text style={s.pullHint}>Pull down to refresh all cases from eCourts · Hold a case to remove</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary },
  headerSub:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs,   color: Colors.textMuted   },
  addBtn: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  addBtnText: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.xs, color: Colors.white },

  upcomingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.tealDim, marginHorizontal: Spacing.xl, marginTop: Spacing.md,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderWidth: 1, borderColor: Colors.teal + '40',
  },
  upcomingIcon: { fontSize: 16 },
  upcomingText: { fontFamily: 'DMSans-Medium', fontSize: FontSize.xs, color: Colors.tealGlow },

  list:     { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing['4x'] },
  pullHint: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', paddingTop: Spacing.md },

  caseCard: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm,
  },
  caseHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot:    { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  caseLabel:    { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.textPrimary, flex: 1 },
  urgencyBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  urgencyText:  { fontFamily: 'DMSans-SemiBold', fontSize: 10 },
  caseCnr:      { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textMuted, letterSpacing: 0.5 },
  caseCourt:    { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textSecond },
  caseDivider:  { height: 1, backgroundColor: Colors.border },
  hearingRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  hearingLabel: { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
  hearingDate:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm },
  hearingCount: { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  caseFooter:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTag:    { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusPending:      { backgroundColor: Colors.tealDim },
  statusDisposed:     { backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border },
  statusTagText:      { fontFamily: 'DMSans-SemiBold', fontSize: 10 },
  statusPendingText:  { color: Colors.tealGlow },
  statusDisposedText: { color: Colors.textMuted },
  lastUpdated:        { fontFamily: 'DMSans-Regular', fontSize: FontSize.xs - 1, color: Colors.textMuted },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: Spacing['3x'], gap: Spacing.lg,
  },
  emptyIcon:     { fontSize: 52 },
  emptyTitle:    { fontFamily: 'Lora-SemiBold',  fontSize: FontSize.xl,  color: Colors.textPrimary, textAlign: 'center' },
  emptyBody:     { fontFamily: 'DMSans-Regular',  fontSize: FontSize.sm, color: Colors.textSecond,  textAlign: 'center', lineHeight: 22 },
  emptyCta: {
    backgroundColor: Colors.teal, borderRadius: Radius.full,
    paddingHorizontal: Spacing['3x'], paddingVertical: Spacing.md,
  },
  emptyCtaText:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.base, color: Colors.white },
  cnrHelp: {
    backgroundColor: Colors.cardBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, padding: Spacing.xl, gap: Spacing.sm, width: '100%',
  },
  cnrHelpTitle:  { fontFamily: 'DMSans-SemiBold', fontSize: FontSize.sm, color: Colors.textPrimary },
  cnrHelpBody:   { fontFamily: 'DMSans-Regular',  fontSize: FontSize.xs, color: Colors.textSecond, lineHeight: 18 },
})
