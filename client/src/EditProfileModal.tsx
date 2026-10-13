import { useRef, useState } from 'react'
import * as api from './api'
import { BANNER_COLORS } from './api'
import type { Profile } from './api'
import { Modal } from './Modal'
import { resizeImageToDataUrl } from './imageUtils'

const MAX_BIO = 190
const MAX_TAGS = 5
const AVATAR_SIZE = 256

export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile
  onClose: () => void
  onSaved: (profile: Profile) => void
}) {
  const [bio, setBio] = useState(profile.bio ?? '')
  const [activityText, setActivityText] = useState(profile.activityText ?? '')
  const [bannerColor, setBannerColor] = useState(profile.bannerColor)
  const [tags, setTags] = useState<string[]>(profile.interestTags)
  const [tagDraft, setTagDraft] = useState('')
  const [avatarImage, setAvatarImage] = useState<string | null>(profile.avatarImage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await resizeImageToDataUrl(file, AVATAR_SIZE)
      setAvatarImage(dataUrl)
    } catch {
      setError('Não foi possível processar essa imagem.')
    }
  }

  function addTag() {
    const trimmed = tagDraft.trim()
    if (!trimmed || tags.length >= MAX_TAGS || tags.includes(trimmed)) return
    setTags([...tags, trimmed])
    setTagDraft('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.updateProfile({
        bio,
        activityText,
        bannerColor,
        interestTags: tags,
        avatarImage,
      })
      onSaved(updated)
      onClose()
    } catch {
      setError('Não foi possível salvar o perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} width={420}>
      <div className="edit-profile">
        <div className="profile-banner" style={{ background: bannerColor }} />
        <div className="profile-avatar-wrap">
          <button
            className="profile-avatar-edit-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Clique para trocar a foto"
          >
            {avatarImage ? (
              <img className="profile-avatar-img" src={avatarImage} alt="" />
            ) : (
              <div className="profile-avatar-fallback" style={{ background: profile.color }}>
                {profile.username.slice(0, 1).toUpperCase()}
              </div>
            )}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
        </div>

        <div className="edit-profile-body">
          <div className="edit-hint">Clique na foto pra trocar</div>

          <label className="edit-label">Sobre mim</label>
          <textarea
            className="edit-textarea"
            value={bio}
            maxLength={MAX_BIO}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
          />
          <div className="edit-counter">
            {bio.length}/{MAX_BIO}
          </div>

          <label className="edit-label">O que você está fazendo agora?</label>
          <input
            className="edit-input"
            value={activityText}
            maxLength={60}
            onChange={(e) => setActivityText(e.target.value)}
            placeholder="Ex: Jogando Valorant"
          />
          <div className="edit-hint">Aparece no seu perfil com um cronômetro. Deixe em branco pra não mostrar nada.</div>

          <label className="edit-label">
            Tags de interesse <span className="edit-counter-inline">{tags.length}/{MAX_TAGS}</span>
          </label>
          <div className="edit-tags-list">
            {tags.map((tag) => (
              <span className="profile-tag" key={tag}>
                {tag}
                <button className="profile-tag-remove" onClick={() => removeTag(tag)}>
                  ×
                </button>
              </span>
            ))}
          </div>
          {tags.length < MAX_TAGS && (
            <div className="edit-tag-add-row">
              <input
                className="edit-input"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Ex: Anime, Pokémon..."
                maxLength={24}
              />
              <button className="edit-tag-add-btn" onClick={addTag}>
                Adicionar
              </button>
            </div>
          )}

          <label className="edit-label">Cor do banner</label>
          <div className="banner-color-list">
            {BANNER_COLORS.map((color) => (
              <button
                key={color}
                className={`banner-color-swatch ${bannerColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => setBannerColor(color)}
              />
            ))}
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="edit-actions">
            <button className="edit-cancel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button className="edit-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
