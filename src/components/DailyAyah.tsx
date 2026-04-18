import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Play, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { db, type Surah, type Ayah } from '../lib/db';
import { getAyahExplanation } from '../lib/gemini';
import { playQuranAudio } from './AudioPlayer';
import { cn } from '../lib/utils';

export default function DailyAyah() {
  const [ayah, setAyah] = useState<{ ayah: Ayah, surah: Surah } | null>(null);
  const [tafsir, setTafsir] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTafsir, setShowTafsir] = useState(false);

  const fetchDailyAyah = async () => {
    setIsLoading(true);
    setTafsir(null);
    setShowTafsir(false);
    
    try {
      const surahs = await db.surahs.toArray();
      if (surahs.length === 0) return;
      
      const randomSurah = surahs[Math.floor(Math.random() * surahs.length)];
      const ayahs = await db.ayahs.where('surahId').equals(randomSurah.id).toArray();
      
      if (ayahs.length === 0) {
        // Fallback if ayahs aren't loaded for this surah yet
        setIsLoading(false);
        return;
      }

      const randomAyah = ayahs[Math.floor(Math.random() * ayahs.length)];
      setAyah({ ayah: randomAyah, surah: randomSurah });
      
      const explanation = await getAyahExplanation(randomAyah.text, randomSurah.name, randomAyah.numberInSurah);
      setTafsir(explanation);
    } catch (error) {
      console.error("Failed to fetch daily ayah:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyAyah();
  }, []);

  if (isLoading && !ayah) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 py-12">
        <RefreshCw className="w-8 h-8 text-sacred-gold animate-spin" />
        <p className="text-sm text-sacred-ink/60 font-bold">جاري اختيار آية اليوم...</p>
      </div>
    );
  }

  if (!ayah) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-sm text-sacred-ink/60">يرجى تحميل بيانات المصحف أولاً.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-sacred-gold/10 rounded-full mb-2">
          <Sparkles className="w-3 h-3 text-sacred-gold" />
          <span className="text-[10px] font-black text-sacred-gold uppercase tracking-widest">آية اليوم</span>
        </div>
        <h2 className="text-xl font-display font-bold">تأملات قرآنية</h2>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 flex flex-col items-center space-y-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-gold/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-sacred-green/5 rounded-full -ml-16 -mb-16 blur-2xl" />

        <div className="text-center space-y-6 z-10 w-full">
          <p className="font-quran text-2xl leading-loose text-sacred-ink">
            {ayah.ayah.text}
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-8 bg-sacred-gold/20" />
              <p className="text-xs font-bold text-sacred-gold">
                سورة {ayah.surah.name} - آية {ayah.ayah.numberInSurah}
              </p>
              <div className="h-[1px] w-8 bg-sacred-gold/20" />
            </div>
            
            {tafsir?.translation && (
              <p className="text-xs text-sacred-ink/50 italic font-medium max-w-[80%] mx-auto leading-relaxed">
                "{tafsir.translation}"
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 z-10">
          <button 
            onClick={() => playQuranAudio(
              `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.ayah.id}.mp3`,
              `آية ${ayah.ayah.numberInSurah}`,
              `سورة ${ayah.surah.name}`
            )}
            className="w-12 h-12 rounded-full bg-sacred-gold text-white flex items-center justify-center shadow-lg shadow-sacred-gold/20 hover:scale-110 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
          </button>
          <button 
            onClick={() => setShowTafsir(!showTafsir)}
            className={cn(
              "px-6 py-3 rounded-2xl text-xs font-bold transition-all flex items-center gap-2",
              showTafsir ? "bg-sacred-ink text-white" : "bg-white border border-sacred-gold/10 text-sacred-ink shadow-sm"
            )}
          >
            {showTafsir ? "إخفاء التفسير" : "عرض التفسير"}
            {showTafsir ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        <AnimatePresence>
          {showTafsir && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="w-full overflow-hidden z-10"
            >
              <div className="pt-6 space-y-6 border-t border-sacred-gold/10">
                {tafsir ? (
                  <div className="space-y-6 text-right">
                    <div>
                      <h4 className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mb-2">المعنى العام</h4>
                      <p className="text-sm text-sacred-ink/70 leading-relaxed">{tafsir.meaning}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mb-2">الدرس المستفاد</h4>
                      <p className="text-sm text-sacred-ink/70 leading-relaxed">{tafsir.lesson}</p>
                    </div>
                    <div className="bg-sacred-green/5 p-5 rounded-3xl border border-sacred-green/10">
                      <h4 className="text-[10px] font-black text-sacred-green uppercase tracking-widest mb-2">تطبيق حياتي</h4>
                      <p className="text-sm font-bold text-sacred-green leading-relaxed">{tafsir.application}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 gap-3">
                    <RefreshCw className="w-5 h-5 text-sacred-gold animate-spin" />
                    <p className="text-[10px] text-sacred-gold font-bold animate-pulse">جاري استحضار التفسير...</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        onClick={fetchDailyAyah}
        disabled={isLoading}
        className="flex items-center gap-2 text-[10px] text-sacred-gold font-bold self-center hover:underline disabled:opacity-50"
      >
        <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
        آية أخرى
      </button>
    </div>
  );
}
