import React, { useState } from 'react';
import { Search, UserPlus, Users, Pin, CheckCheck, Clock } from 'lucide-react';
import { Conversation } from '../../types/database';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onOpenAddFriend: () => void;
  onCreateGroup: () => void;
  onlineUserIds?: Set<string>;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onOpenAddFriend,
  onCreateGroup,
  onlineUserIds = new Set(),
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');

  const filtered = conversations.filter((conv) => {
    const nameMatch = (conv.name || conv.other_user?.display_name || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    if (filterType === 'unread') {
      return nameMatch && (conv.unread_count || 0) > 0;
    }
    return nameMatch;
  });

  const formatMessageTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isToday(d)) {
        return format(d, 'HH:mm');
      }
      if (isYesterday(d)) {
        return 'Hôm qua';
      }
      return format(d, 'dd/MM');
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 md:w-88 h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 select-none">
      
      {/* Top Search & Action Buttons */}
      <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm cuộc trò chuyện..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Add Friend Trigger */}
          <button
            onClick={onOpenAddFriend}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Thêm bạn bè mới"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Create Group Trigger */}
          <button
            onClick={onCreateGroup}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tạo nhóm chat"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Filters: Tất cả / Chưa đọc */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
          <button
            onClick={() => setFilterType('all')}
            className={`pb-1 border-b-2 transition-all ${
              filterType === 'all'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`pb-1 border-b-2 transition-all flex items-center gap-1.5 ${
              filterType === 'unread'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Chưa đọc</span>
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs sm:text-sm">
            Không tìm thấy cuộc trò chuyện nào. Hãy kết bạn hoặc tạo nhóm để bắt đầu!
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const displayName = conv.is_group
              ? conv.name || 'Nhóm không tên'
              : conv.other_user?.display_name || 'Người dùng';
            
            const avatarUrl = conv.is_group
              ? conv.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.id}`
              : conv.other_user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${conv.other_user?.username || 'user'}`;

            const isOnline = !conv.is_group && conv.other_user?.id && onlineUserIds.has(conv.other_user.id);

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`flex items-center gap-3 p-3 sm:p-3.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-[#e5efff] dark:bg-blue-950/40 text-slate-900 dark:text-white'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                }`}
              >
                {/* Avatar with Online Dot */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                      {displayName}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                      {formatMessageTime(conv.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {conv.last_message_preview || 'Bắt đầu cuộc trò chuyện...'}
                    </p>
                    {(conv.unread_count || 0) > 0 && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] text-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
