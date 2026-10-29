import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Bot, 
  FolderArchive, 
  Bell, 
  Settings, 
  LogOut, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

export type ActiveTab = 'messages' | 'contacts' | 'ai' | 'files' | 'notifications';

interface SidebarNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  unreadCount?: number;
  friendRequestsCount?: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  onTabChange,
  onOpenProfile,
  onOpenSettings,
  unreadCount = 0,
  friendRequestsCount = 0,
}) => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <aside className="hidden md:flex w-16 lg:w-18 h-full flex-col items-center justify-between py-4 bg-[#0091ff] dark:bg-slate-950 text-white select-none shrink-0 border-r border-blue-400/20 dark:border-slate-800 transition-colors z-30">
      
      {/* User Avatar (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center gap-4 w-full">
        <button
          onClick={onOpenProfile}
          className="relative group p-1 focus:outline-none"
          title="Xem và chỉnh sửa hồ sơ"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/60 group-hover:border-white shadow-md transition-all">
            <img
              src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || 'user'}`}
              alt={profile?.display_name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-1 right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0091ff] dark:border-slate-950 rounded-full" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-row md:flex-col items-center justify-around md:justify-start gap-1 md:gap-3 w-full">
        
        {/* Tab Tin Nhắn */}
        <button
          onClick={() => onTabChange('messages')}
          className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'messages'
              ? 'bg-white/20 text-white font-bold shadow-inner'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
          title="Tin nhắn"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] text-[10px] bg-red-500 text-white font-bold rounded-full border-2 border-[#0091ff] dark:border-slate-950 flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Tab Danh Bạ */}
        <button
          onClick={() => onTabChange('contacts')}
          className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'contacts'
              ? 'bg-white/20 text-white font-bold shadow-inner'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
          title="Danh bạ & Bạn bè"
        >
          <Users className="w-5 h-5" />
          {friendRequestsCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[16px] text-[10px] bg-amber-500 text-white font-bold rounded-full border-2 border-[#0091ff] dark:border-slate-950 flex items-center justify-center">
              {friendRequestsCount}
            </span>
          )}
        </button>

        {/* Tab Trợ Lý AI */}
        <button
          onClick={() => onTabChange('ai')}
          className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'ai'
              ? 'bg-white/20 text-white font-bold shadow-inner'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
          title="Chat AI"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
        </button>

        {/* Tab Tệp Chia Sẻ */}
        <button
          onClick={() => onTabChange('files')}
          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'files'
              ? 'bg-white/20 text-white font-bold shadow-inner'
              : 'text-white/75 hover:bg-white/10 hover:text-white'
          }`}
          title="Kho tệp"
        >
          <FolderArchive className="w-5 h-5" />
        </button>

        {/* User Profile Trigger trên Mobile */}
        <button
          onClick={onOpenProfile}
          className="md:hidden w-10 h-10 rounded-full overflow-hidden border border-white/60 shrink-0"
          title="Hồ sơ cá nhân"
        >
          <img
            src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.username || 'user'}`}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </button>

      </div>

      {/* Bottom Icons (Desktop Only) */}
      <div className="hidden md:flex flex-col items-center gap-2 w-full">
        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:bg-white/10 hover:text-white transition-colors"
          title={theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={handleSignOut}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white/80 hover:bg-red-500/80 hover:text-white transition-colors"
          title="Đăng xuất"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
};
