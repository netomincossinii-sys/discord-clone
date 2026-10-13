import { FileIcon } from './Icon'

export function MessageAttachment({
  url,
  name,
  type,
}: {
  url: string
  name: string
  type: string
}) {
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="message-attachment-image-link">
        <img src={url} alt={name} className="message-attachment-image" />
      </a>
    )
  }

  return (
    <a href={url} download={name} className="message-attachment-file">
      <FileIcon size={20} />
      <span className="message-attachment-file-name">{name}</span>
    </a>
  )
}
