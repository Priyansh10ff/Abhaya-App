import * as Notifications from 'expo-notifications'
import type { CaseDetail }  from './ecourts'
import { getDaysUntilHearing } from './ecourts'

// Configure how notifications appear when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
  }),
})

// ─── Request permission ──────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync()
  if (existing === 'granted') return true

  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

// ─── Schedule hearing reminder ───────────────────────────
export async function scheduleHearingReminder(
  caseDetail: CaseDetail,
): Promise<string | null> {
  if (!caseDetail.nextHearing) return null

  const hasPermission = await requestNotificationPermission()
  if (!hasPermission) return null

  // Cancel existing notifications for this case
  await cancelCaseReminders(caseDetail.cnr)

  const parts = caseDetail.nextHearing.split('-')
  if (parts.length !== 3) return null

  const [d, m, y] = parts
  const hearingDate = new Date(`${y}-${m}-${d}`)
  hearingDate.setHours(8, 0, 0, 0) // 8am on hearing day

  // Schedule notification N days before
  const notifyDate = new Date(hearingDate)
  notifyDate.setDate(notifyDate.getDate() - caseDetail.notifyDaysBefore)

  if (notifyDate <= new Date()) return null // Date already passed

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `⚖️ Court hearing ${caseDetail.notifyDaysBefore === 0 ? 'today' : `in ${caseDetail.notifyDaysBefore} day${caseDetail.notifyDaysBefore > 1 ? 's' : ''}`}`,
      body:  `${caseDetail.userLabel} — ${caseDetail.court || 'Court hearing'} on ${caseDetail.nextHearing}. Contact your lawyer.`,
      data:  { caseId: caseDetail.cnr, type: 'hearing_reminder' },
      sound: true,
    },
    trigger: {
      date: notifyDate,
    },
  })

  // Also schedule day-of reminder if notify is before day-of
  if (caseDetail.notifyDaysBefore > 0) {
    hearingDate.setHours(7, 30, 0, 0)
    if (hearingDate > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚖️ Court hearing TODAY',
          body:  `${caseDetail.userLabel} — hearing today. Be at court on time.`,
          data:  { caseId: caseDetail.cnr, type: 'hearing_today' },
          sound: true,
        },
        trigger: { date: hearingDate },
      })
    }
  }

  return id
}

// ─── Cancel reminders for a case ────────────────────────
export async function cancelCaseReminders(cnr: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync()
  const toCancel  = scheduled.filter(n => n.content.data?.caseId === cnr)
  await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)))
}

// ─── Get all scheduled reminders ────────────────────────
export async function getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync()
}

// ─── Schedule reminders for all cases ───────────────────
export async function scheduleAllReminders(cases: CaseDetail[]): Promise<void> {
  for (const c of cases) {
    if (c.nextHearing && c.status !== 'disposed') {
      await scheduleHearingReminder(c)
    }
  }
}
