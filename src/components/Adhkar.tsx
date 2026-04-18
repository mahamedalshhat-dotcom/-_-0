import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, CheckCircle2, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { db } from '../lib/db';

const adhkarData = {
  morning: [
    { text: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1 },
    { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ", count: 1 },
    { text: "سُبْحَانَ اللهِ وَبِحَمْدِهِ", count: 100 },
    { text: "أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ", count: 100 },
    { text: "اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ لَذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لاَ يَغْفِرُ الذُّنُوبَ إِلاَّ أَنْتَ", count: 1 },
  ],
  evening: [
    { text: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لاَ إِلَهَ إلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1 },
    { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ", count: 1 },
    { text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", count: 3 },
    { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شأنِي كُلَّهُ وَلاَ تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", count: 1 },
  ],
  after_prayer: [
    { text: "أَسْتَغْفِرُ اللهَ (ثلاثاً)", count: 3 },
    { text: "اللَّهُمَّ أَنْتَ السَّلامُ، ومِنْكَ السَّلامُ، تباركْتَ يَا ذَا الجلالِ والإِكْرامِ", count: 1 },
    { text: "سُبْحَانَ اللهِ", count: 33 },
    { text: "الْحَمْدُ لِلَّهِ", count: 33 },
    { text: "اللهُ أَكْبَرُ", count: 33 },
    { text: "لاَ إِلَهَ إِلاَّ اللَّهُ وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", count: 1 },
  ],
  sleep: [
    { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا، بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ", count: 1 },
    { text: "اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ", count: 3 },
    { text: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", count: 1 },
  ]
};

type AdhkarType = keyof typeof adhkarData;

export default function Adhkar() {
  const [type, setType] = useState<AdhkarType>('morning');
  const [counts, setCounts] = useState<number[]>([]);

  useEffect(() => {
    setCounts([]);
  }, [type]);

  const currentAdhkar = adhkarData[type];

  const handleCount = async (index: number) => {
    const newCounts = [...counts];
    newCounts[index] = (newCounts[index] || 0) + 1;
    
    if (newCounts[index] <= currentAdhkar[index].count) {
      setCounts(newCounts);
      if ("vibrate" in navigator) navigator.vibrate(30);
    }
  };

  const categories = [
    { id: 'morning', name: 'الصباح', icon: Sun },
    { id: 'evening', name: 'المساء', icon: Moon },
    { id: 'after_prayer', name: 'بعد الصلاة', icon: CheckCircle2 },
    { id: 'sleep', name: 'النوم', icon: Moon },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex bg-white/50 rounded-2xl p-1 mb-6 shadow-sm overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => { setType(cat.id as AdhkarType); setCounts([]); }}
            className={cn(
              "flex-shrink-0 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl transition-all font-bold text-[11px] whitespace-nowrap",
              type === cat.id ? "bg-white text-sacred-gold shadow-sm" : "text-sacred-ink/40 hover:text-sacred-ink/60"
            )}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.name}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide pb-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {currentAdhkar.map((dhikr, index) => {
              const currentCount = counts[index] || 0;
              const isDone = currentCount >= dhikr.count;
              
              return (
                <button
                  key={index}
                  disabled={isDone}
                  onClick={() => handleCount(index)}
                  className={cn(
                    "w-full text-right p-6 rounded-[2rem] transition-all relative overflow-hidden group border",
                    isDone 
                      ? "bg-sacred-green/5 border-sacred-green/10 opacity-60" 
                      : "bg-white/60 hover:bg-white shadow-sm border-sacred-gold/5"
                  )}
                >
                  <p className="quran-text text-xl mb-6 leading-relaxed text-sacred-ink">{dhikr.text}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-4 py-1.5 rounded-full flex items-center gap-2 transition-all",
                        isDone ? "bg-sacred-green text-white" : "bg-sacred-gold/10 text-sacred-gold"
                      )}>
                        <span className="text-xs font-black">{currentCount}</span>
                        <span className="w-[1px] h-3 bg-current opacity-20" />
                        <span className="text-[10px] font-bold opacity-60">{dhikr.count}</span>
                      </div>
                      {isDone && <CheckCircle2 className="w-5 h-5 text-sacred-green animate-in zoom-in duration-300" />}
                    </div>
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                      isDone ? "bg-sacred-green text-white" : "bg-sacred-gold/10 text-sacred-gold group-hover:bg-sacred-gold group-hover:text-white"
                    )}>
                      <ChevronLeft className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 h-1.5 bg-sacred-gold/5 w-full">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(currentCount / dhikr.count) * 100}%` }}
                      className={cn(
                        "h-full transition-colors duration-500",
                        isDone ? "bg-sacred-green" : "bg-sacred-gold shadow-[0_0_8px_rgba(196,166,123,0.3)]"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
