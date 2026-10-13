import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { XIcon } from './Icon'
import { BANNER_COLORS } from './api'
import { resizeImageToDataUrl } from './imageUtils'
import type { ServerInfo } from './types'

const ICON_SIZE = 256
const BANNER_WIDTH = 640
const BANNER_HEIGHT = 240

function resizeBannerToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      img.onerror = reject
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = BANNER_WIDTH
        canvas.height = BANNER_HEIGHT
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('no_canvas_context'))
        const scale = Math.max(BANNER_WIDTH / img.width, BANNER_HEIGHT / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (BANNER_WIDTH - w) / 2, (BANNER_HEIGHT - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function EditServerModal({
  server,
  onClose,
  onSave,
}: {
  server: ServerInfo
  onClose: () => void
  onSave: (update: { name: string; iconImage: string | null; bannerColor: string | null; bannerImage: string | null }) => Promise<void>
}) {
  const [name, setName] = useState(server.name)
  const [iconImage, setIconImage] = useState<string | null>(server.iconImage)
  const [bannerColor, setBannerColor] = useState<string | null>(server.bannerColor)
  const [bannerImage, setBannerImage] = useState<string | null>(server.bannerImage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  async function handleIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIconImage(await resizeImageToDataUrl(file, ICON_SIZE))
    } catch {
      setError('Não foi possível processar essa imagem.')
    }
  }

  async function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setBannerImage(await resizeBannerToDataUrl(file))
    } catch {
      setError('Não foi possível processar essa imagem.')
    }
  }

  async function handleSave() {
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      await onSave({ name: name.trim(), iconImage, bannerColor, bannerImage })
      onClose()
    } catch {
      setError('Não foi possível salvar o servidor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>Editar servidor</h2>
          <button className="modal-close-btn" onClick={onClose}><XIcon size={16} /></button>
        </div>
        <p className="modal-section-label">Personalize o nome, o ícone e o banner do seu servidor.</p>

        <div className="add-server-icon-wrap">
          <button className="add-server-icon-btn" onClick={() => iconInputRef.current?.click()} title="Trocar ícone">
            {iconImage ? <img className="add-server-icon-img" src={iconImage} alt="" /> : <span>Enviar foto</span>}
          </button>
          <input ref={iconInputRef} type="file" accept="image/*" hidden onChange={handleIconFile} />
        </div>

        <label className="edit-label">Nome do servidor</label>
        <input className="edit-input" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="edit-label">Banner</label>
        <p className="edit-hint">Aparece no topo da lista de canais. Sem cor nem imagem, a sidebar fica normal (sem banner).</p>

        {bannerImage ? (
          <button className="server-banner-preview-btn" onClick={() => bannerInputRef.current?.click()} title="Trocar banner">
            <img className="server-banner-preview-img" src={bannerImage} alt="" />
          </button>
        ) : (
          <button
            className="server-banner-preview-btn placeholder"
            style={bannerColor ? { background: bannerColor } : undefined}
            onClick={() => bannerInputRef.current?.click()}
          >
            Enviar imagem de banner
          </button>
        )}
        <input ref={bannerInputRef} type="file" accept="image/*" hidden onChange={handleBannerFile} />

        <div className="banner-color-list">
          <button
            className={`banner-color-swatch ${!bannerColor && !bannerImage ? 'active' : ''}`}
            style={{ background: 'var(--color-bg-600)' }}
            onClick={() => {
              setBannerColor(null)
              setBannerImage(null)
            }}
            title="Sem banner"
          >
            <XIcon size={14} />
          </button>
          {BANNER_COLORS.map((color) => (
            <button
              key={color}
              className={`banner-color-swatch ${bannerColor === color && !bannerImage ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => {
                setBannerColor(color)
                setBannerImage(null)
              }}
            />
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}

        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={onClose}>
            Cancelar
          </button>
          <button className="edit-save-btn" disabled={!name.trim() || saving} onClick={handleSave}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
