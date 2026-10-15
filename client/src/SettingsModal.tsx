import { useEffect, useState } from 'react'
import * as api from './api'
import { BANNER_COLORS } from './api'
import type { Profile } from './api'
import { setStoredAccentColor, getStoredAccentColor } from './theme'
import { Modal } from './Modal'
import { SFX } from './sfx'
import * as prefs from './voicePrefs'
import type { useVoice } from './useVoice'

export type Section = 'conta' | 'boost' | 'voz' | 'aparencia' | 'notif' | 'privacidade'

const NAV_ITEMS: { key: Section; label: string; icon: string; highlight?: boolean }[] = [
  { key: 'conta', label: 'Minha conta', icon: '👤' },
  { key: 'boost', label: 'Boost', icon: '🚀', highlight: true },
  { key: 'voz', label: 'Voz e vídeo', icon: '🎙️' },
  { key: 'aparencia', label: 'Aparência', icon: '🎨' },
  { key: 'notif', label: 'Notificações', icon: '🔔' },
  { key: 'privacidade', label: 'Privacidade', icon: '🛡️' },
]

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  disabled,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}) {
  return (
    <div className="settings-toggle-row">
      <div>
        <p className="settings-toggle-label">{label}</p>
        <p className="settings-toggle-desc">{description}</p>
      </div>
      <button
        className={`settings-switch ${enabled ? 'on' : ''}`}
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? 'Desativado automaticamente' : undefined}
      >
        <span className="settings-switch-knob" />
      </button>
    </div>
  )
}

