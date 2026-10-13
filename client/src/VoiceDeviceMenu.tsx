import { useEffect, useRef, useState } from 'react'

const DEVICE_KIND_MAP: Record<'mic' | 'speaker' | 'camera', MediaDeviceKind> = {
  mic: 'audioinput',
  speaker: 'audiooutput',
  camera: 'videoinput',
}

const LABEL_MAP: Record<'mic' | 'speaker' | 'camera', { menu: string; fallback: string }> = {
  mic: { menu: 'Entrada de áudio', fallback: 'Microfone' },
  speaker: { menu: 'Saída de áudio', fallback: 'Alto-falante' },
  camera: { menu: 'Câmera', fallback: 'Câmera' },
}

export function VoiceDeviceMenu({
  kind,
  currentDeviceId,
  onSelect,
  onOpenSettings,
  onClose,
}: {
  kind: 'mic' | 'speaker' | 'camera'
  currentDeviceId: string | null
  onSelect: (deviceId: string) => void
  onOpenSettings: () => void
  onClose: () => void
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) => setDevices(all.filter((d) => d.kind === DEVICE_KIND_MAP[kind])))
      .catch(() => setDevices([]))
  }, [kind])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div className="voice-device-menu" ref={ref}>
      <div className="voice-device-menu-label">{LABEL_MAP[kind].menu}</div>
      {devices.length === 0 && <div className="voice-device-menu-empty">Nenhum dispositivo encontrado.</div>}
      {devices.map((d, i) => (
        <button
          key={d.deviceId || i}
          className={`voice-device-menu-item ${d.deviceId === currentDeviceId ? 'active' : ''}`}
          onClick={() => {
            onSelect(d.deviceId)
            onClose()
          }}
        >
          {d.label || `${LABEL_MAP[kind].fallback} ${i + 1}`}
        </button>
      ))}
      <div className="voice-device-menu-divider" />
      <button
        className="voice-device-menu-item"
        onClick={() => {
          onOpenSettings()
          onClose()
        }}
      >
        Abrir configurações
      </button>
    </div>
  )
}
