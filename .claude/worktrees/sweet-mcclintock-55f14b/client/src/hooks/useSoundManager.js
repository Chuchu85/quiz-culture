import { useEffect, useRef, useCallback } from 'react'

/**
 * Manages game sounds/music.
 * Tries to autoplay immediately; if the browser blocks it,
 * retries silently on the first user interaction (click or keydown).
 */
export default function useSoundManager(sounds) {
  const loopRef = useRef(null)
  const soundsRef = useRef(sounds)
  // Pending action to replay after autoplay is unblocked
  const pendingRef = useRef(null)

  useEffect(() => { soundsRef.current = sounds }, [sounds])

  const stopLoop = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.pause()
      loopRef.current.src = ''
      loopRef.current = null
    }
  }, [])

  // Attach one-time listeners to retry on first user gesture
  const scheduleRetry = useCallback((fn) => {
    const handler = () => {
      fn()
      document.removeEventListener('click', handler)
      document.removeEventListener('keydown', handler)
    }
    document.addEventListener('click', handler, { once: true })
    document.addEventListener('keydown', handler, { once: true })
  }, [])

  const playLoop = useCallback((key) => {
    const url = soundsRef.current?.[key]
    stopLoop()
    if (!url) return
    const audio = new Audio(url)
    audio.loop = true
    audio.volume = 0.65
    loopRef.current = audio
    const attempt = () => {
      audio.play().catch(() => {
        // Browser blocked autoplay — retry on first interaction
        scheduleRetry(() => {
          // Re-read current pending in case status changed
          const pending = pendingRef.current
          if (pending) {
            pending()
            pendingRef.current = null
          } else {
            audio.play().catch(() => {})
          }
        })
      })
    }
    pendingRef.current = attempt
    attempt()
  }, [stopLoop, scheduleRetry])

  const playOnce = useCallback((key) => {
    const url = soundsRef.current?.[key]
    if (!url) return
    const audio = new Audio(url)
    audio.volume = 0.8
    audio.play().catch(() => {
      scheduleRetry(() => audio.play().catch(() => {}))
    })
  }, [scheduleRetry])

  useEffect(() => () => stopLoop(), [stopLoop])

  return { playOnce, playLoop, stopLoop }
}
