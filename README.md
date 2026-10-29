# 💬 Chat App — Nền Tảng Trò Chuyện Realtime & Trợ Lý AI

> Ứng dụng chat hiện đại lấy cảm hứng từ **Zalo Web** & **Messenger**, kết hợp sức mạnh của **Supabase Realtime**, **WebRTC Video Call** và **Google Gemini AI**.
> Được thiết kế cấu trúc bài bản, chú thích rõ ràng dành cho người mới học lập trình full-stack.

---

## 🚀 Tính Năng Chính Của Dự Án

1. **Landing Page Chuyên Nghiệp**:
   - Giao diện phong cách hiện đại với màu xanh thương hiệu Zalo, hỗ trợ **Dark Mode** & **Light Mode**.
   - Hero Section, mockup giao diện chat thời gian thực, bảng tính năng, giới thiệu Trợ lý AI, FAQ và Footer.
2. **Xác Thực Người Dùng (Supabase Auth)**:
   - Đăng ký, Đăng nhập, Đăng xuất, Quên mật khẩu.
   - Quản lý hồ sơ: Tên hiển thị, Username duy nhất, Số điện thoại, Đổi avatar ngẫu nhiên hoặc tùy chỉnh.
   - **Chế độ Thử Nghiệm (Demo Mode)**: Cho phép người mới học lập trình trải nghiệm ngay lập tức các tính năng mà không bị lỗi crash ngay cả khi chưa kịp cấu hình Supabase.
3. **Giao Diện Chat Chuẩn Zalo Web (3 Cột)**:
   - **Cột 1**: Thanh điều hướng biểu tượng (Tin nhắn, Danh bạ, Chat AI, Kho tệp, Cài đặt, Đăng xuất).
   - **Cột 2**: Danh sách cuộc trò chuyện, tìm kiếm, lọc chưa đọc, tạo nhóm, thêm bạn.
   - **Cột 3**: Khung trò chuyện chính, avatar, trạng thái online, gửi tin nhắn, đính kèm ảnh, tệp tin, chọn biểu tượng emoji, trả lời tin nhắn (Reply) và thu hồi tin nhắn.
4. **Kết Bạn & Danh Bạ (Zalo Style)**:
   - Tìm kiếm người dùng qua username hoặc số điện thoại.
   - Gửi lời mời kết bạn, chấp nhận, từ chối, hủy lời mời, danh sách bạn bè và hủy kết bạn.
5. **Nhóm Chat Đa Thành Viên**:
   - Tạo nhóm, đặt tên nhóm, chọn thành viên từ danh bạ bạn bè.
   - Nhắn tin trong nhóm, hiển thị tên người gửi trên từng bubble tin nhắn.
6. **Gọi Thoại & Video HD (WebRTC P2P)**:
   - Kết nối âm thanh và camera P2P thông qua WebRTC với Google STUN Server.
   - Kiểm tra quyền truy cập microphone/camera thật của trình duyệt, nút Bật/Tắt Mic, Bật/Tắt Camera.
7. **Chat với Trợ Lý AI (Gemini 1.5 Flash Streaming)**:
   - Trò chuyện thông minh, giải bài tập, giải thích code, tóm tắt tài liệu.
   - Hiển thị câu trả lời dần theo thời gian thực (Streaming SSE) với định dạng Markdown & Code Block.
8. **Bảo Mật Cơ Sở Dữ Liệu**:
   - PostgreSQL với hệ thống chính sách **Row Level Security (RLS)** nghiêm ngặt.

---

## 📂 Cấu Trúc Thư Mục Dự Án

