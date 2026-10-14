import { useEffect, useRef, useState } from 'react'

const SAFETY_TIMEOUT_MS = 3800

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(false)
  const [fading, setFading] = useState(false)

  function finish() {
    if (doneRef.current) return
    doneRef.current = true
    setFading(true)
    window.setTimeout(onDone, 220)
  }

  useEffect(() => {
    const timeout = window.setTimeout(finish, SAFETY_TIMEOUT_MS)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`splash-screen ${fading ? 'fading' : ''}`}>
      <video className="splash-video" src="/splash.mp4" autoPlay muted playsInline onEnded={finish} />
    </div>
  )
}
