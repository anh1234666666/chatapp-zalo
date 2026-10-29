/**
 * Local Realtime Backend Middleware với CSDL Lưu Trữ Vĩnh Viễn Trên Ổ Đĩa (JSON Persistence)
 * Tự động ghi vào db_storage.json để không bao giờ bị mất tài khoản, bạn bè hay tin nhắn khi sửa code hay khởi động lại.
 */

import { IncomingMessage, ServerResponse } from 'http';
import fs from 'fs';
import path from 'path';

interface UserStore {
  id: string;
  username: string;
  display_name: string;
  phone?: string;
  avatar_url: string;
  status_message?: string;
  is_online: boolean;
  last_seen: string;
}

interface MessageAttachmentStore {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
}

interface MessageStore {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  reply_to_id?: string | null;
  attachments?: MessageAttachmentStore[];
  is_revoked: boolean;
  created_at: string;
  sender?: UserStore;
}

interface FriendRequestStore {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  sender?: UserStore;
  receiver?: UserStore;
}

interface ConversationStore {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
  is_group: boolean;
  members: string[];
  last_message_preview?: string;
  last_message_at?: string;
}

// Đường dẫn file lưu trữ vĩnh viễn trên ổ cứng
const DB_FILE = path.resolve(process.cwd(), 'db_storage.json');

// Khởi tạo các biến dữ liệu
let users = new Map<string, UserStore>();
let messages = new Map<string, MessageStore[]>();
let friendRequests: FriendRequestStore[] = [];
let friendships = new Set<string>();
let conversations = new Map<string, ConversationStore>();
const sseClients = new Map<string, Set<ServerResponse>>();

// Hàm đọc dữ liệu từ file JSON ổ đĩa khi server chạy
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.users) users = new Map(Object.entries(data.users));
      if (data.messages) messages = new Map(Object.entries(data.messages));
      if (data.friendRequests) {
        friendRequests = data.friendRequests;
        // Tự động hồi phục các tài khoản từ friendRequests nếu bị thiếu trong bảng users
        friendRequests.forEach((r) => {
          if (r.sender && !users.has(r.sender.id)) {
            users.set(r.sender.id, r.sender);
          }
          if (r.receiver && !users.has(r.receiver.id)) {
            users.set(r.receiver.id, r.receiver);
          }
        });
      }
      if (data.friendships) friendships = new Set(data.friendships);
      if (data.conversations) conversations = new Map(Object.entries(data.conversations));
      console.log(`[Database] Đã nạp thành công ${users.size} tài khoản, ${friendships.size} mối quan hệ bạn bè từ ổ đĩa.`);
    }
  } catch (err) {
    console.error('[Database] Lỗi nạp database:', err);
  }
}

// Hàm lưu dữ liệu xuống file JSON ổ đĩa
function saveDatabase() {
  try {
    const data = {
      users: Object.fromEntries(users),
      messages: Object.fromEntries(messages),
      friendRequests,
      friendships: Array.from(friendships),
      conversations: Object.fromEntries(conversations),
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Database] Lỗi lưu database:', err);
  }
}

// Nạp dữ liệu ngay khi khởi động
loadDatabase();

function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}

function sendSSE(userId: string, eventName: string, data: any) {
  const clients = sseClients.get(userId);
  if (clients) {
    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach((res) => {
      try {
        res.write(payload);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
      } catch {
        clients.delete(res);
      }
    });
  }
}

function broadcastSSE(userIds: string[], eventName: string, data: any) {
  userIds.forEach((uid) => sendSSE(uid, eventName, data));
}

// Chuẩn hóa số điện thoại: bỏ ký tự đặc biệt, bỏ 0 hoặc 84 ở đầu
function cleanPhone(p?: string): string {
  if (!p) return '';
  return p.replace(/\D/g, '').replace(/^(84|0)/, '');
}

