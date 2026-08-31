import { useEffect } from 'react'

// Every full-screen modal (`fixed inset-0 ... overflow-y-auto`) traps its
// own scroll fine, but never stopped the *page* underneath from also
// scrolling — a wheel/touch drag over the dark backdrop still scrolled
// Home/Tree/whatever page was open behind it, since nothing ever told the
// body itself to stop scrolling while a modal is up. Same fix
// TutorialOverlay already used inline; shared here so every modal doesn't
// have to repeat the save/restore dance.
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])
}
