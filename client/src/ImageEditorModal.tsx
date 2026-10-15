import { useEffect, useRef, useState } from 'react'
import { Modal } from './Modal'
import { XIcon, RotateCcwIcon, RotateCwIcon, FlipHorizontalIcon, FlipVerticalIcon, RefreshIcon, ZoomInIcon } from './Icon'
import { loadImageElement } from './imageUtils'

const VIEW_MAX = 340

function normalizeRotation(deg: number) {
  let r = deg % 360
  if (r > 180) r -= 360
  if (r < -180) r += 360
  return r
}

export function ImageEditorModal({
  file,
  aspect,
  outputWidth,
  outputHeight,
  round,
  title,
  onCancel,
  onConfirm,
}: {
  file: File
  aspect: number
  outputWidth: number
  outputHeight: number
  round?: boolean
  title: string
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  const viewportW = aspect >= 1 ? VIEW_MAX : VIEW_MAX * aspect
  const viewportH = viewportW / aspect

  useEffect(() => {
    let cancelled = false
    const url = URL.createObjectURL(file)
    loadImageElement(url)
      .then((el) => {
        if (!cancelled) setImg(el)
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível abrir essa imagem.')
      })
    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [file])

  const baseScale = img ? Math.max(viewportW / img.naturalWidth, viewportH / img.naturalHeight) : 1
  const drawW = img ? img.naturalWidth * baseScale * zoom : 0
  const drawH = img ? img.naturalHeight * baseScale * zoom : 0

  function clampOffset(next: { x: number; y: number }, w: number, h: number) {
    const maxX = Math.max(0, (w - viewportW) / 2)
    const maxY = Math.max(0, (h - viewportH) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    }
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handlePointerMove(e: PointerEvent) {
    const drag = dragRef.current
    if (!drag) return
    const next = { x: drag.startOffset.x + (e.clientX - drag.startX), y: drag.startOffset.y + (e.clientY - drag.startY) }
    setOffset(clampOffset(next, drawW, drawH))
  }

  function handlePointerUp() {
    dragRef.current = null
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }

  useEffect(() => {
    setOffset((prev) => clampOffset(prev, drawW, drawH))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, drawW, drawH])

  function reset() {
    setZoom(1)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setOffset({ x: 0, y: 0 })
  }

  function handleConfirm() {
    if (!img) return
    const canvas = document.createElement('canvas')
    canvas.width = outputWidth
    canvas.height = outputHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const outputScale = outputWidth / viewportW
    ctx.save()
    ctx.translate(outputWidth / 2 + offset.x * outputScale, outputHeight / 2 + offset.y * outputScale)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
    const dW = drawW * outputScale
    const dH = drawH * outputScale
    ctx.drawImage(img, -dW / 2, -dH / 2, dW, dH)
    ctx.restore()
    onConfirm(canvas.toDataURL('image/jpeg', 0.92))
  }

  return (
    <Modal onClose={onCancel} width={420}>
      <div className="add-server-modal">
        <div className="modal-header-row">
          <h2>{title}</h2>
          <button className="modal-close-btn" onClick={onCancel}>
            <XIcon size={16} />
          </button>
        </div>

        {error ? (
          <p className="auth-error">{error}</p>
        ) : (
          <>
            <div
              ref={viewportRef}
              className={`image-editor-viewport ${round ? 'round' : ''}`}
              style={{ width: viewportW, height: viewportH }}
              onPointerDown={handlePointerDown}
            >
              {img && (
                <div
                  className="image-editor-positioner"
                  style={{
                    width: drawW,
                    height: drawH,
                    left: viewportW / 2 - drawW / 2 + offset.x,
                    top: viewportH / 2 - drawH / 2 + offset.y,
                    transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                  }}
                >
                  <img src={img.src} alt="" draggable={false} />
                </div>
              )}
            </div>

            <div className="image-editor-controls">
              <div className="image-editor-row">
                <ZoomInIcon size={16} />
                <input
                  className="settings-slider"
                  type="range"
                  min={1}
                  max={4}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />
              </div>
              <div className="image-editor-row">
                <RotateCwIcon size={16} />
                <input
                  className="settings-slider"
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                />
              </div>
              <div className="image-editor-btn-row">
                <button
                  className="image-editor-icon-btn"
                  title="Girar 90° à esquerda"
                  onClick={() => setRotation((r) => normalizeRotation(r - 90))}
                >
                  <RotateCcwIcon size={18} />
                </button>
                <button
                  className="image-editor-icon-btn"
                  title="Girar 90° à direita"
                  onClick={() => setRotation((r) => normalizeRotation(r + 90))}
                >
                  <RotateCwIcon size={18} />
                </button>
                <button
                  className={`image-editor-icon-btn ${flipH ? 'active' : ''}`}
                  title="Inverter da esquerda para a direita"
                  onClick={() => setFlipH((v) => !v)}
                >
                  <FlipHorizontalIcon size={18} />
                </button>
                <button
                  className={`image-editor-icon-btn ${flipV ? 'active' : ''}`}
                  title="Inverter de cima para baixo"
                  onClick={() => setFlipV((v) => !v)}
                >
                  <FlipVerticalIcon size={18} />
                </button>
                <button className="image-editor-icon-btn" title="Restaurar" onClick={reset}>
                  <RefreshIcon size={18} />
                </button>
              </div>
              <p className="edit-hint">Arraste a imagem para posicionar. Use os controles para dar zoom, girar ou espelhar.</p>
            </div>
          </>
        )}

        <div className="add-server-actions">
          <button className="add-server-back-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button className="edit-save-btn" disabled={!img} onClick={handleConfirm}>
            Aplicar
          </button>
        </div>
      </div>
    </Modal>
  )
}
