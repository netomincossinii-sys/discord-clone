import { useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import './App.css'
import * as api from './api'
import type { AuthUser } from './api'
import { AuthScreen } from './AuthScreen'
import { VoiceStage } from './VoiceStage'
import { ConnectedVoiceBar } from './ConnectedVoiceBar'
import { useVoice } from './useVoice'
import { ProfileCard } from './ProfileCard'
import { EditProfileModal } from './EditProfileModal'
import { StatusMenu } from './StatusMenu'
import { VoiceDeviceMenu } from './VoiceDeviceMenu'
import { SettingsModal } from './SettingsModal'
import { FriendsView } from './FriendsView'
import { DmSidebar } from './DmSidebar'
import { DmChatPanel } from './DmChatPanel'
import { DmCallRingModal } from './DmCallRingModal'
import { AddServerModal } from './AddServerModal'
import { ServerInviteModal } from './ServerInviteModal'
import { ServerMenu } from './ServerMenu'
import { SFX } from './sfx'
import { UsersIcon, MessageCircleIcon, PlusIcon, MicIcon, MicOffIcon, HeadphonesIcon, HeadphonesOffIcon, ChevronDownIcon, SettingsIcon } from './Icon'
import { isDesktopNotificationsEnabled } from './voicePrefs'
import { STATUS_META, API_URL } from './api'
import type { Profile, UserStatus, FriendUser, PendingRequest, DmConversation, DmMessage } from './api'
import type { ChatMessage, PresenceUser, ServerInfo, Attachment } from './types'
import { Composer } from './Composer'
import { MessageAttachment } from './MessageAttachment'

type RailMode = 'servers' | 'friends' | 'dms'

function App() {
  const [checkingSession, setCheckingSession] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [servers, setServers] = useState<ServerInfo[]>([])
  const [activeServerId, setActiveServerId] = useState<string | null>(null)
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null)
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>({})
  const [draft, setDraft] = useState('')
  const [profileViewUserId, setProfileViewUserId] = useState<string | null>(null)
  const [editProfileData, setEditProfileData] = useState<Profile | null>(null)
  const [myAvatar, setMyAvatar] = useState<string | null>(null)
  const [myStatus, setMyStatus] = useState<UserStatus>('ONLINE')
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const [showMicMenu, setShowMicMenu] = useState(false)
  const [showSpeakerMenu, setShowSpeakerMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [railMode, setRailMode] = useState<RailMode>('servers')
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [pendingIncoming, setPendingIncoming] = useState<PendingRequest[]>([])
  const [pendingOutgoing, setPendingOutgoing] = useState<PendingRequest[]>([])
  const [dmConversations, setDmConversations] = useState<DmConversation[]>([])
  const [activeDmConversationId, setActiveDmConversationId] = useState<string | null>(null)
  const [dmMessagesByConversation, setDmMessagesByConversation] = useState<Record<string, DmMessage[]>>({})
  const [dmDraft, setDmDraft] = useState('')
  const [incomingCall, setIncomingCall] = useState<{ conversationId: string; fromUser: PresenceUser } | null>(null)
  const [outgoingCallConversationId, setOutgoingCallConversationId] = useState<string | null>(null)
  const [showAddServer, setShowAddServer] = useState(false)
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null)
  const [serverMenuOpenId, setServerMenuOpenId] = useState<string | null>(null)
  const [inviteModalServerId, setInviteModalServerId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const localVoiceUser: PresenceUser | null = user
    ? { id: user.id, username: user.username, color: user.color, avatarImage: myAvatar }
    : null
  const voice = useVoice(socket, localVoiceUser)
  const voiceRef = useRef(voice)
  useEffect(() => {
    voiceRef.current = voice
  }, [voice])

  useEffect(() => {
    api
      .me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setCheckingSession(false))

    const params = new URLSearchParams(window.location.search)
    const invite = params.get('invite')
    if (invite) {
      setPendingInviteCode(invite)
      params.delete('invite')
      const rest = params.toString()
      window.history.replaceState({}, '', window.location.pathname + (rest ? `?${rest}` : ''))
    }
  }, [])

  useEffect(() => {
    if (user && pendingInviteCode) setShowAddServer(true)
  }, [user, pendingInviteCode])

  useEffect(() => {
    if (!user) return
    api.getProfile(user.id).then((p) => {
      setMyAvatar(p.avatarImage)
      setMyStatus(p.status)
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    api.getFriends().then((d) => setFriends(d.friends))
    api.getPendingRequests().then((d) => {
      setPendingIncoming(d.incoming)
      setPendingOutgoing(d.outgoing)
    })
    api.getDmConversations().then((d) => setDmConversations(d.conversations))
  }, [user])

  useEffect(() => {
    if (!user) return
    api.getState().then((data) => {
      setServers(data.servers)
      if (data.servers.length > 0) {
        setActiveServerId(data.servers[0].id)
        const firstText = data.servers[0].channels.find((c) => c.type === 'TEXT')
        setActiveChannelId(firstText?.id ?? data.servers[0].channels[0]?.id ?? null)
      }
    })
  }, [user])

  useEffect(() => {
    if (!user) return
    const s = io(API_URL, { withCredentials: true })
    s.on('history', ({ channelId, messages }: { channelId: string; messages: ChatMessage[] }) => {
      setMessagesByChannel((prev) => ({ ...prev, [channelId]: messages }))
    })
    s.on('new_message', (message: ChatMessage) => {
      setMessagesByChannel((prev) => ({
        ...prev,
        [message.channelId]: [...(prev[message.channelId] ?? []), message],
      }))
      if (message.authorId !== user.id) {
        SFX.message()
        if (document.hidden && isDesktopNotificationsEnabled() && Notification.permission === 'granted') {
          new Notification(message.authorName, { body: message.content })
        }
      }
    })
    s.on('friend:request_received', (req: PendingRequest) => {
      setPendingIncoming((prev) => [...prev, req])
    })
    s.on('friend:request_accepted', ({ id, user: addedUser }: PendingRequest) => {
      setFriends((prev) => [...prev, addedUser])
      setPendingOutgoing((prev) => prev.filter((r) => r.id !== id))
    })
    s.on('friend:removed', ({ id }: { id: string }) => {
      setFriends((prev) => prev.filter((f) => f.id !== id))
      setPendingIncoming((prev) => prev.filter((r) => r.id !== id))
      setPendingOutgoing((prev) => prev.filter((r) => r.id !== id))
    })
    s.on('presence:update', ({ userId, online }: { userId: string; online: boolean }) => {
      setFriends((prev) => prev.map((f) => (f.id === userId ? { ...f, online } : f)))
      setDmConversations((prev) => prev.map((c) => (c.user.id === userId ? { ...c, user: { ...c.user, online } } : c)))
    })
    s.on('dm:new_message', (message: DmMessage) => {
      setDmMessagesByConversation((prev) => ({
        ...prev,
        [message.conversationId]: [...(prev[message.conversationId] ?? []), message],
      }))
      setDmConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === message.conversationId)
        if (idx === -1) {
          api.getDmConversations().then((d) => setDmConversations(d.conversations))
          return prev
        }
        const updated = {
          ...prev[idx],
          lastMessage: { content: message.content, createdAt: message.ts },
          lastActivity: message.ts,
        }
        return [updated, ...prev.slice(0, idx), ...prev.slice(idx + 1)]
      })
      if (message.senderId !== user.id) {
        SFX.message()
        if (document.hidden && isDesktopNotificationsEnabled() && Notification.permission === 'granted') {
          new Notification(message.senderName, { body: message.content })
        }
      }
    })
    s.on('dm:incoming_call', ({ conversationId, fromUser }: { conversationId: string; fromUser: PresenceUser }) => {
      setIncomingCall({ conversationId, fromUser })
    })
    s.on('dm:call_response', ({ conversationId, accepted }: { conversationId: string; accepted: boolean }) => {
      setOutgoingCallConversationId(null)
      if (accepted) voiceRef.current?.join(`dm:${conversationId}`)
    })
    s.on('dm:call_cancel', ({ conversationId }: { conversationId: string }) => {
      setIncomingCall((prev) => (prev?.conversationId === conversationId ? null : prev))
    })

    setSocket(s)
    return () => {
      s.disconnect()
    }
  }, [user])

  const activeServer = useMemo(() => servers.find((s) => s.id === activeServerId) ?? null, [servers, activeServerId])
  const activeChannel = useMemo(
    () => activeServer?.channels.find((c) => c.id === activeChannelId) ?? null,
    [activeServer, activeChannelId],
  )
  const activeMessages = activeChannelId ? messagesByChannel[activeChannelId] ?? [] : []

  useEffect(() => {
    if (socket && activeChannel?.type === 'TEXT') {
      socket.emit('join_channel', activeChannel.id)
    }
  }, [socket, activeChannel])

  const prevVoiceChannelIdRef = useRef<string | null>(null)
  useEffect(() => {
    const wasConnectedToActiveChannel = prevVoiceChannelIdRef.current === activeChannelId
    prevVoiceChannelIdRef.current = voice.channelId
    if (!wasConnectedToActiveChannel || voice.channelId === activeChannelId) return
    if (railMode !== 'servers' || activeChannel?.type !== 'VOICE') return
    const firstText = activeServer?.channels.find((c) => c.type === 'TEXT')
    if (firstText) setActiveChannelId(firstText.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.channelId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [activeChannelId, messagesByChannel])

  function selectChannel(channelId: string, type: 'TEXT' | 'VOICE') {
    setActiveChannelId(channelId)
    if (type === 'VOICE') {
      voice.join(channelId)
    } else if (voice.channelId) {
      voice.leave()
    }
  }

  function jumpToVoiceChannel() {
    const vcId = voice.channelId
    if (!vcId) return
    if (vcId.startsWith('dm:')) {
      setRailMode('dms')
      setActiveDmConversationId(vcId.slice(3))
      return
    }
    const server = servers.find((s) => s.channels.some((c) => c.id === vcId))
    if (!server) return
    setRailMode('servers')
    setActiveServerId(server.id)
    setActiveChannelId(vcId)
  }

  function voiceBarLabel(): string {
    const vcId = voice.channelId
    if (!vcId) return ''
    if (vcId.startsWith('dm:')) {
      const conversationId = vcId.slice(3)
      return dmConversations.find((c) => c.id === conversationId)?.user.username ?? ''
    }
    for (const server of servers) {
      const channel = server.channels.find((c) => c.id === vcId)
      if (channel) return `${channel.name} / ${server.name}`
    }
    return ''
  }

  function selectServer(server: ServerInfo) {
    setRailMode('servers')
    setActiveServerId(server.id)
    const firstText = server.channels.find((c) => c.type === 'TEXT')
    setActiveChannelId(firstText?.id ?? server.channels[0]?.id ?? null)
  }

  async function handleCreateServer(name: string, icon: string) {
    const { server } = await api.createServer(name, icon)
    setServers((prev) => [...prev, server])
    selectServer(server)
    setShowAddServer(false)
    socket?.emit('rooms:sync')
  }

  async function handleJoinServer(code: string) {
    const { server } = await api.joinServerByInvite(code)
    setServers((prev) => (prev.some((s) => s.id === server.id) ? prev : [...prev, server]))
    selectServer(server)
    setShowAddServer(false)
    setPendingInviteCode(null)
    socket?.emit('rooms:sync')
  }

  async function handleLeaveOrDeleteServer(server: ServerInfo) {
    const isOwner = server.ownerId === user!.id
    const message = isOwner
      ? `Deletar o servidor "${server.name}"? Essa ação não pode ser desfeita.`
      : `Sair do servidor "${server.name}"?`
    if (!window.confirm(message)) return

    if (isOwner) await api.deleteServer(server.id)
    else await api.leaveServer(server.id)

    setServers((prev) => prev.filter((s) => s.id !== server.id))
    if (activeServerId === server.id) {
      setActiveServerId(null)
      setActiveChannelId(null)
    }
    setServerMenuOpenId(null)
  }

  function sendMessage(attachment: Attachment | null) {
    if (!socket || !activeChannelId || activeChannel?.type !== 'TEXT') return
    if (!draft.trim() && !attachment) return
    socket.emit('send_message', { channelId: activeChannelId, content: draft, attachment })
    setDraft('')
  }

  async function openDm(userId: string) {
    const result = await api.startDm(userId)
    setDmConversations((prev) => (prev.some((c) => c.id === result.id) ? prev : [
      { id: result.id, user: result.user, lastMessage: null, lastActivity: Date.now() },
      ...prev,
    ]))
    setActiveDmConversationId(result.id)
    setRailMode('dms')
    setProfileViewUserId(null)
    if (!dmMessagesByConversation[result.id]) {
      const { messages } = await api.getDmMessages(result.id)
      setDmMessagesByConversation((prev) => ({ ...prev, [result.id]: messages }))
    }
  }

  async function selectDmConversation(conversationId: string) {
    setActiveDmConversationId(conversationId)
    if (!dmMessagesByConversation[conversationId]) {
      const { messages } = await api.getDmMessages(conversationId)
      setDmMessagesByConversation((prev) => ({ ...prev, [conversationId]: messages }))
    }
  }

  function sendDmMessage(attachment: Attachment | null) {
    if (!socket || !activeDmConversationId) return
    if (!dmDraft.trim() && !attachment) return
    socket.emit('dm:send_message', { conversationId: activeDmConversationId, content: dmDraft, attachment })
    setDmDraft('')
  }

  function startDmCall() {
    if (!socket || !activeDmConversationId) return
    socket.emit('dm:call_invite', { conversationId: activeDmConversationId })
    setOutgoingCallConversationId(activeDmConversationId)
  }

  function cancelOutgoingCall() {
    if (!socket || !outgoingCallConversationId) return
    socket.emit('dm:call_cancel', { conversationId: outgoingCallConversationId })
    setOutgoingCallConversationId(null)
  }

  function acceptIncomingCall() {
    if (!socket || !incomingCall) return
    socket.emit('dm:call_response', { conversationId: incomingCall.conversationId, accepted: true })
    voice.join(`dm:${incomingCall.conversationId}`)
    setActiveDmConversationId(incomingCall.conversationId)
    setRailMode('dms')
    setIncomingCall(null)
  }

  function declineIncomingCall() {
    if (!socket || !incomingCall) return
    socket.emit('dm:call_response', { conversationId: incomingCall.conversationId, accepted: false })
    setIncomingCall(null)
  }

  async function handleAcceptFriendRequest(id: string) {
    const req = pendingIncoming.find((r) => r.id === id)
    await api.acceptFriendRequest(id)
    setPendingIncoming((prev) => prev.filter((r) => r.id !== id))
    if (req) setFriends((prev) => [...prev, req.user])
  }

  async function handleRemoveFriendRequest(id: string) {
    await api.removeFriendRequest(id)
    setFriends((prev) => prev.filter((f) => f.id !== id))
    setPendingIncoming((prev) => prev.filter((r) => r.id !== id))
    setPendingOutgoing((prev) => prev.filter((r) => r.id !== id))
  }

  async function openEditProfile() {
    if (!user) return
    const profile = await api.getProfile(user.id)
    setEditProfileData(profile)
    setProfileViewUserId(null)
  }

  async function handleLogout() {
    voice.leave()
    socket?.disconnect()
    setSocket(null)
    await api.logout().catch(() => {})
    setUser(null)
    setServers([])
    setMessagesByChannel({})
    setActiveServerId(null)
    setActiveChannelId(null)
    setRailMode('servers')
    setFriends([])
    setPendingIncoming([])
    setPendingOutgoing([])
    setDmConversations([])
    setActiveDmConversationId(null)
    setDmMessagesByConversation({})
    setIncomingCall(null)
    setOutgoingCallConversationId(null)
  }

  if (checkingSession) {
    return <div className="login-screen" />
  }

  if (!user) {
    return <AuthScreen onAuthenticated={setUser} />
  }

  return (
    <div className="app-shell">
      <nav className="server-rail">
        <div className="server-pill-wrap">
          <span className="server-pill-indicator" />
          <button
            className={`server-pill ${railMode === 'friends' ? 'active' : ''}`}
            title="Amigos"
            onClick={() => setRailMode('friends')}
          >
            <UsersIcon size={22} />
          </button>
        </div>
        <div className="server-pill-wrap">
          <span className="server-pill-indicator" />
          <button
            className={`server-pill ${railMode === 'dms' ? 'active' : ''}`}
            title="Mensagens diretas"
            onClick={() => setRailMode('dms')}
          >
            <MessageCircleIcon size={22} />
          </button>
        </div>
        <div className="rail-divider" />
        {servers.map((server) => (
          <div className="server-pill-wrap" key={server.id}>
            <span className="server-pill-indicator" />
            <button
              className={`server-pill ${railMode === 'servers' && server.id === activeServerId ? 'active' : ''}`}
              title={server.name}
              onClick={() => selectServer(server)}
            >
              {server.icon}
            </button>
          </div>
        ))}
        <div className="server-pill-wrap">
          <button className="server-pill add-server-pill" title="Adicionar servidor" onClick={() => setShowAddServer(true)}>
            <PlusIcon size={22} />
          </button>
        </div>
      </nav>

      {railMode === 'servers' && (
      <aside className="channel-list">
        <div className="server-title-row">
          <div className="server-title">{activeServer?.name ?? ''}</div>
          {activeServer && (
            <button className="server-title-menu-btn" onClick={() => setServerMenuOpenId(activeServer.id)}>
              ⋮
            </button>
          )}
          {activeServer && serverMenuOpenId === activeServer.id && (
            <ServerMenu
              isOwner={activeServer.ownerId === user.id}
              onInvite={() => {
                setInviteModalServerId(activeServer.id)
                setServerMenuOpenId(null)
              }}
              onLeaveOrDelete={() => handleLeaveOrDeleteServer(activeServer)}
              onClose={() => setServerMenuOpenId(null)}
            />
          )}
        </div>
        <div className="channel-group-label">CANAIS DE TEXTO</div>
        {activeServer?.channels
          .filter((c) => c.type === 'TEXT')
          .map((channel) => (
            <button
              key={channel.id}
              className={`channel-item ${channel.id === activeChannelId ? 'active' : ''}`}
              onClick={() => selectChannel(channel.id, 'TEXT')}
            >
              # {channel.name}
            </button>
          ))}
        <div className="channel-group-label">CANAIS DE VOZ</div>
        {activeServer?.channels
          .filter((c) => c.type === 'VOICE')
          .map((channel) => (
            <div key={channel.id}>
              <button
                className={`channel-item ${channel.id === voice.channelId ? 'active' : ''}`}
                onClick={() => selectChannel(channel.id, 'VOICE')}
              >
                🔊 {channel.name}
              </button>
              {(voice.channelPresence.get(channel.id) ?? []).map((member) => (
                <div key={member.id} className="voice-channel-member">
                  {member.avatarImage ? (
                    <img className="voice-channel-member-avatar-img" src={member.avatarImage} alt="" />
                  ) : (
                    <div className="voice-channel-member-avatar-fallback" style={{ background: member.color }}>
                      {member.username.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="voice-channel-member-name">{member.username}</span>
                </div>
              ))}
            </div>
          ))}
      </aside>
      )}

      {railMode === 'friends' && (
        <div className="wide-panel" style={{ gridColumn: '2 / span 3' }}>
          <FriendsView
            friends={friends}
            incoming={pendingIncoming}
            outgoing={pendingOutgoing}
            onOpenProfile={setProfileViewUserId}
            onMessage={openDm}
            onAccept={handleAcceptFriendRequest}
            onRemove={handleRemoveFriendRequest}
            onSendRequest={(req) => setPendingOutgoing((prev) => [...prev, req])}
          />
        </div>
      )}

      {railMode === 'dms' && (
        <DmSidebar
          conversations={dmConversations}
          activeConversationId={activeDmConversationId}
          onSelect={selectDmConversation}
        />
      )}

      {railMode === 'dms' && voice.channelId === `dm:${activeDmConversationId}` ? (
        <div style={{ gridColumn: '3 / span 2' }}>
          <VoiceStage
            channelName={dmConversations.find((c) => c.id === activeDmConversationId)?.user.username ?? ''}
            localUser={localVoiceUser!}
            localStream={voice.localStream}
            camOn={voice.camOn}
            micOn={voice.micOn}
            deafened={voice.deafened}
            micDeviceId={voice.micDeviceId}
            speakerDeviceId={voice.speakerDeviceId}
            cameraDeviceId={voice.cameraDeviceId}
            screenStream={voice.screenStream}
            isSharingScreen={voice.isSharingScreen}
            participants={voice.participants}
            speakingPeers={voice.speakingPeers}
            error={voice.error}
            onToggleMic={voice.toggleMic}
            onToggleCam={voice.toggleCam}
            onToggleDeafen={voice.toggleDeafen}
            onToggleScreenShare={voice.toggleScreenShare}
            onSelectMicDevice={voice.selectMicDevice}
            onSelectCameraDevice={voice.selectCameraDevice}
            onOpenSettings={() => setShowSettings(true)}
            onLeave={voice.leave}
          />
        </div>
      ) : railMode === 'dms' ? (
        <div style={{ gridColumn: '3 / span 2' }}>
          <DmChatPanel
            conversation={dmConversations.find((c) => c.id === activeDmConversationId) ?? null}
            messages={activeDmConversationId ? dmMessagesByConversation[activeDmConversationId] ?? [] : []}
            draft={dmDraft}
            onDraftChange={setDmDraft}
            onSend={sendDmMessage}
            onOpenProfile={setProfileViewUserId}
            onCall={startDmCall}
          />
        </div>
      ) : null}

      {railMode === 'servers' && activeChannel?.type === 'VOICE' && voice.channelId === activeChannelId ? (
        <VoiceStage
          channelName={activeChannel?.name ?? ''}
          localUser={localVoiceUser!}
          localStream={voice.localStream}
          camOn={voice.camOn}
          micOn={voice.micOn}
          deafened={voice.deafened}
          micDeviceId={voice.micDeviceId}
          speakerDeviceId={voice.speakerDeviceId}
          cameraDeviceId={voice.cameraDeviceId}
          screenStream={voice.screenStream}
          isSharingScreen={voice.isSharingScreen}
          participants={voice.participants}
          speakingPeers={voice.speakingPeers}
          error={voice.error}
          onToggleMic={voice.toggleMic}
          onToggleCam={voice.toggleCam}
          onToggleDeafen={voice.toggleDeafen}
          onToggleScreenShare={voice.toggleScreenShare}
          onSelectMicDevice={voice.selectMicDevice}
          onSelectCameraDevice={voice.selectCameraDevice}
          onOpenSettings={() => setShowSettings(true)}
          onLeave={voice.leave}
        />
      ) : railMode === 'servers' ? (
        <main className="chat-area">
          <header className="chat-header"># {activeChannel?.name ?? ''}</header>
          <div className="messages" ref={scrollRef}>
            {activeMessages.map((m) => (
              <div className="message-row" key={m.id}>
                <button className="avatar" style={{ background: m.authorColor }} onClick={() => setProfileViewUserId(m.authorId)}>
                  {m.authorAvatar ? (
                    <img className="avatar-img" src={m.authorAvatar} alt="" />
                  ) : (
                    m.authorName.slice(0, 1).toUpperCase()
                  )}
                </button>
                <div className="message-body">
                  <div className="message-meta">
                    <span className="message-author" style={{ color: m.authorColor }}>
                      {m.authorName}
                    </span>
                    <span className="message-time">
                      {new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {m.content && <div className="message-content">{m.content}</div>}
                  {m.attachmentUrl && m.attachmentName && m.attachmentType && (
                    <MessageAttachment url={m.attachmentUrl} name={m.attachmentName} type={m.attachmentType} />
                  )}
                </div>
              </div>
            ))}
            {activeMessages.length === 0 && <div className="empty-hint">Nenhuma mensagem ainda. Diga olá!</div>}
          </div>
          <Composer
            placeholder={`Conversar em #${activeChannel?.name ?? ''}`}
            draft={draft}
            onDraftChange={setDraft}
            onSend={sendMessage}
          />
        </main>
      ) : null}

      {railMode === 'servers' && (
        <aside className="member-list">
          <div className="channel-group-label">
            {voice.channelId ? `NA CHAMADA — ${voice.participants.size + 1}` : 'MEMBROS'}
          </div>
          {voice.channelId && (
            <button className="member-item" onClick={() => setProfileViewUserId(user.id)}>
              <span className="user-dot" style={{ background: user.color }} />
              {user.username} (você)
            </button>
          )}
          {Array.from(voice.participants.values()).map((p) => (
            <button className="member-item" key={p.user.id} onClick={() => setProfileViewUserId(p.user.id)}>
              <span className="user-dot" style={{ background: p.user.color }} />
              {p.user.username}
            </button>
          ))}
        </aside>
      )}

      {voice.channelId && (
        <div className="connected-voice-bar-fixed">
          <ConnectedVoiceBar
            label={voiceBarLabel()}
            micOn={voice.micOn}
            deafened={voice.deafened}
            camOn={voice.camOn}
            isSharingScreen={voice.isSharingScreen}
            onOpenView={jumpToVoiceChannel}
            onToggleMic={voice.toggleMic}
            onToggleDeafen={voice.toggleDeafen}
            onToggleCam={voice.toggleCam}
            onToggleScreenShare={voice.toggleScreenShare}
            onDisconnect={voice.leave}
          />
        </div>
      )}

      <div className="user-footer-fixed">
        <div className="user-footer">
          <div className="user-footer-identity-wrap">
            <button className="user-footer-avatar" onClick={() => setShowStatusMenu((v) => !v)} title="Mudar status">
              {myAvatar ? (
                <img className="avatar-img" src={myAvatar} alt="" />
              ) : (
                <div className="user-footer-avatar-fallback" style={{ background: user.color }}>
                  {user.username.slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="user-footer-status-dot" style={{ background: STATUS_META[myStatus].dotColor }} />
            </button>
            {showStatusMenu && (
              <StatusMenu current={myStatus} onChange={setMyStatus} onClose={() => setShowStatusMenu(false)} />
            )}
          </div>

          <button className="user-footer-identity" onClick={() => setProfileViewUserId(user.id)}>
            <span className="user-footer-name">{user.username}</span>
            <span className="user-footer-status-label">{STATUS_META[myStatus].label}</span>
          </button>

          <div className="user-footer-icon-wrap">
            <button
              className={`user-footer-icon-btn ${voice.micOn ? '' : 'danger'}`}
              onClick={voice.toggleMic}
              title={voice.micOn ? 'Mutar microfone' : 'Ativar microfone'}
            >
              {voice.micOn ? <MicIcon size={18} /> : <MicOffIcon size={18} />}
            </button>
            <button className="user-footer-chevron" onClick={() => setShowMicMenu((v) => !v)} title="Dispositivo de entrada">
              <ChevronDownIcon size={14} />
            </button>
            {showMicMenu && (
              <VoiceDeviceMenu
                kind="mic"
                currentDeviceId={voice.micDeviceId}
                onSelect={voice.selectMicDevice}
                onOpenSettings={() => setShowSettings(true)}
                onClose={() => setShowMicMenu(false)}
              />
            )}
          </div>

          <div className="user-footer-icon-wrap">
            <button
              className={`user-footer-icon-btn ${voice.deafened ? 'danger' : ''}`}
              onClick={voice.toggleDeafen}
              title={voice.deafened ? 'Parar de ensurdecer' : 'Ensurdecer'}
            >
              {voice.deafened ? <HeadphonesOffIcon size={18} /> : <HeadphonesIcon size={18} />}
            </button>
            <button className="user-footer-chevron" onClick={() => setShowSpeakerMenu((v) => !v)} title="Dispositivo de saída">
              <ChevronDownIcon size={14} />
            </button>
            {showSpeakerMenu && (
              <VoiceDeviceMenu
                kind="speaker"
                currentDeviceId={voice.speakerDeviceId}
                onSelect={voice.selectSpeakerDevice}
                onOpenSettings={() => setShowSettings(true)}
                onClose={() => setShowSpeakerMenu(false)}
              />
            )}
          </div>

          <button className="user-footer-icon-btn" onClick={() => setShowSettings(true)} title="Configurações">
            <SettingsIcon size={18} />
          </button>
        </div>
      </div>

      {incomingCall && (
        <DmCallRingModal fromUser={incomingCall.fromUser} onAccept={acceptIncomingCall} onDecline={declineIncomingCall} />
      )}

      {outgoingCallConversationId && (
        <div className="outgoing-call-banner">
          Chamando {dmConversations.find((c) => c.id === outgoingCallConversationId)?.user.username}...
          <button onClick={cancelOutgoingCall}>Cancelar</button>
        </div>
      )}

      {profileViewUserId && (
        <ProfileCard
          userId={profileViewUserId}
          isOwnProfile={profileViewUserId === user.id}
          onClose={() => setProfileViewUserId(null)}
          onEdit={openEditProfile}
        />
      )}

      {editProfileData && (
        <EditProfileModal
          profile={editProfileData}
          onClose={() => setEditProfileData(null)}
          onSaved={(updated) => {
            setMyAvatar(updated.avatarImage)
            setMyStatus(updated.status)
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          userId={user.id}
          voice={voice}
          onClose={() => setShowSettings(false)}
          onEditProfile={() => {
            setShowSettings(false)
            openEditProfile()
          }}
          onLogout={() => {
            setShowSettings(false)
            handleLogout()
          }}
        />
      )}

      {showAddServer && (
        <AddServerModal
          initialInviteCode={pendingInviteCode ?? undefined}
          onClose={() => {
            setShowAddServer(false)
            setPendingInviteCode(null)
          }}
          onJoin={handleJoinServer}
          onCreate={handleCreateServer}
        />
      )}

      {inviteModalServerId && (
        <ServerInviteModal
          server={servers.find((s) => s.id === inviteModalServerId)!}
          onClose={() => setInviteModalServerId(null)}
        />
      )}
    </div>
  )
}

export default App
