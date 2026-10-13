const ACCENT_KEY = 'callfy_accent_color'

const HOVER_SHADES: Record<string, string> = {
  '#f37108': '#d9640a',
  '#57F287': '#3fc96f',
  '#FEE75C': '#e6d23f',
  '#EB459E': '#d12e86',
  '#ED4245': '#d32e31',
  '#3498DB': '#2980b9',
  '#1ABC9C': '#149e83',
}

export function applyAccentColor(hex: string) {
  document.documentElement.style.setProperty('--color-accent', hex)
  document.documentElement.style.setProperty('--color-accent-hover', HOVER_SHADES[hex] ?? hex)
}

export function getStoredAccentColor(): string | null {
  return localStorage.getItem(ACCENT_KEY)
}

export function setStoredAccentColor(hex: string) {
  localStorage.setItem(ACCENT_KEY, hex)
  applyAccentColor(hex)
}

export function initTheme() {
  const stored = getStoredAccentColor()
  if (stored) applyAccentColor(stored)
}
