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
} from './Icon'

export function ConnectedVoiceBar({
  label,
  micOn,
  deafened,
  camOn,
  isSharingScreen,
  onOpenView,
  onToggleMic,
  onToggleDeafen,
  onToggleCam,
  onToggleScreenShare,
  onDisconnect,
}: {
  label: string
  micOn: boolean
  deafened: boolean
  camOn: boolean
  isSharingScreen: boolean
  onOpenView: () => void
  onToggleMic: () => void
  onToggleDeafen: () => void
  onToggleCam: () => void
  onToggleScreenShare: () => void
  onDisconnect: () => void
}) {
  return (
    <div className="connected-voice-bar">
      <button className="connected-voice-bar-main" onClick={onOpenView}>
        <div className="connected-voice-bar-title">
          <span className="connected-voice-bar-dot" />
          Voz conectada
        </div>
        <div className="connected-voice-bar-subtitle">{label}</div>
      </button>
      <button
        className="connected-voice-bar-hangup"
        onClick={(e) => {
          e.stopPropagation()
          onDisconnect()
        }}
        title="Desconectar"
      >
        <PhoneOffIcon size={16} />
      </button>
      <div className="connected-voice-bar-mini-controls">
        <button
          className={`connected-voice-mini-btn ${micOn ? '' : 'off'}`}
          onClick={onToggleMic}
          title={micOn ? 'Mutar microfone' : 'Ativar microfone'}
        >
          {micOn ? <MicIcon size={16} /> : <MicOffIcon size={16} />}
        </button>
        <button
          className={`connected-voice-mini-btn ${deafened ? 'off' : ''}`}
          onClick={onToggleDeafen}
          title={deafened ? 'Parar de ensurdecer' : 'Ensurdecer'}
        >
          {deafened ? <HeadphonesOffIcon size={16} /> : <HeadphonesIcon size={16} />}
        </button>
        <button
          className={`connected-voice-mini-btn ${camOn ? 'on' : ''}`}
          onClick={onToggleCam}
          title={camOn ? 'Desligar câmera' : 'Ligar câmera'}
        >
          {camOn ? <VideoIcon size={16} /> : <VideoOffIcon size={16} />}
        </button>
        <button
          className={`connected-voice-mini-btn ${isSharingScreen ? 'on' : ''}`}
          onClick={onToggleScreenShare}
          title={isSharingScreen ? 'Parar de compartilhar tela' : 'Compartilhar tela'}
        >
          {isSharingScreen ? <ScreenShareOffIcon size={16} /> : <ScreenShareIcon size={16} />}
        </button>
      </div>
    </div>
  )
}
