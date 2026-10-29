import React from 'react';
import { MessageSquare, Heart, Github, Shield, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <MessageSquare className="w-5 h-5 fill-white/20" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Chat App
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Dự án website nhắn tin thời gian thực đa nền tảng, thiết kế tối ưu lấy cảm hứng từ Zalo & Messenger kết hợp trí tuệ nhân tạo Gemini.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span>React • TypeScript • Tailwind CSS • Supabase • WebRTC</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Điều Hướng
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><a href="#hero" className="hover:text-blue-600 transition-colors">Trang chủ</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors">Tính năng nổi bật</a></li>
              <li><a href="#ai-assistant" className="hover:text-blue-600 transition-colors">Trợ lý AI Gemini</a></li>
              <li><a href="#faq" className="hover:text-blue-600 transition-colors">Hỏi đáp thường gặp</a></li>
            </ul>
          </div>

          {/* Security & Policies */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Bảo Mật & Pháp Lý
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Chính sách bảo mật RLS</span>
              </li>
              <li><span>Điều khoản sử dụng</span></li>
              <li><span>Quyền riêng tư dữ liệu</span></li>
              <li><span>Mã nguồn mở học tập</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Chat App. Được phát triển với niềm đam mê công nghệ web.</p>
          <p className="flex items-center gap-1">
            Thiết kế & Kiến trúc cho người mới học lập trình <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          </p>
        </div>
      </div>
    </footer>
  );
};
