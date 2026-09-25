import { LocalNotifications } from '@capacitor/local-notifications'
import { isNativeApp } from './native'

/**
 * The two reminders the game sends, both scheduled by the phone itself —
 * no server, no Firebase, nothing to deliver: the app just tells Android
 * "wake me at this hour with this text" and the phone does the rest, even
 * with the app closed and offline.
 *
 *  - the daily key, when it comes back (just after midnight UTC, which is
 *    when the server's day rolls over)
 *  - the streak, in the evening of a day they have not played
 *
 * Both are re-scheduled every time the app opens, and each one always
 * replaces itself (fixed ids), so they can never pile up. Nothing is
 * scheduled in a browser — there is no phone to wake.
 */

const KEY_ID = 1
const STREAK_ID = 2

/** Where the evening reminder lands, local time. */
const STREAK_HOUR = 20

export interface NotificationTexts {
  keyTitle: string
  keyBody: string
  streakTitle: string
  streakBody: string
}

/** Whether we may post notifications at all, asking once if never asked. */
async function ensurePermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') return true
  // 'denied' is their answer, not a question to ask again on every launch.
  if (display === 'denied') return false
  const asked = await LocalNotifications.requestPermissions()
  return asked.display === 'granted'
}

/** Next time the server's day rolls over (the key resets at UTC midnight). */
function nextUtcMidnight(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 1))
}

/** Tonight at STREAK_HOUR, or tomorrow's if that hour has already passed. */
function nextEvening(): Date {
  const at = new Date()
  at.setHours(STREAK_HOUR, 0, 0, 0)
  if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1)
  return at
}

/**
 * Called on every launch with what the player's state is right now.
 *
 * @param keyAvailable  their daily key is already there to claim
 * @param playedToday   they have mined at least once today
 */
export async function syncReminders(
  { keyAvailable, playedToday }: { keyAvailable: boolean; playedToday: boolean },
  texts: NotificationTexts,
): Promise<void> {
  if (!isNativeApp()) return
  try {
    if (!(await ensurePermission())) return

    // Clear first: a reminder whose reason has gone (they claimed the key,
    // they played) must not fire, and re-scheduling on top of a pending one
    // of the same id would otherwise keep the old time.
    const pending = await LocalNotifications.getPending()
    const ours = pending.notifications.filter((n) => n.id === KEY_ID || n.id === STREAK_ID)
    if (ours.length > 0) await LocalNotifications.cancel({ notifications: ours })

    const notifications = []
    // The key: only worth a reminder once today's is spent — if it is
    // waiting for them right now, the badge in the store already says so.
    if (!keyAvailable) {
      notifications.push({
        id: KEY_ID,
        title: texts.keyTitle,
        body: texts.keyBody,
        schedule: { at: nextUtcMidnight(), allowWhileIdle: true },
        // Inexact on purpose: exact alarms are a restricted permission on
        // Android 13+ that Play only grants to alarm-shaped apps, and a
        // reminder that lands a few minutes late is still a reminder.
        isExactNotification: false,
      })
    }
    // The streak: tonight, and only if today is still empty. Playing later
    // re-runs this on the next launch and the reminder moves to tomorrow.
    if (!playedToday) {
      notifications.push({
        id: STREAK_ID,
        title: texts.streakTitle,
        body: texts.streakBody,
        schedule: { at: nextEvening(), allowWhileIdle: true },
        isExactNotification: false,
      })
    }
    if (notifications.length > 0) await LocalNotifications.schedule({ notifications })
  } catch (err) {
    // A phone that refuses to schedule is not a reason to break the game.
    console.warn('No se han podido programar los recordatorios', err)
  }
}
