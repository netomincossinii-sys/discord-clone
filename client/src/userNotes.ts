const PREFIX = 'callfy_user_note_'

export function getUserNote(userId: string): string {
  return localStorage.getItem(PREFIX + userId) ?? ''
}

export function setUserNote(userId: string, note: string) {
  if (note.trim()) localStorage.setItem(PREFIX + userId, note)
  else localStorage.removeItem(PREFIX + userId)
}
