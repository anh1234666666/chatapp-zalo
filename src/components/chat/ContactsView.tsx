import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MessageSquare, 
  UserCheck, 
  Sparkles,
  Phone,
  UserCheck2,
  Clock
} from 'lucide-react';
import { Profile, FriendRequest } from '../../types/database';

interface ContactsViewProps {
  friends: Profile[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onOpenChatWith: (user: Profile) => void;
  onAcceptRequest: (requestId: string) => Promise<void>;
  onDeclineRequest: (requestId: string) => Promise<void>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onSendFriendRequest: (targetUsernameOrPhone: string) => Promise<{ error: any; accepted?: boolean; convId?: string }>;
  onUnfriend: (userId: string) => Promise<void>;
  currentUserId?: string;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  friends,
  receivedRequests,
  sentRequests,
  onOpenChatWith,
  onAcceptRequest,
  onDeclineRequest,
  onCancelRequest,
  onSendFriendRequest,
  onUnfriend,
  currentUserId,
}) => {
  const [subTab, setSubTab] = useState<'friends' | 'received' | 'sent' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [addFriendInput, setAddFriendInput] = useState('');
  const [addFriendStatus, setAddFriendStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh sách gợi ý người dùng trên hệ thống
  const [discoveredUsers, setDiscoveredUsers] = useState<Profile[]>([]);

  // Tải danh sách người dùng để gợi ý kết bạn nhanh 1-click
  const fetchDiscoveredUsers = async () => {
    try {
      const res = await fetch('/api/local/users/search');
      if (res.ok) {
        const data = await res.json();
        const list = (data.users || []).filter((u: Profile) => !currentUserId || u.id !== currentUserId);
        setDiscoveredUsers(list);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDiscoveredUsers();
    // Tự động poll danh sách người dùng mỗi 2.5s
    const timer = setInterval(fetchDiscoveredUsers, 2500);
    return () => clearInterval(timer);
  }, [friends, sentRequests, currentUserId]);

  const filteredFriends = friends.filter((f) =>
    f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.phone && f.phone.includes(searchQuery))
  );

  const handleAddFriend = async (target: string) => {
    if (!target.trim()) return;

    setIsSubmitting(true);
    setAddFriendStatus(null);

    const res = await onSendFriendRequest(target.trim());
    if (res.error) {
      setAddFriendStatus(res.error.message || 'Không thể gửi lời mời.');
    } else {
      if (res.accepted) {
        setAddFriendStatus('🎉 Hai bạn đã trở thành bạn bè thành công!');
      } else {
        setAddFriendStatus('✅ Đã gửi lời mời kết bạn thành công!');
      }
      setAddFriendInput('');
      fetchDiscoveredUsers();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 select-none overflow-hidden w-full">
      
      {/* 1. THANH ĐIỀU HƯỚNG TAB TRÊN MOBILE (chỉ hiện trên Mobile) */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 shrink-0 z-20">
        <div className="grid grid-cols-4 w-full gap-1">
          <button
            onClick={() => setSubTab('friends')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
              subTab === 'friends'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">Bạn bè ({friends.length})</span>
          </button>

          <button
            onClick={() => setSubTab('received')}
            className={`relative py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
              subTab === 'received'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-[10px]">Đã nhận</span>
            {receivedRequests.length > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {receivedRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('discover')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
              subTab === 'discover'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">Thêm bạn</span>
          </button>

          <button
            onClick={() => setSubTab('sent')}
            className={`py-2 px-1 text-center rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
              subTab === 'sent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="text-[10px]">Đã gửi ({sentRequests.length})</span>
          </button>
        </div>
      </div>

      {/* 2. CỘT SUBMENU BÊN TRÁI (chỉ hiện trên Desktop) */}
      <div className="hidden md:flex md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 flex-col justify-between overflow-y-auto max-h-screen">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Danh Bạ & Bạn Bè</span>
          </h3>

          {/* Tab Buttons Desktop */}
          <div className="space-y-1 text-xs sm:text-sm font-medium">
            <button
              onClick={() => setSubTab('friends')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                subTab === 'friends'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Bạn bè</span>
              </div>
              <span className="text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                {friends.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('received')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                subTab === 'received'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                <span>Lời mời đã nhận</span>
              </div>
              {receivedRequests.length > 0 && (
                <span className="text-[11px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full animate-bounce">
                  {receivedRequests.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubTab('sent')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                subTab === 'sent'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Lời mời đã gửi</span>
              </div>
              <span className="text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                {sentRequests.length}
              </span>
            </button>

            <button
              onClick={() => setSubTab('discover')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-colors ${
                subTab === 'discover'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Tìm & Thêm bạn</span>
              </div>
            </button>
          </div>

          {/* Hộp thoại Thêm Bạn Mới Desktop */}
          <div className="mt-6 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Tìm kiếm & Kết bạn</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
              Nhập Số điện thoại, Username (@nick) hoặc Tên hiển thị.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddFriend(addFriendInput);
              }}
              className="space-y-2"
            >
              <input
                type="text"
                value={addFriendInput}
                onChange={(e) => setAddFriendInput(e.target.value)}
                placeholder="Ví dụ: 0964... hoặc binh..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSubmitting || !addFriendInput.trim()}
                className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi lời mời kết bạn'}
              </button>
            </form>

            {addFriendStatus && (
              <div className="mt-2 text-[11px] p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {addFriendStatus}
              </div>
            )}
          </div>
        </div>

        {/* Gợi ý kết bạn 1-Click Desktop */}
        {discoveredUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Tài khoản trên hệ thống:</span>
            </h5>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {discoveredUsers.map((u) => {
                const isFriend = friends.some((f) => f.id === u.id);
                const isSent = sentRequests.some((r) => r.receiver_id === u.id);
                const hasReceived = receivedRequests.find((r) => r.sender_id === u.id);

                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 text-xs"
                  >
                    <div className="truncate min-w-0 pr-1">
                      <p className="font-semibold truncate text-slate-800 dark:text-slate-200">{u.display_name}</p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {u.phone ? `SĐT: ${u.phone}` : `@${u.username}`}
                      </p>
                    </div>

                    {isFriend ? (
                      <span className="text-[10px] text-emerald-600 font-bold shrink-0">Bạn bè</span>
                    ) : hasReceived ? (
                      <button
                        onClick={() => onAcceptRequest(hasReceived.id)}
                        className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 shrink-0"
                      >
                        Đồng ý
                      </button>
                    ) : isSent ? (
                      <span className="text-[10px] text-amber-600 font-bold shrink-0">Đã gửi</span>
                    ) : (
                      <button
                        onClick={() => handleAddFriend(u.username)}
                        className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 shrink-0"
                      >
                        + Kết bạn
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. KHU VỰC NỘI DUNG CHÍNH (Đồng đều cả Mobile và Desktop) */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-y-auto w-full">
        
        {/* SUBTAB 1: BẠN BÈ */}
        {subTab === 'friends' && (
          <div className="space-y-4 max-w-4xl w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Bạn Bè ({friends.length})</h3>
                <p className="text-xs text-slate-500">Danh sách những người bạn đã kết nối trên Chat App</p>
              </div>

              <div className="w-full sm:w-64 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm bạn theo tên/SĐT..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {filteredFriends.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-sm font-semibold">Chưa có bạn bè nào</p>
                <p className="text-xs mt-1">Hãy chuyển sang tab "Thêm bạn" để kết nối bạn bè ngay!</p>
                <button
                  onClick={() => setSubTab('discover')}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                >
                  Tìm & Thêm bạn ngay
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {filteredFriends.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative shrink-0">
                        <img
                          src={f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                          alt={f.display_name}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        {f.is_online && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {f.display_name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate">@{f.username}</p>
                        {f.phone && <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">SĐT: {f.phone}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                      <button
                        onClick={() => onOpenChatWith(f)}
                        className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Nhắn tin</span>
                      </button>
                      <button
                        onClick={() => onUnfriend(f.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Hủy kết bạn"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: LỜI MỜI ĐÃ NHẬN */}
        {subTab === 'received' && (
          <div className="space-y-4 max-w-2xl w-full">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Lời Mời Kết Bạn Đã Nhận ({receivedRequests.length})
              </h3>
              <p className="text-xs text-slate-500">Chấp nhận để bắt đầu trò chuyện và gọi video cùng nhau</p>
            </div>

            {receivedRequests.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm">Hiện bạn không có lời mời kết bạn nào đang chờ.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {receivedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.sender?.username || 'user'}`}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {req.sender?.display_name || 'Người dùng'}
                        </h4>
                        <p className="text-xs text-slate-400">@{req.sender?.username}</p>
                        {req.sender?.phone && <p className="text-[11px] text-blue-500">SĐT: {req.sender.phone}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onAcceptRequest(req.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Đồng ý</span>
                      </button>
                      <button
                        onClick={() => onDeclineRequest(req.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 3: TÌM & THÊM BẠN (Đặc biệt tối ưu trên Mobile) */}
        {subTab === 'discover' && (
          <div className="space-y-5 max-w-2xl w-full">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Tìm Kiếm & Kết Bạn</span>
              </h3>
              <p className="text-xs text-slate-500">Kết nối với bạn bè nhanh chóng bằng Số điện thoại hoặc Tên người dùng</p>
            </div>

            {/* Form tìm kiếm */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                Nhập Số điện thoại, Username (@nick) hoặc Tên:
              </label>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddFriend(addFriendInput);
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <input
                  type="text"
                  value={addFriendInput}
                  onChange={(e) => setAddFriendInput(e.target.value)}
                  placeholder="Ví dụ: 0964... hoặc anhnguyen hoặc Nguyễn Trường Anh..."
                  className="flex-1 px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !addFriendInput.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold disabled:opacity-50 transition-colors shadow-xs shrink-0"
                >
                  {isSubmitting ? 'Đang gửi...' : 'Gửi lời mời'}
                </button>
              </form>

              {addFriendStatus && (
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 text-xs border border-blue-200 dark:border-blue-900 animate-fade-in font-medium">
                  {addFriendStatus}
                </div>
              )}
            </div>

            {/* Danh sách người dùng gợi ý kết bạn nhanh 1-Click */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tất cả tài khoản trên hệ thống ({discoveredUsers.length}):
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {discoveredUsers.map((u) => {
                  const isFriend = friends.some((f) => f.id === u.id);
                  const isSent = sentRequests.some((r) => r.receiver_id === u.id);
                  const hasReceived = receivedRequests.find((r) => r.sender_id === u.id);

                  return (
                    <div
                      key={u.id}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                          alt="Avatar"
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                            {u.display_name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                          {u.phone && <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">SĐT: {u.phone}</p>}
                        </div>
                      </div>

                      {isFriend ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
                          Bạn bè
                        </span>
                      ) : hasReceived ? (
                        <button
                          onClick={() => onAcceptRequest(hasReceived.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shrink-0 shadow-xs"
                        >
                          Đồng ý
                        </button>
                      ) : isSent ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-xs font-bold shrink-0">
                          Đã gửi
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(u.username)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors"
                        >
                          + Kết bạn
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: LỜI MỜI ĐÃ GỬI */}
        {subTab === 'sent' && (
          <div className="space-y-4 max-w-2xl w-full">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Lời Mời Kết Bạn Đã Gửi ({sentRequests.length})
              </h3>
              <p className="text-xs text-slate-500">Bạn có thể thu hồi lời mời nếu người nhận chưa phản hồi</p>
            </div>

            {sentRequests.length === 0 ? (
              <div className="p-8 sm:p-12 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm">Bạn chưa gửi lời mời kết bạn nào.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {sentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.receiver?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.receiver?.username || 'user'}`}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {req.receiver?.display_name || 'Người dùng'}
                        </h4>
                        <p className="text-xs text-slate-400">@{req.receiver?.username}</p>
                        {req.receiver?.phone && <p className="text-[11px] text-blue-500">SĐT: {req.receiver.phone}</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => onCancelRequest(req.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-colors shrink-0"
                    >
                      Hủy lời mời
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};