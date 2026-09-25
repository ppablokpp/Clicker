import { useEffect, useRef } from 'react'
import { useDailyKeyContext } from '../context/DailyKeyContext'
import { useLanguage } from '../context/LanguageContext'
import { useClickDays } from '../hooks/useClickDays'
import { toLocalDateString } from '../lib/date'
import { syncReminders } from '../lib/notifications'

/**
 * Keeps the phone's two reminders in step with the game (see
 * lib/notifications): the daily key coming back, and the streak on a day
 * with no mining yet. Renders nothing.
 *
 * Runs once the state it depends on has arrived, and again whenever that
 * state changes — claiming the key or mining for the first time today
 * cancels the reminder that was about to be pointless.
 */
export function Reminders() {
  const { strings } = useLanguage()
  const { claimedToday } = useDailyKeyContext()
  const { clickDays } = useClickDays()
  const playedToday = clickDays.has(toLocalDateString(new Date()))
  // The texts change with the language; the reminders don't need to be
  // rewritten for it, so they are read fresh rather than depended on.
  const texts = useRef(strings.notifications)
  texts.current = strings.notifications

  useEffect(() => {
    void syncReminders({ keyAvailable: !claimedToday, playedToday }, texts.current)
  }, [claimedToday, playedToday])

  return null
}
