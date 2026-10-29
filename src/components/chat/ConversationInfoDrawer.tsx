import React, { useState } from 'react';
import {
  X,
  Bell,
  BellOff,
  Pin,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Download,
  CheckCircle2,
  Trash2,
  Search,
} from 'lucide-react';
import { Conversation, Message, Profile } from '../../types/database';
import { format } from 'date-fns';

interface ConversationInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  messages: Message[];
  onOpenProfile: (user: Profile) => void;
  onCreateGroup?: () => void;
  onViewImage: (url: string) => void;
}

export const ConversationInfoDrawer: React.FC<ConversationInfoDrawerProps> = ({
  isOpen,
  onClose,
  conversation,
  messages,
  onOpenProfile,
  onCreateGroup,
  onViewImage,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(true);
  const [isFileOpen, setIsFileOpen] = useState(true);
  const [showAllMedia, setShowAllMedia] = useState(false);

  if (!isOpen) return null;

  const otherUser = conversation.other_user;
  const displayName = conversation.is_group
    ? conversation.name || 'Nhóm trò chuyện'
    : otherUser?.display_name || 'Người dùng';
  const avatarUrl = conversation.is_group
    ? conversation.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation.id}`
    : otherUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${otherUser?.username || 'user'}`;

  // Thu thập toàn bộ hình ảnh và tài liệu đã gửi trong cuộc hội thoại này
  const allMediaAttachments: Array<{ url: string; name: string; date: string }> = [];
  const allFileAttachments: Array<{ url: string; name: string; size: number; date: string; ext: string }> = [];

  messages.forEach((m) => {
    if (m.attachments && m.attachments.length > 0) {
      m.attachments.forEach((att) => {
        const isImage = att.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.file_name);
        const isAudio = att.file_type?.startsWith('audio/') || /\.(webm|mp3|wav|ogg)$/i.test(att.file_name);
        
        if (isImage) {
          allMediaAttachments.push({
            url: att.file_url,
            name: att.file_name,
            date: m.created_at,
          });
        } else if (!isAudio) {
          const ext = att.file_name.split('.').pop()?.toLowerCase() || '';
          allFileAttachments.push({
            url: att.file_url,
            name: att.file_name,
            size: att.file_size,
            date: m.created_at,
            ext,
          });
        }
      });
    }
  });

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = (ext: string) => {
    if (['doc', 'docx'].includes(ext)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
          W
        </div>
      );
    }
    if (['xls', 'xlsx'].includes(ext)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
          X
        </div>
      );
    }
    if (['pdf'].includes(ext)) {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
          PDF
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
        <FileText className="w-5 h-5" />
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-left">
      
      {/* 1. Header Bar */}
      <div className="h-16 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">Thông tin hội thoại</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
        
        {/* Profile Avatar & Name (Nhấp vào xem thông tin cá nhân Zalo) */}
        <div className="p-6 flex flex-col items-center text-center">
          <div
            onClick={() => otherUser && onOpenProfile(otherUser)}
            className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-md cursor-pointer hover:opacity-90 transition-transform hover:scale-105"
            title="Nhấp để xem hồ sơ"
          >
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>

          <h4
            onClick={() => otherUser && onOpenProfile(otherUser)}
            className="text-base font-bold text-slate-900 dark:text-white mt-3 cursor-pointer hover:text-blue-600 transition-colors"
          >
            {displayName}
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {conversation.is_group ? `${conversation.members?.length || 2} thành viên` : 'Bạn bè'}
          </p>

          {/* 3 Nút tròn chức năng chuẩn Zalo (Hình 3) */}
          <div className="flex items-center justify-center gap-6 mt-6 w-full">
            {/* Tắt thông báo */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isMuted
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
                title="Tắt thông báo"
              >
                {isMuted ? <BellOff className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </button>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {isMuted ? 'Bật báo' : 'Tắt thông báo'}
              </span>
            </div>

            {/* Ghim hội thoại */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  isPinned
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
                title="Ghim hội thoại"
              >
                <Pin className={`w-5 h-5 ${isPinned ? 'rotate-45' : ''}`} />
              </button>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                {isPinned ? 'Bỏ ghim' : 'Ghim hội thoại'}
              </span>
            </div>

            {/* Tạo nhóm trò chuyện */}
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => {
                  onClose();
                  onCreateGroup?.();
                }}
                className="w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all"
                title="Tạo nhóm trò chuyện"
              >
                <Users className="w-5 h-5" />
              </button>
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Tạo nhóm
              </span>
            </div>
          </div>
        </div>

        {/* Danh sách nhắc hẹn & Nhóm chung chuẩn Zalo (Hình 3) */}
        <div className="py-2">
          <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
              Danh sách nhắc hẹn
            </span>
          </div>

          <div className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors">
            <Users className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
              {conversation.is_group ? `${conversation.members?.length || 2} thành viên` : '1 nhóm chung'}
            </span>
          </div>
        </div>

        {/* Mục Ảnh/Video chuẩn Zalo (Hình 3) */}
        <div className="p-4">
          <div
            onClick={() => setIsMediaOpen(!isMediaOpen)}
            className="flex items-center justify-between cursor-pointer py-1 select-none"
          >
            <h5 className="font-bold text-sm text-slate-900 dark:text-white">Ảnh/Video</h5>
            {isMediaOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {isMediaOpen && (
            <div className="mt-3">
              {allMediaAttachments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa có ảnh hoặc video nào</p>
              ) : (
                <>
                  {/* Grid 4 cột giống hình 3 */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {(showAllMedia ? allMediaAttachments : allMediaAttachments.slice(0, 8)).map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => onViewImage(item.url)}
                        className="aspect-square rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>

                  {allMediaAttachments.length > 8 && (
                    <button
                      onClick={() => setShowAllMedia(!showAllMedia)}
                      className="w-full mt-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                    >
                      {showAllMedia ? 'Thu gọn' : 'Xem tất cả'}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Mục File chuẩn Zalo (Hình 3) */}
        <div className="p-4">
          <div
            onClick={() => setIsFileOpen(!isFileOpen)}
            className="flex items-center justify-between cursor-pointer py-1 select-none"
          >
            <h5 className="font-bold text-sm text-slate-900 dark:text-white">File</h5>
            {isFileOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {isFileOpen && (
            <div className="mt-3 space-y-2">
              {allFileAttachments.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Chưa có tệp tin nào</p>
              ) : (
                allFileAttachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
                  >
                    {getFileIcon(file.ext)}

                    <div className="flex-1 min-w-0">
                      <h6 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </h6>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatFileSize(file.size)}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block mb-1">
                        {file.date ? format(new Date(file.date), 'dd/MM/yyyy') : ''}
                      </span>
                      <a
                        href={file.url}
                        download={file.name}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors inline-block"
                        title="Tải về"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