```
d:/CODE  WEB/
├── .env.example               # Mẫu biến môi trường
├── supabase_schema.sql        # Toàn bộ SQL CSDL, RLS, Triggers và Realtime
├── package.json               # Danh sách thư viện và scripts
├── vite.config.ts             # Cấu hình Vite & Path alias (@/)
├── tailwind.config.js         # Cấu hình màu sắc Zalo, animations, dark mode
├── src/
│   ├── main.tsx               # Điểm bắt đầu ứng dụng
│   ├── App.tsx                # Quản lý Router và Provider
│   ├── index.css              # Tailwind directives và custom scrollbar
│   ├── types/
│   │   └── database.ts        # TypeScript interfaces cho CSDL & Models
│   ├── lib/
│   │   ├── supabaseClient.ts  # Khởi tạo Supabase client an toàn
│   │   ├── webrtc.ts          # Quản lý WebRTC PeerConnection & MediaStream
│   │   └── geminiAI.ts        # Gọi API Google Gemini streaming
│   ├── contexts/
│   │   ├── AuthContext.tsx    # Quản lý tài khoản, session, login/register
│   │   └── ThemeContext.tsx   # Chế độ Sáng / Tối (Light/Dark Mode)
│   └── components/
│       ├── landing/           # Các thành phần Landing Page
│       │   ├── Navbar.tsx
│       │   ├── HeroSection.tsx
│       │   ├── FeaturesSection.tsx
│       │   ├── AIPromoSection.tsx
│       │   ├── FaqSection.tsx
│       │   ├── Footer.tsx
│       │   └── LandingPage.tsx
│       ├── auth/              # Modal đăng nhập / đăng ký
│       │   └── AuthModal.tsx
│       └── chat/              # Toàn bộ giao diện Chat Zalo Web
│           ├── SidebarNav.tsx
│           ├── ConversationList.tsx
│           ├── ChatArea.tsx
│           ├── MessageItem.tsx
│           ├── ContactsView.tsx
│           ├── AIChatView.tsx
│           ├── SharedFilesView.tsx
│           ├── CallModal.tsx
│           ├── CreateGroupModal.tsx
│           ├── ProfileModal.tsx
│           └── ChatLayout.tsx
```

---

## 🛠️ Hướng Dẫn Chạy Trên Máy Tính (Localhost)

### Bước 1: Khởi động máy chủ phát triển
Mở terminal tại thư mục dự án và chạy:
```bash
npm run dev
```
Trình duyệt sẽ mở tại địa chỉ `http://localhost:5173`.

### Bước 2: Trải nghiệm ngay
- Ngay khi mở trang, bạn sẽ thấy **Landing Page**.
- Bấm **"Bắt đầu ngay"** -> Trong cửa sổ đăng nhập, bạn có thể chọn **"Vào xem thử ngay (Chế độ Trải nghiệm)"** để vào thẳng giao diện Zalo Chat với dữ liệu mẫu hoàn chỉnh.

---

## 🌐 Hướng Dẫn Kết Nối Supabase Thực Tế (Miễn Phí)

Để hai tài khoản ở hai thiết bị khác nhau có thể chat realtime qua Internet:

1. Đăng ký tài khoản miễn phí tại [https://supabase.com](https://supabase.com).
2. Tạo một Project mới (chọn khu vực Singapore hoặc gần nhất).
3. Vào mục **SQL Editor** trong Supabase Dashboard -> Mở file `supabase_schema.sql` trong dự án này, copy toàn bộ nội dung và bấm **Run** để khởi tạo các bảng, RLS và Realtime.
4. Vào **Project Settings** -> **API**:
   - Copy `Project URL`
   - Copy `anon public key`
5. Tạo file `.env` ở thư mục gốc của dự án và dán vào:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
6. Vào [Google AI Studio](https://aistudio.google.com/) -> Bấm **Get API key** và dán vào:
   ```env
   VITE_GEMINI_API_KEY=AIzaSy...
   ```
7. Khởi động lại `npm run dev`. Lúc này hệ thống sẽ tự động chuyển sang kết nối trực tuyến 100%!

---

## 🚢 Hướng Dẫn Triển Khai Lên Internet (Hosting Miễn Phí)

Bạn có thể đưa trang web lên Internet miễn phí bằng **Vercel** hoặc **Netlify**:

### Cách triển khai qua Vercel:
1. Đưa mã nguồn lên GitHub.
2. Đăng nhập [https://vercel.com](https://vercel.com), bấm **Add New Project** và chọn repository GitHub của bạn.
3. Trong phần **Environment Variables**, điền:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GEMINI_API_KEY`
4. Bấm **Deploy**. Vercel sẽ tự động cấp phát tên miền HTTPS miễn phí (ví dụ: `https://chatapp-zalo.vercel.app`).
5. Bạn gửi đường link này cho bạn bè, cả hai người dùng ở các mạng khác nhau (Wi-Fi, 4G, 5G) đều có thể tạo tài khoản, kết bạn và nhắn tin realtime!
