import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Quote, Heart, Trophy } from 'lucide-react';
import { getDailyWisdom, ai } from '../lib/gemini';

interface Wisdom {
  title: string;
  source: string;
  content: string;
  reflection: string;
  challenge: string;
}

export default function DailyWisdom() {
  const [wisdom, setWisdom] = useState<Wisdom | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWisdom = async () => {
    if (!ai) return;
    setIsLoading(true);
    const data = await getDailyWisdom();
    if (data) {
      setWisdom(data);
      localStorage.setItem('noor_daily_wisdom', JSON.stringify(data));
      localStorage.setItem('noor_wisdom_date', new Date().toDateString());
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const savedWisdom = localStorage.getItem('noor_daily_wisdom');
    const savedDate = localStorage.getItem('noor_wisdom_date');
    const today = new Date().toDateString();

    if (savedWisdom && savedDate === today) {
      setWisdom(JSON.parse(savedWisdom));
    } else {
      fetchWisdom();
    }
  }, []);

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 border border-sacred-gold/10 shadow-sm relative overflow-hidden group">
      {/* Background Decoration */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-sacred-gold/5 rounded-full blur-3xl group-hover:bg-sacred-gold/10 transition-all duration-1000" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-sacred-gold/10 flex items-center justify-center text-sacred-gold">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-display font-bold text-sacred-ink">إلهام اليوم</h3>
              <p className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold">Daily Inspiration</p>
            </div>
          </div>
          <button 
            onClick={fetchWisdom}
            disabled={isLoading}
            className="p-3 hover:bg-sacred-gold/10 rounded-full transition-all text-sacred-gold disabled:opacity-50"
          >
            <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4 py-8"
            >
              <div className="h-4 bg-sacred-gold/5 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-sacred-gold/5 rounded-full w-full animate-pulse" />
              <div className="h-4 bg-sacred-gold/5 rounded-full w-1/2 animate-pulse" />
            </motion.div>
          ) : wisdom ? (
            <motion.div 
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="relative">
                <Quote className="absolute -right-4 -top-4 w-12 h-12 text-sacred-gold/10 rotate-180" />
                <p className="text-2xl font-quran leading-[1.8] text-sacred-ink text-right pr-6">
                  {wisdom.content}
                </p>
                <p className="text-xs text-sacred-gold font-bold mt-4 text-left">
                  — {wisdom.source}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 p-6 rounded-3xl border border-sacred-gold/5">
                  <div className="flex items-center gap-2 mb-3 text-sacred-gold">
                    <Heart className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">تأمل</span>
                  </div>
                  <p className="text-sm text-sacred-ink/70 leading-relaxed">
                    {wisdom.reflection}
                  </p>
                </div>

                <div className="bg-sacred-gold/5 p-6 rounded-3xl border border-sacred-gold/10">
                  <div className="flex items-center gap-2 mb-3 text-sacred-gold">
                    <Trophy className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">تحدي اليوم</span>
                  </div>
                  <p className="text-sm font-bold text-sacred-ink leading-relaxed">
                    {wisdom.challenge}
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

import { cn } from '../lib/utils';
