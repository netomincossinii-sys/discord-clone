import { useEffect, useRef } from 'react'
import type { PresenceUser } from './types'

type MediaElementWithSink = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }

function PeerAudio({
  peerKey,
  stream,
  deafened,
  speakerDeviceId,
  volume = 100,
}: {
  peerKey: string
  stream?: MediaStream
  deafened: boolean
  speakerDeviceId: string | null
  volume?: number
}) {
  const ref = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream
      ref.current.play().catch(() => {})
    }
  }, [stream])

  useEffect(() => {
    if (ref.current) ref.current.volume = Math.min(100, Math.max(0, volume)) / 100
  }, [volume])

  useEffect(() => {
    const el = ref.current as MediaElementWithSink | null
    if (el && speakerDeviceId && el.setSinkId) el.setSinkId(speakerDeviceId).catch(() => {})
  }, [speakerDeviceId])

  if (!stream) return null
  return <audio key={peerKey} ref={ref} autoPlay muted={deafened} style={{ display: 'none' }} />
}

export function VoiceAudioSink({
  participants,
  deafened,
  speakerDeviceId,
  screenVolumes,
  userVolumes,
  mutedUserIds,
}: {
  participants: Map<string, { user: PresenceUser; stream?: MediaStream; screenStream?: MediaStream }>
  deafened: boolean
  speakerDeviceId: string | null
  screenVolumes?: Record<string, number>
  userVolumes?: Record<string, number>
  mutedUserIds?: Set<string>
}) {
  return (
    <>
      {Array.from(participants.entries()).map(([peerId, p]) => (
        <PeerAudio
          key={peerId}
          peerKey={peerId}
          stream={p.stream}
          deafened={deafened}
          speakerDeviceId={speakerDeviceId}
          volume={mutedUserIds?.has(peerId) ? 0 : userVolumes?.[peerId]}
        />
      ))}
      {Array.from(participants.entries())
        .filter(([, p]) => p.screenStream)
        .map(([peerId, p]) => (
          <PeerAudio
            key={`${peerId}-screen`}
            peerKey={`${peerId}-screen`}
            stream={p.screenStream}
            deafened={deafened}
            speakerDeviceId={speakerDeviceId}
            volume={screenVolumes?.[`${peerId}-screen`]}
          />
        ))}
    </>
  )
}
