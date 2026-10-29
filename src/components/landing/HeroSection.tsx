import React from 'react';
import { MessageSquare, Video, Bot, Shield, Zap, Sparkles, CheckCheck, Users, Send } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
  onExploreFeatures: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted, onExploreFeatures }) => {
  return (
    <section id="hero" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Nền tảng Chat Realtime kết hợp Trợ lý Trí Tuệ Nhân Tạo</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15] mb-6">
            Kết nối mọi người,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              trò chuyện không giới hạn
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed mb-8">
            Trải nghiệm nhắn tin thời gian thực siêu tốc, gọi điện thoại & video HD qua WebRTC, gửi tập tin an toàn và giải đáp mọi thắc mắc 24/7 cùng Trợ lý AI thế hệ mới.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
            >
              Bắt đầu ngay — Miễn phí
            </button>
            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-base transition-colors"
            >
              Khám phá tính năng
            </button>
          </div>

          {/* Trust Highlights */}
          <div className="flex items-center justify-center gap-6 mt-10 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Realtime dưới 100ms</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Bảo mật RLS đa tầng</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Video className="w-4 h-4 text-blue-500" />
              <span>WebRTC P2P HD</span>
            </div>
          </div>
        </div>

        {/* Realistic Chat UI Mockup */}
        <div className="relative max-w-5xl mx-auto">
          {/* Outer Frame with glow */}
          <div className="rounded-2xl p-1.5 sm:p-2 bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-900 shadow-2xl shadow-blue-500/10">
            <div className="rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
              
              {/* Left Mockup Sidebar (Col 4) */}
              <div className="hidden md:flex md:col-span-4 flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3">
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Hộp thoại</span>
                  </div>
                  <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                    3 mới
                  </span>
                </div>

                {/* Chat item list */}
                <div className="space-y-1.5">
                  {/* Item 1 - Active */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">Huyền Trang</span>
                        <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Vừa xong</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 truncate">File dự án mình gửi đã nhận được chưa bạn?</p>
                    </div>
                  </div>

                  {/* Item 2 - AI Assistant */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white">
                        <Bot className="w-5 h-5" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                          Trợ lý AI Smart
                        </span>
                        <span className="text-[11px] text-slate-400">10:24</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Tôi đã sẵn sàng giải đáp thắc mắc lập trình của bạn!</p>
                    </div>
                  </div>

                  {/* Item 3 - Group */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">Team Frontend Việt Nam</span>
                        <span className="text-[11px] text-slate-400">09:15</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Minh: Bản cập nhật tối nay nhìn mượt quá!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Mockup Chat Area (Col 8) */}
              <div className="col-span-12 md:col-span-8 flex flex-col justify-between bg-white dark:bg-slate-900 p-4 sm:p-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Huyền Trang</h4>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Đang trực tuyến</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      <Video className="w-4 h-4" />
                    </button>
                    <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors">
                      Gọi ngay
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <div className="py-4 space-y-3.5">
                  {/* Incoming message */}
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Avatar" className="w-7 h-7 rounded-full object-cover mb-1" />
                    <div>
                      <div className="p-3 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                        Chào bạn! Hệ thống Chat App mới dùng cảm giác phản hồi nhanh như Zalo luôn ấy 🚀
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1">09:40</span>
                    </div>
                  </div>

                  {/* Outgoing message */}
                  <div className="flex items-end justify-end gap-2 max-w-[85%] ml-auto">
                    <div className="text-right">
                      <div className="p-3 rounded-2xl rounded-br-sm bg-blue-600 text-white text-xs sm:text-sm shadow-sm text-left">
                        Chuẩn luôn bạn ơi! Toàn bộ tin nhắn đồng bộ Realtime Postgres, hỗ trợ gửi ảnh, tài liệu và có cả Trợ lý AI nữa!
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pr-1 mt-0.5">
                        <span>09:41</span>
                        <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Incoming with Attachment Preview */}
                  <div className="flex items-end gap-2 max-w-[85%]">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Avatar" className="w-7 h-7 rounded-full object-cover mb-1" />
                    <div>
                      <div className="p-2.5 rounded-2xl rounded-bl-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            PDF
                          </div>
                          <div>
                            <div className="font-semibold text-xs">Tai-lieu-Kien-truc-ChatApp.pdf</div>
                            <div className="text-[10px] text-slate-400">1.8 MB • Tải xuống ngay</div>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 pl-1">09:42</span>
                    </div>
                  </div>
                </div>

                {/* Input Simulation */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <div className="flex-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs sm:text-sm text-slate-400 flex items-center justify-between">
                    <span>Nhập nội dung tin nhắn gửi tới Huyền Trang...</span>
                    <span className="text-base cursor-pointer">😊</span>
                  </div>
                  <button className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
