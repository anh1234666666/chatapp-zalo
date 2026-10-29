import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, 
  Video, 
  Info, 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  Smile, 
  X,
  Mic,
  Square,
  Trash2,
  Check
} from 'lucide-react';
import { Conversation, Message, Profile } from '../../types/database';
import { MessageItem } from './MessageItem';
import { ConversationInfoDrawer } from './ConversationInfoDrawer';
import { UserProfileModal } from './UserProfileModal';
import { format, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatAreaProps {
  conversation: Conversation;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, replyToId?: string | null, attachments?: File[]) => Promise<void>;
  onRevokeMessage: (msgId: string) => Promise<void>;
  onStartCall: (type: 'audio' | 'video') => void;
  isOtherTyping?: boolean;
  onTyping?: () => void;
  isOnline?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onRevokeMessage,
  onStartCall,
  isOtherTyping = false,
  onTyping,
  isOnline = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [replyMessage, setReplyMessage] = useState<Message | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [profileUser, setProfileUser] = useState<Profile | null>(null);

  // Trạng thái ghi âm giọng nói chuẩn Zalo
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);

  const commonEmojis = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🙏', '👏', '😍', '😎', '🤝', '🚀'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  // Dọn dẹp stream ghi âm khi component unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && selectedFiles.length === 0) return;

    const content = inputText.trim();
    const replyId = replyMessage ? replyMessage.id : null;
    const files = [...selectedFiles];

    setInputText('');
    setReplyMessage(null);
    setSelectedFiles([]);
    setShowEmojiPicker(false);

    await onSendMessage(content, replyId, files);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // ========== TÍNH NĂNG GHI ÂM GIỌNG NÓI (ZALO STYLE) ==========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      // Chọn mimeType hỗ trợ trên cả Android/PC/iOS Safari
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Không thể mở micro để ghi âm:', err);
      alert('Vui lòng cấp quyền Microphone trên trình duyệt để ghi âm giọng nói.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((t) => t.stop());
      recordingStreamRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const duration = recordingSeconds;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current?.mimeType || 'audio/webm',
        });

        if (recordingStreamRef.current) {
          recordingStreamRef.current.getTracks().forEach((t) => t.stop());
          recordingStreamRef.current = null;
        }

        const ext = mediaRecorderRef.current?.mimeType?.includes('mp4') ? 'mp4' : 'webm';
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${ext}`, {
          type: audioBlob.type || 'audio/webm',
        });

        const m = Math.floor(duration / 60);
        const s = (duration % 60).toString().padStart(2, '0');
        await onSendMessage(`🎤 Tin nhắn thoại (${m}:${s})`, null, [audioFile]);

        setIsRecording(false);
        setRecordingSeconds(0);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.stop();
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const displayName = conversation.is_group
    ? conversation.name || 'Nhóm trò chuyện'
    : conversation.other_user?.display_name || 'Người dùng';

  const avatarUrl = conversation.is_group
    ? conversation.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.id}`
    : conversation.other_user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${conversation.other_user?.username || 'user'}`;

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 dark:bg-slate-900/60 overflow-hidden relative w-full">
      
      {/* 1. Header Bar: Trên Mobile chừa pl-14 để không bị nút Back đè lên */}
      <div className="h-16 pl-14 pr-3 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-10 w-full">
        <div
          onClick={() => {
            if (!conversation.is_group && conversation.other_user) {
              setProfileUser(conversation.other_user);
            }
          }}
          className={`flex items-center gap-2 sm:gap-3 min-w-0 ${
            !conversation.is_group ? 'cursor-pointer group' : ''
          }`}
          title={!conversation.is_group ? 'Xem thông tin cá nhân Zalo' : ''}
        >
          <div className="relative shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 group-hover:ring-2 group-hover:ring-blue-500 transition-all">
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            </div>
            {!conversation.is_group && isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
              {displayName}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              {conversation.is_group
                ? `${conversation.members?.length || 2} thành viên`
                : isOnline
                ? 'Đang trực tuyến'
                : 'Hoạt động gần đây'}
            </p>
          </div>
        </div>

        {/* Action Call Buttons: Gọi thoại & Gọi video */}
        <div className="flex items-center gap-1 shrink-0">
          {!conversation.is_group && (
            <>
              <button
                onClick={() => onStartCall('audio')}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Gọi thoại HD"
              >
                <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </button>
              <button
                onClick={() => onStartCall('video')}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Gọi video HD trực tiếp"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </button>
            </>
          )}
          <button
            onClick={() => setShowInfoDrawer(!showInfoDrawer)}
            className={`p-2 rounded-xl transition-colors ${
              showInfoDrawer
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Thông tin cuộc trò chuyện (Zalo)"
          >
            <Info className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 mb-3">
              <Smile className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-1">Bắt đầu trò chuyện</h4>
            <p className="text-xs max-w-xs">
              Hãy gửi tin nhắn hoặc ghi âm giọng nói đầu tiên để kết nối cùng {displayName}.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1];
            const showDateDivider =
              !prevMsg || !isSameDay(new Date(msg.created_at), new Date(prevMsg.created_at));

            return (
              <React.Fragment key={msg.id}>
                {showDateDivider && (
                  <div className="flex items-center justify-center my-3">
                    <span className="px-3 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[10px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                      {format(new Date(msg.created_at), 'EEEE, dd/MM/yyyy', { locale: vi })}
                    </span>
                  </div>
                )}
                <MessageItem
                  message={msg}
                  currentUserId={currentUserId}
                  isGroup={conversation.is_group}
                  onReply={(m) => setReplyMessage(m)}
                  onRevoke={onRevokeMessage}
                  onViewImage={(url) => setLightboxImage(url)}
                  onStartCall={onStartCall}
                />
              </React.Fragment>
            );
          })
        )}

        {isOtherTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 pl-2 animate-fade-in">
            <span className="flex gap-1 items-center bg-slate-200 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]" />
            </span>
            <span>{displayName} đang nhập...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Toolbar */}
      <div className="p-2 sm:p-4 pb-3 sm:pb-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 w-full" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        
        {/* Reply preview */}
        {replyMessage && (
          <div className="mb-2 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-2 truncate">
              <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                Trả lời {replyMessage.sender?.display_name}:
              </span>
              <span className="text-slate-600 dark:text-slate-300 truncate">
                {replyMessage.content}
              </span>
            </div>
            <button
              onClick={() => setReplyMessage(null)}
              className="p-1 hover:bg-blue-100 rounded-md text-slate-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5 animate-fade-in">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* NẾU ĐANG GHI ÂM: Hiển thị thanh ghi âm Zalo */}
        {isRecording ? (
          <div className="flex items-center justify-between p-2 px-3 sm:px-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-red-600 dark:text-red-400">
                <Mic className="w-4 h-4" />
                <span>Đang ghi âm: {formatTimer(recordingSeconds)}</span>
              </div>
              {/* Animation sóng âm */}
              <div className="hidden sm:flex items-center gap-1">
                {[12, 24, 16, 28, 14, 26, 18, 30].map((h, i) => (
                  <span
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{ height: `${h}px`, animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nút hủy */}
              <button
                type="button"
                onClick={cancelRecording}
                className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-100 text-slate-700 dark:text-slate-200 hover:text-red-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Hủy ghi âm"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Hủy</span>
              </button>

              {/* Nút gửi ghi âm */}
              <button
                type="button"
                onClick={stopAndSendRecording}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all flex items-center gap-1 text-xs font-bold shadow-md animate-bounce"
                title="Gửi tin nhắn thoại"
              >
                <Send className="w-4 h-4" />
                <span>Gửi</span>
              </button>
            </div>
          </div>
        ) : (
          /* NẾU KHÔNG GHI ÂM: Thanh nhập tin nhắn thông thường */
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            <div className="flex items-center">
              {/* Gửi ảnh */}
              <input
                type="file"
                ref={imageInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Gửi hình ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Đính kèm file */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                title="Đính kèm tệp"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Ghi âm giọng nói (Zalo style) */}
              <button
                type="button"
                onClick={startRecording}
                className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                title="Ghi âm giọng nói gửi qua"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Emoji Picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-amber-500 rounded-lg transition-colors"
                  title="Biểu cảm"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-11 left-0 p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl flex gap-1 z-30">
                    {commonEmojis.slice(0, 8).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-base p-1 hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ô nhập tin nhắn */}
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (onTyping) onTyping();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Nút gửi */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() && selectedFiles.length === 0}
              className="p-2 sm:p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all shrink-0 shadow-sm"
              title="Gửi"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

          </div>
        )}

      </div>

      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      {/* Zalo-style Conversation Info Drawer (Chữ "i") */}
      <ConversationInfoDrawer
        isOpen={showInfoDrawer}
        onClose={() => setShowInfoDrawer(false)}
        conversation={conversation}
        messages={messages}
        onOpenProfile={(u) => setProfileUser(u)}
        onViewImage={(url) => setLightboxImage(url)}
      />

      {/* Zalo-style User Profile Modal */}
      <UserProfileModal
        isOpen={Boolean(profileUser)}
        onClose={() => setProfileUser(null)}
        user={profileUser}
        onStartCall={onStartCall}
        onSendMessage={() => {
          setProfileUser(null);
        }}
      />

    </div>
  );
};