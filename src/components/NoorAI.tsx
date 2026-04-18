import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, RefreshCw, MessageSquare, Sparkles, Wand2 } from 'lucide-react';
import { askNoorAI, askNoorAIStream, ai } from '../lib/gemini';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export default function NoorAI() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('noor_ai_messages');
    if (saved) {
      return JSON.parse(saved).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
    }
    return [{
      id: 'welcome',
      role: 'model',
      text: 'السلام عليكم ورحمة الله وبركاته. أنا "نور"، مساعدك الذكي. كيف يمكنني مساعدتك اليوم في رحلتك الإيمانية؟',
      timestamp: new Date()
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('noor_ai_messages', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const messageText = input.trim();
    if (!messageText || isLoading) return;

    if (!ai) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'user',
        text: messageText,
        timestamp: new Date()
      }, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "عذراً، يبدو أن مفتاح البرمجة (API Key) غير مهيأ. يرجى مراجعة إعدادات المشروع وإضافة مفتاح Gemini.",
        timestamp: new Date()
      }]);
      setInput('');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const chatHistory = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

    try {
      const modelId = Date.now().toString() + "-ai";
      // Add placeholder message for streaming
      setMessages(prev => [...prev, {
        id: modelId,
        role: 'model',
        text: '...',
        timestamp: new Date()
      }]);

      const stream = await askNoorAIStream(messageText, chatHistory);
      let fullText = '';
      let isFirstChunk = true;
      
      for await (const chunk of stream) {
        const text = chunk.text;
        if (text) {
          if (isFirstChunk) {
            fullText = text;
            isFirstChunk = false;
          } else {
            fullText += text;
          }
          
          setMessages(prev => prev.map(m => 
            m.id === modelId ? { ...m, text: fullText } : m
          ));
        }
      }
    } catch (err: any) {
      console.error("Chat UI error:", err);
      const errorMessage = err.message?.includes("API_KEY") 
        ? "عذراً، يبدو أن مفتاح البرمجة (API Key) غير مهيأ. يرجى مراجعة الإعدادات."
        : "عذراً، واجهت مشكلة في الاتصال بمساعد نور. يرجى المحاولة مرة أخرى.";
      
      setMessages(prev => {
        const filtered = prev.filter(m => !m.text || m.text === '...');
        return [...filtered.slice(0, -1), {
          id: Date.now().toString(),
          role: 'model',
          text: errorMessage,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('هل تريد مسح المحادثة؟')) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: 'السلام عليكم ورحمة الله وبركاته. أنا "نور"، مساعدك الذكي. كيف يمكنني مساعدتك اليوم في رحلتك الإيمانية؟',
        timestamp: new Date()
      }]);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-sacred-ink">نور الذكي</h3>
            <p className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold">Noor AI Assistant</p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-red-50 text-sacred-ink/30 hover:text-red-500 rounded-full transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto space-y-6 px-10 scrollbar-hide min-h-[400px]">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              "flex w-full mb-4",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[85%] md:max-w-[70%] lg:max-w-[60%] p-4 rounded-3xl text-sm leading-relaxed relative group",
              msg.role === 'user' 
                ? "bg-sacred-gold/10 text-sacred-ink rounded-tr-none border border-sacred-gold/10" 
                : "bg-white text-sacred-ink rounded-tl-none border border-sacred-gold/5 shadow-sm"
            )}>
              {msg.text}
              <span className="block text-[8px] mt-2 opacity-30 text-left">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              
              <div className={cn(
                "absolute top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                msg.role === 'user' ? "-right-10 bg-sacred-gold/20" : "-left-10 bg-sacred-green/10"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-sacred-gold" /> : <Bot className="w-4 h-4 text-sacred-green" />}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start w-full"
          >
            <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-sacred-gold/5 shadow-sm flex gap-1 relative ml-10">
              <div className="absolute top-0 -left-10 w-8 h-8 rounded-full bg-sacred-green/10 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-sacred-green" />
              </div>
              <span className="w-1.5 h-1.5 bg-sacred-gold/40 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-sacred-gold/40 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-sacred-gold/40 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </motion.div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="relative mt-auto">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اسأل نور عن أي شيء..."
          className="w-full bg-white border border-sacred-gold/10 rounded-2xl py-4 pl-14 pr-4 text-sm focus:outline-none focus:border-sacred-gold/30 transition-all shadow-sm"
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-sacred-gold text-white rounded-xl flex items-center justify-center hover:bg-sacred-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-[10px] text-sacred-ink/30 italic">
        <Sparkles className="w-3 h-3" />
        <span>مدعوم بتقنيات الذكاء الاصطناعي المتقدمة</span>
      </div>
    </div>
  );
}
