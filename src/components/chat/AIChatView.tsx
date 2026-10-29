import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Plus, Sparkles, User, RefreshCw, Terminal, Check, Copy } from 'lucide-react';
import { AIMessage, AIConversation } from '../../types/database';
import { streamGeminiAI } from '../../lib/geminiAI';
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

    // Update state with user message and empty assistant message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          // Cập nhật title hội thoại nếu là tin nhắn đầu tiên
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
    <div className="flex-1 h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 select-none overflow-hidden">
      
      {/* AI Conversations Sidebar (Left) */}
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

          {/* Conversation history list */}
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

      {/* Main AI Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
        
        {/* Header */}
        <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
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
                <span>Sẵn sàng giải đáp 24/7</span>
              </p>
            </div>
          </div>
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
                  className={`p-4 rounded-2xl text-sm leading-relaxed max-w-[85%] sm:max-w-[75%] shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none text-sm space-y-2">
                      <ReactMarkdown
                        components={{
                          code({ node, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '');
                            const codeString = String(children).replace(/\n$/, '');
                            return (
                              <div className="relative my-2 rounded-xl overflow-hidden bg-slate-900 text-slate-100 font-mono text-xs border border-slate-700">
                                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700 text-slate-400">
                                  <span>{match ? match[1] : 'code'}</span>
                                  <button
                                    onClick={() => copyToClipboard(codeString)}
                                    className="hover:text-white transition-colors"
                                  >
                                    {copiedCode === codeString ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <pre className="p-3 overflow-x-auto">
                                  <code>{children}</code>
                                </pre>
                              </div>
                            );
                          },
                        }}
                      >
                        {m.content || 'Đang tạo câu trả lời...'}
                      </ReactMarkdown>

                      {m.is_streaming && (
                        <div className="flex items-center gap-1.5 text-xs text-violet-500 pt-1">
                          <span className="w-2 h-2 rounded-full bg-violet-500 animate-ping" />
                          <span>Đang suy nghĩ...</span>
                        </div>
                      )}
                    </div>
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
              placeholder="Đặt câu hỏi cho AI (ví dụ: giải thích thuật toán, viết thư mời, dịch văn bản)..."
              className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              type="submit"
              disabled={!promptInput.trim() || isGenerating}
              className="p-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-40 transition-all shadow-md shadow-violet-500/20"
              title="Gửi câu hỏi"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
