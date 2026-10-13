import { useCallback, useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { PresenceUser } from './types'
import * as prefs from './voicePrefs'
import { SFX } from './sfx'
import { fetchTurnCredentials } from './api'

interface Participant {
  user: PresenceUser
  stream?: MediaStream
  screenStream?: MediaStream
}

interface SignalData {
  type: 'offer' | 'answer' | 'candidate'
  sdp?: RTCSessionDescriptionInit
  candidate?: RTCIceCandidateInit
}

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }]
const SPEAKING_THRESHOLD = 0.02
const SPEAKING_HOLD_MS = 300
const LOCAL_SPEAKING_KEY = 'local'

export function useVoice(socket: Socket | null, localUser: PresenceUser | null) {
  const [channelId, setChannelId] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map())
  const [channelPresence, setChannelPresence] = useState<Map<string, PresenceUser[]>>(new Map())
  const [speakingPeers, setSpeakingPeers] = useState<Set<string>>(new Set())
  const [micOn, setMicOn] = useState(!prefs.getDefaultMicMuted())
  const [camOn, setCamOn] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isSharingScreen, setIsSharingScreen] = useState(false)
  const [deafened, setDeafened] = useState(prefs.getDefaultDeafened())
  const [micDeviceId, setMicDeviceIdState] = useState<string | null>(prefs.getMicDeviceId())
  const [speakerDeviceId, setSpeakerDeviceIdState] = useState<string | null>(prefs.getSpeakerDeviceId())
  const [cameraDeviceId, setCameraDeviceIdState] = useState<string | null>(prefs.getCameraDeviceId())
  const [micVolume, setMicVolumeState] = useState(prefs.getMicVolume())
  const [noiseSuppression, setNoiseSuppressionState] = useState(prefs.getNoiseSuppression())
  const [echoCancellation, setEchoCancellationState] = useState(prefs.getEchoCancellation())
  const [error, setError] = useState<string | null>(null)

  const pcs = useRef<Map<string, RTCPeerConnection>>(new Map())
  const iceServersRef = useRef<RTCIceServer[]>(FALLBACK_ICE_SERVERS)
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)
  const peerMainStreamId = useRef<Map<string, string>>(new Map())
  const rawMicStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const channelIdRef = useRef<string | null>(null)
  const participantsSnapshot = useRef(participants)
  useEffect(() => {
    participantsSnapshot.current = participants
  }, [participants])

  const analyserCtxRef = useRef<AudioContext | null>(null)
  const analysersRef = useRef<Map<string, { analyser: AnalyserNode; data: Uint8Array<ArrayBuffer>; source: MediaStreamAudioSourceNode }>>(new Map())
  const lastSpeakingAtRef = useRef<Map<string, number>>(new Map())
  const speakingIntervalRef = useRef<number | null>(null)

  const stopSpeakingLoop = () => {
    if (speakingIntervalRef.current !== null) {
      window.clearInterval(speakingIntervalRef.current)
      speakingIntervalRef.current = null
    }
  }

  const startSpeakingLoop = () => {
    if (speakingIntervalRef.current !== null) return
    speakingIntervalRef.current = window.setInterval(() => {
      const now = performance.now()
      const next = new Set<string>()
      analysersRef.current.forEach(({ analyser, data }, key) => {
        analyser.getByteTimeDomainData(data)
        let sumSquares = 0
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128
          sumSquares += v * v
        }
        const rms = Math.sqrt(sumSquares / data.length)
        if (rms > SPEAKING_THRESHOLD) lastSpeakingAtRef.current.set(key, now)
        if (now - (lastSpeakingAtRef.current.get(key) ?? 0) < SPEAKING_HOLD_MS) next.add(key)
      })
      setSpeakingPeers((prev) => {
        if (prev.size === next.size && Array.from(prev).every((k) => next.has(k))) return prev
        return next
      })
    }, 100)
  }

  const detachAnalyser = (key: string) => {
    const entry = analysersRef.current.get(key)
    if (!entry) return
    entry.source.disconnect()
    entry.analyser.disconnect()
    analysersRef.current.delete(key)
    lastSpeakingAtRef.current.delete(key)
  }

  const attachAnalyser = (key: string, stream: MediaStream) => {
    if (stream.getAudioTracks().length === 0) return
    if (!analyserCtxRef.current) analyserCtxRef.current = new AudioContext()
    const ctx = analyserCtxRef.current
    detachAnalyser(key)
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    source.connect(analyser)
    const data = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount))
    analysersRef.current.set(key, { analyser, data, source })
    startSpeakingLoop()
  }

  const stopAllAnalysers = () => {
    stopSpeakingLoop()
    Array.from(analysersRef.current.keys()).forEach(detachAnalyser)
    analyserCtxRef.current?.close().catch(() => {})
    analyserCtxRef.current = null
    setSpeakingPeers(new Set())
  }

  const bumpLocalStream = () => {
    const current = localStreamRef.current
    setLocalStream(current ? new MediaStream(current.getTracks()) : null)
  }

  const renegotiate = useCallback((peerId: string) => {
    const pc = pcs.current.get(peerId)
    if (!pc || !socket) return
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit('voice:signal', { to: peerId, data: { type: 'offer', sdp: pc.localDescription } })
      })
      .catch(() => {})
  }, [socket])

  const createPeerConnection = useCallback((peerId: string, user: PresenceUser) => {
    let pc = pcs.current.get(peerId)
    if (pc) return pc
    pc = new RTCPeerConnection({ iceServers: iceServersRef.current })
    localStreamRef.current?.getTracks().forEach((track) => {
      pc!.addTrack(track, localStreamRef.current!)
    })
    screenStreamRef.current?.getTracks().forEach((track) => {
      pc!.addTrack(track, screenStreamRef.current!)
    })
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('voice:signal', { to: peerId, data: { type: 'candidate', candidate: event.candidate.toJSON() } })
      }
    }
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0]
      setParticipants((prev) => {
        const next = new Map(prev)
        const existing = next.get(peerId) ?? { user }
        const mainStreamId = peerMainStreamId.current.get(peerId)
        if (!mainStreamId) {
          peerMainStreamId.current.set(peerId, incomingStream.id)
          next.set(peerId, { ...existing, stream: incomingStream })
          attachAnalyser(peerId, incomingStream)
        } else if (incomingStream.id === mainStreamId) {
          next.set(peerId, { ...existing, stream: incomingStream })
          attachAnalyser(peerId, incomingStream)
        } else {
          next.set(peerId, { ...existing, screenStream: incomingStream })
        }
        return next
      })
    }
    pcs.current.set(peerId, pc)
    return pc
  }, [socket])

  const closeAllPeers = () => {
    pcs.current.forEach((pc) => pc.close())
    pcs.current.clear()
  }

  const leave = useCallback(() => {
    if (!channelIdRef.current) return
    socket?.emit('voice:leave')
    closeAllPeers()
    rawMicStreamRef.current?.getTracks().forEach((t) => t.stop())
    rawMicStreamRef.current = null
    sourceNodeRef.current?.disconnect()
    sourceNodeRef.current = null
    gainNodeRef.current?.disconnect()
    gainNodeRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    screenStreamRef.current?.getTracks().forEach((t) => t.stop())
    screenStreamRef.current = null
    setScreenStream(null)
    setIsSharingScreen(false)
    peerMainStreamId.current.clear()
    setParticipants(new Map())
    setCamOn(false)
    channelIdRef.current = null
    setChannelId(null)
    stopAllAnalysers()
    SFX.voiceLeave()
  }, [socket])

  const join = useCallback(async (newChannelId: string) => {
    if (channelIdRef.current === newChannelId) return
    if (channelIdRef.current) leave()
    setError(null)
    try {
      iceServersRef.current = await fetchTurnCredentials()
        .then((res) => res.iceServers)
        .catch(() => FALLBACK_ICE_SERVERS)

      const audioConstraint: MediaTrackConstraints = {
        ...(micDeviceId ? { deviceId: { exact: micDeviceId } } : {}),
        noiseSuppression: prefs.getNoiseSuppression(),
        echoCancellation: prefs.getEchoCancellation(),
      }
      const rawStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraint, video: false })
      rawMicStreamRef.current = rawStream

      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(rawStream)
      const gainNode = audioCtx.createGain()
      const shouldBeMuted = deafened || !micOn
      gainNode.gain.value = shouldBeMuted ? 0 : prefs.getMicVolume() / 100
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(gainNode)
      gainNode.connect(dest)
      audioCtxRef.current = audioCtx
      gainNodeRef.current = gainNode
      sourceNodeRef.current = source

      localStreamRef.current = dest.stream
      setLocalStream(dest.stream)
      attachAnalyser(LOCAL_SPEAKING_KEY, dest.stream)
      channelIdRef.current = newChannelId
      setChannelId(newChannelId)
      socket?.emit('voice:join', newChannelId)
      SFX.voiceJoin()
    } catch {
      setError('Não foi possível acessar o microfone. Verifique as permissões do navegador.')
    }
  }, [socket, leave, micDeviceId, micOn, deafened])

  const toggleMic = useCallback(() => {
    setMicOn((prevMicOn) => {
      const next = !prevMicOn
      prefs.setDefaultMicMuted(!next)
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = next ? prefs.getMicVolume() / 100 : 0
      }
      if (next) {
        setDeafened(false)
        prefs.setDefaultDeafened(false)
      }
      next ? SFX.unmute() : SFX.mute()
      return next
    })
  }, [])

  const toggleDeafen = useCallback(() => {
    setDeafened((prevDeafened) => {
      const next = !prevDeafened
      prefs.setDefaultDeafened(next)
      if (next) {
        if (gainNodeRef.current) gainNodeRef.current.gain.value = 0
        setMicOn(false)
        prefs.setDefaultMicMuted(true)
      }
      return next
    })
  }, [])

  const setMicVolume = useCallback((v: number) => {
    prefs.setMicVolume(v)
    setMicVolumeState(v)
    if (gainNodeRef.current && micOn && !deafened) {
      gainNodeRef.current.gain.value = v / 100
    }
  }, [micOn, deafened])

  const swapMicSource = useCallback(async (constraint: MediaTrackConstraints) => {
    if (!audioCtxRef.current || !gainNodeRef.current) return
    try {
      const newRaw = await navigator.mediaDevices.getUserMedia({ audio: constraint })
      const newSource = audioCtxRef.current.createMediaStreamSource(newRaw)
      sourceNodeRef.current?.disconnect()
      newSource.connect(gainNodeRef.current)
      sourceNodeRef.current = newSource
      rawMicStreamRef.current?.getTracks().forEach((t) => t.stop())
      rawMicStreamRef.current = newRaw
    } catch {
      setError('Não foi possível reconfigurar o microfone.')
    }
  }, [])

  const selectMicDevice = useCallback(async (deviceId: string) => {
    prefs.setMicDeviceId(deviceId)
    setMicDeviceIdState(deviceId)
    if (channelIdRef.current) {
      await swapMicSource({
        deviceId: { exact: deviceId },
        noiseSuppression: prefs.getNoiseSuppression(),
        echoCancellation: prefs.getEchoCancellation(),
      })
    }
  }, [swapMicSource])

  const selectSpeakerDevice = useCallback((deviceId: string) => {
    prefs.setSpeakerDeviceId(deviceId)
    setSpeakerDeviceIdState(deviceId)
  }, [])

  const toggleNoiseSuppression = useCallback(() => {
    const next = !prefs.getNoiseSuppression()
    prefs.setNoiseSuppression(next)
    setNoiseSuppressionState(next)
    if (channelIdRef.current) {
      swapMicSource({
        ...(prefs.getMicDeviceId() ? { deviceId: { exact: prefs.getMicDeviceId()! } } : {}),
        noiseSuppression: next,
        echoCancellation: prefs.getEchoCancellation(),
      })
    }
  }, [swapMicSource])

  const toggleEchoCancellation = useCallback(() => {
    const next = !prefs.getEchoCancellation()
    prefs.setEchoCancellation(next)
    setEchoCancellationState(next)
    if (channelIdRef.current) {
      swapMicSource({
        ...(prefs.getMicDeviceId() ? { deviceId: { exact: prefs.getMicDeviceId()! } } : {}),
        noiseSuppression: prefs.getNoiseSuppression(),
        echoCancellation: next,
      })
    }
  }, [swapMicSource])

  const toggleCam = useCallback(async () => {
    if (!localStreamRef.current) return
    const existingVideoTrack = localStreamRef.current.getVideoTracks()[0]
    if (existingVideoTrack) {
      existingVideoTrack.stop()
      localStreamRef.current.removeTrack(existingVideoTrack)
      pcs.current.forEach((pc, peerId) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        if (sender) pc.removeTrack(sender)
        renegotiate(peerId)
      })
      setCamOn(false)
      bumpLocalStream()
      return
    }
    try {
      const videoConstraint = cameraDeviceId ? { deviceId: { exact: cameraDeviceId } } : true
      const camStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint })
      const videoTrack = camStream.getVideoTracks()[0]
      localStreamRef.current.addTrack(videoTrack)
      pcs.current.forEach((pc, peerId) => {
        pc.addTrack(videoTrack, localStreamRef.current!)
        renegotiate(peerId)
      })
      setCamOn(true)
      bumpLocalStream()
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
    }
  }, [renegotiate, cameraDeviceId])

  const stopScreenShare = useCallback(() => {
    const tracks = screenStreamRef.current?.getTracks()
    if (!tracks) return
    tracks.forEach((t) => t.stop())
    pcs.current.forEach((pc, peerId) => {
      let removedAny = false
      tracks.forEach((track) => {
        const sender = pc.getSenders().find((s) => s.track === track)
        if (sender) {
          pc.removeTrack(sender)
          removedAny = true
        }
      })
      if (removedAny) renegotiate(peerId)
    })
    screenStreamRef.current = null
    setScreenStream(null)
    setIsSharingScreen(false)
  }, [renegotiate])

  const startScreenShare = useCallback(async () => {
    if (screenStreamRef.current) return
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      screenStreamRef.current = display
      display.getVideoTracks()[0]?.addEventListener('ended', () => stopScreenShare())
      pcs.current.forEach((pc, peerId) => {
        display.getTracks().forEach((track) => pc.addTrack(track, display))
        renegotiate(peerId)
      })
      setScreenStream(display)
      setIsSharingScreen(true)
    } catch {
      // usuário cancelou o seletor de tela; não é um erro a exibir
    }
  }, [renegotiate, stopScreenShare])

  const toggleScreenShare = useCallback(() => {
    if (screenStreamRef.current) stopScreenShare()
    else startScreenShare()
  }, [stopScreenShare, startScreenShare])

  const selectCameraDevice = useCallback(async (deviceId: string) => {
    prefs.setCameraDeviceId(deviceId)
    setCameraDeviceIdState(deviceId)
    if (!localStreamRef.current || !camOn) return
    try {
      const newCamStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } })
      const newTrack = newCamStream.getVideoTracks()[0]
      const oldTrack = localStreamRef.current.getVideoTracks()[0]
      if (oldTrack) {
        localStreamRef.current.removeTrack(oldTrack)
        oldTrack.stop()
      }
      localStreamRef.current.addTrack(newTrack)
      pcs.current.forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === 'video')
        sender?.replaceTrack(newTrack)
      })
      bumpLocalStream()
    } catch {
      setError('Não foi possível trocar a câmera.')
    }
  }, [camOn])

  useEffect(() => {
    if (!socket || !localUser) return

    const handlePeers = ({ channelId: cid, peers }: { channelId: string; peers: { peerId: string; user: PresenceUser }[] }) => {
      if (cid !== channelIdRef.current) return
      setParticipants((prev) => {
        const next = new Map(prev)
        peers.forEach(({ peerId, user }) => next.set(peerId, { user }))
        return next
      })
      peers.forEach(({ peerId, user }) => {
        createPeerConnection(peerId, user)
        renegotiate(peerId)
      })
    }

    const handlePeerJoined = ({ channelId: cid, peerId, user }: { channelId: string; peerId: string; user: PresenceUser }) => {
      if (cid !== channelIdRef.current) return
      setParticipants((prev) => new Map(prev).set(peerId, { user }))
      createPeerConnection(peerId, user)
    }

    const handleSignal = async ({ from, data }: { from: string; data: SignalData }) => {
      const existingUser = participantsSnapshot.current.get(from)?.user ?? { id: from, username: '...', color: '#949ba4' }
      const pc = createPeerConnection(from, existingUser)
      if (data.type === 'offer' && data.sdp) {
        await pc.setRemoteDescription(data.sdp)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('voice:signal', { to: from, data: { type: 'answer', sdp: pc.localDescription } })
      } else if (data.type === 'answer' && data.sdp) {
        await pc.setRemoteDescription(data.sdp)
      } else if (data.type === 'candidate' && data.candidate) {
        try {
          await pc.addIceCandidate(data.candidate)
        } catch {
          // ICE candidate arriving before remote description is occasionally expected; safe to ignore.
        }
      }
    }

    const handlePeerLeft = ({ peerId }: { peerId: string }) => {
      pcs.current.get(peerId)?.close()
      pcs.current.delete(peerId)
      peerMainStreamId.current.delete(peerId)
      detachAnalyser(peerId)
      setParticipants((prev) => {
        const next = new Map(prev)
        next.delete(peerId)
        return next
      })
    }

    const handlePeerState = ({ peerId, state }: { peerId: string; state: Partial<PresenceUser> }) => {
      setParticipants((prev) => {
        const existing = prev.get(peerId)
        if (!existing) return prev
        const next = new Map(prev)
        next.set(peerId, { ...existing, user: { ...existing.user, ...state } })
        return next
      })
    }

    socket.on('voice:peers', handlePeers)
    socket.on('voice:peer-joined', handlePeerJoined)
    socket.on('voice:signal', handleSignal)
    socket.on('voice:peer-left', handlePeerLeft)
    socket.on('voice:peer-state', handlePeerState)
    return () => {
      socket.off('voice:peers', handlePeers)
      socket.off('voice:peer-joined', handlePeerJoined)
      socket.off('voice:signal', handleSignal)
      socket.off('voice:peer-left', handlePeerLeft)
      socket.off('voice:peer-state', handlePeerState)
    }
  }, [socket, localUser, createPeerConnection, renegotiate])

  useEffect(() => {
    if (!socket || !channelId) return
    socket.emit('voice:state', { micOn, deafened, sharingScreen: isSharingScreen })
  }, [socket, channelId, micOn, deafened, isSharingScreen])

  useEffect(() => {
    if (!socket) return

    const handleSnapshot = (channels: { channelId: string; users: PresenceUser[] }[]) => {
      setChannelPresence(new Map(channels.map((c) => [c.channelId, c.users])))
    }

    const handleChannelUpdate = ({ channelId, users }: { channelId: string; users: PresenceUser[] }) => {
      setChannelPresence((prev) => new Map(prev).set(channelId, users))
    }

    socket.on('voice:snapshot', handleSnapshot)
    socket.on('voice:channel-update', handleChannelUpdate)
    return () => {
      socket.off('voice:snapshot', handleSnapshot)
      socket.off('voice:channel-update', handleChannelUpdate)
    }
  }, [socket])

  useEffect(() => () => leave(), [leave])

  return {
    channelId,
    localStream,
    participants,
    channelPresence,
    speakingPeers,
    micOn,
    camOn,
    screenStream,
    isSharingScreen,
    deafened,
    micDeviceId,
    speakerDeviceId,
    cameraDeviceId,
    micVolume,
    noiseSuppression,
    echoCancellation,
    error,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    toggleDeafen,
    selectMicDevice,
    selectSpeakerDevice,
    selectCameraDevice,
    setMicVolume,
    toggleNoiseSuppression,
    toggleEchoCancellation,
  }
}
