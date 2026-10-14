import { useEffect, useRef, useState } from 'react'

const CHECK_INTERVAL_MS = 45_000

export function UpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const baselineRef = useRef<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkVersion() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data?.version) return
        if (baselineRef.current === null) {
          baselineRef.current = data.version
        } else if (data.version !== baselineRef.current) {
          setUpdateAvailable(true)
        }
      } catch {
        // network hiccup; just try again on the next tick
      }
    }

    checkVersion()
    const interval = window.setInterval(checkVersion, CHECK_INTERVAL_MS)

    function handleVisibility() {
      if (document.visibilityState === 'visible') checkVersion()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  if (!updateAvailable) return null

  return (
    <div className="update-toast">
      <span>Uma nova versão do Callfy está disponível.</span>
      <button onClick={() => window.location.reload()}>Atualizar agora</button>
    </div>
  )
}
