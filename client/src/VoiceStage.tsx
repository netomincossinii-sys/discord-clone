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
  MaximizeIcon,
  MinimizeIcon,
  Volume2Icon,
} from './Icon'

function bannerStyle(color: string): React.CSSProperties {
  return { background: `linear-gradient(160deg, ${color}66 0%, ${color}22 45%, var(--color-bg-900) 85%)` }
}

function TileStatusIcons({ micOn, deafened }: { micOn?: boolean; deafened?: boolean }) {
  if (deafened) return <HeadphonesOffIcon size={13} />
  if (micOn === false) return <MicOffIcon size={13} />
  return null
}

function LocalTile({
  localUser,
  localStream,
  camOn,
  micOn,
  deafened,
  speaking,
  onContextMenu,
}: {
  localUser: PresenceUser
  localStream: MediaStream | null
  camOn: boolean
  micOn: boolean
  deafened: boolean
  speaking: boolean
  onContextMenu: (e: React.MouseEvent, userId: string, username: string, peerId: string | null) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream])

  return (
    <div
      className={`voice-tile ${speaking ? 'speaking' : ''}`}
      style={camOn ? undefined : bannerStyle(localUser.color)}
      onContextMenu={(e) => onContextMenu(e, localUser.id, localUser.username, null)}
    >
      <video ref={videoRef} autoPlay playsInline muted className={camOn ? 'visible' : 'hidden'} />
      {!camOn &&
        (localUser.avatarImage ? (
          <img className="voice-avatar-img" src={localUser.avatarImage} alt="" />
        ) : (
          <div className="voice-avatar" style={{ background: localUser.color }}>
            {localUser.username.slice(0, 1).toUpperCase()}
          </div>
        ))}
      <div className="voice-tile-label">
        {localUser.username} (você)
        <TileStatusIcons micOn={micOn} deafened={deafened} />
      </div>
    </div>
  )
}

