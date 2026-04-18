import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Square, RefreshCw, CheckCircle2, AlertCircle, Volume2, Square as StopIcon, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { checkRecitation, ai } from '../lib/gemini';
import { cn } from '../lib/utils';
import { db, type Surah, type Ayah } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { playQuranAudio } from './AudioPlayer';

export default function RecitationCheck() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedAyahIndex, setSelectedAyahIndex] = useState<number>(0);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [showSurahList, setShowSurahList] = useState(false);
  const [recitationMode, setRecitationMode] = useState<'ayah' | 'page'>('ayah');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const surahs = useLiveQuery(() => db.surahs.toArray(), []);

  useEffect(() => {
    if (selectedSurah) {
      loadSurahText(selectedSurah.id);
    }
  }, [selectedSurah]);

  const loadSurahText = async (id: number) => {
    const ayahsData = await db.ayahs.where('surahId').equals(id).toArray();
    setAyahs(ayahsData);
    setSelectedAyahIndex(0);
  };

  const currentAyah = ayahs[selectedAyahIndex];
  
  const currentBlock = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];
    const start = Math.floor(selectedAyahIndex / 10) * 10;
    return ayahs.slice(start, start + 10);
  }, [ayahs, selectedAyahIndex]);

  const playReferenceAudio = () => {
    if (!currentAyah || !selectedSurah) return;
    
    if (recitationMode === 'ayah') {
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${currentAyah.id}.mp3`;
      playQuranAudio(audioUrl, `آية ${currentAyah.numberInSurah}`, `سورة ${selectedSurah.name}`);
    } else {
      const playlist = currentBlock.map(a => ({
        url: `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${a.id}.mp3`,
        title: `آية ${a.numberInSurah}`,
        subtitle: `سورة ${selectedSurah.name}`
      }));
      playQuranAudio(playlist[0].url, playlist[0].title, playlist[0].subtitle, playlist);
    }
  };

  const startRecording = async () => {
    if (!ai) {
      alert("عذراً، يجب إعداد مفتاح API الخاص بـ Gemini أولاً في إعدادات المشروع.");
      return;
    }
    if (!selectedSurah || ayahs.length === 0) {
      alert("يرجى اختيار سورة أولاً");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Revoke old URL if exists
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          analyzeRecitation(base64);
        };
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error("Microphone Access Error:", err);
      alert("يرجى السماح بالوصول إلى الميكروفون لاستخدام هذه الميزة.");
    }
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setIsRecording(false);
  };

  const analyzeRecitation = async (base64: string) => {
    setIsAnalyzing(true);
    const targetText = recitationMode === 'ayah' 
      ? (currentAyah?.text || "") 
      : currentBlock.map(a => a.text).join(" ");
      
    const res = await checkRecitation(base64, targetText);
    setResult(res);
    setIsAnalyzing(false);

    // Auto advance if correct
    if (res.isCorrect && selectedAyahIndex < ayahs.length - 1) {
      setTimeout(() => {
        if (recitationMode === 'ayah') {
          setSelectedAyahIndex(prev => prev + 1);
        } else {
          setSelectedAyahIndex(prev => Math.min(ayahs.length - 1, prev + 10));
        }
        setResult(null);
        setAudioUrl(null);
      }, 5000); 
    }

    // Speak feedback automatically
    if (res.feedback) {
      const utterance = new SpeechSynthesisUtterance(res.feedback);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    }
  };

  const playPromiseRef = useRef<Promise<void> | null>(null);

  const togglePlayback = async () => {
    if (!audioUrl) return;
    
    if (isPlaying) {
      if (playPromiseRef.current) {
        try {
          await playPromiseRef.current;
        } catch (err) {
          // Ignore interruption
        }
      }
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      const audio = new Audio();
      audio.src = audioUrl;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      try {
        playPromiseRef.current = audio.play();
        setIsPlaying(true);
        await playPromiseRef.current;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Playback failed", err);
        }
        setIsPlaying(false);
      } finally {
        playPromiseRef.current = null;
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center space-y-6 py-4">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sacred-gold font-bold mb-2">المصحح الذكي</p>
        <h2 className="text-xl font-display font-bold">تصحيح التلاوة بالذكاء الاصطناعي</h2>
      </div>

      {/* Mode Selection */}
      <div className="flex bg-sacred-gold/5 p-1 rounded-2xl w-full max-w-[200px]">
        <button 
          onClick={() => { setRecitationMode('ayah'); setResult(null); }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            recitationMode === 'ayah' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
          )}
        >
          بالآية
        </button>
        <button 
          onClick={() => { setRecitationMode('page'); setResult(null); }}
          className={cn(
            "flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all",
            recitationMode === 'page' ? "bg-white shadow-sm text-sacred-gold" : "text-sacred-ink/40"
          )}
        >
          بالصفحة (١٠ آيات)
        </button>
      </div>

      {/* Surah Selection */}
      <div className="relative w-full">
        <button 
          onClick={() => setShowSurahList(!showSurahList)}
          className="w-full flex justify-between items-center p-4 bg-white/60 rounded-2xl border border-sacred-gold/10 hover:border-sacred-gold/30 transition-all"
        >
          <span className="font-bold text-sm">
            {selectedSurah ? selectedSurah.name : "اختر السورة المراد تصحيحها"}
          </span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", showSurahList && "rotate-180")} />
        </button>

        <AnimatePresence>
          {showSurahList && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-sacred-gold/10 z-50 p-2 space-y-1"
            >
              {surahs?.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedSurah(s);
                    setShowSurahList(false);
                    setResult(null);
                    setAudioUrl(null);
                  }}
                  className="w-full text-right p-3 hover:bg-sacred-gold/10 rounded-xl transition-all font-quran text-lg"
                >
                  {s.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Target Text */}
      {selectedSurah && ayahs.length > 0 && (
        <div className="flex flex-col items-center w-full space-y-4">
          <div className="flex flex-col w-full px-4 gap-4">
            <div className="flex items-center justify-between w-full">
              <h3 className="font-bold text-sacred-ink flex items-center gap-2 text-sm">
                <Sparkles className="w-5 h-5 text-sacred-gold" />
                {recitationMode === 'ayah' ? `تصحِيح الآية (${currentAyah?.numberInSurah})` : `تحصِيح الصفحة (١٠ آيات)`}
              </h3>
              <div className="flex bg-sacred-gold/5 rounded-xl p-1 gap-1">
                <button 
                  disabled={selectedAyahIndex === 0}
                  onClick={() => { setSelectedAyahIndex(prev => Math.max(0, prev - 10)); setResult(null); }}
                  className="p-1 px-2 hover:bg-white rounded-lg transition-all disabled:opacity-30 text-[10px] font-bold flex items-center gap-1"
                  title="السابق ١٠ آيات"
                >
                  <ChevronRight className="w-3 h-3" />
                  -١٠
                </button>
                <button 
                  disabled={selectedAyahIndex === 0}
                  onClick={() => { setSelectedAyahIndex(prev => Math.max(0, prev - 1)); setResult(null); }}
                  className="p-1 px-2 hover:bg-white rounded-lg transition-all disabled:opacity-30 text-[10px] font-bold"
                  title="الآية السابقة"
                >
                  السابق
                </button>
                <div className="px-2 py-1 flex items-center justify-center min-w-[60px] text-[10px] font-bold text-sacred-gold">
                  {selectedAyahIndex + 1} / {ayahs.length}
                </div>
                <button 
                  disabled={selectedAyahIndex === ayahs.length - 1}
                  onClick={() => { setSelectedAyahIndex(prev => Math.min(ayahs.length - 1, prev + 1)); setResult(null); }}
                  className="p-1 px-2 hover:bg-white rounded-lg transition-all disabled:opacity-30 text-[10px] font-bold"
                  title="الآية التالية"
                >
                  التالي
                </button>
                <button 
                  disabled={selectedAyahIndex >= ayahs.length - 10}
                  onClick={() => { setSelectedAyahIndex(prev => Math.min(ayahs.length - 1, prev + 10)); setResult(null); }}
                  className="p-1 px-2 hover:bg-white rounded-lg transition-all disabled:opacity-30 text-[10px] font-bold flex items-center gap-1"
                  title="التالي ١٠ آيات"
                >
                  +١٠
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {ayahs.slice(Math.floor(selectedAyahIndex / 10) * 10, Math.floor(selectedAyahIndex / 10) * 10 + 10).map((ayah, idx) => {
                const ayahIdx = Math.floor(selectedAyahIndex / 10) * 10 + idx;
                return (
                  <button
                    key={ayah.id}
                    onClick={() => { setSelectedAyahIndex(ayahIdx); setResult(null); }}
                    className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full text-[10px] font-bold transition-all border",
                      selectedAyahIndex === ayahIdx 
                        ? "bg-sacred-gold text-white border-sacred-gold shadow-md" 
                        : "bg-white text-sacred-ink/40 border-sacred-gold/10 hover:border-sacred-gold/30"
                    )}
                  >
                    {ayah.numberInSurah}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-8 w-full text-center min-h-[160px] flex flex-col items-center justify-center border-sacred-gold/20 shadow-lg relative group overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-sacred-gold/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            
            <button 
              onClick={playReferenceAudio}
              className="absolute left-4 top-4 p-3 bg-sacred-gold/10 hover:bg-sacred-gold text-sacred-gold hover:text-white rounded-2xl transition-all shadow-sm flex items-center gap-2 group/btn z-10"
              title="استمع قبل الترديد بصوت الشيخ العفاسي"
            >
              <Volume2 className="w-4 h-4" />
              <span className="text-[10px] font-bold opacity-0 group-hover/btn:opacity-100 transition-opacity">استمع للقارئ</span>
            </button>

            <p className="quran-text text-3xl text-sacred-ink leading-loose z-10">
              {recitationMode === 'ayah' 
                ? currentAyah?.text 
                : currentBlock.map(a => (
                  <span key={a.id} className={cn(a.id === currentAyah.id && "text-sacred-gold")}>
                    {a.text} <span className="text-[14px] text-sacred-gold/40 mx-1">({a.numberInSurah})</span>
                  </span>
                ))}
            </p>
          </div>
        </div>
      )}

      {/* Recording Button */}
      <div className="relative pt-6 flex flex-col items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing || !selectedSurah}
          className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 relative z-10",
            isRecording ? "bg-red-500 text-white shadow-red-200 shadow-2xl" : "bg-sacred-gold text-white shadow-sacred-gold/20 shadow-2xl",
            (isAnalyzing || !selectedSurah) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
        </motion.button>
        <p className="text-[10px] text-sacred-ink/40 font-bold uppercase tracking-widest">
          {isRecording ? "انقر للإيقاف والتحليل" : "انقر لبدء التلاوة"}
        </p>
        
        {isRecording && (
          <motion.div 
            initial={{ scale: 1, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="absolute -top-0 left-0 right-0 bottom-8 rounded-full bg-red-500/20 pointer-events-none -z-0"
          />
        )}
      </div>

      {/* Analysis Result */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 text-sacred-gold"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-xs font-bold font-display">جاري تحليل مخارج الحروف والتجويد...</span>
            </div>
            <p className="text-[9px] text-sacred-ink/40 italic">الذكاء الاصطناعي يستمع بدقة لمطابقة تلاوتك بالمصحف</p>
          </motion.div>
        )}

        {result && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "glass-card rounded-3xl p-6 w-full flex flex-col items-center gap-6 shadow-2xl transition-colors duration-500",
              result.isCorrect ? "bg-sacred-green/5 border-sacred-green/30" : "bg-red-50/50 border-red-200"
            )}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
                result.isCorrect ? "bg-sacred-green text-white" : "bg-red-500 text-white"
              )}>
                {result.isCorrect ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
              </div>
              <h4 className="font-bold text-lg mt-2 font-display">{result.isCorrect ? "قراءة صحيحة" : "تنبيه في التلاوة"}</h4>
            </div>
            
            <div className="text-center space-y-3">
              <p className="text-sm text-sacred-ink font-bold leading-relaxed">{result.feedback}</p>
              {result.isCorrect && selectedAyahIndex < ayahs.length - 1 && (
                <motion.button
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setSelectedAyahIndex(prev => prev + 1); setResult(null); }}
                  className="mt-4 px-8 py-2.5 bg-sacred-green text-white rounded-full text-xs font-bold shadow-lg hover:shadow-sacred-green/20 transition-all flex items-center gap-2 mx-auto"
                >
                  انتقل للآية التالية
                  <CheckCircle2 className="w-4 h-4" />
                </motion.button>
              )}
              {!result.isCorrect && (
                <p className="text-[11px] text-red-600/80 italic font-bold">يرجى إعادة تلاوة الآية مرة أخرى بدقة</p>
              )}
            </div>

            {result.mistakes?.length > 0 && (
              <div className="w-full space-y-2">
                {result.mistakes.map((m: string, i: number) => (
                  <div key={i} className="bg-red-50 text-red-600 text-[10px] p-2 rounded-lg flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    {m}
                  </div>
                ))}
              </div>
            )}

            {audioUrl && (
              <button 
                onClick={togglePlayback}
                className="flex items-center gap-2 text-[10px] text-sacred-gold font-bold hover:underline"
              >
                {isPlaying ? (
                  <>
                    <StopIcon className="w-3 h-3 fill-current" />
                    إيقاف الاستماع
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    استمع لتسجيلك
                  </>
                )}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
