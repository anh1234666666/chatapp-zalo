import React, { useState, useRef } from 'react';
import { Message, Profile } from '../../types/database';
import { format } from 'date-fns';
import { CheckCheck, FileText, Download, Reply, Undo2, Play, Pause, Mic, PhoneCall, PhoneOff, Video } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  isGroup: boolean;
  onReply: (msg: Message) => void;
  onRevoke: (msgId: string) => void;
  onViewImage: (url: string) => void;
  onStartCall?: (type: 'audio' | 'video') => void;
}

// Trình phát tin nhắn thoại ghi âm chuẩn Zalo
const VoiceMessagePlayer: React.FC<{ url: string; isSelf: boolean; fileName?: string }> = ({ url, isSelf }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const formatSec = (s: number) => {
    if (isNaN(s) || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-2.5 p-2 rounded-xl min-w-[210px] sm:min-w-[240px] max-w-[280px] ${
      isSelf ? 'bg-blue-700/60 text-white' : 'bg-slate-100 dark:bg-slate-700/60 text-slate-900 dark:text-white'
    }`}>
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-90 ${
          isSelf ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
        }`}
        title={isPlaying ? 'Tạm dừng' : 'Phát ghi âm'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        {/* Thanh sóng âm thanh Zalo (Waveform) */}
        <div
          className="flex items-center gap-1 h-5 cursor-pointer py-1"
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            audioRef.current.currentTime = pos * duration;
          }}
        >
          {[40, 75, 45, 90, 60, 100, 50, 80, 65, 95, 40, 85, 55, 90].map((h, i) => {
            const barProgress = (i + 1) / 14;
            const currentProgress = duration > 0 ? currentTime / duration : 0;
            const isPlayed = barProgress <= currentProgress;
            return (
              <span
                key={i}
                className={`w-1 rounded-full transition-colors ${
                  isPlayed
                    ? isSelf ? 'bg-white' : 'bg-blue-600'
                    : isSelf ? 'bg-blue-300/60' : 'bg-slate-300 dark:bg-slate-500'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between items-center text-[10px] opacity-80 mt-0.5 font-medium">
          <span>{formatSec(currentTime)}</span>
          <span className="flex items-center gap-0.5">
            <Mic className="w-3 h-3" />
            <span>{duration > 0 ? formatSec(duration) : 'Thoại'}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  isGroup,
  onReply,
  onRevoke,
  onViewImage,
  onStartCall,
}) => {
  const isSelf = message.sender_id === currentUserId;
  const timeFormatted = message.created_at
    ? format(new Date(message.created_at), 'HH:mm')
    : '';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`group flex flex-col mb-3 ${isSelf ? 'items-end' : 'items-start'}`}>
      
      {/* Sender Name for Group Chats (when message is from other members) */}
      {!isSelf && isGroup && message.sender && (
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-10">
          {message.sender.display_name}
        </span>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[70%] ${isSelf ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar for other users */}
        {!isSelf && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 mb-1">
            <img
              src={message.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${message.sender?.username || 'user'}`}
              alt={message.sender?.display_name || 'Sender'}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Message Bubble Container */}
        <div className="relative group/bubble">
          
          {/* Action buttons on hover (Reply, Revoke) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-1 shadow-md z-10 ${
              isSelf ? '-left-20' : '-right-20'
            }`}
          >
            <button
              onClick={() => onReply(message)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-blue-600 transition-colors"
              title="Trả lời tin nhắn"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            {isSelf && !message.is_revoked && (
              <button
                onClick={() => onRevoke(message.id)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-red-600 transition-colors"
                title="Thu hồi tin nhắn"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bubble content */}
          <div
            className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
              message.is_revoked
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 italic rounded-xl border border-slate-200 dark:border-slate-700'
                : isSelf
                ? 'bg-blue-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            {/* Quoted Message Preview if replying */}
            {message.reply_message && (
              <div
                className={`mb-2 p-2 rounded-lg text-xs border-l-2 ${
                  isSelf
                    ? 'bg-blue-700/50 border-white/60 text-blue-100'
                    : 'bg-slate-100 dark:bg-slate-700/50 border-blue-500 text-slate-600 dark:text-slate-300'
                }`}
              >
                <div className="font-semibold text-[11px] mb-0.5">
                  {message.reply_message.sender?.display_name || 'Tin nhắn trả lời'}
                </div>
                <div className="line-clamp-1 opacity-90">
                  {message.reply_message.content}
                </div>
              </div>
            )}

            {/* Message Body */}
            {message.is_revoked ? (
              <p>Tin nhắn đã được thu hồi</p>
            ) : message.message_type === 'call' ? (
              /* Thẻ hiển thị thông tin cuộc gọi kết thúc chuẩn Zalo */
              <div className="flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[240px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    message.content.includes('nhỡ') || message.content.includes('hủy')
                      ? 'bg-red-500/20 text-red-500'
                      : isSelf
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600'
                  }`}
                >
                  {message.content.includes('video') ? (
                    <Video className="w-5 h-5" />
                  ) : message.content.includes('nhỡ') ? (
                    <PhoneOff className="w-5 h-5" />
                  ) : (
                    <PhoneCall className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs leading-snug">
                    {message.content}
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      isSelf ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {message.content.includes('nhỡ') ? 'Nhấn để gọi lại' : 'Cuộc gọi kết thúc'}
                  </div>
                </div>

                {onStartCall && (
                  <button
                    type="button"
                    onClick={() => onStartCall(message.content.includes('video') ? 'video' : 'audio')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-transform active:scale-95 shadow-xs ${
                      isSelf ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
                    }`}
                  >
                    Gọi lại
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Text Content */}
                {message.content && !message.content.startsWith('🎤 Tin nhắn thoại') && (
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                )}

                {/* Attachments (Hình ảnh, Tin nhắn thoại, File tài liệu) */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att) => {
                      const isImage = att.file_type.startsWith('image/');
                      const isAudio = att.file_type.startsWith('audio/') || att.file_name.endsWith('.webm') || att.file_name.endsWith('.mp3');

                      if (isAudio) {
                        return (
                          <VoiceMessagePlayer
                            key={att.id}
                            url={att.file_url}
                            isSelf={isSelf}
                            fileName={att.file_name}
                          />
                        );
                      }

                      return isImage ? (
                        <div
                          key={att.id}
                          onClick={() => onViewImage(att.file_url)}
                          className="cursor-pointer overflow-hidden rounded-xl border border-black/10 max-w-sm hover:opacity-95 transition-opacity"
                        >
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-full max-h-60 object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          key={att.id}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                            isSelf
                              ? 'bg-blue-700/60 border-blue-500 text-white'
                              : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">{att.file_name}</div>
                            <div className="text-[10px] opacity-75">{formatFileSize(att.file_size)}</div>
                          </div>
                          <a
                            href={att.file_url}
                            download={att.file_name}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-black/10 transition-colors"
                            title="Tải tệp tin về máy"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Time & Delivery Status */}
            <div
              className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                isSelf ? 'text-blue-100' : 'text-slate-400'
              }`}
            >
              <span>{timeFormatted}</span>
              {isSelf && !message.is_revoked && (
                <span>
                  {message.is_sending ? (
                    <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin inline-block" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-200" />
                  )}
                </span>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};