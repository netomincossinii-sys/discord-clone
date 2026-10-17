import { RnnoiseWorkletNode, loadRnnoise } from '@sapphi-red/web-noise-suppressor'
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url'
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url'
import rnnoiseSimdWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url'

const modulesLoadedFor = new WeakSet<AudioContext>()
let wasmBinaryPromise: Promise<ArrayBuffer> | null = null

function getWasmBinary() {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = loadRnnoise({ url: rnnoiseWasmPath, simdUrl: rnnoiseSimdWasmPath })
  }
  return wasmBinaryPromise
}

export async function createRnnoiseNode(ctx: AudioContext): Promise<RnnoiseWorkletNode> {
  if (!modulesLoadedFor.has(ctx)) {
    await ctx.audioWorklet.addModule(rnnoiseWorkletPath)
    modulesLoadedFor.add(ctx)
  }
  const wasmBinary = await getWasmBinary()
  return new RnnoiseWorkletNode(ctx, { maxChannels: 1, wasmBinary })
}
