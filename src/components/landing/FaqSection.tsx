import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Chat App có hoạt động giữa các mạng khác nhau (Wi-Fi, 4G, 5G) không?',
      a: 'Có! Hệ thống kết nối thông qua Supabase Realtime Server công khai trên Internet. Hai người dùng ở bất kỳ nơi nào trên thế giới chỉ cần có mạng Internet là có thể gửi nhận tin nhắn và gọi video ngay lập tức.',
    },
    {
      q: 'Dữ liệu tin nhắn và tài liệu được lưu trữ và bảo mật thế nào?',
      a: 'Toàn bộ dữ liệu được lưu trên Supabase PostgreSQL với cơ chế Row Level Security (RLS) nghiêm ngặt: chỉ những người là thành viên của cuộc trò chuyện mới có quyền đọc hoặc ghi tin nhắn. Tệp tin được lưu trên Cloud Storage có phân quyền bảo mật.',
    },
    {
      q: 'Trợ lý AI hoạt động như thế nào và có tính phí không?',
      a: 'Trợ lý AI được tích hợp trực tiếp qua API Gemini thế hệ mới với khả năng streaming văn bản thời gian thực. Bạn có thể sử dụng API key miễn phí từ Google AI Studio để trải nghiệm.',
    },
    {
      q: 'Tôi là người mới học lập trình, làm thế nào để tự chạy dự án này?',
      a: 'Dự án đã được tổ chức thư mục cực kỳ khoa học với React + Vite + Tailwind CSS. Bạn chỉ cần chạy lệnh `npm install` và `npm run dev`. File `.env.example` và tài liệu hướng dẫn từng bước sẽ chỉ dẫn bạn kết nối Supabase trong 2 phút!',
    },
    {
      q: 'Tính năng gọi video WebRTC có yêu cầu cấu hình phức tạp không?',
      a: 'Hệ thống đã cấu hình sẵn Google Public STUN Servers. Quá trình trao đổi tín hiệu (Signaling) được đồng bộ tự động qua Supabase Realtime channel, cho phép gọi thoại và video 1-1 cực kỳ tiện lợi.',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            Giải Đáp Thắc Mắc
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Câu Hỏi Thường Gặp (FAQ)
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base">
            Những thông tin quan trọng giúp bạn hiểu rõ cách thức hoạt động của Chat App.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
