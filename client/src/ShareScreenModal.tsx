import { useState, type ReactNode } from 'react'
import { Modal } from './Modal'
import { MonitorIcon, AppWindowIcon, BrowserTabIcon, XIcon } from './Icon'

export type DisplaySurface = 'monitor' | 'window' | 'browser'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

const OPTIONS: { key: DisplaySurface; label: string; desc: string; icon: ReactNode }[] = [
  { key: 'monitor', label: 'Tela inteira', desc: 'Compartilhe tudo que está na sua tela', icon: <MonitorIcon size={22} /> },
  { key: 'window', label: 'Uma janela', desc: 'Compartilhe apenas um programa aberto', icon: <AppWindowIcon size={22} /> },
  { key: 'browser', label: 'Uma aba do navegador', desc: 'Compartilhe apenas uma aba do Chrome', icon: <BrowserTabIcon size={22} /> },
]

export function ShareScreenModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (options: { displaySurface: DisplaySurface; audio: boolean }) => void
}) {
  const [surface, setSurface] = useState<DisplaySurface>('monitor')
  const [audio, setAudio] = useState(true)

  return (
    <Modal onClose={onClose} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>Compartilhar tela</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <XIcon size={16} />
          </button>
        </div>
        <p className="add-server-option-desc" style={{ margin: '0 0 16px' }}>
          Escolha o que você quer compartilhar. Em seguida o navegador vai pedir para você confirmar.
        </p>
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className={`add-server-type-card ${surface === opt.key ? 'selected' : ''}`}
            onClick={() => setSurface(opt.key)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="add-server-option-icon">{opt.icon}</div>
              <div>
                <p className="add-server-option-title">{opt.label}</p>
                <p className="add-server-option-desc">{opt.desc}</p>
              </div>
            </div>
          </button>
        ))}
        <div className="settings-toggle-row share-screen-audio-row">
          <div>
            <p className="settings-toggle-label">Compartilhar áudio</p>
            <p className="settings-toggle-desc">Inclui o som do sistema, da janela ou da aba escolhida</p>
          </div>
          <button className={`settings-switch ${audio ? 'on' : ''}`} onClick={() => setAudio((a) => !a)}>
            <span className="settings-switch-knob" />
          </button>
        </div>
        {audio && isMac && surface !== 'browser' && (
          <p className="edit-hint" style={{ marginTop: -8 }}>
            No Mac, "Tela inteira" e "Uma janela" não conseguem compartilhar o som do sistema (limitação do
            navegador). Pra compartilhar áudio, escolha "Uma aba do navegador".
          </p>
        )}
        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="edit-save-btn" onClick={() => onConfirm({ displaySurface: surface, audio })}>
            Continuar
          </button>
        </div>
      </div>
    </Modal>
  )
}
