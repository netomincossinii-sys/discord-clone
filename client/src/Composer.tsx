import { useEffect, useRef, useState } from 'react'
import { PaperclipIcon, SmileIcon, SendIcon, XIcon, FileIcon } from './Icon'
import { EmojiPicker } from './EmojiPicker'
import type { Attachment } from './types'

const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024

export function Composer({
  placeholder,
  draft,
  onDraftChange,
  onSend,
}: {
  placeholder: string
  draft: string
  onDraftChange: (v: string) => void
  onSend: (attachment: Attachment | null) => void
}) {
  const [attachment, setAttachment] = useState<Attachment | null>(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError('Arquivo muito grande (máx. 8MB).')
      return
    }
    setAttachmentError('')
    const reader = new FileReader()
    reader.onload = () => {
      setAttachment({ url: reader.result as string, name: file.name, type: file.type || 'application/octet-stream' })
    }
    reader.readAsDataURL(file)
  }

  function handleSend() {
    if (!draft.trim() && !attachment) return
    onSend(attachment)
    setAttachment(null)
    setAttachmentError('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function insertEmoji(emoji: string) {
    onDraftChange(draft + emoji)
    setShowEmoji(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="composer-wrap">
      {attachment && (
        <div className="composer-attachment-preview">
          {attachment.type.startsWith('image/') ? (
            <img src={attachment.url} alt="" className="composer-attachment-thumb" />
          ) : (
            <FileIcon size={18} />
          )}
          <span className="composer-attachment-name">{attachment.name}</span>
          <button type="button" className="composer-attachment-remove" onClick={() => setAttachment(null)} title="Remover anexo">
            <XIcon size={14} />
          </button>
        </div>
      )}
      {attachmentError && <div className="composer-attachment-error">{attachmentError}</div>}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend()
        }}
      >
        <input ref={fileInputRef} type="file" hidden onChange={handlePickFile} />
        <button
          type="button"
          className="composer-icon-btn"
          onClick={() => fileInputRef.current?.click()}
          title="Anexar arquivo"
        >
          <PaperclipIcon size={20} />
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={`${placeholder} (Shift+Enter pula linha)`}
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="composer-emoji-wrap">
          <button type="button" className="composer-icon-btn" onClick={() => setShowEmoji((v) => !v)} title="Emoji">
            <SmileIcon size={20} />
          </button>
          {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
        </div>
        <button type="submit" className="composer-send-btn" title="Enviar" disabled={!draft.trim() && !attachment}>
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  )
}
