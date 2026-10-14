import { useEffect, useState } from 'react'
import { FileIcon, XIcon, DownloadIcon } from './Icon'

function ImageLightbox({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div className="image-lightbox-actions">
        <a
          className="image-lightbox-btn"
          href={url}
          download={name}
          title="Baixar imagem"
          onClick={(e) => e.stopPropagation()}
        >
          <DownloadIcon size={20} />
        </a>
        <button className="image-lightbox-btn" onClick={onClose} title="Fechar">
          <XIcon size={20} />
        </button>
      </div>
      <img className="image-lightbox-img" src={url} alt={name} onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

export function MessageAttachment({
  url,
  name,
  type,
}: {
  url: string
  name: string
  type: string
}) {
  const [expanded, setExpanded] = useState(false)

  if (type.startsWith('image/')) {
    return (
      <>
        <button className="message-attachment-image-link" onClick={() => setExpanded(true)}>
          <img src={url} alt={name} className="message-attachment-image" />
        </button>
        {expanded && <ImageLightbox url={url} name={name} onClose={() => setExpanded(false)} />}
      </>
    )
  }

  return (
    <a href={url} download={name} className="message-attachment-file">
      <FileIcon size={20} />
      <span className="message-attachment-file-name">{name}</span>
    </a>
  )
}
