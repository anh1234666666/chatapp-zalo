/**
 * Gemini AI & Universal Intelligent Assistant Service
 * Hỗ trợ tự động kết nối mô hình Google Gemini 1.5 Flash chính hãng
 * Chuẩn hóa 100% định dạng hội thoại nhiều lượt (Multi-turn chat) theo đúng chuẩn Google
 */

export interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

let cachedApiKey = '';

export function getActiveGeminiKey(): string {
  if (cachedApiKey) return cachedApiKey;
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('GEMINI_API_KEY');
    if (local && local.trim().length > 10) {
      cachedApiKey = local.trim();
      return cachedApiKey;
    }
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setActiveGeminiKey(key: string) {
  cachedApiKey = key.trim();
  if (typeof window !== 'undefined') {
    localStorage.setItem('GEMINI_API_KEY', cachedApiKey);
    fetch('/api/local/settings/gemini-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cachedApiKey }),
    }).catch(() => {});
  }
}

// Giả lập gõ chữ mượt mà
async function streamTextGradually(
  fullText: string,
  onChunk: (chunk: string) => void,
  intervalMs = 6
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

// Xử lý thông minh các câu hỏi về Ngày / Giờ thực tế
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

/**
 * CHUẨN HÓA LỊCH SỬ CHAT CHO GOOGLE GEMINI API
 * 1. Lượt đầu tiên BẮT BUỘC phải là role 'user' (bỏ qua lời chào ban đầu của bot)
 * 2. Các lượt tiếp theo phải xen kẽ nghiêm ngặt 'user' -> 'model' -> 'user' -> 'model'
 * 3. Không được chứa text rỗng
 */
function buildGeminiContents(
  history: { role: string; content: string }[],
  prompt: string
): MessageHistory[] {
  const contents: MessageHistory[] = [];

  // Lọc bỏ các thông báo lỗi và tin nhắn hệ thống khỏi lịch sử gửi lên Google
  const validHistory = history.filter((h) => {
    if (!h.content || typeof h.content !== 'string') return false;
    const text = h.content.trim();
    if (text.length === 0) return false;
    if (text.includes('⚠️ Google Gemini thông báo:')) return false;
    if (text.includes('🔑 Kích hoạt Gemini 1.5')) return false;
    if (text.includes('Chào bạn! Tôi là Trợ lý')) return false;
    return true;
  });

  for (const item of validHistory) {
    const role: 'user' | 'model' =
      item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';

    // Bỏ qua tin nhắn bot chào đầu tiên để lượt đầu luôn là 'user'
    if (contents.length === 0 && role === 'model') {
      continue;
    }

    // Nếu bị trùng role liên tiếp, gộp text lại
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += '\n' + item.content.trim();
    } else {
      contents.push({
        role,
        parts: [{ text: item.content.trim() }],
      });
    }
  }

  // Thêm câu hỏi hiện tại của user vào cuối
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += '\n' + prompt.trim();
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: prompt.trim() }],
    });
  }

  return contents;
}

export async function streamGeminiAI(
  prompt: string,
  history: { role: string; content: string }[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const cleanPrompt = prompt.trim();
  const lowerPrompt = cleanPrompt.toLowerCase();

  // 1. Kiểm tra Ngày / Giờ thực tế
  const dateAnswer = handleDateTimeQuery(lowerPrompt);
  if (dateAnswer) {
    return await streamTextGradually(dateAnswer, onChunk, 8);
  }

  // 2. Lấy API Key
  let apiKey = getActiveGeminiKey();
  if (!apiKey) {
    try {
      const res = await fetch('/api/local/settings/gemini-key');
      if (res.ok) {
        const data = await res.json();
        if (data.key) {
          apiKey = data.key;
          cachedApiKey = apiKey;
        }
      }
    } catch {}
  }

  // 3. GỌI GOOGLE GEMINI CHÍNH HÃNG VỚI MULTI-TURN CHUẨN
  if (apiKey && apiKey.length > 15 && apiKey !== 'your-gemini-api-key-here') {
    try {
      const contents = buildGeminiContents(history, cleanPrompt);

      // Thử các model phổ biến nhất của Google: gemini-1.5-flash-latest, gemini-1.5-flash, gemini-pro, gemini-1.5-pro
      const modelCandidates = [
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-pro',
        'gemini-1.5-pro-latest'
      ];

      for (const modelName of modelCandidates) {
        try {
          const directUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
          const directRes = await fetch(directUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 3000,
              },
            }),
          });

          if (directRes.ok) {
            const directData = await directRes.json();
            const text = directData?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) {
              return await streamTextGradually(text.trim(), onChunk, 6);
            }
          } else {
            const errData = await directRes.json().catch(() => ({}));
            // Nếu lỗi là 404 not found model, thử model tiếp theo trong danh sách
            if (directRes.status === 404 || errData?.error?.message?.includes('not found')) {
              continue;
            }
            if (errData?.error?.message) {
              const errNotice = `⚠️ Google Gemini thông báo: ${errData.error.message}\n\nVui lòng kiểm tra lại mã API Key của bạn bằng cách bấm vào nút "Cài đặt Gemini Key" ở góc trên bên phải.`;
              onChunk(errNotice);
              return errNotice;
            }
          }
        } catch (callErr) {
          console.warn(`Lỗi khi gọi model ${modelName}:`, callErr);
        }
      }
    } catch (geminiErr: any) {
      console.error('Lỗi kết nối Gemini API:', geminiErr);
    }
  }

  // 4. Nếu chưa cài đặt API Key, hiển thị hướng dẫn thân thiện và rõ ràng
  const keyNotice = `Chào bạn! Tôi là **Trợ lý Trí Tuệ Nhân Tạo (Google Gemini AI)** của Chat App.\n\n` +
    `Để tôi có thể trực tiếp giải đáp mọi câu hỏi trên thế giới của bạn (như *"**${cleanPrompt}**"*), bạn chỉ cần **kích hoạt mã khóa Gemini API miễn phí**:\n\n` +
    `1. Nhìn lên góc trên bên phải, bấm vào nút màu tím **\`🔑 Kích hoạt Gemini 1.5\`**.\n` +
    `2. Lấy mã miễn phí tại [Google AI Studio](https://aistudio.google.com/app/apikey) trong 30 giây (không cần thẻ ngân hàng).\n` +
    `3. Dán mã \`AIzaSy...\` vào và bấm **Lưu & Kích hoạt ngay**!\n\n` +
    `Sau khi kích hoạt, tôi sẽ lập tức giải đáp toàn bộ các câu hỏi toán học, lập trình, khoa học và đời sống của bạn 100% siêu thông minh!`;

  return await streamTextGradually(keyNotice, onChunk, 6);
}
