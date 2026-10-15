import { useRef, useState } from 'react'
import { Modal } from './Modal'
import { XIcon } from './Icon'
import { BANNER_COLORS } from './api'
import { ImageEditorModal } from './ImageEditorModal'
import {
  AVATAR_OUTPUT_SIZE,
  BANNER_ASPECT,
  BANNER_OUTPUT_WIDTH,
  BANNER_OUTPUT_HEIGHT,
  MAX_AVATAR_UPLOAD_BYTES,
  MAX_BANNER_UPLOAD_BYTES,
  isAnimatedImage,
  readFileAsDataUrl,
} from './imageUtils'
import type { ServerInfo } from './types'

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
  const [iconEditFile, setIconEditFile] = useState<File | null>(null)
  const [bannerEditFile, setBannerEditFile] = useState<File | null>(null)

  async function handleIconFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isAnimatedImage(file)) {
      try {
        setIconImage(await readFileAsDataUrl(file, MAX_AVATAR_UPLOAD_BYTES))
        setError(null)
      } catch {
        setError('Esse GIF é muito grande ou inválido.')
      }
      return
    }
    setIconEditFile(file)
  }

  async function handleBannerFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (isAnimatedImage(file)) {
      try {
        setBannerImage(await readFileAsDataUrl(file, MAX_BANNER_UPLOAD_BYTES))
        setError(null)
      } catch {
        setError('Esse GIF é muito grande ou inválido.')
      }
      return
    }
    setBannerEditFile(file)
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
    <>
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
        <p className="edit-hint">
          Aparece no topo da lista de canais. Aceita imagem ou GIF animado. Sem cor nem imagem, a sidebar fica normal
          (sem banner).
        </p>

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

    {iconEditFile && (
      <ImageEditorModal
        file={iconEditFile}
        aspect={1}
        outputWidth={AVATAR_OUTPUT_SIZE}
        outputHeight={AVATAR_OUTPUT_SIZE}
        round
        title="Ajustar ícone do servidor"
        onCancel={() => setIconEditFile(null)}
        onConfirm={(dataUrl) => {
          setIconImage(dataUrl)
          setIconEditFile(null)
        }}
      />
    )}

    {bannerEditFile && (
      <ImageEditorModal
        file={bannerEditFile}
        aspect={BANNER_ASPECT}
        outputWidth={BANNER_OUTPUT_WIDTH}
        outputHeight={BANNER_OUTPUT_HEIGHT}
        title="Ajustar banner do servidor"
        onCancel={() => setBannerEditFile(null)}
        onConfirm={(dataUrl) => {
          setBannerImage(dataUrl)
          setBannerEditFile(null)
        }}
      />
    )}
    </>
  )
}
