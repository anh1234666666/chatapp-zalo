import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SidebarNav, ActiveTab } from './SidebarNav';
import { ConversationList } from './ConversationList';
import { ChatArea } from './ChatArea';
import { ContactsView } from './ContactsView';
import { AIChatView } from './AIChatView';
import { SharedFilesView } from './SharedFilesView';
import { ProfileModal } from './ProfileModal';
import { CreateGroupModal } from './CreateGroupModal';
import { CallModal } from './CallModal';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { 
  Conversation, 
  Message, 
  Profile, 
  FriendRequest, 
  MessageAttachment,
  MessageType 
} from '../../types/database';
import { ArrowLeft, Phone, PhoneCall, PhoneOff } from 'lucide-react';

export const ChatLayout: React.FC = () => {
  const { profile } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('messages');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [friends, setFriends] = useState<Profile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isOtherTyping, setIsOtherTyping] = useState<boolean>(false);

  // Mobile navigation state
  const [mobileViewingChat, setMobileViewingChat] = useState<boolean>(false);

  // Modals state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  
  // Call state
  const [activeCall, setActiveCall] = useState<{
    isOpen: boolean;
    type: 'audio' | 'video';
    otherUser: Profile;
    isInitiator: boolean;
  } | null>(null);

  const [incomingCall, setIncomingCall] = useState<{
    fromUser: Profile;
    type: 'audio' | 'video';
  } | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = activeConversationId ? messagesMap[activeConversationId] || [] : [];

  const allAttachments: MessageAttachment[] = Object.values(messagesMap)
    .flat()
    .flatMap((m) => m.attachments || []);

  // ========== REF để interval luôn đọc giá trị mới nhất (tránh stale closure) ==========
  const activeConvIdRef = useRef(activeConversationId);
  const profileRef = useRef(profile);
  const incomingCallRef = useRef(incomingCall);
  useEffect(() => { activeConvIdRef.current = activeConversationId; }, [activeConversationId]);
  useEffect(() => { profileRef.current = profile; }, [profile]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);

  // Hash nhanh để so sánh thay đổi — tránh re-render không cần thiết
  const lastConvHashRef = useRef('');
  const lastFriendsHashRef = useRef('');
  const lastMsgHashRef = useRef<Record<string, string>>({});

  // Hàm fetch dữ liệu bạn bè + cuộc trò chuyện (chạy ngầm, so sánh hash trước khi setState)
  const syncFriendsAndConvs = useCallback(async () => {
    const p = profileRef.current;
    if (!p || isSupabaseConfigured) return;

    try {
      const [fRes, cRes] = await Promise.all([
        fetch(`/api/local/friends?userId=${p.id}`),
        fetch(`/api/local/conversations?userId=${p.id}`),
      ]);

      if (fRes.ok) {
        const fData = await fRes.json();
        const newFHash = JSON.stringify([
          (fData.friends || []).map((f: any) => f.id),
          (fData.received || []).map((r: any) => r.id + r.status),
          (fData.sent || []).map((r: any) => r.id + r.status),
        ]);
        if (newFHash !== lastFriendsHashRef.current) {
          lastFriendsHashRef.current = newFHash;
          setFriends(fData.friends || []);
          setReceivedRequests(fData.received || []);
          setSentRequests(fData.sent || []);
        }

        // Tự động bắt cuộc gọi đến qua polling phòng khi SSE bị ngắt kết nối
        if (fData.incomingCall) {
          setIncomingCall({
            fromUser: fData.incomingCall.fromUser,
            type: fData.incomingCall.type || 'audio',
          });
        }
      }

      if (cRes.ok) {
        const cData = await cRes.json();
        const convList: Conversation[] = cData.conversations || [];
        const newCHash = convList.map((c) => c.id + '|' + (c.last_message_at || '')).join(',');
        if (newCHash !== lastConvHashRef.current) {
          lastConvHashRef.current = newCHash;
          setConversations(convList);
        }
      }
    } catch {
      // ignore network errors
    }
  }, []);

  // Hàm fetch tin nhắn của cuộc trò chuyện đang mở
  const syncMessages = useCallback(async () => {
    const convId = activeConvIdRef.current;
    if (!convId || isSupabaseConfigured) return;

    try {
      const res = await fetch(`/api/local/messages?convId=${convId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (!data.messages) return;

      const newHash = data.messages.length + ':' + (data.messages[data.messages.length - 1]?.id || '');
      if (newHash !== lastMsgHashRef.current[convId]) {
        lastMsgHashRef.current[convId] = newHash;
        setMessagesMap((prev) => ({
          ...prev,
          [convId]: data.messages,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // ========== 1. VÒNG LẶP TỰ ĐỒNG BỘ NGẦM ==========
  // Interval duy nhất, KHÔNG phụ thuộc activeConversationId → không bị destroy/recreate
  useEffect(() => {
    if (!profile) return;

    // Tải ngay lần đầu
    syncFriendsAndConvs();
    syncMessages();

    const interval = setInterval(() => {
      syncFriendsAndConvs();
      syncMessages();
    }, 1200); // 1.2 giây — đủ nhanh, không giật

    return () => clearInterval(interval);
  }, [profile, syncFriendsAndConvs, syncMessages]);

  // Vòng lặp nhận diện cuộc gọi đến siêu tốc (mỗi 250ms) để đối phương nhận chuông gọi ngay tức thì
  useEffect(() => {
    if (!profile || isSupabaseConfigured) return;
    const callInterval = setInterval(async () => {
      if (activeCall?.isOpen) return;
      try {
        const res = await fetch(`/api/local/call/incoming?userId=${profile.id}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.incomingCall) {
          setIncomingCall({
            fromUser: data.incomingCall.fromUser,
            type: data.incomingCall.type || 'audio',
          });
        }
      } catch {}
    }, 250);
    return () => clearInterval(callInterval);
  }, [profile, activeCall]);

  // Khi chuyển cuộc trò chuyện → tải tin nhắn ngay lập tức (không đợi interval)
  useEffect(() => {
    if (activeConversationId) {
      syncMessages();
    }
  }, [activeConversationId, syncMessages]);

  // ========== 2. SSE REALTIME (bổ sung — tức thì khi có sự kiện) ==========
  useEffect(() => {
    if (!profile || isSupabaseConfigured) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let isUnmounting = false;

    function connect() {
      if (isUnmounting) return;
      eventSource = new EventSource(`/api/local/stream?userId=${profile!.id}`);

      eventSource.addEventListener('new_message', (e) => {
        const newMsg = JSON.parse(e.data) as Message;
        setMessagesMap((prev) => ({
          ...prev,
          [newMsg.conversation_id]: [
            ...(prev[newMsg.conversation_id] || []).filter((m) => m.id !== newMsg.id),
            newMsg,
          ],
        }));
        // Cập nhật luôn hash để interval không ghi đè
        lastMsgHashRef.current[newMsg.conversation_id] = 'sse-updated';

        setConversations((prev) =>
          prev.map((c) =>
            c.id === newMsg.conversation_id
              ? {
                  ...c,
                  last_message_preview: newMsg.content || '[Tệp đính kèm]',
                  last_message_at: newMsg.created_at,
                }
              : c
          )
        );
      });

      eventSource.addEventListener('friend_request_received', () => {
        syncFriendsAndConvs();
      });

      eventSource.addEventListener('friend_accepted', () => {
        syncFriendsAndConvs();
      });

      eventSource.addEventListener('call_signal', (e) => {
        const { signalType, fromUser, payload } = JSON.parse(e.data);
        if (signalType === 'call_request') {
          setIncomingCall({
            fromUser,
            type: payload?.type || 'audio',
          });
        } else if (signalType === 'call_ended') {
          setIncomingCall(null);
          setActiveCall(null);
        }
      });

      // Tự động reconnect khi SSE bị đứt (Cloudflare tunnel hay timeout)
      eventSource.onerror = () => {
        eventSource?.close();
        if (!isUnmounting) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      isUnmounting = true;
      clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [profile, syncFriendsAndConvs]);

  // Đọc file sang Base64 - tự động nén ảnh chất lượng cao để gửi cực nhanh và mượt mà
  const compressAndReadFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/') || file.type.includes('svg') || file.type.includes('gif')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      };
      img.src = objectUrl;
    });
  };

  // Gửi tin nhắn mới
  const handleSendMessage = async (
    content: string,
    replyToId?: string | null,
    files?: File[],
    customMessageType?: MessageType,
    targetConvId?: string
  ) => {
    const convId = targetConvId || activeConversationId;
    if (!convId || !profile) return;

    const newMsgId = 'msg-' + Date.now();
    const nowIso = new Date().toISOString();

    const replyMsg = replyToId
      ? currentMessages.find((m) => m.id === replyToId) || null
      : null;

    const attachments: MessageAttachment[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        try {
          const dataUrl = await compressAndReadFile(f);
          attachments.push({
            id: 'att-' + Date.now() + '-' + i,
            message_id: newMsgId,
            file_url: dataUrl,
            file_name: f.name,
            file_size: f.size,
            file_type: f.type || 'application/octet-stream',
            created_at: nowIso,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    const msgType = customMessageType || (attachments.length > 0 ? (attachments[0].file_type.startsWith('image/') ? 'image' : 'file') : 'text');

    const optimisticMsg: Message = {
      id: newMsgId,
      conversation_id: convId,
      sender_id: profile.id,
      content,
      message_type: msgType,
      reply_to_id: replyToId,
      reply_message: replyMsg,
      attachments: attachments.length > 0 ? attachments : undefined,
      is_revoked: false,
      created_at: nowIso,
      sender: profile,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [convId]: [...(prev[convId] || []), optimisticMsg],
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              last_message_preview: content || '[Tệp/Hình ảnh]',
              last_message_at: nowIso,
            }
          : c
      )
    );

    if (!isSupabaseConfigured) {
      try {
        await fetch('/api/local/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: convId,
            senderId: profile.id,
            content,
            replyToId,
            messageType: optimisticMsg.message_type,
            attachments: optimisticMsg.attachments,
          }),
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRevokeMessage = async (msgId: string) => {
    if (!activeConversationId) return;

    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: (prev[activeConversationId] || []).map((m) =>
        m.id === msgId ? { ...m, is_revoked: true, content: '' } : m
      ),
    }));

    if (!isSupabaseConfigured) {
      await fetch('/api/local/messages/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConversationId,
          messageId: msgId,
        }),
      });
    }
  };

  const handleStartCall = async (type: 'audio' | 'video') => {
    if (!activeConversation?.other_user || !profile) return;
    
    setActiveCall({
      isOpen: true,
      type,
      otherUser: activeConversation.other_user,
      isInitiator: true,
    });
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      isOpen: true,
      type: incomingCall.type,
      otherUser: incomingCall.fromUser,
      isInitiator: false,
    });
    setIncomingCall(null);
  };

  const handleDeclineIncomingCall = () => {
    if (!incomingCall || !profile) return;
    const caller = incomingCall.fromUser;
    const cType = incomingCall.type;

    if (!isSupabaseConfigured) {
      fetch('/api/local/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: caller.id,
          signalType: 'call_ended',
          fromUser: profile,
        }),
      }).catch(() => {});
    }

    // Ghi nhận cuộc gọi nhỡ vào đoạn chat Zalo
    const targetConv = conversations.find(
      (c) => !c.is_group && c.other_user?.id === caller.id
    );
    const convId = targetConv?.id || 'conv_' + [profile.id, caller.id].sort().join('_');
    const callText = cType === 'video' ? 'Cuộc gọi video bị nhỡ' : 'Cuộc gọi thoại bị nhỡ';
    handleSendMessage(callText, null, undefined, 'call', convId);

    setIncomingCall(null);
  };

  const handleEndCall = (duration: number, callType: 'audio' | 'video') => {
    const targetUser = activeCall?.otherUser;
    setActiveCall(null);
    if (!targetUser || !profile) return;

    const m = Math.floor(duration / 60).toString().padStart(2, '0');
    const s = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${m}:${s}`;

    let callText = '';
    if (duration > 0) {
      callText = callType === 'video'
        ? `Cuộc gọi video (${timeStr})`
        : `Cuộc gọi thoại (${timeStr})`;
    } else {
      callText = callType === 'video'
        ? `Cuộc gọi video bị nhỡ`
        : `Cuộc gọi thoại bị nhỡ`;
    }

    // Tìm id cuộc trò chuyện giữa 2 người để gửi thông báo cuộc gọi kết thúc chuẩn Zalo
    const targetConv = conversations.find(
      (c) => !c.is_group && c.other_user?.id === targetUser.id
    );
    const convId = targetConv?.id || activeConversationId || 'conv_' + [profile.id, targetUser.id].sort().join('_');

    handleSendMessage(callText, null, undefined, 'call', convId);
  };

  const handleOpenChatWith = (user: Profile) => {
    const existing = conversations.find(
      (c) => !c.is_group && c.other_user?.id === user.id
    );
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      const newConvId = 'conv_' + [profile?.id, user.id].sort().join('_');
      const newConv: Conversation = {
        id: newConvId,
        is_group: false,
        other_user: user,
        last_message_preview: 'Bắt đầu cuộc trò chuyện...',
        last_message_at: new Date().toISOString(),
        unread_count: 0,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConvId);
    }
    setMobileViewingChat(true);
    setActiveTab('messages');
  };

  // Gửi lời mời kết bạn (Tự động cập nhật tức thì)
  const handleSendFriendRequest = async (targetUsernameOrPhone: string) => {
    if (!profile) return { error: { message: 'Chưa đăng nhập' } };

    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/local/friends/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            senderId: profile.id,
            targetUsernameOrPhone,
            sender: profile,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          return { error: { message: data.error || 'Không tìm thấy người dùng' } };
        }

        // Nếu người kia đã gửi lời mời trước đó hoặc đã là bạn bè -> Mở ngay cuộc trò chuyện!
        if (data.convId && (data.accepted || data.isFriend)) {
          setActiveConversationId(data.convId);
          setMobileViewingChat(true);
          setActiveTab('messages');
          await syncFriendsAndConvs();
          return { error: null, accepted: true, convId: data.convId };
        }

        if (data.request) {
          setSentRequests((prev) => [data.request, ...prev.filter((r) => r.id !== data.request.id)]);
        }

        await syncFriendsAndConvs();
        return { error: null, accepted: false };
      } catch (err: any) {
        return { error: { message: err.message || 'Lỗi gửi lời mời kết bạn' } };
      }
    }

    return { error: { message: 'Vui lòng cấu hình Supabase Cloud' } };
  };

  // Chấp nhận lời mời kết bạn (Tự động mở phòng chat)
  const handleAcceptRequest = async (requestId: string) => {
    if (!profile) return;
    if (!isSupabaseConfigured) {
      try {
        const res = await fetch('/api/local/friends/accept', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, userId: profile.id }),
        });
        if (res.ok) {
          const data = await res.json();
          setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
          await syncFriendsAndConvs();
          if (data.convId) {
            setActiveConversationId(data.convId);
            setMobileViewingChat(true);
            setActiveTab('messages');
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setReceivedRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleCancelRequest = async (requestId: string) => {
    setSentRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const handleUnfriend = async (userId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== userId));
  };

  const handleCreateGroup = async (name: string, selectedFriendIds: string[]) => {
    const newGroupId = 'group-' + Date.now();
    const groupMembers = friends.filter((f) => selectedFriendIds.includes(f.id));
    
    const newGroupConv: Conversation = {
      id: newGroupId,
      is_group: true,
      name,
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${name}`,
      last_message_preview: 'Nhóm vừa được tạo.',
      last_message_at: new Date().toISOString(),
      unread_count: 0,
      members: [
        { id: 'm-owner', conversation_id: newGroupId, user_id: profile?.id || 'me', role: 'owner', profile },
        ...groupMembers.map((m) => ({
          id: 'm-' + m.id,
          conversation_id: newGroupId,
          user_id: m.id,
          role: 'member' as const,
          profile: m,
        })),
      ],
    };

    setConversations((prev) => [newGroupConv, ...prev]);
    setActiveConversationId(newGroupId);
    setMobileViewingChat(true);
    setActiveTab('messages');
  };

  return (
    <div className="h-[100dvh] w-screen flex flex-col md:flex-row bg-slate-100 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* ====== DESKTOP: Sidebar trái ====== */}
      <div className="hidden md:flex">
        <SidebarNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileViewingChat(false);
          }}
          onOpenProfile={() => setProfileModalOpen(true)}
          onOpenSettings={() => setProfileModalOpen(true)}
          unreadCount={conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
          friendRequestsCount={receivedRequests.length}
        />
      </div>

      {/* ====== MAIN CONTENT: Toàn màn hình mobile, flex-1 desktop ====== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">

        {/* === NỘI DUNG CHÍNH (không tính bottom bar) === */}
        <div className="flex-1 flex overflow-hidden min-h-0">

          {/* Tab 1: Messages */}
          {activeTab === 'messages' && (
            <div className="flex-1 flex h-full w-full overflow-hidden">
              {/* Conversation List */}
              <div className={`h-full w-full md:w-80 md:shrink-0 ${mobileViewingChat ? 'hidden md:block' : 'block w-full'}`}>
                <ConversationList
                  conversations={conversations}
                  activeConversationId={activeConversationId}
                  onSelectConversation={(c) => {
                    setActiveConversationId(c.id);
                    setMobileViewingChat(true);
                    setConversations((prev) =>
                      prev.map((item) => (item.id === c.id ? { ...item, unread_count: 0 } : item))
                    );
                  }}
                  onOpenAddFriend={() => setActiveTab('contacts')}
                  onCreateGroup={() => setCreateGroupModalOpen(true)}
                  onlineUserIds={onlineUsers}
                />
              </div>

              {/* Chat Area */}
              <div className={`flex-1 h-full flex flex-col ${!mobileViewingChat ? 'hidden md:flex' : 'flex w-full'}`}>
                {activeConversation ? (
                  <div className="flex-1 h-full flex flex-col relative w-full overflow-hidden">
                    {/* Nút quay lại trên Mobile */}
                    <div className="md:hidden absolute top-3.5 left-2.5 z-20">
                      <button
                        onClick={() => setMobileViewingChat(false)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm"
                        title="Quay lại"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    </div>

                    <ChatArea
                      conversation={activeConversation}
                      messages={currentMessages}
                      currentUserId={profile?.id || ''}
                      onSendMessage={handleSendMessage}
                      onRevokeMessage={handleRevokeMessage}
                      onStartCall={handleStartCall}
                      isOtherTyping={isOtherTyping}
                      isOnline={
                        !activeConversation.is_group &&
                        Boolean(activeConversation.other_user?.id && onlineUsers.has(activeConversation.other_user.id))
                      }
                    />
                  </div>
                ) : (
                  <div className="hidden md:flex flex-1 h-full flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/60 text-slate-400 p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mb-4 text-2xl">
                      💬
                    </div>
                    <h4 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Chào mừng {profile?.display_name}!
                    </h4>
                    <p className="text-xs max-w-sm">
                      Hãy chọn một cuộc trò chuyện ở cột bên trái hoặc vào mục <b>"Danh bạ"</b> để bắt đầu nhắn tin.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Contacts & Friends */}
          {activeTab === 'contacts' && (
            <ContactsView
              friends={friends}
              receivedRequests={receivedRequests}
              sentRequests={sentRequests}
              onOpenChatWith={handleOpenChatWith}
              onAcceptRequest={handleAcceptRequest}
              onDeclineRequest={handleDeclineRequest}
              onCancelRequest={handleCancelRequest}
              onSendFriendRequest={handleSendFriendRequest}
              onUnfriend={handleUnfriend}
              currentUserId={profile?.id}
            />
          )}

          {/* Tab 3: AI Assistant */}
          {activeTab === 'ai' && <AIChatView />}

          {/* Tab 4: Shared Files */}
          {activeTab === 'files' && <SharedFilesView attachments={allAttachments} />}

          {/* Tab 5: Notifications */}
          {activeTab === 'notifications' && (
            <div className="flex-1 p-6 sm:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Thông Báo Hệ Thống</h3>
              <div className="max-w-2xl bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs">
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
                  🎉 Tài khoản <b>@{profile?.username}</b> đã kết nối thành công!
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ====== MOBILE BOTTOM NAV BAR (chỉ hiện khi không đang xem chat) ====== */}
        {!(mobileViewingChat && activeTab === 'messages') && (
          <div className="md:hidden flex-shrink-0 flex flex-row items-center justify-around px-2 py-1 bg-[#0091ff] dark:bg-slate-950 border-t border-blue-400/20 dark:border-slate-800 safe-area-inset-bottom z-30">
            
            {/* Tin nhắn */}
            <button
              onClick={() => { setActiveTab('messages'); setMobileViewingChat(false); }}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'messages' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 text-[9px] bg-red-500 text-white font-bold rounded-full flex items-center justify-center border border-[#0091ff]">
                  {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0)}
                </span>
              )}
              <span className="text-[10px] font-medium">Chat</span>
            </button>

            {/* Danh bạ */}
            <button
              onClick={() => { setActiveTab('contacts'); setMobileViewingChat(false); }}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'contacts' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {receivedRequests.length > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 text-[9px] bg-amber-500 text-white font-bold rounded-full flex items-center justify-center border border-[#0091ff]">
                  {receivedRequests.length}
                </span>
              )}
              <span className="text-[10px] font-medium">Danh bạ</span>
            </button>

            {/* AI */}
            <button
              onClick={() => { setActiveTab('ai'); setMobileViewingChat(false); }}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === 'ai' ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1 1 .03 2.698-1.338 2.698H4.136c-1.368 0-2.338-1.698-1.338-2.698L4 15.3" />
              </svg>
              <span className="text-[10px] font-medium">AI</span>
            </button>

            {/* Hồ sơ */}
            <button
              onClick={() => setProfileModalOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-white/70 hover:text-white transition-all"
            >
              <div className="w-5 h-5 rounded-full overflow-hidden border border-white/60">
                <img
                  src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || 'user'}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-medium">Tôi</span>
            </button>

          </div>
        )}

      </div>

      {/* POPUP CUỘC GỌI ĐẾN */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700 space-y-6">
            <div className="relative mx-auto w-24 h-24 rounded-full overflow-hidden border-4 border-blue-500 animate-pulse">
              <img
                src={incomingCall.fromUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${incomingCall.fromUser.username}`}
                alt="Caller"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="text-xl font-bold">{incomingCall.fromUser.display_name}</h3>
              <p className="text-xs text-blue-400 mt-1">
                Đang gọi {incomingCall.type === 'video' ? 'Video HD...' : 'Thoại...'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-6 pt-2">
              <button
                onClick={handleDeclineIncomingCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                title="Từ chối"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>
              <button
                onClick={handleAcceptIncomingCall}
                className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center shadow-lg transition-transform hover:scale-110 animate-bounce"
                title="Trả lời"
              >
                <PhoneCall className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={createGroupModalOpen}
        friends={friends}
        onClose={() => setCreateGroupModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />

      {/* WebRTC Video Call Modal */}
      {activeCall?.isOpen && profile && (
        <CallModal
          isOpen={activeCall.isOpen}
          callType={activeCall.type}
          otherUser={activeCall.otherUser}
          currentUserId={profile.id}
          isInitiator={activeCall.isInitiator}
          onEndCall={handleEndCall}
        />
      )}

    </div>
  );
};
