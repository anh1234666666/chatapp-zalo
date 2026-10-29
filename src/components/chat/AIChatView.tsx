import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, Sparkles, User, Key, Check, Copy, ExternalLink, X } from 'lucide-react';
import { AIMessage, AIConversation } from '../../types/database';
import { streamGeminiAI, getActiveGeminiKey, setActiveGeminiKey } from '../../lib/geminiAI';
import ReactMarkdown from 'react-markdown';

export const AIChatView: React.FC = () => {
  const [conversations, setConversations] = useState<AIConversation[]>([
    {
      id: 'default-conv',
      user_id: 'current-user',
      title: 'Hỏi đáp kỹ thuật Chat App',
      created_at: new Date().toISOString(),
      messages: [
        {
          id: 'init-1',
          ai_conversation_id: 'default-conv',
          role: 'assistant',
          content: 'Xin chào! Tôi là **Trợ lý Trí Tuệ Nhân Tạo (Gemini AI)** của Chat App.\n\nTôi có thể giúp bạn giải đáp các vấn đề lập trình, giải thích kiến thức, viết nội dung hoặc tóm tắt tài liệu. Hôm nay bạn cần tôi hỗ trợ điều gì?',
          created_at: new Date().toISOString(),
        },
      ],
    },
  ]);

  const [activeConvId, setActiveConvId] = useState<string>('default-conv');
  const [promptInput, setPromptInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal quản lý Gemini API Key
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const key = getActiveGeminiKey();
    setHasApiKey(Boolean(key && key.length > 15));
  }, []);

  const handleSaveApiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (geminiKeyInput.trim()) {
      setActiveGeminiKey(geminiKeyInput.trim());
      setHasApiKey(true);
      setShowKeyModal(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0];
  const messages = activeConv?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleCreateNewConversation = () => {
    const newId = 'ai-conv-' + Date.now();
    const newConv: AIConversation = {
      id: newId,
      user_id: 'current-user',
      title: 'Hội thoại mới ' + (conversations.length + 1),
      created_at: new Date().toISOString(),
      messages: [
        {
          id: 'msg-' + Date.now(),
          ai_conversation_id: newId,
          role: 'assistant',
          content: 'Cuộc trò chuyện mới đã bắt đầu! Hãy nhập câu hỏi hoặc yêu cầu của bạn bên dưới.',
          created_at: new Date().toISOString(),
        },
      ],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
  };

  const handleSendPrompt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promptInput.trim() || isGenerating) return;

    const userText = promptInput.trim();
    setPromptInput('');

    const userMsgId = 'u-' + Date.now();
    const assistantMsgId = 'a-' + Date.now();

    const userMsg: AIMessage = {
      id: userMsgId,
      ai_conversation_id: activeConv.id,
      role: 'user',
      content: userText,
      created_at: new Date().toISOString(),
    };

    const initialAssistantMsg: AIMessage = {
      id: assistantMsgId,
      ai_conversation_id: activeConv.id,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
      is_streaming: true,
    };

    // Cập nhật giao diện với tin nhắn của người dùng và tin nhắn trống của trợ lý
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          const newTitle = c.messages?.length === 1 ? userText.slice(0, 30) + '...' : c.title;
          return {
            ...c,
            title: newTitle,
            messages: [...(c.messages || []), userMsg, initialAssistantMsg],
          };
        }
        return c;
      })
    );

    setIsGenerating(true);

    try {
      const historyForAI = (activeConv.messages || []).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      await streamGeminiAI(userText, historyForAI, (chunkText) => {
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConv.id) {
              return {
                ...c,
                messages: (c.messages || []).map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: chunkText, is_streaming: true }
                    : m
                ),
              };
            }
            return c;
          })
        );
      });
    } catch (err: any) {
      console.error('Lỗi sinh phản hồi AI:', err);
    } finally {
      setIsGenerating(false);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConv.id) {
            return {
              ...c,
              messages: (c.messages || []).map((m) =>
                m.id === assistantMsgId ? { ...m, is_streaming: false } : m
              ),
            };
          }
          return c;
        })
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 select-none overflow-hidden relative">
      
      {/* 1. AI Conversations Sidebar (Left) */}
      <div className="w-full md:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-violet-600" />
              <span>Trợ Lý Gemini AI</span>
            </h3>
            <span className="text-[10px] bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 font-bold px-2 py-0.5 rounded-full">
              v1.5 Flash
            </span>
          </div>

          <button
            onClick={handleCreateNewConversation}
            className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-violet-500/20 transition-all mb-4"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo cuộc trò chuyện mới</span>
          </button>

          {/* Danh sách các cuộc trò chuyện */}
          <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveConvId(c.id)}
                className={`w-full text-left p-3 rounded-xl text-xs font-medium truncate transition-colors ${
                  c.id === activeConvId
                    ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-900'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>Hỗ trợ Markdown & Streaming thời gian thực</span>
        </div>
      </div>

      {/* 2. Main AI Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
        
        {/* Header */}
        <div className="h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                {activeConv?.title || 'Trợ lý AI'}
              </h4>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{hasApiKey ? 'Gemini 1.5 Flash Đã Kích Hoạt' : 'Sẵn sàng giải đáp 24/7'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setGeminiKeyInput(getActiveGeminiKey());
              setShowKeyModal(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all shadow-xs ${
              hasApiKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600 animate-pulse'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{hasApiKey ? '✓ Đã kết nối Gemini' : '🔑 Kích hoạt Gemini 1.5'}</span>
          </button>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex items-start gap-3.5 ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Content */}
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[88%] sm:max-w-[78%] shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/60 dark:border-slate-700/60'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-pre:my-2">
                      <ReactMarkdown
                        components={{
                          code({ className, children, ...props }) {
                            const codeString = String(children).replace(/\n$/, '');
                            const isInline = !className && !String(children).includes('\n');
                            if (isInline) {
                              return (
                                <code className="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-xs text-violet-600 dark:text-violet-300 font-mono" {...props}>
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <div className="relative group my-2">
                                <div className="absolute right-2 top-2 z-10">
                                  <button
                                    onClick={() => copyToClipboard(codeString)}
                                    className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Sao chép code"
                                  >
                                    {copiedCode === codeString ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs font-mono border border-slate-800">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                        }}
                      >
                        {m.content || '...'}
                      </ReactMarkdown>
                    </div>
                  )}

                  {m.is_streaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-violet-500 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input prompt area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <form onSubmit={handleSendPrompt} className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              type="text"
              value={promptInput}
              disabled={isGenerating}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Đặt bất kỳ câu hỏi nào (Toán, Lý, Văn học, Lập trình, Đời sống)..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={!promptInput.trim() || isGenerating}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-40 transition-all shadow-md shadow-violet-500/20 hover:scale-105 active:scale-95"
              title="Gửi câu hỏi"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>

      {/* 3. Modal Kích hoạt Google Gemini 1.5 Flash */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowKeyModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/30">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Cài đặt Google Gemini Key</h3>
                <p className="text-xs text-slate-500">Mở khóa trí tuệ nhân tạo toàn năng miễn phí 100%</p>
              </div>
            </div>

            <div className="p-3.5 bg-violet-50 dark:bg-violet-950/40 rounded-2xl border border-violet-200 dark:border-violet-900 mb-4 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <p className="font-bold text-violet-700 dark:text-violet-300">🔑 Cách lấy API Key miễn phí trong 30 giây:</p>
              <ol className="list-decimal pl-4 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Truy cập <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline inline-flex items-center gap-0.5">Google AI Studio <ExternalLink className="w-3 h-3" /></a></li>
                <li>Bấm <b>Create API key</b> (Tạo khóa API)</li>
                <li>Sao chép mã khóa (dạng <code className="text-violet-600 font-mono">AIzaSy...</code>) và dán vào ô bên dưới:</li>
              </ol>
            </div>

            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Gemini API Key của bạn:
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="Dán mã AIzaSy... vào đây"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!geminiKeyInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-violet-500/20 transition-all"
                >
                  Lưu & Kích hoạt ngay
                </button>
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