function RemoteTile({
  peerId,
  user,
  stream,
  speaking,
  onContextMenu,
}: {
  peerId: string
  user: PresenceUser
  stream?: MediaStream
  speaking: boolean
  onContextMenu: (e: React.MouseEvent, userId: string, username: string, peerId: string | null) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const hasVideo = (stream?.getVideoTracks().length ?? 0) > 0

  return (
    <div
      className={`voice-tile ${speaking ? 'speaking' : ''}`}
      style={hasVideo ? undefined : bannerStyle(user.color)}
      key={peerId}
      onContextMenu={(e) => onContextMenu(e, user.id, user.username, peerId)}
    >
      {/* audio for this peer is played by the always-mounted VoiceAudioSink, not here, so it keeps playing while this tile is unmounted */}
      <video ref={videoRef} autoPlay playsInline muted className={hasVideo ? 'visible' : 'hidden'} />
      {!hasVideo &&
        (user.avatarImage ? (
          <img className="voice-avatar-img" src={user.avatarImage} alt="" />
        ) : (
          <div className="voice-avatar" style={{ background: user.color }}>
            {user.username.slice(0, 1).toUpperCase()}
          </div>
        ))}
      <div className="voice-tile-label">
        {user.username}
        <TileStatusIcons micOn={user.micOn} deafened={user.deafened} />
      </div>
    </div>
  )
}

function ScreenVolumeMenu({ volume, onChange, onClose }: { volume: number; onChange: (v: number) => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  return (
    <div ref={ref} className="screen-volume-menu" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
      <div className="voice-device-menu-label">
        <Volume2Icon size={14} /> Volume — {volume}%
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={(e) => onChange(Number(e.target.value))}
        className="settings-slider"
      />
    </div>
  )
}

function ScreenTile({
  label,
  stream,
  focused,
  onToggleFocus,
  volume,
  onVolumeChange,
}: {
  label: string
  stream: MediaStream
  focused: boolean
  onToggleFocus: () => void
  volume?: number
  onVolumeChange?: (v: number) => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showVolumeMenu, setShowVolumeMenu] = useState(false)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  return (
    <div
      className={`voice-tile screen-tile ${focused ? 'focused' : ''}`}
      onContextMenu={(e) => {
        if (!onVolumeChange) return
        e.preventDefault()
        setShowVolumeMenu(true)
      }}
    >
      {/* audio (if the shared stream has any) is played by the always-mounted VoiceAudioSink, not here */}
      <video ref={videoRef} autoPlay playsInline muted className="visible" onDoubleClick={onToggleFocus} />
      <div className="live-badge">
        <span className="live-badge-dot" /> AO VIVO
      </div>
      <button
        className="screen-tile-fullscreen-btn"
        onClick={onToggleFocus}
        title={focused ? 'Diminuir' : 'Ampliar'}
      >
        {focused ? <MinimizeIcon size={22} /> : <MaximizeIcon size={22} />}
      </button>
      <div className="voice-tile-label">
        <ScreenShareIcon size={13} /> {label}
      </div>
      {showVolumeMenu && onVolumeChange && (
        <ScreenVolumeMenu volume={volume ?? 100} onChange={onVolumeChange} onClose={() => setShowVolumeMenu(false)} />
      )}
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
  screenVolumes,
  onScreenVolumeChange,
  onUserContextMenu,
}: {
  channelName: string
  localUser: PresenceUser
  localStream: MediaStream | null
  camOn: boolean
  micOn: boolean
  deafened: boolean
  micDeviceId: string | null
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
  screenVolumes: Record<string, number>
  onScreenVolumeChange: (key: string, volume: number) => void
  onUserContextMenu: (e: React.MouseEvent, userId: string, username: string, peerId: string | null) => void
}) {
  const [showMicMenu, setShowMicMenu] = useState(false)
  const [showCamMenu, setShowCamMenu] = useState(false)
  const [focusedKey, setFocusedKey] = useState<string | null>(null)

  const screenTiles: { key: string; label: string; stream: MediaStream; isLocal: boolean }[] = []
  if (screenStream) screenTiles.push({ key: 'local-screen', label: 'Sua tela', stream: screenStream, isLocal: true })
  participants.forEach((p, peerId) => {
    if (p.screenStream) {
      screenTiles.push({ key: `${peerId}-screen`, label: p.user.username, stream: p.screenStream, isLocal: false })
    }
  })
  const screenKeysSignature = screenTiles.map((t) => t.key).join(',')

  useEffect(() => {
    if (focusedKey && !screenKeysSignature.split(',').includes(focusedKey)) setFocusedKey(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenKeysSignature, focusedKey])

  function toggleFocus(key: string) {
    setFocusedKey((prev) => (prev === key ? null : key))
  }

  const focusedTile = screenTiles.find((t) => t.key === focusedKey)

  const totalGridTiles = 1 + participants.size + screenTiles.length
  const gridCols = Math.max(1, Math.ceil(Math.sqrt(totalGridTiles)))

  const cameraTiles = (
    <>
      <LocalTile
        localUser={localUser}
        localStream={localStream}
        camOn={camOn}
        micOn={micOn}
        deafened={deafened}
        speaking={speakingPeers.has('local')}
        onContextMenu={onUserContextMenu}
      />
      {Array.from(participants.entries()).map(([peerId, p]) => (
        <RemoteTile
          key={peerId}
          peerId={peerId}
          user={p.user}
          stream={p.stream}
          speaking={speakingPeers.has(peerId)}
          onContextMenu={onUserContextMenu}
        />
      ))}
    </>
  )

  return (
    <div className="voice-stage">
      <header className="chat-header">🔊 {channelName}</header>
      {error && <div className="voice-error">{error}</div>}
      {focusedTile ? (
        <div className="voice-focused-layout">
          <div className="voice-focused-main">
            <ScreenTile
              label={focusedTile.label}
              stream={focusedTile.stream}
              focused
              onToggleFocus={() => toggleFocus(focusedTile.key)}
              volume={screenVolumes[focusedTile.key]}
              onVolumeChange={focusedTile.isLocal ? undefined : (v) => onScreenVolumeChange(focusedTile.key, v)}
            />
          </div>
          <div className="voice-thumbnail-row">
            {cameraTiles}
            {screenTiles
              .filter((t) => t.key !== focusedTile.key)
              .map((t) => (
                <ScreenTile
                  key={t.key}
                  label={t.label}
                  stream={t.stream}
                  focused={false}
                  onToggleFocus={() => toggleFocus(t.key)}
                  volume={screenVolumes[t.key]}
                  onVolumeChange={t.isLocal ? undefined : (v) => onScreenVolumeChange(t.key, v)}
                />
              ))}
          </div>
        </div>
      ) : (
        <div className="voice-grid" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {cameraTiles}
          {screenTiles.map((t) => (
            <ScreenTile
              key={t.key}
              label={t.label}
              stream={t.stream}
              focused={false}
              onToggleFocus={() => toggleFocus(t.key)}
              volume={screenVolumes[t.key]}
              onVolumeChange={t.isLocal ? undefined : (v) => onScreenVolumeChange(t.key, v)}
            />
          ))}
        </div>
      )}
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