function AccountSection({ userId, onEditProfile }: { userId: string; onEditProfile: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    api.getProfile(userId).then(setProfile)
  }, [userId])

  if (!profile) return <div className="profile-loading">Carregando...</div>

  return (
    <div>
      <h2>Minha conta</h2>
      <div className="account-card">
        <div
          className="profile-banner"
          style={
            profile.bannerImage
              ? { backgroundImage: `url(${profile.bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: profile.bannerColor }
          }
        />
        <div className="account-card-body">
          <div className="account-card-row">
            {profile.avatarImage ? (
              <img className="account-avatar-img" src={profile.avatarImage} alt="" />
            ) : (
              <div className="account-avatar-fallback" style={{ background: profile.color }}>
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
            <button className="account-edit-btn" onClick={onEditProfile}>
              Editar perfil
            </button>
          </div>
          <p className="account-username">{profile.username}</p>
          {profile.bio && <p className="account-bio">{profile.bio}</p>}
        </div>
      </div>
    </div>
  )
}

const BOOST_PERKS = [
  { title: '1080p · 60fps no compartilhamento de tela', description: 'Máxima qualidade pra quem tá assistindo você.' },
  { title: 'Imagem própria como fundo da câmera', description: 'Além de desfocar, escolha qualquer foto pra aparecer atrás de você.' },
  { title: 'Banner de servidor com imagem e GIF', description: 'Deixe seus servidores com a sua cara.' },
  { title: 'Selo de Boost no seu perfil', description: 'Todo mundo vai saber que você apoia o Callfy.' },
  { title: 'Cor de destaque personalizada', description: 'Escolha qualquer cor pro app, não só as prontas.' },
  { title: 'Até 10 tags de interesse no perfil', description: 'O dobro do limite gratuito (5), pra contar mais sobre você.' },
]

function BoostSection() {
  const [notice, setNotice] = useState(false)
  return (
    <div>
      <h2>Boost</h2>
      <div className="boost-banner">
        <div className="boost-banner-title">Desbloqueie um Mundo de Vantagens com Boost</div>
        <div className="boost-banner-price">R$ 15,00/mês via Pix · cancele quando quiser</div>
        <div className="boost-banner-actions">
          <button className="boost-btn-primary" onClick={() => setNotice(true)}>
            🚀 Inscrever-se
          </button>
          <button className="boost-btn-secondary" onClick={() => setNotice(true)}>
            🎁 Presentear Boost
          </button>
        </div>
        {notice && <div className="boost-notice">Pagamentos ainda não estão disponíveis neste protótipo.</div>}
      </div>
      {BOOST_PERKS.map((perk) => (
        <div className="boost-perk" key={perk.title}>
          <span className="boost-perk-check">✓</span>
          <div>
            <p className="boost-perk-title">{perk.title}</p>
            <p className="boost-perk-desc">{perk.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function AppearanceSection() {
  const [accent, setAccent] = useState(getStoredAccentColor() ?? '#f37108')
  return (
    <div>
      <h2>Aparência</h2>
      <div className="edit-label">Cor de destaque</div>
      <div className="edit-hint">Muda a cor de botões, links e ícones ativos em todo o app.</div>
      <div className="banner-color-list">
        {BANNER_COLORS.map((color) => (
          <button
            key={color}
            className={`banner-color-swatch ${accent === color ? 'active' : ''}`}
            style={{ background: color }}
            onClick={() => {
              setAccent(color)
              setStoredAccentColor(color)
            }}
          />
        ))}
      </div>
      <div className="settings-divider" />
      <div className="edit-label">
        Modo claro / escuro <span className="settings-soon-badge">EM BREVE</span>
      </div>
      <div className="edit-hint">Um modo claro pra quem preferir está a caminho.</div>
    </div>
  )
}

function NotificationsSection() {
  const [sfxEnabled, setSfxEnabledState] = useState(prefs.isSfxEnabled())
  const [desktopEnabled, setDesktopEnabledState] = useState(prefs.isDesktopNotificationsEnabled())
  const [notice, setNotice] = useState<string | null>(null)

  function toggleSfx() {
    const next = !sfxEnabled
    setSfxEnabledState(next)
    prefs.setSfxEnabled(next)
    if (next) SFX.connect()
  }

  async function toggleDesktop() {
    if (!desktopEnabled) {
      if (!('Notification' in window)) {
        setNotice('Seu navegador não suporta notificações do sistema.')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setNotice('Permissão negada. Ative nas configurações do navegador se mudar de ideia.')
        return
      }
    }
    const next = !desktopEnabled
    setDesktopEnabledState(next)
    prefs.setDesktopNotificationsEnabled(next)
  }

  return (
    <div>
      <h2>Notificações</h2>
      <ToggleRow
        label="Efeitos sonoros"
        description="Sons de mensagem, entrar/sair de call, mutar e desmutar."
        enabled={sfxEnabled}
        onToggle={toggleSfx}
      />
      <ToggleRow
        label="Notificações do sistema"
        description="Mostra um aviso do próprio computador quando chega mensagem, mesmo com a aba minimizada."
        enabled={desktopEnabled}
        onToggle={toggleDesktop}
      />
      {notice && <div className="auth-error">{notice}</div>}
    </div>
  )
}

function PrivacySection() {
  return (
    <div>
      <h2>Privacidade</h2>
      <p className="edit-hint">
        Gerencie quem você bloqueou. Quem você bloqueia não consegue mandar DM nem pedido de amizade pra
        você, e as mensagens dessa pessoa ficam escondidas nos servidores em comum.
      </p>
      <div className="edit-label">Usuários bloqueados — 0</div>
      <p className="account-bio">Você ainda não bloqueou ninguém.</p>
    </div>
  )
}

interface DeviceOption {
  deviceId: string
  label: string
}

function useDeviceList(kind: MediaDeviceKind) {
  const [devices, setDevices] = useState<DeviceOption[]>([])
  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) =>
        setDevices(
          all
            .filter((d) => d.kind === kind)
            .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Dispositivo ${i + 1}` })),
        ),
      )
      .catch(() => setDevices([]))
  }, [kind])
  return devices
}

