import { useEffect, useRef, useState } from 'react'
import type { PresenceUser } from './types'
import { VoiceDeviceMenu } from './VoiceDeviceMenu'
import {
  MicIcon,
  MicOffIcon,
  HeadphonesIcon,
  HeadphonesOffIcon,
  VideoIcon,
  VideoOffIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
  PhoneOffIcon,
  ChevronDownIcon,
} from './Icon'

type MediaElementWithSink = HTMLVideoElement & { setSinkId?: (id: string) => Promise<void> }

function bannerStyle(color: string): React.CSSProperties {
  return { background: `linear-gradient(160deg, ${color}66 0%, ${color}22 45%, var(--color-bg-900) 85%)` }
}

function RemoteTile({
  peerId,
  user,
  stream,
  deafened,
  speakerDeviceId,
  speaking,
}: {
  peerId: string
  user: PresenceUser
  stream?: MediaStream
  deafened: boolean
  speakerDeviceId: string | null
  speaking: boolean
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  useEffect(() => {
    const el = videoRef.current as MediaElementWithSink | null
    if (el && speakerDeviceId && el.setSinkId) {
      el.setSinkId(speakerDeviceId).catch(() => {})
    }
  }, [speakerDeviceId])

  const hasVideo = (stream?.getVideoTracks().length ?? 0) > 0

  return (
    <div
      className={`voice-tile ${speaking ? 'speaking' : ''}`}
      style={hasVideo ? undefined : bannerStyle(user.color)}
      key={peerId}
    >
      <video ref={videoRef} autoPlay playsInline muted={deafened} className={hasVideo ? 'visible' : 'hidden'} />
      {!hasVideo &&
        (user.avatarImage ? (
          <img className="voice-avatar-img" src={user.avatarImage} alt="" />
        ) : (
          <div className="voice-avatar" style={{ background: user.color }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        ))}
      <div className="voice-tile-label">{user.username}</div>
    </div>
  )
}

function ScreenTile({ label, stream, muted }: { label: string; stream: MediaStream; muted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div className="voice-tile screen-tile">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="visible" />
      <div className="voice-tile-label">
        <ScreenShareIcon size={13} /> {label}
      </div>
    </div>
  )
}

export function VoiceStage({
  channelName,
  localUser,
  localStream,
  camOn,
  micOn,
  deafened,
  micDeviceId,
  speakerDeviceId,
  cameraDeviceId,
  screenStream,
  isSharingScreen,
  participants,
  speakingPeers,
  error,
  onToggleMic,
  onToggleCam,
  onToggleDeafen,
  onToggleScreenShare,
  onSelectMicDevice,
  onSelectCameraDevice,
  onOpenSettings,
  onLeave,
}: {
  channelName: string
  localUser: PresenceUser
  localStream: MediaStream | null
  camOn: boolean
  micOn: boolean
  deafened: boolean
  micDeviceId: string | null
  speakerDeviceId: string | null
  cameraDeviceId: string | null
  screenStream: MediaStream | null
  isSharingScreen: boolean
  participants: Map<string, { user: PresenceUser; stream?: MediaStream; screenStream?: MediaStream }>
  speakingPeers: Set<string>
  error: string | null
  onToggleMic: () => void
  onToggleCam: () => void
  onToggleDeafen: () => void
  onToggleScreenShare: () => void
  onSelectMicDevice: (deviceId: string) => void
  onSelectCameraDevice: (deviceId: string) => void
  onOpenSettings: () => void
  onLeave: () => void
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [showMicMenu, setShowMicMenu] = useState(false)
  const [showCamMenu, setShowCamMenu] = useState(false)

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <div className="voice-stage">
      <header className="chat-header">🔊 {channelName}</header>
      {error && <div className="voice-error">{error}</div>}
      <div className="voice-grid">
        <div
          className={`voice-tile ${speakingPeers.has('local') ? 'speaking' : ''}`}
          style={camOn ? undefined : bannerStyle(localUser.color)}
        >
          <video ref={localVideoRef} autoPlay playsInline muted className={camOn ? 'visible' : 'hidden'} />
          {!camOn &&
            (localUser.avatarImage ? (
              <img className="voice-avatar-img" src={localUser.avatarImage} alt="" />
            ) : (
              <div className="voice-avatar" style={{ background: localUser.color }}>
                {localUser.username.slice(0, 1).toUpperCase()}
              </div>
            ))}
          <div className="voice-tile-label">{localUser.username} (você)</div>
        </div>
        {Array.from(participants.entries()).map(([peerId, p]) => (
          <RemoteTile
            key={peerId}
            peerId={peerId}
            user={p.user}
            stream={p.stream}
            deafened={deafened}
            speakerDeviceId={speakerDeviceId}
            speaking={speakingPeers.has(peerId)}
          />
        ))}
        {screenStream && <ScreenTile label="Sua tela" stream={screenStream} muted />}
        {Array.from(participants.entries())
          .filter(([, p]) => p.screenStream)
          .map(([peerId, p]) => (
            <ScreenTile key={`${peerId}-screen`} label={p.user.username} stream={p.screenStream!} muted={deafened} />
          ))}
      </div>
      <div className="voice-controls">
        <div className="voice-controls-pill">
          <div className="voice-btn-wrap">
            <button className={`voice-pill-btn ${micOn ? '' : 'off'}`} onClick={onToggleMic} title="Microfone">
              {micOn ? <MicIcon size={18} /> : <MicOffIcon size={18} />}
            </button>
            <button
              className="voice-pill-chevron"
              onClick={() => {
                setShowCamMenu(false)
                setShowMicMenu((v) => !v)
              }}
              title="Escolher microfone"
            >
              <ChevronDownIcon size={14} />
            </button>
            {showMicMenu && (
              <VoiceDeviceMenu
                kind="mic"
                currentDeviceId={micDeviceId}
                onSelect={onSelectMicDevice}
                onOpenSettings={onOpenSettings}
                onClose={() => setShowMicMenu(false)}
              />
            )}
          </div>

          <button className={`voice-pill-btn ${deafened ? 'off' : ''}`} onClick={onToggleDeafen} title="Ensurdecer">
            {deafened ? <HeadphonesOffIcon size={18} /> : <HeadphonesIcon size={18} />}
          </button>

          <div className="voice-btn-wrap">
            <button className={`voice-pill-btn ${camOn ? 'on' : ''}`} onClick={onToggleCam} title="Câmera">
              {camOn ? <VideoIcon size={18} /> : <VideoOffIcon size={18} />}
            </button>
            <button
              className="voice-pill-chevron"
              onClick={() => {
                setShowMicMenu(false)
                setShowCamMenu((v) => !v)
              }}
              title="Escolher câmera"
            >
              <ChevronDownIcon size={14} />
            </button>
            {showCamMenu && (
              <VoiceDeviceMenu
                kind="camera"
                currentDeviceId={cameraDeviceId}
                onSelect={onSelectCameraDevice}
                onOpenSettings={onOpenSettings}
                onClose={() => setShowCamMenu(false)}
              />
            )}
          </div>

          <button
            className={`voice-pill-btn ${isSharingScreen ? 'on' : ''}`}
            onClick={onToggleScreenShare}
            title={isSharingScreen ? 'Parar de compartilhar tela' : 'Compartilhar tela'}
          >
            {isSharingScreen ? <ScreenShareOffIcon size={18} /> : <ScreenShareIcon size={18} />}
          </button>
        </div>

        <button className="voice-btn leave" onClick={onLeave} title="Sair da chamada">
          <PhoneOffIcon size={20} />
        </button>
      </div>
    </div>
  )
}
