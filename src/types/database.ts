export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'call' | 'system';
export type MemberRole = 'owner' | 'admin' | 'member';
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';
export type CallStatus = 'ringing' | 'connected' | 'ended' | 'rejected' | 'busy' | 'missed';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  status_message?: string | null;
  is_online?: boolean;
  last_seen?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  name?: string | null;
  avatar_url?: string | null;
  is_group: boolean;
  created_by?: string | null;
  last_message_preview?: string | null;
  last_message_at?: string;
  created_at?: string;
  updated_at?: string;
  members?: ConversationMember[];
  unread_count?: number;
  other_user?: Profile; // Dùng cho chat 1-1
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  nickname?: string | null;
  last_read_at?: string;
  joined_at?: string;
  profile?: Profile;
}

export interface MessageAttachment {
  id: string;
  message_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  reply_to_id?: string | null;
  reply_message?: Message | null;
  is_revoked: boolean;
  created_at: string;
  updated_at?: string;
  sender?: Profile;
  attachments?: MessageAttachment[];
  is_sending?: boolean; // Optimistic update
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendRequestStatus;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Friendship {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  friend?: Profile;
}

export interface CallSession {
  id: string;
  conversation_id: string;
  caller_id: string;
  receiver_id?: string | null;
  call_type: 'audio' | 'video';
  status: CallStatus;
  sdp_offer?: any;
  sdp_answer?: any;
  caller_candidates?: any[];
  receiver_candidates?: any[];
  created_at: string;
  ended_at?: string | null;
  caller?: Profile;
}

export interface AIMessage {
  id: string;
  ai_conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  is_streaming?: boolean;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at?: string;
  messages?: AIMessage[];
}