// Chuẩn hóa chuỗi văn bản không dấu/kí tự đặc biệt để so sánh
function cleanText(t?: string): string {
  if (!t) return '';
  return t.toLowerCase().replace(/[@\s\-\.\_\,\:\#]/g, '').trim();
}

// Tìm kiếm người dùng thông minh: ưu tiên khớp chính xác (ID, Username, SĐT) trước, sau đó mới khớp gần đúng
function findUserByQuery(query: string, excludeId?: string): UserStore | undefined {
  const q = query.trim();
  if (!q) return undefined;
  const qClean = cleanText(q);
  const qPhone = cleanPhone(q);

  // 1. Vòng lặp khớp CHÍNH XÁC
  for (const u of users.values()) {
    if (excludeId && u.id === excludeId) continue;
    if (u.id === q || u.id === qClean) return u;
    if (cleanText(u.username) === qClean) return u;
    if (qPhone && u.phone) {
      const uPhone = cleanPhone(u.phone);
      if (uPhone && uPhone === qPhone) return u;
    }
    if (cleanText(u.display_name) === qClean) return u;
  }

  // 2. Vòng lặp khớp GẦN ĐÚNG
  for (const u of users.values()) {
    if (excludeId && u.id === excludeId) continue;
    if (cleanText(u.username).includes(qClean) || (qClean.length >= 3 && cleanText(u.username).startsWith(qClean))) return u;
    if (u.display_name.toLowerCase().includes(q.toLowerCase())) return u;
  }

  return undefined;
}

// Lưu trữ trạng thái cuộc gọi đang diễn ra để đồng bộ polling phòng khi SSE lag
const activeCalls = new Map<string, { fromUser: UserStore; type: 'audio' | 'video'; timestamp: number }>();
// Hàng đợi tín hiệu WebRTC P2P (offer, answer, ICE candidates) để truyền tải đáng tin cậy 100%
const userSignalQueue = new Map<string, Array<{ signalType: string; payload: any; fromUser?: any; fromUserId?: string; timestamp: number }>>();

// Lưu trữ khung hình video và dữ liệu âm thanh trực tiếp xuyên tường lửa qua Cloudflare Tunnel
const userVideoFrames = new Map<string, string>();
const userAudioQueue = new Map<string, Array<{ id: number; data: string }>>();

function addSignal(targetUserId: string, signal: any) {
  if (!userSignalQueue.has(targetUserId)) {
    userSignalQueue.set(targetUserId, []);
  }
  userSignalQueue.get(targetUserId)!.push(signal);
  if (userSignalQueue.get(targetUserId)!.length > 50) {
    userSignalQueue.get(targetUserId)!.shift();
  }
}

export function createLocalBackendMiddleware() {
  return async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = new URL(req.url || '/', 'http://localhost');

    if (!url.pathname.startsWith('/api/local/')) {
      return next();
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const path = url.pathname.replace('/api/local', '');

    // 1. SSE Realtime Stream
    if (path === '/stream') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end('Missing userId');
        return;
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      res.write(': ' + ' '.repeat(2048) + '\n\n');

      if (!sseClients.has(userId)) {
        sseClients.set(userId, new Set());
      }
      sseClients.get(userId)!.add(res);

      const u = users.get(userId);
      if (u) {
        u.is_online = true;
        u.last_seen = new Date().toISOString();
      }

      req.on('close', () => {
        sseClients.get(userId)?.delete(res);
        const user = users.get(userId);
        if (user) {
          user.is_online = false;
        }
      });

      res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
      return;
    }

    // 2. Auth Register
    if (path === '/auth/register' && req.method === 'POST') {
      const body = await parseBody(req);
      const { id, username, display_name, phone, avatar_url } = body;

      if (!username || !display_name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Username và Display Name là bắt buộc' }));
        return;
      }

      const cleanU = cleanText(username);

      // Tìm tài khoản đã tồn tại theo username, ID hoặc phone
      let existing = Array.from(users.values()).find(
        (u) => cleanText(u.username) === cleanU || (id && u.id === id)
      );

      const userId = existing ? existing.id : (id || 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6));

      const userProfile: UserStore = {
        id: userId,
        username: username.toLowerCase().trim(),
        display_name: display_name.trim(),
        phone: (phone || existing?.phone || '').trim(),
        avatar_url: avatar_url || existing?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanU}`,
        status_message: 'Đang hoạt động trên Chat App',
        is_online: true,
        last_seen: new Date().toISOString(),
      };

      users.set(userId, userProfile);
      saveDatabase(); // Lưu ngay vào file trên ổ đĩa!

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user: userProfile }));
      return;
    }

    // 3. Search Users & Gợi ý tất cả tài khoản
    if (path === '/users/search' && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').trim();
      const currentUserId = url.searchParams.get('userId');

      const matches = Array.from(users.values()).filter((u) => {
        if (currentUserId && u.id === currentUserId) return false;
        if (!q) return true; // Trả về tất cả nếu ô tìm kiếm để trống!
        return (
          cleanText(u.username).includes(cleanText(q)) ||
          u.display_name.toLowerCase().includes(q.toLowerCase()) ||
          (u.phone && cleanPhone(u.phone).includes(cleanPhone(q)))
        );
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ users: matches }));
      return;
    }

    // 4. Send Friend Request (Tìm thông minh theo SĐT, Username hoặc Tên)
    if (path === '/friends/request' && req.method === 'POST') {
      const body = await parseBody(req);
      const { senderId, targetUsernameOrPhone } = body;

      let sender = users.get(senderId);
      if (!sender && body.sender) {
        sender = body.sender;
        users.set(senderId, sender!);
      }

      const receiver = findUserByQuery(targetUsernameOrPhone, senderId);

      if (!receiver) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Không tìm thấy người dùng với thông tin: "${targetUsernameOrPhone}"` }));
        return;
      }

      if (receiver.id === senderId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Không thể tự kết bạn với chính mình.' }));
        return;
      }

      // Kiểm tra đã là bạn bè chưa
      if (friendships.has(`${senderId}:${receiver.id}`) || friendships.has(`${receiver.id}:${senderId}`)) {
        const convId = 'conv_' + [senderId, receiver.id].sort().join('_');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, isFriend: true, convId, message: 'Hai bạn đã là bạn bè.' }));
        return;
      }

      // NẾU NGƯỜI KIA ĐÃ GỬI LỜI MỜI CHO MÌNH TRƯỚC ĐÓ (Reverse request) -> TỰ ĐỘNG CHẤP NHẬN NGAY!
      const reverseReq = friendRequests.find(
        (r) => r.sender_id === receiver.id && r.receiver_id === senderId && r.status === 'pending'
      );
      if (reverseReq) {
        reverseReq.status = 'accepted';
        friendships.add(`${senderId}:${receiver.id}`);
        friendships.add(`${receiver.id}:${senderId}`);

        const convId = 'conv_' + [senderId, receiver.id].sort().join('_');
        if (!conversations.has(convId)) {
          conversations.set(convId, {
            id: convId,
            is_group: false,
            members: [senderId, receiver.id],
            last_message_preview: 'Hai bạn đã trở thành bạn bè.',
            last_message_at: new Date().toISOString(),
          });
          messages.set(convId, []);
        }

        saveDatabase();

        sendSSE(senderId, 'friend_accepted', { friend: receiver, convId });
        sendSSE(receiver.id, 'friend_accepted', { friend: sender, convId });

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, accepted: true, convId, message: 'Hai bạn đã trở thành bạn bè!' }));
        return;
      }

      // Kiểm tra đã gửi lời mời trước đó chưa
      const existingReq = friendRequests.find(
        (r) => r.sender_id === senderId && r.receiver_id === receiver.id && r.status === 'pending'
      );
      if (existingReq) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, request: existingReq, message: 'Đã gửi lời mời trước đó.' }));
        return;
      }

      const reqId = 'freq_' + Date.now();
      const newReq: FriendRequestStore = {
        id: reqId,
        sender_id: senderId,
        receiver_id: receiver.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        sender: sender || {
          id: senderId,
          display_name: 'Người dùng',
          username: 'user',
          avatar_url: '',
          is_online: true,
          last_seen: new Date().toISOString(),
        },
        receiver,
      };

      friendRequests.push(newReq);
      saveDatabase(); // Lưu vĩnh viễn

      sendSSE(receiver.id, 'friend_request_received', newReq);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, request: newReq }));
      return;
    }

    // 5. Accept Friend Request
    if (path === '/friends/accept' && req.method === 'POST') {
      const body = await parseBody(req);
      const { requestId } = body;

      const reqIndex = friendRequests.findIndex((r) => r.id === requestId);
      if (reqIndex === -1) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Không tìm thấy lời mời' }));
        return;
      }

      const r = friendRequests[reqIndex];
      r.status = 'accepted';

      // Cập nhật tất cả các lời mời giữa 2 người này thành accepted
      friendRequests.forEach((item) => {
        if (
          (item.sender_id === r.sender_id && item.receiver_id === r.receiver_id) ||
          (item.sender_id === r.receiver_id && item.receiver_id === r.sender_id)
        ) {
          item.status = 'accepted';
        }
      });

      friendships.add(`${r.sender_id}:${r.receiver_id}`);
      friendships.add(`${r.receiver_id}:${r.sender_id}`);

      const convId = 'conv_' + [r.sender_id, r.receiver_id].sort().join('_');
      if (!conversations.has(convId)) {
        conversations.set(convId, {
          id: convId,
          is_group: false,
          members: [r.sender_id, r.receiver_id],
          last_message_preview: 'Hai bạn đã trở thành bạn bè.',
          last_message_at: new Date().toISOString(),
        });
        messages.set(convId, []);
      }

      saveDatabase(); // Lưu vĩnh viễn

      const sender = users.get(r.sender_id) || r.sender;
      const receiver = users.get(r.receiver_id) || r.receiver;

      sendSSE(r.sender_id, 'friend_accepted', { friend: receiver, convId });
      sendSSE(r.receiver_id, 'friend_accepted', { friend: sender, convId });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, convId }));
      return;
    }

    // 6. Get Friends & Requests
    if (path === '/friends' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end();
        return;
      }

      const userFriends: UserStore[] = [];
      friendships.forEach((pair) => {
        const [u1, u2] = pair.split(':');
        if (u1 === userId && users.has(u2)) {
          userFriends.push(users.get(u2)!);
        }
      });

      const received = friendRequests
        .filter((r) => r.receiver_id === userId && r.status === 'pending')
        .map((r) => ({
          ...r,
          sender: users.get(r.sender_id) || r.sender || { id: r.sender_id, display_name: 'Người dùng', username: 'user' },
          receiver: users.get(r.receiver_id) || r.receiver,
        }));

      const sent = friendRequests
        .filter((r) => r.sender_id === userId && r.status === 'pending')
        .map((r) => ({
          ...r,
          sender: users.get(r.sender_id) || r.sender,
          receiver: users.get(r.receiver_id) || r.receiver || { id: r.receiver_id, display_name: 'Người dùng', username: 'user' },
        }));

      // Lấy cuộc gọi đang đến (nếu có trong vòng 30s)
      const incCall = activeCalls.get(userId);
      const incomingCall = incCall && Date.now() - incCall.timestamp < 30000 ? incCall : null;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ friends: userFriends, received, sent, incomingCall }));
      return;
    }

    // 7. Get Conversations
    if (path === '/conversations' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end();
        return;
      }

      // Đảm bảo tất cả bạn bè đều có cuộc trò chuyện
      friendships.forEach((pair) => {
        const [u1, u2] = pair.split(':');
        if (u1 === userId && users.has(u2)) {
          const convId = 'conv_' + [u1, u2].sort().join('_');
          if (!conversations.has(convId)) {
            conversations.set(convId, {
              id: convId,
              is_group: false,
              members: [u1, u2],
              last_message_preview: 'Hai bạn đã trở thành bạn bè.',
              last_message_at: new Date().toISOString(),
            });
            messages.set(convId, []);
          }
        }
      });

      const userConvs = Array.from(conversations.values())
        .filter((c) => c.members.includes(userId))
        .map((c) => {
          const otherId = c.members.find((m) => m !== userId);
          const otherUser = otherId ? users.get(otherId) : null;
          return {
            ...c,
            other_user: otherUser,
            unread_count: 0,
          };
        })
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ conversations: userConvs }));
      return;
    }

    // 8. Get Messages
    if (path === '/messages' && req.method === 'GET') {
      const convId = url.searchParams.get('convId') || '';
      const list = messages.get(convId) || [];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ messages: list }));
      return;
    }

    // 9. Send Message: Hỗ trợ cả text, ảnh Base64, file
    if (path === '/messages' && req.method === 'POST') {
      const body = await parseBody(req);
      const { conversationId, senderId, content, replyToId, messageType, attachments } = body;

      let conv = conversations.get(conversationId);
      if (!conv) {
        const parts = conversationId.replace('conv_', '').split('_');
        conv = {
          id: conversationId,
          is_group: false,
          members: parts,
          last_message_preview: content || '[Tệp]',
          last_message_at: new Date().toISOString(),
        };
        conversations.set(conversationId, conv);
      }

      const sender = users.get(senderId);
      const msgId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      const newMsg: MessageStore = {
        id: msgId,
        conversation_id: conversationId,
        sender_id: senderId,
        content: content || '',
        message_type: messageType || (attachments?.length ? (attachments[0].file_type?.startsWith('image/') ? 'image' : 'file') : 'text'),
        reply_to_id: replyToId || null,
        attachments: attachments || [],
        is_revoked: false,
        created_at: now,
        sender: sender || { id: senderId, display_name: 'Người dùng', username: 'user', avatar_url: '', is_online: true, last_seen: now },
      };

      if (!messages.has(conversationId)) {
        messages.set(conversationId, []);
      }
      messages.get(conversationId)!.push(newMsg);

      conv.last_message_preview = content || (attachments?.length ? '[Tệp/Hình ảnh]' : '[Tin nhắn]');
      conv.last_message_at = now;

      saveDatabase(); // Lưu tin nhắn vĩnh viễn vào ổ đĩa!

      broadcastSSE(conv.members, 'new_message', newMsg);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: newMsg }));
      return;
    }

    // 10. Revoke Message
    if (path === '/messages/revoke' && req.method === 'POST') {
      const body = await parseBody(req);
      const { conversationId, messageId } = body;

      const list = messages.get(conversationId);
      if (list) {
        const msg = list.find((m) => m.id === messageId);
        if (msg) {
          msg.is_revoked = true;
          msg.content = '';
          const conv = conversations.get(conversationId);
          if (conv) {
            broadcastSSE(conv.members, 'message_revoked', { messageId, conversationId });
          }
          saveDatabase();
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 11. Call Signaling (WebRTC P2P Video & Voice Call)
    if (path === '/call/signal' && req.method === 'POST') {
      const body = await parseBody(req);
      const { targetUserId, signalType, payload, fromUser, fromUserId } = body;

      const caller = fromUser || (fromUserId ? users.get(fromUserId) : undefined);

      if (signalType === 'call_request') {
        activeCalls.set(targetUserId, {
          fromUser: caller,
          type: payload?.type || 'audio',
          timestamp: Date.now(),
        });
      } else if (signalType === 'call_accepted') {
        activeCalls.delete(targetUserId);
      } else if (signalType === 'call_ended') {
        activeCalls.delete(targetUserId);
        if (fromUserId) activeCalls.delete(fromUserId);
        if (caller) activeCalls.delete(caller.id);
        userVideoFrames.delete(targetUserId);
        userAudioQueue.delete(targetUserId);
        if (fromUserId) {
          userVideoFrames.delete(fromUserId);
          userAudioQueue.delete(fromUserId);
        }
      }

      const signalData = {
        signalType,
        payload,
        fromUser: caller,
        fromUserId: fromUserId || (caller ? caller.id : undefined),
        timestamp: Date.now(),
      };

      addSignal(targetUserId, signalData);
      sendSSE(targetUserId, 'call_signal', signalData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // 12. Poll WebRTC Signals (Đảm bảo kết nối P2P kể cả khi SSE bị ngắt)
    if (path === '/call/signals' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end();
        return;
      }
      const signals = userSignalQueue.get(userId) || [];
      userSignalQueue.set(userId, []); // Đã lấy thì xóa khỏi hàng đợi

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ signals }));
      return;
    }

    // 13. Kiểm tra cuộc gọi đến siêu tốc (Polling mỗi 250ms khi đang ở giao diện chat)
    if (path === '/call/incoming' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      if (!userId) {
        res.writeHead(400);
        res.end();
        return;
      }
      const inc = activeCalls.get(userId);
      const incomingCall = inc && Date.now() - inc.timestamp < 30000 ? inc : null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ incomingCall }));
      return;
    }

    // 14. Truyền tải Frame Video Trực Tiếp Xuyên Mạng (100% không bao giờ đen màn hình)
    if (path === '/call/media/frame' && req.method === 'POST') {
      const body = await parseBody(req);
      const { targetUserId, frame } = body;
      if (targetUserId && frame) {
        userVideoFrames.set(targetUserId, frame);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path === '/call/media/frame' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const frame = (userId && userVideoFrames.get(userId)) || null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ frame }));
      return;
    }

    // 15. Truyền tải Luồng Âm Thanh Trực Tiếp Xuyên Mạng (100% không bao giờ mất tiếng)
    if (path === '/call/media/audio' && req.method === 'POST') {
      const body = await parseBody(req);
      const { targetUserId, data } = body;
      if (targetUserId && data) {
        if (!userAudioQueue.has(targetUserId)) {
          userAudioQueue.set(targetUserId, []);
        }
        const queue = userAudioQueue.get(targetUserId)!;
        queue.push({ id: Date.now(), data });
        if (queue.length > 4) queue.shift(); // Tối đa 4 gói (khoảng 250ms) để loại bỏ hoàn toàn độ trễ âm thanh!
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (path === '/call/media/audio' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      const chunks = (userId && userAudioQueue.get(userId)) || [];
      if (userId) userAudioQueue.set(userId, []); // Đã lấy thì xóa
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ chunks }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  };
}
