/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Moon, 
  Book, 
  Info, 
  MoreVertical, 
  User, 
  Bot,
  RefreshCw,
  ChevronLeft,
  Settings,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { GoogleGenAI } from "@google/genai";

// System Prompt
const SYSTEM_PROMPT = `You are a respectful and knowledgeable Islamic assistant. You answer questions based strictly on the Quran and authentic Sunnah (Sahih Hadith). You MUST NOT give Fatwas (religious rulings). If a question is too complex, involves Fiqh disagreements, or you are unsure, you must politely say Allahu A'lam (God knows best) and advise the user to consult a verified Islamic scholar. Always be polite, calm, and use proper Arabic.`;

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content: "السلام عليكم ورحمة الله وبركاته. أنا نور، مساعدك الإسلامي. كيف يمكنني مساعدتك اليوم؟",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const result = await chat.sendMessage({ message: input });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: result.text || "عذراً، حدث خطأ ما. يرجى المحاولة مرة أخرى.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: "عذراً، حدث خطأ في الاتصال. يرجى التحقق من اتصالك بالإنترنت.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-emerald-950 text-white p-4 shadow-lg flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gold p-2 rounded-full shadow-inner">
            <Moon className="w-6 h-6 text-emerald-950 fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Noor AI - مساعدك الإسلامي</h1>
            <p className="text-xs text-emerald-200 opacity-80">نور المعرفة في قلبك</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-emerald-900 rounded-full transition-colors">
            <Book className="w-5 h-5 text-gold" />
          </button>
          <button className="p-2 hover:bg-emerald-900 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-emerald-200" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 max-w-[85%] sm:max-w-[70%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
                  message.role === "user" ? "bg-emerald-900" : "bg-gold"
                }`}>
                  {message.role === "user" ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-emerald-950" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`relative p-4 rounded-2xl shadow-sm ${
                  message.role === "user" 
                    ? "bg-emerald-900 text-white rounded-tr-none" 
                    : "bg-white text-gray-800 border border-emerald-100 rounded-tl-none"
                }`}>
                  <div className={`text-sm leading-relaxed ${isArabic(message.content) ? "arabic-text text-lg" : ""}`}>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <div className={`text-[10px] mt-2 opacity-60 ${message.role === "user" ? "text-right" : "text-left"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 items-center bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
              <RefreshCw className="w-4 h-4 text-emerald-900 animate-spin" />
              <span className="text-xs text-emerald-900 font-medium">نور يفكر...</span>
            </div>
          </motion.div>
        )}
      </main>

      {/* Input Area */}
      <footer className="p-4 bg-white border-t border-emerald-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="اكتب سؤالك هنا..."
              className="w-full p-4 pr-12 bg-emerald-50 border border-emerald-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-900/20 focus:border-emerald-900 transition-all resize-none arabic-text text-lg min-h-[56px] max-h-32"
              rows={1}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button className="p-2 text-emerald-900/40 hover:text-emerald-900 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`p-4 rounded-2xl shadow-md transition-all ${
              !input.trim() || isLoading 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-emerald-950 text-white hover:bg-emerald-900 active:scale-95"
            }`}
          >
            <Send className={`w-6 h-6 ${isArabic(input) ? "rotate-180" : ""}`} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-3 text-gray-400">
          هذا المساعد للتعلم فقط. يرجى استشارة العلماء في المسائل الفقهية المعقدة.
        </p>
      </footer>
    </div>
  );
}
