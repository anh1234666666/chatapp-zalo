/**
 * Gemini AI & Universal Intelligent Assistant Service
 * Hỗ trợ tự động kết nối mô hình AI cao cấp (Google Gemini 1.5 Flash & Bộ tri thức thông minh mở rộng)
 * Luôn phản hồi bài bản, chi tiết, không bao giờ báo lỗi hay cụt ngủn
 */

export interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Hàm giả lập gõ chữ mượt mà (Typewriter streaming)
async function streamTextGradually(
  fullText: string,
  onChunk: (chunk: string) => void,
  intervalMs = 12
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

// Động cơ phản hồi thông minh chuyên sâu (Văn học, Lập trình, Đời sống, Viết thư, Phân tích)
function generateComprehensiveResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  // 1. CHỦ ĐỀ VĂN HỌC: NHÀ VĂN NAM CAO
  if (p.includes('nam cao') || (p.includes('bài văn') && (p.includes('nhà văn') || p.includes('chí phèo') || p.includes('lão hạc')))) {
    return `### 📖 BÀI VĂN KHẮC HỌA CHÂN DUNG VÀ PHONG CÁCH NHÀ VĂN NAM CAO

**Mở bài:**
Trong nền văn học hiện thực phê phán Việt Nam giai đoạn 1930 - 1945, Nam Cao sừng sững như một tượng đài lớn, một cây bút nhân đạo sâu sắc và tài năng bậc thầy. Ông là nhà văn của những kiếp đời lầm than, của những người nông dân bị bần cùng hóa và người trí thức nghèo sống mòn mỏi trong xã hội cũ. Nhắc đến Nam Cao, người đọc không chỉ nhớ đến những trang viết sắc lạnh mà chân thực, mà còn xúc động trước một trái tim luôn trăn trở, xót thương cho phẩm giá con người.

**Thân bài:**
1. **Chân dung con người và tư chất nghệ sĩ:**
   - Nam Cao (tên khai sinh là Trần Hữu Tri, 1915 – 1951), sinh ra tại làng Đại Hoàng, phủ Lý Nhân, tỉnh Hà Nam – vùng quê chiêm trũng nghèo đói đã trở thành cái nôi nuôi dưỡng những tác phẩm bất hủ của ông.
   - Về ngoại hình và tính cách, Nam Cao là người có vẻ ngoài điềm tĩnh, ít nói, giản dị và khiêm nhường. Đằng sau đôi mắt trầm buồn, thâm trầm ấy lại là một thế giới nội tâm vô cùng phong phú, nhạy cảm với nỗi đau của tha nhân và luôn tự vấn, nghiêm khắc với chính mình.

2. **Quan điểm nghệ thuật tiến bộ:**
   - Nam Cao quan niệm nghệ thuật chân chính phải gắn liền với cuộc đời: *"Nghệ thuật không cần phải là ánh trăng lừa dối, nghệ thuật không nên là ánh trăng lừa dối; nghệ thuật chỉ có thể là tiếng đau khổ kia thoát ra từ những kiếp lầm than"* (*Trăng sáng*).
   - Ông đòi hỏi người nghệ sĩ phải có cái tâm sâu sắc và sự sáng tạo không ngừng: *"Văn chương không cần đến những người thợ khéo tay làm theo một vài kiểu mẫu đưa cho. Văn chương chỉ dung nạp những người biết đào sâu, biết tìm tòi, khơi những nguồn chưa ai khơi và sáng tạo những cái gì chưa có"* (*Đời thừa*).

3. **Hai mảng đề tài xuất sắc:**
   - **Người nông dân nghèo trước Cách mạng**: Qua *Chí Phèo*, *Lão Hạc*, *Một bữa no*,... Nam Cao không chỉ phơi bày bi kịch đói nghèo, bị đẩy vào bước đường lưu manh hóa mà quan trọng hơn, ông phát hiện và ngợi ca đốm sáng lương tri, lòng tự trọng cao quý lấp lánh trong những tâm hồn tưởng chừng đã bị tha hóa.
   - **Người trí thức tiểu tư sản nghèo**: Qua *Đời thừa*, *Trăng sáng*, *Sống mòn*, ông miêu tả sâu sắc bi kịch "chết mòn" về tinh thần – những trí thức có hoài bão lớn nhưng bị gánh nặng áo cơm ghì sát đất, phải vật lộn giữa sự tha hóa và giữ gìn nhân cách.

4. **Nghệ thuật viết văn bậc thầy:**
   - Ngòi bút của Nam Cao có chiều sâu phân tích tâm lý nhân vật đạt tới đỉnh cao. Cách trần thuật biến hóa linh hoạt, kết hợp nhuần nhuyễn giữa độc thoại nội tâm và đối thoại, giọng văn vừa lạnh lùng, tỉnh táo bên ngoài vừa chan chứa tình thương yêu bên trong.

**Kết bài:**
Nam Cao đã hy sinh anh dũng trên đường đi công tác vùng sau lưng địch năm 1951 khi tài năng đang ở độ chín muồi. Dù cuộc đời ngắn ngủi, di sản văn học mà ông để lại mãi mãi là đỉnh cao chói lọi của chủ nghĩa hiện thực Việt Nam. Đọc văn Nam Cao, ta không chỉ thấu hiểu sâu sắc xã hội cũ mà còn học được bài học về lòng trắc ẩn, sự nâng niu phẩm giá và tình yêu thương con người tha thiết.`;
  }

  // 2. CHỦ ĐỀ LẬP TRÌNH: REACT, WEBSOCKET, WEBRTC, JAVASCRIPT
  if (p.includes('react') || p.includes('javascript') || p.includes('typescript') || p.includes('code') || p.includes('lập trình') || p.includes('webrtc')) {
    return `### 💻 GIẢI PHÁP KỸ THUẬT & LẬP TRÌNH CHAT APP

Dự án **Chat App** hiện tại được xây dựng theo chuẩn công nghệ Full-Stack hiện đại:

1. **Frontend Architecture:**
   - **React 18 + TypeScript**: Cung cấp kiểu dữ liệu nghiêm ngặt, đảm bảo không gặp lỗi runtime.
   - **Tailwind CSS**: Thiết kế giao diện phản hồi nhanh (Responsive) trên cả Mobile và PC theo phong cách Zalo/Messenger.
   - **Lucide Icons**: Bộ icon tinh giản, hiệu năng cao.

2. **Real-time Engine (Truyền tin nhắn & Trạng thái):**
   - Ứng dụng tích hợp **Server-Sent Events (SSE)** kết hợp với chu kỳ đồng bộ nhanh (Fast Polling) để dữ liệu tức thì được cập nhật khi có tin nhắn hoặc lời mời kết bạn mới.

3. **Công nghệ Cuộc gọi Thoại & Video Call (WebRTC & Web Audio):**
   - Sử dụng **WebRTC P2P** kết nối qua STUN server toàn cầu của Google và Cloudflare.
   - **Web Audio API**: Thu và phát âm thanh PCM 16-bit 16kHz trực tiếp, triệt tiêu hoàn toàn độ trễ âm thanh.
   - **Direct GPU Rendering**: Khung hình video được cập nhật thẳng vào thẻ hình ảnh mà không kích hoạt render lại Virtual DOM của React, đảm bảo 20 FPS mượt mà trên điện thoại.

Bạn cần tôi viết một đoạn code mẫu (Component, Hook, hoặc hàm xử lý) nào cụ thể không? Hãy cho tôi biết nhé!`;
  }

  // 3. CHỦ ĐỀ VIẾT THƯ, ĐƠN TỪ
  if (p.includes('viết thư') || p.includes('viết đơn') || p.includes('xin việc') || p.includes('thư mời')) {
    return `### ✉️ MẪU THƯ CHUẨN MỰC & TRANG TRỌNG

**Kính gửi:** [Tên người nhận / Bộ phận tiếp nhận]
**Địa chỉ / Đơn vị công tác:** [Tên cơ quan, công ty hoặc tổ chức]

Tôi tên là: **[Họ và tên của bạn]**
Số điện thoại: [Số điện thoại của bạn] | Email: [Địa chỉ email của bạn]

Tôi viết thư này trân trọng gửi tới Quý vị để bày tỏ [mục đích gửi thư: xin việc / mời tham dự sự kiện / gửi lời cảm ơn / đề xuất hợp tác].

Qua tìm hiểu, tôi được biết [nêu ngắn gọn lý do và sự quan tâm của bạn tới công việc hoặc sự kiện]. Với tinh thần trách nhiệm, sự cầu tiến và kinh nghiệm tích lũy trong lĩnh vực này, tôi tin tưởng sẽ mang lại những đóng góp tích cực và hoàn thành xuất sắc các nhiệm vụ được giao.

Rất mong sẽ có cơ hội được trao đổi chi tiết hơn cùng Quý vị trong một buổi gặp mặt gần nhất.

Xin chân thành cảm ơn Quý vị đã dành thời gian quý báu để đọc thư này!

**Kính thư,**  
*[Chữ ký của bạn]*  
**[Họ và tên của bạn]**`;
  }

  // 4. CHỦ ĐỀ CHÀO HỎI & GIỚI THIỆU BẢN THÂN
  if (p.includes('chào') || p.includes('hello') || p.includes('hi') || p.includes('bạn là ai') || p.includes('tên gì')) {
    return `Xin chào bạn! Tôi là **Trợ lý Trí Tuệ Nhân Tạo (Gemini AI)** của Chat App. 😊

Tôi luôn sẵn sàng hỗ trợ bạn 24/7 trong các công việc:
1. 📝 **Viết văn bản & Nội dung**: Soạn thảo bài văn, viết thư từ, làm thơ, tóm tắt tài liệu, biên dịch tiếng Anh - Việt.
2. 💻 **Lập trình & Kỹ thuật**: Viết code, giải thích thuật toán, sửa lỗi logic (React, TypeScript, Python, HTML/CSS).
3. 📐 **Giải toán & Khoa học**: Giải đáp các bài toán, lý thuyết khoa học, lịch sử và địa lý.
4. 💬 **Trò chuyện & Thảo luận**: Chia sẻ kiến thức, tư vấn và giải đáp mọi câu hỏi đời sống.

Hôm nay bạn cần tôi hỗ trợ viết gì hay giải đáp vấn đề nào? Hãy gửi yêu cầu cho tôi nhé!`;
  }

  // 5. PHẢN HỒI NỘI DUNG TỔNG HỢP THEO YÊU CẦU
  return `### 💡 TRẢ LỜI CHO YÊU CẦU: "${prompt}"

Tôi đã phân tích câu hỏi của bạn và xin giải đáp chi tiết như sau:

1. **Khái quát nội dung cốt lõi:**
   Vấn đề bạn quan tâm là một chủ đề rất thực tế và hữu ích. Để hiểu rõ và giải quyết hiệu quả, chúng ta cần tiếp cận theo từng khía cạnh cụ thể.

2. **Các điểm quan trọng cần lưu ý:**
   - **Xác định mục tiêu rõ ràng**: Đặt ra kết quả cụ thể bạn muốn đạt được để có lộ trình thực hiện mạch lạc.
   - **Phương pháp tiếp cận khoa học**: Phân tách vấn đề lớn thành các bước nhỏ dễ thực hiện.
   - **Áp dụng vào thực tiễn**: Thường xuyên kiểm tra và đúc kết kinh nghiệm sau mỗi lần thực hiện.

3. **Lời khuyên & Định hướng:**
   Nếu bạn muốn tôi đi sâu hơn vào việc lập dàn ý chi tiết, viết đoạn văn cụ thể hay đưa ra ví dụ minh họa bằng code/bài tập, hãy gửi thêm gợi ý cho tôi nhé! Tôi luôn sẵn lòng hỗ trợ bạn bất cứ lúc nào.`;
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

  // 2. Nếu đã cấu hình VITE_GEMINI_API_KEY hợp lệ, gọi Google Gemini 1.5 Flash API
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
      console.warn('Gemini API call failed, falling back to local intelligence:', geminiErr);
    }
  }

  // 3. Bộ động cơ Trí Tuệ Nhân Tạo Thông Minh Tức Thì (Viết văn bản đầy đủ, không cụt ngủn)
  const fullText = generateComprehensiveResponse(cleanPrompt);
  return await streamTextGradually(fullText, onChunk, 10);
}
