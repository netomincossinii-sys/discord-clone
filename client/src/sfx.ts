import { isSfxEnabled } from './voicePrefs'

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function beep(freq: number, durationMs: number, delayMs = 0, gainValue = 0.08) {
  if (!isSfxEnabled()) return
  const audioCtx = getCtx()
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.frequency.value = freq
  osc.type = 'sine'
  gain.gain.value = gainValue
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  const startAt = audioCtx.currentTime + delayMs / 1000
  osc.start(startAt)
  gain.gain.setValueAtTime(gainValue, startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000)
  osc.stop(startAt + durationMs / 1000)
}

export const SFX = {
  message: () => beep(720, 90),
  voiceJoin: () => {
    beep(520, 80)
    beep(720, 90, 90)
  },
  voiceLeave: () => {
    beep(720, 80)
    beep(420, 110, 90)
  },
  mute: () => beep(380, 70),
  unmute: () => beep(620, 70),
  deafen: () => {
    beep(480, 70)
    beep(260, 110, 70)
  },
  undeafen: () => {
    beep(400, 70)
    beep(680, 90, 70)
  },
  screenShareStart: () => {
    beep(520, 60)
    beep(680, 60, 70)
    beep(880, 100, 140)
  },
  screenShareStop: () => {
    beep(880, 60)
    beep(680, 60, 70)
    beep(480, 110, 140)
  },
  connect: () => beep(620, 100),
}
