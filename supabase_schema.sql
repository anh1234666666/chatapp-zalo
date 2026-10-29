-- ====================================================================
-- CHAT APP - SUPABASE DATABASE SCHEMA & POLICIES (POSTGRESQL)
-- Chuẩn kiến trúc: Realtime + RLS + Triggers + WebRTC Signaling + AI
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'file', 'call', 'system');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE member_role_enum AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE friend_request_status_enum AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE call_status_enum AS ENUM ('ringing', 'connected', 'ended', 'rejected', 'busy', 'missed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES TABLE (Gắn kết với auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    status_message TEXT DEFAULT 'Đang sử dụng Chat App',
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho tìm kiếm người dùng
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON public.profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 4. CONVERSATIONS TABLE
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    avatar_url TEXT,
    is_group BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);

-- 5. CONVERSATION MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.conversation_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role member_role_enum DEFAULT 'member',
    nickname TEXT,
    last_read_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_members_conv ON public.conversation_members(conversation_id);

-- 6. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    message_type message_type_enum DEFAULT 'text',
    reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conv_created ON public.messages(conversation_id, created_at ASC);

-- 7. MESSAGE ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_msg ON public.message_attachments(message_id);

-- 8. FRIENDSHIPS & FRIEND REQUESTS
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user1_id, user2_id),
    CHECK (user1_id < user2_id) -- Tránh trùng lặp (A, B) và (B, A)
);

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status friend_request_status_enum DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id, status);

-- 9. BLOCKED USERS
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id)
);

-- 10. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- 11. WEBRTC CALL SESSIONS
CREATE TABLE IF NOT EXISTS public.call_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
    status call_status_enum DEFAULT 'ringing',
    sdp_offer JSONB,
    sdp_answer JSONB,
    caller_candidates JSONB DEFAULT '[]'::jsonb,
    receiver_candidates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ
);

-- 12. AI CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'Cuộc trò chuyện mới',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ai_conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv ON public.ai_messages(ai_conversation_id, created_at ASC);

-- ====================================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================================

-- Trigger tạo Profile tự động khi người dùng đăng ký qua auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    clean_username TEXT;
BEGIN
    clean_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 4)
    );

    INSERT INTO public.profiles (id, username, display_name, avatar_url)
    VALUES (
        NEW.id,
        clean_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', clean_username),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || clean_username)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger cập nhật last_message_at và preview cho conversation khi có tin nhắn mới
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = CASE 
            WHEN NEW.is_revoked THEN 'Tin nhắn đã được thu hồi'
            WHEN NEW.message_type = 'image' THEN '[Hình ảnh]'
            WHEN NEW.message_type = 'file' THEN '[Tập tin]'
            WHEN NEW.message_type = 'call' THEN '[Cuộc gọi]'
            ELSE SUBSTRING(NEW.content, 1, 60)
        END,
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON public.messages;
CREATE TRIGGER on_message_created
    AFTER INSERT OR UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_message();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Bất kỳ ai đăng nhập đều có thể đọc profile công khai, chỉ chỉnh sửa profile của chính mình
CREATE POLICY "Profiles are viewable by authenticated users" 
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Conversations: Chỉ thành viên của hội thoại mới được xem
CREATE POLICY "Users can view conversations they belong to"
ON public.conversations FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = conversations.id
        AND conversation_members.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group admin/owner can update conversations"
ON public.conversations FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = conversations.id
        AND conversation_members.user_id = auth.uid()
        AND conversation_members.role IN ('owner', 'admin')
    )
);

-- Conversation Members: Chỉ thành viên xem được danh sách thành viên của hội thoại
CREATE POLICY "Members can view conversation membership"
ON public.conversation_members FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = conversation_members.conversation_id
        AND cm.user_id = auth.uid()
    )
);

CREATE POLICY "Users can join or be added to conversations"
ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Members can update their own member details"
ON public.conversation_members FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Members can leave or admins can remove"
ON public.conversation_members FOR DELETE TO authenticated
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.conversation_members admin_cm
        WHERE admin_cm.conversation_id = conversation_members.conversation_id
        AND admin_cm.user_id = auth.uid()
        AND admin_cm.role IN ('owner', 'admin')
    )
);

-- Messages: Chỉ thành viên hội thoại mới xem & gửi tin nhắn
CREATE POLICY "Members can view messages"
ON public.messages FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
);

CREATE POLICY "Members can insert messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_members
        WHERE conversation_members.conversation_id = messages.conversation_id
        AND conversation_members.user_id = auth.uid()
    )
);

CREATE POLICY "Senders can revoke their own messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = sender_id);

-- Message Attachments: Xem theo quyền của Message
CREATE POLICY "View attachments if can view message"
ON public.message_attachments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.messages
        JOIN public.conversation_members ON messages.conversation_id = conversation_members.conversation_id
        WHERE messages.id = message_attachments.message_id
        AND conversation_members.user_id = auth.uid()
    )
);

CREATE POLICY "Insert attachments"
ON public.message_attachments FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.messages
        WHERE messages.id = message_attachments.message_id
        AND messages.sender_id = auth.uid()
    )
);

-- Friendships: Chỉ 2 người trong mối quan hệ mới xem và quản lý
CREATE POLICY "Users can view their friendships"
ON public.friendships FOR SELECT TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can manage their friendships"
ON public.friendships FOR ALL TO authenticated
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Friend Requests:
CREATE POLICY "Users can view sent or received friend requests"
ON public.friend_requests FOR SELECT TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received friend requests"
ON public.friend_requests FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete friend requests"
ON public.friend_requests FOR DELETE TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Notifications: Chỉ chủ sở hữu xem & đánh dấu đã đọc
CREATE POLICY "Users manage own notifications"
ON public.notifications FOR ALL TO authenticated
USING (auth.uid() = user_id);

-- Call Sessions:
CREATE POLICY "Users can view and participate in their calls"
ON public.call_sessions FOR ALL TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- AI Conversations & Messages: Riêng tư 100% cho từng người dùng
CREATE POLICY "Users manage own AI conversations"
ON public.ai_conversations FOR ALL TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users manage own AI messages"
ON public.ai_messages FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.ai_conversations
        WHERE ai_conversations.id = ai_messages.ai_conversation_id
        AND ai_conversations.user_id = auth.uid()
    )
);

-- ====================================================================
-- REALTIME REPLICATION ENABLEMENT
-- ====================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- ====================================================================
-- STORAGE BUCKETS (avatars, attachments)
-- ====================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-attachments', 'chat-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Policy cho Storage avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'avatars');

-- Policy cho Storage chat-attachments
CREATE POLICY "Chat attachments are accessible to authenticated users" 
ON storage.objects FOR SELECT TO authenticated 
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can upload chat attachments" 
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'chat-attachments');
