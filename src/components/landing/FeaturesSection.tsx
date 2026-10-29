import React from 'react';
import { MessageSquare, Users, Video, FileText, Bot, ShieldCheck, Zap, Globe, Bell } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500',
      title: 'Nhắn tin Realtime Siêu Tốc',
      desc: 'Công nghệ WebSocket & Postgres CDC đồng bộ tin nhắn 2 chiều ngay lập tức. Hỗ trợ hiển thị trạng thái đã gửi/đã xem, typing indicator, thu hồi tin nhắn và emoji sống động.',
      badge: 'Cốt lõi',
    },
    {
      icon: Users,
      color: 'from-purple-500 to-indigo-500',
      title: 'Kết Bạn & Danh Bạ Thông Minh',
      desc: 'Tìm kiếm bạn bè dễ dàng qua username, tên hiển thị hoặc số điện thoại. Quản lý lời mời kết bạn, danh sách chặn, đồng bộ danh bạ cá nhân minh bạch.',
      badge: 'Zalo Style',
    },
    {
      icon: Users,
      color: 'from-amber-500 to-orange-500',
      title: 'Nhóm Chat & Phân Quyền Trưởng Nhóm',
      desc: 'Tạo nhóm trao đổi công việc hay bạn bè không giới hạn. Đầy đủ quyền phân cấp: Trưởng nhóm (Owner), Phó nhóm (Admin), Thành viên, kiểm duyệt tin nhắn và đổi thông tin nhóm.',
      badge: 'Làm việc nhóm',
    },
    {
      icon: Video,
      color: 'from-emerald-500 to-teal-500',
      title: 'Gọi Thoại & Video HD WebRTC',
      desc: 'Trò chuyện hình ảnh và âm thanh trực tiếp P2P độ trễ cực thấp. Tích hợp thông báo chuông cuộc gọi đến, bật/tắt camera và micro tiện lợi xuyên suốt mọi nền tảng.',
      badge: 'WebRTC P2P',
    },
    {
      icon: Bot,
      color: 'from-rose-500 to-pink-500',
      title: 'Trợ Lý AI Thông Minh Đa Năng',
      desc: 'Trò chuyện cùng AI thông minh tích hợp sẵn. Phản hồi dạng Streaming từng từ mượt mà, hỗ trợ giải bài tập, dịch thuật, viết code và tóm tắt tài liệu văn bản dài.',
      badge: 'AI Assistant',
    },
    {
      icon: FileText,
      color: 'from-blue-600 to-sky-600',
      title: 'Chia Sẻ Tệp & Media An Toàn',
      desc: 'Gửi ảnh, tài liệu PDF, Word, Excel, PowerPoint với tốc độ cao. Xem trước hình ảnh trực tiếp, kiểm tra dung lượng và bảo mật file theo từng phòng chat riêng tư.',
      badge: 'Cloud Storage',
    },
  ];

  return (
    <section id="features" className="py-20 bg-slate-50/50 dark:bg-slate-900/40 border-y border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            Tính Năng Vượt Trội
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Tất cả những gì bạn cần cho một ứng dụng trò chuyện đỉnh cao
          </h2>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
            Được kiến trúc theo tiêu chuẩn phần mềm hiện đại, kết hợp trải nghiệm thân thuộc của Zalo & Messenger cùng sức mạnh đột phá của AI.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="relative group p-7 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md shadow-blue-500/10`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Secondary feature highlights banner */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-2xl font-bold">Kết nối liên mạng: Wi-Fi, 4G, 5G mọi lúc mọi nơi</h4>
            <p className="text-blue-100 text-sm max-w-xl">
              Không còn lo ngại rào cản NAT hay mạng nội bộ. Cơ chế Signaling & Fallback STUN đảm bảo tin nhắn và cuộc gọi của bạn luôn thông suốt.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-300" />
              <span>Cross-Network Ready</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>RLS Row Security</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