function VoiceSection({ voice }: { voice: ReturnType<typeof useVoice> }) {
  const mics = useDeviceList('audioinput')
  const speakers = useDeviceList('audiooutput')
  const cameras = useDeviceList('videoinput')
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    let stream: MediaStream | null = null
    navigator.mediaDevices
      ?.getUserMedia({ video: voice.cameraDeviceId ? { deviceId: { exact: voice.cameraDeviceId } } : true })
      .then((s) => {
        stream = s
        setPreviewStream(s)
      })
      .catch(() => setPreviewStream(null))
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [voice.cameraDeviceId])

  return (
    <div>
      <h2>Voz e vídeo</h2>

      <div className="edit-label">Microfone</div>
      <select className="settings-select" value={voice.micDeviceId ?? ''} onChange={(e) => voice.selectMicDevice(e.target.value)}>
        <option value="" disabled>
          Padrão do sistema
        </option>
        {mics.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>

      <div className="edit-label">Alto-falante</div>
      <select
        className="settings-select"
        value={voice.speakerDeviceId ?? ''}
        onChange={(e) => voice.selectSpeakerDevice(e.target.value)}
      >
        <option value="" disabled>
          Padrão do sistema
        </option>
        {speakers.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>

      <div className="edit-label">Câmera</div>
      <select
        className="settings-select"
        value={voice.cameraDeviceId ?? ''}
        onChange={(e) => voice.selectCameraDevice(e.target.value)}
      >
        <option value="" disabled>
          Padrão do sistema
        </option>
        {cameras.map((d) => (
          <option key={d.deviceId} value={d.deviceId}>
            {d.label}
          </option>
        ))}
      </select>

      <video
        className="camera-preview"
        autoPlay
        playsInline
        muted
        ref={(el) => {
          if (el && previewStream) el.srcObject = previewStream
        }}
      />
      <p className="edit-hint">Prévia de como sua câmera aparece nas calls.</p>

      <div className="settings-divider" />

      <div className="settings-row-between">
        <span className="edit-label" style={{ margin: 0 }}>
          Volume do microfone
        </span>
        <span className="edit-counter-inline">{voice.micVolume}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={200}
        value={voice.micVolume}
        onChange={(e) => voice.setMicVolume(Number(e.target.value))}
        className="settings-slider"
      />
      <p className="edit-hint">Acima de 100% amplifica sua voz — cuidado pra não distorcer ou captar mais ruído.</p>

      <div className="settings-divider" />

      <ToggleRow
        label="Supressão de ruído (nativa do navegador)"
        description="Reduz ruído de fundo, ventilador, teclado. Processado pelo próprio navegador."
        enabled={voice.noiseSuppression}
        onToggle={voice.toggleNoiseSuppression}
      />
      <ToggleRow
        label="Cancelamento de eco"
        description="Evita que o som dos seus alto-falantes volte pelo microfone."
        enabled={voice.echoCancellation}
        onToggle={voice.toggleEchoCancellation}
      />
      <p className="edit-hint">
        Supressão de ruído por IA (RNNoise) e usar o celular como câmera ainda não foram portados pra esse
        protótipo.
      </p>
    </div>
  )
}

export function SettingsModal({
  userId,
  voice,
  onClose,
  onEditProfile,
  onLogout,
  initialSection,
}: {
  userId: string
  voice: ReturnType<typeof useVoice>
  onClose: () => void
  onEditProfile: () => void
  onLogout: () => void
  initialSection?: Section
}) {
  const [section, setSection] = useState<Section>(initialSection ?? 'conta')

  return (
    <Modal onClose={onClose} width={840}>
      <div className="settings-modal">
        <nav className="settings-nav">
          <div className="settings-nav-title">CONFIGURAÇÕES DO USUÁRIO</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`settings-nav-item ${section === item.key ? 'active' : ''} ${item.highlight && section !== item.key ? 'highlight' : ''}`}
              onClick={() => setSection(item.key)}
            >
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <button className="settings-logout" onClick={onLogout}>
            Sair da conta
          </button>
        </nav>
        <div className="settings-content">
          {section === 'conta' && <AccountSection userId={userId} onEditProfile={onEditProfile} />}
          {section === 'boost' && <BoostSection />}
          {section === 'voz' && <VoiceSection voice={voice} />}
          {section === 'aparencia' && <AppearanceSection />}
          {section === 'notif' && <NotificationsSection />}
          {section === 'privacidade' && <PrivacySection />}
        </div>
      </div>
    </Modal>
  )
}
