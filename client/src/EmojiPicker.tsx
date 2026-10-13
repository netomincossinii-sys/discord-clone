const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😎', '🤔', '😴', '😭',
  '😡', '😮', '😅', '😇', '🥳', '😜', '🤯', '😱', '😢', '🤝',
  '👍', '👎', '👏', '🙌', '🙏', '💪', '👋', '✌️', '🤙', '🫡',
  '❤️', '💙', '💚', '💛', '💜', '🖤', '🤍', '💔', '🔥', '✨',
  '🎉', '🎊', '⭐', '✅', '❌', '💯', '👀', '🤷', '🎮', '☕',
]

export function EmojiPicker({ onSelect, onClose }: { onSelect: (emoji: string) => void; onClose: () => void }) {
  return (
    <>
      <div className="emoji-picker-backdrop" onClick={onClose} />
      <div className="emoji-picker">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" className="emoji-picker-item" onClick={() => onSelect(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
