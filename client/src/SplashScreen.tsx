import { useEffect, useRef, useState } from 'react'

const GIF_DURATION_MS = 2730 // one loop of /splash.gif (91 frames @ 30ms)

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
    const timeout = window.setTimeout(finish, GIF_DURATION_MS)
    return () => window.clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`splash-screen ${fading ? 'fading' : ''}`}>
      <img className="splash-media" src="/splash.gif" alt="" />
    </div>
  )
}
