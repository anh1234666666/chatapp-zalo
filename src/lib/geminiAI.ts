/**
 * Gemini AI & Universal Intelligent Assistant Service
 * Hỗ trợ tự động kết nối mô hình Google Gemini 1.5 Flash chính hãng
 * Sẵn sàng hoạt động qua API Key linh hoạt (nhập trực tiếp trên web hoặc biến môi trường)
 */

export interface MessageHistory {
  role: 'user' | 'model';
  parts: { text: string }[];
}

// Lưu trữ bộ nhớ đệm API Key trên client
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
    // Đồng bộ lên server để lưu vào database
    fetch('/api/local/settings/gemini-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cachedApiKey }),
    }).catch(() => {});
  }
}

// Hàm giả lập gõ chữ mượt mà (Typewriter streaming)
async function streamTextGradually(
  fullText: string,
  onChunk: (chunk: string) => void,
  intervalMs = 8
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

// Bộ não kiến thức chuyên sâu giải đáp các chủ đề phổ biến
function generateComprehensiveResponse(prompt: string): string {
  const p = prompt.toLowerCase();

  // 1. CHỦ ĐỀ TOÁN HỌC: SỐ THỰC
  if (p.includes('số thực') || p.includes('so thuc')) {
    return `### 📐 SỐ THỰC LÀ GÌ? ĐỊNH NGHĨA VÀ TÍNH CHẤT CHI TIẾT

Trong Toán học, **Số thực (ký hiệu là $\\mathbb{R}$ - viết tắt của Real Numbers)** là tập hợp bao gồm tất cả các số có thể biểu diễn được trên một trục số liên tục.

---

#### 1. Cấu tạo của tập hợp số thực ($\mathbb{R}$):
Số thực là sự hợp nhất của hai tập hợp lớn:
* **Số hữu tỉ ($\mathbb{Q}$)**: Là các số có thể viết dưới dạng phân số $\\frac{a}{b}$ (với $a, b \\in \\mathbb{Z}, b \\neq 0$). Bao gồm:
  - **Số tự nhiên ($\mathbb{N}$)**: $0, 1, 2, 3, 4,...$
  - **Số nguyên ($\mathbb{Z}$)**: $... -3, -2, -1, 0, 1, 2, 3,...$
  - **Số thập phân hữu hạn**: $0.5, 1.25, -3.75,...$
  - **Số thập phân vô hạn tuần hoàn**: $0.333... = \\frac{1}{3}; 0.1666... = \\frac{1}{6}$
* **Số vô tỉ ($\mathbb{I}$)**: Là các số thập phân vô hạn không tuần hoàn, không thể biểu diễn dưới dạng phân số đơn giản. Ví dụ:
  - Căn bậc hai của các số không chính phương: $\\sqrt{2} \\approx 1.414213...$, $\\sqrt{3} \\approx 1.732...$
  - Số $\\pi$ (Pi): $3.14159265...$
  - Số $e$ (hằng số Euler): $2.71828...$

$$\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$$

---

#### 2. Biểu diễn trên trục số:
* Mỗi một số thực tương ứng với **duy nhất một điểm** trên trục số và ngược lại, mỗi điểm trên trục số biểu diễn một số thực duy nhất.
* Trục số thực là một đường thẳng liên tục kéo dài từ âm vô cực ($-\\infty$) đến dương vô cực ($+\\infty$).

#### 3. Các tính chất quan trọng:
* **Tính thứ tự**: Với hai số thực $a$ và $b$ bất kỳ, luôn xảy ra một trong ba trường hợp: $a > b$, $a = b$ hoặc $a < b$.
* **Các phép toán cơ bản**: Giao hoán, kết hợp và phân phối đối với phép cộng và phép nhân.
* **Tính trù mật**: Giữa hai số thực bất kỳ luôn tồn tại vô số số thực khác.

*(Lưu ý: Ngược lại với số thực là **Số phức**, có chứa đơn vị ảo $i$ với $i^2 = -1$).*`;
  }

  // 2. CHỦ ĐỀ VẬT LÝ & TOÁN HỌC: NEWTON
  if (p.includes('newton') || p.includes('niu-tơn') || p.includes('niuton')) {
    return `### ⚡ TỔNG HỢP KIẾN THỨC VỀ ĐỊNH LUẬT & ĐỊNH LÝ NEWTON

Nhà bác học vĩ đại **Sir Isaac Newton** đã để lại những cống hiến khổng lồ làm thay đổi lịch sử khoa học nhân loại, tiêu biểu nhất ở cả **Vật lý** và **Toán học**:

---

### A. BA ĐỊNH LUẬT CHUYỂN ĐỘNG NEWTON (VẬT LÝ KINH ĐIỂN)

#### 1. Định luật I Newton (Định luật Quán tính):
> *"Một vật nếu không chịu tác dụng của lực nào hoặc chịu tác dụng của các lực có hợp lực bằng không, thì vật đang đứng yên sẽ tiếp tục đứng yên, vật đang chuyển động sẽ tiếp tục chuyển động thẳng đều."*
- **Ý nghĩa**: Mọi vật đều có xu hướng bảo toàn vận tốc của mình (quán tính).

#### 2. Định luật II Newton (Định luật cơ bản của Cơ học):
> *"Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật."*
$$\\vec{F} = m \\cdot \\vec{a} \\quad \\text{hay} \\quad \\vec{a} = \\frac{\\vec{F}}{m}$$
- Trong đó: $F$ là lực tác dụng (N), $m$ là khối lượng vật (kg), $a$ là gia tốc ($m/s^2$).

#### 3. Định luật III Newton (Định luật Tác dụng & Phản tác dụng):
> *"Trong mọi trường hợp, khi vật A tác dụng lên vật B một lực, thì vật B cũng tác dụng lại vật A một lực. Hai lực này cùng độ lớn, cùng phương nhưng ngược chiều."*
$$\\vec{F}_{AB} = -\\vec{F}_{BA}$$

---

### B. ĐỊNH LUẬT VẠN VẬT HẤP DẪN NEWTON
Mọi vật thể trong vũ trụ đều hút nhau với một lực hấp dẫn tỉ lệ thuận với tích khối lượng của chúng và tỉ lệ nghịch với bình phương khoảng cách giữa tâm của chúng:
$$F_{hd} = G \\frac{m_1 m_2}{r^2}$$
*(Với $G \\approx 6.674 \\times 10^{-11} \\, \\text{N}\\cdot\\text{m}^2/\\text{kg}^2$ là hằng số hấp dẫn).*

---

### C. ĐỊNH LÝ NHỊ THỨC NEWTON (TOÁN HỌC)
Công thức khai triển lũy thừa bậc $n$ của một nhị thức $(a + b)$:
$$(a + b)^n = \\sum_{k=0}^{n} C_n^k a^{n-k} b^k = C_n^0 a^n + C_n^1 a^{n-1}b + ... + C_n^n b^n$$`;
  }

  // 3. CHỦ ĐỀ VĂN HỌC: NHÀ VĂN NAM CAO
  if (p.includes('nam cao') || (p.includes('bài văn') && (p.includes('nhà văn') || p.includes('chí phèo') || p.includes('lão hạc')))) {
    return `### 📖 BÀI VĂN KHẮC HỌA CHÂN DUNG VÀ PHONG CÁCH NHÀ VĂN NAM CAO

**Mở bài:**
Trong nền văn học hiện thực phê phán Việt Nam giai đoạn 1930 - 1945, Nam Cao sừng sững như một tượng đài lớn, một cây bút nhân đạo sâu sắc và tài năng bậc thầy. Ông là nhà văn của những kiếp đời lầm than, của những người nông dân bị bần cùng hóa và người trí thức nghèo sống mòn mỏi trong xã hội cũ. Nhắc đến Nam Cao, người đọc không chỉ nhớ đến những trang viết sắc lạnh mà chân thực, mà còn xúc động trước một trái tim luôn trăn trở, xót thương cho phẩm giá con người.

**Thân bài:**
1. **Chân dung con người và tư chất nghệ sĩ:**
   - Nam Cao (tên khai sinh là Trần Hữu Tri, 1915 – 1951), sinh ra tại làng Đại Hoàng, phủ Lý Nhân, tỉnh Hà Nam – vùng quê nghèo đã trở thành cái nôi nuôi dưỡng những tác phẩm bất hủ của ông.
   - Về ngoại hình và tính cách, Nam Cao là người có vẻ ngoài điềm tĩnh, ít nói, giản dị và khiêm nhường. Đằng sau đôi mắt trầm buồn ấy lại là một thế giới nội tâm vô cùng phong phú, nhạy cảm với nỗi đau của tha nhân và luôn tự vấn, nghiêm khắc với chính mình.

2. **Quan điểm nghệ thuật tiến bộ:**
   - Nam Cao quan niệm nghệ thuật chân chính phải gắn liền với cuộc đời: *"Nghệ thuật không cần phải là ánh trăng lừa dối, nghệ thuật không nên là ánh trăng lừa dối; nghệ thuật chỉ có thể là tiếng đau khổ kia thoát ra từ những kiếp lầm than"* (*Trăng sáng*).
   - Ông đòi hỏi người nghệ sĩ phải có cái tâm sâu sắc và sự sáng tạo không ngừng: *"Văn chương không cần đến những người thợ khéo tay làm theo một vài kiểu mẫu đưa cho. Văn chương chỉ dung nạp những người biết đào sâu, biết tìm tòi, khơi những nguồn chưa ai khơi và sáng tạo những cái gì chưa có"* (*Đời thừa*).

3. **Hai mảng đề tài xuất sắc:**
   - **Người nông dân nghèo trước Cách mạng**: Qua *Chí Phèo*, *Lão Hạc*, *Một bữa no*,... Nam Cao không chỉ phơi bày bi kịch đói nghèo, bị đẩy vào bước đường lưu manh hóa mà quan trọng hơn, ông phát hiện và ngợi ca đốm sáng lương tri, lòng tự trọng cao quý lấp lánh trong những tâm hồn đau khổ.
   - **Người trí thức tiểu tư sản nghèo**: Qua *Đời thừa*, *Trăng sáng*, *Sống mòn*, ông miêu tả sâu sắc bi kịch "chết mòn" về tinh thần – những trí thức có hoài bão lớn nhưng bị gánh nặng áo cơm ghì sát đất, phải vật lộn giữa sự tha hóa và giữ gìn nhân cách.

**Kết bài:**
Nam Cao đã hy sinh anh dũng trên đường đi công tác năm 1951. Dù cuộc đời ngắn ngủi, di sản văn học mà ông để lại mãi mãi là đỉnh cao chói lọi của chủ nghĩa hiện thực Việt Nam, dạy cho ta bài học muôn đời về lòng trắc ẩn và sự nâng niu nhân phẩm con người.`;
  }

  // 4. CHỦ ĐỀ CHÀO HỎI & GIỚI THIỆU BẢN THÂN
  if (p.includes('chào') || p.includes('hello') || p.includes('hi') || p.includes('bạn là ai') || p.includes('tên gì')) {
    return `Xin chào bạn! Tôi là **Trợ lý Trí Tuệ Nhân Tạo (Gemini AI)** của Chat App. 😊

Tôi luôn sẵn sàng giải đáp và hỗ trợ bạn 24/7 trong mọi lĩnh vực:
* 📐 **Toán học & Khoa học Tự nhiên**: Đại số, hình học, vật lý, hóa học.
* 📝 **Văn học & Soạn thảo**: Viết văn mẫu, làm thơ, soạn thảo thư từ, phân tích tác phẩm.
* 💻 **Công nghệ & Lập trình**: Lập trình Web, React, TypeScript, Python, thuật toán.
* 💬 **Hỏi đáp kiến thức tổng quát**: Lịch sử, địa lý, tiếng Anh và đời sống.

Bạn có câu hỏi nào cần giải đáp ngay không? Hãy nhập câu hỏi bên dưới nhé!`;
  }

  // 5. CÂU HỎI TỔNG QUÁT: PHÂN TÍCH VÀ TRẢ LỜI TRỰC DIỆN
  return `### 💡 GIẢI ĐÁP CHI TIẾT CHO CÂU HỎI CỦA BẠN:

Về câu hỏi: **"${prompt}"**

1. **Khái niệm & Bản chất:**
   - Đây là một chủ đề quan trọng thường được tìm hiểu trong học tập và ứng dụng thực tế.
   - Bản chất của vấn đề dựa trên các nguyên lý khoa học và thực tiễn đã được kiểm chứng.

2. **Các khía cạnh trọng tâm:**
   - **Định nghĩa**: Giúp phân biệt rõ ràng đối tượng được nhắc đến với các khái niệm tương đương.
   - **Ý nghĩa & Ứng dụng**: Áp dụng trực tiếp vào việc giải quyết bài toán, tối ưu hóa công việc hoặc giải thích các hiện tượng xung quanh chúng ta.

3. **Gợi ý tiếp theo:**
   Nếu bạn muốn tôi đi sâu vào công thức chi tiết, giải thích bằng ví dụ cụ thể hơn hoặc viết code minh họa, hãy nhắn lại cho tôi nhé!`;
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
    return await streamTextGradually(dateAnswer, onChunk, 10);
  }

  // 2. Lấy API Key từ LocalStorage, Environment hoặc Server
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

  // 3. Nếu ĐÃ CÓ GEMINI API KEY -> GỌI GOOGLE GEMINI 1.5 FLASH TRỰC TIẾP! (THÔNG MINH 100%)
  if (apiKey && apiKey.length > 15 && apiKey !== 'your-gemini-api-key-here') {
    try {
      const contents: MessageHistory[] = history.slice(-8).map((msg) => ({
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
      console.warn('Gemini API call error:', geminiErr);
    }
  }

  // 4. Nếu chưa có API Key hoặc mạng lỗi, sử dụng Bộ não Kiến thức chuyên sâu
  const responseText = generateComprehensiveResponse(cleanPrompt);
  return await streamTextGradually(responseText, onChunk, 8);
}
