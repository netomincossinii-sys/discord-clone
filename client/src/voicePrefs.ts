const KEYS = {
  micMuted: 'callfy_default_mic_muted',
  deafened: 'callfy_default_deafened',
  micDevice: 'callfy_mic_device_id',
  speakerDevice: 'callfy_speaker_device_id',
  cameraDevice: 'callfy_camera_device_id',
  micVolume: 'callfy_mic_volume',
  noiseSuppression: 'callfy_noise_suppression',
  echoCancellation: 'callfy_echo_cancellation',
  sfxEnabled: 'callfy_sfx_enabled',
  desktopNotifications: 'callfy_desktop_notifications',
}

export function getDefaultMicMuted() {
  return localStorage.getItem(KEYS.micMuted) === '1'
}
export function setDefaultMicMuted(v: boolean) {
  localStorage.setItem(KEYS.micMuted, v ? '1' : '0')
}
export function getDefaultDeafened() {
  return localStorage.getItem(KEYS.deafened) === '1'
}
export function setDefaultDeafened(v: boolean) {
  localStorage.setItem(KEYS.deafened, v ? '1' : '0')
}
export function getMicDeviceId(): string | null {
  return localStorage.getItem(KEYS.micDevice)
}
export function setMicDeviceId(id: string) {
  localStorage.setItem(KEYS.micDevice, id)
}
export function getSpeakerDeviceId(): string | null {
  return localStorage.getItem(KEYS.speakerDevice)
}
export function setSpeakerDeviceId(id: string) {
  localStorage.setItem(KEYS.speakerDevice, id)
}
export function getCameraDeviceId(): string | null {
  return localStorage.getItem(KEYS.cameraDevice)
}
export function setCameraDeviceId(id: string) {
  localStorage.setItem(KEYS.cameraDevice, id)
}
export function getMicVolume(): number {
  const v = localStorage.getItem(KEYS.micVolume)
  return v ? Number(v) : 100
}
export function setMicVolume(v: number) {
  localStorage.setItem(KEYS.micVolume, String(v))
}
export function getNoiseSuppression(): boolean {
  const v = localStorage.getItem(KEYS.noiseSuppression)
  return v === null ? true : v === '1'
}
export function setNoiseSuppression(v: boolean) {
  localStorage.setItem(KEYS.noiseSuppression, v ? '1' : '0')
}
export function getEchoCancellation(): boolean {
  const v = localStorage.getItem(KEYS.echoCancellation)
  return v === null ? true : v === '1'
}
export function setEchoCancellation(v: boolean) {
  localStorage.setItem(KEYS.echoCancellation, v ? '1' : '0')
}
export function isSfxEnabled(): boolean {
  const v = localStorage.getItem(KEYS.sfxEnabled)
  return v === null ? true : v === '1'
}
export function setSfxEnabled(v: boolean) {
  localStorage.setItem(KEYS.sfxEnabled, v ? '1' : '0')
}
export function isDesktopNotificationsEnabled(): boolean {
  return localStorage.getItem(KEYS.desktopNotifications) === '1'
}
export function setDesktopNotificationsEnabled(v: boolean) {
  localStorage.setItem(KEYS.desktopNotifications, v ? '1' : '0')
}
