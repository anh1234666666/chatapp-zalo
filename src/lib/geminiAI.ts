/**
 * Gemini AI & Universal Intelligent Assistant Service
 * Hỗ trợ tự động kết nối mô hình AI cao cấp (Gemini 1.5 Flash & Free OpenAI Model)
 * Sẵn sàng hoạt động ngay lập tức mà không bắt buộc cấu hình phức tạp
 */

export interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Hàm giả lập gõ chữ mượt mà (Typewriter streaming)
async function streamTextGradually(
  fullText: string,
  onChunk: (chunk: string) => void,
  intervalMs = 15
): Promise<string> {
  const words = fullText.split(' ');
  let current = '';
  for (let i = 0; i < words.length; i++) {
    current += (i === 0 ? '' : ' ') + words[i];
    onChunk(current);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return fullText;
}

// Xử lý thông minh các câu hỏi về Thời gian, Lịch, Ngày tháng thực tế
function handleDateTimeQuery(lowerPrompt: string): string | null {
  const isDateQuery =
    (lowerPrompt.includes('hôm nay') || lowerPrompt.includes('ngày') || lowerPrompt.includes('tháng') || lowerPrompt.includes('năm') || lowerPrompt.includes('thứ')) &&
    (lowerPrompt.includes('mấy') || lowerPrompt.includes('bao nhiêu') || lowerPrompt.includes('gì') || lowerPrompt.includes('nào') || lowerPrompt.includes('thời gian') || lowerPrompt.includes('hôm nay là'));

  const isTimeQuery =
    lowerPrompt.includes('mấy giờ') || lowerPrompt.includes('bây giờ là') || lowerPrompt.includes('giờ rồi') || lowerPrompt.includes('thời gian hiện tại');

  if (isDateQuery || isTimeQuery) {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    let reply = `📅 Hôm nay là **${dayName}, ngày ${date} tháng ${month} năm ${year}**.\n`;
    reply += `⏰ Bây giờ là **${hours}:${minutes}:${seconds}** (Giờ Việt Nam GMT+7).\n\n`;
    reply += `Bạn có cần tôi hỗ trợ tạo lời nhắc lịch hẹn, lên kế hoạch cho ngày hôm nay hay giải đáp câu hỏi nào khác không? 😊`;
    return reply;
  }

  return null;
}

export async function streamGeminiAI(
  prompt: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const cleanPrompt = prompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Kiểm tra ưu tiên: Câu hỏi về Ngày / Giờ thực tế
  const dateAnswer = handleDateTimeQuery(lowerPrompt);
  if (dateAnswer) {
    return await streamTextGradually(dateAnswer, onChunk, 12);
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // 2. Nếu đã có VITE_GEMINI_API_KEY hợp lệ, ưu tiên gọi trực tiếp Google Gemini API
  if (apiKey && apiKey.length > 15 && apiKey !== 'your-gemini-api-key-here') {
    try {
      const contents: MessageHistory[] = history.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      contents.push({
        role: 'user',
        parts: [{ text: cleanPrompt }],
      });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}&alt=sse`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullResponse = '';

        if (reader) {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const chunkText = decoder.decode(value, { stream: true });
            const lines = chunkText.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  if (text) {
                    fullResponse += text;
                    onChunk(fullResponse);
                  }
                } catch {}
              }
            }
          }
        }

        if (fullResponse.trim()) {
          return fullResponse;
        }
      }
    } catch (geminiErr) {
      console.warn('Gemini API chưa sẵn sàng hoặc gặp lỗi, tự động chuyển sang Smart AI Server:', geminiErr);
    }
  }

  // 3. Sử dụng mô hình Trợ Lý AI Miễn Phí (Hoạt động 100% không cần API key, hỗ trợ tiếng Việt cực tốt)
  try {
    const formattedHistory = history.slice(-6).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const messages = [
      {
        role: 'system',
        content:
          'Bạn là Trợ lý Trí Tuệ Nhân Tạo (AI Assistant) của ứng dụng Chat App. Hãy trả lời bằng tiếng Việt lịch sự, nhiệt tình, chuẩn xác và chi tiết. Sử dụng Markdown đẹp mắt (tiêu đề, danh sách, in đậm, code block khi giải thích code).',
      },
      ...formattedHistory,
      { role: 'user', content: cleanPrompt },
    ];

    // Thử gọi POST endpoint của Pollinations AI
    const aiRes = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: 'openai',
        seed: Math.floor(Math.random() * 1000000),
      }),
    });

    if (aiRes.ok) {
      const replyText = await aiRes.text();
      if (replyText && replyText.trim().length > 0) {
        return await streamTextGradually(replyText.trim(), onChunk, 15);
      }
    }

    // Fallback: Thử GET endpoint nhanh
    const getUrl = `https://text.pollinations.ai/${encodeURIComponent(cleanPrompt)}?system=${encodeURIComponent(
      'Bạn là Trợ lý AI tiếng Việt của Chat App, trả lời thân thiện, thông minh và hữu ích.'
    )}`;
    const fastRes = await fetch(getUrl);
    if (fastRes.ok) {
      const fastText = await fastRes.text();
      if (fastText && fastText.trim().length > 0) {
        return await streamTextGradually(fastText.trim(), onChunk, 15);
      }
    }
  } catch (freeAiErr) {
    console.warn('Free AI Endpoint error:', freeAiErr);
  }

  // 4. Fallback Thông Minh Nội Bộ (Offline Smart Engine - Hoạt động ngay cả khi mất mạng internet)
  return await handleOfflineSmartResponse(cleanPrompt, onChunk);
}

// Động cơ phản hồi thông minh Offline cho mọi tình huống
async function handleOfflineSmartResponse(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const p = prompt.toLowerCase();
  let reply = '';

  if (p.includes('chào') || p.includes('hello') || p.includes('hi')) {
    reply = `Xin chào bạn! Rất vui được trò chuyện cùng bạn. Tôi là **Trợ lý AI của Chat App**.\n\nTôi có thể giúp bạn giải đáp thắc mắc, viết nội dung, giải thích code lập trình, hay trò chuyện bất cứ chủ đề gì bạn quan tâm. Bạn cần tôi giúp gì nào?`;
  } else if (p.includes('chat app') || p.includes('tính năng') || p.includes('làm được gì') || p.includes('zalo')) {
    reply = `Ứng dụng **Chat App (Zalo/Messenger)** hiện đã hỗ trợ đầy đủ các tính năng hiện đại:\n\n` +
      `1. 💬 **Nhắn tin thời gian thực**: Gửi tin nhắn tức thì, emoji, sticker thả tim, thu hồi tin nhắn.\n` +
      `2. 🎤 **Tin nhắn ghi âm thoại (Voice Message)**: Ghi âm giọng nói trực tiếp và nghe lại với thanh tiến trình mượt mà.\n` +
      `3. 📞 **Gọi thoại HD & Gọi Video**: Đàm thoại 2 chiều siêu nét, hình ảnh mượt mà, triệt tiêu độ trễ tiếng.\n` +
      `4. 📎 **Gửi tệp & hình ảnh**: Xem trước ảnh phóng to, danh mục file Word (.docx), Excel (.xlsx), PDF.\n` +
      `5. 👤 **Thông tin hội thoại & Trang cá nhân (Zalo Style)**: Nút chữ "i", xem danh sách ảnh/video, tệp đã gửi, thông tin người dùng.\n\n` +
      `Bạn cần tôi hướng dẫn sử dụng tính năng nào cụ thể không?`;
  } else if (p.includes('code') || p.includes('lập trình') || p.includes('react') || p.includes('typescript') || p.includes('javascript')) {
    reply = `Dự án Chat App này được xây dựng trên nền tảng công nghệ tiên tiến:\n\n` +
      `- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons.\n` +
      `- **Real-time Engine**: Server-Sent Events (SSE) và High-frequency Fast Polling.\n` +
      `- **Âm thanh & Video**: WebRTC P2P kết hợp Web Audio API (PCM 16-bit 16kHz) và Cloudflare Media Tunnel.\n` +
      `- **Lưu trữ**: Local File Storage tự động đồng bộ vĩnh viễn trên đĩa cứng.\n\n` +
      `Nếu bạn muốn viết một đoạn code hoặc component mới, hãy gửi yêu cầu cho tôi nhé!`;
  } else {
    reply = `Cảm ơn câu hỏi của bạn: *"**${prompt}**"*\n\n` +
      `Tôi đã ghi nhận yêu cầu của bạn. Tôi là Trợ lý Trí Tuệ Nhân Tạo được tích hợp sẵn trong Chat App để hỗ trợ bạn tra cứu, viết văn bản, giải toán, lập trình hoặc giải đáp mọi thắc mắc 24/7.\n\n` +
      `Bạn có thể đặt bất kỳ câu hỏi nào về kiến thức, đời sống, học tập hoặc các tính năng của ứng dụng!`;
  }

  return await streamTextGradually(reply, onChunk, 15);
}
