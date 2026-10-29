import React from 'react';
import { Bot, Sparkles, Code, BrainCircuit, FileSearch, Lightbulb, ArrowRight } from 'lucide-react';

interface AIPromoSectionProps {
  onTryAI: () => void;
}

export const AIPromoSection: React.FC<AIPromoSectionProps> = ({ onTryAI }) => {
  return (
    <section id="ai-assistant" className="py-20 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Content (Col 6) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>Trợ Lý Thông Minh Nhân Tạo</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Người bạn đồng hành AI,{' '}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                sẵn sàng trợ giúp 24/7
              </span>
            </h2>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed">
              Tích hợp trực tiếp vào mục "Chat với AI", trợ lý có khả năng thấu hiểu ngữ cảnh sâu sắc, phản hồi thời gian thực theo từng chữ (Streaming SSE) và lưu trữ lịch sử trò chuyện an toàn.
            </p>

            {/* AI Capabilities Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Code className="w-6 h-6 text-violet-600 mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Lập trình & Fix Bug</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Giải thích thuật toán, sinh code TypeScript, React, Python và gỡ lỗi.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <BrainCircuit className="w-6 h-6 text-fuchsia-600 mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Giải Đáp Kiến Thức</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Hỗ trợ học tập, tra cứu khoa học, tổng hợp tài liệu chuyên ngành.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <FileSearch className="w-6 h-6 text-blue-600 mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tóm Tắt Văn Bản</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tóm lược các bài báo, email dài thành các ý chính nhanh chóng.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <Lightbulb className="w-6 h-6 text-amber-500 mb-2" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Sáng Tạo Nội Dung</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Soạn thảo email, kế hoạch làm việc, bài viết và kịch bản.</p>
              </div>
            </div>

            <div>
              <button
                onClick={onTryAI}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-0.5 transition-all"
              >
                <span>Trải nghiệm Trợ Lý AI ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right AI Chat Preview (Col 6) */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-900/30 via-slate-900 to-slate-950 border border-violet-500/30 shadow-2xl relative">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-violet-800/40 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Chat App AI Assistant
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-[11px] text-violet-300">Sử dụng Google Gemini AI Core</p>
                  </div>
                </div>
                <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full font-mono">
                  Streaming Token
                </span>
              </div>

              {/* Chat Messages Simulation */}
              <div className="space-y-4 text-xs sm:text-sm">
                
                {/* User Prompt */}
                <div className="flex items-end justify-end gap-2">
                  <div className="max-w-[85%] p-3.5 rounded-2xl rounded-br-sm bg-violet-600 text-white shadow-md">
                    Hãy giải thích cách WebRTC kết nối âm thanh và hình ảnh P2P giữa hai người dùng khác mạng?
                  </div>
                </div>

                {/* AI Streaming Response */}
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="flex-1 p-3.5 rounded-2xl rounded-tl-sm bg-slate-800/90 border border-violet-500/20 text-slate-200 space-y-2">
                    <p>
                      Để hai thiết bị kết nối WebRTC khi ở 2 mạng khác nhau (ví dụ 4G và Wi-Fi gia đình), quy trình diễn ra qua 3 bước cốt lõi:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                      <li><strong>Signaling (Báo hiệu):</strong> Hai bên gửi cho nhau SDP Offer/Answer và ICE Candidate thông qua Supabase Realtime channel.</li>
                      <li><strong>NAT Traversal (STUN/TURN):</strong> Thiết bị hỏi STUN Server để biết IP công khai của mình. Nếu tường lửa đối xứng (Symmetric NAT) chặn, hệ thống sẽ dùng TURN Server để relay dữ liệu.</li>
                      <li><strong>Media Stream P2P:</strong> Âm thanh và camera truyền trực tiếp qua UDP với độ trễ siêu thấp dưới 100ms.</li>
                    </ol>
                    <div className="flex items-center gap-1 text-[11px] text-violet-400 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                      <span>Đang tạo câu trả lời...</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
