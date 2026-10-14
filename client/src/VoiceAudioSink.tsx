import { useEffect, useRef } from 'react'
import type { PresenceUser } from './types'

type MediaElementWithSink = HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> }

function PeerAudio({
  peerKey,
  stream,
  deafened,
  speakerDeviceId,
}: {
  peerKey: string
  stream?: MediaStream
  deafened: boolean
  speakerDeviceId: string | null
}) {
  const ref = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream
  }, [stream])

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
}: {
  participants: Map<string, { user: PresenceUser; stream?: MediaStream; screenStream?: MediaStream }>
  deafened: boolean
  speakerDeviceId: string | null
}) {
  return (
    <>
      {Array.from(participants.entries()).map(([peerId, p]) => (
        <PeerAudio key={peerId} peerKey={peerId} stream={p.stream} deafened={deafened} speakerDeviceId={speakerDeviceId} />
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
          />
        ))}
    </>
  )
}
