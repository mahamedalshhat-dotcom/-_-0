import { useState, useCallback, useEffect } from 'react';
import { motion, useAnimation } from 'motion/react';
import { RefreshCw, Plus, Minus, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

const PHRASES = [
  { id: 'subhanallah', text: 'سبحان الله' },
  { id: 'alhamdulillah', text: 'الحمد لله' },
  { id: 'allahuakbar', text: 'الله أكبر' },
  { id: 'astaghfirullah', text: 'أستغفر الله' },
  { id: 'laillahaillallah', text: 'لا إله إلا الله' },
];

export default function Tasbih() {
  const [count, setCount] = useState(() => {
    return parseInt(localStorage.getItem('noor_tasbih_count') || '0');
  });
  const [target, setTarget] = useState(() => {
    return parseInt(localStorage.getItem('noor_tasbih_target') || '33');
  });
  const [selectedPhrase, setSelectedPhrase] = useState(() => {
    return localStorage.getItem('noor_tasbih_phrase') || PHRASES[0].text;
  });
  const controls = useAnimation();

  useEffect(() => {
    localStorage.setItem('noor_tasbih_count', count.toString());
  }, [count]);

  useEffect(() => {
    localStorage.setItem('noor_tasbih_target', target.toString());
  }, [target]);

  useEffect(() => {
    localStorage.setItem('noor_tasbih_phrase', selectedPhrase);
  }, [selectedPhrase]);

  const increment = useCallback(() => {
    setCount(prev => {
      const next = prev + 1;
      if (next % target === 0) {
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#c5a059', '#2d5a27', '#ffffff']
        });
      } else {
        if ("vibrate" in navigator) navigator.vibrate(50);
      }
      return next;
    });
    controls.start({
      scale: [1, 1.1, 1],
      transition: { duration: 0.1 }
    });
  }, [target, controls]);

  const reset = () => {
    setCount(0);
    if ("vibrate" in navigator) navigator.vibrate(100);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sacred-gold font-bold mb-2">المسبحة الرقمية</p>
        <h2 className="text-2xl font-display font-bold text-sacred-green min-h-[1.5em]">{selectedPhrase}</h2>
      </div>

      {/* Phrase Selection */}
      <div className="w-full max-w-xs overflow-x-auto no-scrollbar flex gap-2 py-2">
        {PHRASES.map(p => (
          <button
            key={p.id}
            onClick={() => {
              setSelectedPhrase(p.text);
              setCount(0); // Optional: reset count when switching phrase
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              selectedPhrase === p.text 
                ? 'bg-sacred-gold/10 border-sacred-gold text-sacred-gold shadow-sm' 
                : 'bg-white/40 border-transparent text-sacred-ink/40 hover:bg-white'
            }`}
          >
            {p.text}
          </button>
        ))}
      </div>

      {/* Counter Display */}
      <div className="relative group">
        <motion.div 
          animate={controls}
          onClick={increment}
          className="w-72 h-72 rounded-full bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] border-[12px] border-sacred-gold/5 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform relative z-10 overflow-hidden group"
        >
          {/* Ripple Effect Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sacred-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col items-center">
            <span className="text-8xl font-display font-black text-sacred-ink tracking-tighter">{count}</span>
            <div className="mt-4 flex items-center gap-2 bg-sacred-gold/10 px-4 py-1 rounded-full border border-sacred-gold/10">
              <span className="text-[11px] font-black text-sacred-gold uppercase tracking-widest">الهدف: {target}</span>
            </div>
          </div>

          {/* Progress Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="144"
              cy="144"
              r="138"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-sacred-gold/5"
            />
            <motion.circle
              cx="144"
              cy="144"
              r="138"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="867"
              initial={{ strokeDashoffset: 867 }}
              animate={{ strokeDashoffset: 867 - (867 * (count % target)) / target }}
              className="text-sacred-gold shadow-[0_0_10px_rgba(196,166,123,0.5)]"
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </svg>
        </motion.div>
        
        {/* Decorative Rings */}
        <div className="absolute inset-0 rounded-full border-2 border-sacred-gold/20 animate-ping scale-110 opacity-10 pointer-events-none" />
        <div className="absolute inset-0 rounded-full border border-sacred-gold/10 animate-pulse scale-125 opacity-5 pointer-events-none" />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 bg-white/40 backdrop-blur-xl p-3 rounded-[2.5rem] border border-sacred-gold/10 shadow-sm">
        <button 
          onClick={reset}
          className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-sacred-ink/40 hover:text-red-500 transition-all shadow-sm border border-sacred-gold/5 group"
          title="إعادة ضبط"
        >
          <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
        </button>
        
        <div className="flex bg-sacred-gold/5 rounded-full p-1 border border-sacred-gold/10">
          {[33, 99, 100, 1000].map(t => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={cn(
                "px-5 py-2.5 rounded-full text-[11px] font-black transition-all duration-300",
                target === t 
                  ? "bg-white text-sacred-gold shadow-md scale-105" 
                  : "text-sacred-ink/40 hover:text-sacred-ink"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <button className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-sacred-ink/40 hover:text-sacred-gold transition-all shadow-sm border border-sacred-gold/5">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <p className="text-[10px] text-sacred-ink/30 italic">انقر على الدائرة للتسبيح</p>
    </div>
  );
}
