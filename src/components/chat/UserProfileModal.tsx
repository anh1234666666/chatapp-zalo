import React from 'react';
import { X, MessageSquare, Phone, Video, ShieldCheck, Calendar, PhoneCall } from 'lucide-react';
import { Profile } from '../../types/database';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile | null;
  onStartCall?: (type: 'audio' | 'video') => void;
  onSendMessage?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onStartCall,
  onSendMessage,
}) => {
  if (!isOpen || !user) return null;

  const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username || 'user'}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-in">
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Cover Photo / Banner Zalo Style */}
        <div className="relative h-36 sm:h-44 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        </div>

        {/* 2. Avatar & Thông tin chính */}
        <div className="relative px-6 pt-0 pb-6 text-center">
          {/* Avatar nổi */}
          <div className="relative -mt-16 sm:-mt-20 inline-block">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl bg-slate-200 dark:bg-slate-800">
              <img
                src={avatarUrl}
                alt={user.display_name}
                className="w-full h-full object-cover"
              />
            </div>
            {user.is_online && (
              <span className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-3 border-white dark:border-slate-900 rounded-full shadow" />
            )}
          </div>

          {/* Tên hiển thị */}
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2 flex items-center justify-center gap-1.5">
            <span>{user.display_name}</span>
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">@{user.username}</p>

          {/* Status Message */}
          <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-2.5 max-w-xs mx-auto bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
            "{user.status_message || 'Xin chào, mình đang sử dụng Chat App!'}"
          </p>

          {/* 3. Action Buttons (Nhắn tin, Gọi thoại, Gọi video) */}
          <div className="flex items-center justify-center gap-3 mt-5">
            {onSendMessage && (
              <button
                onClick={() => {
                  onSendMessage();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Nhắn tin</span>
              </button>
            )}

            {onStartCall && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onStartCall('audio');
                  }}
                  className="p-2.5 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
                  title="Gọi thoại"
                >
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">Gọi thoại</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onStartCall('video');
                  }}
                  className="p-2.5 sm:px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
                  title="Gọi video"
                >
                  <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Gọi video</span>
                </button>
              </>
            )}
          </div>

          {/* 4. Thông tin chi tiết */}
          <div className="mt-6 text-left border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Thông tin cá nhân</h4>
            
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 dark:text-slate-400">Số điện thoại</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.phone ? user.phone : 'Chưa cập nhật'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 dark:text-slate-400">Tên người dùng</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">@{user.username}</span>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-slate-500 dark:text-slate-400">Trạng thái</span>
              <span className="font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className={`w-2 h-2 rounded-full ${user.is_online ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                <span>{user.is_online ? 'Đang hoạt động' : 'Hoạt động gần đây'}</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
