import { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronLeft, ChevronRight, BookOpen, Play, Info, Sparkles, X, LayoutGrid, List } from 'lucide-react';
import { db, type Surah, type Ayah } from '../lib/db';
import { cn } from '../lib/utils';
import { getAyahExplanation } from '../lib/gemini';
import { playQuranAudio } from './AudioPlayer';
import Fuse from 'fuse.js';
import DailyAyah from './DailyAyah';

interface Props {
  hasData: boolean;
  onSync: () => void;
}

export default function QuranReader({ hasData, onSync }: Props) {
  const [view, setView] = useState<'index' | 'daily'>(() => {
    return (localStorage.getItem('noor_quran_view') as 'index' | 'daily') || 'index';
  });
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('noor_quran_font_size') || '24');
  });
  
  const [selectedAyahForTafsir, setSelectedAyahForTafsir] = useState<{ ayah: Ayah, surahName: string } | null>(null);
  const [tafsir, setTafsir] = useState<any>(null);
  const [isTafsirLoading, setIsTafsirLoading] = useState(false);

  const handleShowTafsir = async (ayah: Ayah, surahName: string) => {
    setSelectedAyahForTafsir({ ayah, surahName });
    setIsTafsirLoading(true);
    setTafsir(null);
    const data = await getAyahExplanation(ayah.text, surahName, ayah.numberInSurah);
    setTafsir(data);
    setIsTafsirLoading(false);
  };
  
  const surahs = useLiveQuery(
    () => db.surahs.toArray(),
    []
  );

  useEffect(() => {
    localStorage.setItem('noor_quran_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('noor_quran_view', view);
  }, [view]);

  useEffect(() => {
    const savedSurahId = localStorage.getItem('noor_last_surah');
    if (savedSurahId && surahs) {
      const surah = surahs.find(s => s.id === parseInt(savedSurahId));
      if (surah) setSelectedSurah(surah);
    }
  }, [surahs]);

  const handleSurahSelect = (surah: Surah | null) => {
    setSelectedSurah(surah);
    // Hide/Show navigation bar
    window.dispatchEvent(new CustomEvent('toggle-nav', {
      detail: { visible: surah === null }
    }));
    
    if (surah) {
      localStorage.setItem('noor_last_surah', surah.id.toString());
      // Scroll to top when surah changes
      const readerContainer = document.querySelector('.reader-container');
      if (readerContainer) readerContainer.scrollTop = 0;
    } else {
      localStorage.removeItem('noor_last_surah');
    }
  };

  const navigateSurah = (direction: 'prev' | 'next') => {
    if (!selectedSurah || !surahs) return;
    const currentIndex = surahs.findIndex(s => s.id === selectedSurah.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    
    if (nextIndex >= 0 && nextIndex < surahs.length) {
      handleSurahSelect(surahs[nextIndex]);
    }
  };

  const ayahs = useLiveQuery(
    () => selectedSurah ? db.ayahs.where('surahId').equals(selectedSurah.id).toArray() : [],
    [selectedSurah]
  );

  const fuse = useMemo(() => {
    if (!surahs) return null;
    return new Fuse(surahs, {
      keys: ['name', 'englishName', 'englishNameTranslation'],
      threshold: 0.4,
      distance: 100,
      ignoreLocation: true
    });
  }, [surahs]);

  const filteredSurahs = useMemo(() => {
    if (!surahs) return [];
    if (!searchQuery.trim()) return surahs;
    if (!fuse) return surahs;
    
    return fuse.search(searchQuery).map(result => result.item);
  }, [surahs, searchQuery, fuse]);

  const stats = useMemo(() => {
    if (!surahs) return { totalSurahs: 0, totalAyahs: 0 };
    return {
      totalSurahs: surahs.length,
      totalAyahs: surahs.reduce((acc, s) => acc + s.numberOfAyahs, 0)
    };
  }, [surahs]);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
        <div className="w-20 h-20 bg-sacred-gold/10 rounded-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-sacred-gold" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold">المصحف الشريف</h3>
          <p className="text-sm text-sacred-ink/60 mt-2">يرجى تحميل بيانات المصحف للبدء في القراءة بدون إنترنت.</p>
        </div>
        <button onClick={onSync} className="sacred-button">تحميل الآن</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <AnimatePresence mode="wait">
        {!selectedSurah ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* View Toggle */}
            <div className="flex bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-sacred-gold/10 self-center mb-6">
              <button
                onClick={() => setView('index')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  view === 'index' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
                )}
              >
                فهرس السور
              </button>
              <button
                onClick={() => setView('daily')}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all",
                  view === 'daily' ? "bg-sacred-gold text-white shadow-md" : "text-sacred-ink/40 hover:text-sacred-ink"
                )}
              >
                آية اليوم
              </button>
            </div>

            {view === 'index' ? (
              <>
                {/* Search */}
                <div className="space-y-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-display font-bold text-sacred-ink">فهرس السور</h3>
                      <p className="text-[10px] text-sacred-ink/40 font-bold uppercase tracking-widest">Surah Index</p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-[10px] text-sacred-ink/40 font-bold uppercase">السور</p>
                        <p className="text-sm font-display font-bold text-sacred-gold">{stats.totalSurahs}</p>
                      </div>
                      <div className="w-[1px] h-8 bg-sacred-gold/10" />
                      <div>
                        <p className="text-[10px] text-sacred-ink/40 font-bold uppercase">الآيات</p>
                        <p className="text-sm font-display font-bold text-sacred-gold">{stats.totalAyahs}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sacred-ink/30" />
                    <input 
                      type="text"
                      placeholder="ابحث عن سورة..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/50 border border-sacred-gold/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-sacred-gold/30 transition-all"
                    />
                  </div>
                </div>

                {/* Surah List */}
                <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-1 scrollbar-hide pb-4">
                  {filteredSurahs?.map((surah) => (
                    <button
                      key={surah.id}
                      onClick={() => handleSurahSelect(surah)}
                      className="w-full flex justify-between items-center p-4 bg-white/40 hover:bg-white/60 rounded-2xl transition-all group border border-transparent hover:border-sacred-gold/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-sacred-gold/10 flex items-center justify-center font-display font-bold text-sacred-gold group-hover:bg-sacred-gold group-hover:text-white transition-all">
                          {surah.id}
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-sm">{surah.englishName}</h4>
                          <p className="text-[10px] text-sacred-ink/40">{surah.englishNameTranslation}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <h4 className="font-quran text-lg font-bold">{surah.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tighter",
                            surah.revelationType === 'Meccan' ? "bg-orange-50 text-orange-600" : "bg-sacred-green/10 text-sacred-green"
                          )}>
                            {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}
                          </span>
                          <p className="text-[10px] text-sacred-ink/40">{surah.numberOfAyahs} آية</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <DailyAyah />
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="reader"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col h-full"
          >
            {/* Reader Header */}
            <div className="flex items-center justify-between mb-4 bg-white/40 p-2 rounded-2xl border border-sacred-gold/5">
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => handleSurahSelect(null)}
                  className="p-2 hover:bg-sacred-gold/10 rounded-full transition-all"
                  title="العودة للفهرس"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="flex items-center bg-sacred-gold/5 rounded-xl p-1">
                  <button 
                    onClick={() => navigateSurah('prev')}
                    disabled={selectedSurah.id === 1}
                    className="p-1.5 hover:bg-white rounded-lg transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                    title="السورة السابقة"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigateSurah('next')}
                    disabled={selectedSurah.id === 114}
                    className="p-1.5 hover:bg-white rounded-lg transition-all disabled:opacity-20 disabled:hover:bg-transparent"
                    title="السورة التالية"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-center">
                <h3 className="font-quran text-2xl font-bold">{selectedSurah.name}</h3>
                <p className="text-[10px] uppercase tracking-widest text-sacred-gold font-bold">{selectedSurah.englishName}</p>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setFontSize(prev => Math.max(16, prev - 2))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-sacred-gold/10 rounded-full transition-all text-xs font-bold"
                >
                  A-
                </button>
                <button 
                  onClick={() => setFontSize(prev => Math.min(48, prev + 2))}
                  className="w-8 h-8 flex items-center justify-center hover:bg-sacred-gold/10 rounded-full transition-all text-sm font-bold"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Ayahs */}
            <div className="flex-1 overflow-y-auto space-y-8 px-2 py-4 scrollbar-hide reader-container">
              {selectedSurah.id !== 1 && selectedSurah.id !== 9 && (
                <div className="text-center font-quran text-3xl mb-12 text-sacred-gold py-4 border-y border-sacred-gold/5">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}
              {ayahs?.map((ayah) => (
                <div key={ayah.id} className="group relative border-b border-sacred-gold/5 pb-8 last:border-0">
                  <p 
                    className="quran-text leading-[2.5] text-sacred-ink/90 text-right"
                    style={{ fontSize: `${fontSize}px` }}
                  >
                    {ayah.text}
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-sacred-gold/20 text-[12px] font-display font-black mx-3 text-sacred-gold bg-sacred-gold/5">
                      {ayah.numberInSurah}
                    </span>
                  </p>
                  <div className="absolute -left-2 top-0 opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2">
                    <button 
                      onClick={() => playQuranAudio(
                        `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.id}.mp3`,
                        `آية ${ayah.numberInSurah}`,
                        `سورة ${selectedSurah.name}`
                      )}
                      className="p-2.5 bg-white shadow-md rounded-xl text-sacred-gold hover:bg-sacred-gold hover:text-white transition-all border border-sacred-gold/10"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button 
                      onClick={() => handleShowTafsir(ayah, selectedSurah.name)}
                      className="p-2.5 bg-white shadow-md rounded-xl text-sacred-green hover:bg-sacred-green hover:text-white transition-all border border-sacred-gold/10"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tafsir Modal */}
            <AnimatePresence>
              {selectedAyahForTafsir && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex items-end justify-center p-4 bg-sacred-ink/20 backdrop-blur-sm"
                  onClick={() => setSelectedAyahForTafsir(null)}
                >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="w-full max-w-md bg-white rounded-t-[3rem] p-8 shadow-2xl relative"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="w-12 h-1 bg-sacred-gold/20 rounded-full mx-auto mb-6" />
                    
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-sacred-green/10 flex items-center justify-center text-sacred-green">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sacred-ink">تفسير الذكاء الاصطناعي</h4>
                          <p className="text-[10px] text-sacred-ink/40">سورة {selectedAyahForTafsir.surahName} - آية {selectedAyahForTafsir.ayah.numberInSurah}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedAyahForTafsir(null)}
                        className="p-2 hover:bg-sacred-gold/10 rounded-full transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto space-y-6 pr-2 scrollbar-hide">
                      <div className="bg-sacred-gold/5 p-6 rounded-3xl border border-sacred-gold/10">
                        <p className="font-quran text-xl text-right text-sacred-ink leading-relaxed">
                          {selectedAyahForTafsir.ayah.text}
                        </p>
                      </div>

                      {isTafsirLoading ? (
                        <div className="space-y-4 py-4">
                          <div className="h-4 bg-sacred-gold/5 rounded-full w-3/4 animate-pulse" />
                          <div className="h-4 bg-sacred-gold/5 rounded-full w-full animate-pulse" />
                          <div className="h-4 bg-sacred-gold/5 rounded-full w-1/2 animate-pulse" />
                        </div>
                      ) : tafsir ? (
                        <div className="space-y-6">
                          <div>
                            <h5 className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mb-2">المعنى العام</h5>
                            <p className="text-sm text-sacred-ink/70 leading-relaxed">{tafsir.meaning}</p>
                          </div>
                          <div>
                            <h5 className="text-[10px] font-black text-sacred-gold uppercase tracking-widest mb-2">الدرس الروحي</h5>
                            <p className="text-sm text-sacred-ink/70 leading-relaxed">{tafsir.lesson}</p>
                          </div>
                          <div className="bg-sacred-green/5 p-4 rounded-2xl border border-sacred-green/10">
                            <h5 className="text-[10px] font-black text-sacred-green uppercase tracking-widest mb-2">التطبيق العملي</h5>
                            <p className="text-sm font-bold text-sacred-green leading-relaxed">{tafsir.application}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-sacred-ink/40 italic py-8">فشل تحميل التفسير. يرجى المحاولة مرة أخرى.</p>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
